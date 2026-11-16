# Syntax Academy — Security Specification & Threat Model

## 1. Data Invariants
1. **Role & Privilege Isolation**: No user document in `/users/{uid}` can elevate `role` beyond `'student'` or modify `status`/`internalNotes`. Only verified administrators (bootstrapped admin email `omaejensi@gmail.com` with `email_verified == true` or server-registered `/admins/{uid}`) may perform administrative writes.
2. **PII Isolation**: Student email addresses, phone numbers, and internal notes in `/users/{uid}` and `/applications/{applicationId}` are readable strictly by the owning student (`uid == request.auth.uid`) or an administrator. Public listings never expose PII.
3. **Application Integrity**: An application can only be created by an authenticated student for an existing, open track (`exists(/databases/$(database)/documents/tracks/$(incoming().trackId))`), must start in `status == 'pending'`, and must bind `studentUid == request.auth.uid`. Students cannot transition their own application to `'accepted'` or `'enrolled'`.
4. **Course & Lesson Access Control (Master Gate)**: Lessons under `/courses/{courseId}/lessons/{lessonId}` inherit access from parent `/courses/{courseId}` via `get()`. Restricted lessons are readable only if the lesson has `isFreePreview == true`, the parent course has `isPublicPreview == true`, the user holds an active enrollment `/enrollments/$(uid)_$(trackId)`, or the user is an admin.
5. **Certificate Authenticity**: Only administrators may create, revoke, or update `/certificates/{certificateId}`. Public visitors may `get` an individual certificate by exact `certificateId` for verification (`/verify-certificate/:certificateId`), but cannot `list` all certificates.
6. **Payment & Audit Immutability**: Students may view their own payment records (`/payments/{paymentId}`) but can never create, edit, or delete them. `/auditLogs/{logId}` is append-only for admins and immutable (`update, delete: if false`).
7. **Temporal & ID Integrity**: All document IDs match `^[a-zA-Z0-9_\-]+$` (`<= 128` chars, `<= 260` for composite enrollment IDs). `createdAt`/`updatedAt` timestamps are enforced via `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads (Must All Return PERMISSION_DENIED)
1. **Privilege Escalation on Signup**: `POST /users/{uid}` with `{ role: "admin", status: "active" }`.
2. **Shadow Field Injection on Profile Update**: `PATCH /users/{uid}` with `{ fullName: "Student", isAdmin: true }`.
3. **Cross-Student PII Read**: Authenticated Student A calling `GET /users/{studentB_uid}` or `LIST /users`.
4. **Self-Approving Application**: Student creating `/applications/{id}` with `{ status: "accepted", studentUid: uid }`.
5. **Application Status Tampering**: Student updating `/applications/{id}` from `pending` to `accepted`.
6. **Impersonating Another Student**: Student A creating `/applications/{id}` with `{ studentUid: studentB_uid }`.
7. **Orphaned Application Injection**: Student creating `/applications/{id}` with `{ trackId: "non-existent-track" }`.
8. **Unauthorized Certificate Forgery**: Student creating `/certificates/FAKE-CERT-1` with `{ studentFullName: "Attacker", status: "valid" }`.
9. **Certificate Enumeration Scraping**: Unauthenticated user executing `LIST /certificates`.
10. **Self-Issued Enrollment**: Student creating `/enrollments/{uid}_{trackId}` with `{ status: "active" }`.
11. **Payment Forgery**: Student updating `/payments/{id}` to `{ status: "paid", amountPaid: 5000 }`.
12. **Path Poisoning / Resource Exhaustion**: Client creating `/applications/{1.5KB_junk_id}` or oversized `1MB` string field in `message`.
