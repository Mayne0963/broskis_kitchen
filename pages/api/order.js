export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body || {};

    // Determine delivery date (YYYY-MM-DD)
    // Prefer body.deliveryDate if provided and valid; otherwise default to tomorrow
    const isValidDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
    let deliveryDate = isValidDate(body.deliveryDate) ? body.deliveryDate : null;
    if (!deliveryDate) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      deliveryDate = tomorrow.toISOString().slice(0, 10); // "YYYY-MM-DD"
    }

    // Basic validation (keep existing assumptions)
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return res.status(400).json({ error: "Order must include at least one item." });
    }
    if (typeof body.total !== "number") {
      return res.status(400).json({ error: "Order total must be a number." });
    }

    const order = {
      createdAt: new Date().toISOString(),
      customerName: body.customerName || null,
      phone: body.phone || null,
      email: body.email || null,
      items: body.items,
      total: body.total,
      workplaceName: body.workplaceName || null,
      workplaceShift: body.workplaceShift || null,
      // NEW field
      deliveryDate, // "YYYY-MM-DD"
    };

    // TODO: integrate with existing database later.
    // For now, log so we can confirm the payload:
    console.log("NEW ORDER RECEIVED:", order);

    return res.status(200).json({ success: true, orderId: null });
  } catch (err) {
    console.error("Order API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}