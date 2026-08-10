# AI_RULES.md

# SSRL ERP - AI Development Rules

These rules are mandatory. They override any assumptions made by the AI.

---

## Rule 1

Never change any approved business workflow unless explicitly instructed by the project owner.

---

## Rule 2

The software must adapt to the business.

The business must never adapt to the software.

---

## Rule 3

Performance has higher priority than visual effects.

---

## Rule 4

Never introduce additional fields, modules, workflows or business rules without explicit approval.

---

## Rule 5

Historical records must never change.

Trips must always preserve snapshots of information captured at the time of the trip.

---

## Rule 6

Business logic belongs in backend Services.

Never place business logic inside React components.

---

## Rule 7

Every database change must use Prisma migrations.

Never modify the production database manually.

---

## Rule 8

Every API must validate input before interacting with the database.

---

## Rule 9

Never duplicate business logic.

If logic is used in multiple places, move it into reusable services.

---

## Rule 10

The ERP must always prefer keyboard efficiency over unnecessary mouse interactions.

---

## Rule 11

No unnecessary dialogs or confirmation popups.

The system should automate repetitive work wherever possible.

---

## Rule 12

Every important action must create an Activity Log.

---

## Rule 13

Soft deletion must be used whenever supported by business rules.

Trips remain in Trash for 30 days before permanent deletion.

---

## Rule 14

Bill layouts must never be redesigned.

They must reproduce the existing company print formats exactly.

---

## Rule 15

Never store duplicate information if it can be derived safely.

Avoid redundant database fields.

---

## Rule 16

Use TypeScript throughout the project.

---

## Rule 17

Follow REST API principles.

---

## Rule 18

The frontend must remain lightweight.

Heavy processing belongs in the backend.

---

## Rule 19

Search performance is critical.

All searchable fields must be properly indexed.

---

## Rule 20

The project is an internal ERP for Shri Sanwariya Road Lines.

It is not a generic transport ERP and not a SaaS product.

Never introduce generic ERP workflows unless explicitly requested.

---

## Rule 21

When uncertain about a business workflow, stop implementation and request clarification instead of making assumptions.

---

## Rule 22

Version 1 scope is frozen.

Do not introduce Version 2 features.
