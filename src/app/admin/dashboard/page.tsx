import { redirect } from "next/navigation";
import { getSessionCookie } from "@/lib/auth/session";
import ElevateUserForm from "@/components/admin/ElevateUserForm";
import { adminDb } from "@/lib/firebase/admin";
import { getAuthHealthStats } from "@/lib/auth/authMonitoring";

type AdminLog = {
  id: string;
  type: string;
  targetUid?: string;
  requesterUid?: string;
  createdAt?: { toDate: () => Date } | Date | null;
  [key: string]: any;
};

async function getAdminSession() {
  const sessionUser = await getSessionCookie();
  
  if (!sessionUser) {
    redirect("/login");
  }
  
  const isAdmin = sessionUser.role === "admin" || (sessionUser as any).admin === true;
  
  if (!isAdmin) {
    redirect("/login");
  }
  
  return {
    sessionUser,
  };
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
  const { sessionUser } = await getAdminSession();
  const logs = await getRecentAdminLogs();
  const authHealthStats = await getAuthHealthStats();

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
            <p><strong>Email:</strong> {sessionUser.email}</p>
            <p><strong>Role:</strong> {sessionUser.role}</p>
            <p><strong>UID:</strong> {sessionUser.uid}</p>
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

      {/* Authentication Health Monitoring */}
      <section style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, marginTop: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12 }}>Authentication Health</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 16 }}>
          <div style={{ background: "#fef2f2", padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#dc2626" }}>{authHealthStats.totalDiscrepancies}</div>
            <div style={{ fontSize: 12, color: "#991b1b" }}>Total Discrepancies</div>
          </div>
          <div style={{ background: "#fff7ed", padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#ea580c" }}>{authHealthStats.recentDiscrepancies}</div>
            <div style={{ fontSize: 12, color: "#9a3412" }}>Recent (24h)</div>
          </div>
          <div style={{ background: "#f0fdf4", padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: "#16a34a" }}>{authHealthStats.resolutionRate.toFixed(1)}%</div>
            <div style={{ fontSize: 12, color: "#166534" }}>Resolution Rate</div>
          </div>
          <div style={{ background: "#eff6ff", padding: 12, borderRadius: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 500, color: "#2563eb" }}>{authHealthStats.mostCommonType}</div>
            <div style={{ fontSize: 10, color: "#1e40af" }}>Most Common Type</div>
          </div>
        </div>
        
        <div style={{ marginTop: 16, padding: 12, background: "#f0fdf4", border: "1px solid #16a34a", borderRadius: 8 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "#166534", marginBottom: 4 }}>Using Firebase Authentication</h3>
          <div style={{ fontSize: 12, color: "#15803d" }}>
            <p>All authentication now unified through Firebase session cookies</p>
            <p>Admin status: {sessionUser.role === "admin" ? "Verified via role" : "Verified via admin claim"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
