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

### 4.1 Entry
- Initial trigger: User-initiated action
- Command format:
  - `name: Full Name, search: Role1, Role2`
- Resume upload:
  - Word documents only (.doc, .docx)

---

### 4.2 Profile Capture (Canonical Store)
Storage: User Profile data store

Required fields:
- base_resume
- target_roles
- remote_preference
- linkedin_url

Optional fields:
- email
- phone
- location
- skills
- salary range
- work authorization / sponsorship
- portfolio or GitHub

#### Immutable Fields
The following fields are immutable once set and may not be fixed, optimized, inferred, or rewritten by AI:
- Full legal name
- Email address
- Phone number
- Work authorization status
- Sponsorship requirement
- Country / state of residence
- Education history

AI may not silently overwrite or modify these fields under any circumstance.

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

Allowed ATS platforms:
- Greenhouse
- Lever
- Ashby

All other ATS platforms are excluded unless explicitly added.

---

### 4.4 Job Intake and De-duplication
Storage: Job Applications data store

Rules:
- Primary duplicate identifier: ATS job ID (if available)
- Fallback duplicate identifier: Exact job_url match
- Duplicate jobs are never processed twice per user

Stored fields:
- application_id
- job_title
- company_name
- job_url
- ats_type
- source
- status lifecycle

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
- No hyphens allowed
- No generic AI phrases
- Conversational, human tone

AI behavior rules:
- AI may reorder and rephrase existing resume content
- AI may infer metrics conservatively **only when the role strongly implies them**
- AI may not fabricate experience, credentials, employers, or education
- Immutable profile fields may never be modified or reworded

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
- Application is automatically rejected after a defined timeout window

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

---

## 5. Governance and Control Policies

### 5.1 Automation Authority
- Auto-submit is disabled by default
- Auto-submit is permitted only for premium users
- First-time companies and first-time ATS types always require approval

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
- Retention window to be defined (30 / 90 / indefinite)

---

### 5.5 Compliance Mode

The system supports a Compliance Mode designed for high-risk, enterprise, or legally sensitive use cases.

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

## 6. Revenue Model
Type:
- Personal tool / SaaS / hybrid (to be defined)

Pricing:
- Plan A:
- Plan B:

Usage limits:
- Daily cap:
- Monthly cap:

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
- Admin dashboard
- Compliance and EEO handling modes

---

## 11. Design Permanency Rule
Once behavior is defined in this document, it may not be changed implicitly by AI, automation, refactors, or model upgrades.

All behavior changes require an explicit update to this file.
