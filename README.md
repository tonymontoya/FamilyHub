# Family Hub

A free, open-source family management platform for organizing chores, tasks, and family coordination—running entirely in your home.

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

## 🏠 Why Family Hub?

- **100% Free & Open Source** - No subscriptions, no premium tiers, no ads
- **Privacy First** - Your family data never leaves your home network
- **Self-Hosted by Default** - Complete data ownership with Docker deployment
- **Child-Safe Design** - COPPA-compliant, no external AI processing child data
- **Built for Families** - Ages 5+, with parent approval workflows and gamification

## ✨ Features

| Feature | Status | Description |
|---------|--------|-------------|
| 📝 **Chores** | ✅ MVP | Recurring tasks with points, parent approval workflow |
| ✅ **Todos** | ✅ MVP | Simple task management for the whole family |
| 🏆 **Rewards** | ✅ MVP | Points system with parent-managed rewards |
| 📋 **Lists** | ✅ MVP | Shopping lists, packing lists, wishlists with drag-and-drop |
| 📅 **Calendar** | 🚧 Planned | Family scheduling with external sync |
| 🍽️ **Meal Planning** | 🚧 Planned | Recipe collection, meal planning, shopping lists |
| 📊 **Dashboard** | ✅ MVP | Today's priorities at a glance |

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

# Copy environment template
cp .env.example .env
# Edit .env with your settings

# Start the application
docker compose up -d

# Access at http://localhost:3000
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

- [🤝 Contributing](./CONTRIBUTING.md) - How to contribute
- [🛡️ Security](./SECURITY.md) - Security policy and reporting

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
- **Backend:** Next.js API Routes, tRPC (optional)
- **Database:** PostgreSQL 16, Prisma ORM
- **Auth:** Better-Auth (session-based)
- **Deployment:** Docker, Docker Compose

## 🛡️ Privacy & Security

- **Local Processing:** All data stays on your server
- **No External AI:** Child data never sent to third-party AI services
- **COPPA Compliant:** Parent-managed child accounts, no email required for kids
- **Encryption:** HTTPS/TLS in transit, PostgreSQL encryption at rest
- **Audit Logging:** Track who created/approved what

See our [Security Policy](./SECURITY.md) for details.

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for:
- Development setup
- Coding standards
- Pull request process
- Issue reporting guidelines

### Roadmap

| Phase | Timeline | Focus |
|-------|----------|-------|
| v0.1 MVP | Now | Chores, Todos, Lists, Dashboard, Points |
| v0.2 | Q2 2026 | Calendar, Natural language input |
| v0.3 | Q3 2026 | Meal planning, Plans module, Home Assistant integration |
| v1.0 | Q4 2026 | Native apps, advanced gamification, plugin system |

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
