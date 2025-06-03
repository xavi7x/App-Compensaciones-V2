# app/api/v1/endpoints/users.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Any
from datetime import datetime, timezone
from app import crud, schemas # No necesitamos 'models' directamente aquí si usamos UserModel
from app.models.user import User as UserModel # Importar el modelo SQLAlchemy con un alias
from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import ApprovalStatus

router = APIRouter()

@router.post("/", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def create_user_registration(
    *,
    db: Session = Depends(deps.get_db),
    user_in: schemas.UserCreate,
) -> Any:
    user_by_email = crud.crud_user.get_user_by_email(db, email=user_in.email)
    if user_by_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this email already exists in the system.",
        )
    user_by_username = crud.crud_user.get_user_by_username(db, username=user_in.username)
    if user_by_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The user with this username already exists in the system.",
        )
    user = crud.crud_user.create_user(db=db, user_in=user_in)
    return user

@router.get("/me", response_model=schemas.User)
def read_user_me(
    current_user: UserModel = Depends(deps.get_current_user), # Usar UserModel
) -> Any:
    if current_user.last_password_change_date:
        password_age_days = (datetime.now(timezone.utc) - current_user.last_password_change_date.replace(tzinfo=timezone.utc)).days
        if password_age_days > 30:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Password has expired. Please change your password."
            )
    return current_user

@router.put("/me", response_model=schemas.User)
def update_user_me(
    *,
    db: Session = Depends(deps.get_db),
    user_update_in: schemas.UserProfileUpdate,
    current_user: UserModel = Depends(deps.get_current_user), # Usar UserModel
) -> Any:
    update_data = user_update_in.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] != current_user.email:
        existing_user = crud.crud_user.get_user_by_email(db, email=update_data["email"])
        if existing_user and existing_user.id != current_user.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered by another user.")
    user = crud.crud_user.update_user(db=db, db_user=current_user, user_in=update_data)
    return user

@router.post("/me/change-password", response_model=schemas.User)
def change_password_me(
    *,
    db: Session = Depends(deps.get_db),
    password_data: schemas.PasswordChange,
    current_user: UserModel = Depends(deps.get_current_user), # Usar UserModel
) -> Any:
    if not security.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")
    new_hashed_password = security.get_password_hash(password_data.new_password)
    current_user.hashed_password = new_hashed_password
    current_user.last_password_change_date = datetime.now(timezone.utc)
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/", response_model=List[schemas.User], dependencies=[Depends(deps.get_current_admin_user)])
def read_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    users = crud.crud_user.get_users(db, skip=skip, limit=limit)
    return users

@router.get("/pending-approval", response_model=List[schemas.User], dependencies=[Depends(deps.get_current_admin_user)])
def read_pending_approval_users(
    db: Session = Depends(deps.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    users = crud.crud_user.get_pending_approval_users(db, skip=skip, limit=limit)
    return users

@router.put("/{user_id}", response_model=schemas.User, dependencies=[Depends(deps.get_current_admin_user)])
def update_user_by_admin(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
    user_in: schemas.UserUpdate,
) -> Any:
    db_user = crud.crud_user.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    update_data = user_in.model_dump(exclude_unset=True)
    if "email" in update_data and update_data["email"] != db_user.email:
        existing_user = crud.crud_user.get_user_by_email(db, email=update_data["email"])
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered by another user.")
    if "username" in update_data and update_data["username"] != db_user.username:
        existing_user = crud.crud_user.get_user_by_username(db, username=update_data["username"])
        if existing_user and existing_user.id != user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already registered by another user.")
    user = crud.crud_user.update_user(db=db, db_user=db_user, user_in=update_data)
    return user

@router.post("/{user_id}/approve", response_model=schemas.User, dependencies=[Depends(deps.get_current_admin_user)])
def approve_user_registration(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
) -> Any:
    user = crud.crud_user.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.approval_status == ApprovalStatus.APPROVED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already approved")
    approved_user = crud.crud_user.approve_user(db=db, db_user=user)
    return approved_user

@router.post("/{user_id}/reject", response_model=schemas.User, dependencies=[Depends(deps.get_current_admin_user)])
def reject_user_registration(
    *,
    db: Session = Depends(deps.get_db),
    user_id: int,
) -> Any:
    user = crud.crud_user.get_user(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.approval_status == ApprovalStatus.REJECTED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User is already rejected")
    rejected_user = crud.crud_user.reject_user(db=db, db_user=user)
    return rejected_user

@router.post("/me/2fa/setup", response_model=schemas.TwoFactorSetup)
def setup_two_factor_auth(
    current_user: UserModel = Depends(deps.get_current_user), # Usar UserModel
):
    if current_user.is_two_factor_enabled and current_user.two_factor_secret:
        pass
    secret = security.generate_totp_secret()
    qr_code_uri = security.get_totp_uri(current_user.username, secret)
    return {"totp_secret": secret, "qr_code_uri": qr_code_uri}

@router.post("/me/2fa/enable", response_model=schemas.User)
def enable_two_factor_auth(
    *,
    db: Session = Depends(deps.get_db),
    payload: schemas.TwoFactorVerify = Body(...),
    user_secret_payload: dict = Body(...), # Espera {"totp_secret": "valor"}
    current_user: UserModel = Depends(deps.get_current_user), # Usar UserModel
):
    totp_code = payload.totp_code
    totp_secret = user_secret_payload.get("totp_secret")

    if not totp_secret:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="TOTP secret from setup step is required.")
    if current_user.is_two_factor_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is already enabled.")
    if not security.verify_totp_code(totp_secret, totp_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid TOTP code. 2FA not enabled.")
    current_user.two_factor_secret = totp_secret
    current_user.is_two_factor_enabled = True
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/2fa/disable", response_model=schemas.User)
def disable_two_factor_auth(
    *,
    db: Session = Depends(deps.get_db),
    payload: schemas.TwoFactorVerify = Body(...),
    current_user: UserModel = Depends(deps.get_current_user), # Usar UserModel
):
    totp_code = payload.totp_code
    if not current_user.is_two_factor_enabled:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="2FA is not enabled.")
    if not current_user.two_factor_secret or not security.verify_totp_code(current_user.two_factor_secret, totp_code):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid TOTP code. Cannot disable 2FA.")
    current_user.is_two_factor_enabled = False
    current_user.two_factor_secret = None
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user
