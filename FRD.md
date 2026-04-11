# Family Hub - Functional Requirements Document

## 1. Executive Summary

**Family Hub** is a comprehensive, free, and open-source family management web application designed to unify household organization, task management, and family coordination in one cohesive platform. Drawing inspiration from successful apps like FamilyTask, TaskHub, and Family Tools, Family Hub aims to reduce family friction through shared responsibility, gamification, and intuitive organization tools—without any cost, ads, or data exploitation.

### Core Value Proposition
- **Unify** family schedules, tasks, and responsibilities in one place
- **Motivate** children through gamification and reward systems
- **Reduce** parental mental load through delegation and visibility
- **Strengthen** family bonds through shared accountability
- **Respect privacy** - no tracking, no ads, no data selling
- **Empower self-hosting** - deploy on your own infrastructure if desired

### Key Differentiators (Based on Research)
- **Avoids the "PBL Fallacy"** - Gamification goes beyond Points/Badges/Leaderboards to foster intrinsic motivation through autonomy, competence, and relatedness
- **Collaboration-first** - Family team goals vs. individual competition
- **Natural language input** - Voice/quick-add for low-friction task creation
- **Self-hosted by default** - Complete data ownership with optional hosted service
- **Simple, not simplistic** - Kid-friendly without being childish

---

## 2. User Personas

### Primary Personas

| Persona | Role | Primary Goals | Key Pain Points |
|---------|------|---------------|-----------------|
| **Parent Manager** | Primary organizer (Mom/Dad) | Coordinate family schedule, delegate tasks, track completion | Mental overload, nagging, forgotten commitments |
| **Supporting Parent** | Secondary organizer | Stay informed, contribute to planning, support primary | Out of the loop, missed communications |
| **School-Age Child** | 8-12 years old | Complete tasks, earn rewards, gain independence | Overwhelmed by big projects, needs motivation |
| **Teen** | 13-17 years old | Manage own schedule, earn privileges, show responsibility | Wants autonomy but needs accountability |
| **Young Child** | 5-7 years old | Learn responsibility, simple tasks with parent help | Needs picture icons, parent assistance for complex tasks |

### Secondary Personas
- **Caregivers** - Grandparents, nannies, babysitters with limited access

---

## 3. Feature Modules

### 3.1 Chores Module
**Purpose:** Household duty management with recurring patterns and accountability

#### Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CH-001 | Create chores with title, description, and assignee(s) | P0 | Single or multiple family members can be assigned |
| CH-001a | Natural language chore creation | P1 | "Take out trash every Tuesday at 6pm" parses locally (no external AI) |
| CH-002 | Set flexible due dates | P0 | One-time, daily, weekly, monthly, yearly recurring options |
| CH-003 | Configure recurring patterns | P1 | Custom intervals (every X days/weeks), specific days of week |
| CH-003a | Due date vs completion date recurrence | P2 | Schedule from due date OR actual completion date |
| CH-004 | Assign point values to chores | P0 | Numeric points configurable per chore |
| CH-005 | Mark chores complete with evidence | P1 | Photo attachment option for verification |
| CH-006 | Parent approval workflow | P0 | Completed chores require parent approval before points awarded |
| CH-007 | Chore templates | P2 | Pre-built templates ("Weekly Room Clean", "Trash Duty") |
| CH-008 | Chore history & analytics | P2 | View completion rates, streaks, trends over time |
| CH-009 | Chore rotation/assignment strategies | P2 | Rotate by round-robin, random, or least completed |
| CH-010 | "Things" integration | P3 | Track non-task data (e.g., water filter age) that triggers tasks |

#### User Flow
1. Parent creates chore with details, assignee(s), recurrence, and points (via natural language or form)
2. Child sees assigned chore on their dashboard
3. Child completes chore and marks done (optional photo)
4. Parent receives notification and approves/declines
5. Points awarded upon approval

#### Research Insight
> Studies show that chore apps focusing only on extrinsic rewards (points/badges) without fostering intrinsic motivation (autonomy, competence, relatedness) see declining engagement over time. Family Hub should emphasize collaborative family goals and meaningful contribution over individual competition.

---

### 3.2 Homework Module
**Purpose:** Academic task management for children ages 5+ with parent visibility and progress tracking

**Note:** Younger children (5-7) may need parent assistance with homework entry. UI should support picture-based icons for pre-readers.

#### Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| HW-001 | Create homework assignments | P0 | Title, subject, description, due date, assigned child |
| HW-002 | Custom subject categories | P1 | Parents can create/modify subject types |
| HW-003 | Multi-step breakdown | P1 | Break large projects into sub-tasks with individual due dates |
| HW-004 | Kid-centric view | P0 | Children see only their own homework, sorted by due date |
| HW-005 | Parent overview | P0 | Parents see all children's homework with filter options |
| HW-006 | Progress tracking | P1 | Visual indicators for not started, in progress, completed |
| HW-007 | Priority levels | P1 | High/medium/low priority with visual distinction |
| HW-008 | Study session timer | P3 | Pomodoro-style focused study tracking |
| HW-009 | Grade tracking | P2 | Optional grade recording for completed assignments |

#### User Flow
1. Parent or child creates homework entry
2. Large assignments can be broken into steps
3. Child works through assignments, marking progress
4. Parent monitors via overview dashboard
5. Completed homework archived with optional grade

---

### 3.3 Todos Module
**Purpose:** General task management for miscellaneous items

#### Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| TD-001 | Create todos with details | P0 | Title, notes, assignee(s), due date (optional) |
| TD-001a | Quick voice/photo input | P1 | Add tasks via voice or photo without typing; voice processed locally |
| TD-002 | Group todos | P0 | Multiple assignees for shared tasks |
| TD-003 | Scheduling flexibility | P1 | Due date, recurring, or "someday" backlog |
| TD-004 | Honey-do list support | P2 | Special tagging for spousal requests |
| TD-005 | Quick add from dashboard | P1 | One-tap todo creation |
| TD-006 | Priority & urgency | P1 | High/medium/low priority levels |
| TD-007 | Todo categories/tags | P2 | Personal, shared, urgent, etc. |
| TD-008 | Completion celebration | P3 | Visual feedback when checking off |

#### User Flow
1. User creates todo with minimal or detailed info
2. Todo appears on assignee's dashboard
3. User checks off when complete
4. Completed todos archived (configurable auto-hide)

---

### 3.4 Calendar Module
**Purpose:** Centralized family scheduling with multi-calendar support

#### Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| CA-001 | Create events with details | P0 | Title, date/time, location, description, attendees |
| CA-002 | Multi-view support | P0 | Day, week, month views |
| CA-003 | Family member filtering | P0 | Show/hide events by family member |
| CA-004 | Calendar sync | P1 | Import/export with Google Calendar, Apple Calendar, Outlook |
| CA-005 | Reminder system | P0 | Customizable reminders (minutes/hours/days/weeks before) |
| CA-006 | Recurring events | P1 | Patterns for regular activities (soccer practice, piano lessons) |
| CA-007 | Event types & colors | P1 | Visual categorization (school, sports, medical, social) |
| CA-008 | Attendee RSVP | P2 | Family members confirm attendance |
| CA-009 | Conflict detection | P2 | Warn about overlapping events |
| CA-010 | Shared custody scheduling | P3 | Future consideration - not in initial release |

