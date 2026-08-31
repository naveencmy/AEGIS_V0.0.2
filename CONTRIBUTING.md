# Contributing to AEGIS-NTRO

Thank you for your interest in contributing to **AEGIS-NTRO** (*Autonomous Enterprise Guard for Intelligence & Sovereignty*).

AEGIS-NTRO is an open-source, sovereign, citation-native multi-vendor network compliance auditing platform engineered for defense and national research infrastructure environments. We welcome contributions from security engineers, DevOps specialists, full-stack developers, and AI researchers worldwide!

---

## 🧭 Sovereign Architectural Invariants

Every contribution **must** strictly adhere to the 5 core sovereign invariants of AEGIS-NTRO:

1. **PostgreSQL as the Sole Storage Engine**: No external vector DBs (Chroma, Pinecone, Qdrant) or cache/queue brokers (Redis, RabbitMQ). Use `pgvector` with HNSW indexes and `FOR UPDATE SKIP LOCKED` async worker queues.
2. **Citation-or-Silence Contract**: Zero-hallucination guarantee. Every compliance finding or regulatory answer must provide exact publication titles, control IDs, section references, and page numbers verified against PostgreSQL ground truth.
3. **Multi-Vendor Configuration Ingestion**: Robust, streaming AST parsers for Cisco IOS/ASA, Palo Alto PAN-OS XML, Juniper JunOS Set syntax, and Fortinet FortiOS configs without requiring cloud parsing APIs.
4. **100% Air-Gapped Local Inference**: Local GBNF-grammar-constrained LLM reasoning (Mistral-7B / llama.cpp) and local embedding models (`BAAI/bge-m3`). Outbound cloud AI calls are prohibited.
5. **OWASP LLM Top 10 Defenses**: All user inputs, device banners, and ad-hoc queries must pass through injection sanitizers before reaching the reasoning layer.

---

## 🛠️ Local Development Setup

### 1. Prerequisites
- **Python 3.11+**
- **Poetry** (or pip)
- **Node.js 20+** & **npm 10+**
- **Docker & Docker Compose** (or native PostgreSQL 16 with `pgvector` extension)
- **Git**

### 2. Fork & Clone Repository
```bash
git clone https://github.com/<your-username>/AEGIS.git
cd AEGIS_V0.1
```

### 3. Backend Setup
```bash
# 1. Activate virtual environment
python -m venv .venv
# On Windows (PowerShell):
.venv\Scripts\Activate.ps1
# On Linux / macOS:
source .venv/bin/activate

# 2. Install dependencies via Poetry
pip install poetry
poetry install

# 3. Copy environment configuration
cp .env.example .env
```

### 4. Database Setup (Docker pgvector)
```bash
# Start PostgreSQL 16 + pgvector container
docker-compose up -d postgres

# Apply database migrations
poetry run alembic upgrade head

# (Optional) Seed standard regulatory frameworks (NIST, CIS, ISO, PCI-DSS)
poetry run python populate_collections.py
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend is available at `http://localhost:3000` (or `http://localhost:5173`).

### 6. Start the Backend API
In the project root (with `.venv` activated):
```bash
poetry run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API Swagger documentation is available at `http://localhost:8000/docs`.

---

## 🌿 Branching & Git Commit Conventions

We follow the **[Conventional Commits Specification](https://www.conventionalcommits.org/)**:

| Type | Description | Example |
|---|---|---|
| `feat` | A new feature or vendor parser capability | `feat(parser): add JunOS hierarchical BGP policy parser` |
| `fix` | A bug fix or security mitigation | `fix(rag): correct cosine similarity threshold on HNSW index` |
| `docs` | Documentation updates only | `docs(readme): add Kubernetes Helm deployment guide` |
| `test` | Adding or updating tests | `test(audit): add CIS v8 Palo Alto firewall test cases` |
| `refactor` | Code restructuring without feature change | `refactor(db): streamline async session generator in deps` |
| `perf` | Performance or query latency improvement | `perf(pgvector): tune HNSW ef_search parameter during RRF` |
| `ci` | CI/CD pipeline modifications | `ci(github): add Ruff and Mypy automated gating jobs` |

### Branch Naming Scheme
- `feat/<short-feature-name>` (e.g. `feat/fortinet-ssl-vpn-rules`)
- `fix/<short-bug-description>` (e.g. `fix/owasp-jailbreak-filter`)
- `docs/<doc-topic>` (e.g. `docs/architecture-deep-dive`)

---

## 🧪 Testing & Quality Assurance

All pull requests must pass the automated testing and linting suite prior to review:

### 1. Code Formatting & Linting
```bash
# Check code style with Ruff
poetry run ruff check backend/

# Format code
poetry run ruff format backend/

# Run Static Type Checking
poetry run mypy backend/
```

### 2. Unit & Integration Tests
```bash
poetry run pytest backend/tests/ -v
```

### 3. Frontend Lint & Production Build Test
```bash
cd frontend
npm run build
cd ..
```

---

## 📐 Code Style & Conventions

### Python (Backend)
- Adhere strictly to **PEP 8** and **Ruff** formatting standards (line length 100).
- Explicit type annotations on all function signatures using Pydantic v2 schemas and standard typing constructs.
- Use `async/await` syntax for all I/O operations, database queries, and parser feeds.
- Structured logging using `structlog` (`logger = structlog.get_logger(__name__)`).

### React / Vite (Frontend)
- Clean, modular React 18 functional components with Tailwind CSS utility styling.
- Retain the dark sovereign aesthetic (Obsidian `#0A0E17`, Indigo `#6366F1`, Cyan `#06B6D4`, Slate `#1E293B`).
- All interactive tables and badges must have proper ARIA accessibility and responsive mobile breakpoints.

---

## 📋 Pull Request (PR) Submission Checklist

Before submitting your PR, please verify:
- [ ] Code strictly follows the 5 Sovereign Invariants.
- [ ] All automated tests pass (`poetry run pytest`).
- [ ] Code is linted and type-checked (`poetry run ruff check`, `poetry run mypy`).
- [ ] Frontend builds cleanly with zero errors (`npm run build`).
- [ ] No secrets, private IPs, credentials, or `.env` files are committed.
- [ ] Relevant documentation or docstrings have been added/updated.
- [ ] Conventional commit messages are used.

---

## 🔒 Security Vulnerabilities

If you discover a security vulnerability, please do **NOT** file a public issue. Follow our [Security Policy](SECURITY.md) and email `security@aegis-ntro.local` or open a private GitHub Security Advisory.

---

## 📄 License

By contributing to AEGIS-NTRO, you agree that your contributions will be licensed under the [Apache License 2.0](LICENSE).
