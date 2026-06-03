# Harfi Frontend — Project Analysis

> **Generated:** June 3, 2026  
> **Audience:** External code review  
> **Current phase:** Phase 1 (Foundation) — complete

---

## 1. Project Overview

**Harfi (حرفي)** is an Arabic-first Egyptian web platform connecting customers with trusted, verified craftsmen. The frontend is built with Angular 21 using the standalone components API (zero NgModules).

The platform supports:
- Bilingual UI: Arabic (default, RTL) and English (LTR)
- Dual theme: Light and Dark mode via CSS custom properties
- JWT authentication with access/refresh token flow
- Real-time chat and notifications (SignalR — pending Phase 5)
- AI-powered craftsman discovery assistant (pending Phase 4)

Phase 1 (Foundation) implements the complete authentication system, routing infrastructure, i18n system, theme/language services, shared UI components, and all foundational project wiring. The build produces zero errors.

---

## 2. Tech Stack & Exact Versions

All dependencies from `package.json`:

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/common` | ^21.2.0 | Angular common directives, pipes, services |
| `@angular/compiler` | ^21.2.0 | Angular template compiler |
| `@angular/core` | ^21.2.0 | Angular core framework (signals, DI, etc.) |
| `@angular/forms` | ^21.2.0 | Reactive forms module |
| `@angular/platform-browser` | ^21.2.0 | Browser platform bootstrap |
| `@angular/router` | ^21.2.0 | Angular router with lazy loading |
| `@microsoft/signalr` | ^10.0.0 | Real-time WebSocket connections (chat, notifications) |
| `@ngx-translate/core` | ^17.0.0 | i18n translation service, pipe, directive |
| `@ngx-translate/http-loader` | ^17.0.0 | HTTP loader that fetches JSON translation files |
| `@popperjs/core` | ^2.11.8 | Bootstrap 5 popper dependency |
| `bootstrap` | ^5.3.8 | CSS framework (grid, components, utilities) |
| `rxjs` | ~7.8.0 | Reactive extensions for HTTP and state |
| `tslib` | ^2.3.0 | TypeScript runtime helpers |

Dev dependencies:

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/build` | ^21.2.8 | Angular build system (Vite/esbuild-based) |
| `@angular/cli` | ^21.2.8 | Angular CLI tooling |
| `@angular/compiler-cli` | ^21.2.0 | AOT compiler and type-checking |
| `prettier` | ^3.8.1 | Code formatter |
| `typescript` | ~5.9.2 | TypeScript language |

---

## 3. Angular Configuration

From `angular.json`:

- **Angular version:** 21 (CLI 21.2.8)
- **Project name:** `harfi-frontend`
- **Build system:** `@angular/build:application` (Vite/esbuild — new application builder)
- **Browser entry:** `src/main.ts`
- **TypeScript config:** `tsconfig.app.json`
- **Build output path:** `dist/harfi-frontend` (with `browser/` subdirectory)
- **Default configuration:** `production`

### Assets configuration

```json
"assets": [
  {
    "glob": "**/*",
    "input": "public"
  },
  {
    "glob": "**/*",
    "input": "src/assets",
    "output": "/assets"
  }
]
```

Both `public/` and `src/assets/` are included. The `src/assets` entry was added as a fix — it was originally missing, which caused i18n JSON files to return 404 at runtime.

### Styles array (global CSS)

```json
"styles": [
  "node_modules/bootstrap/dist/css/bootstrap.min.css",
  "src/styles.css"
]
```

Bootstrap 5 is loaded globally first, then the app's custom styles.

### Scripts array

```json
"scripts": [
  "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js"
]
```

Bootstrap's JS bundle (includes Popper.js).

### Non-default build options

- **`skipTests: true`** — All schematics skip test file generation (classes, components, directives, guards, interceptors, pipes, resolvers, services).
- **Production budgets:** Initial bundle warning at 500kB, error at 1MB; any component style warning at 4kB, error at 8kB.
- **Development configuration:** `optimization: false`, `extractLicenses: false`, `sourceMap: true`.
- **outputHashing:** `all` (production only).

