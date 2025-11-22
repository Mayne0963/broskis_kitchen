export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};

    const workplace = {
      createdAt: new Date().toISOString(),
      workplaceName: body.workplaceName || "",
      address: body.address || "",
      contactName: body.contactName || "",
      phone: body.phone || "",
      email: body.email || "",
      shift: body.shift || "",
      employeeCount: body.employeeCount || null,
      deliveryNotes: body.deliveryNotes || "",
    };

    // TODO: integrate with a real database later.
    // For now, just log so we can confirm:
    console.log("NEW WORKPLACE SIGNUP:", workplace);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Workplace signup error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}