# app/crud/crud_user.py
from sqlalchemy.orm import Session
from app.models.user import User, ApprovalStatus, UserRole
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash
from typing import Any, Dict, Optional, Union, List

def get_user(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).offset(skip).limit(limit).all()

def get_pending_approval_users(db: Session, skip: int = 0, limit: int = 100) -> List[User]:
    return db.query(User).filter(User.approval_status == ApprovalStatus.PENDING).offset(skip).limit(limit).all()

def create_user(db: Session, *, user_in: UserCreate) -> User:
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        full_name=user_in.full_name,
        hashed_password=hashed_password,
        is_active=user_in.is_active if user_in.is_active is not None else True,
        is_superuser=user_in.is_superuser if user_in.is_superuser is not None else False,
        role=user_in.role if user_in.role else UserRole.USER,
        approval_status=ApprovalStatus.PENDING
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, *, db_user: User, user_in: Union[UserUpdate, Dict[str, Any]]) -> User:
    if isinstance(user_in, dict):
        update_data = user_in
    else:
        update_data = user_in.model_dump(exclude_unset=True)

    if "password" in update_data and update_data["password"]:
        hashed_password = get_password_hash(update_data["password"])
        db_user.hashed_password = hashed_password
        if "password" in update_data:
          del update_data["password"]

    for field, value in update_data.items():
        if hasattr(db_user, field):
          setattr(db_user, field, value)

    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def approve_user(db: Session, *, db_user: User) -> User:
    db_user.approval_status = ApprovalStatus.APPROVED
    db_user.is_active = True
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def reject_user(db: Session, *, db_user: User) -> User:
    db_user.approval_status = ApprovalStatus.REJECTED
    db_user.is_active = False
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def is_superuser(user: User) -> bool:
    return user.is_superuser or user.role == UserRole.ADMIN
