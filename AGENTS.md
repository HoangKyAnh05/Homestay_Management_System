# Agent Instructions

Source Repository Harness: https://github.com/hoangnb24/repository-harness.git

<!-- HARNESS:BEGIN -->
## Harness

Start with the requested outcome and use the repository as the system of record.
Read `docs/WORKFLOW.md` and only relevant product, design, plan, code, and
validation material.

- Answers, explanations, reviews, diagnoses, plans, and status reports are
  read-only. Inspect only what is needed; change nothing.
- For a bounded change, inspect affected behavior and proof, implement, and
  validate. No control-plane operation is required.
- Use one `docs/plans/active/` file when work spans sessions, coordinates
  contributors, has dependencies, or needs recovery. Move it to
  `docs/plans/completed/` only after validation.
- Before editing, identify repository authority for each new externally
  observable policy. If materially different choices remain open, stop before
  edits; configurable defaults are not authority.
- For architecture, reliability, security, or quality invariant work, read
  `docs/patterns/encoding-invariants.md` and enforce only accepted rules.
- Report reusable agent friction. Change guidance, tools, runbooks, or validation
  for that purpose only when explicitly asked to use `$improve-harness`.
- Also pause when product intent remains ambiguous, recovery is difficult,
  validation is weakened, or authority is insufficient.
- Claim completion only with executable or observable evidence. Report outcome,
  changes, validation, and unresolved risks.

Harness has no task database or orchestration lifecycle. Use repository plans
and behavior-level proof; do not create parallel control-plane state.
<!-- HARNESS:END -->

## AI Development Workflow & Quality Policy

Before coding any feature or executing commands:

1. **Analyze Requirements & Authority**: Check authoritative docs (`docs/WORKFLOW.md`, `docs/product/`, `docs/plans/`). If ambiguous, pause and ask.
2. **Design API**: Specify endpoints, HTTP methods, request/response contracts.
3. **Design DTO**: Structure all request & response payloads.
4. **Implement Service**: Core business logic and transactional integrity.
5. **Implement Controller**: REST API routing, input binding, response status.
6. **Add Validation**: Bean validation, boundary constraints, business invariants.
7. **Add Security**: Role-based access control, authentication, ownership check.
8. **Create Test Cases & Proof**: Unit tests, integration tests, UI verification.

Do not jump directly to implementation.

For every new feature:
* **Explain architecture first**
* **Then generate code**
* **Then review code & verify with executable tests**