#### User Flow
1. Parent creates event with all relevant details
2. Event appears on family calendar with assigned color/type
3. Reminders sent to relevant family members
4. Family members can view filtered or full calendar
5. Sync pushes to external calendars if configured

---

### 3.5 Lists Module
**Purpose:** Collaborative lists for shopping, packing, and general organization

#### Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| LI-001 | Create multiple lists | P0 | Unlimited lists per family |
| LI-002 | List types | P1 | Shopping, packing, wishlist, custom categories |
| LI-003 | Add items with details | P0 | Name, quantity, notes, priority |
| LI-004 | Check-off functionality | P0 | Toggle items complete, auto-hide completed |
| LI-005 | Real-time collaboration | P1 | Multiple family members can edit simultaneously |
| LI-006 | List templates | P2 | Pre-built templates ("Camping Trip", "Grocery Essentials") |
| LI-007 | Item reordering | P1 | Drag-drop to organize by store aisle or priority |
| LI-008 | List sharing | P2 | Share specific lists via link (guests, babysitters) |
| LI-009 | Smart suggestions | P3 | Suggest frequently purchased items |
| LI-010 | Pantry integration | P2 | Track on-hand items, filter from shopping list |

#### User Flow
1. User creates list (shopping, packing, etc.)
2. Family members add items as needed
3. Items checked off during shopping/packing
4. Completed items hidden but accessible via "show completed"
5. List can be archived or reset for reuse

---

### 3.6 Plans Module
**Purpose:** Complex project organization combining multiple elements

#### Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| PL-001 | Create comprehensive plans | P0 | Combine tasks, events, lists, and notes in one view |
| PL-002 | Plan templates | P2 | Pre-built ("Birthday Party", "Vacation", "Home Renovation") |
| PL-003 | Assign plan components | P1 | Individual tasks/events can have different assignees |
| PL-004 | Progress tracking | P1 | Visual progress bar showing % complete |
| PL-005 | Star/favorite plans | P1 | Pin important plans to dashboard |
| PL-006 | Due date ranges | P1 | Start date and end date for entire plan |
| PL-007 | Plan notes & documents | P2 | Attach relevant information and files |
| PL-008 | Cross-module integration | P1 | Plan items appear in respective modules (calendar, todos) |
| PL-009 | Plan templates sharing | P3 | Community template library |

#### User Flow
1. Parent creates plan for big project (vacation, party, etc.)
2. Adds sub-tasks, calendar events, packing lists, and notes
3. Assigns components to family members
4. Family works through plan items
5. Progress visible on plan dashboard

---

### 3.7 Meals Module
**Purpose:** Recipe management, meal planning, and grocery integration

#### Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| ME-001 | Recipe collection | P0 | Add recipes with ingredients, instructions, photos |
| ME-002 | Recipe categories/tags | P1| Breakfast, lunch, dinner, snacks + custom tags |
| ME-003 | Meal planning calendar | P0 | Drag recipes to days for meal planning |
| ME-004 | Automatic meal suggestions | P2 | Suggest meals based on preferences/history |
| ME-005 | Shopping list generation | P0 | Export meal plan ingredients to shopping list |
| ME-006 | Pantry integration | P2 | Track what ingredients are on hand |
| ME-007 | Recipe scaling | P1| Adjust servings, auto-calculate ingredients |
| ME-008 | Dietary preferences | P2 | Filter by vegetarian, allergies, etc. |
| ME-009 | Recipe import | P2 | Import from URL (popular recipe sites) |
| ME-010 | Favorite meals | P1| Quick access to family favorites |

#### User Flow
1. User adds recipes to family cookbook
2. Plans weekly meals by dragging recipes to days
3. System generates shopping list from meal plan
4. User reviews and modifies list before shopping
5. Meals displayed on dashboard for daily reference

---

### 3.8 Dashboard & Rewards Module
**Purpose:** Centralized hub with gamification and motivation system

#### Functional Requirements

| ID | Requirement | Priority | Acceptance Criteria |
|----|-------------|----------|---------------------|
| DR-001 | Personalized dashboard | P0 | Today's tasks, meals, events in one view |
| DR-002 | Points & rewards system | P0 | Earn points for completed tasks/chores |
| DR-003 | Achievement badges | P1| Unlock badges for milestones (streaks, volume) |
| DR-004 | Leaderboards | P2 | Family rankings (optional, can be disabled) |
| DR-004a | Collaborative family goals | P1 | Team-based challenges vs. individual competition |
| DR-005 | Reward store | P0 | Spend points on rewards (customizable by parents) |
| DR-006 | Custom rewards | P0 | Parents create non-monetary rewards (movie night, extra screen time) |
| DR-006a | Surprise rewards | P2 | Random/unexpected bonuses to maintain engagement |
| DR-006b | Open-source attribution | P1 | Credit open-source libraries used in the app |
| DR-007 | Streak tracking | P1| Consecutive completion tracking with visual indicators |
| DR-008 | Dashboard customization | P2| Reorder/hide widgets per user preference |
| DR-009 | Theme customization | P3| Spend points on themes, colors, avatars |
| DR-010 | Progress analytics | P2| Weekly/monthly family and individual reports |
| DR-011 | Quick actions | P1| One-tap task completion from dashboard |
| DR-012 | NFC tag support | P3 | Physical NFC tags to mark tasks complete (self-hosted) |

#### User Flow
1. Child/parent opens app to personalized dashboard
2. Sees today's priorities at a glance
3. Completes tasks, earns points
4. Points accumulate toward rewards
5. Spends points in reward store
6. Tracks achievements and streaks

#### Gamification Research Insights

**What Works (Based on Academic Research):**
- **Intrinsic motivation** through autonomy (choice in tasks), competence (skill-building), and relatedness (family connection)
- **Variable rewards** - surprise bonuses are more engaging than predictable ones
- **Collaborative goals** - family team challenges build connection vs. individual competition
- **Progress visibility** - streaks and completion history create sense of accomplishment

**What to Avoid ("PBL Fallacy"):**
- Over-reliance on Points, Badges, Leaderboards without meaningful goals
- Excessive individual competition that undermines family collaboration
- Predictable reward schedules that become boring

---

## 4. Core Platform Features

### 4.1 Family Management

| ID | Requirement | Priority |
|----|-------------|----------|
| FM-001 | Create family group with unique identifier | P0 |
| FM-002 | Invite members via email/QR code/link | P0 |
| FM-003 | Role-based permissions (Parent/Child/Caregiver) | P0 |
| FM-004 | Child accounts without email (managed by parent) | P1 |
| FM-005 | Profile management (avatars, colors, preferences) | P1 |
| FM-006 | Family settings & preferences | P1 |
| FM-007 | Leave family / transfer ownership | P2 |

### 4.1a Permission Matrix (v0.1)

