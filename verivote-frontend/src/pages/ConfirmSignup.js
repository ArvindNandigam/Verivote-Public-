import React, { useState } from "react";
import { confirmSignup, resendCode } from "../api";

// Branding + styling like Signup
const colors = {
  primary: "#1976d2",
  accent: "#f5f5f5",
  success: "#43a047",
  error: "#d32f2f",
};

const boxStyle = {
  maxWidth: "400px",
  margin: "48px auto",
  padding: "28px",
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.11)",
};
const labelStyle = {
  fontWeight: "bold",
  marginBottom: "3px",
  display: "block",
  color: colors.primary,
};
const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "9px 0 16px 0",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  background: colors.accent,
};
const buttonRow = {
  display: "flex",
  gap: "14px",
  marginTop: "14px",
};
const buttonStyle = {
  flex: 1,
  padding: "12px",
  background: colors.primary,
  color: "#fff",
  fontWeight: "bold",
  border: "none",
  borderRadius: "6px",
  fontSize: "1.07rem",
  cursor: "pointer",
  transition: "background 0.2s",
};

const ConfirmSignup = () => {
  const [username, setUsername] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    const res = await confirmSignup({ username, code });
    if (res.message) {
      setMessage(res.message + " Redirecting to login...");
      setTimeout(() => window.location.href = "/login", 2000);
    } else setError(res.error || "Confirmation failed");
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true); setError(""); setMessage("");
    const res = await resendCode(username);
    if (res.message) setMessage(res.message);
    else setError(res.error || "Resend failed");
    setLoading(false);
  };

  return (
    <div style={boxStyle}>
      <h2 style={{ color: colors.primary, marginBottom: 10 }}>Confirm Your VeriVote Signup</h2>
      <p style={{ color: "#666", marginBottom: 18 }}>
        Please enter your username and the code sent to your email/sms to activate your account.
      </p>
      {message && <div style={{
        background: colors.success + "22",
        color: colors.success,
        borderRadius: "7px",
        padding: "10px 13px",
        marginBottom: "14px"
      }}>{message}</div>}
      {error && <div style={{
        background: colors.error + "22",
        color: colors.error,
        borderRadius: "7px",
        padding: "10px 13px",
        marginBottom: "14px"
      }}>{error}</div>}
      <form onSubmit={handleSubmit} aria-label="Confirmation Form" autoComplete="off">
        <label htmlFor="username" style={labelStyle}>Username</label>
        <input
          id="username"
          type="text"
          placeholder="Your Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
          style={inputStyle}
          autoFocus
        />

        <label htmlFor="code" style={labelStyle}>Confirmation Code</label>
        <input
          id="code"
          type="text"
          placeholder="Enter Code"
          value={code}
          onChange={e => setCode(e.target.value)}
          required
          style={inputStyle}
        />

        <div style={buttonRow}>
          <button type="submit" style={buttonStyle} disabled={loading}>
            {loading ? "Confirming..." : "Confirm"}
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, background: "#fff", color: colors.primary, border: `1px solid ${colors.primary}` }}
            onClick={handleResend}
            disabled={loading || !username}
            title={!username ? "Fill username first" : "Resend confirmation code"}
          >
            {loading ? "Resending..." : "Resend Code"}
          </button>
        </div>
      </form>
      <div style={{ textAlign: "right", marginTop: "18px", fontSize: "0.98rem" }}>
        <a href="/signup" style={{ color: colors.primary, textDecoration: "underline" }}>Signup</a> |
        <a href="/login" style={{ color: colors.primary, marginLeft: "10px", textDecoration: "underline" }}>Login</a>
      </div>
    </div>
  );
};

export default ConfirmSignup;
