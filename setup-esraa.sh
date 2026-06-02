#!/usr/bin/env bash
# =============================================================================
# Harfi Frontend — Project Structure Setup
# Branch: esraa-ProjStructure
# Repo  : D:/ITI/Graduation Project/harfi-frontend
#
# Run in Git Bash (NOT PowerShell, NOT CMD):
#   chmod +x setup-esraa.sh
#   ./setup-esraa.sh
# =============================================================================

set -e

REPO_PATH="D:/ITI/Graduation Project/harfi-frontend"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 0 — Pre-flight
# ─────────────────────────────────────────────────────────────────────────────

echo "============================================="
echo "  Harfi — Pre-flight checks"
echo "============================================="

command -v node >/dev/null 2>&1 || { echo "❌  Node.js not found"; exit 1; }
command -v npm  >/dev/null 2>&1 || { echo "❌  npm not found";     exit 1; }
command -v ng   >/dev/null 2>&1 || { echo "❌  Angular CLI not found. Run: npm install -g @angular/cli"; exit 1; }
command -v git  >/dev/null 2>&1 || { echo "❌  Git not found";     exit 1; }

echo "✅  Node : $(node -v)"
echo "✅  npm  : $(npm -v)"
echo "✅  ng   : $(ng version --skip-confirmation 2>/dev/null | grep 'Angular CLI' | head -1)"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1 — Navigate to repo
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  STEP 1 — Navigating to repo"
echo "============================================="

cd "$REPO_PATH"
echo "✅  Working directory: $(pwd)"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2 — Git: sync main/master then create branch
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  STEP 2 — Git: create branch esraa-ProjStructure"
echo "============================================="

# checkout main or master — whichever exists
git checkout main   2>/dev/null || \
git checkout master 2>/dev/null || \
git checkout dev    2>/dev/null || \
echo "ℹ️  No base branch found — working on current branch"

# pull latest quietly (safe-fail if no remote yet)
git pull 2>/dev/null || echo "ℹ️  No remote to pull from yet"

# delete branch locally if it already exists (fresh re-run safety)
git branch -D esraa-ProjStructure 2>/dev/null || true

git checkout -b esraa-ProjStructure
echo "✅  Branch 'esraa-ProjStructure' created and checked out"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3 — Initialize Angular 21 project (only if not already set up)
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  STEP 3 — Angular project initialization"
echo "============================================="

if [ -f "angular.json" ]; then
  echo "ℹ️  angular.json already exists — skipping ng new"
else
  echo "⏳  Running ng new in current directory..."
  ng new harfi-frontend \
    --directory=. \
    --routing=true \
    --style=css \
    --skip-git=true \
    --skip-tests=true \
    --no-interactive
  echo "✅  Angular project initialized"
fi

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4 — Install dependencies
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  STEP 4 — Installing dependencies"
echo "============================================="

npm install bootstrap @popperjs/core
npm install @ngx-translate/core @ngx-translate/http-loader
npm install @microsoft/signalr

echo "✅  Dependencies installed"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5 — Wire Bootstrap into angular.json
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  STEP 5 — Configuring Bootstrap in angular.json"
echo "============================================="

node -e "
const fs   = require('fs');
const file = 'angular.json';
const cfg  = JSON.parse(fs.readFileSync(file, 'utf8'));
const project = Object.keys(cfg.projects)[0];
const opts    = cfg.projects[project].architect.build.options;
opts.styles  = ['node_modules/bootstrap/dist/css/bootstrap.min.css', 'src/styles.css'];
opts.scripts = ['node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'];
fs.writeFileSync(file, JSON.stringify(cfg, null, 2));
console.log('✅  angular.json updated — Bootstrap wired');
"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 6 — Create all directories
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  STEP 6 — Creating directory structure"
echo "============================================="

# assets
mkdir -p src/assets/i18n
mkdir -p src/assets/images
mkdir -p src/assets/fonts

# environments
mkdir -p src/environments

# core
mkdir -p src/app/core/interceptors
mkdir -p src/app/core/guards
mkdir -p src/app/core/services
mkdir -p src/app/core/models
mkdir -p src/app/core/hubs

