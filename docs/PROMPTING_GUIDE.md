# PROMPTING_GUIDE.md

```yaml
document:
  id: DOC-015
  title: PROMPTING_GUIDE
  version: 1.0
  status: Frozen

purpose: Define the standard workflow for using AI coding assistants during SSRL ERP development.

depends_on:
  - 00_READ_FIRST.md
  - AI_RULES.md
  - DO_NOT_BREAK.md
  - PROJECT.md
  - DATABASE.md
  - API.md
  - DEVELOPMENT_GUIDE.md

used_by:
  - AI Coding Assistants
  - Developers

last_updated: 2026-08-05
```

---

# 1. Objective

This document defines how AI coding assistants shall be instructed while developing SSRL ERP.

The objective is to ensure:

- Consistent architecture
- High-quality code
- Minimal regressions
- Compliance with approved documentation

---

# 2. Mandatory Reading Order

Before generating or modifying code, the AI shall read the following documents in order:

1. 00_READ_FIRST.md
2. AI_RULES.md
3. DO_NOT_BREAK.md
4. PROJECT.md
5. BUSINESS_MODEL.md
6. BUSINESS_WORKFLOWS.md
7. BUSINESS_RULES.md
8. DATABASE.md
9. MODULES.md
10. FEATURE_SPECIFICATIONS.md
11. API.md
12. UI_UX.md
13. DEVELOPMENT_GUIDE.md

The AI shall not begin implementation until these documents have been reviewed.

---

# 3. Prompt Structure

Every implementation prompt should contain:

## Objective

Describe the feature or task.

---

## Scope

State exactly which modules are affected.

---

## Constraints

List any business or technical constraints.

---

## Acceptance Criteria

Define the expected outcome.

---

## Files

List files that may be created or modified.

---

# 4. Example Feature Prompt

```text
Objective:
Implement Trip Creation.

Scope:
Trips Module only.

Constraints:
- Follow DATABASE.md.
- Follow API.md.
- Do not modify unrelated modules.

Acceptance Criteria:
- Trip creation works.
- Validation implemented.
- Activity log created.
- Tests pass.

Files:
- backend/services/trips
- backend/controllers/trips
- frontend/pages/trips
```

---

# 5. Example Bug Fix Prompt

```text
Objective:
Fix duplicate bill generation.

Constraints:
- Do not change database schema.
- Preserve all business rules.
- Preserve API contracts.

Acceptance Criteria:
- Duplicate bills cannot be created.
- Existing functionality remains unchanged.
```

---

# 6. Example Refactor Prompt

```text
Objective:
Refactor Trip Service.

Constraints:
- No functional changes.
- Preserve public APIs.
- Preserve database schema.
- Improve readability only.

Acceptance Criteria:
- All tests continue to pass.
```

---

# 7. Implementation Rules

The AI shall:

- Read existing code before changing it.
- Prefer small, incremental changes.
- Avoid unnecessary refactoring.
- Preserve existing workflows.
- Respect frozen documentation.

---

# 8. Prohibited Behaviour

The AI shall not:

- Invent business rules.
- Invent workflows.
- Rename APIs without approval.
- Modify database schema without approval.
- Remove validations.
- Remove activity logging.
- Change numbering logic.
- Change snapshot behaviour.
- Change FIFO allocation.

---

# 9. Before Writing Code

The AI shall verify:

- Required documentation exists.
- Dependencies are understood.
- Business rules are clear.
- Database relationships are understood.

If information is missing, the AI shall stop and request clarification.

---

# 10. After Writing Code

The AI shall verify:

- Code compiles.
- Type checking passes.
- Linting passes.
- Formatting passes.
- Business rules remain satisfied.
- API contracts remain unchanged.
- Documentation is still accurate.

---

# 11. Self-Review Checklist

Before presenting code, the AI should confirm:

- No unrelated files were modified.
- No unnecessary dependencies were added.
- Error handling is complete.
- Validation is complete.
- Transactions are used where required.
- Activity logging is implemented where required.
- Security requirements are respected.

---

# 12. Change Scope

Changes should be categorized as one of:

- Feature
- Bug Fix
- Refactor
- Documentation
- Performance
- Security

The prompt should identify the category before implementation begins.

---

# 13. Commit Guidance

Each implementation should correspond to a single logical change.

Avoid combining unrelated work into one commit.

Recommended commit format:

```text
type(scope): short description
```

Examples:

```text
feat(trips): implement POD upload

fix(billing): prevent duplicate bill generation

refactor(payments): simplify FIFO allocation
```

---

# 14. Documentation Updates

If a change affects:

- Database structure
- APIs
- Business rules
- Workflows

the corresponding documentation shall be updated before the task is considered complete.

---

# 15. Escalation Rules

The AI shall stop and request guidance if:

- Documentation conflicts.
- A required business rule is missing.
- A requested change violates DO_NOT_BREAK.md.
- The requested implementation requires assumptions.

---

# Related Documents

- AI_RULES.md
- DO_NOT_BREAK.md
- DEVELOPMENT_GUIDE.md
- DATABASE.md
- API.md

---

# Document Status

**Status:** Frozen

This document defines the standard workflow for collaborating with AI coding assistants throughout the development of SSRL ERP.
