from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ── Auth schemas ───────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True


# ── Document / Upload schemas ─────────────────────────────────────────────────
class UploadResponse(BaseModel):
    filename: str
    chunks_indexed: int


class DocumentSummary(BaseModel):
    filename: str


class SourceChunk(BaseModel):
    source: str
    page: int | None = None
    excerpt: str


class ChatRequest(BaseModel):
    session_id: int
    message: str = Field(min_length=1, max_length=4000)
    document_name: str | None = Field(default=None, max_length=255)


class ChatResponse(BaseModel):
    session_id: int
    answer: str
    title: str
    sources: list[SourceChunk]


class SessionCreateRequest(BaseModel):
    title: str | None = None
    document_name: str | None = Field(default=None, max_length=255)


class SessionUpdateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=255)


class SessionSummary(BaseModel):
    id: int
    title: str
    document_name: str | None = None
    created_at: datetime
    last_message_at: datetime | None = None

    class Config:
        from_attributes = True


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    timestamp: datetime

    class Config:
        from_attributes = True


class SessionDetail(BaseModel):
    id: int
    title: str
    document_name: str | None = None
    created_at: datetime
    messages: list[MessageResponse]

    class Config:
        from_attributes = True
