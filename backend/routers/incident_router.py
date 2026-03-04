from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from database import get_db, Incident, User, IncidentStatus
from schemas import IncidentCreate, IncidentOut, IncidentUpdate
from auth import get_current_user, require_admin
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.post("/report", response_model=IncidentOut)
def report_incident(data: IncidentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    incident = Incident(
        reporter_id=current_user.id,
        **data.model_dump()
    )
    if data.is_anonymous:
        incident.reporter_id = None
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("/my", response_model=List[IncidentOut])
def my_incidents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Incident).filter(Incident.reporter_id == current_user.id)\
             .order_by(Incident.created_at.desc()).all()


@router.get("/", response_model=List[IncidentOut])
def get_all_incidents(
    status: Optional[str] = None,
    incident_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status)
    if incident_type:
        query = query.filter(Incident.incident_type == incident_type)
    return query.order_by(Incident.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if current_user.role.value != "admin" and incident.reporter_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return incident


@router.patch("/{incident_id}", response_model=IncidentOut)
def update_incident(incident_id: int, update: IncidentUpdate, current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if update.status:
        incident.status = update.status
    if update.admin_notes:
        incident.admin_notes = update.admin_notes
    incident.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(incident)
    return incident
