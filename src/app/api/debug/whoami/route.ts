import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export async function GET() {
  const session = await getServerSession(authOptions);
  
  // Enhanced debug: show both session and Firestore data
  let firestoreData = null;
  if (session?.user?.id) {
    try {
      const ref = db.collection("users").doc(session.user.id);
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data() || {};
        firestoreData = {
          role: data.role,
          Role: data.Role,
          admin: data.admin,
          ADMIN: data.ADMIN,
          isAdmin: data.isAdmin,
          // Computed values for debugging
          computed: {
            rawRole: (data.role ?? data.Role ?? "").toString().toLowerCase(),
            hasAdminFlag: !!(data.admin || data.ADMIN || data.isAdmin),
            wouldBeAdmin: (data.role ?? data.Role ?? "").toString().toLowerCase() === "admin" || !!(data.admin || data.ADMIN || data.isAdmin)
          }
        };
      }
    } catch (e) {
      firestoreData = { error: String(e) };
    }
  }
  
  return new Response(JSON.stringify({
    session: session ?? { user: null },
    firestore: firestoreData
  }), {
    headers: { "Content-Type": "application/json" },
  });
}