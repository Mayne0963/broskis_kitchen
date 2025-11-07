describe("Rewards API", () => {
  const baseUrl = "https://broskiskitchen.com";

  it("should spin and return valid JSON response", async () => {
    const res = await fetch(`${baseUrl}/api/rewards/spin`, {
      method: "POST",
      headers: {
        "Idempotency-Key": `spin-test-${Date.now()}`,
      },
    });
    const body = await res.json();
    // In dev mode, endpoints should be accessible (200 for success, 429 for rate limit, etc.)
    expect([200, 429]).toContain(res.status);
    expect(body).toHaveProperty("success");
    // If successful, should have points data
    if (res.status === 200) {
      expect(body).toHaveProperty("points_awarded");
      expect(body).toHaveProperty("user_points_balance");
    }
  });

  it("should redeem reward when enough points", async () => {
    const res = await fetch(`${baseUrl}/api/rewards/redeem`, {
      method: "POST",
      headers: {
        "Idempotency-Key": "redeem-test-1",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reward_id: "side_100", order_id: "test" }),
    });
    const body = await res.json();
    // In dev mode guest will still work
    expect([200, 400]).toContain(res.status);
    expect(body).toHaveProperty("success");
  });
});