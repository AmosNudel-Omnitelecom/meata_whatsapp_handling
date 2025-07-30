from sqlalchemy import create_engine, Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

# Database URL configuration - supports both SQLite (local) and PostgreSQL (production)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Production: Use PostgreSQL from Railway
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_DATABASE_URL = DATABASE_URL
    connect_args = {}
else:
    # Development: Use SQLite
    SQLALCHEMY_DATABASE_URL = "sqlite:///./waba_database.db"
    connect_args = {"check_same_thread": False}

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args=connect_args
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Database model for WABA data
class WabaData(Base):
    __tablename__ = "waba_data"

    waba_id = Column(String, primary_key=True, index=True)
    access_token = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to phone numbers
    phone_numbers = relationship("WabaPhoneNumber", back_populates="waba", cascade="all, delete-orphan")

# Database model for WABA phone numbers
class WabaPhoneNumber(Base):
    __tablename__ = "waba_phone_numbers"

    id = Column(Integer, primary_key=True, index=True)
    phone_number_id = Column(String, unique=True, index=True, nullable=False)  # Facebook's phone number ID
    waba_id = Column(String, ForeignKey("waba_data.waba_id"), nullable=False)
    display_phone_number = Column(String, nullable=False)
    code_verification_status = Column(String, nullable=True)
    verification_expiry_time = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to WABA
    waba = relationship("WabaData", back_populates="phone_numbers")

# Create tables
def create_tables():
    Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 