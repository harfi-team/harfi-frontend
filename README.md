# حرفي — Harfi Frontend

> **Arabic-first platform connecting Egyptian customers with verified craftsmen.**  
> Built with Angular 21 · Standalone Components · Bootstrap 5 · RTL · i18n

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Folder Structure](#4-folder-structure)
5. [Team — Who Works Where](#5-team--who-works-where)
6. [Getting Started](#6-getting-started)
7. [Key Conventions](#7-key-conventions)
8. [API & Backend Integration](#8-api--backend-integration)
9. [Git Workflow](#9-git-workflow)

---

## 1. Project Overview

**Harfi (حرفي)** is a web platform that connects Egyptian customers with trusted, verified craftsmen. The frontend is an Angular 21 standalone application with:

- 🌍 **Two languages** — Arabic (default, RTL) and English (LTR)
- 🌙 **Two themes** — Light and Dark mode via CSS custom properties
- ⚡ **Real-time** — Chat and notifications powered by SignalR
- 🤖 **AI assistant** — Groq-powered RAG chatbot for smart craftsman discovery
- 🔐 **JWT auth** — Access token + refresh token with silent retry

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 — Standalone Components (no NgModules) |
| Styling | CSS + Bootstrap 5 RTL |
| i18n | `@ngx-translate/core` v17 — Arabic default, English fallback (`fallbackLang`) |
| Real-time | `@microsoft/signalr` — Chat Hub + Notification Hub |
| HTTP | Angular `HttpClient` with functional interceptors |
| Auth | JWT stored in `localStorage`, auto-refresh on 401, 30s expiry buffer |
| Routing | Angular Router — all feature modules **lazy loaded** |
| Path Aliases | `@core`, `@shared`, `@features`, `@env` via `tsconfig.json` paths |

---

## 3. Architecture Overview

The app follows a **three-layer frontend architecture**:

```
┌──────────────────────────────────────────────────────────────────┐
│                         CORE LAYER                               │
│  Lives once for the entire app lifetime                          │
│                                                                  │
│  Interceptors ── Guards ── Services ── Models ── SignalR Hubs    │
│  (JWT attach)   (auth/role) (token,     (DTOs    (chat hub,      │
│  (401 refresh)  (guest)      theme,      matching  notif hub)    │
│                              language)   backend)                │
└───────────────────────────────┬──────────────────────────────────┘
                                │ provides to
┌───────────────────────────────▼──────────────────────────────────┐
│                        SHARED LAYER                              │
│  Reusable UI pieces used across multiple features                │
│                                                                  │
│  Components ── Layouts ── Directives ── Pipes                    │
│  (navbar,       (main-     (rtl-form    (translate,              │
│   footer,        layout,    directive)   relative-time)          │
│   spinner,       auth-                                           │
│   toast,         layout)                                         │
│   star-rating,                                                   │
│   confirm-dialog)                                                │
└───────────────────────────────┬──────────────────────────────────┘
                                │ used by
┌───────────────────────────────▼──────────────────────────────────┐
│                       FEATURES LAYER                             │
│  9 modules — each maps to one backend controller                 │
│  Each module is LAZY LOADED (loads only when user navigates)     │
│                                                                  │
│  auth ── craftsman ── user ── admin ── jobs                      │
│  reviews ── chat ── notifications ── ai                          │
└──────────────────────────────────────────────────────────────────┘
```

### How Lazy Loading Works

Every feature folder has its own `*.routes.ts`. The root `app.routes.ts` points to them like this:

```typescript
// app.routes.ts (simplified)
{
  path: 'auth',
  loadChildren: () => import('./features/auth/auth.routes')
}
```

The browser **only downloads** a feature's code when the user navigates to that route — keeping the initial bundle small.

### How RTL / LTR Works

`language.service.ts` sets two attributes on the `<html>` tag at runtime:
- `document.documentElement.dir = 'rtl'` or `'ltr'`
- `document.documentElement.lang = 'ar'` or `'en'`

CSS then responds to these attributes to flip layouts and switch fonts automatically.

### How Light / Dark Mode Works

`theme.service.ts` sets `data-theme="dark"` on `<html>` when dark mode is active. All colors are CSS custom properties in `styles.css` that change based on that attribute — no component needs to know about the theme.

---

## 4. Folder Structure

```
harfi-frontend/
│
├── src/
│   ├── assets/
│   │   ├── i18n/
│   │   │   ├── ar.json          ← Arabic strings (all user-facing text)
│   │   │   └── en.json          ← English strings
│   │   ├── images/
│   │   └── fonts/
│   │
│   ├── environments/
│   │   ├── environment.ts       ← Dev: API URL, SignalR hub URLs
│   │   └── environment.prod.ts  ← Prod: deployed API URL
│   │
│   ├── styles.css               ← Global styles, CSS variables, RTL overrides
│   ├── main.ts                  ← App bootstrap
│   ├── app.config.ts            ← All global providers (router, http, translate)
│   ├── app.routes.ts            ← Root routes — all lazy
│   └── app/
│       │
│       ├── core/                ─────────────────────────────────────────────
│       │   ├── interceptors/    ← Run on EVERY HTTP request automatically
│       │   │   ├── auth.interceptor.ts      (attaches Bearer token)
│       │   │   └── refresh.interceptor.ts   (retries on 401)
│       │   │
│       │   ├── guards/          ← Protect routes
│       │   │   ├── auth.guard.ts            (must be logged in)
│       │   │   ├── role.guard.ts            (admin / craftsman / customer)
│       │   │   └── guest.guard.ts           (redirect if already logged in)
│       │   │
│       │   ├── services/        ← App-wide singleton services
│       │   │   ├── auth.service.ts          (login, register, logout, refresh)
│       │   │   ├── token.service.ts         (localStorage read/write/clear)
│       │   │   ├── theme.service.ts         (light/dark toggle)
│       │   │   ├── language.service.ts      (ar/en switch + dir/lang on <html>)
│       │   │   └── error-handler.service.ts (global HTTP error toasts)
│       │   │
│       │   ├── models/          ← TypeScript interfaces matching backend DTOs
│       │   │   ├── auth.models.ts
│       │   │   ├── craftsman.models.ts
│       │   │   ├── job.models.ts
│       │   │   ├── review.models.ts
│       │   │   ├── chat.models.ts
│       │   │   ├── notification.models.ts
│       │   │   └── api-error.models.ts      ({ status, message, timestamp })
│       │   │
│       │   └── hubs/            ← SignalR real-time connections
│       │       ├── chat.hub.service.ts          (/hubs/chat)
│       │       └── notification.hub.service.ts  (/hubs/notifications)
│       │
│       ├── shared/              ─────────────────────────────────────────────
│       │   ├── components/      ← Reusable UI components
│       │   │   ├── navbar/              (lang toggle, theme toggle, auth links)
│       │   │   ├── footer/
│       │   │   ├── spinner/             (loading indicator)
│       │   │   ├── toast/               (success/error notifications in Arabic)
│       │   │   ├── star-rating/         (used in reviews + craftsman profile)
│       │   │   └── confirm-dialog/      (confirmation popups)
│       │   │
│       │   ├── layouts/         ← Page wrapper components
│       │   │   ├── main-layout/ (navbar + router-outlet + footer)
│       │   │   └── auth-layout/ (centered card — for login/register screens)
│       │   │
│       │   ├── directives/
│       │   │   └── rtl-form.directive.ts    (auto text-align on inputs)
│       │   │
│       │   └── pipes/
│       │       ├── translate.pipe.ts        (wraps ngx-translate)
│       │       └── relative-time.pipe.ts    ("منذ ٣ دقائق")
│       │
│       └── features/            ─────────────────────────────────────────────
│           │                    9 modules, each = one backend controller
│           │
│           ├── auth/            → POST /api/auth/*
│           │   ├── login/
│           │   ├── register/
│           │   ├── verify-email/
│           │   └── verify-phone/
│           │
│           ├── craftsman/       → GET|POST /api/Craftsmen/*
│           │   ├── search/
│           │   ├── profile/
│           │   └── register/
│           │
│           ├── user/            → GET|PUT /api/Users/profile/*
│           │   └── profile/
│           │
│           ├── admin/           → /api/Admin/* (role: admin only)
│           │   └── pending-craftsmen/
│           │
│           ├── jobs/            → /api/jobs/*
│           │   ├── job-list/
│           │   └── job-create/
│           │
│           ├── reviews/         → /api/reviews/*
│           │   └── review-form/
│           │
│           ├── chat/            → /api/Conversations/* + SignalR
│           │   ├── chat-list/
│           │   └── chat-detail/
│           │
│           ├── notifications/   → /api/Notifications/* + SignalR
│           │   └── notification-list/
│           │
│           └── ai/              → /api/AI/*
│               └── ai-chat/
│
├── .env.development             ← Local API base URL
├── .env.production              ← Production API base URL
├── angular.json
├── package.json
└── tsconfig.json
```

---

## 5. Team — Who Works Where

> Each person works **inside their assigned folders only**.  
> Never touch another person's feature folder directly — use a PR.

### 👥 Team & Assignments

| Name | Role | Assignment |
|------|------|------------|
| Esraa | Frontend Lead | Project Structure + Foundation + Auth |
| Hadeer | Frontend | Craftsman Discovery, Search & Profiles |
| Habiba | Frontend | Booking System & Job Lifecycle |
| Mazen | Frontend | AI Assistant & Reviews |
| Ibrahim | Frontend | Real-time Chat & Notifications |

---

### 🟢 Esraa — Project Structure + Foundation + Auth ✅

```
src/
├── app.ts
├── app.config.ts
├── app.routes.ts
├── styles.css
├── assets/i18n/
│   ├── ar.json
│   └── en.json
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
└── app/
    ├── core/
    │   ├── interceptors/
    │   │   ├── auth.interceptor.ts
    │   │   └── refresh.interceptor.ts
    │   ├── guards/
    │   │   ├── auth.guard.ts
    │   │   ├── role.guard.ts
    │   │   └── guest.guard.ts
    │   ├── services/
    │   │   ├── auth.service.ts
    │   │   ├── token.service.ts
    │   │   ├── theme.service.ts
    │   │   ├── language.service.ts
    │   │   └── error-handler.service.ts
    │   └── models/
    │       ├── auth.models.ts
    │       └── api-error.models.ts
    ├── shared/
    │   ├── components/
    │   │   ├── navbar/
    │   │   ├── spinner/
    │   │   └── toast/
    │   ├── layouts/
    │   │   ├── auth-layout/
    │   │   └── main-layout/
    │   ├── directives/
    │   │   └── rtl-form.directive.ts
    │   └── pipes/
    │       ├── translate.pipe.ts
    │       └── relative-time.pipe.ts
    └── features/auth/
        ├── auth.routes.ts
        ├── auth.service.ts
        ├── login/
        ├── register/
        ├── verify-email/
        └── verify-phone/
```

---

### 🔵 Hadeer — Craftsman Discovery, Search & Profiles

```
src/app/features/craftsman/
├── craftsman.routes.ts
├── craftsman.service.ts
├── search/
│   └── craftsman-search.component.*
├── profile/
│   └── craftsman-profile.component.*
└── register/
    └── craftsman-register.component.*

src/app/core/models/
└── craftsman.models.ts
```

Backend endpoints:
```
POST /api/Craftsmen/register
GET  /api/Craftsmen/{id}
PUT  /api/Craftsmen/{id}
GET  /api/Craftsmen/search?ServiceType=&City=&MinRating=&MinExperience=
GET  /api/Admin/pending-craftsmen
PUT  /api/Admin/approve/{id}
DELETE /api/Admin/reject/{id}
```

---

### 🟡 Habiba — Booking System & Job Lifecycle

```
src/app/features/jobs/
├── jobs.routes.ts
├── jobs.service.ts
├── job-list/
│   └── job-list.component.*
└── job-create/
    └── job-create.component.*

src/app/core/models/
└── job.models.ts
```

Backend endpoints:
```
POST /api/jobs
PUT  /api/jobs/{id}/accept
PUT  /api/jobs/{id}/reject
PUT  /api/jobs/{id}/complete
GET  /api/jobs/customer/{id}
GET  /api/jobs/craftsman/{id}
```

---

### 🟠 Mazen — AI Assistant & Reviews

```
src/app/features/ai/
├── ai.routes.ts
├── ai.service.ts
└── ai-chat/
    └── ai-chat.component.*

src/app/features/reviews/
├── reviews.routes.ts
├── reviews.service.ts
└── review-form/
    └── review-form.component.*

src/app/core/models/
└── review.models.ts
```

Backend endpoints:
```
GET  /api/AI/welcome
POST /api/AI/chat3
POST /api/reviews
GET  /api/reviews/craftsman/{craftsmanId}
POST /api/reviews/rag-feedback
```

---

### 🔴 Ibrahim — Real-time Chat & Notifications

```
src/app/features/chat/
├── chat.routes.ts
├── chat.service.ts
├── chat-list/
│   └── chat-list.component.*
└── chat-detail/
    └── chat-detail.component.*

src/app/features/notifications/
├── notifications.routes.ts
├── notifications.service.ts
└── notification-list/
    └── notification-list.component.*

src/app/features/user/
├── user.routes.ts
├── user.service.ts
└── profile/
    └── user-profile.component.*

src/app/core/
├── models/
│   ├── chat.models.ts
│   └── notification.models.ts
└── hubs/
    ├── chat.hub.service.ts
    └── notification.hub.service.ts
```

Backend endpoints:
```
POST /api/Conversations
GET  /api/Conversations
GET  /api/Conversations/{id}
GET  /api/Conversations/{id}/messages
PUT  /api/Conversations/{id}/read
GET  /api/Notifications
GET  /api/Notifications/unread-count
PUT  /api/Notifications/{id}/read
PUT  /api/Notifications/read-all
GET  /api/Users/profile/{id}
PUT  /api/Users/profile/{id}

SignalR /hubs/chat
  → SendMessage(conversationId, content)
  ← ReceiveMessage(MessageDto)

SignalR /hubs/notifications
  ← ReceiveNotification(NotificationDto)
```

---

## 6. Getting Started

### Prerequisites

```bash
node -v   # must be >= 18
npm -v    # must be >= 9
ng version --skip-confirmation  # must be Angular CLI 21+
```

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/harfi-team/harfi-frontend.git
cd harfi-frontend

# 2. Install dependencies
npm install

# 3. Start the dev server
ng serve

# Open: http://localhost:4200
```

> Make sure the backend is running on `http://localhost:5108` before testing API calls.

### Environment files

| File | Purpose |
|---|---|
| `src/environments/environment.ts` | Dev — points to `localhost:5108` |
| `src/environments/environment.prod.ts` | Prod — points to deployed API |

---

## 7. Key Conventions

### Every component must be standalone

```typescript
@Component({ standalone: true, imports: [...] })
export class LoginComponent {
  private auth = inject(AuthService);  // ✅ inject() not constructor
}
```

### All forms use Reactive Forms (no Template-driven)

```typescript
form = new FormGroup({
  email:    new FormControl('', [Validators.required, Validators.email]),
  password: new FormControl('', [Validators.required, Validators.minLength(8)])
});
```

### All user-facing text must come from i18n files

```html
<!-- ✅ Correct -->
<button>{{ 'LOGIN' | translate }}</button>

<!-- ❌ Wrong — hardcoded text -->
<button>تسجيل الدخول</button>
```

### Error messages come from the API, not the frontend

```typescript
// The API always returns { status, message, timestamp }
// error-handler.service.ts reads error.message and shows it in a toast
// Components just call the service and let the interceptor handle errors
```

### CSS custom properties for all colors

```css
/* ✅ Correct — works in both light and dark mode */
color: var(--text-primary);
background: var(--bg-secondary);

/* ❌ Wrong — breaks dark mode */
color: #212529;
```

### Use path aliases for imports

```typescript
// ✅ Correct
import { AuthService } from '@core/services/auth.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';

// ❌ Wrong — brittle relative paths
import { AuthService } from '../../../core/services/auth.service';
```

---

## 8. API & Backend Integration

### Base URL

All HTTP calls go through `environment.apiBaseUrl`. Never hardcode a URL in a service.

```typescript
// ✅ Correct
constructor(private http: HttpClient) {}
getProfile() {
  return this.http.get(`${environment.apiBaseUrl}/Users/profile`);
}
```

### Standard error shape

Every failed API response returns:
```json
{
  "status": 400,
  "message": "Arabic error message here",
  "timestamp": "2026-06-01T10:30:00Z"
}
```

The global error handler in `core/services/error-handler.service.ts` catches this and shows a toast with `message`.

### User journey — call order

```
Register → Verify Email → (if craftsman) Register Craftsman Profile
         → Verify Phone → Logged in

Login → Store token → Redirect to home

Search → View craftsman profile → Create job → Accept → Complete → Review
```

### SignalR hubs

| Hub | URL | Used by |
|---|---|---|
| Chat | `/hubs/chat` | `core/hubs/chat.hub.service.ts` |
| Notifications | `/hubs/notifications` | `core/hubs/notification.hub.service.ts` |

Both hubs require a valid JWT. Pass it via `accessTokenFactory` in `HubConnectionBuilder`.

---

## 9. Git Workflow

```
main          ← production-ready only
  └── dev     ← integration branch — all features merge here first
        ├── esraa-ProjStructure     (Phase 1 — Foundation)
        ├── hadeer-discovery        (Phase 2 — Craftsman discovery)
        ├── habiba-lifecycle        (Phase 3 — Booking & jobs)
        ├── mazen-ai-reviews        (Phase 4 — AI & reviews)
        └── ibrahim-realtime        (Phase 5 — Chat & uploads)
```

### Branch rules

- ✅ Work only on your own branch
- ✅ Branch off from `dev`, merge back to `dev`
- ✅ One PR per feature — add a clear description
- ❌ Never push directly to `main` or `dev`
- ❌ Never modify another person's feature folder without a PR

### Commit message format

```
feat(auth): add login form with JWT storage
fix(craftsman): correct search query params
style(navbar): fix RTL padding on mobile
```

---

*Harfi Frontend — ITI Graduation Project · June 2026*
