# Repository Structure Analysis and Visualization System

## Project Description

A developer tool that scans a local Git repository and produces an interactive, node-graph visualization of its file structure and inter-file dependencies. Each node represents a file and is sized and colour-coded by lines of code; edges represent import/include relationships extracted statically (no code execution is required). Clicking any node triggers an AI-generated plain-English summary of that file's purpose, powered by the OpenRouter API and cached locally so repeated lookups are instant.

## Problem Statement

Understanding an unfamiliar codebase is slow and error-prone. Developers spend significant time tracing imports and mentally mapping how files connect before they can make their first confident change. This tool automates that mapping step, delivering a visual overview of the entire dependency graph in seconds. On-demand AI explanations of individual files provide the additional context needed to get up to speed quickly, without reading every file from top to bottom.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.9+ / Flask |
| CORS | flask-cors |
| HTTP client (AI calls) | requests |
| Frontend | React 18 / Vite |
| Graph rendering | React Flow (reactflow) |
| AI summaries | OpenRouter API (`openrouter/free` — auto-routes to an available free model) |
| Local summary cache | File-based JSON cache (backend/cache/) |

## Project Structure

```
repo-visualizer/
├── backend/
│   ├── scanner/
│   │   ├── __init__.py
│   │   ├── walker.py          # Recursive directory walker; counts lines of code
│   │   ├── parser.py          # Static import extractor (Python, JS/TS, C/C++)
│   │   └── graph_builder.py   # Assembles nodes + edges from walker + parser output
│   ├── ai/
│   │   ├── __init__.py
│   │   ├── cache.py           # SHA-256-keyed file-based JSON cache
│   │   └── summarizer.py      # OpenRouter API client + cache integration
│   ├── cache/                 # Runtime cache directory (git-ignored)
│   ├── app.py                 # Flask application entry point
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GraphCanvas.jsx   # React Flow canvas with dynamic node styling
│   │   │   ├── RepoForm.jsx      # Path input + scan trigger form
│   │   │   └── SummaryPanel.jsx  # Slide-in AI summary side panel
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Setup

### Prerequisites

- Python 3.9 or higher
- Node.js 18 or higher
- pip (comes with Python)
- npm (comes with Node.js)

### 1 — Clone and enter the project

```powershell
git clone <your-repo-url>
cd repo-visualizer
```

### 2 — Backend setup

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

> If `Activate.ps1` is blocked by execution policy, run this once:
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

### 3 — Configure the OpenRouter API key

```powershell
Copy-Item .env.example .env
```

Open `backend/.env` in your editor and add your key:

```
OPENROUTER_API_KEY=sk-or-...
```

Get a free key at [openrouter.ai](https://openrouter.ai). If you leave the key blank the app still works — AI summaries will display a mock placeholder instead of a real response.

### 4 — Frontend setup

```powershell
cd ..\frontend
npm install
```

## Running

You need two terminal windows open simultaneously.

**Terminal 1 — backend:**

```powershell
cd backend
venv\Scripts\Activate.ps1
python app.py
```

The API server starts on http://localhost:5000.

**Terminal 2 — frontend:**

```powershell
cd frontend
npm run dev
```

The dev server starts on http://localhost:5173.

### Using the app

1. Open **http://localhost:5173** in your browser.
2. Enter an absolute path to any local repository (e.g. `E:\projects\my-app`).
3. Click **Scan Repository**. The graph renders in a few seconds.
4. Pan and zoom the canvas freely. Node colour ranges from blue (small files) to red (large files).
5. Click any node to open the AI summary panel on the right. The first lookup calls the API; subsequent lookups for the same file content are served from the local cache instantly.

## Notes on the AI model

This project uses OpenRouter's `openrouter/free` router rather than a single fixed model slug. OpenRouter periodically retires specific free-tier models (e.g. `meta-llama/llama-3.1-8b-instruct:free` was deprecated mid-development), so the auto-router is used to avoid breaking on a stale model name. If you'd rather pin a specific model, check [openrouter.ai/models](https://openrouter.ai/models) for currently active free options and update the model string in `backend/ai/summarizer.py`.