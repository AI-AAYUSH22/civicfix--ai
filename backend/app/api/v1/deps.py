from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import TokenError, decode_access_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

_PK_TYPE = User.__table__.c.id.type.python_type  # int / str / UUID, whatever your PK is


def _unauthorized(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status.HTTP_401_UNAUTHORIZED, detail, headers={"WWW-Authenticate": "Bearer"}
    )


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    try:
        payload = decode_access_token(token)
    except TokenError as e:
        raise _unauthorized(str(e)) from e

    try:
        pk = _PK_TYPE(payload["sub"])
    except (ValueError, TypeError):
        raise _unauthorized()

    user = db.get(User, pk)
    if user is None:
        raise _unauthorized()
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Inactive user")
    return user  # role comes from DB, not from the token claim


def require_roles(*allowed: UserRole):
    def guard(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Insufficient permissions")
        return user

    return guard


require_citizen = require_roles(UserRole.CITIZEN)
require_contractor = require_roles(UserRole.CONTRACTOR)
require_municipal = require_roles(UserRole.WARD_ENGINEER, UserRole.ADMIN)