---

## 4. TypeScript Configuration

From `tsconfig.json` and `tsconfig.app.json`:

| Setting | Value |
|---------|-------|
| Target | ES2022 |
| Module system | `preserve` (delegates to bundler) |
| Strict mode | `true` (full strict mode) |
| `noImplicitOverride` | `true` |
| `noPropertyAccessFromIndexSignature` | `true` |
| `noImplicitReturns` | `true` |
| `noFallthroughCasesInSwitch` | `true` |
| `skipLibCheck` | `true` |
| `isolatedModules` | `true` |
| `experimentalDecorators` | `true` |
| `importHelpers` | `true` |

### Angular compiler options

| Setting | Value |
|---------|-------|
| `enableI18nLegacyMessageIdFormat` | `false` |
| `strictInjectionParameters` | `true` |
| `strictInputAccessModifiers` | `true` |
| `strictTemplates` | `true` |

### Path aliases

**None defined.** All imports use relative paths.

### Notable

- `tsconfig.app.json` extends the root `tsconfig.json`
- Configures `rootDir: ./src` and `outDir: ./out-tsc/app`
- Only `src/main.ts` is listed as an entry file
- Includes `src/**/*.d.ts` for type declarations

---

## 5. Project Structure Analysis

### Directory tree overview

```
src/
├── app/
│   ├── app.ts                          # Root component
│   ├── app.html                        # Root template
│   ├── app.css                         # Root styles (empty shell)
│   ├── app.config.ts                   # Global providers
│   ├── app.routes.ts                   # Root routes
│   │
│   ├── core/                           # CORE LAYER — 14 files
│   │   ├── guards/                     # 3 route guards
│   │   │   ├── auth.guard.ts
│   │   │   ├── guest.guard.ts
│   │   │   └── role.guard.ts
│   │   ├── interceptors/              # 2 HTTP interceptors
│   │   │   ├── auth.interceptor.ts
│   │   │   └── refresh.interceptor.ts
│   │   ├── models/                    # 7 DTO interface files
│   │   │   ├── auth.models.ts
│   │   │   ├── api-error.models.ts
│   │   │   ├── chat.models.ts         # empty
│   │   │   ├── craftsman.models.ts    # empty
│   │   │   ├── job.models.ts          # empty
│   │   │   ├── notification.models.ts # empty
│   │   │   └── review.models.ts       # empty
│   │   ├── services/                  # 5 services
│   │   │   ├── auth.service.ts
│   │   │   ├── error-handler.service.ts
│   │   │   ├── language.service.ts
│   │   │   ├── theme.service.ts
│   │   │   └── token.service.ts
│   │   └── hubs/                      # 2 SignalR hub stubs (empty)
│   │       ├── chat.hub.service.ts
│   │       └── notification.hub.service.ts
│   │
│   ├── shared/                        # SHARED LAYER — 11 components + layouts + pipes + directives
│   │   ├── components/
│   │   │   ├── navbar/                # 3 files — implemented
│   │   │   ├── spinner/               # 1 file (inline template) — implemented
│   │   │   ├── toast/                 # 1 file (inline template) — implemented
│   │   │   ├── footer/                # 3 files — empty
│   │   │   ├── star-rating/           # 3 files — empty
│   │   │   └── confirm-dialog/        # 3 files — empty
│   │   ├── layouts/
│   │   │   ├── auth-layout/           # 3 files — implemented
│   │   │   └── main-layout/           # 3 files — implemented
│   │   ├── directives/
│   │   │   └── rtl-form.directive.ts  # implemented
│   │   └── pipes/
│   │       ├── translate.pipe.ts      # re-export — implemented
│   │       └── relative-time.pipe.ts  # implemented
│   │
│   └── features/                      # FEATURES LAYER — 9 modules
│       ├── auth/                      # 14 files — FULLY IMPLEMENTED
│       │   ├── auth.routes.ts
│       │   ├── auth.service.ts
│       │   ├── login/*.ts,html,css
│       │   ├── register/*.ts,html,css
│       │   ├── verify-email/*.ts,html,css
│       │   └── verify-phone/*.ts,html,css
│       ├── craftsman/                 # routes stub — components empty
│       ├── user/                      # routes stub — components empty
│       ├── admin/                     # routes stub — components empty
│       ├── jobs/                      # routes stub — components empty
│       ├── reviews/                   # routes stub — components empty
│       ├── chat/                      # routes stub — components empty
│       ├── notifications/             # routes stub — components empty
│       └── ai/                        # routes stub — components empty
```