# shared
mkdir -p src/app/shared/components/navbar
mkdir -p src/app/shared/components/footer
mkdir -p src/app/shared/components/spinner
mkdir -p src/app/shared/components/toast
mkdir -p src/app/shared/components/star-rating
mkdir -p src/app/shared/components/confirm-dialog
mkdir -p src/app/shared/directives
mkdir -p src/app/shared/pipes
mkdir -p src/app/shared/layouts/main-layout
mkdir -p src/app/shared/layouts/auth-layout

# features/auth
mkdir -p src/app/features/auth/login
mkdir -p src/app/features/auth/register
mkdir -p src/app/features/auth/verify-email
mkdir -p src/app/features/auth/verify-phone

# features/craftsman
mkdir -p src/app/features/craftsman/search
mkdir -p src/app/features/craftsman/profile
mkdir -p src/app/features/craftsman/register

# features/user
mkdir -p src/app/features/user/profile

# features/admin
mkdir -p src/app/features/admin/pending-craftsmen

# features/jobs
mkdir -p src/app/features/jobs/job-list
mkdir -p src/app/features/jobs/job-create

# features/reviews
mkdir -p src/app/features/reviews/review-form

# features/chat
mkdir -p src/app/features/chat/chat-list
mkdir -p src/app/features/chat/chat-detail

# features/notifications
mkdir -p src/app/features/notifications/notification-list

# features/ai
mkdir -p src/app/features/ai/ai-chat

echo "✅  All directories created"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 7 — Create all files
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  STEP 7 — Creating all files"
echo "============================================="

# root
touch .env.development
touch .env.production

# assets
touch src/assets/i18n/ar.json
touch src/assets/i18n/en.json

# environments
touch src/environments/environment.ts
touch src/environments/environment.prod.ts

# core/interceptors
touch src/app/core/interceptors/auth.interceptor.ts
touch src/app/core/interceptors/refresh.interceptor.ts

# core/guards
touch src/app/core/guards/auth.guard.ts
touch src/app/core/guards/role.guard.ts
touch src/app/core/guards/guest.guard.ts

# core/services
touch src/app/core/services/auth.service.ts
touch src/app/core/services/token.service.ts
touch src/app/core/services/theme.service.ts
touch src/app/core/services/language.service.ts
touch src/app/core/services/error-handler.service.ts

# core/models
touch src/app/core/models/auth.models.ts
touch src/app/core/models/craftsman.models.ts
touch src/app/core/models/job.models.ts
touch src/app/core/models/review.models.ts
touch src/app/core/models/chat.models.ts
touch src/app/core/models/notification.models.ts
touch src/app/core/models/api-error.models.ts

# core/hubs
touch src/app/core/hubs/chat.hub.service.ts
touch src/app/core/hubs/notification.hub.service.ts

# shared/components
touch src/app/shared/components/navbar/navbar.component.ts
touch src/app/shared/components/navbar/navbar.component.html
touch src/app/shared/components/navbar/navbar.component.css

touch src/app/shared/components/footer/footer.component.ts
touch src/app/shared/components/footer/footer.component.html
touch src/app/shared/components/footer/footer.component.css

touch src/app/shared/components/spinner/spinner.component.ts
touch src/app/shared/components/spinner/spinner.component.html
touch src/app/shared/components/spinner/spinner.component.css

touch src/app/shared/components/toast/toast.component.ts
touch src/app/shared/components/toast/toast.component.html
touch src/app/shared/components/toast/toast.component.css

touch src/app/shared/components/star-rating/star-rating.component.ts
touch src/app/shared/components/star-rating/star-rating.component.html
touch src/app/shared/components/star-rating/star-rating.component.css

touch src/app/shared/components/confirm-dialog/confirm-dialog.component.ts
touch src/app/shared/components/confirm-dialog/confirm-dialog.component.html
touch src/app/shared/components/confirm-dialog/confirm-dialog.component.css

# shared/directives + pipes
touch src/app/shared/directives/rtl-form.directive.ts
touch src/app/shared/pipes/relative-time.pipe.ts
touch src/app/shared/pipes/translate.pipe.ts

# shared/layouts
touch src/app/shared/layouts/main-layout/main-layout.component.ts
touch src/app/shared/layouts/main-layout/main-layout.component.html
touch src/app/shared/layouts/main-layout/main-layout.component.css

