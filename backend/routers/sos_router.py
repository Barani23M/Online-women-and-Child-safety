from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, SOSAlert, User, UserRole, FamilyLink, FamilyLinkStatus
from schemas import SOSCreate, SOSOut
from auth import get_current_user
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/sos", tags=["SOS"])

# Roles that are NOT allowed to trigger SOS (they monitor or manage)
_OBSERVER_ROLES = {UserRole.admin, UserRole.parent, UserRole.counselor}


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
    
    # Check if user has linked parents (informational only, still allow SOS)
    parent_count = _get_linked_parent_count(current_user.id, db)
    
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
    
    # In production: send SMS/email to trusted contacts here
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
    return db.query(SOSAlert).filter(SOSAlert.is_active == True).all()
