from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, LegalResource, CounselingResource
from schemas import LegalResourceOut, CounselingResourceOut
from typing import List, Optional

resources_router = APIRouter(prefix="/api/resources", tags=["Resources"])
counseling_router = APIRouter(prefix="/api/counseling", tags=["Counseling"])


@resources_router.get("/legal", response_model=List[LegalResourceOut])
def get_legal_resources(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(LegalResource)
    if category:
        query = query.filter(LegalResource.category == category)
    return query.all()


@resources_router.get("/legal/{resource_id}", response_model=LegalResourceOut)
def get_legal_resource(resource_id: int, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    res = db.query(LegalResource).filter(LegalResource.id == resource_id).first()
    if not res:
        raise HTTPException(status_code=404, detail="Resource not found")
    return res


@counseling_router.get("/", response_model=List[CounselingResourceOut])
def get_counseling(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(CounselingResource)
    if category:
        query = query.filter(CounselingResource.category == category)
    return query.all()