### Total file count per layer

| Layer | Files | Implemented | Empty stubs |
|-------|-------|-------------|-------------|
| App root | 5 | 5 | 0 |
| Core — guards | 3 | 3 | 0 |
| Core — interceptors | 2 | 2 | 0 |
| Core — models | 7 | 2 | 5 |
| Core — services | 5 | 5 | 0 |
| Core — hubs | 2 | 0 | 2 |
| Shared — components | 15 | 4 | 11 |
| Shared — layouts | 6 | 6 | 0 |
| Shared — directives | 1 | 1 | 0 |
| Shared — pipes | 2 | 2 | 0 |
| Features — auth | 14 | 14 | 0 |
| Features — other (8) | 44 | 9 | 35 |
| **Total** | **106** | **53** | **53** |

---

## 6. i18n (Translation) System — Detailed

### Library

`@ngx-translate/core` v17.0.0 with `@ngx-translate/http-loader` v17.0.0.

### Configuration

In `src/app/app.config.ts`:

```typescript
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTranslateService({
      lang: 'ar',
    }),
    provideTranslateHttpLoader({
      prefix: '/assets/i18n/',
      suffix: '.json',
    }),
  ],
};
```

- `provideTranslateService({ lang: 'ar' })` — the standalone-compatible functional provider API (replaces deprecated `TranslateModule.forRoot()`). Sets the initial language to Arabic.
- `provideTranslateHttpLoader(...)` — registers an HTTP-based loader that fetches files from `/assets/i18n/{lang}.json`. Uses absolute path to work from any route.

### Translation file location

`src/assets/i18n/ar.json` and `src/assets/i18n/en.json`

These are copied to the build output at `dist/harfi-frontend/browser/assets/i18n/` via the `angular.json` assets configuration.

### File format

Standard flat JSON key-value pairs:

```json
{
  "APP_NAME": "حرفي",
  "LOGIN": "تسجيل الدخول",
  "VERIFY_EMAIL_DESC": "أدخل رمز التحقق المرسل إلى {{email}}"
}
```

Parameterized values use double-curly syntax: `{{paramName}}`.

### How TranslatePipe is exposed

`src/app/shared/pipes/translate.pipe.ts` is a simple re-export:

```typescript
export { TranslatePipe } from '@ngx-translate/core';
```

Components import it from this barrel path: `'../../../shared/pipes/translate.pipe'` and include it in their `imports: [...]` array. The pipe is standalone (`static ?pipe: ..., true>` in the type declaration confirms `standalone: true`).

### How LanguageService switches languages

`src/app/core/services/language.service.ts`:

```typescript
export class LanguageService {
  current = signal<Language>('ar');

  constructor(private translate: TranslateService) {
    const saved = localStorage.getItem('harfi_lang') as Language | null;
    const lang = saved || 'ar';
    this.current.set(lang);
    this.apply(lang);
  }

  switchTo(lang: Language): void {
    this.current.set(lang);
    localStorage.setItem('harfi_lang', lang);
    this.apply(lang);
  }

  toggle(): void {
    const next = this.current() === 'ar' ? 'en' : 'ar';
    this.switchTo(next);
  }

  private apply(lang: Language): void {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    this.translate.use(lang);
  }
}
```

The `apply()` method does three things:
1. Sets `dir` attribute on `<html>` (rtl/ltr) — drives RTL CSS
2. Sets `lang` attribute on `<html>` — used by font-family selectors
3. Calls `translate.use(lang)` — triggers HTTP fetch of the JSON file and switches all active TranslatePipe instances

### Current translation keys (48 keys each in ar.json and en.json)

