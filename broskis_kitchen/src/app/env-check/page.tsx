'use client';
export default function EnvCheck() {
  const vars = {
    api: process.env.FIREBASE_API_KEY,
    auth: process.env.FIREBASE_AUTH_DOMAIN,
    project: process.env.FIREBASE_PROJECT_ID,
    bucket: process.env.FIREBASE_STORAGE_BUCKET,
    sender: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
  };
  return <pre>{JSON.stringify(vars, null, 2)}</pre>;
}