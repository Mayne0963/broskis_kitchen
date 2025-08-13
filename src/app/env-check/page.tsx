'use client';
export default function EnvCheck() {
  const vars = {
    api: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    auth: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    project: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    sender: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  return <pre>{JSON.stringify(vars, null, 2)}</pre>;
}