| Key | ar.json | en.json |
|-----|---------|---------|
| `APP_NAME` | حرفي | Harfi |
| `APP_TAGLINE` | منصة الحرفيين الموثوقين في مصر | Egypt's trusted craftsmen platform |
| `LOGIN` | تسجيل الدخول | Login |
| `REGISTER` | إنشاء حساب | Register |
| `LOGOUT` | تسجيل الخروج | Logout |
| `EMAIL` | البريد الإلكتروني | Email |
| `PASSWORD` | كلمة المرور | Password |
| `CONFIRM_PASSWORD` | تأكيد كلمة المرور | Confirm Password |
| `NAME` | الاسم | Name |
| `PHONE` | رقم الهاتف | Phone |
| `ROLE` | نوع الحساب | Account Type |
| `ROLE_CUSTOMER` | عميل | Customer |
| `ROLE_CRAFTSMAN` | حرفي | Craftsman |
| `OPTIONAL` | (اختياري) | (optional) |
| `VERIFY_EMAIL` | تأكيد البريد الإلكتروني | Verify Email |
| `VERIFY_PHONE` | تأكيد رقم الهاتف | Verify Phone |
| `VERIFICATION_CODE` | رمز التحقق | Verification Code |
| `VERIFY_EMAIL_DESC` | أدخل رمز التحقق المرسل إلى {{email}} | Enter the verification code sent to {{email}} |
| `VERIFY_PHONE_DESC` | أدخل رقم هاتفك لاستلام رمز التحقق | Enter your phone number... |
| `VERIFY_PHONE_CODE_DESC` | أدخل رمز التحقق المرسل إلى {{phone}} | Enter the verification code sent to {{phone}} |
| `SEND_CODE` | إرسال الرمز | Send Code |
| `RESEND_CODE` | إعادة إرسال الرمز | Resend Code |
| `RESEND_IN` | إعادة الإرسال بعد {{seconds}} ثانية | Resend in {{seconds}}s |
| `SEARCH` | بحث | Search |
| `SAVE` | حفظ | Save |
| `CANCEL` | إلغاء | Cancel |
| `CONFIRM` | تأكيد | Confirm |
| `LOADING` | جارٍ التحميل... | Loading... |
| `ERROR_GENERIC` | حدث خطأ، حاول مرة أخرى | Something went wrong... |
| `ERROR_401` | يرجى تسجيل الدخول أولاً | Please login first |
| `ERROR_403` | ليس لديك صلاحية | You don't have permission |
| `ERROR_404` | الصفحة غير موجودة | Page not found |
| `THEME_LIGHT` | وضع النهار | Light mode |
| `THEME_DARK` | وضع الليل | Dark mode |
| `NO_ACCOUNT` | ليس لديك حساب؟ | Don't have an account? |
| `HAVE_ACCOUNT` | لديك حساب بالفعل؟ | Already have an account? |
| `VALIDATION_EMAIL_REQUIRED` | البريد الإلكتروني مطلوب | Email is required |
| `VALIDATION_NAME_REQUIRED` | الاسم مطلوب (3 أحرف على الأقل) | Name is required (min 3 characters) |
| `VALIDATION_PASSWORD_MIN` | كلمة المرور يجب أن تكون 8 أحرف على الأقل | Password must be at least 8 characters |
| `VALIDATION_PASSWORD_MISMATCH` | كلمة المرور غير متطابقة | Passwords do not match |
| `VALIDATION_PHONE` | رقم الهاتف غير صحيح... | Invalid phone number... |
| `VALIDATION_CODE` | رمز التحقق يجب أن يكون 6 أرقام | Verification code must be 6 digits |
| `SUCCESS_LOGIN` | تم تسجيل الدخول بنجاح | Logged in successfully |
| `SUCCESS_REGISTER` | تم إنشاء الحساب بنجاح | Account created successfully |
| `SUCCESS_EMAIL_VERIFIED` | تم تأكيد البريد الإلكتروني | Email verified successfully |
| `SUCCESS_PHONE_VERIFIED` | تم تأكيد رقم الهاتف | Phone verified successfully |

### Known limitations

