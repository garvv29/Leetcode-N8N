# Autonomous LeetCode AI Automation

An automated LeetCode workflow that retrieves the Daily Problem, generates a C++ solution using an LLM, submits it through Playwright, retries failed solutions using submission feedback, stores workflow data in MongoDB, archives accepted solutions to Markdown, pushes the archive to GitHub, and sends the result through Telegram.

The project is orchestrated locally using n8n and currently uses a Windows Chrome + CDP environment for reliable LeetCode browser access.

---

## Features

- Fetches the LeetCode Daily Problem automatically
- Extracts problem title, date, difficulty, description, and URL
- Generates C++ solutions using Groq
- Uses Playwright to interact with LeetCode
- Connects to Chrome through Chrome DevTools Protocol (CDP)
- Inserts code directly into Monaco Editor
- Submits solutions to LeetCode
- Detects submission results
- Collects feedback from failed submissions
- Automatically asks the LLM to debug failed solutions
- Supports up to 3 submission attempts
- Prevents duplicate solving of already accepted Daily Problems
- Stores problems, solutions, submissions, and workflow runs in MongoDB
- Creates Markdown archives of accepted solutions
- Commits and pushes archives to GitHub
- Sends workflow results through Telegram
- Uses n8n for scheduling and orchestration
- Includes Docker setup for MongoDB and n8n

---

## Architecture

```text
                    n8n
                     │
              Schedule Trigger
                     │
                     ▼
              HTTP POST /run
                     │
                     ▼
            Node.js Automation
                     │
          ┌──────────┴──────────┐
          │                     │
          ▼                     ▼
      MongoDB              Playwright
                                  │
                                  ▼
                              Chrome/CDP
                                  │
                                  ▼
                              LeetCode
                                  │
                        ┌─────────┴─────────┐
                        │                   │
                     Accepted             Failed
                        │                   │
                        ▼                   ▼
                    Archive             Feedback
                        │                   │
                        ▼                   ▼
                     GitHub             Groq Debug
                                            │
                                            ▼
                                      Retry Submission
                        │
                        ▼
                    Telegram
```

---

## Tech Stack

### Backend / Automation

- Node.js
- TypeScript
- Express
- Playwright
- Chrome DevTools Protocol
- MongoDB
- Mongoose

### AI

- Groq API
- `openai/gpt-oss-120b`

### Workflow

- n8n
- Telegram Bot API

### Storage / Version Control

- MongoDB
- Markdown
- Git
- GitHub

### Infrastructure

- Docker
- Docker Compose

---

## Project Structure

```text
Leetcode Automation/
│
├── src/
│   ├── browser/
│   │   ├── chrome.ts
│   │   ├── leetcode.ts
│   │   └── submission.ts
│   │
│   ├── db/
│   │   ├── connection.ts
│   │   ├── index.ts
│   │   └── models/
│   │       ├── Problem.ts
│   │       ├── Solution.ts
│   │       ├── Submission.ts
│   │       └── WorkflowRun.ts
│   │
│   ├── services/
│   │   ├── archiveService.ts
│   │   ├── githubService.ts
│   │   ├── problemService.ts
│   │   ├── solutionService.ts
│   │   ├── submissionService.ts
│   │   └── workflowService.ts
│   │
│   ├── automation.ts
│   ├── browser.ts
│   ├── ollama.ts
│   └── server.ts
│
├── tests/
│   ├── archive.test.ts
│   ├── db-clean.test.ts
│   ├── db.test.ts
│   └── github.test.ts
│
├── archive/
│
├── n8n/
│   └── docker-compose.yml
│
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

# How It Works

## 1. Daily Problem Retrieval

The automation opens LeetCode and retrieves the Daily Problem through LeetCode's GraphQL endpoint.

```text
LeetCode
    ↓
Daily Problem
    ↓
Problem metadata
    ↓
MongoDB
```

---

## 2. Duplicate Protection

Before generating a solution, MongoDB is checked for an existing accepted submission.

```text
Already accepted?
      │
   ┌──┴──┐
  YES    NO
   │      │
   ▼      ▼
 Skip   Generate
```

If the problem has already been accepted, the workflow returns:

```text
ALREADY_ACCEPTED
```

and skips generation and submission.

---

## 3. AI Solution Generation

The problem description is sent to the configured Groq model.

The model generates a C++ solution.

Generated code is cleaned and validated before it is submitted.

---

## 4. Monaco Editor

LeetCode uses Monaco Editor.

Instead of relying on keyboard simulation, the automation accesses Monaco's editor API and replaces the model contents directly.

```text
Generated C++
      ↓
Monaco model.setValue()
      ↓
LeetCode Editor
```

---

## 5. Submission

The generated solution is submitted through the normal LeetCode UI.

The automation waits for the submission result and handles statuses such as:

```text
ACCEPTED
WRONG_ANSWER
COMPILE_ERROR
```

---

## 6. Automatic Debugging

If a submission fails:

```text
Submission
    ↓
Feedback
    ↓
Groq
    ↓
Corrected Solution
    ↓
