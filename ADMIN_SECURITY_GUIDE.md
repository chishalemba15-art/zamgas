# Admin System Security Guide

**Document Version:** 1.0
**Last Updated:** December 3, 2025
**Classification:** Internal - Restricted Access

---

## 1. Overview

This guide provides security best practices and procedures for managing the LPG Delivery platform's admin system. All administrators must follow these guidelines to ensure platform security and compliance.

---

## 2. Initial Setup - CRITICAL ACTIONS

### ⚠️ IMMEDIATE ACTIONS REQUIRED

The admin system was deployed with default credentials for testing. **These MUST be changed immediately before production use.**

#### Default Credentials (TEST ONLY)
```
Email: admin@lpgfinder.com
Password: admin123
Role: super_admin
⚠️ DO NOT USE IN PRODUCTION ⚠️
```

#### Change Default Password - Step-by-Step Guide

**Option 1: Direct Database Update (Recommended for first time)**

```sql
-- Connect to production database
DATABASE_URL="postgresql://neondb_owner:***@ep-shy-lake-adm3ldex-pooler.c-2.us-east-1.aws.neon.tech/neondb"

-- Generate new bcrypt hash for your desired password
-- Run this Go code to generate hash:
--
-- import "golang.org/x/crypto/bcrypt"
-- hash, _ := bcrypt.GenerateFromPassword([]byte("YourNewPassword123!"), bcrypt.DefaultCost)
-- fmt.Println(string(hash))

-- Update the password
UPDATE admin_users
SET password = '$2a$10$<your-generated-hash-here>'
WHERE email = 'admin@lpgfinder.com';
```

**Option 2: Via API (Once changed password, use for future changes)**

```bash
# This feature should be implemented in the admin dashboard
# POST /admin/profile/change-password
# {
#   "current_password": "admin123",
#   "new_password": "YourNewPassword123!",
#   "confirm_password": "YourNewPassword123!"
# }
```

**Password Requirements:**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, and special characters
- No dictionary words
- Different from last 5 passwords
- Change every 90 days

### New Admin Password Checklist
- [ ] Generate strong password (12+ chars, mixed case, numbers, symbols)
- [ ] Update in database using bcrypt hash
- [ ] Test login with new credentials
- [ ] Store password securely in password manager
- [ ] Revoke access to old credentials
- [ ] Document password change in audit log
- [ ] Notify other admins if applicable

---

## 3. Admin Account Management

### Creating Additional Admin Accounts

**Step 1: Generate Bcrypt Hash**
```go
package main
import (
    "fmt"
    "golang.org/x/crypto/bcrypt"
)

func main() {
    password := "TemporaryPassword123!"
    hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
    fmt.Println(string(hash))
}
```

**Step 2: Insert into Database**
```sql
INSERT INTO admin_users (
    id,
    email,
    password,
    name,
    admin_role,
    permissions,
    is_active
) VALUES (
    gen_random_uuid(),
    'newadmin@lpgfinder.com',
    '<bcrypt-hash>',
    'Admin Name',
    'super_admin',
    ARRAY['*'],
    true
);
```

**Step 3: Communicate Credentials Securely**
- Send password via encrypted channel only (not email)
- Use password manager for permanent storage
- Require password change on first login
- Document creation date and purpose

### Role Types & Permissions

**Available Roles:**
1. **super_admin** - Full access (use sparingly)
2. **manager** - Management operations only
3. **analyst** - Read-only access to analytics
4. **support** - Limited access for support team

**Permission Arrays (Future Implementation):**
```javascript
// super_admin
["*"]

// manager
["read:users", "write:users", "read:orders", "write:orders", "read:providers", "write:providers"]

// analyst
["read:dashboard", "read:analytics", "read:reports"]

// support
["read:users", "read:orders", "read:disputes", "write:disputes"]
```

### Deactivating Admin Accounts

**When admin leaves or role changes:**
```sql
-- Deactivate (reversible)
UPDATE admin_users
SET is_active = false, updated_at = NOW()
WHERE email = 'admin@lpgfinder.com';

-- Permanent deletion (after 90 days of deactivation)
DELETE FROM admin_users
WHERE email = 'admin@lpgfinder.com'
AND is_active = false
AND updated_at < NOW() - INTERVAL '90 days';
```

---

## 4. Access Control & Authentication

### JWT Token Security