| Action | Parent | Child | Notes |
|--------|--------|-------|-------|
| **Family** ||||
| Create family | ✓ | ✗ | |
| Invite members | ✓ | ✗ | |
| Remove members | ✓ | ✗ | Cannot remove family creator |
| Edit family settings | ✓ | ✗ | |
| **Chores** ||||
| Create chore | ✓ | ✗ | |
| Edit any chore | ✓ | ✗ | |
| Assign chore | ✓ | ✗ | |
| Complete assigned chore | ✓ | ✓ | Mark self as done |
| Approve completion | ✓ | ✗ | Parent only |
| Delete chore | ✓ | ✗ | Soft delete, keep history |
| **Todos** ||||
| Create todo | ✓ | ✓ | Anyone can create |
| Edit own todo | ✓ | ✓ | |
| Edit others' todo | ✓ | ✗ | Parent can edit any |
| Complete todo | ✓ | ✓ | |
| Delete todo | ✓ | ✓ | Can delete if creator or parent |
| **Points/Rewards** ||||
| Configure point values | ✓ | ✗ | |
| View own balance | ✓ | ✓ | |
| View all balances | ✓ | ✗ | Parent sees all |
| Create reward | ✓ | ✗ | |
| Redeem reward | ✓ | ✓ | Child initiates, parent approves |

**Key Principle:** Parents have full visibility and control. Children have limited autonomy (complete assigned tasks, create personal todos).

### 4.2 Notifications & Communication (v0.1)

**v0.1 Scope:** In-app notifications only. No email, no push, no webhooks.

| ID | Requirement | Priority | v0.1 Scope | Post-v0.1 |
|----|-------------|----------|------------|-----------|
| NC-001 | Push notifications | P0 | ❌ Deferred | Browser Push API in v0.2 |
| NC-002 | Email notifications | P1 | ❌ Deferred | SMTP integration in v0.2 |
| NC-003 | In-app notification center | P0 | ✅ Included | Real-time badge updates |
| NC-004 | Customizable preferences | P1 | ❌ Deferred | v0.2 with more channels |
| NC-005 | Task assignment alerts | P0 | ✅ In-app only | Push/email optional later |
| NC-006 | Due date reminders | P0 | ✅ In-app only | Daily digest in v0.2 |
| NC-007 | Approval request alerts | P0 | ✅ In-app only | Push to parent in v0.2 |
| NC-008 | Daily/weekly digest | P2 | ❌ Deferred | Email digest in v0.2 |
| NC-009 | Webhook support | P2 | ❌ Deferred | Home Assistant in v0.3 |

**In-App Notification Types (v0.1):**
1. **Assignment** - "You have been assigned: Take out trash"
2. **Approval Request** - "Emma completed: Clean room. Approve?"
3. **Approval Result** - "Your completion was approved! +10 points"
4. **Due Soon** - "Due today: Math homework"

**Acceptance Criteria (NC-003):**
- Given a user is logged in, when they receive a notification, then a badge appears on the bell icon
- Given a user clicks the bell, when the dropdown opens, then they see their 10 most recent notifications
- Given a user views notifications, when they close the dropdown, then the badge clears
- Given a notification is triggered, when 30 seconds pass, then it appears in real-time (SSE/websocket)

### 4.3 Security & Privacy (COPPA Compliance)

#### COPPA Implementation for v0.1 (Self-Hosted)

**Simplification:** Since v0.1 is self-hosted only, COPPA compliance is primarily the responsibility of the hosting parent (data controller), not the software itself. However, Family Hub provides the technical controls to enable compliance.

**Child Account State Machine:**
```
[PARENT CREATES ACCOUNT]
        ↓
[ACTIVE] ←── No email verification required (parent is authority)
        ↓
[CAN USE APP] ←── Immediate access, parent grants consent by creation
```

**v0.1 COPPA Technical Controls:**

| ID | Requirement | Implementation | Priority |
|----|-------------|----------------|----------|
| SP-001 | Parent-managed child accounts | Child accounts created by parent, no independent registration | P0 |
| SP-002 | No child email collection | Child accounts use username only, no email field | P0 |
| SP-003 | Parent dashboard for child's data | Parent can view all child's tasks, completions, points | P0 |
| SP-004 | Parent can delete child's data | Soft delete with 30-day retention, then hard delete | P0 |
| SP-005 | Data export | JSON export of all family data | P1 |
| SP-006 | Audit log | Log of who created/approved what (retained 90 days) | P2 |
| SP-007 | Encryption at rest | PostgreSQL encryption, env var secrets | P0 |
| SP-008 | Encryption in transit | HTTPS/TLS required | P0 |
| SP-009 | Session timeout | 24-hour session expiry, refresh token rotation | P1 |
| SP-010 | Local-only processing | No external AI/LLM/analytics services | P0 |

**Post-MVP (Hosted Version) COPPA Requirements:**

When offering a hosted service, additional requirements apply:

| Requirement | Implementation |
|-------------|----------------|
| Verifiable consent | Email+ (confirmation email + follow-up verification) OR credit card verification |
| Consent record | Store consent method, timestamp, verification token |
| Annual re-verification | Prompt parent to confirm continued consent yearly |
| Direct notice | Email to parent at account creation detailing data practices |

**Data Collected (v0.1) - Minimal by Design:**
- Child: username, display name, avatar (optional), role, assigned tasks, completions, points
- NOT collected: email, phone, location, device ID, photos (except chore completion evidence)

**Data Retention:**
- Active accounts: Indefinite
- Deleted accounts: 30-day soft delete, then purge
- Audit logs: 90 days
- Task completion history: Configurable (default 90 days post-completion)

---

## 5. Domain Model & Data Boundaries

### 5.1 Canonical Entities (v0.1)

| Entity | Ownership | Description | Relationships |
|--------|-----------|-------------|---------------|
| **Family** | Core | The root container | Has many Members |
| **Member** | Core | User account (Parent or Child) | Belongs to Family, has many Completions |
| **Chore** | Chores module | Recurring household task | Belongs to Family, has many Completions |
| **Completion** | Chores module | Instance of chore being done | Belongs to Chore + Member, has approval state |
| **Todo** | Todos module | One-off task | Belongs to Family + Creator, has status |
| **PointTransaction** | Rewards module | Immutable points record | Belongs to Member, references Completion |

### 5.2 Module Boundaries & Anti-Corruption

**Rule:** Each entity has one canonical owner module. Other modules reference by ID only (no foreign key constraints across modules).

| Relationship | Type | Notes |
|--------------|------|-------|
| Dashboard → Chore | Read-only view | Dashboard queries Chore API, no direct DB access |
| Dashboard → Todo | Read-only view | Dashboard queries Todo API |
| Rewards → Completion | Event-driven | On chore approval, Rewards module receives event, creates PointTransaction |
| Chore → Member | FK reference | Chore.assignee_id references Member.id |

