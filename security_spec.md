# Security Specification for HoopsHub

## Data Invariants
1. A user can only create their own user document (the `uid` must match `request.auth.uid`).
2. Only admins can create or update events.
3. Every member can read all events and user profiles (for club transparency).
4. A member can only create/update their own RSVP for an event.
5. RSVPs must belong to an existing event.
6. Identity fields (like `uid`, `createdBy`, `userId`) must be immutable once set.
7. Timestamps must be validated using `request.time`.

## The "Dirty Dozen" Payloads

1. **Identity Spoofing**: A user tries to create a `User` document with a `uid` that is not theirs.
2. **Privilege Escalation**: A user tries to set their `role` to 'admin' during registration.
3. **Unauthorized Event Creation**: A player tries to create an `Event`.
4. **State Shortcutting**: A user tries to update an event's `createdBy` field.
5. **RSVP Hijacking**: A user tries to create an `RSVP` for another user.
6. **Orphaned RSVP**: A user tries to create an `RSVP` for a non-existent event ID.
7. **Junk Data Injection**: A user tries to inject a 100KB string into the `displayName` field.
8. **Invalid Enum**: A user tries to set `status` to 'thinking_about_it' in an `RSVP`.
9. **Timestamp Manipulation**: A user tries to set a future date as `createdAt` for an event.
10. **Malicious ID Injection**: A user tries to use a path traversal string as an `eventId`.
11. **Shadow Field Injection**: A user tries to add secret fields to an `Event` document using an update gap.
12. **PII Leakage Attempt**: A non-auth user tries to list all users.

## Security Rules Implementation Plan
I will implement `firestore.rules` using the Master Gate pattern, with strict validation helpers for each entity.

## Test Runner (Draft)
A comprehensive test suite would verify these payloads return `PERMISSION_DENIED`. For now, I will proceed to generate the rules based on these invariants.
