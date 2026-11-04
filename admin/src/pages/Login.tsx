import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import type { User } from "../lib/types";

export default function Login() {
  const { user, login } = useAuth();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [devMode, setDevMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (step === "phone") {
        const res = await api<{ devMode: boolean }>("/auth/otp/request", { method: "POST", body: { phone } });
        setDevMode(res.devMode);
        setStep("otp");
      } else {
        const res = await api<{ token: string; user: User }>("/auth/otp/verify", {
          method: "POST",
          body: { phone, code },
        });
        if (res.user.role !== "ADMIN") throw new Error("This account does not have admin access");
        login(res.token, res.user);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand center">
          <span className="brand-mark">T</span>
          <div>
            <strong>Turant Ondoor</strong>
            <small>Admin panel</small>
          </div>
        </div>
        {step === "phone" ? (
          <label className="field">
            <span>Mobile number</span>
            <div className="phone-input">
              <span>+91</span>
              <input
                autoFocus
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="10-digit mobile number"
              />
            </div>
          </label>
        ) : (
          <label className="field">
            <span>Enter OTP sent to +91 {phone}</span>
            <input
              autoFocus
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit OTP"
            />
            {devMode && <small className="muted">Dev mode: use 123456 (or OTP_DEV_CODE)</small>}
          </label>
        )}
        {error && <div className="alert">{error}</div>}
        <button className="btn btn-primary" disabled={busy || (step === "phone" ? phone.length !== 10 : code.length !== 6)}>
          {busy ? "Please wait…" : step === "phone" ? "Send OTP" : "Verify & log in"}
        </button>
        {step === "otp" && (
          <button type="button" className="btn btn-ghost" onClick={() => setStep("phone")}>
            Change number
          </button>
        )}
      </form>
    </div>
  );
}
