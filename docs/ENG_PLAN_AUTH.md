# Engineering Plan: Authentication System (Issue #4)

## Executive Summary
Implement parent authentication with email/password using Better-Auth, with strict local-first and privacy-first principles.

---

## 1. Architecture Overview

### 1.1 High-Level Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│  Better-Auth │────▶│  PostgreSQL │
│             │◄────│   (Server)   │◄────│  (Sessions) │
└─────────────┘     └──────────────┘     └─────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ HTTP-Only    │
                    │ Session      │
                    │ Cookie       │
                    └──────────────┘
```

### 1.2 Local-First Principles

| Principle | Implementation |
|-----------|----------------|
| **No External Auth** | No OAuth, no social login, no external identity providers |
| **No Telemetry** | Better-Auth configured with no analytics/anonymous data |
| **Session Storage** | Sessions stored in PostgreSQL (self-hosted), not external Redis/cache |
| **Password Hashing** | Argon2id (memory-hard, local computation) |
| **No Password Reset Email** | v0.1: Parent manages passwords manually (local trust model) |

### 1.3 Privacy Guarantees

| Data | Storage | Retention |
|------|---------|-----------|
| Email | PostgreSQL (local) | Until account deletion |
| Password Hash | PostgreSQL (local) | Until account deletion |
| Session Tokens | PostgreSQL (local) | 24 hours |
| Failed Login Attempts | In-memory rate limiter only | 15 minutes |
| IP Addresses | Not logged | N/A |
| User Agents | Not logged | N/A |

---

## 2. Detailed Implementation Plan

### 2.1 Database Schema (Already Complete)

```prisma
// User model created by Better-Auth
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  emailVerified Boolean   @default(false)  // v0.1: Always true (no email verification)
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  sessions      Session[]
  accounts      Account[]
  
  // Link to Family Hub Member
  member        Member?
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  ipAddress String?  // Optional, can be disabled
  userAgent String?  // Optional, can be disabled
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
}
```

### 2.2 Better-Auth Configuration

```typescript
// src/lib/auth.ts - ENHANCED
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  
  // LOCAL-FIRST: No external providers
  socialProviders: {},
  
  // Email/Password with strong defaults
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    
    // SECURITY: Argon2id with secure defaults
    password: {
      hash: {
        algorithm: "argon2id",
        params: {
          memory: 65536,    // 64MB
          iterations: 3,
          parallelism: 4,
          saltLength: 16,
          hashLength: 32,
        }
      },
      minLength: 8,
      maxLength: 128,
      requireEmailVerification: false, // v0.1: Skip for local-first
    },
  },
  
  // SECURITY: Rate limiting (memory-based, no external Redis)
  rateLimit: {
    window: 60,      // 1 minute
    max: 5,          // 5 attempts
    skipSuccessfulRequests: true,
  },
  
  // SESSION: 24h expiry as per FRD
  session: {
    expiresIn: 60 * 60 * 24,  // 24 hours
    updateAge: 60 * 60,       // Refresh after 1 hour
    cookieCache: {
      maxAge: 5 * 60,         // 5 minute client cache
    },
  },
  
  // COOKIE: Secure defaults
  advanced: {
    cookiePrefix: "fh",  // Family Hub
    useSecureCookies: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
  
  // PRIVACY: Minimal logging
  logger: {
    disabled: process.env.NODE_ENV === "production", // No auth logs in prod
    level: "error", // Only errors in dev
  },
})
```

### 2.3 API Routes

```typescript
// src/app/api/auth/[...all]/route.ts - ALREADY EXISTS
// Better-Auth handles all auth routes automatically:
// POST /api/auth/sign-in/email    - Login
// POST /api/auth/sign-up/email    - Register
// POST /api/auth/sign-out         - Logout
// GET  /api/auth/session          - Get current session
```

### 2.4 Registration Flow (Parent)

```
[GET /register]
    ↓
[Registration Form]
    ↓
[POST /api/auth/sign-up/email]
    ↓
[Better-Auth: Create User]
    ↓
