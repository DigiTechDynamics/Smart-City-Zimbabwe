from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class IssueBase(BaseModel):
    sector: str
    category: str
    description: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    priority: Optional[str] = "medium"

class IssueCreate(IssueBase):
    reporter_id: Optional[int] = 1 # Temporary default for POC

class IssueResponse(IssueBase):
    id: int
    reference_number: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: str

class UserBase(BaseModel):
    full_name: str
    email: str
    phone: str
    role: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class UserBasic(BaseModel):
    id: int
    full_name: str
    email: str
    phone: str
    role: str

    class Config:
        from_attributes = True

class WorkforceBase(BaseModel):
    name: str
    department: str
    location: Optional[str] = "Depot"

class WorkforceCreate(WorkforceBase):
    pass

class WorkforceResponse(WorkforceBase):
    id: int
    status: str
    task: str
    members: Optional[List[UserBasic]] = []

    class Config:
        from_attributes = True

class WorkforceUpdate(BaseModel):
    status: Optional[str] = None
    task: Optional[str] = None
    location: Optional[str] = None

class IssueAssign(BaseModel):
    workforce_id: int

class WorkforceMemberCreate(BaseModel):
    full_name: str
    email: str
    phone: str
    password: str
    workforce_id: int
    department: str

class CategoryBase(BaseModel):
    sector: str
    name: str

class CategoryCreate(CategoryBase):
    pass

class CategoryResponse(CategoryBase):
    id: int

    class Config:
        from_attributes = True

class WorkforceMemberUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = None
