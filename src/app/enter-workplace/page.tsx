"use client";

import { FormEvent, useState } from "react";

export default function EnterWorkplacePage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);

    const payload = {
      workplaceName: String(formData.get("workplaceName") || ""),
      address: String(formData.get("address") || ""),
      contactName: String(formData.get("contactName") || ""),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      shift: String(formData.get("shift") || ""),
      employeeCount: formData.get("employeeCount")
        ? Number(formData.get("employeeCount"))
        : null,
      deliveryNotes: String(formData.get("deliveryNotes") || ""),
    };

    try {
      const res = await fetch("/api/workplace-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Workplace signup failed:", await res.text());
        alert("Something went wrong. Please try again.");
        return;
      }

      const json = await res.json();
      if (!json.success) {
        alert("Something went wrong. Please try again.");
        return;
      }

      setSubmitted(true);
    } catch (err) {
      console.error("Workplace signup error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="page-wrapper">
      <h1 className="page-title">ENTER YOUR WORKPLACE</h1>
      <p className="page-sub">
        Fill this out once to add your job to Broski&apos;s Lunch Drop rotation.
        We&apos;ll review your info and follow up.
      </p>

      {submitted ? (
        <div className="ew-thankyou">
          <p>Thank you! We&apos;ve received your workplace info.</p>
          <p>We&apos;ll reach out after review with next steps for Broski Lunch Drops.</p>
        </div>
      ) : (
        <form className="ew-form" onSubmit={handleSubmit}>
          <div className="ew-field">
            <label>Workplace Name</label>
            <input name="workplaceName" required placeholder="General Motors – Body Shop" />
          </div>

          <div className="ew-field">
            <label>Workplace Address</label>
            <input name="address" required placeholder="Street, City, State, ZIP" />
          </div>

          <div className="ew-row">
            <div className="ew-field">
              <label>Primary Contact Name</label>
              <input name="contactName" required placeholder="Team Captain / HR / Supervisor" />
            </div>
            <div className="ew-field">
              <label>Contact Phone</label>
              <input name="phone" required placeholder="555-555-5555" />
            </div>
          </div>

          <div className="ew-row">
            <div className="ew-field">
              <label>Contact Email</label>
              <input type="email" name="email" required placeholder="you@company.com" />
            </div>
            <div className="ew-field">
              <label>Shift</label>
              <select name="shift" defaultValue="1st">
                <option value="1st">1st Shift</option>
                <option value="2nd">2nd Shift</option>
                <option value="3rd">3rd Shift</option>
                <option value="multiple">Multiple Shifts</option>
              </select>
            </div>
          </div>

          <div className="ew-field">
            <label>Approx. # of Employees on This Shift</label>
            <input type="number" name="employeeCount" min="1" placeholder="Ex: 45" />
          </div>

          <div className="ew-field">
            <label>Delivery Notes</label>
            <textarea
              name="deliveryNotes"
              rows={3}
              placeholder="Gate/security instructions, dock, reception, etc."
            />
          </div>

          <button type="submit" className="ew-submit-btn">
            SUBMIT WORKPLACE
          </button>
        </form>
      )}
    </main>
  );
}
