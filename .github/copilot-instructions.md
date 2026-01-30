# CareerFlow AI Coding Agent Instructions

## Architecture (big picture)
React + Vite SPA in [careerflow/frontend/](careerflow/frontend/) and Express + TypeScript API in [careerflow/backend/](careerflow/backend/). Core flow: profile.json → job scraping → match scoring → resume generation (OpenAI) → ATS form fill (Playwright) → audit log. Business intent lives in [Business_Model.md](Business_Model.md); enforcement mapping in [governance/Business_Model_To_Enforcement_Mapping.md](governance/Business_Model_To_Enforcement_Mapping.md).

## Critical conventions (project-specific)
- Immutable profile fields must never be AI-modified (name, email, phone, work auth, sponsorship, location, education). See [Business_Model.md](Business_Model.md#L42).
- Resume profile names must match `RESUME_PROFILE_NAME_REGEX` and limits in [careerflow/backend/src/types.ts](careerflow/backend/src/types.ts#L1).
- Queue processing defaults to `dryRun=true`; pause/resume on `CaptchaDetectedError` in [careerflow/backend/src/modules/queue/processor.ts](careerflow/backend/src/modules/queue/processor.ts).
- Audit logging is mandatory for ingests/submissions via `AuditService` in [careerflow/backend/src/services/audit.ts](careerflow/backend/src/services/audit.ts).

## ATS provider pattern (how to add one)
Supported providers are `greenhouse`, `lever`, `ashby` in `ATSProvider` ([careerflow/backend/src/types.ts](careerflow/backend/src/types.ts#L1)). To add a provider:
1) Extend `ATSProvider` and any switch logic in `ApplicationRunner` ([careerflow/backend/src/modules/submission/runner.ts](careerflow/backend/src/modules/submission/runner.ts)).
2) Add a scraper implementing `IScraper` in [careerflow/backend/src/modules/ingestion/](careerflow/backend/src/modules/ingestion/).
3) Add a submitter extending `BaseSubmitter` in [careerflow/backend/src/modules/submission/submitters/](careerflow/backend/src/modules/submission/submitters/).
4) Wire the submitter in `ApplicationRunner` and ensure job `atsProvider` values match the new enum.

## Dev workflows (local only)
- Backend: `npm run dev`, `npm run dev:watch`, `npm run restart` (port 3001). See [careerflow/backend/package.json](careerflow/backend/package.json).
- Frontend: `npm run dev`, `npm run build` (port 5173). See [careerflow/frontend/package.json](careerflow/frontend/package.json).
- Database: SQLite at [careerflow/backend/data/careerflow.db](careerflow/backend/data/careerflow.db), schema in [careerflow/backend/src/services/db.ts](careerflow/backend/src/services/db.ts).

## MCP servers (local)
Chrome DevTools MCP is for day-to-day debugging only (DOM inspection, network analysis, console debugging). Configuration lives in [.vscode/mcp.json](.vscode/mcp.json) and currently runs `chrome-devtools` via `npx -y chrome-devtools-mcp@latest`. When using Chrome DevTools MCP, ensure frontend and backend servers are running; if not, start them.

## Testing/verification
There is no formal test runner yet; verification scripts live in [careerflow/backend/src/verify-*.ts](careerflow/backend/src/). Use them for targeted checks during changes.

## Environment configuration
Backend reads `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`, `LOG_LEVEL` (see [careerflow/backend/src/services/llm.ts](careerflow/backend/src/services/llm.ts) and [careerflow/backend/src/services/logger.ts](careerflow/backend/src/services/logger.ts)). Frontend reads `VITE_DEV_MODE` (see [careerflow/frontend/src/components/Profile/ProfilePage.tsx](careerflow/frontend/src/components/Profile/ProfilePage.tsx)). Create per-folder .env files in backend and frontend.

## API conventions
`POST /api/profile` performs partial merges; use `?skipContactValidation=true` for resume-only updates (see [careerflow/backend/src/server.ts](careerflow/backend/src/server.ts)). Phone format is `(XXX) XXX-XXXX` with email validation in the same file.
