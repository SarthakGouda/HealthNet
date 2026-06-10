# HealthNet — Frontend (Angular 20)

A multi-role Angular SPA for public-health & disease surveillance. This README is the
interview cheat-sheet: every section answers a question someone is likely to ask, and the
per-component table maps each folder to a one-line "what I'd say about this".

---

## 30-second pitch

> HealthNet is a 7-role public-health platform. Citizens submit symptom reports. Doctors
> triage them into cases and medical records. Lab technicians run tests and upload signed
> reports. Public-Health Officers track outbreaks and log epidemiology metrics. Compliance
> Officers audit it all. Admins manage users. Built on Angular 20 standalone components
> with a .NET Web API backend. JWT in `sessionStorage`, role-scoped routes, a shared
> `<app-id-picker>` form control so users never have to memorise database IDs, and a global
> design system in `src/styles.css`.

---

## Tech stack

| Concern              | Choice                                                          |
|----------------------|-----------------------------------------------------------------|
| Framework            | Angular 20 (standalone components, no NgModules)                |
| Forms                | Reactive forms + template-driven (mixed by component)            |
| HTTP                 | `HttpClient` + functional interceptors                          |
| State                | Local component state + RxJS observables (no NgRx)              |
| Auth                 | JWT in `sessionStorage`, manual base64 decode                   |
| Routing              | Standalone `Routes`, `authGuard` + `roleGuard`                  |
| UI library           | Custom design system + Tabler Icons + Bootstrap bits + Material |
| Styling              | Global `styles.css` for shared tokens; component CSS for deltas |
| Backend              | .NET Web API at `http://localhost:5171/api/v1`                  |

---

## Folder structure

```
src/
├── environments/
│   └── environment.ts                ← apiUrl
├── styles.css                        ← design tokens, .page, .card, .btn-*, badges, modals…
├── app/
│   ├── app.routes.ts                 ← every route, with auth + role guards
│   ├── app.config.ts                 ← bootstrap config + interceptor registration
│   ├── app.{ts,html,css}             ← root shell (header + sidebar + <router-outlet>)
│   ├── core/
│   │   ├── guards/
│   │   │   ├── auth-guard.ts         ← redirects to /login when no token
│   │   │   └── role-guard.ts         ← checks data.roles against JWT role claim
│   │   ├── interceptors/
│   │   │   └── auth-interceptor.ts   ← attaches Bearer token + logs API errors
│   │   ├── models/                   ← typed DTOs that mirror the backend
│   │   └── services/                 ← one service per backend resource + helpers
│   ├── shared/components/
│   │   ├── header-component/         ← top navbar (Home, Compliance, Outbreaks, Labs, About)
│   │   ├── sidebar-component/        ← role-filtered menu
│   │   ├── footer-component/         ← reusable footer (light/dark, compact)
│   │   ├── id-picker/                ← searchable dropdown (CVA) used everywhere
│   │   ├── alert/                    ← shared alert banner
│   │   ├── loading-spinner/          ← reusable spinner
│   │   └── main-layout/              ← (legacy) layout wrapper
│   └── components/                   ← page-level feature components (table below)
```

---

## Authentication flow

1. `/login` → `AuthService.login()` → `POST /api/v1/User` → returns `{ token }`.
2. `TokenService.setToken()` stashes the JWT in `sessionStorage` under
   `healthnet_token`.
3. `TokenService.decodeToken()` does a manual base64 decode and tolerates multiple claim
   shapes — Microsoft schema (`http://schemas.microsoft.com/ws/...`), plain `role`,
   `Role`, `RoleName`.
4. `AuthStateService` exposes an `isLoggedIn$` BehaviorSubject so header + sidebar react to
   login/logout without rereading `sessionStorage`.
5. Login redirects per role:
   - `Citizen` → `/citizen-home`
   - `Admin` → `/home/admin`
   - `Compliance Officer` → `/compliance` (then they can click into compliance-records)
   - Everyone else (Doctor / Lab Tech / PHO / Researcher) → `/home`