**Token Details:**
- Algorithm: HS256 (HMAC-SHA256)
- Expiration: 7 days
- Format: `Authorization: Bearer <token>`
- Storage: Secure HTTP-only cookies (frontend)

**Token Handling:**
```typescript
// Frontend - Store in secure HTTP-only cookie
// Never store in localStorage for sensitive tokens
// Never expose in browser console or network logs
```

**Token Best Practices:**
- Tokens are single-use for enhanced security
- Each login generates a new token
- Expired tokens require re-authentication
- Compromised tokens should trigger immediate rotation
- Token refresh mechanism to be implemented

### Two-Factor Authentication (Recommended)

**To be implemented:**

```
1. User enters email and password
2. System sends OTP to registered phone/email
3. User enters OTP code
4. Token generated only after successful OTP verification
5. OTP valid for 5 minutes only
6. 3 failed attempts = account temporary lock (30 min)
```

### Session Management

**Current:** 7-day token expiration
**Recommended:** Implement sliding window sessions
- Token valid for 7 days
- Refresh token extends expiration
- Auto-logout on inactivity (1 hour)
- Logout all sessions on suspicious activity

---

## 5. API Security

### HTTPS/SSL Requirement

**Current Status:** ⚠️ HTTP only (DEVELOPMENT)
**Production Requirement:** ✅ HTTPS/TLS 1.3+

```nginx
# Nginx configuration example
server {
    listen 443 ssl http2;
    ssl_certificate /etc/ssl/certs/admin.lpgfinder.com.crt;
    ssl_certificate_key /etc/ssl/private/admin.lpgfinder.com.key;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Redirect HTTP to HTTPS
    if ($scheme != "https") {
        return 301 https://$server_name$request_uri;
    }
}
```

### CORS Configuration

**Allowed Origins (to be configured):**
- Admin dashboard domain
- Internal admin tools
- Monitoring dashboards

```go
// CORS middleware configuration
cors.DefaultHandler = cors.New(cors.Options{
    AllowedOrigins: []string{
        "https://admin.lpgfinder.com",
        "https://internal.lpgfinder.com",
    },
    AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
    AllowedHeaders: []string{"Authorization", "Content-Type"},
    MaxAge: 600,
})
```

### Rate Limiting

**To be implemented:**
- 5 failed login attempts = 15 minute lockout
- 100 requests per minute per IP
- 1000 requests per minute per authenticated user
- Exponential backoff for repeated failures

```go
// Pseudocode for rate limiting
if failedLoginAttempts >= 5 {
    lockoutAccount(15 * time.Minute)
}

if requestsPerMinute > 100 {
    return rateLimitError(429)
}
```

### Input Validation

**All inputs validated:**
- Email format validation
- Password strength checks
- SQL injection prevention (prepared statements)
- XSS prevention (output encoding)
- CSRF token validation

---

## 6. Database Security

### Connection Security

**Current:** Cloud-hosted PostgreSQL (Neon)
**Security Features:**
- SSL/TLS connection required
- Channel binding enabled
- Connection pooling for efficiency
- Automatic backup system

**Connection String Format:**
```
postgresql://user:password@host:5432/database?sslmode=require&channel_binding=require
```

### Data Encryption

**At Rest:**
- Database encrypted by Neon (AES-256)
- Backups encrypted
- Sensitive fields: passwords, API keys

**In Transit:**
- All connections use SSL/TLS
- No plaintext passwords transmitted
- API responses without sensitive data in URLs

### Backup & Recovery

**Automated Backups:**
- Daily backups by cloud provider
- 30-day retention policy
- Encrypted backup storage
- Tested recovery procedures

**Admin-Triggered Backups:**
```bash
# Export database for archival
pg_dump --host=<host> --username=<user> --password --format=custom <database> > backup-$(date +%Y%m%d).sql

# Restore from backup
pg_restore --host=<host> --username=<user> --password --dbname=<database> backup-20251203.sql
```

---

## 7. Audit & Monitoring

### Admin Activity Logging

**All admin actions logged:**
- Who (admin_id)
- What (action: create, read, update, delete)
- When (timestamp)
- Where (resource_type, resource_id)
- How (details JSONB)