touch src/app/shared/layouts/auth-layout/auth-layout.component.ts
touch src/app/shared/layouts/auth-layout/auth-layout.component.html
touch src/app/shared/layouts/auth-layout/auth-layout.component.css

# features/auth
touch src/app/features/auth/auth.routes.ts
touch src/app/features/auth/auth.service.ts
touch src/app/features/auth/login/login.component.ts
touch src/app/features/auth/login/login.component.html
touch src/app/features/auth/login/login.component.css
touch src/app/features/auth/register/register.component.ts
touch src/app/features/auth/register/register.component.html
touch src/app/features/auth/register/register.component.css
touch src/app/features/auth/verify-email/verify-email.component.ts
touch src/app/features/auth/verify-email/verify-email.component.html
touch src/app/features/auth/verify-email/verify-email.component.css
touch src/app/features/auth/verify-phone/verify-phone.component.ts
touch src/app/features/auth/verify-phone/verify-phone.component.html
touch src/app/features/auth/verify-phone/verify-phone.component.css

# features/craftsman
touch src/app/features/craftsman/craftsman.routes.ts
touch src/app/features/craftsman/craftsman.service.ts
touch src/app/features/craftsman/search/craftsman-search.component.ts
touch src/app/features/craftsman/search/craftsman-search.component.html
touch src/app/features/craftsman/search/craftsman-search.component.css
touch src/app/features/craftsman/profile/craftsman-profile.component.ts
touch src/app/features/craftsman/profile/craftsman-profile.component.html
touch src/app/features/craftsman/profile/craftsman-profile.component.css
touch src/app/features/craftsman/register/craftsman-register.component.ts
touch src/app/features/craftsman/register/craftsman-register.component.html
touch src/app/features/craftsman/register/craftsman-register.component.css

# features/user
touch src/app/features/user/user.routes.ts
touch src/app/features/user/user.service.ts
touch src/app/features/user/profile/user-profile.component.ts
touch src/app/features/user/profile/user-profile.component.html
touch src/app/features/user/profile/user-profile.component.css

# features/admin
touch src/app/features/admin/admin.routes.ts
touch src/app/features/admin/admin.service.ts
touch src/app/features/admin/pending-craftsmen/pending-craftsmen.component.ts
touch src/app/features/admin/pending-craftsmen/pending-craftsmen.component.html
touch src/app/features/admin/pending-craftsmen/pending-craftsmen.component.css

# features/jobs
touch src/app/features/jobs/jobs.routes.ts
touch src/app/features/jobs/jobs.service.ts
touch src/app/features/jobs/job-list/job-list.component.ts
touch src/app/features/jobs/job-list/job-list.component.html
touch src/app/features/jobs/job-list/job-list.component.css
touch src/app/features/jobs/job-create/job-create.component.ts
touch src/app/features/jobs/job-create/job-create.component.html
touch src/app/features/jobs/job-create/job-create.component.css

# features/reviews
touch src/app/features/reviews/reviews.routes.ts
touch src/app/features/reviews/reviews.service.ts
touch src/app/features/reviews/review-form/review-form.component.ts
touch src/app/features/reviews/review-form/review-form.component.html
touch src/app/features/reviews/review-form/review-form.component.css

# features/chat
touch src/app/features/chat/chat.routes.ts
touch src/app/features/chat/chat.service.ts
touch src/app/features/chat/chat-list/chat-list.component.ts
touch src/app/features/chat/chat-list/chat-list.component.html
touch src/app/features/chat/chat-list/chat-list.component.css
touch src/app/features/chat/chat-detail/chat-detail.component.ts
touch src/app/features/chat/chat-detail/chat-detail.component.html
touch src/app/features/chat/chat-detail/chat-detail.component.css

# features/notifications
touch src/app/features/notifications/notifications.routes.ts
touch src/app/features/notifications/notifications.service.ts
touch src/app/features/notifications/notification-list/notification-list.component.ts
touch src/app/features/notifications/notification-list/notification-list.component.html
touch src/app/features/notifications/notification-list/notification-list.component.css

# features/ai
touch src/app/features/ai/ai.routes.ts
touch src/app/features/ai/ai.service.ts
touch src/app/features/ai/ai-chat/ai-chat.component.ts
touch src/app/features/ai/ai-chat/ai-chat.component.html
touch src/app/features/ai/ai-chat/ai-chat.component.css

