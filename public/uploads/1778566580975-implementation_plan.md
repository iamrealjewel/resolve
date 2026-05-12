# Aegis-ROCm — Implementation Plan
## Multi-Agent Security Audit & CUDA→ROCm Refactoring Platform

A greenfield Python project at `d:\Projects\Aegis-ROCm` that orchestrates specialized AI agents to (1) audit PyTorch/Python codebases for security vulnerabilities and (2) automatically refactor CUDA-specific code to ROCm-compatible equivalents, surfaced through a FastAPI backend and a premium real-time dashboard UI.

---

## User Review Required

> [!IMPORTANT]
> **LLM Provider Choice** — The agent backbone requires an LLM. This plan uses **Google Gemini 1.5 Pro** (via `google-generativeai`) as the default because it has a generous free tier and 1M-token context window useful for large file audits. It can be swapped for OpenAI GPT-4o or a local Ollama model with one config change. Please confirm or specify your preferred provider.

> [!IMPORTANT]
> **AMD Developer Cloud Credentials** — The verification stage requires SSH access to an AMD Developer Cloud VM (MI300X). This plan provisions a VM via SSH and runs the refactored code there. You will need to:
> 1. Create an account at [developer.amd.com/amd-developer-cloud](https://developer.amd.com/amd-developer-cloud)
> 2. Generate and upload an SSH public key
> 3. Save the private key path + VM IP as env vars (`ADC_SSH_KEY`, `ADC_HOST`)

> [!WARNING]
> **No existing codebase** — `d:\Projects\Aegis-ROCm` is currently empty. The plan creates the *platform* itself. To test it end-to-end, a sample CUDA/PyTorch target repo is included in `samples/` (a minimal ResNet training script with intentional vulnerabilities).

---

## Open Questions

> [!NOTE]
> 1. **Agent autonomy level** — Should agents auto-apply fixes to the uploaded code, or should every change be a "suggested diff" that you approve in the UI?  
>    *Planned default: suggest-only with a one-click "Apply All" button.*
> 2. **Persistence** — Should audit reports be stored in a SQLite DB (simple, zero-ops) or PostgreSQL?  
>    *Planned default: SQLite via SQLAlchemy.*
> 3. **Authentication** — Does the dashboard need a login/auth layer?  
>    *Planned default: No auth (localhost dev), easily extensible.*
> 4. **Target code input method** — Upload ZIP, paste a GitHub URL, or point to a local path?  
>    *Planned default: All three, selectable in the UI.*

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Browser Dashboard                     │
│              (Vanilla HTML/CSS/JS — SSE live feed)        │
└──────────────────────┬───────────────────────────────────┘
                       │  HTTP / WebSocket
┌──────────────────────▼───────────────────────────────────┐
│                   FastAPI Backend                          │
│  /upload  /audit  /status/{job_id}  /report/{job_id}      │
│  /apply-fixes  /verify  /stream/{job_id} (SSE)            │
└──────────────────────┬───────────────────────────────────┘
                       │  Python async calls
┌──────────────────────▼───────────────────────────────────┐
│            LangGraph Orchestration Layer                   │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Supervisor Agent  (routes tasks, merges outputs)   │  │
│  └──┬──────────┬──────────┬──────────┬────────────────┘  │
│     │          │          │          │                     │
│  ┌──▼──┐  ┌───▼───┐  ┌───▼───┐  ┌──▼──────────────────┐ │
│  │ 🔍  │  │  🛡️   │  │  🔄   │  │  ✅                  │ │
│  │ AST │  │Security│  │ROCm   │  │ Verifier             │ │
│  │Scan │  │Auditor │  │Migrator│  │ (AMD Dev Cloud SSH)  │ │
│  │Agent│  │Agent  │  │Agent  │  │ Agent                │ │
│  └─────┘  └───────┘  └───────┘  └──────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                       │
           ┌───────────▼───────────┐
           │    SQLite DB          │
           │  (jobs, findings,     │
           │   diffs, reports)     │
           └───────────────────────┘
```

---

## Proposed Changes

### Component 1 — Project Scaffolding

#### [NEW] Project Root Structure
```
d:\Projects\Aegis-ROCm\
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Env-driven settings (pydantic-settings)
│   ├── database.py              # SQLAlchemy models + SQLite engine
│   ├── routers/
│   │   ├── upload.py            # POST /upload (ZIP / GitHub URL / local path)
│   │   ├── audit.py             # POST /audit, GET /status/{id}, GET /report/{id}
│   │   ├── fixes.py             # POST /apply-fixes
│   │   └── verify.py            # POST /verify (AMD Dev Cloud)
│   ├── agents/
│   │   ├── supervisor.py        # LangGraph StateGraph + routing
│   │   ├── ast_scanner.py       # Agent 1: AST + static analysis
│   │   ├── security_auditor.py  # Agent 2: LLM-powered vuln detection
│   │   ├── rocm_migrator.py     # Agent 3: CUDA→ROCm refactoring
│   │   └── verifier.py          # Agent 4: AMD Developer Cloud SSH runner
│   ├── tools/
│   │   ├── bandit_runner.py     # Wrapper around `bandit` CLI
│   │   ├── ast_utils.py         # Python AST traversal helpers
│   │   ├── hipify_rules.py      # CUDA→HIP pattern replacement table
│   │   ├── diff_utils.py        # Unified diff generation
│   │   └── ssh_runner.py        # Paramiko SSH executor
│   └── schemas.py               # Pydantic request/response models
├── frontend/
│   ├── index.html               # Dashboard shell
│   ├── app.js                   # SSE client + UI logic
│   └── style.css                # Premium dark dashboard CSS
├── samples/
│   └── cuda_sample/             # Sample CUDA/PyTorch project for demo
│       ├── train.py
│       ├── model.py
│       └── requirements.txt
├── .env.example
├── requirements.txt
└── README.md
```

---

### Component 2 — Backend Core (`backend/`)

#### [NEW] `main.py`
- Creates FastAPI app, mounts `frontend/` as static files
- Registers all routers
- Starts SQLite DB on startup (`database.py`)
- Exposes `GET /stream/{job_id}` as a **Server-Sent Events** endpoint that streams real-time agent logs to the UI

#### [NEW] `database.py`
Models:
| Table | Key Columns |
|---|---|
| `jobs` | `id`, `status`, `source_path`, `created_at` |
| `findings` | `id`, `job_id`, `agent`, `severity`, `file`, `line`, `message`, `cwe_id` |
| `diffs` | `id`, `job_id`, `file`, `original`, `refactored` |
| `reports` | `id`, `job_id`, `summary_json`, `created_at` |

#### [NEW] `config.py`
Pydantic-settings model reading from `.env`:
- `LLM_PROVIDER` (gemini / openai / ollama)
- `GOOGLE_API_KEY` / `OPENAI_API_KEY`
- `ADC_HOST` / `ADC_SSH_KEY` / `ADC_USER`
- `UPLOAD_DIR` / `DB_URL`

#### [NEW] `schemas.py`
Pydantic models for all request/response shapes (AuditRequest, FindingOut, DiffOut, ReportOut, JobStatus, VerifyResult)

---

### Component 3 — The Four Agents

#### [NEW] `agents/supervisor.py` — **Supervisor Agent**
- LangGraph `StateGraph` with shared `AuditState` (TypedDict)
- State carries: `job_id`, `source_files`, `findings[]`, `diffs[]`, `agent_logs[]`, `phase`
- Routing logic: AST Scanner → Security Auditor → ROCm Migrator → Verifier → END
- Each node appends to `agent_logs` for SSE streaming

**`AuditState` shape:**
```python
class AuditState(TypedDict):
    job_id: str
    source_files: dict[str, str]   # filename → content
    findings: list[Finding]
    diffs: list[FileDiff]
    agent_logs: Annotated[list[str], operator.add]
    phase: Literal["scan","audit","migrate","verify","done"]
```

---

#### [NEW] `agents/ast_scanner.py` — **Agent 1: AST & Static Scanner**
**Responsibilities:**
- Parse every `.py` file using Python's `ast` module
- Detect: hardcoded secrets, `eval()`/`exec()` usage, unsafe pickle/YAML loads, shell injection via `subprocess.call(shell=True)`, insecure RNG (`random` for security), missing input validation
- Run `bandit` via `tools/bandit_runner.py` for CWE-mapped findings
- Emit structured `Finding` objects with `severity`, `file`, `line`, `cwe_id`, `message`

**Key detection patterns:**
| Pattern | CWE | Severity |
|---|---|---|
| `eval(user_input)` | CWE-95 | CRITICAL |
| `pickle.load(f)` | CWE-502 | HIGH |
| `subprocess(shell=True)` | CWE-78 | HIGH |
| Hardcoded password/token string | CWE-798 | HIGH |
| `yaml.load()` without Loader | CWE-20 | MEDIUM |
| `random.random()` for secrets | CWE-338 | MEDIUM |
| `torch.load()` without `weights_only` | CWE-502 | HIGH |

---

#### [NEW] `agents/security_auditor.py` — **Agent 2: LLM Security Auditor**
**Responsibilities:**
- Takes all source files + AST findings as context
- Submits each file to the LLM with a structured security audit prompt
- Identifies: logic flaws, missing authorization checks, data leakage, insecure model serialization, adversarial input paths
- Returns additional findings not caught by static analysis
- Generates a human-readable **severity summary** per file

**LLM Prompt Strategy:**
- System prompt: "You are an expert ML security auditor. Analyze the following Python/PyTorch code..."
- Structured output enforced via Pydantic `output_parser` → list of `Finding`
- Batches files to stay within context window limits

---

#### [NEW] `agents/rocm_migrator.py` — **Agent 3: ROCm Migrator**
**Responsibilities (two-pass approach):**

**Pass 1 — Rule-Based (`tools/hipify_rules.py`):**
Deterministic regex/AST replacement of known CUDA→HIP/ROCm mappings:

| CUDA Pattern | ROCm Equivalent | Notes |
|---|---|---|
| `torch.cuda.is_available()` | Unchanged (ROCm aliased) | No change needed |
| `device = "cuda"` | `device = "cuda"` | No change needed |
| `.cu`/`.cuh` custom kernels | `hipify-perl` → `.hip` | Flags for manual review |
| `cudaMalloc` | `hipMalloc` | In `.cu` files |
| `cudaMemcpy` | `hipMemcpy` | In `.cu` files |
| `__CUDA_ARCH__` | `__HIP_ARCH__` | Preprocessor macros |
| `cuBLAS` | `rocBLAS` | Library swap |
| `cuDNN` | `MIOpen` | Library swap |
| `torch.cuda.amp.autocast()` | Unchanged | Supported in ROCm |
| `apex.amp` | `torch.amp` (native) | Deprecation fix |
| `torch.load(path)` | `torch.load(path, weights_only=True)` | Security + compatibility |
| NVIDIA-specific `pip` deps | ROCm wheel URLs | `requirements.txt` update |

**Pass 2 — LLM-Assisted (for ambiguous cases):**
- Files flagged as "needs review" (custom kernels, PTX code, proprietary NVIDIA libs) are sent to the LLM for guided migration advice
- Output: annotated diff with inline comments explaining each change

**Output:** `FileDiff` objects (original vs. refactored) stored in DB, displayed as side-by-side diff in UI

---

#### [NEW] `agents/verifier.py` — **Agent 4: AMD Developer Cloud Verifier**
**Responsibilities:**
- Connect to AMD Developer Cloud VM via SSH (`paramiko`, `tools/ssh_runner.py`)
- Transfer refactored code via SFTP
- Execute a validation script remotely:
  ```bash
  python -c "import torch; print(torch.cuda.is_available()); print(torch.version.hip)"
  python train.py --dry-run --epochs 1
  rocm-smi
  ```
- Capture `stdout`/`stderr` and GPU metrics
- Return `VerifyResult` with pass/fail status + full log

> [!NOTE]
> If no AMD Developer Cloud VM is configured (env vars absent), the Verifier agent enters **simulation mode** — it validates syntax, imports, and runs a dry-run locally without a GPU.

---

### Component 4 — FastAPI Routers

#### [NEW] `routers/upload.py`
- `POST /upload/zip` — multipart file upload, extracts to `UPLOAD_DIR/{job_id}/`
- `POST /upload/github` — clones a GitHub URL using `gitpython`
- `POST /upload/local` — accepts a local directory path string

#### [NEW] `routers/audit.py`
- `POST /audit` body: `{ job_id, options: { run_llm_audit, run_migration, run_verify } }`
- Spawns the LangGraph graph in a background `asyncio.Task`
- `GET /status/{job_id}` → `JobStatus` (phase, progress %, finding count)
- `GET /report/{job_id}` → full `ReportOut` with all findings, diffs, verify result
- `GET /stream/{job_id}` → SSE stream of `agent_logs` as they're appended

#### [NEW] `routers/fixes.py`
- `POST /apply-fixes` body: `{ job_id, file_ids: list[str] }` — writes refactored content back to disk

#### [NEW] `routers/verify.py`
- `POST /verify` body: `{ job_id }` — re-runs only the Verifier agent on already-migrated code

---

### Component 5 — Tools

#### [NEW] `tools/hipify_rules.py`
A declarative table of `(pattern, replacement, notes)` tuples organized by category:
- PyTorch API aliases
- C++ CUDA API → HIP API
- Library substitutions
- `requirements.txt` package substitutions

#### [NEW] `tools/ssh_runner.py`
Paramiko-based async SSH executor:
```python
async def run_remote(host, user, key_path, commands: list[str]) -> RemoteResult
async def upload_dir(host, user, key_path, local_dir, remote_dir) -> None
```

#### [NEW] `tools/diff_utils.py`
- `unified_diff(original, refactored, filename)` → string
- `FileDiff` model with `additions`, `deletions`, `hunks`

---

### Component 6 — Frontend Dashboard (`frontend/`)

#### [NEW] `frontend/index.html` + `style.css` + `app.js`

**Design:** Dark glassmorphism dashboard with AMD-red accent (`#FF0000` → `#CC0000` gradient). Premium feel with smooth animations.

**Layout — 4-panel dashboard:**

```
┌─────────────────────────────────────────────────────────┐
│  🛡️  Aegis-ROCm  [Upload] [New Audit]      ● Live       │  ← Header
├──────────────┬──────────────────────────────────────────┤
│              │  ┌─── Agent Progress ───────────────────┐ │
│  File Tree   │  │  AST Scanner   ████████░░  80%       │ │
│  (uploaded   │  │  Security AI   ████░░░░░░  40%       │ │
│   project)   │  │  ROCm Migrator ░░░░░░░░░░   0%       │ │
│              │  │  AMD Verifier  ░░░░░░░░░░   0%       │ │
│              │  └───────────────────────────────────────┘ │
│              │  ┌─── Live Agent Log ───────────────────┐ │
│              │  │  [AST] train.py:42 eval() — CWE-95   │ │
│              │  │  [SEC] Unsafe pickle.load detected... │ │
│              │  │  [MIG] Replacing apex.amp with torch  │ │
│              │  └───────────────────────────────────────┘ │
├──────────────┴──────────────────────────────────────────┤
│  Findings Table  │  Diff Viewer  │  Verify Console       │  ← Tabs
│  (sortable,      │  (split       │  (SSH output +        │
│   filterable     │   side-by-    │   rocm-smi output)    │
│   by severity)   │   side view)  │                       │
└─────────────────────────────────────────────────────────┘
```

**Key UI Features:**
- **Drag & Drop upload zone** for ZIP files
- **Real-time SSE log feed** with color-coded severity badges
- **Side-by-side diff viewer** with syntax highlighting (Prism.js)
- **Findings table** with CWE IDs, sortable by severity (CRITICAL → LOW)
- **AMD Verify console** showing `rocm-smi` output + test run results
- **Export Report** button → downloads JSON or PDF-style HTML report
- Smooth CSS entrance animations, hover micro-interactions on all cards

---

### Component 7 — Sample Target Codebase (`samples/`)

#### [NEW] `samples/cuda_sample/train.py`
Intentionally includes:
- `torch.load(path)` without `weights_only=True` (CWE-502)
- `eval(user_input)` (CWE-95)
- Hardcoded API key string (CWE-798)
- `apex.amp` usage (deprecated, not ROCm-compatible)
- Custom CUDA kernel call
- `device = "cuda:0"` hardcoded (should be device-agnostic)

---

### Component 8 — Configuration & Packaging

#### [NEW] `requirements.txt`
```
fastapi>=0.111.0
uvicorn[standard]>=0.29.0
python-multipart>=0.0.9
sqlalchemy>=2.0.30
aiosqlite>=0.20.0
pydantic-settings>=2.2.1
langgraph>=0.1.14
langchain-google-genai>=1.0.3   # or langchain-openai
bandit>=1.7.9
gitpython>=3.1.43
paramiko>=3.4.0
prism (via CDN in HTML)
```

#### [NEW] `.env.example`
```
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your-key-here
ADC_HOST=your-vm-ip
ADC_USER=ubuntu
ADC_SSH_KEY=~/.ssh/adc_key
UPLOAD_DIR=./uploads
DB_URL=sqlite+aiosqlite:///./aegis.db
```

#### [NEW] `README.md`
Full setup guide including AMD Developer Cloud VM provisioning steps.

---

## Verification Plan

### Automated / Local Tests
1. **Unit tests** for `hipify_rules.py` — assert each CUDA pattern maps to correct HIP equivalent
2. **Integration test** — upload `samples/cuda_sample/`, run full audit, assert ≥5 findings and ≥3 diffs produced
3. **API smoke tests** — `pytest` with `httpx.AsyncClient` for all FastAPI endpoints

### Browser Verification
After `uvicorn backend.main:app --reload`:
- Open `http://localhost:8000` in browser subagent
- Upload the sample CUDA project
- Start an audit and confirm SSE log stream appears
- Verify findings table populates with severity badges
- Confirm diff viewer renders side-by-side changes

### AMD Developer Cloud Verification
1. Provision MI300X VM (Quick Start → PyTorch ROCm image)
2. Set env vars `ADC_HOST`, `ADC_SSH_KEY`
3. Trigger `/verify` endpoint from UI
4. Confirm `torch.cuda.is_available()` returns `True` on AMD hardware
5. Confirm `torch.version.hip` is present (non-None)
6. Confirm `rocm-smi` output shows GPU with non-zero memory utilization

---

## Implementation Sequence

| Phase | Work | Est. Effort |
|---|---|---|
| 1 | Project scaffold + DB + config | Small |
| 2 | AST Scanner agent + bandit integration | Medium |
| 3 | ROCm Migrator agent (rule-based pass) | Medium |
| 4 | FastAPI routers + SSE stream | Medium |
| 5 | Security Auditor agent (LLM pass) | Medium |
| 6 | Frontend dashboard (HTML/CSS/JS) | Large |
| 7 | AMD Developer Cloud Verifier agent | Medium |
| 8 | Sample CUDA project + end-to-end test | Small |