6. The functional `auth-interceptor.ts` runs on every request — reads the token, attaches
   `Authorization: Bearer <jwt>`, and logs errors so the app sees clean streams.

**Forgot password**: public `/forgot-password` route → `PUT /User/forgotpassword`. The
Admin user-management page also calls this endpoint to reset a chosen user's password.

---

## Routing & guards

`app.routes.ts` is the single source of truth. Public routes have no guards. Protected
routes use both guards:

```ts
{ path: 'patients',
  component: PatientsComponent,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Admin', 'Doctor', 'Public Health Officer', 'Lab Technician'] } }
```

- `authGuard`: returns true if token exists; otherwise `router.navigate(['/login'])`.
- `roleGuard`: reads `route.data['roles']` and matches against the decoded JWT role;
  mismatch → `/unauthorized`.

Route map highlights:
- `/` → public `HomeComponent` (landing page, anyone can see)
- `/home` → role-specific `DashboardHomeComponent` (staff only)
- `/home/admin` → `AdminDashboardComponent`
- `/citizen-home`, `/symptom-report`, `/symptom-history` → Citizen
- `/patients`, `/cases`, `/medical-records`, `/all-symptom-reports` → clinical
- `/lab-tests`, `/lab-tests/{create,upload-report,my-assignments,:id,:id/edit}` → lab
- `/outbreaks/*`, `/epidemiology` → outbreak + epi
- `/compliance-records[/new]`, `/audit` → compliance + audit
- `/analytics` → every authenticated user (Citizen sees only public charts)
- `/users`, `/update`, `/delete` → Admin only

---

## Shared services (`core/services/`)

| Service                  | Responsibility                                                                                |
|--------------------------|-----------------------------------------------------------------------------------------------|
| `AuthService`            | login(), logout(), `isLoggedIn$`, `hasRole()`, `hasAnyRole()`. Single source of truth.         |
| `TokenService`           | get/set/remove JWT, decode payload, expose `getUserId/Role/Email`.                            |
| `AuthStateService`       | RxJS BehaviorSubject mirroring auth state for templates.                                      |
| `UserService`            | `/User` — register, login, getById, update, soft-delete, getAll, forgotPassword.              |
| `PatientService`         | `/Patient` — search, getById, register, update, deactivate.                                   |
| `CaseService`            | `/Cases` — CRUD; PUT/DELETE return plain text so `responseType: 'text'` is used.              |
| `MedicalRecordService`   | `/MedicalRecord` — add, getRecords by patientId, update, deactivate (PATCH /close).            |
| `LabTestService`         | `/LaboratoryTesting` + `/LabReport` — list, create, update, download, **multipart upload**.   |
| `OutbreakService`        | `/OutbreakMonitoring` + `/ReportingAndAnalytics/outbreaks` — outbreak + Epidemiology CRUD.    |
| `SymptomReportService`   | `/CitizenSymptomReporting` — submit, my-reports, all-reports, update status, delete.          |
| `ComplianceService`      | `/ComplianceRecord` — create, get(filter), getById, update, delete; uses `responseType:'text'`.|
| `AuditService`           | `/Audit` — full CRUD + close.                                                                  |
| `AnalyticsService`       | `/ReportingAndAnalytics/*` — cases, patients, outbreaks, epidemiology, compliance metrics.    |
| `LookupService`          | **Cached** observable lookups (patients, technicians, cases, lab tests, outbreaks, symptom reports) using `shareReplay(1)`. Drives `<app-id-picker>` everywhere. |

### Interview talking-point: `LookupService` + `IdPicker`

> "Users complained they had to memorise database IDs. I built a `LookupService` that
> caches per-entity lookup lists with `shareReplay(1)` so multiple pages share one HTTP
> call, and a reusable `<app-id-picker>` form control that implements
> `ControlValueAccessor` so it plugs into both `formControlName` and `[(ngModel)]`. Any ID
> input across the app — Symptom Report on cases, Test on lab report upload, Outbreak on
> epidemiology — became a searchable dropdown with two-line options."

