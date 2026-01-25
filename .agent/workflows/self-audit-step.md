---
description: Automatically evaluates all enforcement rules before and during execution, halts on violations, records the blocking rule, and sends a required email explaining what failed and what action is needed before proceeding.
---

# Self-Audit & Enforcement Reporting (MANDATORY)

AntiGravity MUST run this self-audit gate at these checkpoints:
1) After profile capture
2) After job intake + de-dupe
3) After scrape + extraction
4) After AI content generation
5) Before ATS form fill
6) Before approval request is sent
7) Immediately before final submission (or auto-submit)

If ANY violation is detected at ANY checkpoint:
- STOP execution immediately
- BLOCK submission
- Write an audit record (see schema below)
- Notify user (Email if offline)
- Set job status to `rejected` (audit-safe)

---

## A. Rule ID System

Every hard-fail rule MUST have a stable Rule ID.  
AntiGravity MUST reference the Rule ID when blocking execution.

**Format:**
- `HF-IMMUTABLE-###`
- `HF-FABRICATION-###`
- `HF-ATS-###`
- `HF-COMPLIANCE-###`
- `HF-ELIGIBILITY-###`
- `HF-DUPE-###`
- `HF-APPROVAL-###`
- `HF-AUTOAPPLY-###`
- `HF-AUDIT-###`
- `HF-ERROR-###`
- `HF-DESIGN-###`
- `HF-KILL-###`

Example IDs:
- `HF-IMMUTABLE-001` = Immutable field modified (name/email/phone/etc)
- `HF-ATS-001` = ATS not in allowlist (Greenhouse/Lever/Ashby)
- `HF-APPROVAL-002` = Submission attempted without required approval
- `HF-AUTOAPPLY-003` = Manual Auto Apply without explicit user click
- `HF-ERROR-001` = Retry > 1 or non-transient retry attempted

---

## B. Mandatory Self-Audit Output (When Blocked)

When blocked, AntiGravity MUST output a **Violation Report** with:

1) `blocked: true`
2) `rule_id` (single most primary rule)
3) `rule_title`
4) `checkpoint` (where it failed)
5) `severity` = `HARD_FAIL`
6) `evidence` (what exactly triggered it, no guessing)
7) `affected_job` (company/title/job_url/ats_type)
8) `required_user_action` (exact next step)
9) `system_action_taken` (what AntiGravity did)
10) `timestamp`

---

## C. Violation Report Template (COPY EXACTLY)

### VIOLATION REPORT
- blocked: true
- rule_id: HF-_____-___
- rule_title: "<short name>"
- checkpoint: "<Profile | Intake | Scrape | Generate | Fill | Approve | Submit>"
- severity: HARD_FAIL

**Affected Job**
- company_name: "<company>"
- job_title: "<title>"
- job_url: "<url>"
- ats_type: "<Greenhouse|Lever|Ashby|Unknown>"

**Evidence**
- trigger_condition: "<the exact condition that was violated>"
- detected_value: "<what you saw>"
- expected_value: "<what was required>"
- notes: "<only factual notes>"

**Required User Action**
- action: "<manual user action required>"
- how_to_fix: "<steps user must do>"

**System Action Taken**
- status_set_to: rejected
- submission: blocked
- retry: none
- logged_to: "<Error Log sheet / Audit Log>"

- timestamp: "<ISO8601>"

---

## D. Audit Log Record Schema (Write to Sheets)

AntiGravity MUST write one row per block event with these fields:
- timestamp
- application_id
- job_url
- ats_type
- checkpoint
- rule_id
- rule_title
- evidence_trigger_condition
- evidence_detected_value
- required_user_action
- status (always `rejected`)
- notification_sent (Slack|Email|Both|None)

---

## E. Deterministic Rule Selection (No Randomness)

If multiple rules trigger at once:
1) Choose the most safety-critical category in this order:
   1. HF-KILL
   2. HF-IMMUTABLE
   3. HF-FABRICATION
   4. HF-COMPLIANCE
   5. HF-APPROVAL
   6. HF-ATS
   7. HF-DUPE
   8. HF-ELIGIBILITY
   9. HF-AUDIT
   10. HF-ERROR
   11. HF-DESIGN
   12. HF-AUTOAPPLY
2) Report only the primary `rule_id`
3) Optionally include `secondary_rule_ids` (for debugging) but do NOT proceed

---

## F. Notification Policy (EMAIL ONLY)

All violation notifications MUST be delivered via email.

Rules:
- Email notification is mandatory for every HARD_FAIL
- No Slack notifications are allowed
- No in-app notification or notification bell is used for violations
- Email delivery occurs regardless of user online or offline status

Each email MUST include:
- rule_id
- rule_title
- checkpoint where execution stopped
- company name and job title
- clear explanation of what was blocked
- exact required user action to resolve
- timestamp of the violation

Failure to send an email notification after a HARD_FAIL is itself a violation and must block execution.