# RAG-LLM Chatbot

A full-stack chatbot application powered by Retrieval-Augmented Generation (RAG) and Large Language Models (LLMs). This project combines a Python FastAPI backend with a React frontend for intelligent document-based conversations.

## Features

- 🤖 **RAG-Powered Responses** - Retrieve and generate context-aware answers from uploaded documents
- 📄 **Document Upload** - Upload and process various document formats
- 💬 **Real-time Chat** - Interactive chat interface with streaming responses
- 🔐 **Authentication** - User login and secure session management
- 🎨 **Modern UI** - Built with React and Tailwind CSS
- 📊 **Vector Database** - Chroma for efficient document embedding storage

## Project Structure

```
chatbot/
├── backend/                    # Python FastAPI backend
│   ├── main.py                # Application entry point
│   ├── auth.py                # Authentication logic
│   ├── database.py            # Database configuration
│   ├── models.py              # Data models
│   ├── schemas.py             # Request/response schemas
│   ├── config.py              # Configuration settings
│   ├── rag_pipeline.py        # RAG pipeline implementation
│   ├── requirements.txt        # Python dependencies
│   ├── chatbot.db             # SQLite database
│   └── storage/               # File storage
│       ├── uploads/           # User uploaded documents
│       └── chroma/            # Vector database storage
│
├── frontend/                   # React Vite frontend
│   ├── src/
│   │   ├── main.jsx           # App entry point
│   │   ├── App.jsx            # Main app component
│   │   ├── index.css          # Global styles
│   │   ├── components/        # Reusable components
│   │   │   ├── ChatWindow.jsx
│   │   │   ├── InputArea.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── UploadModal.jsx
│   │   ├── pages/             # Page components
│   │   │   ├── Home.jsx
│   │   │   └── LoginPage.jsx
│   │   └── lib/
│   │       └── api.js         # API client
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── .gitignore
├── .env.example
└── README.md
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
# Windows
python -m venv .venv
.venv\Scripts\activate

# macOS/Linux
python -m venv .venv
source .venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

5. Run the backend server:
```bash
python main.py
```

The backend will start on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will start on `http://localhost:5173`

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Sign up or log in to your account
3. Upload documents in the chat interface
4. Ask questions about your uploaded documents
5. Receive AI-powered responses based on the document content

## API Endpoints

The backend provides the following main endpoints:

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration
- `POST /chat` - Send a chat message
- `POST /upload` - Upload a document
- `GET /documents` - List user's documents
- `DELETE /documents/{id}` - Delete a document

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database management
- **Chroma** - Vector database for embeddings
- **LangChain/LLM** - RAG and LLM integration

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client

## Configuration

Edit `.env` file to configure:
- Database connection
- LLM API keys
- Vector database settings
- CORS settings
- JWT secrets

## Contributing

1. Create a new branch for your feature
2. Make your changes
3. Commit with clear messages
4. Push and create a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions, please open an issue on GitHub.

---

