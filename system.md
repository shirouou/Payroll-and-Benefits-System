# System Documentation: Payroll and Benefits Management System

## 1. System Overview

The Payroll and Benefits Management System is a web-based application designed to support employee-record administration, payroll processing, HMO benefit enrollment, reimbursement claims, bonus-plan management, and role-specific access to information. It is branded for Oxford Suites Makati and provides separate interfaces for employees and administrative staff.

This document describes the implementation represented by the source code in this repository. It is intended as a technical reference that can be adapted for a project manuscript. Deployment settings, business policies, and statutory calculations should be verified with the organization before the system is used for production payroll.

## 2. Purpose and Objectives

The system aims to:

- Maintain employee and employment-related records.
- Prepare individual and batch payroll records for a selected pay period.
- Record payroll components, deductions, and calculated net pay.
- Manage HMO plans, employee enrollments, and dependent counts.
- Let eligible employees submit reimbursement claims and optional receipt images.
- Let authorized staff review and approve or reject claims.
- Manage bonus plans and provide dashboard summaries.
- Provide authenticated, role-scoped access through a browser-based interface.

## 3. Scope

### Included

- Authentication, user registration, password-management endpoints, optional two-factor authentication, and role-based authorization.
- Employee management.
- Payroll entries and batch payroll generation.
- HMO plans and enrollments.
- Claims, claim decisions, and optional receipt-image attachments.
- Bonus plans.
- Audit and application logging.
- Profile name and avatar management.
- An analytics dashboard with server-sent live-update notifications.

### Not established by the code alone

- That payroll results meet all current legal or tax requirements.
- That every sensitive employee field is encrypted in MongoDB. Encryption utilities exist, but each field's use of those utilities must be verified separately.
- That production secrets, email delivery, CAPTCHA, backups, monitoring, or retention policies are configured correctly in a hosting environment.
- That the application is certified for regulatory compliance or production payroll use.

## 4. Users and Roles

The user model supports four roles:

| Role | Typical capabilities in the application |
|---|---|
| Administrator (`admin`) | Administrative access, including audit-log access and management operations. |
| Human Resources (`hr`) | Employee, HMO, bonus, claim-review, and payroll-related management, subject to route authorization. |
| Payroll (`payroll`) | Payroll operations and permitted claim and dashboard functions. |
| Employee (`employee`) | Access to personal payroll records and claims; employees can submit claims only against their own active HMO enrollment. |

The server enforces permissions through authentication and authorization middleware. Employee payroll and claims queries are scoped to the employee associated with the signed-in account.

## 5. System Architecture

The system uses a client-server architecture:

1. **Frontend:** React 18 single-page application built with Vite. React Router handles page navigation, Axios communicates with the API, and CSS styles the interface.
2. **Backend:** Node.js and Express provide REST-style JSON endpoints, authentication, authorization, validation, security middleware, business operations, and live-update events.
3. **Database:** MongoDB stores users, employees, payroll records, HMO plans and enrollments, claims, and bonus plans. Mongoose defines and accesses the document models.
4. **Web serving and routing:** In the container deployment, Nginx serves the frontend assets and proxies API requests to the API domain. The hosting platform terminates public HTTPS and routes domains to application containers.
5. **Live updates:** Authenticated clients open a Server-Sent Events (SSE) connection. Successful writes to selected resource routes broadcast a resource-change notice. Clients refetch their own authorized data rather than receiving other users' records in the event stream.

### High-level data flow

```text
Browser (React)
  ├── HTTPS API requests ──> Nginx / hosting proxy ──> Express API
  │                                                   ├── Authentication and RBAC
  │                                                   ├── Validation and business logic
  │                                                   └── Mongoose ──> MongoDB
  └── Authenticated SSE connection <── change notices from Express
```

## 6. Main Functional Modules

### 6.1 Authentication and Profile

Users register or sign in with an email address and password. Access and refresh tokens support authenticated sessions. The user model includes password hashing, account-lockout fields, optional TOTP-based two-factor authentication, and profile-photo metadata. Authenticated users can update their display name and upload or remove their profile photo.

Password policy, account lockout, login throttling, CAPTCHA requirements, and two-factor behavior are implemented across the authentication routes, user model, validators, and middleware. Email reset functionality depends on valid mail-service configuration.

### 6.2 Employee Management

Authorized HR and administrator users can create, view, update, and delete employee records and retrieve records by status. Employee data may include name, email, position, department, salary, hire date, status, contact information, bank details, and government identifiers. A user account can be associated with an employee record by matching its email address.

### 6.3 Payroll Management

Payroll records are associated with an employee and a payment period. The application supports manual payroll entries and batch generation for active employees. Records include salary components, deductions, contribution amounts, gross salary, net pay, status, processing date, and notes. The payroll interface supports viewing payslips and approval of draft entries; available actions depend on the current application code and user permissions.

Payroll formulas and contribution schedules are implementation-specific. Values should be treated as estimates until reviewed against current official regulations and approved organizational policy.

### 6.4 HMO and Benefits

Authorized users can maintain HMO plan information, including coverage, premiums, descriptions, and status. Enrollments associate employees with plans and record enrollment dates, dependent counts, and status.

### 6.5 Claims and Reimbursement

Employees can submit claims against their own active HMO enrollments. Claims capture claim and service dates, provider, description, requested amount, approved amount, status, and notes. HR and administrators can review pending claims, approve an amount, or reject a claim with a reason.

A claim may include one optional JPEG, PNG, or WebP receipt image up to 5 MB. The image is stored with the claim in MongoDB. Employees can retrieve receipts belonging to their own claims; authorized administrative roles can review claims through their permitted claims access.

### 6.6 Bonus Plans