[Trigger: Create Family + Member]
    ↓
[POST /api/family/create]
    ↓
[Redirect to /dashboard]
```

**Implementation Details:**

1. **Client Registration Form** (`/register`)
   - Email input (validated)
   - Password input (strength indicator)
   - Family name input
   - Display name input
   - Terms acceptance (local-only data handling)

2. **Server-Side Flow**
   ```typescript
   // 1. Create Better-Auth user
   const authResult = await authClient.signUp.email({
     email,
     password,
     name: displayName,
   })
   
   // 2. On success, create Family
   const family = await prisma.family.create({
     data: { name: familyName }
   })
   
   // 3. Create Member linking User to Family
   await prisma.member.create({
     data: {
       userId: authResult.user.id,
       familyId: family.id,
       role: 'PARENT',
       username: email.split('@')[0], // Default username
       displayName,
     }
   })
   ```

### 2.5 Login Flow

```
[GET /login]
    ↓
[Login Form]
    ↓
[POST /api/auth/sign-in/email]
    ↓
[Better-Auth: Validate Credentials]
    ↓
[Set HTTP-Only Cookie]
    ↓
[Redirect to /dashboard or callback URL]
```

### 2.6 Session Management

**HTTP-Only Cookie:**
- Name: `fh.session_token`
- HttpOnly: `true` (no JavaScript access)
- Secure: `true` in production
- SameSite: `lax`
- Max-Age: 24 hours

**Session Validation:**
```typescript
// Middleware (src/middleware.ts)
export function middleware(request: NextRequest) {
  const sessionCookie = request.cookies.get("fh.session_token")
  
  if (!sessionCookie && !isPublicRoute(request.nextUrl.pathname)) {
    return redirectToLogin(request)
  }
  
  // Session validated by Better-Auth on each request
  return NextResponse.next()
}
```

**Client-Side Session Hook:**
```typescript
// src/lib/auth-client.ts - ENHANCE
export const { useSession, signIn, signUp, signOut } = authClient