---

## Reusable building blocks (`shared/components/`)

### `<app-id-picker>`
- Searchable dropdown with label + sub-text + numeric ID.
- `ControlValueAccessor` → works with reactive + template-driven forms.
- `[allowManualEntry]="true"` — accept a typed numeric ID when the list is empty (used on
  Lab Tech picker for non-admins, since `/User/GetAll` is Admin-only).
- Listens for `document:click` to close on outside click.

### `<app-footer>`
- Drop-in footer with `[variant]="'light'|'dark'"` and `[compact]="true"`.
- Used on the public Home page; can be added to any other page.

### `<app-sidebar>`
- Role-aware menu — hard-coded `allNavItems` list, each entry declares `roles: string[]`.
  Filters on the JWT role at init. Role-coloured user badge at the top.

### `<app-header-component>` (top navbar)
- Fully restyled. **Home** link goes to `/` (public landing).
- Custom HealthNet vocabulary (`.hn-nav`, `.hn-brand`, `.hn-links`, `.hn-actions`,
  `.hn-profile`, `.hn-dropdown`) replaces the old plain Bootstrap navbar.
- Gradient-blue brand mark + bold "HealthNet" wordmark on the left.
- Each link has a Tabler icon + label, hover state, and an **active-route highlight**
  via `routerLinkActive="active"`. Home uses `routerLinkActiveOptions: { exact: true }`
  so it doesn't stay lit on every child route.
- Profile pill: 32×32 gradient circle with a `ti-user-circle` icon (was the user's
  first initial — switched to icon for clarity), caret, dropdown with Profile / Logout.
- Bar height is **60px desktop / 56px mobile**. The height is exposed as the CSS
  variable `--hn-nav-h` so every full-viewport page (`100vh`) can subtract it.
- On mobile (<992px) the bar collapses to a burger + brand and the links live in an
  off-canvas drawer.
- `backdrop-filter: blur(10px)` for a frosted-glass effect over the page content.

---

## Components — interview tour

> **How to read this**: each row tells you what to say if an interviewer points at the
> folder. Keep answers to one or two sentences.

### Auth + public

| Component | Route | What to say |
|---|---|---|
| `home-component` | `/` | Public landing page. Gradient hero + inline SVG hub-and-spoke illustration showing the six modules (Doctor / Lab / Patients / Outbreak / Compliance / Analytics). Stat strip, six feature cards, six role cards, CTA band, footer. Visible to everyone — replaces the old Dashboard navbar link. |
| `login-component` | `/login` | Two-pane shell (gradient brand panel + form card). Uses `min-height: calc(100vh - var(--hn-nav-h, 60px))` so it fits exactly between the fixed navbar and the viewport bottom. JWT-based login that redirects per role. **`isSubmitting` is set before the request fires** (was inside the success callback, so the spinner only flashed after the response — fixed) and stays true through the role redirect for visual continuity. Double-click guard. |
| `register-component` | `/register` | Multi-field form with strong-password regex (8+ chars, upper, lower, digit, special) and 10-digit phone validation. Live password-match indicator. Uses `min-height: calc(100vh - var(--hn-nav-h))` like login. |
| `forgot-password-component` | `/forgot-password` | Calls `PUT /User/forgotpassword`. Cross-field validator ensures new + confirm match. Same `calc(100vh - var(--hn-nav-h))` layout. |
| `about-component` | `/about` | Marketing-style public page: gradient hero, stat strip, pillar cards, alternating image+copy module rows. |
| `compliance-component` | `/compliance` | Public posture page: hero, 3-step Audit→Record→Review flow, four result-chip pills, role permissions matrix, closing CTA. |
| `unauthorized` | `/unauthorized` | Static 403 fallback used by `roleGuard`. |
| `auth-component` | — | Auth helpers/scaffolding folder. |

### Dashboards