- `SUCCESS_*` keys are defined in the JSON files but no template currently references them — the auth flow uses toast notifications with raw strings from the API error handler instead.
- The `RelativeTimePipe` has hardcoded Arabic/English strings rather than using translation keys — these strings are not included in the i18n JSON files.
- No `MissingTranslationHandler` is configured — missing keys will silently return the key name as the display value.

---

## 7. Authentication Architecture

### DTOs (from `src/app/core/models/auth.models.ts`)

```typescript
export type UserRole = 'customer' | 'craftsman' | 'admin';

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'customer' | 'craftsman';
  phone?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: UserInfoDto;
}

export interface UserInfoDto {
  id: number;
  name: string;
  email: string;
  role: string;
  phone: string;
  profileImageUrl: string;
}

export interface RefreshTokenRequestDto {
  refreshToken: string;  // ONLY field — no accessToken
}

export interface VerifyEmailDto {
  email: string;   // uses email, NOT userId
  code: string;
}

export interface ResendCodeDto {
  email: string;
}

export interface SendPhoneVerificationDto {
  email: string;
  phoneNumber: string;
}

export interface VerifyPhoneDto {
  email: string;
  phoneNumber: string;
  code: string;
}

export interface ResendPhoneCodeDto {
  email: string;
  phoneNumber: string;
}
```

### Token storage strategy

`src/app/core/services/token.service.ts` uses `localStorage` with the following keys:

| localStorage key | Content | Type |
|-----------------|---------|------|
| `harfi_access` | JWT access token | `string` |
| `harfi_refresh` | JWT refresh token | `string` |
| `harfi_user` | Serialized `UserInfoDto` | `JSON string` |
| `harfi_expires` | ISO 8601 expiry timestamp | `string` |

The `isLoggedIn()` method checks:
```typescript
isLoggedIn(): boolean {
  const token = this.getAccessToken();
  const expires = this.getExpiresAt();
  if (!token || !expires) return false;
  return Date.now() < new Date(expires).getTime();
}
```

### Interceptors

**auth.interceptor.ts** (HttpInterceptorFn):
- Reads access token from `TokenService`
- Clones every outgoing request with `Authorization: Bearer <token>` header if token exists
- No-op if no token

**refresh.interceptor.ts** (HttpInterceptorFn):
- Skips retry for `/auth/login` and `/auth/refresh` endpoints (prevents infinite loops)
- On 401 error:
  - If a refresh is already in progress, queues the request via a `BehaviorSubject`-based lock
  - Otherwise, calls `authService.refreshToken()` which POSTs `{ refreshToken }` to `/api/auth/refresh`
  - On success: stores new tokens, retries original request with new access token
  - On failure: clears all tokens, redirects to `/auth/login`

### Guards

| Guard | Type | Condition | Redirect on fail |
|-------|------|-----------|-----------------|
| `authGuard` | `CanActivateFn` | `tokenService.isLoggedIn()` | `/auth/login` |
| `guestGuard` | `CanActivateFn` | NOT `tokenService.isLoggedIn()` | `/` |
| `roleGuard(allowed[])` | Factory → `CanActivateFn` | `user.role` is in `allowed[]` | `/` |

### Complete user journey

```
1. Guest visits / → authGuard redirects to /auth/login
2. Guest sees Login screen (auth-layout with green brand panel + form card)
3. Option A — Register:
   a. Click "Register" link → /auth/register
   b. Fill form: name, email, phone (optional), password, confirm, role toggle
   c. Submit → POST /api/auth/register → receives AuthResponseDto
   d. storeSession() saves tokens, user, expires to localStorage
   e. Redirect to /auth/verify-email?email=...
4. Verify Email:
   a. OTP input (6 digits, numeric only)
   b. Submit → POST /api/auth/verify-email
   c. Redirect to /auth/verify-phone?email=...
   d. "Resend Code" button with 60s countdown → POST /api/auth/resend-code
5. Verify Phone:
   a. Step 1: Enter Egyptian phone number → POST /api/auth/send-phone-code
   b. Step 2: Enter 6-digit OTP → POST /api/auth/verify-phone
   c. Redirect to / (fully authenticated)
   d. Resend with 60s countdown → POST /api/auth/resend-phone-code
6. Option B — Login:
   a. Enter email + password
   b. Submit → POST /api/auth/login → receives AuthResponseDto
   c. storeSession() saves tokens
   d. Redirect to /
7. Authenticated user sees main-layout with navbar
8. On logout: POST /api/auth/logout → clearAll() → redirect to /auth/login
```

