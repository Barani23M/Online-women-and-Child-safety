from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db, User, Incident, SOSAlert, IncidentType
from schemas import DashboardStats, UserOut, SOSOut
from auth import require_admin
from typing import List

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
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


@router.get("/users", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(User).all()


@router.patch("/users/{user_id}/toggle-active")
def toggle_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    from fastapi import HTTPException
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}


@router.patch("/users/{user_id}/role")
def update_role(user_id: int, role: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    from fastapi import HTTPException
    from database import UserRole
    if role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    return {"message": "Role updated", "role": role}


@router.get("/sos-alerts", response_model=List[SOSOut])
def get_all_sos(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(SOSAlert).order_by(SOSAlert.created_at.desc()).limit(50).all()


@router.patch("/sos-alerts/{alert_id}/resolve")
def admin_resolve_sos(alert_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    from fastapi import HTTPException
    from datetime import datetime
    alert = db.query(SOSAlert).filter(SOSAlert.id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_active = False
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return {"message": "SOS resolved by admin", "alert_id": alert_id}


router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), _=Depends(require_admin)):
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


@router.get("/users", response_model=List[UserOut])
def get_all_users(db: Session = Depends(get_db), _=Depends(require_admin)):
    return db.query(User).all()


@router.patch("/users/{user_id}/toggle-active")
def toggle_user(user_id: int, db: Session = Depends(get_db), _=Depends(require_admin)):
    from fastapi import HTTPException
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}


@router.patch("/users/{user_id}/role")
def update_role(user_id: int, role: str, db: Session = Depends(get_db), _=Depends(require_admin)):
    from fastapi import HTTPException
    from database import UserRole
    if role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail="Invalid role")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    return {"message": "Role updated", "role": role}
