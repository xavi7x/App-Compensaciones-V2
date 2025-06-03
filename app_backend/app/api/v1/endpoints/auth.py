# app/api/v1/endpoints/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import jwt, JWTError
from pydantic import ValidationError

from app import crud, schemas
from app.api import deps
from app.core import security
from app.core.config import settings
from app.models.user import User, ApprovalStatus

router = APIRouter()

@router.post("/login", response_model=schemas.Token)
async def login_for_access_token(
    db: Session = Depends(deps.get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = crud.crud_user.get_user_by_username(db, username=form_data.username)
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")
    if user.approval_status != ApprovalStatus.APPROVED:
         raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"User account is {user.approval_status.value}, cannot login.")

    if user.is_two_factor_enabled:
        totp_code_received = form_data.client_secret
        if not totp_code_received:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="TOTP code required for 2FA enabled user. Please provide it in 'client_secret' field.",
            )
        if not user.two_factor_secret or not security.verify_totp_code(user.two_factor_secret, totp_code_received):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid TOTP code",
            )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    access_token = security.create_access_token(
        user.username, expires_delta=access_token_expires
    )
    refresh_token = security.create_refresh_token(
        user.username, expires_delta=refresh_token_expires
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }

@router.post("/refresh-token", response_model=schemas.Token)
def refresh_access_token(
    payload: dict = Body(...),
    db: Session = Depends(deps.get_db)
):
    refresh_token_str = payload.get("refresh_token")
    if not refresh_token_str:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Refresh token missing")
    try:
        decoded_payload = jwt.decode(
            refresh_token_str, str(settings.SECRET_KEY), algorithms=[settings.ALGORITHM]
        )
        if decoded_payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token type, not a refresh token")

        token_data = schemas.TokenPayload(**decoded_payload)
        if token_data.sub is None:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid token: subject missing")

        user = crud.crud_user.get_user_by_username(db, username=token_data.sub)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Inactive user")

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = security.create_access_token(
            user.username, expires_delta=access_token_expires
        )
        return {
            "access_token": new_access_token,
            "refresh_token": refresh_token_str,
            "token_type": "bearer",
        }
    except (JWTError, ValidationError) as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Could not validate refresh token: {e}",
        )
