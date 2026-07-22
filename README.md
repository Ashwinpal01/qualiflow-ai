# AI Sales Agent 🚀

An intelligent, AI-powered lead qualification and CRM sales workflow automation agent built with **FastAPI**, **SQLAlchemy**, and **LLMs**.

---

## 🌟 Features

- **Lead Scoring Engine**: Automatically scores inbound leads based on budget, company size, timeline, and problem match.
- **Intent Classification**: Uses LLM capabilities with keyword fallbacks to classify lead requirements (e.g. `ai_sales_agent`, `customer_support_automation`, `rag_document_chatbot`).
- **Knowledge Base Search**: Matches qualified leads to relevant service offerings and pricing tiers.
- **Personalized Email Generation**: Dynamically crafts tailored outreach emails based on lead score and intent.
- **RESTful API**: FastAPI server with automated docs (`/docs`) and health endpoints (`/api/health`).
- **Docker & GHCR Ready**: Containerized deployment with automated GitHub Actions CI/CD pipeline pushing to GitHub Container Registry (`ghcr.io`).

---

## 🏗️ Project Architecture

```text
ai-sales-agent/
├── .github/workflows/    # CI/CD pipeline for tests & GHCR deployment
│   └── ci-cd.yml
├── app/                  # Application source code
│   ├── api/routes/       # FastAPI route handlers (health, leads, agent)
│   ├── core/             # LLM client & configuration settings
│   ├── db/               # Database models & sessions (SQLAlchemy)
│   ├── schemas/          # Pydantic data schemas
│   ├── services/         # Business logic & workflow orchestration
│   ├── tools/            # Lead scoring, intent classification, email gen
│   └── main.py           # Application entrypoint
├── data/                 # Knowledge base & SQLite database
├── tests/                # Pytest unit & integration test suite
├── Dockerfile            # Container build specification
├── docker-compose.yml    # Compose configuration for local dev
└── requirements.txt      # Python dependencies
```

---

## 🚀 Quick Start (Local Setup)

### 1. Environment Setup
Copy `.env.example` to `.env` and set your credentials:
```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Run the Development Server
```bash
uvicorn app.main:app --reload --port 8000
```
Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser to access the Swagger UI documentation.

### 4. Run Tests
```bash
python -m pytest
```

---

## 🐳 Docker Setup

### Build & Run locally:
```bash
docker build -t ai-sales-agent:latest .
docker run -p 8000:8000 --env-file .env ai-sales-agent:latest
```

### Or using Docker Compose:
```bash
docker-compose up --build
```

---

## 📦 GitHub & GHCR Deployment Guide

This project includes a complete GitHub Actions CI/CD pipeline (`.github/workflows/ci-cd.yml`) that automatically runs unit tests and builds & pushes a Docker image to **GitHub Container Registry (`ghcr.io`)** on every push to `main` or `master`.

### Step 1: Create & Push to GitHub Repository

1. Create a new repository on GitHub named **`ai-sales-agent`** (or **`sales-crm-ai-agent`**).
2. Link your local repository and push:

```bash
# Rename default branch to main (if needed)
git branch -M main

# Add your remote repository (replace <USERNAME> with your GitHub username)
git remote add origin https://github.com/<USERNAME>/ai-sales-agent.git

# Stage and commit all files
git add .
git commit -m "feat: initial commit with test suite and GHCR CI/CD workflow"

# Push to GitHub
git push -u origin main
```

### Step 2: Automated GHCR Package Generation

Upon pushing to GitHub:
1. GitHub Actions will trigger `.github/workflows/ci-cd.yml`.
2. The `test` job runs `pytest` across all test modules.
3. The `build-and-push-docker` job builds the Docker image and publishes it to:
   `ghcr.io/<USERNAME>/ai-sales-agent:latest`

### Step 3: Pulling the Image from GHCR

To pull and run your published container image on any server:

```bash
# Log in to GHCR (requires a Personal Access Token with read:packages permission)
echo $CR_PAT | docker login ghcr.io -u <USERNAME> --password-stdin

# Pull the latest image
docker pull ghcr.io/<USERNAME>/ai-sales-agent:latest

# Run the container
docker run -d -p 8000:8000 --env-file .env ghcr.io/<USERNAME>/ai-sales-agent:latest
```

---

## 📄 License
MIT License
