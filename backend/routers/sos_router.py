from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, SOSAlert, User, UserRole, FamilyLink, FamilyLinkStatus, FamilyAlert, Notification
from schemas import SOSCreate, SOSOut
from auth import get_current_user
from datetime import datetime, timedelta
from typing import List, Optional

router = APIRouter(prefix="/api/sos", tags=["SOS"])

# Roles that are NOT allowed to trigger SOS (they monitor or manage)
_OBSERVER_ROLES = {UserRole.admin, UserRole.parent, UserRole.counselor}
_SOS_ACTIVE_WINDOW_MINUTES = 30


def _expire_stale_active_sos(db: Session) -> int:
    """Mark long-running active SOS alerts as resolved to avoid stale dashboard state."""
    cutoff = datetime.utcnow() - timedelta(minutes=_SOS_ACTIVE_WINDOW_MINUTES)
    stale_alerts = db.query(SOSAlert).filter(
        SOSAlert.is_active == True,
        SOSAlert.created_at < cutoff,
    ).all()
    for alert in stale_alerts:
        alert.is_active = False
        if not alert.resolved_at:
            alert.resolved_at = datetime.utcnow()
    return len(stale_alerts)


def _get_linked_parent_count(user_id: int, db: Session) -> int:
    """Check how many accepted parents are linked to this user."""
    count = db.query(FamilyLink).filter(
        FamilyLink.child_user_id == user_id,
        FamilyLink.status == FamilyLinkStatus.accepted
    ).count()
    return count


@router.post("/trigger", response_model=SOSOut)
def trigger_sos(data: SOSCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role in _OBSERVER_ROLES:
        raise HTTPException(
            status_code=403,
            detail=f"{current_user.role.value.title()} accounts cannot trigger SOS. Only child/women/user accounts can send emergency alerts."
        )
    
    # Require at least one linked parent for personal SOS flow.
    parent_count = _get_linked_parent_count(current_user.id, db)
    if parent_count == 0:
        raise HTTPException(
            status_code=400,
            detail="No linked guardians found. Please link a parent/guardian first.",
        )

    if data.latitude is None or data.longitude is None:
        raise HTTPException(
            status_code=400,
            detail="Live location is required for SOS. Enable GPS and try again.",
        )

    if not data.selfie_data:
        raise HTTPException(
            status_code=400,
            detail="Camera selfie is required for SOS verification.",
        )

    # Keep only one active SOS per user by resolving any previous open alerts.
    existing_active_alerts = db.query(SOSAlert).filter(
        SOSAlert.user_id == current_user.id,
        SOSAlert.is_active == True,
    ).all()
    for old_alert in existing_active_alerts:
        old_alert.is_active = False
        if not old_alert.resolved_at:
            old_alert.resolved_at = datetime.utcnow()
    
    alert = SOSAlert(
        user_id=current_user.id,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
        message=data.message,
        selfie_data=data.selfie_data,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    # Automatically fan out to all accepted linked parents.
    accepted_links = db.query(FamilyLink).filter(
        FamilyLink.child_user_id == current_user.id,
        FamilyLink.status == FamilyLinkStatus.accepted,
    ).all()

    for link in accepted_links:
        fam_alert = FamilyAlert(
            child_user_id=current_user.id,
            parent_user_id=link.parent_user_id,
            sos_alert_id=alert.id,
            latitude=data.latitude,
            longitude=data.longitude,
            address=data.address,
            selfie_data=data.selfie_data,
            message=data.message or f"EMERGENCY! {current_user.full_name} needs immediate help!",
        )
        db.add(fam_alert)

        db.add(
            Notification(
                user_id=link.parent_user_id,
                title=f"SOS from {current_user.full_name}",
                message=f"{current_user.full_name} triggered SOS with live location and selfie.",
                notification_type="sos_alert",
                related_sos_id=alert.id,
            )
        )

    db.commit()
    
    return alert


@router.post("/resolve/{alert_id}")
def resolve_sos(alert_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(SOSAlert).filter(
        SOSAlert.id == alert_id,
        SOSAlert.user_id == current_user.id
    ).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_active = False
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return {"message": "SOS resolved", "alert_id": alert_id}


@router.post("/resolve-active")
def resolve_active_sos(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Resolve the caller's most-recent active SOS alert (fallback when alert_id is unknown)."""
    alert = db.query(SOSAlert).filter(
        SOSAlert.user_id == current_user.id,
        SOSAlert.is_active == True
    ).order_by(SOSAlert.created_at.desc()).first()
    if not alert:
        raise HTTPException(status_code=404, detail="No active SOS alert found")
    alert.is_active = False
    alert.resolved_at = datetime.utcnow()
    db.commit()
    return {"message": "SOS resolved", "alert_id": alert.id}


@router.get("/check-parents", summary="Check if user has linked parents for notifications")
def check_parents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns parent count and details. Used by frontend to warn if no parents linked."""
    parents = db.query(FamilyLink).filter(
        FamilyLink.child_user_id == current_user.id,
        FamilyLink.status == FamilyLinkStatus.accepted
    ).all()
    
    parent_list = [
        {
            "parent_id": link.parent_user_id,
            "parent_name": link.parent.full_name,
            "parent_email": link.parent.email,
            "parent_phone": link.parent.phone,
        }
        for link in parents
    ]
    
    return {
        "has_parents": len(parents) > 0,
        "parent_count": len(parents),
        "parents": parent_list,
        "warning": "No linked guardians found. Alerts will NOT be sent to parents." if len(parents) == 0 else None,
    }


@router.get("/my-alerts", response_model=List[SOSOut])
def my_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SOSAlert).filter(SOSAlert.user_id == current_user.id)\
             .order_by(SOSAlert.created_at.desc()).all()


@router.get("/active", response_model=List[SOSOut])
def active_alerts(db: Session = Depends(get_db)):
    """Public endpoint for emergency services or admin"""
    if _expire_stale_active_sos(db) > 0:
        db.commit()
    return db.query(SOSAlert).filter(SOSAlert.is_active == True).all()
