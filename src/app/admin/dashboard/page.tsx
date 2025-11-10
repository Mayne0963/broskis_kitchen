import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import ElevateUserForm from "@/components/admin/ElevateUserForm";
import { adminDb } from "@/lib/firebase/admin";

type AdminLog = {
  id: string;
  type: string;
  targetUid?: string;
  requesterUid?: string;
  createdAt?: { toDate: () => Date } | Date | null;
  [key: string]: any;
};

async function getAdminSession() {
  const session = await getServerSession(authOptions as any);
  const isAdmin = (session as any)?.user?.role === "admin";
  if (!session || !isAdmin) {
    redirect("/login");
  }
  return session!;
}

async function getRecentAdminLogs(): Promise<AdminLog[]> {
  try {
    const snap = await adminDb
      .collection("adminLogs")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
  } catch (err) {
    console.error("Failed to load admin logs", err);
    return [];
  }
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  const logs = await getRecentAdminLogs();

  const user = (session as any).user || {};
  const role = user.role || "user";
  const email = user.email || "";

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>Admin Dashboard</h1>
        <p style={{ color: "#555" }}>Manage admin privileges and view recent actions.</p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Current Admin</h2>
          <div>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Role:</strong> {role}</p>
          </div>
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Elevate User</h2>
          <ElevateUserForm />
        </div>

        <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Recent Admin Activity</h2>
          {logs.length === 0 ? (
            <p style={{ color: "#666" }}>No recent admin activities.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {logs.map((log) => {
                const ts = (log.createdAt && typeof (log.createdAt as any).toDate === 'function')
                  ? (log.createdAt as any).toDate()
                  : (log.createdAt as Date | null) || null;
                const dateStr = ts ? ts.toLocaleString() : "";
                return (
                  <li key={log.id} style={{ padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{log.type}</div>
                        {log.targetUid && <div style={{ color: "#555" }}>Target: {log.targetUid}</div>}
                        {log.requesterUid && <div style={{ color: "#555" }}>By: {log.requesterUid}</div>}
                      </div>
                      <div style={{ color: "#888", fontSize: 12 }}>{dateStr}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}