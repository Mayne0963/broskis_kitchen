# Firebase Production Setup Guide

## Current Status
✅ Admin email updated to: `amarikelsaw10@gmail.com`
❌ Firebase credentials are currently using development placeholders

## Setting Up Production Firebase Credentials

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (or create a new one)
3. Go to **Project Settings** (gear icon)
4. Navigate to **Service Accounts** tab
5. Click **Generate new private key**
6. Download the JSON file

### Step 2: Update Environment Variables

Replace the placeholder values in `.env.local` with your actual Firebase credentials:

```bash
# Firebase Admin SDK (Production)
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour actual private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_STORAGE_BUCKET=your-project-admin.appspot.com

# Or use the complete service account JSON:
FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project","private_key_id":"key-id","private_key":"-----BEGIN PRIVATE KEY-----\nYour private key\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk@your-project.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}'

# Firebase Client Configuration (Production)
NEXT_PUBLIC_FIREBASE_API_KEY=your-web-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-actual-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_ADMIN_STORAGE_BUCKET=your-project-admin.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your-sender-id:web:your-app-id
```

### Step 3: Set Admin Role

Once you have proper credentials, run:

```bash
node scripts/setAdminClaim.js 00broskis@gmail.com
```

### Step 4: Verify Setup

1. The user `amarikelsaw10@gmail.com` must first sign up/login to your app
2. Run the admin claim script
3. User should sign out and sign back in (or force token refresh)
4. Test admin dashboard access at `/admin`

## Security Notes

- Never commit `.env.local` to version control
- Use different Firebase projects for development and production
- Regularly rotate service account keys
- Set up proper Firestore security rules

## Troubleshooting

### Common Issues:

1. **"User not found"** - User must sign up first
2. **"Invalid private key"** - Check newline formatting in private key
3. **"Permission denied"** - Verify service account has proper permissions
4. **"Token refresh needed"** - User must sign out/in after role change

### Testing Admin Access:

```javascript
// In your app, check if user has admin role:
const user = auth.currentUser;
if (user) {
  const idTokenResult = await user.getIdTokenResult();
  const isAdmin = idTokenResult.claims.admin === true;
  console.log('Is Admin:', isAdmin);
}
```

## Current Script Configuration

The `setAdminClaim.js` script is now configured to:
- Accept email as command line argument
- Use `amarikelsaw10@gmail.com` as the new admin email
- Set comprehensive admin permissions
- Provide clear success/error messages

**Next Steps:** Update Firebase credentials and run the script to set admin role for the new email address.