**Example Log Entry:**
```json
{
  "id": "uuid-123",
  "admin_id": "a0000000-0000-0000-0000-000000000001",
  "action": "block_user",
  "resource_type": "users",
  "resource_id": "user-id-456",
  "details": {
    "reason": "Suspicious activity",
    "previous_status": "active",
    "new_status": "blocked"
  },
  "ip_address": "192.168.1.100",
  "created_at": "2025-12-03T15:45:30Z"
}
```

### Monitoring Checklist

**Daily:**
- Review failed login attempts
- Check for suspicious API access patterns
- Verify backup completion
- Monitor server performance

**Weekly:**
- Audit admin activity logs
- Review permission changes
- Check inactive admin accounts
- Validate alert thresholds

**Monthly:**
- Generate compliance reports
- Review access patterns
- Conduct security assessment
- Plan updates and patches

### Alert Triggers

**Immediate Alerts Required:**
- Multiple failed login attempts (5+)
- Admin account created/modified
- Mass user blocking/deletion
- Settings changes
- Unusual API access patterns
- Database connection failures

**Alert Channels:**
- Email to security team
- Slack notification to #security
- SMS for critical alerts
- Dashboard notification

---

## 8. Incident Response

### Security Incident Procedure

**If unauthorized access suspected:**

1. **IMMEDIATELY:**
   - Disable compromised admin account
   - Revoke all active tokens
   - Review recent activity logs
   - Notify security team

2. **Within 1 Hour:**
   - Change all admin passwords
   - Reset API keys/secrets
   - Audit all recent admin actions
   - Check user data modifications

3. **Within 24 Hours:**
   - Full forensic analysis
   - Notify affected stakeholders
   - Implement preventive measures
   - Document incident

4. **Post-Incident:**
   - Review logs for attack vector
   - Implement security patches
   - Update security policies
   - Employee security training

### Incident Report Template

```markdown
## Security Incident Report

**Date/Time:** 2025-12-03 15:30:00 UTC
**Severity:** Critical | High | Medium | Low
**Type:** Unauthorized Access | Data Breach | Account Compromise | Other

### Summary
[Brief description of incident]

### Impact
- Users affected: [number]
- Data compromised: [type, volume]
- Services impacted: [list]

### Root Cause
[Analysis of how it happened]

### Actions Taken
- [Immediate action 1]
- [Immediate action 2]
- [Remediation steps]

### Prevention
[How to prevent in future]
```

---

## 9. Security Best Practices for Admins

### Password Management

**DO:**
- ✅ Use unique passwords for each admin
- ✅ Store passwords in encrypted password manager
- ✅ Change password every 90 days
- ✅ Use 12+ character passwords with mixed case, numbers, symbols
- ✅ Enable 2FA when available

**DON'T:**
- ❌ Share passwords via email
- ❌ Reuse passwords from other services
- ❌ Store passwords in plaintext files
- ❌ Use common words or numbers (123456, password, etc.)
- ❌ Write passwords on sticky notes

### Account Security

**DO:**
- ✅ Logout after each session
- ✅ Use VPN for remote access
- ✅ Lock screen when away (Windows+L)
- ✅ Report suspicious activity immediately
- ✅ Update security questions regularly

**DON'T:**
- ❌ Leave admin console unattended
- ❌ Use public WiFi without VPN
- ❌ Accept unsolicited login links
- ❌ Click suspicious links in emails
- ❌ Share authentication methods

### Data Protection

**DO:**
- ✅ Minimize data access (need-to-know basis)
- ✅ Verify user identity before sensitive actions
- ✅ Log all data access and modifications
- ✅ Use secure communication channels
- ✅ Delete unnecessary data regularly

**DON'T:**
- ❌ Export user data without authorization
- ❌ Take screenshots of sensitive data
- ❌ Discuss admin operations publicly
- ❌ Modify data without proper justification
- ❌ Bypass security controls

---

## 10. Admin Training & Certification

### Required Training

All admins must complete:
1. **Initial Security Training** (Before access granted)
   - Platform overview
   - Security policies
   - Data protection
   - Incident response

2. **Annual Refresher Training** (Every 12 months)
   - Security updates
   - New threats
   - Policy changes
   - Case studies

3. **Role-Specific Training** (For each role)
   - User management
   - Order administration
   - Dispute resolution
   - Analytics & reporting

### Certification Requirements

