from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models.user import User
from app.schemas.auth import RegisterIn, LoginIn, TokenOut
from app.core.security import hash_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
ALLOWED_FACULTY = "Факультет связи и автоматизированное управление войсками"


@router.post("/register", response_model=TokenOut)
async def register(data: RegisterIn, session: AsyncSession = Depends(get_session)):
    phone_exists = await session.execute(select(User).where(User.phone == data.phone))
    if phone_exists.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already registered")
    if data.faculty != ALLOWED_FACULTY:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid faculty")
    phone_digits = "".join(ch for ch in data.phone if ch.isdigit())
    generated_email = f"user_{phone_digits}@local.exam"
    user = User(
        email=generated_email,
        password_hash=hash_password(data.phone),
        last_name=data.last_name.strip(),
        first_name=data.first_name.strip(),
        middle_name=(data.middle_name or "").strip() or None,
        phone=data.phone.strip(),
        faculty=data.faculty,
        is_admin=False,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)


@router.post("/login", response_model=TokenOut)
async def login(data: LoginIn, session: AsyncSession = Depends(get_session)):
    user = None
    if data.phone:
        result = await session.execute(select(User).where(User.phone == data.phone))
        user = result.scalar_one_or_none()
    elif data.login and data.password:
        if data.login == "admin" and data.password == "admin":
            result = await session.execute(select(User).where(User.is_admin.is_(True)))
            user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)


@router.get("/me")
async def me(current: User = Depends(get_current_user)):
    return {
        "id": current.id,
        "last_name": current.last_name,
        "first_name": current.first_name,
        "middle_name": current.middle_name,
        "phone": current.phone,
        "faculty": current.faculty,
        "is_admin": current.is_admin,
    }
