from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import get_db, User, Incident, SOSAlert, IncidentType, ActivityLog, Notification, UserRole as UREnum
from schemas import DashboardStats, UserOut, SOSOut, IncidentOut
from auth import require_admin
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def log_action(db: Session, admin_id: int, action: str, target_type: str = None, target_id: int = None, details: str = None):
    log = ActivityLog(admin_id=admin_id, action=action, target_type=target_type, target_id=target_id, details=details)
    db.add(log)


# ─── Dashboard Stats ─────────────────────────────────────────────────────

@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), admin=Depends(require_admin)):
    total_users = db.query(User).count()
    total_incidents = db.query(Incident).count()
    active_sos = db.query(SOSAlert).filter(SOSAlert.is_active == True).count()
    pending = db.query(Incident).filter(Incident.status == "pending").count()
    resolved = db.query(Incident).filter(Incident.status == "resolved").count()
    type_counts = {}
    for inc_type in IncidentType:
        count = db.query(Incident).filter(Incident.incident_type == inc_type).count()
        type_counts[inc_type.value] = count
    return DashboardStats(
        total_users=total_users,
        total_incidents=total_incidents,
        active_sos=active_sos,
        pending_incidents=pending,
        resolved_incidents=resolved,
        incidents_by_type=type_counts,
    )


# ─── User Management ─────────────────────────────────────────────────────

@router.get("/users", response_model=List[UserOut])
def get_all_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    query = db.query(User)
    if search:
        query = query.filter(
            User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%")
        )
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
    return query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/users/{user_id}", response_model=UserOut)
def get_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.patch("/users/{user_id}/toggle-active")
def toggle_user(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    log_action(db, admin.id, "toggle_user", "user", user_id, f"Set is_active={user.is_active}")
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}


@router.patch("/users/{user_id}/role")
def update_role(user_id: int, role: str, db: Session = Depends(get_db), admin=Depends(require_admin)):
    if role not in [r.value for r in UREnum]:
        raise HTTPException(status_code=400, detail="Invalid role. Valid: user, admin, counselor")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    old_role = user.role
    user.role = role
    log_action(db, admin.id, "update_role", "user", user_id, f"Changed role {old_role} -> {role}")
    db.commit()
    return {"message": "Role updated", "role": role}


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == UREnum.admin:
        raise HTTPException(status_code=400, detail="Cannot delete admin account")
    log_action(db, admin.id, "delete_user", "user", user_id, f"Deleted user {user.email}")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}


# ─── SOS Alerts ──────────────────────────────────────────────────────────

@router.get("/sos-alerts", response_model=List[SOSOut])
def get_all_sos(
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    query = db.query(SOSAlert)
    if is_active is not None:
        query = query.filter(SOSAlert.is_active == is_active)
    return query.order_by(SOSAlert.created_at.desc()).offset(skip).limit(limit).all()


@router.patch("/sos-alerts/{alert_id}/resolve")
def admin_resolve_sos(alert_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    alert = db.query(SOSAlert).filter(SOSAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_active = False
    alert.resolved_at = datetime.utcnow()
    # Notify user
    notif = Notification(
        user_id=alert.user_id,
        title="SOS Alert Resolved",
        message="Your SOS alert has been marked as resolved by our team. Hope you are safe.",
        notification_type="resolved",
        related_sos_id=alert.id,
    )
    db.add(notif)
    log_action(db, admin.id, "resolve_sos", "sos", alert_id)
    db.commit()
    return {"message": "SOS resolved by admin", "alert_id": alert_id}


@router.delete("/sos-alerts/{alert_id}")
def delete_sos(alert_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    alert = db.query(SOSAlert).filter(SOSAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    log_action(db, admin.id, "delete_sos", "sos", alert_id)
    db.delete(alert)
    db.commit()
    return {"message": "SOS alert deleted"}


# ─── Incidents ───────────────────────────────────────────────────────────

@router.get("/incidents", response_model=List[IncidentOut])
def admin_get_incidents(
    status: Optional[str] = None,
    incident_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type)
    return query.order_by(Incident.created_at.desc()).offset(skip).limit(limit).all()


# ─── Activity Logs ───────────────────────────────────────────────────────

@router.get("/activity-logs")
def get_activity_logs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    _=Depends(require_admin)
):
    logs = db.query(ActivityLog).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()
    return [{"id": l.id, "admin_id": l.admin_id, "action": l.action,
             "target_type": l.target_type, "target_id": l.target_id,
             "details": l.details, "created_at": l.created_at.isoformat()} for l in logs]


# ─── Notifications (Send to User) ────────────────────────────────────────

@router.post("/notifications/send")
def send_notification(
    user_id: int,
    title: str,
    message: str,
    notification_type: str = "info",
    db: Session = Depends(get_db),
    admin=Depends(require_admin)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=notification_type,
    )
    db.add(notif)
    log_action(db, admin.id, "send_notification", "user", user_id, f"Sent: {title}")
    db.commit()
    return {"message": "Notification sent"}



# ─── Counselor Management (Admin Only) ───────────────────────────────────

@router.post("/counselors")
def create_counselor(
    full_name: str,
    email: str,
    password: str,
    phone: str = None,
    db: Session = Depends(get_db),
    admin=Depends(require_admin),
):
    from auth import hash_password
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    counselor = User(
        full_name=full_name,
        email=email,
        phone=phone or None,
        hashed_password=hash_password(password),
        role=UREnum.counselor,
        is_active=True,
    )
    db.add(counselor)
    log_action(db, admin.id, "create_counselor", "user", None, "Created counselor: " + email)
    db.commit()
    db.refresh(counselor)
    return {"id": counselor.id, "full_name": counselor.full_name, "email": counselor.email, "phone": counselor.phone, "role": str(counselor.role), "is_active": counselor.is_active, "created_at": str(counselor.created_at)}


@router.get("/counselors")
def list_counselors_admin(db: Session = Depends(get_db), _=Depends(require_admin)):
    from database import CounselingSession, SessionStatus
    counselors = db.query(User).filter(User.role == UREnum.counselor).order_by(User.created_at.desc()).all()
    result = []
    for c in counselors:
        total  = db.query(CounselingSession).filter(CounselingSession.counselor_id == c.id).count()
        active = db.query(CounselingSession).filter(CounselingSession.counselor_id == c.id, CounselingSession.status == SessionStatus.active).count()
        result.append({"id": c.id, "full_name": c.full_name, "email": c.email, "phone": c.phone, "is_active": c.is_active, "total_sessions": total, "active_now": active > 0, "created_at": str(c.created_at)})
    return result


@router.delete("/counselors/{counselor_id}")
def delete_counselor(counselor_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    counselor = db.query(User).filter(User.id == counselor_id, User.role == UREnum.counselor).first()
    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor not found")
    log_action(db, admin.id, "delete_counselor", "user", counselor_id, "Removed: " + counselor.email)
    db.delete(counselor)
    db.commit()
    return {"message": "Counselor removed"}


@router.patch("/counselors/{counselor_id}/toggle-active")
def toggle_counselor_active(counselor_id: int, db: Session = Depends(get_db), admin=Depends(require_admin)):
    counselor = db.query(User).filter(User.id == counselor_id, User.role == UREnum.counselor).first()
    if not counselor:
        raise HTTPException(status_code=404, detail="Counselor not found")
    counselor.is_active = not counselor.is_active
    status_str = "activated" if counselor.is_active else "deactivated"
    log_action(db, admin.id, "toggle_counselor", "user", counselor_id, "is_active=" + str(counselor.is_active))
    db.commit()
    return {"message": "Counselor " + status_str, "is_active": counselor.is_active}
