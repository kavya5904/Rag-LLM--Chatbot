from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent


class Settings(BaseSettings):
    rag_mode: str = "local"  # local | openai | ollama
    openai_api_key: str | None = None
    openai_base_url: str | None = None  # e.g. https://openrouter.ai/api/v1
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    local_embedding_model: str = "all-MiniLM-L6-v2"
    local_generation_model: str = "google/flan-t5-small"
    local_generation_max_context_chars: int = 3500
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_model: str = "llama3.2:3b"
    ollama_timeout_seconds: int = 120
    database_url: str = "sqlite:///./chatbot.db"
    vector_store_dir: str = "./storage/chroma"
    upload_dir: str = "./storage/uploads"
    jwt_secret_key: str = "mindvault-super-secret-change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 1440
    frontend_origin: str = "http://localhost:5173"
    chunk_size: int = 900
    chunk_overlap: int = 180
    retrieval_k: int = 5
    history_window: int = 8

    model_config = SettingsConfigDict(
        env_file=PROJECT_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def resolved_database_url(self) -> str:
        if self.database_url.startswith("sqlite:///") and self.database_url.endswith("chatbot.db"):
            return f"sqlite:///{(PROJECT_ROOT / 'backend' / 'chatbot.db').as_posix()}"
        return self.database_url

    @property
    def resolved_vector_store_dir(self) -> Path:
        value = Path(self.vector_store_dir)
        return value if value.is_absolute() else PROJECT_ROOT / "backend" / value

    @property
    def resolved_upload_dir(self) -> Path:
        value = Path(self.upload_dir)
        return value if value.is_absolute() else PROJECT_ROOT / "backend" / value


settings = Settings()
