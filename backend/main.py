from pathlib import Path
import logging

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, inspect, select, text
from sqlalchemy.orm import Session, selectinload

from auth import create_access_token, get_current_user, hash_password, verify_password
from config import settings
from database import Base, engine, get_db
from models import ChatSession, Message, User
from rag_pipeline import rag_service
from schemas import (
    ChatRequest,
    ChatResponse,
    DocumentSummary,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    SessionCreateRequest,
    SessionDetail,
    SessionSummary,
    SessionUpdateRequest,
    SourceChunk,
    TokenResponse,
    UploadResponse,
    UserResponse,
)


SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".ppt", ".pptx"}


app = FastAPI(title="MindVault", version="1.0.0")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:5173", "http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    Path(settings.resolved_upload_dir).mkdir(parents=True, exist_ok=True)
    ensure_session_document_column()
    ensure_session_user_column()


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


# ── Auth ─────────────────────────────────────────────────────────────────────

@app.post("/auth/register", response_model=TokenResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if db.execute(select(User).where(User.email == payload.email)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    if db.execute(select(User).where(User.username == payload.username)).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")
    user = User(
        username=payload.username.strip(),
        email=payload.email.strip().lower(),
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return TokenResponse(access_token=create_access_token(user.id))


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.execute(select(User).where(User.email == payload.email.strip().lower())).scalar_one_or_none()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return TokenResponse(access_token=create_access_token(user.id))


@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    return UserResponse.model_validate(current_user)


@app.get("/documents", response_model=list[DocumentSummary])
def list_documents(current_user: User = Depends(get_current_user)) -> list[DocumentSummary]:
    user_upload_dir = Path(settings.resolved_upload_dir) / str(current_user.id)
    user_upload_dir.mkdir(parents=True, exist_ok=True)
    files = sorted(
        [path for path in user_upload_dir.iterdir() if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS],
        key=lambda path: path.stat().st_mtime,
        reverse=True,
    )
    return [DocumentSummary(filename=path.name) for path in files]


@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...), current_user: User = Depends(get_current_user)) -> UploadResponse:
    filename = (file.filename or "").strip()
    if not filename:
        raise HTTPException(status_code=400, detail="Filename is missing.")

    extension = Path(filename).suffix.lower()
    if extension not in SUPPORTED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, PPT, and PPTX files are supported.")

    content = await file.read()
    try:
        chunks_indexed = rag_service.ingest_document(filename, content, user_id=current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        logger.exception("PDF ingestion failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {exc}") from exc

    return UploadResponse(filename=filename, chunks_indexed=chunks_indexed)


@app.post("/sessions", response_model=SessionSummary)
def create_session(payload: SessionCreateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> SessionSummary:
    session = ChatSession(
        user_id=current_user.id,
        title=(payload.title or "New Chat").strip() or "New Chat",
        document_name=(payload.document_name or "").strip() or None,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return SessionSummary.model_validate(session)


@app.get("/sessions", response_model=list[SessionSummary])
def list_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> list[SessionSummary]:
    last_message_subquery = (
        select(Message.session_id, func.max(Message.timestamp).label("last_message_at"))
        .group_by(Message.session_id)
        .subquery()
    )
    rows = db.execute(
        select(ChatSession, last_message_subquery.c.last_message_at)
        .where(ChatSession.user_id == current_user.id)
        .outerjoin(last_message_subquery, ChatSession.id == last_message_subquery.c.session_id)
        .order_by(func.coalesce(last_message_subquery.c.last_message_at, ChatSession.created_at).desc())
    ).all()

    return [
        SessionSummary(
            id=session.id,
            title=session.title,
            document_name=session.document_name,
            created_at=session.created_at,
            last_message_at=last_message_at,
        )
        for session, last_message_at in rows
    ]


@app.get("/sessions/{session_id}", response_model=SessionDetail)
def get_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> SessionDetail:
    session = db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id).options(selectinload(ChatSession.messages))
    ).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    return SessionDetail(
        id=session.id,
        title=session.title,
        document_name=session.document_name,
        created_at=session.created_at,
        messages=[MessageResponse.model_validate(message) for message in session.messages],
    )


@app.patch("/sessions/{session_id}", response_model=SessionSummary)
def rename_session(session_id: int, payload: SessionUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> SessionSummary:
    session = db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    ).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    session.title = payload.title.strip()
    db.commit()
    db.refresh(session)
    return SessionSummary.model_validate(session)


@app.delete("/sessions/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> dict[str, str]:
    session = db.execute(
        select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    ).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    db.delete(session)
    db.commit()
    return {"status": "deleted"}


@app.post("/chat", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)) -> ChatResponse:
    session = db.execute(
        select(ChatSession).where(ChatSession.id == payload.session_id, ChatSession.user_id == current_user.id).options(selectinload(ChatSession.messages))
    ).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")

    user_message = Message(session_id=session.id, role="user", content=payload.message.strip())
    db.add(user_message)
    db.flush()

    if session.title == "New Chat":
        session.title = generate_title(payload.message)

    requested_document = (payload.document_name or "").strip() or None
    if requested_document is not None:
        session.document_name = requested_document

    history = [{"role": message.role, "content": message.content} for message in session.messages if message.role in {"user", "assistant"}]
    try:
        answer, sources = rag_service.answer_question(
            payload.message.strip(),
            history,
            document_name=session.document_name,
            user_id=current_user.id,
        )
    except Exception as exc:
        logger.exception("RAG answer_question failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to generate answer: {exc}") from exc

    assistant_message = Message(session_id=session.id, role="assistant", content=answer)
    db.add(assistant_message)
    db.commit()
    db.refresh(session)

    return ChatResponse(
        session_id=session.id,
        answer=answer,
        title=session.title,
        sources=[
            SourceChunk(source=chunk.source, page=chunk.page, excerpt=chunk.excerpt)
            for chunk in sources
        ],
    )


def generate_title(message: str) -> str:
    title = " ".join(message.split())
    if len(title) <= 60:
        return title
    return f"{title[:57].rstrip()}..."


def ensure_session_document_column() -> None:
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("chat_sessions")}
    if "document_name" in columns:
        return
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE chat_sessions ADD COLUMN document_name VARCHAR(255)"))


def ensure_session_user_column() -> None:
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns("chat_sessions")}
    if "user_id" in columns:
        return
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE chat_sessions ADD COLUMN user_id INTEGER REFERENCES users(id)"))