echo "✅  All files created"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 8 — Seed config file content
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  STEP 8 — Seeding config file content"
echo "============================================="

cat > src/environments/environment.ts << 'EOF'
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:5000/api',
  chatHubUrl: 'http://localhost:5000/hubs/chat',
  notificationHubUrl: 'http://localhost:5000/hubs/notifications',
};
EOF

cat > src/environments/environment.prod.ts << 'EOF'
export const environment = {
  production: true,
  apiBaseUrl: 'https://api.harfi.com/api',
  chatHubUrl: 'https://api.harfi.com/hubs/chat',
  notificationHubUrl: 'https://api.harfi.com/hubs/notifications',
};
EOF

cat > .env.development << 'EOF'
API_BASE_URL=http://localhost:5000/api
SIGNALR_CHAT_HUB=http://localhost:5000/hubs/chat
SIGNALR_NOTIFICATION_HUB=http://localhost:5000/hubs/notifications
EOF

cat > .env.production << 'EOF'
API_BASE_URL=https://api.harfi.com/api
SIGNALR_CHAT_HUB=https://api.harfi.com/hubs/chat
SIGNALR_NOTIFICATION_HUB=https://api.harfi.com/hubs/notifications
EOF

cat > src/assets/i18n/ar.json << 'EOF'
{
  "APP_NAME": "حرفي",
  "LOGIN": "تسجيل الدخول",
  "REGISTER": "إنشاء حساب",
  "LOGOUT": "تسجيل الخروج",
  "EMAIL": "البريد الإلكتروني",
  "PASSWORD": "كلمة المرور",
  "NAME": "الاسم",
  "PHONE": "رقم الهاتف",
  "ROLE_CUSTOMER": "عميل",
  "ROLE_CRAFTSMAN": "حرفي",
  "VERIFY_EMAIL": "تأكيد البريد الإلكتروني",
  "VERIFY_PHONE": "تأكيد رقم الهاتف",
  "SEARCH": "بحث",
  "SAVE": "حفظ",
  "CANCEL": "إلغاء",
  "CONFIRM": "تأكيد",
  "LOADING": "جارٍ التحميل...",
  "ERROR_GENERIC": "حدث خطأ، حاول مرة أخرى",
  "ERROR_401": "يرجى تسجيل الدخول أولاً",
  "ERROR_403": "ليس لديك صلاحية",
  "ERROR_404": "الصفحة غير موجودة",
  "THEME_LIGHT": "وضع النهار",
  "THEME_DARK": "وضع الليل"
}
EOF

cat > src/assets/i18n/en.json << 'EOF'
{
  "APP_NAME": "Harfi",
  "LOGIN": "Login",
  "REGISTER": "Register",
  "LOGOUT": "Logout",
  "EMAIL": "Email",
  "PASSWORD": "Password",
  "NAME": "Name",
  "PHONE": "Phone",
  "ROLE_CUSTOMER": "Customer",
  "ROLE_CRAFTSMAN": "Craftsman",
  "VERIFY_EMAIL": "Verify Email",
  "VERIFY_PHONE": "Verify Phone",
  "SEARCH": "Search",
  "SAVE": "Save",
  "CANCEL": "Cancel",
  "CONFIRM": "Confirm",
  "LOADING": "Loading...",
  "ERROR_GENERIC": "Something went wrong, please try again",
  "ERROR_401": "Please login first",
  "ERROR_403": "You don't have permission",
  "ERROR_404": "Page not found",
  "THEME_LIGHT": "Light mode",
  "THEME_DARK": "Dark mode"
}
EOF

cat > src/styles.css << 'EOF'
/* ═══════════════════════════════════════════
   Harfi Global Styles
   Light / Dark + RTL / LTR base
═══════════════════════════════════════════ */

/* ── Light theme ── */
:root {
  --bg-primary:    #ffffff;
  --bg-secondary:  #f8f9fa;
  --text-primary:  #212529;
  --text-muted:    #6c757d;
  --accent:        #1a6b4a;
  --accent-light:  #e8f5ee;
  --border:        #dee2e6;
  --radius:        8px;
  --shadow:        0 2px 8px rgba(0, 0, 0, .08);
}

