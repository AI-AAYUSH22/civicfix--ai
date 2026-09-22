from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import func, select, or_
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
from app.models.audit import AuditLog, EngineerWardAssignment
from app.schemas.auth import LoginRequest, RegisterRequest, Token, UserOut, WardAssignmentOut
from app.services.audit_service import log_audit_event

router = APIRouter()


def _get_by_identifier(db: Session, identifier: str) -> User | None:
    cleaned = identifier.strip()
    return db.scalar(
        select(User).where(
            or_(
                func.lower(User.email) == cleaned.lower(),
                func.lower(User.employee_id) == cleaned.lower(),
                func.lower(User.contractor_id) == cleaned.lower()
            )
        )
    )


def _get_engineer_current_ward(db: Session, user: User) -> WardAssignmentOut | None:
    if user.role not in [UserRole.WARD_ENGINEER, "WARD_ENGINEER"]:
        return None
    assignment = (
        db.query(EngineerWardAssignment)
        .filter(
            or_(
                EngineerWardAssignment.employee_id == user.employee_id,
                func.lower(EngineerWardAssignment.engineer_email) == user.email.lower(),
            ),
            EngineerWardAssignment.is_current == True
        )
        .order_by(EngineerWardAssignment.start_date.desc())
        .first()
    )
    if assignment:
        return WardAssignmentOut(
            ward_id=assignment.ward_id,
            ward_name=assignment.ward_name,
            assigned_by=assignment.assigned_by,
            start_date=assignment.start_date.isoformat() if assignment.start_date else None,
        )
    # Default fallback assignment for standard Municipal Ward Engineer
    return WardAssignmentOut(
        ward_id="G/N",
        ward_name="Ward G/N — Dadar / Mahim / Dharavi",
        assigned_by="BMC Municipal Commissioner Office",
        start_date="2026-01-01T00:00:00"
    )


def _authenticate(db: Session, identifier: str, password: str) -> User:
    user = _get_by_identifier(db, identifier)
    ok = verify_password(password, user.hashed_password if user else DUMMY_HASH)
    if not user or not ok:
        raise HTTPException(
            status.HTTP_401_UNAUTHORIZED,
            "Invalid Employee ID / Email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Inactive user")
    return user


def _build_user_out(db: Session, user: User) -> UserOut:
    return UserOut(
        id=user.id,
        name=user.name,
        email=user.email,
        role=getattr(user.role, "value", user.role),
        employee_id=user.employee_id,
        contractor_id=user.contractor_id,
        assigned_ward=_get_engineer_current_ward(db, user),
    )


def _issue_token(db: Session, user: User) -> Token:
    user_out = _build_user_out(db, user)

    # Log successful login to AuditLog
    try:
        log_audit_event(
            db=db,
            action="USER_LOGIN_SUCCESS",
            entity_type="User",
            entity_id=str(user.id),
            actor_id=str(user.id),
            actor_name=user.full_name,
            actor_role=getattr(user.role, "value", str(user.role)),
            details={
                "employee_id": user.employee_id,
                "contractor_id": user.contractor_id,
                "assigned_ward": user_out.assigned_ward.ward_id if user_out.assigned_ward else None,
            },
        )
    except Exception:
        pass

    return Token(
        access_token=create_access_token(subject=user.id, role=user.role),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=user_out,
    )


@router.post("/login", response_model=Token)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = _authenticate(db, body.email, body.password)
    return _issue_token(db, user)


@router.post("/token", response_model=Token, include_in_schema=True)
def token_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Form-encoded login; used by Swagger's 'Authorize' button. username = email or employee_id."""
    user = _authenticate(db, form.username, form.password)
    return _issue_token(db, user)


@router.get("/users/me", response_model=UserOut)
def read_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return _build_user_out(db, user)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    if _get_by_identifier(db, body.email):
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
    return _issue_token(db, user)