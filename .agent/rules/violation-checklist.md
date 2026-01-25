---
trigger: always_on
---

# Job Auto Apply — Hard-Fail Violation Checklist

This checklist defines **non-negotiable violations**.
If ANY violation is detected, AntiGravity MUST:
1. STOP execution immediately
2. BLOCK submission
3. Log the violation
4. Require explicit human intervention

No retries. No assumptions. No silent recovery.

---

## 1. Immutable Profile Violations (CRITICAL)

Trigger a HARD FAIL if ANY of the following fields are:
- Modified
- Rephrased
- Optimized
- Inferred
- Overwritten

Immutable fields:
- Full legal name
- Email address
- Phone number
- Work authorization status
- Sponsorship requirement
- Country / state of residence
- Education history

Examples:
- Rewording education entries
- “Fixing” phone or email formatting
- Inferring visa status
- Adjusting degree titles

---

## 2. Fabrication or Misrepresentation (CRITICAL)

Trigger a HARD FAIL if AI:
- Invents experience
- Invents employers
- Invents credentials or certifications
- Invents education
- Introduces skills not explicitly present
- Quantifies experience without strong role-based implication

Examples:
- “Led a team of 5” when not implied
- Adding tools or frameworks not listed
- Creating metrics from thin air

---

## 3. ATS & Platform Violations (CRITICAL)

Trigger a HARD FAIL if:
- ATS is not in the allowlist (Greenhouse, Lever, Ashby)
- ATS type is unknown or ambiguous
- First-time ATS is attempted without approval
- Explicit “no automation” language is detected
- CAPTCHA is bypassed or retried automatically

CAPTCHA handling:
- Must PAUSE
- Must REQUIRE manual user action

---

## 4. Compliance Mode Violations (ABSOLUTE)

Trigger a HARD FAIL if Compliance Mode is enabled AND:
- Any AI inference occurs
- Auto-submit is attempted
- Approval is skipped
- Identity or authorization fields are rephrased
- Submission proceeds with ambiguity

Compliance Mode overrides ALL other rules.

---

## 5. Job Eligibility Violations

Trigger a HARD FAIL if:
- Visa or sponsorship mismatch exists
- Location mismatch exists
- Seniority mismatch exists
- Match score < required threshold (50)
- Job is duplicate (ATS job ID or job_url match)

Failed jobs must:
- Be stored
- Be marked `status = rejected`
- Never be submitted

---

## 6. Duplicate Application Violations

Trigger a HARD FAIL if:
- ATS job ID already exists for the user
- job_url already exists for the user
- Duplicate detection is bypassed

Duplicate jobs must:
- Not be processed
- Not be applied to
- Be logged as duplicates

---

## 7. Approval & Authority Violations

Trigger a HARD FAIL if:
- Submission occurs without required approval
- Auto-submit is attempted by non-premium user
- Auto-submit is attempted in Compliance Mode
- Approval timeout expires and submission still proceeds
- First-time company submission skips approval

Approval timeout behavior:
- Auto-reject only
- Never auto-submit

---

## 8. Auto Apply Mode Violations

### Manual Auto Apply
Trigger a HARD FAIL if:
- User did not explicitly click “Auto Apply”
- Approval is skipped
- Application does not generate notification

### Agentic Auto Apply
Trigger a HARD FAIL if:
- User presets are ignored
- Human-in-the-loop is bypassed when enabled
- Auto-submit occurs without premium entitlement
- Risk or compliance thresholds are violated

If violated:
- Disable Agentic Auto Apply immediately

---

## 9. Artifact & Audit Violations

Trigger a HARD FAIL if ANY required artifact is missing:
- Screenshot proof
- Job description snapshot
- Generated resume / cover letter snapshot

Artifacts must:
- Be immutable
- Exist before submission

---

## 10. Error Handling Violations

Trigger a HARD FAIL if:
- Errors are not classified
- Errors are not logged
- More than one retry occurs
- Retry occurs for non-transient failures
- Browser automation guesses missing fields

Retry rules:
- One retry only
- Transient failures only

---

## 11. Design Permanency Violations (ABSOLUTE)

Trigger a HARD FAIL if AntiGravity:
- Changes logic without MD update
- Alters thresholds
- Introduces new behavior
- Optimizes flows beyond spec
- “Assumes” user intent

Required response:
- STOP
- Request updated Business_Model.md
- Do not proceed

---

## 12. Kill Switch Violations (ABSOLUTE)

Trigger a HARD FAIL if:
- Kill switch is active AND any automation continues
- In-flight submissions are not halted

Kill switch must:
- Immediately halt ALL automation
- Override all modes and states

---

END OF VIOLATION CHECKLIST