**Anti-Duplication Rules:**
1. **Chores vs Todos:** Chores have recurrence and points; Todos are one-off and simple. No automatic conversion.
2. **Lists vs Todos:** Lists are collections with ordering; Todos are individual tasks. A "shopping list item" is NOT a Todo.
3. **Completions are immutable:** Once created, a Completion record doesn't change (approval is a separate status field).

### 5.3 Database Schema (v0.1)

```sql
-- Core
family (id, name, created_at)
member (id, family_id, role: 'parent'|'child', username, display_name, avatar_url, created_at)

-- Auth (handled by Better-Auth tables)
-- user, session, account, verification

-- Chores
chore (id, family_id, title, description, points, recurrence_rule, assignee_id, status, created_by, created_at)
completion (id, chore_id, member_id, completed_at, photo_url, approved_by, approved_at, points_awarded, status: 'pending'|'approved'|'declined')

-- Todos
todo (id, family_id, title, notes, assignee_id, due_date, status: 'active'|'completed', created_by, created_at, completed_at)

-- Rewards
point_transaction (id, member_id, amount, type: 'earned'|'redeemed', reference_id, description, created_at)
-- Note: No "reward catalog" table in v0.1 (parent-managed rewards)
```

---

## 6. Technical Requirements

### 6.1 Platform Support

| Platform | Support Level |
|----------|---------------|
| Web (Desktop) | P0 - Full feature parity |
| Web (Mobile) | P0 - Responsive design |
| iOS Native App | P1 - Future phase |
| Android Native App | P1 - Future phase |

### 6.2 Performance Requirements

| Metric | Target |
|--------|--------|
| Initial page load | < 3 seconds |
| Time to interactive | < 5 seconds |
| API response time | < 200ms (p95) |
| Offline capability | Future - initial release web-hosted only |
| Concurrent users | Support 10+ family members simultaneously |

### 6.3 Target Age Support

| Age Group | Support Level | Notes |
|-----------|---------------|-------|
| 5-7 years | P1 | Picture icons, parent-assisted entry, simple interactions |
| 8-12 years | P0 | Full feature access, kid-friendly UI |
| 13-17 years | P0 | Full feature access, teen-appropriate design |
| 18+ (Parents) | P0 | Full administrative access |

**COPPA Compliance:** The app targets children 5+ and requires verifiable parental consent for accounts under 13.

### 6.4 Open Source & AI Policy

| Aspect | Specification |
|--------|---------------|
| License | **AGPLv3** (copyleft - requires sharing changes, aligns with values) |
| Source repository | Public GitHub repository |
| Self-hosting | Full support with Docker Compose deployment |
| Documentation | Comprehensive setup and contribution guides |
| Community | Public issue tracker and discussion forum |
| Contributions | Welcoming PRs with clear contribution guidelines |
| **AI Processing** | **Local-only or self-hosted LLM (e.g., Ollama, LocalAI)** |
| **Child Data & AI** | **Never sent to third-party AI/LLM providers (OpenAI, Anthropic, etc.)** |
| **Voice Processing** | **Browser-native Web Speech API or local Whisper instance** |

### 6.5 Data Ownership

| Aspect | Policy |
|--------|--------|
| Data ownership | Families own their data completely |
| Data export | Full export to JSON/CSV at any time |
| No lock-in | Easy migration to other platforms |
| Self-hosting option | Run entirely on your own servers |
| No telemetry | Optional anonymous usage stats only |

### 6.6 Recommended Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Frontend** | Next.js 15 + TypeScript | SSR/SSG, excellent DX, proven for self-hosted apps |
| **UI Components** | Shadcn UI + Tailwind CSS | Accessible, customizable, no vendor lock-in |
| **Backend** | Next.js API Routes | Full-stack TypeScript, simplifies deployment |
| **Database** | PostgreSQL | Proven, reliable, excellent self-hosting support |
| **ORM** | Prisma | Type-safe database access, great migration support |
| **Auth** | Better-Auth | Modern, supports email/password, OAuth, passwordless |
| **Storage** | Local filesystem or S3-compatible | Flexible for self-hosting vs. cloud |
| **Deployment** | Docker + Docker Compose | Industry standard for self-hosting |
| **Real-time** | Server-Sent Events or WebSockets | For live sync across family members |
| **NLP (Basic)** | chrono-node (client-side) | Local date/time parsing, no external calls |
| **NLP (Advanced)** | Optional: Ollama/LocalAI | Self-hosted LLM for complex natural language |
| **Voice Input** | Web Speech API | Browser-native, no external processing |

### 6.7 Integrations (Future)

| Integration | Priority |
|-------------|----------|
| Home Assistant | P2 | Native integration for smart home users |
| Google Calendar | P2 |
| Apple Calendar | P3 |
| Amazon Alexa | P3 |
| Google Assistant | P3 |

### 6.8 Non-Functional Requirements (v0.1)

#### Backup & Restore

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-001 | Automated backups | PostgreSQL pg_dump cron job (documented, not automated in app) |
| NFR-002 | Backup retention | 7 daily, 4 weekly, 12 monthly backups |
| NFR-003 | Restore capability | Documented restore procedure from pg_dump |
| NFR-004 | Data export | JSON export of all family data via UI (P1) |

#### Audit & Logging

| ID | Requirement | Implementation |
|----|-------------|----------------|
| NFR-005 | Security event logging | Failed logins, permission denials → application log |
| NFR-006 | Data change audit | Who created/approved what, retained 90 days |
| NFR-007 | Error logging | Structured logging to stdout (for container environments) |

#### Storage & Limits (v0.1)

| Resource | Default Limit | Configurable |
|----------|---------------|--------------|
| Members per family | 10 | Yes (env var) |
| Active chores | 100 | Yes |
| Active todos | 200 | Yes |
| Chore completion photos | 5MB max, JPEG/PNG | Yes |
| Photo retention | 90 days after completion | Yes |
| Total storage per family | 1GB | Yes (admin) |

#### Security

| ID | Requirement |
|----|-------------|
| NFR-008 | Password hashing: Argon2id |
| NFR-009 | Session tokens: 32-byte random, 24h expiry |
| NFR-010 | Rate limiting: 5 login attempts per 15 min per IP |
| NFR-011 | CORS: Strict origin checking |
| NFR-012 | SQL injection: Parameterized queries only (Prisma enforces) |
| NFR-013 | XSS prevention: Output encoding, CSP headers |

#### Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-014 | Page load (dashboard) | <2s on 3G |
| NFR-015 | API response (p95) | <200ms |
| NFR-016 | Concurrent users | 10+ per family |
| NFR-017 | Database connections | Connection pooling (PgBouncer documented) |

### 6.9 API Design & Contracts (v0.1)

#### REST API Patterns

| Pattern | Implementation |
|---------|----------------|
| **Base Path** | `/api/v1` |
| **Authentication** | Bearer token (Better-Auth session token) |
| **Content-Type** | JSON (`application/json`) |
| **Error Format** | `{ "error": { "code": "string", "message": "string", "details": {} } }` |
| **Pagination** | Cursor-based for real-time feeds, offset for stable lists |
| **Rate Limiting** | 100 requests/minute per user |