| Component | Route | What to say |
|---|---|---|
| `dashboard-home-component` | `/home` | Role-specific staff dashboard. Fetches **role-relevant stats** on init — Doctor sees patients/cases/pending tests; PHO sees active outbreaks + cases; Lab Tech sees own pending/completed; Compliance sees records/pending/non-compliant; Researcher sees outbreaks + epi records. Shows a role-specific tip card and a 4–6-tile Quick Access grid. Admin auto-redirects to `/home/admin`. |
| `admin-dashboard-component` | `/home/admin` | Admin-only. **Active Members hero card** with %, progress bar, and Admin/Staff/Citizen split. Total Users compact card. Role distribution chips. Quick actions. Sortable user table (newest first). |
| `citizenhome-component` | `/citizen-home` | Citizen landing page. |

### Citizen workflow

| Component | Route | What to say |
|---|---|---|
| `symptomreport-component` | `/symptom-report` | Form with 12 common symptoms + 7 vitals. Temperature and Oxygen are required (others optional). Payload is **compacted before submit** — only `true` symptoms, only non-null vitals — because the backend `SymptomsJson` column is small and truncates verbose payloads. |
| `symptomhistory-component` | `/symptom-history` | Paginated list of the citizen's own past reports via `GET /CitizenSymptomReporting/mine`. |

### Clinical workflow

| Component | Route | What to say |
|---|---|---|
| `patients-component` | `/patients` | Patient registry with search, status filter, register form (10-digit phone validation), update flow, view-detail modal (`GET /{id}`), and a **Deactivate** action under the row's Actions column. The deactivate flow uses `responseType: 'text'` on the service (backend now returns plain text from `Ok(result.Message)`), surfaces that text verbatim in the success bar, and **optimistically flips the row's status to `InActive` before the refetch lands**. Lab Tech can read the list too. **Sorted newest first.** |
| `cases-component` | `/cases` | Cases CRUD. Symptom-report picker **filters out reports whose citizen already has a case** (backend rejects duplicates). Diagnosis validator blocks the literal string `"string"` and all-digit inputs (mirrors backend rule). PUT/DELETE use `responseType: 'text'`. Sorted newest first. |
| `medical-records-component` | `/medical-records` | Add / View / Update / Deactivate. **Backend's `MedicalRecordGetDto` doesn't return RecordId**, but the Add/Update *response* does — so I cache the RecordId in a session-local Map keyed by `(date\|diagnosis\|treatmentPlan)` and stamp it onto matching rows in the list. After a deactivate, the row's badge optimistically reads `Deactive` until the page reloads. |
| `all-symptom-reports-component` | `/all-symptom-reports` | Doctor / PHO / Admin / Researcher view of every citizen report. Status PATCH sends the **numeric enum value** (`Submitted=1, UnderReview=2, Reviewed=3, Closed=4`) under both `Status` (Pascal) and `status` (camel) for cross-config compatibility, and uses `responseType: 'text'` because the API returns plain text. Sorted newest first. Optimistic status badge update. |

### Lab workflow

| Component | Route | What to say |
|---|---|---|
| `lab-test-component` | `/lab-tests` | Lab Tests list with type/status/date filters, KPI strip (total / pending / completed / blood). Sorted newest first. |
| `lab-test-create-component` | `/lab-tests/create` | Create test with patient + technician pickers. Lab-Tech picker has `allowManualEntry` enabled because `/User/GetAll` is Admin-only — a Doctor can type the tech ID directly. |
| `lab-test-detail-component` | `/lab-tests/:id` | Test detail + reports list. |
| `lab-test-edit-component` | `/lab-tests/:id/edit` | Update test type; Doctor can reassign technician via picker. |
| `lab-report-upload-component` | `/lab-tests/upload-report` | **Multipart upload** to `POST /LabReport` — FormData with `TestId` + `File`. Let HttpClient set the multipart boundary — never set `Content-Type` manually. Shows the tech's pending tests as a picker. |
| `lab-tech-assignments-component` | `/lab-tests/my-assignments` | "My Assignments" — filters `/lab-tests` to `technicianId === currentUserId`. Sorted newest first. |

### Outbreak & Epidemiology