**To maintain admin access:**
- [ ] Completed security training (annually)
- [ ] Passed security certification (80%+ score)
- [ ] Signed security agreement
- [ ] Passed background check (annually)
- [ ] No security violations in 12 months

---

## 11. Compliance & Regulations

### Data Protection

**GDPR Compliance:**
- User data access logged
- Right to deletion implemented
- Data retention policies
- Privacy impact assessments

**Local Data Laws:**
- Comply with Zambian data protection laws
- Document legal basis for data processing
- Implement data minimization
- Regular compliance audits

### Audit Trail Requirements

**Audit logs must contain:**
- Admin ID and timestamp
- Action type and resource
- Before/after values
- IP address and session ID
- 90-day minimum retention

### Compliance Checklist

- [ ] Admin audit logs reviewed monthly
- [ ] Suspicious activities investigated
- [ ] Admin access reviewed quarterly
- [ ] Password rotation policy enforced
- [ ] System access logs archived
- [ ] Compliance reports generated
- [ ] Security assessments conducted
- [ ] Vulnerabilities patched

---

## 12. Secure Communication

### Reporting Security Issues

**Confidential Reporting Channel:**
- Email: security@lpgfinder.com (PGP encrypted)
- Slack: #security-incident (private channel)
- Phone: +260-XXX-XXXX (security team)

**Do Not:**
- ❌ Post security issues in public channels
- ❌ Send sensitive data unencrypted
- ❌ Discuss vulnerabilities with unauthorized people
- ❌ Test vulnerabilities without authorization

### Secure File Transfer

**For sensitive admin documents:**
```bash
# Encrypt file before transfer
gpg --encrypt --recipient security@lpgfinder.com admin_report.pdf

# Send encrypted file via secure channel
# Recipient decrypts with their private key
```

---

## 13. Technology Stack Security

### Backend (Go)
- Version: 1.21+
- Security updates: Apply within 30 days
- Dependencies: Audit quarterly (go mod verify)
- HTTPS/TLS: 1.3+ required

### Database (PostgreSQL)
- Version: Latest stable (13+)
- SSL: Required for all connections
- Backup encryption: AES-256
- Access control: Role-based

### Frontend (Next.js)
- Version: Latest LTS
- HTTPS only in production
- Content Security Policy enabled
- XSS protection enabled

---

## 14. Disaster Recovery

### Backup & Recovery Procedure

**Automatic Backups:**
- Daily by cloud provider (Neon)
- Encrypted and geographically distributed
- Tested monthly for recovery capability

**Manual Backup (Monthly):**
```bash
# Schedule via cron
0 2 * * * pg_dump [db] > /backups/admin-$(date +\%Y\%m\%d).sql

# Verify backup integrity
pg_restore --test [backup-file]

# Store encrypted copy
gpg --symmetric admin-20251203.sql
```

**Recovery Testing:**
- Test restore procedure quarterly
- Document time-to-recovery
- Train team on recovery process

---

## 15. Vendor Management

### Third-Party Access

**Service Providers:**
- AWS (Cloud infrastructure)
- Neon (Database hosting)
- Google Cloud (Analytics)

**Access Control:**
- Minimal necessary permissions
- Time-limited access
- Audit all vendor access
- NDA and security agreements required

---

## 16. Emergency Contacts

### Security Team
- **Security Lead:** [Name] - [Email] - [Phone]
- **Database Admin:** [Name] - [Email] - [Phone]
- **DevOps Lead:** [Name] - [Email] - [Phone]

### Escalation
1. Immediate threat: Call security lead
2. High severity: Email + Slack + phone
3. Medium severity: Email + Slack
4. Low severity: Ticket system

---

## 17. Acknowledgment & Agreement

**I have read and understand the Admin Security Guide and agree to:**

1. Follow all security procedures outlined
2. Report security incidents immediately
3. Maintain confidentiality of admin data
4. Comply with all security policies
5. Participate in required training
6. Protect admin credentials

**Admin Name:** ___________________________
**Date:** _____________
**Signature:** ___________________________

---

## 18. Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-12-03 | Initial version | Security Team |
| 1.1 | Pending | 2FA implementation | Pending |
| 2.0 | Pending | Role-based permissions | Pending |

---

**Last Updated:** December 3, 2025
**Next Review:** December 10, 2025
**Classification:** Internal - Restricted Access

**ALL ADMINS MUST READ AND SIGN THIS DOCUMENT**
