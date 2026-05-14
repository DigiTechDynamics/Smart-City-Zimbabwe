from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from database import Base
import datetime
import enum

class UserRole(str, enum.Enum):
    RESIDENT = "resident"
    AGENT = "agent"
    ENGINEER = "engineer"
    ADMIN = "admin"
    WORKFORCE = "workforce"

class IssueStatus(str, enum.Enum):
    REPORTED = "reported"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"

class IssueSector(str, enum.Enum):
    ELECTRICITY = "electricity"
    WATER_SEWER = "water_sewer"
    ROADS_INFRA = "roads_infra"
    WASTE_MANAGEMENT = "waste_management"
    EMERGENCY_SERVICES = "emergency_services"
    PUBLIC_HEALTH = "public_health"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    phone = Column(String, index=True)
    password_hash = Column(String)
    role = Column(String, default=UserRole.RESIDENT)
    department = Column(String, nullable=True) # electricity, water_sewer, roads_infra
    workforce_id = Column(Integer, ForeignKey("workforce.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    reported_issues = relationship("Issue", back_populates="reporter", foreign_keys="Issue.reporter_id")
    assigned_tasks = relationship("Issue", back_populates="assigned_to", foreign_keys="Issue.assigned_to_id")
    workforce = relationship("Workforce", back_populates="members", foreign_keys=[workforce_id])

class Issue(Base):
    __tablename__ = "issues"

    id = Column(Integer, primary_key=True, index=True)
    reference_number = Column(String, unique=True, index=True)
    sector = Column(String) # electricity, water_sewer, roads_infra
    category = Column(String) # outage, pothole, leak, etc.
    description = Column(Text)
    
    # GIS Data
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    address = Column(String, nullable=True)

    status = Column(String, default=IssueStatus.REPORTED)
    priority = Column(String, default="medium") # low, medium, high, critical
    
    reporter_id = Column(Integer, ForeignKey("users.id"))
    assigned_to_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    assigned_team_id = Column(Integer, ForeignKey("workforce.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    reporter = relationship("User", back_populates="reported_issues", foreign_keys=[reporter_id])
    assigned_to = relationship("User", back_populates="assigned_tasks", foreign_keys=[assigned_to_id])
    comments = relationship("Comment", back_populates="issue")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    issue = relationship("Issue", back_populates="comments")
    user = relationship("User")

class Workforce(Base):
    __tablename__ = "workforce"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    status = Column(String, default="Available") # Available, On Site, En Route
    task = Column(String, default="None")
    location = Column(String, default="Depot")
    department = Column(String) # electricity, water_sewer, roads_infra

    members = relationship("User", back_populates="workforce", foreign_keys="User.workforce_id")

class Category(Base):
    __tablename__ = "categories"
    
    id = Column(Integer, primary_key=True, index=True)
    sector = Column(String, index=True)
    name = Column(String)