#### Core Endpoints (v0.1)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/*` | - | Public | Better-Auth handled (login, logout, register) |
| `/api/v1/family` | GET, POST | Parent | Get/create family |
| `/api/v1/family/members` | GET, POST | Parent | List members, invite/create child |
| `/api/v1/chores` | GET, POST | Parent | List family chores, create new |
| `/api/v1/chores/:id` | GET, PATCH, DELETE | Parent | Manage specific chore |
| `/api/v1/chores/:id/complete` | POST | Child+ | Mark chore complete (creates Completion) |
| `/api/v1/chores/:id/approve` | POST | Parent | Approve/decline completion |
| `/api/v1/todos` | GET, POST | Member | List/create todos |
| `/api/v1/todos/:id` | GET, PATCH, DELETE | Member | Manage todo (parent can edit any) |
| `/api/v1/notifications` | GET | Member | List user's notifications |
| `/api/v1/notifications/:id/read` | POST | Member | Mark notification read |
| `/api/v1/dashboard` | GET | Member | Today's aggregated view |
| `/api/v1/members/:id/points` | GET | Member | Get point balance (parent sees all) |
| `/api/v1/upload` | POST | Member | Upload chore completion photo |

#### SSE (Server-Sent Events) Endpoint

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `/api/v1/events` | Member | Real-time notifications, badge updates |

**Event Types:**
- `notification.new` - New notification for user
- `chore.completed` - Chore marked complete (parent view)
- `chore.approved` - Chore approved (child view)
- `points.awarded` - Points transaction occurred

### 6.10 Authentication Flow Details (v0.1)

#### Parent Registration & Login

```
[Registration Form]
    ↓
[Better-Auth: Create User] → user.id, user.email
    ↓
[Create Family] → family.id, member.role = 'parent'
    ↓
[Redirect to Dashboard]
```

#### Child Account Creation (Parent-Initiated)

```
[Parent: Click "Add Child"]
    ↓
[Form: username, display_name, (optional) password]
    ↓
[Better-Auth: Create User with linked parent]
    ↓
[Create Member record] → role = 'child', family_id = parent's family
    ↓
[Show credentials to parent] (username + temp password if set)
    ↓
[Child can login immediately]
```

**Key Design Decisions:**
- Child accounts have no email address (COPPA compliance)
- Child passwords are optional (younger children may not need them)
- If no password set, parent must log them in (v0.1 simplification)
- Username uniqueness is global (not per-family) - consider prefixed: `family-id-username`

#### Session Management

| Aspect | Implementation |
|--------|----------------|
| **Session Token** | HTTP-only cookie + Bearer token for API |
| **Expiry** | 24 hours access token, 7 days refresh token |
| **Storage** | Secure cookie (prod), LocalStorage dev-only |
| **Logout** | Invalidate server session, clear client storage |
| **Role Check** | Middleware validates role on protected routes |

#### Protected Route Pattern (Next.js)

```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const session = await getSession()
  if (!session) return redirect('/login')
  
  // Role-based access
  if (request.nextUrl.pathname.startsWith('/admin') && session.role !== 'parent') {
    return redirect('/dashboard')
  }
}
```

### 6.11 Frontend Architecture (v0.1)

#### State Management

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Server State** | TanStack Query (React Query) | API data, caching, refetching |
| **Real-time** | EventSource (native) | SSE connection for live updates |
| **Form State** | React Hook Form | Controlled inputs, validation |
| **UI State** | React Context (minimal) | Theme, auth status, sidebar state |
| **URL State** | Next.js router | Filters, pagination, modals |

#### Data Fetching Patterns

```typescript
// Pattern: Optimistic updates for chore completion
const completeChore = useMutation({
  mutationFn: api.completeChore,
  onMutate: async (vars) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['chores'])
    // Snapshot previous value
    const previous = queryClient.getQueryData(['chores'])
    // Optimistically update
    queryClient.setQueryData(['chores'], (old) => updateChore(old, vars))
    return { previous }
  },
  onError: (err, vars, context) => {
    // Rollback on error
    queryClient.setQueryData(['chores'], context.previous)
  },
  onSettled: () => {
    // Refetch to ensure sync
    queryClient.invalidateQueries(['chores'])
  }
})
```

#### Route Structure (Next.js App Router)

```
/app
├── (auth)
│   ├── login/page.tsx
│   └── register/page.tsx
├── (dashboard)
│   ├── page.tsx                    # Dashboard (today's view)
│   ├── chores/page.tsx
│   ├── todos/page.tsx
│   ├── family/page.tsx             # Family management
│   └── settings/page.tsx
├── api/v1/*                        # API routes
└── layout.tsx                      # Root layout with providers
```

### 6.12 File Upload Handling (v0.1)

#### Photo Upload Flow (Chore Completion)

1. **Client:** User selects photo (JPEG/PNG, max 5MB)
2. **Client:** Compress/resize to max 1200px width (browser-side)
3. **Client:** POST to `/api/v1/upload` with multipart/form-data
4. **Server:** Validate file type, size
5. **Server:** Generate UUID filename: `{familyId}/{uuid}.jpg`
6. **Server:** Store in configured storage (local filesystem or S3)
7. **Server:** Return URL: `/uploads/{familyId}/{uuid}.jpg`
8. **Client:** Include URL in completion POST

**Storage Configuration:**
```env
# Local filesystem (default for v0.1)
STORAGE_TYPE=local
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=5242880  # 5MB

# Or S3-compatible (optional)
STORAGE_TYPE=s3
S3_BUCKET=family-hub-uploads
S3_ENDPOINT=minio.local  # or AWS, Wasabi, etc.
```

**Security:**
- Files served via `/uploads/*` route with auth check
- Parent can view any family photo; child only their own
- Files outside upload directory are never served

### 6.13 Database Indexing Strategy (v0.1)

| Table | Index | Purpose |
|-------|-------|---------|
| `member` | `(family_id, role)` | Filter members by family |
| `member` | `(username)` unique | Login lookup |
| `chore` | `(family_id, status, assignee_id)` | Dashboard "my chores" query |
| `chore` | `(family_id, recurrence_rule)` | Find recurring chores |
| `completion` | `(chore_id, created_at)` | Completion history |
| `completion` | `(member_id, status)` | Child's pending approvals |
| `todo` | `(family_id, assignee_id, status)` | Todo list queries |
| `todo` | `(due_date)` | Due soon notifications |
| `notification` | `(member_id, read_at, created_at)` | Notification feed |
| `point_transaction` | `(member_id, created_at)` | Point history |

### 6.14 Error Handling Patterns

#### HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 204 | No content (DELETE) |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (not logged in) |
| 403 | Forbidden (wrong role/permissions) |
| 404 | Not found |
| 409 | Conflict (duplicate, state mismatch) |
| 429 | Rate limited |
| 500 | Server error |

#### Error Codes (Application Level)

