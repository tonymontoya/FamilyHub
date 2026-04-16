# Contributing to Family Hub

Thank you for your interest in contributing to Family Hub! This document provides guidelines for contributing to the project.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## 🤝 Code of Conduct

This project adheres to a code of conduct that we expect all contributors to follow:

- Be respectful and inclusive
- Focus on constructive feedback
- Respect privacy and security concerns
- Help build a welcoming community

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- PostgreSQL 16
- Git

### Fork and Clone

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/FamilyHub.git
cd FamilyHub

# Add upstream remote
git remote add upstream https://github.com/tonymontoya/FamilyHub.git
```

## 🔧 Development Setup

### 1. Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your settings
DATABASE_URL="postgresql://user:password@localhost:5432/familyhub_dev"
BETTER_AUTH_SECRET="your-32-char-secret-here"
NODE_ENV="development"
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Create database
createdb familyhub_dev

# Run migrations
npx prisma migrate dev

# (Optional) Seed with test data
npx prisma db seed
```

### 4. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## 📝 Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Explicit return types on exported functions
- No `any` types (use `unknown` with type guards if needed)

```typescript
// ✅ Good
export async function getChores(familyId: string): Promise<Chore[]> {
  return prisma.chore.findMany({ where: { familyId } })
}

// ❌ Bad
export async function getChores(familyId) {
  return prisma.chore.findMany({ where: { familyId } })
}
```

### React Components

- Use functional components with hooks
- Props interface for all components
- Default exports for page components, named exports for shared components

```typescript
// ✅ Good
interface ChoreCardProps {
  chore: Chore
  onComplete: (id: string) => void
}

export function ChoreCard({ chore, onComplete }: ChoreCardProps) {
  return (
    <Card>
      <CardTitle>{chore.title}</CardTitle>
    </Card>
  )
}
```

### Database (Prisma)

- Migrations required for schema changes
- Index new foreign keys
- Soft deletes preferred over hard deletes

```bash
# Create migration
npx prisma migrate dev --name add_chore_priority

# Generate client after schema changes
npx prisma generate
```

### API Routes

- RESTful patterns
- Consistent error handling
- Input validation with Zod

```typescript
// app/api/chores/route.ts
import { z } from 'zod'

const createChoreSchema = z.object({
  title: z.string().min(1).max(200),
  points: z.number().int().min(0).max(1000),
  assigneeId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = createChoreSchema.parse(body)
    // ... create chore
    return Response.json({ success: true, chore }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Testing

Run tests before submitting PR:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# All tests with coverage
npm run test:ci
```

## 🔄 Pull Request Process

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

### 2. Make Changes

- Write clear, focused commits
- Follow coding standards
- Add tests for new functionality
- Update documentation if needed

### 3. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add chore recurrence rules
fix: prevent duplicate chore completions
docs: update API endpoint documentation
test: add E2E tests for approval flow
refactor: simplify points calculation
```

### 4. Before Submitting

```bash
# Run linting
npm run lint

# Run type checking
npm run type-check

# Run tests
npm run test

# Build (catches build-time errors)
npm run build
```

### 5. Submit PR

1. Push to your fork: `git push origin feature/your-feature`
2. Create Pull Request on GitHub
3. Fill out the PR template
4. Link related issues: "Fixes #123"
5. Request review from maintainers

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings

## Related Issues
Fixes #(issue number)
```

## 🐛 Issue Reporting

### Bug Reports

Use the bug report template and include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, Node version)
- Screenshots if applicable
- Error messages/logs

### Feature Requests

- Check existing issues first
- Describe the use case
- Explain why current solution doesn't work
- Mockups/examples welcome

### Security Issues

**DO NOT** file public issues for security vulnerabilities.

Email security concerns to: [security email TBD]

Or use GitHub's private vulnerability reporting.

## 🎯 MVP Priority

For v0.1 MVP, we prioritize:

1. **Chores module** - Core functionality
2. **Authentication** - Secure family setup
3. **Dashboard** - Daily use interface
4. **Points system** - Gamification foundation

Please focus contributions on these areas first.

## 🧪 Development Tips

### Database Inspection

```bash
# Open Prisma Studio
npx prisma studio

# Reset database (caution!)
npx prisma migrate reset
```

### Debugging

```bash
# Debug mode
DEBUG=familyhub:* npm run dev

# Debug specific module
DEBUG=familyhub:auth npm run dev
```

### Hot Reload Issues

If changes aren't reflecting:
```bash
# Clear Next.js cache
rm -rf .next

# Restart dev server
npm run dev
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Better-Auth Documentation](https://docs.better-auth.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 💬 Questions?

- [GitHub Discussions](https://github.com/tonymontoya/FamilyHub/discussions) - General questions
- [Discord]() - Real-time chat (coming soon)

Thank you for contributing to Family Hub! 🏠