| Component | Route | What to say |
|---|---|---|
| `outbreak-component` (form) | `/outbreaks/new` | Declare new outbreak. |
| `outbreak-component/outbreak-list` | `/outbreaks/list` | List with KPI cards (total / active / resolved / showing). **Location filter is client-side** on `o.location.toLowerCase().includes(...)` — the analytics endpoint's `region` param doesn't reliably match free-text. Severity, disease, location, status, date — all wired. Sorted newest first. |
| `outbreak-component/outbreak-dashboard` | `/outbreaks` | Overview card hub. |
| `outbreak-component/outbreak-detail` | `/outbreaks/:id` | Outbreak detail with "Create Epidemiology" deep-link to `/epidemiology?outbreakId=...`. |
| `outbreak-component/outbreak-update` | `/outbreaks/:id/edit` | Patch severity / endDate / status. |
| `epidemiology-component` | `/epidemiology` | Full CRUD for epidemiology metrics under an outbreak. The form serializes a strict **`{ cases, recoveries, RtNow }`** object into `MetricsJSON` — those three keys are the contract. Status defaults to `true` on create (matches backend default). Sorted newest first. |

### Compliance & Audit

| Component | Route | What to say |
|---|---|---|
| `compliance-component` (public) | `/compliance` | Marketing posture page (see Auth+public above). |
| `compliance-record-component` | `/compliance-records[/new]` | Compliance CRUD with the four-pill result picker (`compliant`, `non compliant`, `partially compliant`, `pending review` — backend wire values). **Entity picker is type-aware** — picking "Lab Test" loads tests, "Outbreak" loads outbreaks, etc., via `LookupService`. PUT/DELETE use `responseType: 'text'` (fixed parse-error bug). Sorted newest first. |
| `audit-component` | `/audit` | Audit CRUD: create / list with multi-field filter / view / inline update (blocked once closed) / close / delete. Sorted newest first. |

### Analytics

| Component | Route | What to say |
|---|---|---|
| `analytics-component` | `/analytics` | Tabbed dashboard for cases / patients / outbreaks / epidemiology / compliance. KPI cards + custom SVG bar charts and a donut chart for compliance distribution (no external chart library). Open to every authenticated role — Citizens see only public outbreak/epi data. |

### Admin

| Component | Route | What to say |
|---|---|---|
| `users-component` | `/users` | Admin user management. Filterable table (search, status=Active only, role), Active count pill, view modal, edit inline, soft-delete (with **optimistic row-flip** before the refetch comes back), **Reset Password modal** (admin-drives `/User/forgotpassword` for any user). Sorted newest first. |
| `update-user-component` | `/update` | Legacy single-user update form; kept for back-compat. Markup is Bootstrap; the CSS file applies HealthNet branding via `:host` overrides (gradient header, 18px-radius card, 10px-radius inputs with primary focus glow, gradient blue submit). |
| `delete-user-component` | `/delete` | Legacy soft-delete form. Same `:host`-override pattern as Update User, but with a HealthNet **red** gradient header + danger button (`#791F1F → #A32D2D`) so the page reads as a destructive action. |
| `profile-component` | `/profile` | Logged-in user's profile. Role-coloured gradient banner with initials avatar, three cards: About (key-value), Quick Actions (admin sees Update/Deactivate; everyone sees Reset Password + Analytics), Security & Access. Skeleton loaders. |

---

## Models (`core/models/`)

Mirror backend DTOs. Worth remembering:

- `User.ts`, `UpdateUser.ts`, `register.ts` — auth + admin payloads.
- `patient.model.ts` — `RegisterPatientRequest` etc. **ContactInfo is phone-only** (no email).
- `case.model.ts` — `CreateCaseRequest { reportId, diagnosis, status }`.
- `medical-record.model.ts` — note `MedicalRecordGetDto` has no `RecordId` field
  (matches the backend quirk; the Add/Update *response* DTO does have RecordId).
- `lab-test.model.ts` — test + report shapes + upload result.
- `Outbreak.ts` + `epidemiology.model.ts` — outbreak + epi metrics; MetricsJSON is
  strict `{ cases, recoveries, RtNow }`.
