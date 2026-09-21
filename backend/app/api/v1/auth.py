from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import UserLogin, TokenResponse, UserResponse

router = APIRouter()

DEMO_USERS = {
    "citizen@civicfix.org": {
        "full_name": "Aarav Sharma",
        "role": UserRole.CITIZEN,
        "phone": "+91 98200 12345"
    },
    "contractor@roadworks.in": {
        "full_name": "RoadWorks Infrastructure Unit A",
        "role": UserRole.CONTRACTOR,
        "phone": "+91 98201 67890"
    },
    "engineer@mcgm.gov.in": {
        "full_name": "Er. Rajesh Kulkarni",
        "role": UserRole.WARD_ENGINEER,
        "phone": "+91 98202 34567"
    },
    "admin@civicfix.org": {
        "full_name": "CivicFix System Administrator",
        "role": UserRole.ADMIN,
        "phone": "+91 98203 98765"
    }
}

@router.post("/login", response_model=TokenResponse)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate demo user and return access token + user details.
    Auto-registers known demo users if not already in the database.
    """
    email = login_data.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        demo_info = DEMO_USERS.get(email)
        if not demo_info:
            # Register on the fly as Citizen
            demo_info = {
                "full_name": email.split("@")[0].capitalize(),
                "role": UserRole.CITIZEN,
                "phone": "+91 90000 00000"
            }
        
        user = User(
            email=email,
            full_name=demo_info["full_name"],
            role=demo_info["role"],
            phone=demo_info["phone"],
            hashed_password="mock_hashed_password"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return TokenResponse(
        access_token=f"demo-token-{user.id}-{user.role}",
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )

@router.get("/users/me", response_model=UserResponse)
def get_current_user_profile(email: str = "citizen@civicfix.org", db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)
