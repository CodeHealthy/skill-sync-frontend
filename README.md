# SkillSync Frontend

React frontend for **SkillSync / Automated Talent Skill-Validator**, a multi-tenant technical assessment platform for recruiters, admins, and candidates.

The frontend provides the public landing page, authentication screens, email verification and password reset UI, Google OAuth entry, admin dashboard, candidate portal, profile settings, and responsive SaaS-style navigation.

---

## Overview

SkillSync helps recruiters validate candidate skills through quizzes and coding challenges.

Frontend users include:

### Admins / Recruiters

- Register organization workspace
- Verify email
- Log in with email/password or Google OAuth after an admin account exists
- Invite candidates
- Create assessments
- Assign assessments
- Review submissions
- Execute coding submissions
- Manually grade assignments
- Manage profile information

### Candidates

- Register and verify email
- Log in with email/password or Google OAuth
- View assignments from multiple organizations
- Run code before final submission
- Submit quiz answers or coding solutions
- View final scores, output, errors, and feedback
- Manage profile information

---

## Tech Stack

- React
- Create React App
- React Router v6
- Axios
- React Toastify
- CSS variables
- Inter font for UI
- JetBrains Mono / Fira Code for code areas
- Vercel deployment

---

## Main Features

### Public UI

- Professional landing page
- Responsive navbar with mobile menu
- SkillSync logo and favicon
- Login and registration CTAs
- Recruiter and candidate feature sections

### Authentication

- Login
- Register
- Strong password checklist
- Confirm password validation
- Email verification success page
- Resend verification prompt after unverified login attempt
- Resend cooldown UI
- Forgot password page
- Reset password page
- Role-aware Google OAuth button
- Session-expired toast handling

### Admin Dashboard

- Dashboard metrics
- Candidate invitation form
- Assessment creation form
- Assessment assignment form
- Candidate table
- Assessment table
- Assignment result table
- Assignment details panel
- Docker grading action
- Manual grading
- Confirmation modals for sensitive actions
- Loading and disabled states
- Toast notifications

### Candidate Dashboard

- Assignment list
- Organization filter
- Search and status filters
- Assignment detail panel
- Quiz submission
- Coding challenge editor textarea
- Run code before final submit
- Execution output/error display
- Final result view after grading
- Expected output hidden from candidates

### Profile Settings

- Full name update
- Password change
- Email shown as read-only
- Role shown as read-only

---

## Project Structure

```txt
src/
├── api
│   ├── axiosClient.js
│   ├── authApi.js
│   ├── candidateApi.js
│   ├── assessmentApi.js
│   └── profileApi.js
├── auth
│   ├── AuthContext.js
│   ├── ProtectedRoute.js
│   └── RoleRoute.js
├── components
│   ├── admin
│   ├── candidate
│   ├── common
│   └── layout
├── constants
├── pages
├── utils
├── App.css
├── App.js
└── index.js
```

Architecture rules:

- `pages/` contains page orchestration
- `api/` contains HTTP calls
- `components/` contains reusable UI
- `utils/` contains helpers
- `constants/` contains shared constants/defaults

---

## Environment Variables

Create a local environment file:

```txt
skill-sync-frontend/.env
```

Example:

```env
REACT_APP_API_BASE_URL=http://localhost:8080/api
REACT_APP_GOOGLE_OAUTH_ENABLED=false
```

For UAT/Vercel:

```env
REACT_APP_API_BASE_URL=https://<api-gateway-id>.execute-api.ap-southeast-1.amazonaws.com/api
REACT_APP_GOOGLE_OAUTH_ENABLED=true
```

Create React App only exposes variables prefixed with:

```txt
REACT_APP_
```

---

## Local Development

### Prerequisites

- Node.js
- npm
- Backend running locally or reachable through deployed API Gateway

### Install dependencies

```bash
npm install
```

### Start development server

```bash
npm start
```

Frontend runs at:

```txt
http://localhost:3000
```

### Run tests

```bash
npm test
```

### Build

```bash
npm run build
```

---

## API Configuration

The Axios client uses:

```txt
REACT_APP_API_BASE_URL
```