- `compliance.model.ts` — request, list-dto, filter, update (4 result values lowercase).
- `audit.model.ts` — `AuditFilterDto`, `UpdateAuditRequest`, list dto.
- `analytics.model.ts` — typed response shapes for every analytics endpoint.
- `symptom-report.ts` — `SymptomsJsonPayload` for citizen reports.

---

## Styling architecture

- **One source of truth**: `src/styles.css` defines CSS custom properties
  (`--hn-primary`, `--hn-bg-page`, `--hn-radius`…) and the design system:
  `.page`, `.card`, `.form-control`, `.btn-*`, `.badge-*`, `.modal-*`, `.kpi-*`,
  `.search-row`, `.filter-row`, alerts, table styles, animations, responsive defaults.
- **Component CSS** only carries palette overrides (e.g. lab-tech amber pages) and
  deltas specific to that page (column hides at small breakpoints, custom widgets like
  the donut chart, the Active Members hero card).
- **Why**: removed ~120KB of duplicate CSS across components and locks the design
  language so a token change propagates everywhere.

---

## Cross-cutting interview talking points

1. **Standalone components everywhere.** No NgModules. Each component declares its own
   `imports` array. Easier to tree-shake and reason about.

2. **Functional HTTP interceptors.** `auth-interceptor.ts` is a pure function registered
   via `provideHttpClient(withInterceptors([...]))`. Clean, testable.

3. **Plain-text responses.** Several backend endpoints return `"OK message"` as text,
   not JSON. `HttpClient` defaults to JSON-parse and throws. The fix is
   `responseType: 'text'` on:
   - PATCH `/CitizenSymptomReporting/{id}` (status update)
   - PUT / DELETE `/Cases/{id}`
   - PUT / PATCH / DELETE `/Audit/{id}`
   - PUT / PATCH `/MedicalRecord/{id}*`
   - PUT / DELETE `/ComplianceRecord/{id}`
   - **PATCH `/Patient/{id}/deactivate` (latest backend change — service now reads the
     plain-text `result.Message` and the patient row optimistically flips to InActive
     before the refetch returns).**

4. **Error-message extraction.** Backend throws `ArgumentException` with specific
   strings (`"Duplicate case for this citizen."`, `"Diagnosis must not be a placeholder."`).
   An `extractError(err, fallback)` helper unwraps plain-text, `{message}`,
   ProblemDetails `{title, detail, errors}` so the red banner shows the real reason.

5. **Optimistic UI updates.** Three examples:
   - **Patient** deactivate → flip the row's `status` to `'InActive'` **before** the
     refetch, so the badge changes the instant the click registers (the actual backend
     PATCH returns plain text we still surface verbatim in the success toast).
   - **User** deactivate → same pattern in the admin Users table — flip `status: false`
     locally, then refresh.
   - **Medical-record** deactivate → add the recordId to a `Set<number>` so the badge
     reads `Deactive` immediately, even though the GET endpoint never tells us status.

6. **Session-local ID caching.** Medical-record GET doesn't return RecordId, but
   POST/PUT *responses* do — the component remembers each RecordId keyed by
   `(date|diagnosis|treatmentPlan)` so newly-created rows show their real IDs in the
   list table without a backend change.

7. **GetAll newest-first.** Every major list — users, patients, cases, lab tests,
   outbreaks, audits, compliance, epidemiology, symptom reports — sorts by primary ID
   descending after fetch.

8. **Role-aware UI.** Beyond route guards, every page asks `AuthService.getUserRole()`
   to decide which buttons render. The sidebar filters menu items the same way.

9. **No NgRx.** State lives in components + a handful of `BehaviorSubject`s in
   `AuthStateService`. Simpler code + faster onboarding; for this app size it's the
   right call.

10. **Compact JSON for tiny columns.** `SymptomsJson` backend column was overflowing,
    so the citizen form filters to only `true` symptoms and non-null vitals before
    submit. A real backend fix would widen the column; we couldn't touch backend.

