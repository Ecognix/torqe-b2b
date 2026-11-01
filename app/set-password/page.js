"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "../../lib/supabase/browser";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function setNewPassword(event) {
    event.preventDefault();
    setErrorMessage("");
    if (password.length < 12) {
      setErrorMessage("Use at least 12 characters for your password.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.replace("/");
    } catch (error) {
      setErrorMessage(error.message || "Could not set your password. Request a new invitation.");
      setSaving(false);
    }
  }

  return (
    <main className="console-access">
      <section className="access-card">
        <p className="console-eyebrow">SECURE YOUR ACCOUNT</p>
        <h1>Set your password.</h1>
        <p className="access-description">Use a unique password with at least 12 characters to finish joining your workspace.</p>
        <form className="access-form" onSubmit={setNewPassword}>
          <label htmlFor="new-password">New password</label>
          <input id="new-password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} required />
          <label htmlFor="confirm-password">Confirm password</label>
          <input id="confirm-password" type="password" autoComplete="new-password" minLength={12} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
          {errorMessage && <p className="access-error" role="alert">{errorMessage}</p>}
          <button type="submit" className="console-primary-button access-submit" disabled={saving}>{saving ? "Saving…" : "Set password"}</button>
        </form>
      </section>
    </main>
  );
}