/* ── Dark theme ── */
[data-theme="dark"] {
  --bg-primary:    #1a1a2e;
  --bg-secondary:  #16213e;
  --text-primary:  #e9ecef;
  --text-muted:    #adb5bd;
  --accent:        #22c55e;
  --accent-light:  #052e16;
  --border:        #2d3748;
  --shadow:        0 2px 8px rgba(0, 0, 0, .4);
}

/* ── Typography by language ── */
html[dir="rtl"] body { font-family: 'Cairo', 'Segoe UI', sans-serif; }
html[dir="ltr"] body { font-family: 'Inter',  'Segoe UI', sans-serif; }

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background-color: var(--bg-secondary);
  color:            var(--text-primary);
  transition: background-color .3s, color .3s;
}

/* ── RTL Bootstrap direction overrides ── */
html[dir="rtl"] .me-auto  { margin-left: auto  !important; margin-right: 0 !important; }
html[dir="rtl"] .ms-auto  { margin-right: auto !important; margin-left: 0  !important; }
html[dir="rtl"] .text-start { text-align: right !important; }
html[dir="rtl"] .text-end   { text-align: left  !important; }
html[dir="rtl"] .float-start { float: right !important; }
html[dir="rtl"] .float-end   { float: left  !important; }
html[dir="rtl"] .ps-3  { padding-right: 1rem !important; padding-left: 0   !important; }
html[dir="rtl"] .pe-3  { padding-left:  1rem !important; padding-right: 0  !important; }
html[dir="rtl"] .ms-2  { margin-right:  .5rem !important; margin-left: 0   !important; }
html[dir="rtl"] .me-2  { margin-left:   .5rem !important; margin-right: 0  !important; }
EOF

echo "✅  Config files seeded"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 9 — Verify structure
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  STEP 9 — Verifying structure"
echo "============================================="

DIRS=(
  src/assets/i18n
  src/environments
  src/app/core/interceptors
  src/app/core/guards
  src/app/core/services
  src/app/core/models
  src/app/core/hubs
  src/app/shared/components/navbar
  src/app/shared/components/toast
  src/app/shared/layouts/main-layout
  src/app/shared/layouts/auth-layout
  src/app/features/auth/login
  src/app/features/auth/register
  src/app/features/auth/verify-email
  src/app/features/auth/verify-phone
  src/app/features/craftsman/search
  src/app/features/craftsman/profile
  src/app/features/craftsman/register
  src/app/features/user/profile
  src/app/features/admin/pending-craftsmen
  src/app/features/jobs/job-list
  src/app/features/jobs/job-create
  src/app/features/reviews/review-form
  src/app/features/chat/chat-list
  src/app/features/chat/chat-detail
  src/app/features/notifications/notification-list
  src/app/features/ai/ai-chat
)

ALL_OK=true
for D in "${DIRS[@]}"; do
  if [ -d "$D" ]; then
    echo "  ✅  $D"
  else
    echo "  ❌  MISSING: $D"
    ALL_OK=false
  fi
done

echo ""
$ALL_OK && echo "✅  All 27 directories verified" || echo "⚠️  Some directories missing — check errors above"

# ─────────────────────────────────────────────────────────────────────────────
# STEP 10 — Git commit & push
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "============================================="
echo "  STEP 10 — Git commit & push"
echo "============================================="

git add .
git commit -m "feat(structure): scaffold Harfi Angular 21 standalone architecture

Branch  : esraa-ProjStructure
Stack   : Angular 21 · CSS · Bootstrap 5 · Standalone
i18n    : Arabic (default RTL) + English
Theme   : Light / Dark via CSS custom properties
Modules : core (interceptors, guards, services, models, hubs)
          shared (components, directives, pipes, layouts)
          features: auth · craftsman · user · admin
                    jobs · reviews · chat · notifications · ai"

git push origin esraa-ProjStructure
echo ""
echo "============================================="
echo "  ✅  Done! Branch pushed to origin"
echo "============================================="
echo ""
echo "  Open a Pull Request from esraa-ProjStructure → dev"
echo "  Then run: ng serve"
echo "  Open   : http://localhost:4200"
echo ""
