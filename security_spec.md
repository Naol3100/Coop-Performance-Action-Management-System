# Security Specification: Bank Disciplinary Action Reporting System

## 1. Data Invariants
1. **Authentication Requirement**: No unauthenticated reading or writing of employee disciplinary records or audit logs.
2. **Access Separation**: District HR officers are restricted to their assigned District records, while Head Office Managers and Administrators have governance oversight.
3. **Audit Log Immutability**: All entries written to `/AuditLog/{auditId}` are append-only. No updates or deletions are allowed under any circumstances.
4. **Report ID Integrity**: Document IDs must conform to alphanumeric and hyphen/underscore safe characters (`^[a-zA-Z0-9_\\-]+$`) with a maximum length of 128 characters.
5. **State Transition Protection**: A closed or terminal report cannot have its findings or action type altered without administrative clearance.
6. **Input Boundary Enforcement**: All text fields have strict length checks (e.g. employeeId <= 64, employeeName <= 128, issueDescription <= 4000) to protect against resource exhaustion attacks.

## 2. The Dirty Dozen Payloads (Rejection Test Cases)
1. Unauthenticated write to `/DisciplinaryReports/REP-9999` -> REJECTED (Missing Auth).
2. Unauthenticated read of `/Users/USR-01` -> REJECTED (Unauthenticated).
3. Payload with 50,000 character `issueDescription` string -> REJECTED (Size boundary exceeded).
4. Attempt to update an existing `/AuditLog/{auditId}` record -> REJECTED (Audit records are append-only).
5. Attempt to delete an existing `/AuditLog/{auditId}` entry -> REJECTED (Audit deletion prohibited).
6. Malicious path injection ID `../../secret` -> REJECTED (Invalid ID regex guard).
7. Attempt by user to assign themselves `role: "ADMIN"` without administrative privileges -> REJECTED (Privilege escalation guard).
8. Report payload missing required `employeeName` or `actionType` -> REJECTED (Schema blueprint check).
9. Report update with unexpected shadow keys -> REJECTED (Diff affectedKeys guard).
10. Attempt to delete district from `/Districts/{districtId}` by non-admin -> REJECTED (Admin only operation).
11. Attempt to inject arbitrary script tags into document IDs -> REJECTED (ID sanitization).
12. Review entry created without required `reviewDecision` -> REJECTED (Schema validation).
