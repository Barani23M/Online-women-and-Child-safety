from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from database import UserRole, IncidentStatus, IncidentType


# ─── Auth ────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str]
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserOut


# ─── Trusted Contacts ────────────────────────────────────────────────────

class TrustedContactCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    relation: Optional[str] = None


class TrustedContactOut(TrustedContactCreate):
    id: int
    class Config:
        from_attributes = True


# ─── SOS ─────────────────────────────────────────────────────────────────

class SOSCreate(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    message: Optional[str] = "EMERGENCY! I need help immediately."


class SOSOut(BaseModel):
    id: int
    user_id: int
    latitude: Optional[float]
    longitude: Optional[float]
    address: Optional[str]
    message: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Incidents ───────────────────────────────────────────────────────────

class IncidentCreate(BaseModel):
    incident_type: IncidentType
    title: str
    description: str
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_anonymous: bool = False


class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    admin_notes: Optional[str] = None


class IncidentOut(BaseModel):
    id: int
    incident_type: IncidentType
    title: str
    description: str
    location: Optional[str]
    status: IncidentStatus
    is_anonymous: bool
    created_at: datetime
    updated_at: datetime
    reporter_id: Optional[int]

    class Config:
        from_attributes = True


# ─── Helplines ───────────────────────────────────────────────────────────

class HelplineOut(BaseModel):
    id: int
    name: str
    number: str
    category: str
    description: Optional[str]
    available_24x7: bool
    website: Optional[str]

    class Config:
        from_attributes = True


# ─── Legal Resources ─────────────────────────────────────────────────────

class LegalResourceOut(BaseModel):
    id: int
    title: str
    category: str
    law_name: Optional[str]
    summary: str
    full_text: Optional[str]
    reference_url: Optional[str]

    class Config:
        from_attributes = True


# ─── Counseling Resources ─────────────────────────────────────────────────

class CounselingResourceOut(BaseModel):
    id: int
    title: str
    category: str
    description: str
    contact: Optional[str]
    website: Optional[str]
    location: Optional[str]
    is_online: bool

    class Config:
        from_attributes = True


# ─── Safe Places ─────────────────────────────────────────────────────────

class SafePlaceOut(BaseModel):
    id: int
    name: str
    place_type: str
    address: str
    latitude: float
    longitude: float
    phone: Optional[str]
    is_verified: bool

    class Config:
        from_attributes = True


# ─── Dashboard Stats ─────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_users: int
    total_incidents: int
    active_sos: int
    pending_incidents: int
    resolved_incidents: int
    incidents_by_type: dict
