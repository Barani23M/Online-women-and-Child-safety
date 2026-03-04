from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Helpline
from schemas import HelplineOut
from typing import List, Optional

router = APIRouter(prefix="/api/helplines", tags=["Helplines"])


@router.get("/", response_model=List[HelplineOut])
def get_helplines(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Helpline).filter(Helpline.is_active == True)
    if category:
        query = query.filter(Helpline.category == category)
    return query.all()
