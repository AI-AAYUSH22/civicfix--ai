from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.core.security import (
    DUMMY_HASH,
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, RegisterRequest, Token, UserOut

router = APIRouter()


def _get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(func.lower(User.email) == email.strip().lower()))


def _authenticate(db: Session, email: str, password: str) -> User:
    user = _get_by_email(db, email)
    ok = verify_password(password, user.hashed_password if user else DUMMY_HASH)
    if not user or not ok:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Inactive user")
    return user


def _issue_token(user: User) -> Token:
    return Token(
        access_token=create_access_token(subject=user.id, role=user.role),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserOut(
            id=user.id,
            name=user.name,
            email=user.email,
            role=getattr(user.role, "value", user.role),
        ),
    )


@router.post("/login", response_model=Token)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    return _issue_token(_authenticate(db, body.email, body.password))


@router.post("/token", response_model=Token, include_in_schema=True)
def token_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Form-encoded login; used by Swagger's 'Authorize' button. username = email."""
    return _issue_token(_authenticate(db, form.username, form.password))


@router.get("/users/me", response_model=UserOut)
def read_me(user: User = Depends(get_current_user)):
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=getattr(user.role, "value", user.role),
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if _get_by_email(db, body.email):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(
        name=body.name.strip(),
        email=body.email.lower(),
        hashed_password=hash_password(body.password),
        role=UserRole.CITIZEN,  # never client-controlled
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _issue_token(user)