Authorized users can create and maintain bonus plans with a name, type, amount, applicability, scheduled month, and status. The module represents plan administration; actual payout rules should be confirmed with the organization's compensation policy.

### 6.7 Analytics Dashboard and Live Updates

The administrative dashboard summarizes employee counts, current-period net payroll, pending claims, employee counts by department, claims by status, recent payroll records, and payroll totals by month. Employees receive a personal dashboard with employment details and their own payroll records.

Dashboard clients use an authenticated SSE endpoint. When a successful mutation occurs on watched employee, payroll, claims, HMO, or bonus routes, the server broadcasts a resource-change notification. Connected dashboards then reload permitted data. The event contains a resource name and timestamp, not employee or payroll records. Clients reconnect if the stream is interrupted.

## 7. Data Model Summary

| Entity | Purpose and principal relationships |
|---|---|
| User | Login identity, role, password/authentication state, optional employee reference, profile avatar, and optional 2FA information. |
| Employee | Employment, contact, compensation, status, and related employee information. |
| Payroll | Pay-period record linked to an employee, including earnings, deductions, totals, and status. |
| HMOPlan | Benefit-plan definition, coverage, premium, and status. |
| HMOEnrollment | Link between an employee and an HMO plan, including dependents and status. |
| Claim | Reimbursement request linked to an employee and enrollment; may contain an image receipt. |
| BonusPlan | Bonus-plan definition, type, amount, applicability, scheduled month, and status. |

MongoDB document identifiers are used for primary record references. Mongoose schemas define model fields, defaults, validation, and relationships.

## 8. Security and Privacy Controls

The implementation includes:

- JWT-based authentication and protected routes.
- Role-based authorization and employee-specific data scoping.
- bcrypt password hashing and password-strength validation.
- Optional TOTP two-factor authentication and backup codes.
- Login and general rate limiters.
- Helmet security headers and a configured Content Security Policy.
- CORS origin allow-listing.
- Request input validation and MongoDB query sanitization.
- Audit/data-access and authentication logging.
- Restricted receipt and profile-image retrieval, with MIME-signature checks and file-size limits.
- Secrets supplied through environment configuration rather than source code.

Security configuration is not a substitute for a deployment review. Production operators should configure strong unique secrets, HTTPS, least-privilege database access, backups, log retention, monitoring, and appropriate access to employee and payroll information. Never publish `.env` files, API keys, tokens, passwords, or personal employee data in source control or manuscript appendices.

## 9. Deployment and Configuration

The repository includes separate frontend and backend applications, Dockerfiles, Nginx configuration, Docker Compose files, and deployment guidance. A typical container deployment uses:

- The frontend Docker context at `/frontend`, with Nginx serving the Vite production build on port 80.
- The backend Docker context at `/backend`, with Express listening on port 5000.
- A MongoDB service or managed MongoDB connection configured with `MONGODB_URI`.
- A frontend API URL, normally a same-origin `/api` path when Nginx proxies API traffic.
- Backend environment variables for production mode, port, MongoDB connection, JWT keys, CORS origins, CAPTCHA verification, email, and optional AI integration.
- A frontend build argument for `VITE_RECAPTCHA_SITE_KEY`; its matching reCAPTCHA secret belongs only in the backend environment.

The Docker health checks in the frontend and backend Dockerfiles were temporarily disabled in this repository during deployment troubleshooting. The local Compose configuration also declares service health checks. Before production use, health checks should be reviewed, tested against the deployed app, and re-enabled where appropriate.

Do not run the database seed script against a production database without understanding its effects: the current seed script deletes existing user and application records before inserting demonstration data.

## 10. Testing and Quality Assurance

Backend tests use Jest and Supertest and cover authentication, employee operations, payroll, claims, HMO, audit behavior, validators, calculations, and live-update events. The frontend is built with Vite to check compilation. Tests should be run in a non-production test environment with a dedicated test database.

A successful test run demonstrates the tested behavior under the test setup; it does not by itself prove deployment readiness, statutory accuracy, regulatory compliance, or suitability for processing real payroll.

## 11. Known Limitations and Operational Considerations

- Payroll contribution and tax logic must be independently verified and maintained as laws and rates change.
- The system is not a substitute for accounting, legal, tax, or HR review.
- Receipt and avatar images stored as MongoDB binary data increase document/database storage usage; enforce backups, quotas, and retention controls.
- SSE provides change notifications, not a durable event history. A reconnect triggers client data reloads; it does not replay every missed event.
- Rate limiting depends on correct trusted-proxy configuration in the hosting environment.
- CAPTCHA and AI functions require valid external credentials and provider-side configuration.
- Documentation elsewhere in the repository may describe older versions or future features; the running code and current deployment settings are authoritative for the deployed system.

## 12. Repository Areas

- `frontend/src/pages/` — dashboard and business pages.
- `frontend/src/components/` — shared interface components.
- `frontend/src/services/` — API client and resource operations.
- `frontend/src/hooks/` — reusable frontend behavior, including live updates.
- `frontend/src/styles/` — page and component styling.
- `backend/routes/` — API route handlers.
- `backend/models/` — Mongoose data models.
- `backend/middleware/` — authentication, authorization, validation/security integration, and rate limiting.
- `backend/utils/` — business helpers, logging, image validation, encryption helpers, and live-update support.
- `backend/__tests__/` — automated backend tests.
- Root `docker-compose.yml`, `frontend/Dockerfile`, `backend/Dockerfile`, and `frontend/nginx.conf` — local/container deployment configuration.

## 13. Manuscript Adaptation Note

For an academic manuscript, supplement this implementation description with the actual study objectives, research methodology, participant/sample information, evaluation instruments, test environment, results, and limitations. Do not present implementation features as measured outcomes unless they have been evaluated and supported by evidence.
