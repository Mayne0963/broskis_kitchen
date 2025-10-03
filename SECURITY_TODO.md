# 🚨 CRITICAL SECURITY FIXES NEEDED

## HIGH PRIORITY - PRODUCTION BLOCKERS

### 1. Password Verification (CRITICAL)
**File**: `src/lib/auth/options.ts`
**Issue**: Credentials provider accepts ANY password for admin emails
**Fix**: Implement proper password hashing and verification:

```typescript
// Install bcrypt: npm install bcrypt @types/bcrypt
import bcrypt from 'bcrypt';

// In your credentials provider:
const isValidPassword = await bcrypt.compare(credentials.password, storedHashedPassword);
if (!isValidPassword) {
  return null;
}
```

### 2. Environment Variable Validation
**Add to `.env.local`**:
```
ALLOWED_ADMIN_EMAILS=admin@broskiskitchen.com,manager@broskiskitchen.com
NEXTAUTH_SECRET=your-super-secure-secret-here
```

### 3. Rate Limiting
**Implement**: Add rate limiting to signin attempts to prevent brute force attacks

### 4. Session Security
**Current**: 8-hour sessions
**Recommendation**: Reduce to 2-4 hours for admin sessions

## VERCEL DEPLOYMENT CHECKLIST
- [ ] Set ALLOWED_ADMIN_EMAILS in Vercel environment variables
- [ ] Set NEXTAUTH_SECRET in Vercel environment variables  
- [ ] Enable HTTPS-only cookies in production
- [ ] Configure proper CORS headers