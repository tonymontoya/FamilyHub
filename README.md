# Family Hub

A free, open-source family management platform for organizing chores, tasks, calendar events, and family coordination—running entirely in your home.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/tests-45%2F49%20passing-brightgreen)](./QUALITY_REPORT_v0.2.0.md)
[![Quality](https://img.shields.io/badge/quality-v0.2.0%20ready-brightgreen)](./QUALITY_REPORT_v0.2.0.md)

## 🏠 Why Family Hub?

- **100% Free & Open Source** - No subscriptions, no premium tiers, no ads
- **Privacy First** - Your family data never leaves your home network
- **Self-Hosted by Default** - Complete data ownership with Docker deployment
- **Child-Safe Design** - COPPA-compliant, no external AI processing child data
- **Built for Families** - Ages 5+, with parent approval workflows and gamification

## ✨ Features

| Feature | Status | Description |
|---------|--------|-------------|
| 📝 **Chores** | ✅ Available | Recurring tasks with points, parent approval workflow |
| ✅ **Todos** | ✅ Available | Simple task management for the whole family |
| 🏆 **Points & Rewards** | ✅ Available | Gamification with parent-managed rewards |
| 📋 **Lists** | ✅ Available | Shopping lists, packing lists, wishlists with drag-and-drop |
| 📅 **Calendar** | ✅ v0.2.0 | Family scheduling with events, reminders, and recurring patterns |
| 🍽️ **Meal Planning** | 🚧 Planned | Recipe collection, meal planning, shopping lists |
| 📊 **Dashboard** | ✅ Available | Today's priorities at a glance |

### Calendar Features (v0.2.0)

- 📆 **Monthly Calendar View** - Navigate between months, see events at a glance
- 📝 **Event Management** - Create, edit, delete events with title, description, time, location
- 🔄 **Recurring Events** - Weekly and daily patterns with RRULE support
- ⚡ **Event Exceptions** - Modify or cancel single occurrences of recurring events
- 🖱️ **Drag & Drop** - Reschedule events by dragging to new dates
- 🔔 **Browser Reminders** - Get notified before events with customizable timing
- 🔕 **Smart Notifications** - Acknowledged reminders don't reappear after refresh
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## 🚀 Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & Docker Compose
- 2GB RAM minimum
- Internet connection (for initial setup only)

### Run with Docker

```bash
# Clone the repository
git clone https://github.com/tonymontoya/FamilyHub.git
cd FamilyHub

# Checkout latest release
git checkout v0.2.0

# Copy environment template
cp .env.example .env
# Edit .env with your settings

# Start the application
docker compose up -d

# Access at http://localhost:3000
```

### Upgrade from v0.1.x

```bash
# Pull latest changes
git fetch --tags
git checkout v0.2.0

# Apply database migrations
docker compose exec app npx prisma migrate deploy

# Restart services
docker compose restart
```

### Development Setup

```bash
# Install dependencies
npm install

# Set up database
npx prisma migrate dev
npx prisma db seed

# Run development server
npm run dev
```

## 📖 Documentation

- [📘 User Guide](./docs/USER_GUIDE.md) - How to use Family Hub
- [🤝 Contributing](./docs/CONTRIBUTING.md) - How to contribute
- [🛡️ Security](./docs/SECURITY.md) - Security policy and reporting
- [📋 Changelog](./docs/CHANGELOG.md) - Version history

## 🏗️ Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js 16    │────▶│  PostgreSQL 16  │     │  Local Storage  │
│   (Frontend)    │     │   (Database)    │     │  (Photos/Files) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐
│  Better-Auth    │
│  (Authentication)│
└─────────────────┘
```

**Tech Stack:**
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, Radix UI, Shadcn UI
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL 16, Prisma ORM
- **Auth:** Better-Auth (session-based)
- **Deployment:** Docker, Docker Compose

## 🛡️ Privacy & Security

- **Local Processing:** All data stays on your server
- **No External AI:** Child data never sent to third-party AI services
- **COPPA Compliant:** Parent-managed child accounts, no email required for kids
- **Encryption:** HTTPS/TLS in transit, PostgreSQL encryption at rest
- **Audit Logging:** Track who created/approved what

See our [Security Policy](./docs/SECURITY.md) for details.

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for:
- Development setup
- Coding standards
- Pull request process
- Issue reporting guidelines

### Roadmap

| Phase | Version | Timeline | Focus |
|-------|---------|----------|-------|
| v0.1 MVP | ✅ | Released | Chores, Todos, Lists, Dashboard, Points |
| v0.2 | ✅ | Released | **Calendar, Event Reminders** |
| v0.3 | 🚧 | Q3 2026 | Meal planning, Plans module, Home Assistant integration |
| v1.0 | 🚧 | Q4 2026 | Native apps, advanced gamification, plugin system |

## 📜 License

Family Hub is licensed under the [GNU Affero General Public License v3.0 (AGPL-3.0)](./LICENSE).

This means:
- ✅ You can self-host for personal use
- ✅ You can modify the code
- ✅ You must share modifications if you distribute/host publicly
- ❌ You cannot create closed-source derivatives

## 💬 Community

- [GitHub Discussions](https://github.com/tonymontoya/FamilyHub/discussions) - Q&A, ideas
- [GitHub Issues](https://github.com/tonymontoya/FamilyHub/issues) - Bug reports, feature requests

## 🙏 Acknowledgments

Inspired by:
- [Donetick](https://github.com/donetick/donetick) - Open-source chore management
- [Family Tools](https://familytoolsapp.com/) - Family organization app
- [Cozi](https://www.cozi.com/) - Pioneer in family organizers

---

**Made with ❤️ for families who value privacy.**
