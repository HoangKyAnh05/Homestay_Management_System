<!-- HARNESS:BEGIN -->
## Harness Policy & Workflow

Source: https://github.com/hoangnb24/repository-harness.git

For every request or command before execution:
1. Always follow the authoritative repository map in AGENTS.md and docs/WORKFLOW.md.
2. Inspect the smallest relevant context first; answers and reviews are strictly read-only.
3. For bounded changes: inspect affected behavior and proof, implement smallest coherent change, run tests.
4. For multi-session changes: use docs/plans/active/<plan>.md and move to docs/plans/completed/ only after verification.
5. If there is material product ambiguity, pause and ask before mutation.
6. Never claim completion without behavioral proof (tests, build, execution evidence).
<!-- HARNESS:END -->