Fallback:

```txt
http://localhost:8080/api
```

JWT is stored in localStorage:

```txt
skillsync_token
skillsync_user
```

On HTTP 401, the frontend:

1. Removes local auth data
2. Stores a session-expired message in sessionStorage
3. Redirects to `/login`

---

## Routing

Main routes:

```txt
/                 Landing page
/login            Login
/register         Register
/verify-email     Email verification
/forgot-password  Forgot password
/reset-password   Reset password
/oauth-success    Google OAuth success
/profile          Profile settings
/admin            Admin dashboard
/candidate        Candidate dashboard
/unauthorized     Unauthorized page
*                 Not found
```

Protected routes:

- `/profile` requires authentication
- `/admin` requires `ADMIN`
- `/candidate` requires `CANDIDATE`

---

## Auth Flow

### Email/Password Register

```txt
Register
→ Backend creates unverified user
→ Verification email sent
→ Frontend redirects to login
→ User verifies email
→ User logs in
```

### Login Before Verification

```txt
Login attempt
→ Backend returns verify-email message
→ Frontend shows compact resend verification panel
→ User can resend verification email
→ Cooldown prevents abuse
```

### Forgot Password

```txt
Forgot password page
→ Enter email
→ Backend sends reset link if account exists
→ Reset password page
→ User chooses new strong password
→ Redirect to login
```

### Google OAuth

```txt
Login page
→ Continue with Google
→ Backend OAuth flow
→ /oauth-success receives token/user details
→ Auth saved in localStorage
→ Redirect by role
```

Role-aware behavior:

```txt
Existing ADMIN by Google email      → redirected to /admin
Existing CANDIDATE by Google email  → redirected to /candidate
New Google user                     → created as CANDIDATE and redirected to /candidate
```

Google OAuth does not create new admin organizations. Admin organization creation still uses regular registration.

---

## Branding and Typography

Brand assets:

```txt
public/favicon.svg
public/logo.svg
public/logo-white.svg
```

Typography:

```css
--font-family-base: "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
--font-family-code: "JetBrains Mono", "Fira Code", Consolas, Monaco, "Courier New", monospace;
```

Use:

- Inter for general UI
- JetBrains Mono/Fira Code for code blocks and code textareas

---

## Deployment

Frontend is deployed on Vercel.

Recommended settings:

```txt
Production branch: uat
Framework: Create React App
Build command: npm run build
Output directory: build
```

Required Vercel environment variables:

```txt
REACT_APP_API_BASE_URL
REACT_APP_GOOGLE_OAUTH_ENABLED
```

Redeploy after changing environment variables.

---

## UAT Smoke Test Checklist

After deployment:

```txt
1. Landing page loads
2. Navbar works on desktop
3. Navbar hamburger works on mobile
4. Register page password checklist works
5. Registration redirects to login
6. Verification email link opens /verify-email
7. Login before verification shows resend panel
8. Resend cooldown appears
9. Forgot password flow works
10. Reset password flow works
11. Login works after verification
12. Google OAuth candidate login works
13. Existing admin Google OAuth login works
14. New Google OAuth users are created as candidates only
15. Admin dashboard route is protected
16. Candidate dashboard route is protected
17. Admin can invite candidate
18. Admin can create assessment
19. Admin can assign assessment
20. Candidate can run code
21. Candidate can submit assessment
22. Admin can execute and grade
23. Profile page works for both roles
24. Logout clears session
```

---

## Security Notes

- JWT is stored in localStorage for current UAT simplicity
- Avoid exposing secrets in frontend code
- Only use `REACT_APP_` variables for non-secret frontend config
- Google OAuth client secret belongs only on backend
- Candidate expected output must remain hidden in candidate UI
- Do not show stack traces or raw backend errors to users

---

## Suggested Future Enhancements

- AI assessment generator
- AI-assisted feedback suggestions
- Monaco code editor
- Better dashboard analytics
- Candidate result detail page
- Admin assessment preview page
- Organization admin invite flow
- Refresh-token auth
- Verified email change flow
- Audit logs
- More advanced mobile dashboard layouts