11. **Picker as ControlValueAccessor.** One reusable component drives every ID input
    across the app. Implements `writeValue / registerOnChange / registerOnTouched` and
    provides `NG_VALUE_ACCESSOR`. Works with both reactive and template-driven forms.

12. **Lookup cache with `shareReplay(1)`.** First subscriber triggers the HTTP call,
    every subsequent subscriber gets the cached value synchronously. Refreshable via
    `LookupService.refresh(kind)`.

13. **Public vs role-specific dashboards.** `/` is a public landing page (anyone can
    see it). `/home` is the role-specific staff dashboard with role-relevant stats
    + tip card. `/home/admin` is the admin-only KPI page. Three distinct destinations,
    one consistent visual language.

14. **`--hn-nav-h` CSS variable.** The fixed navbar is 60px on desktop / 56px on mobile.
    Body padding-top and every `100vh` shell (login, register, forgot-password, the
    legacy update/delete user pages) use `calc(100vh - var(--hn-nav-h, 60px))` so
    nothing slides behind the navbar. Resize the navbar and every layout adjusts —
    the value lives in one place in `src/styles.css`.

15. **Loading-state timing matters.** Sign-in had a classic bug: the spinner flag
    `isSubmitting = true` was set inside the success callback, so it only flashed
    *after* the response landed. Moved it to before the HTTP call so the button
    shows "Signing in…" for the actual duration of the request. Same pattern is
    safe to copy for any other submit flow that feels jumpy.

---

## Running the app

```bash
npm install
npm start                          # serves on http://localhost:4200
npx ng build                       # production build
npx ng build --configuration=development
```

Backend must be running on `http://localhost:5171` (see `src/environments/environment.ts`).

---

## File-finding cheat sheet

| Looking for…              | Path                                                            |
|---------------------------|-----------------------------------------------------------------|
| API base URL              | `src/environments/environment.ts`                              |
| All routes                | `src/app/app.routes.ts`                                         |
| Auth guard                | `src/app/core/guards/auth-guard.ts`                             |
| Role guard                | `src/app/core/guards/role-guard.ts`                             |
| HTTP interceptor          | `src/app/core/interceptors/auth-interceptor.ts`                 |
| Lookup cache              | `src/app/core/services/lookup.service.ts`                       |
| Reusable picker           | `src/app/shared/components/id-picker/`                          |
| Shared footer             | `src/app/shared/components/footer-component/`                   |
| Sidebar menu config       | `src/app/shared/components/sidebar-component/sidebar-component.ts` |
| Navbar (Home, Compliance…)| `src/app/shared/components/header-component/header-component.html` |
| Global design tokens      | `src/styles.css`                                                |
| Public landing page       | `src/app/components/home-component/`                            |
| Admin dashboard           | `src/app/components/admin-dashboard-component/`                 |
| Role dashboard            | `src/app/components/dashboard-home-component/`                  |

---

## Known backend constraints (good "what would you change?" answers)

- `/User/GetAll` is Admin-only, so non-admin roles can't populate the technician picker.
  Mitigated with `allowManualEntry` on `<app-id-picker>`.
- `MedicalRecordGetDto` **now ships `RecordId`** (latest backend pull added it). The
  frontend's `mapRecord(r)` reads `r.recordId ?? r.RecordId ?? cached ?? 0`, so the
  Record-ID column lights up automatically. The session-local cache + "Manage by
  Record ID" panel are still in place as a defensive fallback in case the DTO ever
  reverts.
- `MedicalRecord` enforces "one active record per patient" — the UI surfaces this rule
  in an info banner on the Add form.
- `SymptomsJson` column is small; payloads must be compacted before submit.
- Backend prevents a second case for the same citizen — the cases picker hides reports
  whose citizen already has a case so the user can't even try.
- Several endpoints return plain text — `responseType: 'text'` is required on the
  matching service methods.

---

## Test files

`*.spec.ts` files live next to components but are scaffolded defaults. The focus is
end-to-end flows against the live backend.
