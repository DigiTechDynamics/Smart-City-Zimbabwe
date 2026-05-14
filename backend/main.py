from fastapi import FastAPI, Depends, HTTPException, status
from typing import Optional
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
import datetime

import models, schemas, database
from database import engine, get_db

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Smart Zimbabwe Service Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Zimbabwe Service Management API"}

from ai_service import ai_service
from integrations import integration_service, notification_service

@app.post("/issues/", response_model=schemas.IssueResponse)
async def create_issue(issue: schemas.IssueCreate, db: Session = Depends(get_db)):
    # Generate unique reference number
    ref_num = f"REF-{uuid.uuid4().hex[:8].upper()}"
    
    # AI Prioritization
    try:
        ai_priority = await ai_service.prioritize_issue(issue.description, issue.sector)
        if ai_priority in ["low", "medium", "high", "critical"]:
            priority = ai_priority
        else:
            priority = issue.priority
    except Exception:
        priority = issue.priority

    db_issue = models.Issue(
        **issue.dict(exclude={"priority"}),
        priority=priority,
        reference_number=ref_num,
        status=models.IssueStatus.REPORTED,
        created_at=datetime.datetime.utcnow()
    )
    
    db.add(db_issue)
    db.commit()
    db.refresh(db_issue)

    # Trigger Integrations based on sector
    if db_issue.sector == "electricity":
        await integration_service.notify_zetdc(ref_num, db_issue.category, db_issue.description)
    elif db_issue.sector == "water_sewer":
        await integration_service.notify_city_council(ref_num, db_issue.category, {"lat": db_issue.latitude, "lng": db_issue.longitude})

    # Notify Reporter (Mock)
    await notification_service.send_notification("User", f"Your report {ref_num} has been received and prioritized as {priority}.")

    return db_issue

@app.post("/login")
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if not user or user.password_hash != login_data.password: # Plain text for POC simplicity
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "access_token": "mock-token",
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "workforce_id": user.workforce_id
        }
    }

@app.get("/issues/", response_model=list[schemas.IssueResponse])
def list_issues(department: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Issue)
    if department:
        query = query.filter(models.Issue.sector == department)
    return query.all()

@app.get("/hotspots/")
def get_hotspots(db: Session = Depends(get_db)):
    issues = db.query(models.Issue).filter(models.Issue.latitude.isnot(None)).all()
    return [
        {
            "id": i.id,
            "lat": i.latitude,
            "lng": i.longitude,
            "sector": i.sector,
            "category": i.category,
            "ref": i.reference_number
        } for i in issues
    ]

@app.get("/categories/", response_model=list[schemas.CategoryResponse])
def get_categories(sector: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Category)
    if sector:
        query = query.filter(models.Category.sector == sector)
    return query.all()

@app.post("/categories/", response_model=schemas.CategoryResponse)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return db_category

@app.get("/issues/{ref_number}", response_model=schemas.IssueResponse)
def get_issue(ref_number: str, db: Session = Depends(get_db)):
    issue = db.query(models.Issue).filter(models.Issue.reference_number == ref_number).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@app.patch("/issues/{ref_number}/status")
def update_issue_status(ref_number: str, status_update: schemas.StatusUpdate, db: Session = Depends(get_db)):
    issue = db.query(models.Issue).filter(models.Issue.reference_number == ref_number).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    issue.status = status_update.status
    db.commit()
    return {"message": "Status updated successfully", "status": issue.status}

@app.get("/workforce/", response_model=list[schemas.WorkforceResponse])
def list_workforce(department: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Workforce)
    if department:
        query = query.filter(models.Workforce.department == department)
    return query.all()

@app.post("/workforce/", response_model=schemas.WorkforceResponse)
def create_workforce(workforce: schemas.WorkforceCreate, db: Session = Depends(get_db)):
    db_workforce = models.Workforce(**workforce.dict())
    db.add(db_workforce)
    db.commit()
    db.refresh(db_workforce)
    return db_workforce

@app.patch("/issues/{ref_number}/assign")
def assign_issue(ref_number: str, assign_data: schemas.IssueAssign, db: Session = Depends(get_db)):
    issue = db.query(models.Issue).filter(models.Issue.reference_number == ref_number).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    workforce = db.query(models.Workforce).filter(models.Workforce.id == assign_data.workforce_id).first()
    if not workforce:
        raise HTTPException(status_code=404, detail="Workforce not found")
        
    issue.assigned_team_id = workforce.id
    issue.status = models.IssueStatus.ASSIGNED
    workforce.task = issue.reference_number
    db.commit()
    return {"message": "Issue assigned successfully", "issue_status": issue.status, "workforce_task": workforce.task}

@app.patch("/workforce/{workforce_id}/dispatch")
def dispatch_workforce(workforce_id: int, update_data: schemas.WorkforceUpdate, db: Session = Depends(get_db)):
    workforce = db.query(models.Workforce).filter(models.Workforce.id == workforce_id).first()
    if not workforce:
        raise HTTPException(status_code=404, detail="Workforce not found")
        
    if update_data.status:
        workforce.status = update_data.status
    if update_data.task:
        workforce.task = update_data.task
    if update_data.location:
        workforce.location = update_data.location
        
    db.commit()
    return {"message": "Workforce dispatched/updated", "status": workforce.status}

