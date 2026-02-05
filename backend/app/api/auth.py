from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.session import get_session
from app.models.user import User
from app.schemas.auth import RegisterIn, LoginIn, TokenOut
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])
ALLOWED_FACULTY = "Факультет связи и автоматизированное управление войсками"


@router.post("/register", response_model=TokenOut)
async def register(data: RegisterIn, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(User).where(User.email == data.email))
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    phone_exists = await session.execute(select(User).where(User.phone == data.phone))
    if phone_exists.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phone already registered")
    if data.faculty != ALLOWED_FACULTY:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid faculty")
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
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
    result = await session.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = create_access_token(str(user.id))
    return TokenOut(access_token=token)
