> ⚠️ **DO NOT EDIT WITHOUT UPDATING ENFORCEMENT**
>
> This document defines business intent only.  
> It does NOT enforce behavior.
>
> Any change to this file that affects:
> - system behavior
> - automation logic
> - approval rules
> - auto-apply behavior
> - compliance, audit, or safety constraints
>
> **MUST** be accompanied by corresponding updates to:
> - AntiGravity Enforcement Rules
> - Relevant Workflows
> - Self-Audit / Violation Logic
>
> Changes made here without enforcement updates WILL result in undefined behavior and policy drift.

---

# Job Auto Apply - Business Model

## 1. Product Summary
Job Auto Apply is a job search and application automation system.  
It collects a user's profile, searches for jobs, generates tailored application materials, fills ATS application forms, and requests approval before final submission.

The system is designed to be deterministic, auditable, and human-in-the-loop by default.

Platform:
- Web application only (no native mobile app)
- Responsive design for mobile browser access

Language support:
- English (primary)
- Multi-language support planned: Spanish, French, German, Portuguese, Japanese, Mandarin Chinese
- UI localization and job matching in supported languages

---

## 2. Target Customer
- Primary user: Individuals actively seeking employment
- User segment: Anyone 18+
- Job types: Any role supported by allowed ATS platforms
- Primary pain: Applying for jobs is time-consuming and repetitive
- Alternatives today: Manual job applications

---

## 3. Core Value Proposition
- What we deliver: Automated, high-quality job applications at scale
- Why it matters: Reduces application time while maintaining quality
- Success metric: Increased interview callbacks
- Time saved target: ~20 hours per week

---

## 4. User Journey (Current System)

### 4.0 Authentication
- Authentication method: OAuth (Google, LinkedIn, or other supported providers)
- Email verification required before account activation
- Session management: Standard secure session handling
- Multi-device sessions: Supported (users may be logged in on multiple devices simultaneously)
- No password-based authentication; purely OAuth-based (no password reset flow)
- Session timeout: 24 hours of inactivity; maximum session duration 7 days
- Age verification: Honor-system (users must be 18+ per Terms of Service)

---

### 4.1 Entry
- Initial trigger: User-initiated action
- Command format:
  - `name: Full Name, search: Role1, Role2`
- Resume upload:
  - Supported formats: PDF (.pdf), Word (.doc, .docx)

---

### 4.2 Profile Capture (Canonical Store)
Storage: User Profile database

The profile contains two categories of data:

#### Admin Data (Immutable)
Captured at sign-in and stored in Settings. These are the only immutable fields:
- Full legal name (first name, last name)
- Email address

Admin data represents the **account owner** and is used for account notifications. It may not be modified after sign-in.

#### Profile Data (Mutable)
All other fields are user-editable on the Profile page.

**Note:** Profile data represents the **job applicant**, which may be a different individual than the account owner (e.g., a career coach managing applications for a client). Each account supports one applicant only, with multiple resume variants via Resume Profiles.

