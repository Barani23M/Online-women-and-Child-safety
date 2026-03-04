from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import enum

SQLALCHEMY_DATABASE_URL = "sqlite:///./safeguard.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class UserRole(str, enum.Enum):
    user = "user"
    admin = "admin"
    counselor = "counselor"


class IncidentStatus(str, enum.Enum):
    pending = "pending"
    under_review = "under_review"
    resolved = "resolved"
    closed = "closed"


class IncidentType(str, enum.Enum):
    harassment = "harassment"
    domestic_violence = "domestic_violence"
    child_abuse = "child_abuse"
    cybercrime = "cybercrime"
    stalking = "stalking"
    assault = "assault"
    trafficking = "trafficking"
    other = "other"


# ─── Models ──────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    # trusted contacts (up to 3)
    trusted_contacts = relationship("TrustedContact", back_populates="user", cascade="all, delete")
    incidents = relationship("Incident", back_populates="reporter", cascade="all, delete")
    sos_alerts = relationship("SOSAlert", back_populates="user", cascade="all, delete")


class TrustedContact(Base):
    __tablename__ = "trusted_contacts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    relation = Column(String, nullable=True)
    user = relationship("User", back_populates="trusted_contacts")


class SOSAlert(Base):
    __tablename__ = "sos_alerts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    message = Column(String, default="EMERGENCY! I need help immediately.")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    user = relationship("User", back_populates="sos_alerts")


class Incident(Base):
    __tablename__ = "incidents"
    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"))
    incident_type = Column(Enum(IncidentType), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    location = Column(String, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    status = Column(Enum(IncidentStatus), default=IncidentStatus.pending)
    is_anonymous = Column(Boolean, default=False)
    evidence_url = Column(String, nullable=True)
    admin_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reporter = relationship("User", back_populates="incidents")


class Helpline(Base):
    __tablename__ = "helplines"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    number = Column(String, nullable=False)
    category = Column(String, nullable=False)   # women / child / emergency / legal / counseling
    description = Column(Text, nullable=True)
    available_24x7 = Column(Boolean, default=True)
    website = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)


class LegalResource(Base):
    __tablename__ = "legal_resources"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)   # women / child
    law_name = Column(String, nullable=True)
    summary = Column(Text, nullable=False)
    full_text = Column(Text, nullable=True)
    reference_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class CounselingResource(Base):
    __tablename__ = "counseling_resources"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)   # mental_health / trauma / legal_aid / shelter
    description = Column(Text, nullable=False)
    contact = Column(String, nullable=True)
    website = Column(String, nullable=True)
    location = Column(String, nullable=True)
    is_online = Column(Boolean, default=False)


class SafePlace(Base):
    __tablename__ = "safe_places"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    place_type = Column(String, nullable=False)  # police_station / hospital / shelter / ngo
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