| Code | Description | User Message |
|------|-------------|--------------|
| `CHORE_ALREADY_COMPLETED` | Child tried to complete already-pending chore | "This chore is already waiting for approval" |
| `CHORE_NOT_ASSIGNED` | User tried to complete chore assigned to another | "This chore is assigned to someone else" |
| `INSUFFICIENT_PERMISSIONS` | Child tried parent action | "Ask a parent to help with this" |
| `INVALID_RECURRENCE` | Bad recurrence rule format | "Check the schedule format" |
| `FILE_TOO_LARGE` | Upload exceeds limit | "Photo must be smaller than 5MB" |
| `QUOTA_EXCEEDED` | Family storage limit reached | "Storage full - ask parent to clean up" |

#### Client-Side Error Handling

- **Network errors:** Retry once with exponential backoff, then show toast
- **Validation errors:** Display inline with field
- **Permission errors:** Redirect to dashboard with "Ask a parent" message
- **Server errors:** Toast notification, log to console, suggest refresh

### 6.15 Testing Strategy (v0.1)

#### Test Pyramid

| Level | Tool | Coverage Target | Focus |
|-------|------|-----------------|-------|
| **Unit** | Vitest | 70% | Utilities, hooks, pure functions |
| **Integration** | Vitest + React Testing Library | 50% | API calls, component logic |
| **E2E** | Playwright | Critical paths | Auth, chore flow, approval flow |

#### Critical Path E2E Tests (Must Pass)

1. **Parent Registration Flow:**
   - Register → Create family → Add child → Create chore → Logout

2. **Child Chore Completion Flow:**
   - Login as child → View assigned chore → Mark complete → See pending approval

3. **Parent Approval Flow:**
   - Login as parent → See approval notification → Approve → Points awarded

4. **Todo Management Flow:**
   - Create todo → Assign to family member → Complete → Verify completion

#### Test Data

```typescript
// Factory pattern for test data
const createTestFamily = () => ({
  name: 'Test Family',
  members: [
    { role: 'parent', username: 'parent1', displayName: 'Mom' },
    { role: 'child', username: 'child1', displayName: 'Emma' }
  ]
})

const createTestChore = (overrides = {}) => ({
  title: 'Test Chore',
  points: 10,
  assigneeId: 'child1',
  ...overrides
})
```

### 6.16 Deployment & Operations (v0.1)

#### Docker Compose (Production)

```yaml
# docker-compose.yml (documented in repo)
version: '3.8'
services:
  app:
    image: family-hub:latest
    environment:
      - DATABASE_URL=postgresql://.../familyhub
      - BETTER_AUTH_SECRET=${AUTH_SECRET}
      - STORAGE_TYPE=local
    volumes:
      - ./uploads:/app/uploads
    ports:
      - "3000:3000"
    depends_on:
      - db
      
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups  # For pg_dump
    environment:
      - POSTGRES_DB=familyhub
      - POSTGRES_USER=familyhub
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      
volumes:
  postgres_data:
```

#### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Yes | - | 32+ char random for auth |
| `NODE_ENV` | Yes | production | production/development |
| `STORAGE_TYPE` | No | local | local or s3 |
| `UPLOAD_DIR` | No | /app/uploads | Local storage path |
| `MAX_FILE_SIZE` | No | 5242880 | Max upload bytes |
| `MAX_MEMBERS` | No | 10 | Members per family limit |
| `MAX_CHORES` | No | 100 | Active chores limit |
| `MAX_TODOS` | No | 200 | Active todos limit |
| `MAX_STORAGE_MB` | No | 1024 | Per-family storage limit |

#### Health Checks

| Endpoint | Expected | Action if Failing |
|----------|----------|-------------------|
| `GET /api/health` | `{"status":"ok","db":"connected"}` | Restart container |
| Database connection | Query succeeds | Alert, check disk/memory |
| Disk space | >20% free | Alert, cleanup old photos |

### 6.17 Database Migrations & Versioning

#### Migration Strategy (Prisma Migrate)

```bash
# Development workflow
npx prisma migrate dev --name add_chore_recurrence

# Production deployment
npx prisma migrate deploy
```

#### Migration Naming Conventions

| Pattern | Example | Use Case |
|---------|---------|----------|
| `create_<entity>` | `create_chores_table` | New table |
| `add_<column>_to_<table>` | `add_points_to_chores` | Add column |
| `drop_<entity>` | `drop_old_todos_table` | Remove (rare) |
| `alter_<table>_<change>` | `alter_chores_add_index` | Modify |

#### Zero-Downtime Deployment (v0.1+)

1. **Backwards-compatible migrations only:**
   - Add columns: nullable or with defaults
   - Don't rename columns (add new, copy data, drop old in separate release)
   - Don't drop tables/columns until code no longer references them

2. **Deployment order:**
   ```
   [Backup DB] → [Apply migrations] → [Deploy new code] → [Verify] → [Cleanup old data]
   ```

3. **Rollback plan:**
   - Keep previous Docker image tagged
   - Database snapshots before migration
   - Documented rollback commands

#### Version Compatibility

| App Version | Minimum DB Version | Migration Required |
|-------------|-------------------|-------------------|
| v0.1.0 | Initial schema | - |
| v0.1.1+ | v0.1.0 | Auto-migration on startup |
| v0.2.0 | v0.1.x | Manual migration step documented |

### 6.18 Feature Flags & Configuration

#### Runtime Configuration (Environment-Based)

| Feature | Variable | Default | Description |
|---------|----------|---------|-------------|
| Registration | `ALLOW_REGISTRATION` | `true` | Allow new family registration |
| Child creation | `MAX_CHILDREN_PER_FAMILY` | `8` | Limit on child accounts |
| Photo uploads | `ENABLE_PHOTOS` | `true` | Allow chore completion photos |
| Points system | `ENABLE_POINTS` | `true` | Enable gamification |
| Debug mode | `DEBUG_MODE` | `false` | Verbose logging, dev tools |

#### Feature Flag Pattern

```typescript
// lib/features.ts
export const features = {
  photos: process.env.ENABLE_PHOTOS === 'true',
  points: process.env.ENABLE_POINTS !== 'false', // Default true
  webhooks: process.env.ENABLE_WEBHOOKS === 'true', // v0.3+
  nlp: process.env.ENABLE_NLP === 'true', // v0.2+
}

// Usage in code
if (features.photos) {
  return <PhotoUpload />
}
```

#### Per-Family Configuration (Future)

```typescript
// family_settings table (v0.2+)
interface FamilySettings {
  familyId: string
  requirePhotoEvidence: boolean
  allowChildTodoCreation: boolean
  pointsVisibleToChildren: 'all' | 'self' | 'none'
  theme: 'light' | 'dark' | 'auto'
}
```

#### Data Seeding (v0.1)

```typescript
// prisma/seed.ts
// Only for development - creates sample family with test data
const seed = async () => {
  const family = await prisma.family.create({ data: { name: 'Demo Family' } })
  const parent = await prisma.member.create({
    data: { familyId: family.id, role: 'parent', username: 'demo-parent', ... }
  })
  // Create sample chores...
}
```

---

## 7. AI & Natural Language Processing Policy

