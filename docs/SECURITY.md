# Security Policy

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| v0.1.x  | :white_check_mark: |
| < v0.1  | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### Please DO NOT:
- File a public issue for security vulnerabilities
- Discuss vulnerabilities in public forums
- Share exploit details publicly

### Please DO:
- Report vulnerabilities privately
- Allow time for us to address the issue before disclosure
- Provide detailed reproduction steps

## How to Report

**Option 1: GitHub Private Vulnerability Reporting**
1. Go to [Security Advisories](https://github.com/tonymontoya/FamilyHub/security/advisories)
2. Click "New draft security advisory"
3. Fill in the details

**Option 2: Email**
Send details to: [security@familyhub.local] (to be configured)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)
- Your contact information for follow-up

## Response Timeline

| Phase | Timeline |
|-------|----------|
| Acknowledgment | Within 48 hours |
| Initial assessment | Within 7 days |
| Fix development | Depends on severity |
| Public disclosure | After fix is released |

## Security Best Practices for Self-Hosting

When self-hosting Family Hub, follow these practices:

### 1. Keep Software Updated
```bash
# Regularly pull latest images
docker compose pull
docker compose up -d
```

### 2. Use Strong Secrets
```bash
# Generate strong secrets
openssl rand -base64 32
```

### 3. Enable HTTPS
- Use a reverse proxy (nginx, Traefik, Caddy)
- Obtain SSL certificates (Let's Encrypt)

### 4. Database Security
- Use strong PostgreSQL password
- Limit network access to database
- Regular backups

### 5. File Uploads
- Review uploaded files regularly
- Set appropriate storage quotas
- Scan for malicious uploads

### 6. Network Security
- Place behind firewall
- Restrict port access
- Use VPN for remote admin access

## Security Features

Family Hub implements the following security measures:

### Authentication
- Argon2id password hashing
- Secure session management
- CSRF protection
- Rate limiting on login attempts

### Data Protection
- HTTPS/TLS encryption in transit
- PostgreSQL encryption at rest
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)

### Privacy
- Local-first architecture
- No external AI processing
- COPPA compliance features
- Data export and deletion

## Known Limitations

- **Self-hosted responsibility**: Security of the host environment is administrator's responsibility
- **No automatic security updates**: Administrators must monitor and apply updates
- **No intrusion detection**: Host-level security monitoring not included

## Security Checklist for Administrators

- [ ] Changed default passwords
- [ ] Enabled HTTPS
- [ ] Configured firewall rules
- [ ] Set up automated backups
- [ ] Enabled audit logging
- [ ] Reviewed user permissions
- [ ] Set up log monitoring
- [ ] Documented incident response plan

## Credits

We credit security researchers who responsibly disclose vulnerabilities. Thank you for helping keep Family Hub secure!

## History

| Date | Issue | Severity | Status |
|------|-------|----------|--------|
| - | - | - | - |

*(No security issues reported yet)*
