from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, SafePlace
from schemas import SafePlaceOut
from typing import List, Optional

router = APIRouter(prefix="/api/safe-places", tags=["Safe Places"])


@router.get("/", response_model=List[SafePlaceOut])
def get_safe_places(place_type: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SafePlace)
    if place_type:
        query = query.filter(SafePlace.place_type == place_type)
    return query.all()
