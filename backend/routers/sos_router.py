from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, SOSAlert, User
from schemas import SOSCreate, SOSOut
from auth import get_current_user
from datetime import datetime
from typing import List

router = APIRouter(prefix="/api/sos", tags=["SOS"])


@router.post("/trigger", response_model=SOSOut)
def trigger_sos(data: SOSCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = SOSAlert(
        user_id=current_user.id,
        latitude=data.latitude,
        longitude=data.longitude,
        address=data.address,
        message=data.message,
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


@router.get("/my-alerts", response_model=List[SOSOut])
def my_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(SOSAlert).filter(SOSAlert.user_id == current_user.id)\
             .order_by(SOSAlert.created_at.desc()).all()


@router.get("/active", response_model=List[SOSOut])
def active_alerts(db: Session = Depends(get_db)):
    """Public endpoint for emergency services or admin"""
    return db.query(SOSAlert).filter(SOSAlert.is_active == True).all()
