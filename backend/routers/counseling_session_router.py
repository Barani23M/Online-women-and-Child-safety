"""
Counseling Session Router
--------------------------
REST endpoints to create / manage counseling sessions, plus a WebSocket-based
WebRTC signalling channel so browser peers can exchange SDP offers/answers and
ICE candidates without a media server.

Flow:
 1. User calls  POST /api/sessions/       → gets back a room_id
 2. User opens  WS   /api/sessions/ws/{room_id}?token=<jwt>
 3. Counselor calls  GET /api/sessions/waiting → sees available sessions
 4. Counselor opens  WS  /api/sessions/ws/{room_id}?token=<jwt>
 5. Both peers exchange { type, data } JSON frames over the WebSocket:
      { "type": "offer",       "data": <SDP> }
      { "type": "answer",      "data": <SDP> }
      { "type": "ice",         "data": <ICE candidate JSON> }
      { "type": "end_call",    "data": null  }
      { "type": "peer_joined", "data": null  }   ← server-sent
      { "type": "peer_left",   "data": null  }   ← server-sent
"""
import uuid
from datetime import datetime
from typing import Dict, List

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query
from sqlalchemy.orm import Session

from database import get_db, User, UserRole, CounselingSession, SessionStatus
from auth import get_current_user, create_access_token
from jose import JWTError, jwt

SECRET_KEY = "safeguard_secret_key_change_in_production_2024"
ALGORITHM  = "HS256"

router = APIRouter(prefix="/api/sessions", tags=["Counseling Sessions"])


# ─── In-memory WebSocket room registry ───────────────────────────────────────
# rooms: { room_id -> { user_id: WebSocket } }
rooms: Dict[str, Dict[int, WebSocket]] = {}


