require('dotenv').config();
const admin = require('firebase-admin');

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

const admins = [
  "amarikelsaw10@gmail.com",
  "broskikitchen@gmail.com"
];

(async () => {
  for (const email of admins) {
    try {
      const user = await admin.auth().getUserByEmail(email);
      await admin.auth().setCustomUserClaims(user.uid, { admin: true });
      console.log(`✅ Set admin=true for ${email}`);
    } catch (error) {
      console.error(`❌ Failed to set admin for ${email}:`, error.message);
    }
  }
  process.exit(0);
})();