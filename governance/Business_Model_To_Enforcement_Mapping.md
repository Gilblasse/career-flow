# Business_Model → Enforcement Mapping Table

This table defines how business intent is translated into enforceable AntiGravity rules.
Any Business_Model item without a corresponding enforcement artifact is considered **NON-ENFORCED**.

---

## 1. Identity & Profile Data

| Business Model Requirement | Enforcement Location | Rule ID | Enforcement Type | Failure Behavior |
|---------------------------|----------------------|---------|------------------|------------------|
| Full legal name must not be modified | Enforcement Prompt | ID-001 | HARD_FAIL | Block execution |
| Email address must not be inferred | Enforcement Prompt | ID-002 | HARD_FAIL | Block execution |
| Phone number must not be optimized | Enforcement Prompt | ID-003 | HARD_FAIL | Block execution |
| Work authorization must not be guessed | Enforcement Prompt | ID-004 | HARD_FAIL | Block execution |
| Sponsorship status must not be inferred | Enforcement Prompt | ID-005 | HARD_FAIL | Block execution |
| Country/state must be user-provided | Enforcement Prompt | ID-006 | HARD_FAIL | Block execution |
| Education history must not be altered | Enforcement Prompt | ID-007 | HARD_FAIL | Block execution |

---

## 2. Job Discovery & Deduplication

| Business Model Requirement | Enforcement Location | Rule ID | Enforcement Type | Failure Behavior |
|---------------------------|----------------------|---------|------------------|------------------|
| ATS job ID preferred for dedupe | Job Intake Workflow | JD-001 | SOFT_CHECK | Fallback to URL |
| Exact job_url match if no ATS ID | Job Intake Workflow | JD-002 | HARD_FAIL | Reject duplicate |
| Rejected jobs stored for audit | Job Intake Workflow | JD-003 | SYSTEM_ONLY | status=rejected |
| Unsupported ATS must be excluded | Enforcement Prompt | JD-004 | HARD_FAIL | Block execution |

---

## 3. Matching & Inference Rules

| Business Model Requirement | Enforcement Location | Rule ID | Enforcement Type | Failure Behavior |
|---------------------------|----------------------|---------|------------------|------------------|
| Skill matching must be conservative | Enforcement Prompt | MI-001 | HARD_FAIL | Block execution |
| Role inference allowed only if explicit | Enforcement Prompt | MI-002 | HARD_FAIL | Block execution |
| No optimistic assumptions | Enforcement Prompt | MI-003 | HARD_FAIL | Block execution |

---

## 4. Auto Apply Modes

| Business Model Requirement | Enforcement Location | Rule ID | Enforcement Type | Failure Behavior |
|---------------------------|----------------------|---------|------------------|------------------|
| Manual Auto Apply requires user click | Workflow Gate | AA-001 | HARD_FAIL | Pause execution |
| Manual Auto Apply preserves human review | Workflow Gate | AA-002 | HARD_FAIL | Pause execution |
| Agentic Auto Apply follows preset rules | Enforcement Prompt | AA-003 | HARD_FAIL | Block execution |
| Human-in-the-loop optional but enforced if enabled | Workflow Gate | AA-004 | HARD_FAIL | Pause execution |
| Auto submit only if explicitly allowed | Enforcement Prompt | AA-005 | HARD_FAIL | Block execution |

---

## 5. Retry, Pause & Failure Handling

| Business Model Requirement | Enforcement Location | Rule ID | Enforcement Type | Failure Behavior |
|---------------------------|----------------------|---------|------------------|------------------|
| Retry only once for transient failures | Enforcement Prompt | RF-001 | HARD_FAIL | Block execution |
| Auto-reject after X hours | Workflow Scheduler | RF-002 | SYSTEM_ONLY | status=rejected |
| Pause for manual user action | Workflow Gate | RF-003 | HARD_FAIL | Pause execution |

---

## 6. Presets, Access & Entitlements

| Business Model Requirement | Enforcement Location | Rule ID | Enforcement Type | Failure Behavior |
|---------------------------|----------------------|---------|------------------|------------------|
| Presets are user-selectable | UI + Workflow | PE-001 | HARD_FAIL | Block execution |
| Agentic Auto Apply is premium-only | Enforcement Prompt | PE-002 | HARD_FAIL | Block execution |
| System-only fields cannot be user-modified | Enforcement Prompt | PE-003 | HARD_FAIL | Block execution |

---

## 7. Notification & Audit

| Business Model Requirement | Enforcement Location | Rule ID | Enforcement Type | Failure Behavior |
|---------------------------|----------------------|---------|------------------|------------------|
| Email-only notification policy | Enforcement Prompt | NT-001 | HARD_FAIL | Block execution |
| Email sent on every HARD_FAIL | Self-Audit Step | NT-002 | HARD_FAIL | Block execution |
| Violation must include rule_id | Self-Audit Step | NT-003 | HARD_FAIL | Block execution |
| Blocking rule must be reported | Self-Audit Step | NT-004 | HARD_FAIL | Block execution |

---

## 8. Self-Audit Enforcement

| Business Model Requirement | Enforcement Location | Rule ID | Enforcement Type | Failure Behavior |
|---------------------------|----------------------|---------|------------------|------------------|
| Self-audit runs before execution | Workflow Definition | SA-001 | HARD_FAIL | Block execution |
| Self-audit runs during execution | Workflow Definition | SA-002 | HARD_FAIL | Block execution |
| Blocking rule must be reported | Self-Audit Step | SA-003 | HARD_FAIL | Block execution |
| Execution must halt on violation | Enforcement Prompt | SA-004 | HARD_FAIL | Block execution |

---

## Enforcement Rule

> Any Business_Model requirement without an explicit Rule ID and Enforcement Location is NOT ENFORCED and may be bypassed by AntiGravity.