@app.post("/workforce/{workforce_id}/members", response_model=schemas.UserBasic)
def add_workforce_member(workforce_id: int, member: schemas.WorkforceMemberCreate, db: Session = Depends(get_db)):
    workforce = db.query(models.Workforce).filter(models.Workforce.id == workforce_id).first()
    if not workforce:
        raise HTTPException(status_code=404, detail="Workforce not found")
    existing = db.query(models.User).filter(models.User.email == member.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = models.User(
        full_name=member.full_name,
        email=member.email,
        phone=member.phone,
        password_hash=member.password,
        role=models.UserRole.WORKFORCE,
        department=member.department,
        workforce_id=workforce_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/workforce/{workforce_id}/members", response_model=list[schemas.UserBasic])
def get_workforce_members(workforce_id: int, db: Session = Depends(get_db)):
    workforce = db.query(models.Workforce).filter(models.Workforce.id == workforce_id).first()
    if not workforce:
        raise HTTPException(status_code=404, detail="Workforce not found")
    return workforce.members

@app.delete("/workforce/{workforce_id}/members/{member_id}")
def remove_workforce_member(workforce_id: int, member_id: int, db: Session = Depends(get_db)):
    member = db.query(models.User).filter(models.User.id == member_id, models.User.workforce_id == workforce_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    db.delete(member)
    db.commit()
    return {"message": "Member removed successfully"}

@app.patch("/workforce/{workforce_id}/members/{member_id}", response_model=schemas.UserBasic)
def update_workforce_member(workforce_id: int, member_id: int, update_data: schemas.WorkforceMemberUpdate, db: Session = Depends(get_db)):
    member = db.query(models.User).filter(models.User.id == member_id, models.User.workforce_id == workforce_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if update_data.full_name: member.full_name = update_data.full_name
    if update_data.email: member.email = update_data.email
    if update_data.phone: member.phone = update_data.phone
    if update_data.password: member.password_hash = update_data.password
    if update_data.role: member.role = update_data.role
    db.commit()
    db.refresh(member)
    return member

@app.post("/workforce-login")
def workforce_login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        models.User.email == login_data.email,
        models.User.role == models.UserRole.WORKFORCE
    ).first()
    if not user or user.password_hash != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials or not a workforce member")
    return {
        "access_token": "mock-token",
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": user.role,
            "department": user.department,
            "workforce_id": user.workforce_id
        }
    }

@app.get("/my-tickets/{user_id}")
def get_my_tickets(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Get tickets assigned to this user's workforce team
    if user.workforce_id:
        issues = db.query(models.Issue).filter(
            models.Issue.assigned_team_id == user.workforce_id
        ).all()
    else:
        issues = db.query(models.Issue).filter(
            models.Issue.assigned_to_id == user_id
        ).all()
    return [
        {
            "id": i.id,
            "reference_number": i.reference_number,
            "sector": i.sector,
            "category": i.category,
            "description": i.description,
            "status": i.status,
            "priority": i.priority,
            "address": i.address,
            "created_at": i.created_at,
            "updated_at": i.updated_at,
        } for i in issues
    ]


@app.get("/sla/{department}")
def get_sla(department: str, db: Session = Depends(get_db)):
    """Returns SLA performance metrics for a specific department."""
    dept_issues = db.query(models.Issue).filter(models.Issue.sector == department).all()
    total = len(dept_issues)
    if total == 0:
        return {"department": department, "total": 0, "resolved": 0, "sla_pct": 100, "in_progress": 0, "pending": 0}
    resolved = len([i for i in dept_issues if i.status == "resolved"])
    in_progress = len([i for i in dept_issues if i.status == "in_progress"])
    pending = len([i for i in dept_issues if i.status == "reported"])
    sla_pct = round((resolved / total) * 100, 1) if total > 0 else 0
    critical = len([i for i in dept_issues if i.priority == "critical"])
    return {
        "department": department,
        "total": total,
        "resolved": resolved,
        "in_progress": in_progress,
        "pending": pending,
        "critical": critical,
        "sla_pct": sla_pct
    }

@app.patch("/my-tickets/{user_id}/{ref_number}/status")
def workforce_update_ticket_status(user_id: int, ref_number: str, status_update: schemas.StatusUpdate, db: Session = Depends(get_db)):
    """Allows a workforce member to update status of a ticket assigned to their team."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    issue = db.query(models.Issue).filter(models.Issue.reference_number == ref_number).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    # Check the issue is actually assigned to this user's team
    if user.workforce_id and issue.assigned_team_id != user.workforce_id:
        raise HTTPException(status_code=403, detail="This ticket is not assigned to your team")
    issue.status = status_update.status
    issue.updated_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Status updated", "status": issue.status}