LeetCode
```

The workflow allows a maximum of 3 attempts.

---

## 7. MongoDB Persistence

The following information is stored in MongoDB:

```text
Problem
Solution
Submission
WorkflowRun
```

This allows previous problems, generated solutions, attempts, and workflow states to be tracked.

---

## 8. Markdown Archive

After an accepted solution, a Markdown file is generated:

```text
archive/
└── 2026-10-06-minimum-add-to-make-parentheses-valid.md
```

The archive contains:

- Problem
- Date
- Difficulty
- LeetCode URL
- Language
- Model
- Status
- Number of attempts
- Final solution

---

## 9. GitHub Integration

The generated archive is automatically:

```text
git add
   ↓
git commit
   ↓
git push
```

Commit messages use the format:

```text
chore: add LeetCode solution for YYYY-MM-DD - Problem Title
```

---

## 10. Telegram Notifications

n8n receives the automation result and routes it according to the returned status:

```text
ACCEPTED
ALREADY_ACCEPTED
FAILED
```

The appropriate Telegram notification is then sent.

---

# Installation

## Requirements

- Node.js 22+
- npm
- Git
- Docker Desktop
- Google Chrome
- MongoDB
- Groq API key
- Telegram bot
- n8n

---

## Clone the Repository

```bash
git clone <your-repository-url>
cd "Leetcode Automation"
```

Install dependencies:

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
GROQ_API_KEY=your_groq_api_key
MONGODB_URI=mongodb://127.0.0.1:27017/leetcode_automation
```

Never commit `.env`.

---

# Build

Compile TypeScript:

```bash
npm run build
```

---

# Run the API

Start the Express API:

```bash
node dist/server.js
```

The API runs on:

```text
http://localhost:3000
```

Health check:

```text
GET /health
```

Automation endpoint:

```text
POST /run
```

---

# Manual Test

With the API running:

```powershell
Invoke-RestMethod -Method Post http://localhost:3000/run
```

Example response:

```json
{
  "status": "ALREADY_ACCEPTED",
  "problem": "Minimum Add to Make Parentheses Valid",
  "date": "2026-10-06",
  "attempts": 0
}
```

---

# Test Mode

A temporary forced execution mode is available for testing.

```powershell
$env:FORCE_RUN="true"
Invoke-RestMethod -Method Post http://localhost:3000/run
```

This allows the automation to execute even when today's problem already has an accepted submission.

Return to normal mode:

```powershell
Remove-Item Env:FORCE_RUN -ErrorAction SilentlyContinue
```

Do not enable `FORCE_RUN` for the normal scheduled workflow.

---

# n8n

n8n is used as the workflow scheduler and notification layer.

Current workflow:

```text
Schedule Trigger
        ↓
HTTP Request
        ↓
Switch
   ┌────┼──────────────┐
   │    │              │
   ▼    ▼              ▼
ACCEPTED
ALREADY_ACCEPTED
FAILED
   │    │              │
   └────┴──────────────┘
             ↓
          Telegram
```

When n8n runs inside Docker and the Node API runs on Windows, the HTTP Request node uses:

```text
POST http://host.docker.internal:3000/run
```

n8n is available at:

```text
http://localhost:5678
```

---

# Docker

MongoDB can be started using:

```bash
docker compose up -d mongodb
```

Check running containers:

```bash
docker ps
```

n8n is run from the `n8n` directory:

```bash
cd n8n
docker compose up -d
```

---

# Browser Architecture

The currently reliable browser environment is:

```text
Windows
   ↓
Google Chrome
   ↓
Remote Debugging / CDP
   ↓
Playwright
   ↓
LeetCode
```

Chrome uses a persistent profile so the authenticated LeetCode session can be reused.

The Docker/cloud Chromium environment has been tested separately, but LeetCode/Cloudflare verification prevents the same authenticated workflow from being reliably established there.

---

# Automatic Startup on Windows

The Node API can be configured to start automatically when Windows starts using Windows Task Scheduler.

Create:

```text
start-automation.bat
```

with:

```bat
@echo off

cd /d "C:\Users\garvc\Desktop\Projects\Leetcode Automation"

node dist/server.js
```

Then create a Windows Task Scheduler task that runs the batch file at user logon.

This allows the API to keep running without VS Code being open.

---

# Current Status

| Component | Status |
|---|---|
| TypeScript project | Complete |
| Playwright | Complete |
| Chrome/CDP | Complete |
| Daily Problem retrieval | Complete |
| Groq solution generation | Complete |
| Monaco integration | Complete |
| LeetCode submission | Complete |
| Retry/debug loop | Complete |
| MongoDB | Complete |
| Duplicate protection | Complete |
| Markdown archive | Complete |
| GitHub integration | Complete |
| n8n | Complete |
| Telegram | Complete |
| Docker setup | Partial |
| Automatic Windows startup | Ready to configure |
| Cloud browser deployment | Experimental |

---



# Disclaimer

This project is an educational automation project.

It interacts with external services through browser automation and APIs. External services may change their interfaces, authentication requirements, or automation policies over time.

Use the project in accordance with the terms and policies of the services being accessed.

---

# Author

**Garv Choure**

Built to explore:

- Browser automation
- LLM-assisted coding
- Playwright
- Chrome DevTools Protocol
- n8n
- MongoDB
- Docker
- GitHub automation
- Telegram automation
