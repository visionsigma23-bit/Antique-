# ANTIKER Firestore Security Specification

## 1. Data Invariants
1. All public catalog collections (`products`, `categories`, `siteSettings`) are read-only for visitors and strictly write-protected behind `isAdmin()` (requiring authenticated, email-verified primary owner `visionsigma23@gmail.com` or an existing verified document in `/admins/{request.auth.uid}`).
2. `products/{productId}` requires valid `categoryId` matching `^[a-zA-Z0-9_\-]+$` and existing in `/categories/{categoryId}`, bounded `images` list (`1 <= size <= 4`), bounded `details` list (`<= 10`), non-negative numeric `price`, valid `availability` enum, and server-enforced timestamps (`createdAt == request.time` on create, `createdAt` immutable on update, `updatedAt == request.time`).
3. `inquiries/{inquiryId}` contains visitor PII (`email`, `phone`, `name`). Visitors may only `create` inquiries with `status == 'new'` and `createdAt == request.time`. Only `isAdmin()` may `get`, `list`, `update` (to `'reviewed'`), or `delete` inquiries.
4. No document ID may exceed 128 chars or contain characters outside `^[a-zA-Z0-9_\-]+$`.
5. No shadow/unrecognized fields may be written to any collection (`keys().hasOnly(...)` + `keys().hasAll(...)` on create, `affectedKeys().hasOnly(...)` + `isValid[Entity]()` on update).

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. Unauthenticated `create` on `/products/p1` -> Denied (`!isAdmin()`).
2. Authenticated non-admin user `create` on `/products/p1` -> Denied (`!isAdmin()`).
3. Unverified email matching admin string attempting `update` on `/siteSettings/main` -> Denied (`email_verified != true`).
4. Admin `create` on `/products/bad$id` with invalid characters in ID -> Denied (`!isValidId(productId)`).
5. Admin `create` on `/products/p1` with extra shadow field `isVerified: true` -> Denied (`keys().hasOnly(...)`).
6. Admin `create` on `/products/p1` with negative price (`price: -50`) -> Denied (`price >= 0`).
7. Admin `create` on `/products/p1` with 11 items in `details` array -> Denied (`details.size() <= 10`).
8. Admin `create` on `/products/p1` referencing nonexistent `categoryId` -> Denied (`!exists(/categories/...)`).
9. Admin `update` on `/products/p1` attempting to forge `createdAt` -> Denied (`incoming().createdAt == existing().createdAt`).
10. Public visitor `get` or `list` on `/inquiries` -> Denied (PII isolation: `!isAdmin()`).
11. Public visitor `create` on `/inquiries/inq1` with `status: 'reviewed'` -> Denied (`status == 'new'` enforced on create).
12. Authenticated non-admin `create` on `/admins/{ownUid}` to self-promote -> Denied (`!isAdmin()`).