Required fields:
- base_resume (user's uploaded resume file)
- target_roles
- remote_preference
- linkedin_url

Optional fields:
- phone (format: `(XXX) XXX-XXXX`)
- location
- skills
- salary range
- work authorization / sponsorship
- portfolio or GitHub
- projects
- certifications
- accomplishments
- education history

#### Data Relationship
- `base_resume`: The original uploaded resume file, stored for reference
- `resumeSnapshot`: The editable version within each Resume Profile, derived from base_resume but independently modifiable

---

### 4.2.1 Resume Profiles
Storage: Resume Profiles within User Profile

Resume Profiles allow users to maintain multiple named resume variants for different job types or industries.

Profile naming rules:
- Lowercase letters only, separated by dashes (e.g., `software-engineering`, `data-science`)
- Maximum 34 characters per profile name
- Maximum 5 profiles per user
- Profile names must be unique
- Validated against `RESUME_PROFILE_NAME_REGEX`: `/^[a-z]+(-[a-z]+)*$/`

Profile limit enforcement:
- When a user reaches 5 profiles, creation is blocked
- User is prompted to delete an existing profile before creating a new one

Profile behavior:
- Each profile stores a `resumeSnapshot` containing experience, education, and skills
- Spaces typed in profile name automatically convert to dashes
- First save auto-creates a "default" profile if none exist
- Profile selection is required if any profiles exist
- Changes saved on Profile page sync to the active resume profile's snapshot
- `lastEditedProfileId` tracks which profile was most recently edited

Profile data isolation:
- Each profile's snapshot is independent
- Switching profiles loads that profile's snapshot data
- Main profile data (contact, preferences) is shared across all resume profiles

---

### 4.2.2 Self-Identification Data
Optional EEO/voluntary disclosure fields:
- Gender
- Veteran status
- Disability status
- Race/ethnicity

These fields are:
- User-provided only, never AI-inferred
- Used for ATS form completion when required (mapped from Profile page data)
- Optional and may be left blank

---

### 4.2.3 Settings Page
The Settings page displays Admin Data (read-only) and provides account management options:

**Notifications:**
- Email notifications for application submissions
- Email notifications for interview requests
- Email notifications for status changes
- Interview overlap detection: Alerts user if scheduled interviews conflict

Notification preferences:
- Users may opt in/out of each notification type individually
- All notifications enabled by default

**Calendar Integration:**
- Connects to user's external calendar (Google Calendar, Outlook)
- Reads interview events from connected calendar
- When user moves a job to "Interview" on the Kanban board, system creates calendar event in both app and user's external calendar (if not already set)

**Account Management:**
- Account deletion (permanently removes account and all associated data; no data export option)

---

### 4.3 Job Discovery
Sources:
- RemoteOK API
- Arbeitnow API

Filters:
- Role keyword match
- Skill keyword match
- Remote preference
- Salary range (when available)

Company blocklist:
- Users may block specific companies
- Blocked companies are excluded from all job discovery and matching
- Maximum 100 companies per user

Allowed ATS platforms:
- Greenhouse
- Lever
- Ashby

All other ATS platforms are excluded unless explicitly added.

Job expiration:
- System periodically checks if job postings are still active
- Expired or removed job postings are detected and marked as expired
- Expired jobs are removed from active queues and not processed

---

### 4.4 Job Intake and De-duplication
Storage: Job Applications database

Rules:
- Primary duplicate identifier: ATS job ID (if available)
- Fallback duplicate identifier: Exact job_url match
- Duplicate jobs are never processed twice per user

Re-apply policy:
- Users may not re-apply to a job they have already applied to
- Jobs rejected by the system (eligibility mismatch) may be manually overridden and resubmitted
- Jobs rejected by the employer are final and cannot be re-applied through the system

Stored fields:
- application_id
- job_title
- company_name
- job_url
- ats_type
- source
- status lifecycle: `new` → `queued` → `pending_review` → `approved` / `rejected` / `withdrawn` → `submitted`

Withdrawal:
- Users may withdraw an application after approval but before submission
- Withdrawn applications are not submitted and are retained for audit

---

### 4.4.1 Application Board (Kanban)
The Application Board provides a visual pipeline for tracking job applications.

Columns:
- **Applied** - Applications that have been submitted
- **Screening** - Applications under initial review by employer
- **Interview** - Applications that have progressed to interview stage
- **Offer** - Applications that have resulted in a job offer

Board behavior:
- Users can drag applications between columns to update status
- Moving to "Interview" triggers calendar event creation (if calendar integration enabled)
- Rejected applications are filtered out of the main board view but accessible via filter
- Each card displays: company, role, date, and quick actions

View modes:
- Board view (Kanban columns)
- Table view (list format)
- Calendar view (interview timeline)

---

### 4.5 Job Page Scrape and Extraction
Process:
- Fetch job page HTML
- Extract:
  - Job title
  - Company name
  - Location
  - Job description

Job descriptions are stored as immutable snapshots for audit and replay purposes.

---

### 4.6 Match Scoring
Scoring signals:
- Skill mentions in job description
- Target role alignment
- Title relevance

Thresholds:
- Minimum match_score required to proceed: 50
- Thresholds are controlled by the system only

Configurable limits:
- fetchLimit
- maxJobsToAdd
- minSkillMatches

Jobs failing eligibility or scoring rules are stored with status = rejected for audit purposes.

---

### 4.7 AI Content Generation
Generated outputs:
- Tailored resume (1 page)
- Cover letter (3–4 short paragraphs)
- Generated answers JSON for common ATS questions

Global writing rules:
- No hyphens allowed in prose content (resumes, cover letters). Hyphens are permitted in identifiers and profile names.
- No generic AI phrases
- Conversational, human tone

AI behavior rules:
- AI may reorder and rephrase existing resume content
- AI may infer metrics conservatively **only when the role strongly implies them**
- AI may not fabricate experience, credentials, employers, or education
- Admin data (name, email) may never be modified or reworded

Resume Context Flow:
- User edits resume in Resume Builder
- User navigates to Resume Context page with snapshot of changes
- User selects existing profile or creates new profile to save to
- AI generation uses the active application profile by default; user may switch profiles before generation
- User reviews diff before confirming save
- Save updates both main profile and resume profile snapshot

---

### 4.8 ATS Form Filling
Mapping source:
- ATS Field Mappings by ats_type

Form data includes:
- Profile fields
- Generated answers
- Tailored resume
- Cover letter

Automation:
- Playwright browser session with human-like pacing

Artifacts:
- Screenshot proof of completed form

Status after fill:
- pending_review

---

### 4.9 Approval and Submission
Approval flow:
- Notification sent with:
  - Screenshot link
  - Job details
  - Approve / Reject actions

Approve:
- Mark application as approved
- Submit application via browser automation
- Update status to submitted

Reject:
- Mark application as rejected
- Application is never submitted

If no user response is received:
- Application is automatically rejected after 48 hours

---

### 4.10 Error Handling
Centralized error handling:
- All failures routed through error classifier
- Errors categorized by type and severity
- Logged to Error Log data store

Retry policy:
- Retry once for transient failures only
- No retries for logical, validation, or compliance failures

High-severity errors:
- Trigger immediate alerts
- Require manual review

A global kill switch exists to halt all automation immediately.
- Kill switch is admin-controlled only
- Users may pause their own queue but cannot trigger global halt

---

## 5. Governance and Control Policies

### 5.1 Automation Authority
- Auto-submit is disabled by default
- Queue processing defaults to `dryRun=true` for safe testing
- Auto-submit is permitted only for premium users
- First-time companies and first-time ATS types always require approval (per-user basis)

**Pro Features (Pro tier and above):**
- Priority queue processing
- Advanced job matching algorithms
- Analytics and reporting dashboard
- Extended application history

**Premium Features (Premium tier only):**
- All Pro features
- Auto-submit capability
- Bulk application management
- Resume A/B testing
- Dedicated support

---

### 5.2 Job Eligibility Hard Stops
Immediate disqualifiers:
- Visa or sponsorship mismatch
- Location mismatch
- Seniority mismatch
- ATS not in allowlist

Rejected jobs are retained with status = rejected for audit and transparency.

---

### 5.3 ATS and Platform Compliance
- Only allowlisted ATS platforms may be automated
- CAPTCHA detection results in a pause and requires manual user action
- Explicit “no automation” language is treated as a hard stop

---

### 5.4 Evidence and Audit Requirements
Before submission, the system must retain:
- Screenshot proof
- Job description snapshot
- Generated application content

Retention policy:
- Retention window: Indefinite

---

### 5.5 Compliance Mode

The system supports a Compliance Mode designed for high-risk, enterprise, or legally sensitive use cases.

Activation:
- Compliance Mode is enabled via admin setting only
- Users cannot toggle Compliance Mode themselves

When Compliance Mode is enabled:
- AI inference is disabled entirely
- All applications require explicit human approval
- Auto-submit is disabled regardless of user tier
- Resume and cover letter generation must adhere strictly to user-provided content
- Work authorization, sponsorship, and identity fields are locked and may not be rephrased
- Full audit artifacts are retained for an extended retention window
- Any ambiguity or partial failure blocks submission

Compliance Mode overrides all standard automation behavior.

---

### 5.6 Auto Apply Modes

The system supports two distinct Auto Apply modes.  
All modes must adhere to governance, eligibility, and compliance rules.

#### 5.6.1 Manual Auto Apply
Manual Auto Apply is a user-initiated automation mode.

Behavior:
- User explicitly selects a specific job and clicks “Auto Apply”
- The system completes the application on the user’s behalf
- Human-in-the-loop approval is always enforced
- The user may continue applying to other jobs or log out
- Once initiated, the application continues to completion even if the user goes offline

Notifications:
- Offline users receive email notifications
- Online users receive in-app notifications via the notification bell

---

#### 5.6.2 Agentic Auto Apply
Agentic Auto Apply is a system-driven automation mode based on user-defined presets.

Behavior:
- User configures criteria and preferences
- The system autonomously discovers and applies to matching jobs
- The system strictly adheres to:
  - Match score thresholds
  - Eligibility hard stops
  - ATS allowlist
  - Compliance Mode rules (if enabled)

Approval logic:
- If human-in-the-loop is enabled, approval is required
- If human-in-the-loop is disabled and auto-submit is permitted, the system may submit automatically
- After submission, the user receives a full application review summary

Notifications:
- Offline users receive email notifications
- Online users receive in-app notifications

Agentic Auto Apply may be disabled automatically if risk or compliance thresholds are violated.

---

### 5.7 Developer and Debug Tools
Available in development mode only:
- Chrome DevTools MCP integration for DOM inspection and debugging
- Profile reset functionality (clears all data)
- Verification scripts (`verify-*.ts`) for targeted system checks
- SQLite database at `careerflow.db` for local persistence
- Firecrawl integration for web scraping job listings

Dev mode is controlled by `VITE_DEV_MODE` environment variable.

Job discovery currently uses RemoteOK and Arbeitnow APIs. Firecrawl integration is planned for future expansion.

Environment variables:
- `OPENAI_API_KEY` - Required for AI content generation
- `FIRECRAWL_API_KEY` - Reserved for future job scraping expansion
- `LOG_LEVEL` - Controls logging verbosity

---

### 5.8 API Rate Limiting
Rate limits protect against abuse and ensure fair usage.

Per-user limits:
- API requests: 100 requests per minute
- Resume generation: 20 per hour
- Job scraping: 50 jobs per minute

Per-tier limits:
- Free: 500 API calls per day
- Pro: 2,000 API calls per day
- Premium: 10,000 API calls per day

Exceeding limits:
- Requests are rejected with 429 status code
- Retry-After header indicates wait time
- Repeated abuse may result in temporary suspension

---

## 6. Revenue Model
Type:
- SaaS subscription model

Payment processor:
- Stripe

Currency:
- USD only

Pricing tiers:
- Free: $0/month (limited features)
- Pro: $20/month (expanded limits, priority queue)
- Premium: $50/month (full features including auto-submit)

Billing cycle:
- Monthly billing available
- Annual billing available (2 months free, ~17% discount)

Refund policy:
- No pro-rated refunds for mid-cycle cancellations
- Access continues until the end of the paid billing period

Upgrade/downgrade policy:
- Upgrades take effect immediately with pro-rated billing
- Downgrades take effect at the end of the current billing period
- Users retain access to current tier features until period ends

Usage limits:
- Free tier:
  - Daily cap: 10 applications
  - Monthly cap: 100 applications
- Pro tier:
  - Daily cap: 25 applications
  - Monthly cap: 250 applications
- Premium tier:
  - Daily cap: 50 applications
  - Monthly cap: 500 applications

Cost drivers:
- AI token usage
- Browser automation sessions
- Proxy / anti-bot infrastructure
- Artifact storage

---

## 7. Distribution
Primary acquisition channels:
- Direct outreach
- LinkedIn content
- YouTube demos
- Career coaches and resume writers
- Word of mouth

---

## 8. Competitive Advantage
- ATS-aware automation
- Explicit human approval gate
- Deterministic workflows
- Full auditability
- Compliance-first design

---

## 9. Risks and Mitigations
Risks:
- ATS layout changes
- Anti-bot measures
- PII handling
- Accidental submissions

Mitigations:
- Approval requirement
- Screenshot evidence
- Selector fallback strategies
- Encryption and retention policies
- Global kill switch

---

## 10. Roadmap
MVP:
- Stable ATS automation with approval gate

Next:
- Additional job sources
- Negative and must-have filters
- Dynamic ATS mapping updates
- Multi-user scaling
- System admin dashboard (for managing users, monitoring system health)
- Compliance and EEO handling modes

---

## 11. Design Permanency Rule
Once behavior is defined in this document, it may not be changed implicitly by AI, automation, refactors, or model upgrades.

All behavior changes require an explicit update to this file.