---

## 8. Routing Architecture

### Root route tree (`app.routes.ts`)

```
/                                   (no guard, does not exist alone)
├── auth/                           (no guard, anyone can access)
│   ├── (empty path) → redirectTo: login
│   ├── login        → LoginComponent              [guestGuard]
│   ├── register     → RegisterComponent           [guestGuard]
│   ├── verify-email → VerifyEmailComponent         (no guard)
│   └── verify-phone → VerifyPhoneComponent         (no guard)
│
├── (empty path)                     [authGuard]
│   ├── (empty path) → redirectTo: craftsmen/search
│   ├── craftsmen/   → craftsmanRoutes (stub, empty)   [Hadeer]
│   ├── user/        → userRoutes (stub, empty)        [Ibrahim]
│   ├── admin/       → adminRoutes (stub, empty)       [roleGuard(['admin'])] [Habiba/Hadeer]
│   ├── jobs/        → jobsRoutes (stub, empty)        [Habiba]
│   ├── reviews/     → reviewsRoutes (stub, empty)     [Mazen]
│   ├── chat/        → chatRoutes (stub, empty)        [Ibrahim]
│   ├── notifications/ → notificationsRoutes (stub)     [Ibrahim]
│   └── ai/          → aiRoutes (stub, empty)          [Mazen]
│
└── ** (wildcard) → redirectTo: /auth/login
```

### Lazy loading strategy

Every feature module uses `loadComponent` or `loadChildren` with dynamic `import()`:

```typescript
loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
loadChildren: () => import('./features/craftsman/craftsman.routes').then(m => m.craftsmanRoutes)
```

This ensures each feature's code is only downloaded when the user navigates to that route.

### Layout structure

Auth routes render inside `AuthLayoutComponent` (green brand panel + form card). Main routes render inside `MainLayoutComponent` (sticky navbar + content area).

### Route guards applied

| Route | Guard | Effect |
|-------|-------|--------|
| `/auth/login` | `guestGuard` | Redirects to `/` if already logged in |
| `/auth/register` | `guestGuard` | Redirects to `/` if already logged in |
| `/` (main layout) | `authGuard` | Redirects to `/auth/login` if not logged in |
| `/admin` | `roleGuard(['admin'])` | Redirects to `/` if user role is not admin |
| other main routes | Inherited from parent | `authGuard` on parent |

### Implemented vs stub routes

| Feature | Routes file | Status | Owner |
|---------|------------|--------|-------|
| Auth | `features/auth/auth.routes.ts` | **Implemented** (4 routes) | Esraa |
| Craftsman | `features/craftsman/craftsman.routes.ts` | Stub (empty `[]`) | Hadeer |
| User | `features/user/user.routes.ts` | Stub (empty `[]`) | Ibrahim |
| Admin | `features/admin/admin.routes.ts` | Stub (empty `[]`) | Habiba/Hadeer |
| Jobs | `features/jobs/jobs.routes.ts` | Stub (empty `[]`) | Habiba |
| Reviews | `features/reviews/reviews.routes.ts` | Stub (empty `[]`) | Mazen |
| Chat | `features/chat/chat.routes.ts` | Stub (empty `[]`) | Ibrahim |
| Notifications | `features/notifications/notifications.routes.ts` | Stub (empty `[]`) | Ibrahim |
| AI | `features/ai/ai.routes.ts` | Stub (empty `[]`) | Mazen |

---

## 9. Styling System

### CSS custom properties

Defined in `src/styles.css`. All design tokens:

#### Light theme (`:root`)