// Usage in components:
const { data: session, isPending } = useSession()
// session.user.id -> link to Member via userId
```

### 2.7 Protected Routes

```typescript
// src/middleware.ts - ENHANCED
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const publicPaths = [
  "/",
  "/login",
  "/register",
  "/api/auth",
  "/api/health",
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }
  
  // Check for session cookie (Better-Auth validates server-side)
  const sessionCookie = request.cookies.get("fh.session_token")
  
  if (!sessionCookie) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*))"],
}
```

### 2.8 Logout

```typescript
// Client-side logout
const handleLogout = async () => {
  await signOut()
  // Better-Auth clears cookie, redirects
}
```

---

## 3. Security Considerations

### 3.1 Password Security

| Aspect | Implementation |
|--------|----------------|
| Algorithm | Argon2id (memory-hard) |
| Memory | 64MB per hash |
| Iterations | 3 |
| Salt | 16 bytes random |
| Min Length | 8 characters |
| Max Length | 128 characters |

### 3.2 Rate Limiting

```
Window: 60 seconds
Max Attempts: 5 per IP
Skip Successful: true (successful logins don't count)
Storage: In-memory (no external Redis)
```

### 3.3 Session Security

| Aspect | Setting |
|--------|---------|
| Token Length | 32 bytes (random) |
| Expiry | 24 hours |
| Refresh | After 1 hour of activity |
| Storage | PostgreSQL (encrypted at rest) |
| Cookie | HTTP-Only, Secure, SameSite=Lax |

### 3.4 XSS/CSRF Protection

- **HTTP-Only Cookies:** JavaScript cannot access session tokens
- **SameSite=Lax:** Prevents CSRF from external sites
- **Input Validation:** Zod schemas for all inputs
- **Output Encoding:** React automatically escapes output

---

## 4. Privacy Implementation

### 4.1 No External Dependencies

| Service | Status | Reason |
|---------|--------|--------|
| OAuth (Google, etc.) | ❌ Disabled | External data sharing |
| Email Service | ❌ Not used | No email verification in v0.1 |
| Analytics | ❌ Disabled | No tracking |
| Error Tracking | ❌ Disabled | No external reporting |
| CDN | ❌ Not used | Assets served locally |

### 4.2 Minimal Data Collection

**Collected:**
- Email (for login)
- Password hash (Argon2id)
- Display name (UI only)
- Session token (temporary)

**NOT Collected:**
- IP addresses
- User agents
- Geolocation
- Device fingerprints
- Behavioral analytics

### 4.3 Data Retention

| Data | Retention |
|------|-----------|
| Active sessions | 24 hours |
| Expired sessions | Deleted immediately |
| Failed login logs | Not stored |
| Access logs | Not stored |

---

## 5. Implementation Tasks

### Phase 1: Core Auth (Issue #4)

| # | Task | File(s) | Est. Time |
|---|------|---------|-----------|
| 1 | Enhance Better-Auth config | `src/lib/auth.ts` | 30 min |
| 2 | Create registration page | `src/app/register/page.tsx` | 1 hour |
| 3 | Create login page | `src/app/login/page.tsx` | 1 hour |
| 4 | Create family creation API | `src/app/api/family/route.ts` | 30 min |
| 5 | Enhance middleware | `src/middleware.ts` | 30 min |
| 6 | Add logout button | `src/components/logout-button.tsx` | 15 min |
| 7 | Create auth hooks | `src/lib/hooks/use-auth.ts` | 30 min |
| 8 | Add password strength indicator | `src/components/password-strength.tsx` | 30 min |
| 9 | Test auth flows | manual + automated | 1 hour |

**Total: ~6 hours** (higher than original 3-4h estimate due to local-first complexity)

### Phase 2: Child Accounts (Issue #5 - Next)

After parent auth is complete.

---

## 6. Testing Strategy

### 6.1 Unit Tests

```typescript
// src/lib/auth.test.ts
describe('Authentication', () => {
  it('should reject weak passwords', () => {})
  it('should rate limit after 5 attempts', () => {})
  it('should create session on successful login', () => {})
  it('should expire session after 24 hours', () => {})
  it('should hash password with Argon2id', () => {})
})
```

### 6.2 E2E Tests

```typescript
// e2e/auth.spec.ts
test('parent can register and login', async () => {
  await page.goto('/register')
  await fillRegistrationForm()
  await submit()
  await expect(page).toHaveURL('/dashboard')
  
  await logout()
  await login()
  await expect(page).toHaveURL('/dashboard')
})
```

---

## 7. Error Handling

| Error | User Message | Logging |
|-------|--------------|---------|
| Invalid credentials | "Invalid email or password" | None (privacy) |
| Rate limited | "Too many attempts. Try again later." | None |
| Session expired | "Your session has expired. Please log in again." | None |
| Network error | "Connection failed. Check your network." | Console only |

---

## 8. Deployment Considerations

### 8.1 Environment Variables

```bash
# REQUIRED
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="32+ char random"
NEXT_PUBLIC_APP_URL="https://..."
BETTER_AUTH_URL="https://..."

# SECURITY
NODE_ENV="production"
```

### 8.2 Docker Considerations

- Sessions survive container restarts (stored in PostgreSQL)
- No session affinity needed
- Stateless app servers

---

## 9. Rollback Plan

If critical auth bug found:
1. Database: Sessions can be purged via `DELETE FROM sessions`
2. Users: All users can reset passwords manually (v0.1)
3. Code: Revert to previous commit, rebuild

---

## 10. Acceptance Criteria

- [ ] Parent can register with email/password
- [ ] Password is hashed with Argon2id
- [ ] Rate limiting prevents brute force (5 attempts/min)
- [ ] Session cookie is HTTP-Only and Secure
- [ ] Session expires after 24 hours
- [ ] Protected routes redirect unauthenticated users
- [ ] Logout clears session immediately
- [ ] No external auth providers used
- [ ] No analytics/tracking in auth flow
- [ ] All auth tests pass

---

**Plan Status:** DRAFT - Pending Research Validation