### 7.1 Core Principles

Family Hub follows a **strict local-first AI policy** to protect child privacy:

| Principle | Policy |
|-----------|--------|
| **Local Processing First** | All AI/NLP features use client-side or self-hosted processing |
| **No Third-Party AI** | Child data is **never** sent to OpenAI, Anthropic, Google AI, or similar |
| **Optional Self-Hosted LLM** | Advanced NLP can use locally-hosted LLMs (Ollama, LocalAI, Home Assistant's LLM) |
| **Graceful Degradation** | Features work without AI; AI enhances but isn't required |
| **Parental Control** | Parents can disable all AI features |

### 7.2 Implementation Tiers

| Tier | Technology | Use Case | Data Privacy | v0.1 Status |
|------|------------|----------|--------------|-------------|
| **Basic NLP** | chrono-node (client-side) | Date/time parsing in natural language | 100% local, no network | ❌ Deferred to v0.2 |
| **Voice Input** | Web Speech API (browser) | Speech-to-text for quick task entry | Browser-native, configurable | ❌ Deferred to v0.2 |
| **Advanced NLP** | Self-hosted Ollama/LocalAI | Complex intent parsing, suggestions | Local network only | ❌ Post-MVP |
| **Image Analysis** | Self-hosted vision model (optional) | Photo task verification | Local network only | ❌ Post-MVP |

**v0.1 AI Policy:** No AI features. Deterministic form-based input only. This reduces complexity and ensures zero data leaves the home network.

**v0.2 AI Addition:** chrono-node for natural language date parsing (client-side only).

**Post-MVP AI:** Optional self-hosted LLM integration for families who choose to set it up.

### 7.3 Integration with Home Assistant

Home Assistant users can optionally connect Family Hub to their existing local LLM setup:

```yaml
# Example Home Assistant configuration
family_hub:
  llm_integration:
    provider: ollama  # or localai, llama.cpp
    endpoint: http://homeassistant.local:11434
    model: llama3.2:latest
    timeout: 5s
```

### 7.4 What We Explicitly Do NOT Support

- ❌ OpenAI GPT-4/3.5
- ❌ Anthropic Claude
- ❌ Google Gemini/Bard
- ❌ Any cloud-based AI service that processes child data

---

## 8. User Interface Requirements

### 8.1 Design Principles
- **Simple for kids, powerful for parents**
- **Consistent navigation** across all modules
- **Visual feedback** for all actions
- **Accessibility** (WCAG 2.1 AA compliance)
- **Dark mode support** (P2)
- **Low friction input** - voice, photo, natural language

### 8.2 Key UI Patterns
- Card-based dashboard layout
- Bottom navigation (mobile)
- Sidebar navigation (desktop)
- Modal-based quick actions
- Drag-and-drop for reordering
- Swipe gestures for mobile (P2)
- Picture-based navigation for young children (5-7)

---

## 9. Success Metrics

### 9.1 Product Outcome Metrics (What We Want to Improve)

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Weekly chore completion rate** | >70% of assigned chores completed | Completions / Assignments per week |
| **Parent approval turnaround** | <4 hours median | Time from completion to approval |
| **Household 4-week retention** | >60% still active after 4 weeks | Families with activity in week 4 |
| **Child engagement** | >3 app opens per week per child | Child session count |
| **Setup friction** | <10 minutes to first chore created | Time from registration to first chore |
| **Parent mental load** | Qualitative via surveys | "Do you feel less nagging?" 1-5 scale |

### 9.2 Engagement Metrics
- Daily/Monthly Active Users per family
- Average tasks completed per week
- Session duration and frequency
- Feature adoption rates

### 9.3 Satisfaction Metrics
- Net Promoter Score (NPS)
- GitHub stars and community sentiment
- Support ticket volume
- Feature request trends

### 9.4 Community Metrics
- GitHub stars and forks
- Contributor count
- Issue resolution time
- Community engagement (discussions, Discord, etc.)

---

## 10. MVP v0.1 Scope (Explicit Cutline)

### In Scope for v0.1

| Module | Features | Excluded (Post-MVP) |
|--------|----------|---------------------|
| **Auth** | Email/password, parent registration, child account creation (managed by parent) | OAuth, social login, passwordless |
| **Family** | Create family, invite by email, role assignment (Parent/Child) | QR invites, Caregiver role, transfer ownership |
| **Chores** | Create, assign, complete, parent approve, points award, basic recurrence (daily/weekly) | Chore rotation strategies, templates, "Things", NFC tags |
| **Todos** | Create, assign, complete, basic lists | Honey-do tagging, recurring todos, categories |
| **Dashboard** | Today's view, points display, quick complete, streak counter | Reward store, badges, analytics, customization |
| **Notifications** | In-app only, assignment alerts, approval requests | Email, push, webhooks, digests |

### v0.1 Data Model (Canonical)

```
Family
├── Members (User: email, name, role, avatar)
├── Chores (title, description, assignee, points, recurrence, status)
├── Todos (title, notes, assignee, dueDate, status)
├── Completions (who, what, when, approvedBy, pointsAwarded)
└── PointsLedger (balance per member, transaction log)
```

### v0.1 State Machines

**Chore Lifecycle:**
```
PENDING → COMPLETED (child marks done)
COMPLETED → APPROVED (parent approves) → points awarded
COMPLETED → DECLINED (parent declines) → returns to PENDING
```

**Child Account:**
```
INVITED → ACTIVE (parent creates, immediately active, no email verification)
```

**Points:**
```
On APPROVED completion: atomically increment balance + log transaction
```

### Explicitly Deferred (Even if P0 elsewhere)

| Feature | Reason | Target Release |
|---------|--------|----------------|
| Calendar module | Complex recurrence, sync, conflicts; not core to task completion | v0.2 |
| Reward store redemption | Requires catalog, "purchase" flow, parent fulfillment tracking | v0.2 |
| Achievement badges | Gamification v2; points sufficient for MVP validation | v0.3 |
| Caregiver role | Additional permissions complexity | v0.2 |
| Email notifications | Requires SMTP setup, deliverability, unsubscribe handling | v0.2 |
| OAuth/social login | Increases auth complexity, COPPA implications | v0.2 |
| Natural language input | Requires chrono-node integration, nice-to-have | v0.2 |
| Data export | Important but not blocking for MVP validation | v0.2 |

---

## 11. Release Phases (Post-MVP)

### Phase 2: Core Completion (Months 4-6)

### Phase 2: Core Completion (Months 4-6)
- Homework module
- Lists module
- Meals module
- Enhanced dashboard
- Notifications system
- Mobile optimization
- Natural language input

### Phase 3: Advanced Features (Months 7-9)
- Plans module
- Calendar sync
- Advanced analytics
- Recipe import
- Templates library
- Chore rotation strategies

### Phase 4: Scale & Community (Months 10-12)
- Native mobile apps
- Third-party integrations (Home Assistant, etc.)
- Community features
- Advanced gamification
- Public API for extensions
- Plugin system for custom modules
- NFC tag support

---

## 12. Decisions Made

| Question | Decision |
|----------|----------|
| **Monetization** | 100% free and open-source, no premium tiers |
| **License** | AGPLv3 (copyleft - ensures community benefits from all improvements) |
| **Age Target** | Families with children ages 5 and up |
| **Co-Parenting** | Not included in initial release (future consideration) |
| **Offline Support** | Not included - initial release web-hosted only |
| **Hosting** | **Self-hosted only for v0.1**; optional hosted service considered post-MVP |
| **Excluded Features** | None identified from competitor research |
| **Data Retention** | 90 days for completed tasks (configurable), indefinite for active data |
| **AI/LLM Policy** | **Local-first only; no third-party AI services for child data** |

## 13. Non-Goals (Explicitly Out of Scope)

To maintain focus, the following are explicitly **not** part of Family Hub:

| Feature | Reason |
|---------|--------|
| **Social network features** | Family Hub is for household coordination, not connecting with other families |
| **Location tracking / GPS** | Privacy-invasive; use dedicated family locator apps if needed |
| **In-app purchases / microtransactions** | Against 100% free commitment |
| **Advertising** | Against privacy-first principles |
| **External AI services** | Child data protection priority |
| **Offline-first architecture (PWA)** | Future consideration; initial release requires connectivity |
| **Real-time chat/messaging** | Use existing messaging apps; out of scope |
| **Banking/financial accounts for kids** | Too complex; use dedicated financial education apps |
| **School-specific integrations** (LMS, grade portals) | Highly variable; manual entry keeps app universal |

---

## 14. Competitive Analysis Summary

### Open Source Competitors

| App | License | Strengths | Gaps Family Hub Addresses |
|-----|---------|-----------|---------------------------|
| **Donetick** | AGPLv3 | Natural language input, NFC tags, Home Assistant | Child-focused UX, homework module, comprehensive family features |
| **HomeHub** | Unknown | Simple self-hosting, feature toggles | Gamification, rewards system, age-appropriate UI |

### Commercial Competitors

| App | Pricing | Strengths | Differentiation Strategy |
|-----|---------|-----------|--------------------------|
| **Cozi** | Freemium ($29.99/year) | Established, feature-rich | No ads, self-hosted, privacy-first |
| **OurHome** | Freemium | Kid-focused gamification | Open source, no subscription, data ownership |
| **Family Tools** | Free | Simple, clean UI | Self-hosting, community-driven development |
| **FamilyTask** | Unknown | Reward system | Self-hosted option, no data collection |

### Key Insights from User Research

**Common Pain Points:**
1. Subscription fatigue - families tired of monthly fees for basic organization
2. Privacy concerns - uncomfortable with family data on corporate servers
3. Overwhelming complexity - too many features poorly organized
4. Lack of offline/self-hosted options
5. No voice input for quick task addition
6. Individual competition undermining family collaboration

**Opportunities:**
- Self-hosted solution addresses privacy and subscription concerns
- Collaboration-first gamification (team goals) vs. individual competition
- Natural language/voice input for low-friction usage
- Focus on intrinsic motivation (autonomy, competence, relatedness)
- Modern, clean UI that's simple for kids but powerful for parents

---

## 15. Decisions to Resolve Before Coding

These 3 decisions will impact architecture and should be finalized before starting:

| # | Question | Options | Recommendation | Impact |
|---|----------|---------|----------------|--------|
| 1 | **Real-time updates** | Server-Sent Events vs WebSockets vs polling | SSE (simpler, uni-directional) | Infrastructure, scalability |
| 2 | **Photo storage** | Local filesystem vs S3-compatible vs database | Local filesystem default, S3 optional | Docker volumes, backup strategy |
| 3 | **Database migrations** | Prisma Migrate vs custom SQL | Prisma Migrate | Dev workflow, deployment |

**Resolved (locked):**
- ✅ Self-hosted only for v0.1 (no hosted instance)
- ✅ No AI/LLM features in v0.1
- ✅ In-app notifications only (no push/email in v0.1)
- ✅ PWA/web first, native apps post-MVP

---


## 16. Appendix

### A. Glossary
- **Plan**: A complex project combining tasks, events, lists, and notes
- **Starred**: Pinned items that appear on the dashboard
- **Honey-do**: Spousal task requests
- **COPPA**: Children's Online Privacy Protection Act
- **PBL Fallacy**: Over-reliance on Points, Badges, Leaderboards without meaningful goals
- **Things**: Non-task data tracking (inspired by Donetick) - e.g., tracking water filter age
- **LocalAI/Ollama**: Self-hosted LLM solutions for local AI processing
- **Web Speech API**: Browser-native voice recognition (no external AI)
- **AGPLv3**: GNU Affero General Public License v3 - copyleft license requiring sharing of all changes
- **chrono-node**: JavaScript library for parsing natural language dates/times
- **Prisma**: Type-safe ORM for database access
- **Better-Auth**: Modern authentication library for web applications

### B. References
- FamilyTask: https://familytask.co/about
- TaskHub: https://taskhub.family/en
- Family Tools: https://familytoolsapp.com/
- Donetick: https://github.com/donetick/donetick
- HomeHub: https://github.com/surajverma/homehub
- Gamification Research: "Gamification and Family Housework Applications" (NTNU)
- COPPA Guidelines: https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy

### C. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Low adoption due to self-hosting complexity** | Medium | High | Provide one-click deploy templates (Railway, Render, DigitalOcean), comprehensive docs, optional hosted instance |
| **COPPA compliance complexity** | Medium | High | Consult with legal, implement strictest interpretation, use "Email+" consent, build parent controls first |
| **Feature creep delaying MVP** | High | Medium | Strict phase gates, focus on 4 core modules first, defer nice-to-haves |
| **Competition from well-funded apps** | High | Low | Differentiate on privacy/self-hosting, not feature parity; community-driven development |
| **Contributor burnout (solo maintainer)** | Medium | High | Build community early, clear contribution guidelines, automated testing, don't overcommit to timelines |
| **Security vulnerability in self-hosted app** | Low | High | Security audits, dependency scanning, clear update process, responsible disclosure policy |
| **Mobile web experience inferior to native** | Medium | Medium | Invest in PWA capabilities, responsive design, eventually native apps in Phase 4 |
| **Data loss in self-hosted environments** | Medium | High | Automated backup scripts, export/import tools, clear documentation on backup procedures |

---

*Document Version: 2.1*  
*Last Updated: 2026-04-11*  
*Status: **Ready for Development** (Post-Review)*  

---

**Document History**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-11 | Initial draft | - |
| 1.1 | 2026-04-11 | Added research insights, AI policy, tech stack | - |
| 1.2 | 2026-04-11 | Polish pass: Non-goals, Risks, formatting fixes | - |
| 2.0 | 2026-04-11 | Major revision: MVP cutline, permission matrix, COPPA state machine, domain model, NFRs | - |
| 2.1 | 2026-04-11 | Technical deep-dive: API contracts, auth flows, frontend architecture, testing strategy, deployment ops, migrations, feature flags | - |
