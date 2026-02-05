from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, exam, admin
from app.core.config import settings

app = FastAPI(title="Entrance Exam")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(exam.router)
app.include_router(admin.router)


@app.get("/")
async def root():
    return {"status": "ok"}