def _get_user_from_token(token: str, db: Session) -> User:
    """Validate JWT and return User (used in WS handshake, no Depends)."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise ValueError()
    except (JWTError, ValueError):
        return None
    return db.query(User).filter(User.email == email, User.is_active == True).first()


# ─── REST endpoints ──────────────────────────────────────────────────────────

@router.get("/counselors", summary="List all counselor-role users with their session stats")
def list_counselors(db: Session = Depends(get_db)):
    """Public endpoint — returns all active counselor accounts with stats."""
    counselors = db.query(User).filter(
        User.role == UserRole.counselor,
        User.is_active == True,
    ).all()
    result = []
    for c in counselors:
        total = db.query(CounselingSession).filter(CounselingSession.counselor_id == c.id).count()
        active = db.query(CounselingSession).filter(
            CounselingSession.counselor_id == c.id,
            CounselingSession.status == SessionStatus.active,
        ).count()
        result.append({
            "id":            c.id,
            "full_name":     c.full_name,
            "email":         c.email,
            "phone":         c.phone,
            "total_sessions": total,
            "active_now":    active > 0,
            "joined_at":     str(c.created_at),
        })
    return result


@router.get("/counselor/dashboard", summary="Counselor's own dashboard stats")
def counselor_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.counselor:
        raise HTTPException(status_code=403, detail="Counselor accounts only")
    total   = db.query(CounselingSession).filter(CounselingSession.counselor_id == current_user.id).count()
    active  = db.query(CounselingSession).filter(
        CounselingSession.counselor_id == current_user.id,
        CounselingSession.status == SessionStatus.active,
    ).count()
    ended   = db.query(CounselingSession).filter(
        CounselingSession.counselor_id == current_user.id,
        CounselingSession.status == SessionStatus.ended,
    ).count()
    waiting = db.query(CounselingSession).filter(
        CounselingSession.status == SessionStatus.waiting,
    ).count()
    recent = db.query(CounselingSession).filter(
        CounselingSession.counselor_id == current_user.id,
    ).order_by(CounselingSession.created_at.desc()).limit(10).all()
    recent_out = []
    for s in recent:
        u = db.query(User).filter(User.id == s.user_id).first()
        duration = None
        if s.started_at and s.ended_at:
            duration = int((s.ended_at - s.started_at).total_seconds() // 60)
        recent_out.append({
            "room_id":    s.room_id,
            "call_type":  s.call_type,
            "status":     s.status,
            "user_name":  u.full_name if u else "Anonymous",
            "user_email": u.email if u else None,
            "started_at": str(s.started_at) if s.started_at else None,
            "ended_at":   str(s.ended_at) if s.ended_at else None,
            "duration_mins": duration,
            "created_at": str(s.created_at),
        })
    return {
        "total_sessions":   total,
        "active_sessions":  active,
        "completed_sessions": ended,
        "waiting_queue":    waiting,
        "recent_sessions":  recent_out,
    }


@router.get("/counselor/sessions", summary="Counselor's full session history")
def counselor_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != UserRole.counselor:
        raise HTTPException(status_code=403, detail="Counselor accounts only")
    sessions = db.query(CounselingSession).filter(
        CounselingSession.counselor_id == current_user.id,
    ).order_by(CounselingSession.created_at.desc()).all()
    result = []
    for s in sessions:
        u = db.query(User).filter(User.id == s.user_id).first()
        duration = None
        if s.started_at and s.ended_at:
            duration = int((s.ended_at - s.started_at).total_seconds() // 60)
        result.append({
            "room_id":    s.room_id,
            "call_type":  s.call_type,
            "status":     s.status,
            "user_name":  u.full_name if u else "Anonymous",
            "started_at": str(s.started_at) if s.started_at else None,
            "ended_at":   str(s.ended_at) if s.ended_at else None,
            "duration_mins": duration,
            "created_at": str(s.created_at),
        })
    return result


@router.post("/", summary="Create a new counseling session room")
def create_session(
    call_type: str = "video",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    room_id = str(uuid.uuid4())
    session = CounselingSession(
        room_id=room_id,
        user_id=current_user.id,
        call_type=call_type if call_type in ("audio", "video") else "video",
        status=SessionStatus.waiting,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return {
        "room_id":   room_id,
        "call_type": session.call_type,
        "status":    session.status,
        "created_at": str(session.created_at),
    }


@router.get("/waiting", summary="List sessions waiting for a counselor")
def waiting_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in (UserRole.counselor, UserRole.admin):
        raise HTTPException(status_code=403, detail="Counselor or admin access required")

    sessions = (
        db.query(CounselingSession)
        .filter(CounselingSession.status == SessionStatus.waiting)
        .order_by(CounselingSession.created_at)
        .all()
    )
    result = []
    for s in sessions:
        user = db.query(User).filter(User.id == s.user_id).first()
        result.append({
            "room_id":    s.room_id,
            "call_type":  s.call_type,
            "user_name":  user.full_name if user else "Anonymous",
            "created_at": str(s.created_at),
        })
    return result


@router.get("/my", summary="Current user's counseling session history")
def my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(CounselingSession)
        .filter(CounselingSession.user_id == current_user.id)
        .order_by(CounselingSession.created_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "room_id":    s.room_id,
            "call_type":  s.call_type,
            "status":     s.status,
            "started_at": str(s.started_at) if s.started_at else None,
            "ended_at":   str(s.ended_at)   if s.ended_at   else None,
            "created_at": str(s.created_at),
        }
        for s in sessions
    ]


@router.post("/{room_id}/end", summary="Mark a session as ended")
def end_session(
    room_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(CounselingSession).filter(
        CounselingSession.room_id == room_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    is_owner = session.user_id == current_user.id
    is_assigned_counselor = session.counselor_id == current_user.id if session.counselor_id else False
    is_admin = current_user.role == UserRole.admin
    if not (is_owner or is_assigned_counselor or is_admin):
        raise HTTPException(status_code=403, detail="Not allowed to end this session")

    session.status   = SessionStatus.ended
    session.ended_at = datetime.utcnow()
    db.commit()
    return {"message": "Session ended"}


# ─── WebSocket signalling ─────────────────────────────────────────────────────

@router.websocket("/ws/{room_id}")
async def signalling_ws(
    room_id: str,
    websocket: WebSocket,
    token: str = Query(...),
):
    # Authenticate via JWT passed as query param (WS can't send Auth headers)
    from database import SessionLocal
    db = SessionLocal()
    user = _get_user_from_token(token, db)
    if not user:
        await websocket.close(code=4001)
        db.close()
        return

    session = db.query(CounselingSession).filter(
        CounselingSession.room_id == room_id
    ).first()
    if not session:
        await websocket.close(code=4004)
        db.close()
        return

    # Only session owner, counselors, or admins can join the signaling room.
    if user.id != session.user_id and user.role not in (UserRole.counselor, UserRole.admin):
        await websocket.close(code=4003)
        db.close()
        return

    await websocket.accept()

    # Register in room
    if room_id not in rooms:
        rooms[room_id] = {}
    rooms[room_id][user.id] = websocket

    # If a counselor is joining an active room, update DB
    if user.role in (UserRole.counselor, UserRole.admin) and session.user_id != user.id and not session.counselor_id:
        session.counselor_id = user.id
        session.status       = SessionStatus.active
        session.started_at   = datetime.utcnow()
        db.commit()

    # Notify the other peer that someone joined
    await _broadcast(room_id, user.id, {"type": "peer_joined", "data": {"name": user.full_name}})

    try:
        while True:
            raw = await websocket.receive_json()
            msg_type = raw.get("type", "")

            if msg_type in ("offer", "answer", "ice"):
                # Forward to the other peer(s) in the room
                await _broadcast(room_id, user.id, raw)

            elif msg_type == "end_call":
                await _broadcast(room_id, user.id, {"type": "peer_left", "data": None})
                # Mark session ended
                session.status   = SessionStatus.ended
                session.ended_at = datetime.utcnow()
                db.commit()
                break

    except WebSocketDisconnect:
        pass
    finally:
        rooms.get(room_id, {}).pop(user.id, None)
        if not rooms.get(room_id):
            rooms.pop(room_id, None)
        db.close()
        # Notify remaining peer
        await _broadcast(room_id, user.id, {"type": "peer_left", "data": None})


async def _broadcast(room_id: str, sender_id: int, message: dict):
    """Send message to all peers in room except the sender."""
    for uid, ws in list(rooms.get(room_id, {}).items()):
        if uid != sender_id:
            try:
                await ws.send_json(message)
            except Exception:
                pass
