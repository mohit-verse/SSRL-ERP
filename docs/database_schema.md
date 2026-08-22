# SSRL ERP — Database Schema Documentation v1.2

**Authoritative Architecture Version:** 1.2.0  
**Database Engine:** Supabase PostgreSQL System of Record  

---

## 1. Overview & Entity Relationship Summary

The SSRL ERP database model enforces financial immutability, transactional row-locking, and strict business invariants.

### Tables & Key Entities:
1. `profiles`: System users linked to Supabase Auth (`auth.users`). Hard deletion prohibited (`is_active = FALSE`).
2. `parties`: Consignors / Customers billed for transport services.
3. `vehicle_owners`: Transport contractors & truck owners.
4. `vehicles`: Fleet registry (`OWN` vs `MARKET`).
5. `drivers`: Fleet driver directory.
6. `trips`: Core trip operational entity (`trip_status` ENUM: `PLANNED`, `IN_TRANSIT`, `DELIVERED`, `SETTLED`, `CANCELLED`; `is_deleted` soft-deletion flag).
7. `trip_destinations`: Multi-drop destinations containing itemized `unloading_charge`.
8. `trip_party_financials`: Party freight, unloading charges, detention, additional charges, deductions, TDS, generated `gross_receivable` and `net_receivable`.
9. `trip_owner_financials`: Owner freight, detention, additional charges, unloading charges, deductions, generated `net_payable`.
10. `vehicle_owner_deductions`: Itemized deductions subtracted from owner freight.
11. `own_vehicle_expenses`: Operational expense log for SSRL-owned fleet.
12. `general_expenses`: Administrative and general operational expenses.
13. `payments`: Payment registry for Party & Owner payments.
14. `payment_allocations`: Itemized table allocating single or bulk payments to specific trips.
15. `payment_reversals`: Audit records for full payment cancellations.
16. `party_credits`: Unallocated party overpayment credits.
17. `party_credit_usages`: Application of party credit to downstream trips.
18. `bills`: Invoice header.
19. `bill_versions`: Frozen JSONB invoice snapshots.
20. `bill_trips`: Trip-to-Bill mapping enforcing partial unique active index (`idx_unique_active_trip_billing`).
21. `submissions`: Grouped submission envelopes for physical POD/Invoice delivery.
22. `submission_bills`: Submission envelope bill mapping.
23. `audit_logs`: Append-only audit trail logging OLD $\rightarrow$ NEW JSONB diffs.
24. `document_metadata`: Metadata for private Google Drive uploaded files.
25. `idempotency_keys`: 24-hour TTL idempotency key registry.

---

## 2. Key Database Constraints

* `chk_party_deductions_tds`: `(deductions + tds_amount) <= (freight + unloading_charges + detention + additional_charges)`
* `chk_deductions_lte_freight`: `total_deductions <= freight`
* `payment_date_check`: `payment_date <= CURRENT_DATE`
* `idx_unique_active_trip_billing`: `CREATE UNIQUE INDEX idx_unique_active_trip_billing ON bill_trips (trip_id) WHERE (is_current = TRUE)`