| Token | Value |
|-------|-------|
| `--accent` | `#1a6b4a` |
| `--accent-hover` | `#145a3c` |
| `--accent-light` | `#e8f5ee` |
| `--accent-shadow` | `rgba(26,107,74,.18)` |
| `--bg-page` | `#f4f6f8` |
| `--bg-card` | `#ffffff` |
| `--bg-input` | `#f9fafb` |
| `--text-primary` | `#111827` |
| `--text-secondary` | `#374151` |
| `--text-muted` | `#6b7280` |
| `--text-inverse` | `#ffffff` |
| `--border` | `#e5e7eb` |
| `--border-focus` | `#1a6b4a` |
| `--success` | `#16a34a` |
| `--error` | `#dc2626` |
| `--warning` | `#d97706` |
| `--info` | `#2563eb` |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,.08)` |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,.10)` |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,.12)` |
| `--radius-sm` | `6px` |
| `--radius-md` | `10px` |
| `--radius-lg` | `16px` |
| `--radius-xl` | `24px` |
| `--transition` | `all .2s ease` |

#### Dark theme (`[data-theme="dark"]`)

Only the tokens that differ from light are overridden:

| Token | Value |
|-------|-------|
| `--bg-page` | `#0f172a` |
| `--bg-card` | `#1e293b` |
| `--bg-input` | `#0f172a` |
| `--text-primary` | `#f1f5f9` |
| `--text-secondary` | `#cbd5e1` |
| `--text-muted` | `#94a3b8` |
| `--border` | `#334155` |
| `--accent-light` | `#0d2e1f` |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,.3)` |
| `--shadow-md` | `0 4px 16px rgba(0,0,0,.4)` |

### Light/dark mode switching

The `ThemeService` toggles the `data-theme="dark"` attribute on `document.documentElement`. CSS uses `[data-theme="dark"]` selector to override the `:root` variables. No component needs to be aware of the current theme.

### RTL/LTR handling

The `LanguageService` sets `document.documentElement.dir = 'rtl'` or `'ltr'`. CSS responds with:

```css
html[dir="rtl"] body { font-family: 'Cairo', ...; }
html[dir="ltr"] body { font-family: 'Inter', ...; }
```

Bootstrap direction overrides are provided (RTL swapping of `me-auto`, `ms-auto`, `text-start`, `text-end`, `float-start`, `float-end`, padding/margin classes).

### Bootstrap 5 integration

- `bootstrap.min.css` loaded globally (first in `angular.json` styles array)
- `bootstrap.bundle.min.js` loaded as a script (provides dropdowns, collapse, toasts)
- All Bootstrap utility classes are used in templates: `d-flex`, `gap-2`, `w-100`, `mt-3`, `text-center`, `container`, `navbar`, `navbar-expand-lg`, `navbar-toggler`, `collapse`, `navbar-collapse`
- Custom CSS overrides Bootstrap's default colors via the custom property system (Bootstrap's own `--bs-*` variables are not intentionally overridden)

### Global utility classes defined in styles.css

| Class | Purpose |
|-------|---------|
| `.btn-primary` | Green filled button (48px height, rounded, var(--accent) background) |
| `.btn-outline` | Green outlined button (2px border, transparent background) |
| `.form-field` | Form group wrapper with label + input + error (flex column, gap) |
| `.card` | Surface card with background, shadow, rounded corners |
| `.badge-role` | Pill badge for user roles (with `--customer` and `--craftsman` variants) |
| `.auth-input` | Auth screen input fields (48px height, --radius-md border, focus ring) |
| `.password-toggle` | Absolute-positioned eye icon inside password fields |

---

## 10. State Management

### Angular signals

| Service | Signal | Type | Purpose |
|---------|--------|------|---------|
| `LanguageService` | `current` | `WritableSignal<Language>` | Current language (`'ar'` / `'en'`) |
| `ThemeService` | `current` | `WritableSignal<Theme>` | Current theme (`'light'` / `'dark'`) |

These signals are used in templates via the `effect()` API (in `RtlFormDirective`) and via direct signal reads in components. The `relative-time.pipe.ts` uses `pure: false` and reads `languageService.current()` on every change detection cycle to react to language switches.

### localStorage keys

| Key | Service | Content | Persistence |
|-----|---------|---------|-------------|
| `harfi_access` | `TokenService` | JWT access token | Until logout/expiry |
| `harfi_refresh` | `TokenService` | JWT refresh token | Until logout/expiry |
| `harfi_user` | `TokenService` | `UserInfoDto` (JSON) | Until logout/expiry |
| `harfi_expires` | `TokenService` | ISO 8601 expiry timestamp | Until logout/expiry |
| `harfi_lang` | `LanguageService` | `'ar'` or `'en'` | Indefinite |
| `harfi_theme` | `ThemeService` | `'light'` or `'dark'` | Indefinite |

### Session persistence

Theme and language preferences persist across sessions via `localStorage`. On app initialization (`App.ngOnInit()`), the `LanguageService` and `ThemeService` constructors read from localStorage and apply the saved state. The `TokenService.isLoggedIn()` check guards against expired tokens by comparing `expiresAt` with `Date.now()`.

---

## 11. Known Issues & Gaps

### Console warnings

- **None currently.** The `defaultLanguage` deprecation warning was fixed by switching to `lang: 'ar'` in `provideTranslateService()`.

### Implemented vs stubbed features

Of the 9 feature modules, only `auth` is fully implemented (4 screens). The remaining 8 features have:
- **Implemented:** Route definition files (each exports an empty array with an owner comment)
- **Stubbed:** Service files and all component `.ts`, `.html`, `.css` files are empty (0 bytes)
- **Missing entirely:** Feature-specific services, models, guards, resolvers

### Empty non-feature files

The following files exist but are empty stubs:
- `core/hubs/chat.hub.service.ts` — SignalR chat hub (Phase 5)
- `core/hubs/notification.hub.service.ts` — SignalR notification hub (Phase 5)
- `core/models/chat.models.ts` — Chat DTOs (Phase 5)
- `core/models/craftsman.models.ts` — Craftsman DTOs (Phase 2)
- `core/models/job.models.ts` — Job DTOs (Phase 3)
- `core/models/notification.models.ts` — Notification DTOs (Phase 5)
- `core/models/review.models.ts` — Review DTOs (Phase 4)
- `shared/components/footer/*` — Footer component
- `shared/components/star-rating/*` — Star rating component
- `shared/components/confirm-dialog/*` — Confirmation dialog

### Technical debt

1. **RelativeTimePipe hardcoded strings:** The pipe has Arabic and English strings hardcoded instead of using the i18n translation system. These strings are not in the i18n JSON files, so they won't be customizable via translation files.
2. **Error handler fallback is hardcoded Arabic:** `error-handler.service.ts` has `const fallback = 'حدث خطأ، حاول مرة أخرى'` — this is a hardcoded Arabic string that should use the translation service when the app is in English mode.
3. **No `MissingTranslationHandler`:** The `DefaultMissingTranslationHandler` is used (provided by `provideTranslateService()` by default), which returns the raw key as the display value. A custom handler could log missing keys during development.
4. **No HTTP error interceptor for logging:** The refresh interceptor handles 401, but there's no dedicated logging interceptor for other HTTP errors.
5. **`any` types:** The `error-handler.service.ts` `handle(httpError: any)` method uses `any`. The `verifyEmail`, `verifyPhone`, etc. methods in `auth.service.ts` return `Observable<any>`.

### Missing error handling

- No form-level error handling for network failures during email/phone verification (other than the toast)
- The `verify-email` and `verify-phone` components have no `loading` state for the resend button in all code paths (the code form shows `loading` but the phone step form also uses the same `loading` flag)
- No retry logic for failed translation file loads — if the JSON file returns 404 or 500, all translations will show as raw keys
- The `refresh.interceptor.ts` `refreshSubject.error()` call may leave the subject in a broken state for future subscribers

### Security considerations

- Tokens stored in `localStorage` (accessible to any JavaScript on the same origin — XSS vulnerability)
- No HttpOnly cookies are used
- No CSRF protection implemented
- No token expiry refresh buffer (could cause race conditions if a request is made just before the token expires)
