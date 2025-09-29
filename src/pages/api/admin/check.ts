import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) return res.status(401).end();
  
  const allowed = (process.env.ALLOWED_ADMIN_EMAILS || "").split(",").map(s=>s.trim().toLowerCase());
  if (allowed.includes(session.user.email.toLowerCase())) {
    return res.status(200).json({ ok: true });
  }
  
  return res.status(403).end();
}