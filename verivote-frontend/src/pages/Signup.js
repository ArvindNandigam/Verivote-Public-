import React, { useState } from "react";
import { signup } from "../api";

// Simple palette for VeriVote branding
const colors = {
  primary: "#1976d2",
  accent: "#f5f5f5",
  success: "#43a047",
  error: "#d32f2f",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  margin: "7px 0",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  background: colors.accent,
};

const labelStyle = {
  fontWeight: "bold",
  marginBottom: "4px",
  display: "block",
  color: colors.primary,
};

const buttonStyle = {
  width: "100%",
  padding: "11px",
  background: colors.primary,
  color: "#fff",
  fontWeight: "bold",
  border: "none",
  borderRadius: "6px",
  marginTop: "10px",
  fontSize: "1.07rem",
  cursor: "pointer",
  transition: "background 0.2s",
};

const boxStyle = {
  maxWidth: "420px",
  margin: "40px auto",
  padding: "26px",
  background: "#fff",
  borderRadius: "12px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.11)",
};

const Signup = () => {
  const [form, setForm] = useState({
    username: "",
    preferred_username: "",
    email: "",
    password: "",
    name: "",
    birthdate: "",
    phone_number: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    const result = await signup(form);
    if (result.message) {
      setMessage("Signup successful! Please confirm your account.");
      setTimeout(() => (window.location.href = "/confirm"), 2000);
    } else {
      setError(result.error || "Signup failed. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={boxStyle}>
      <h2 style={{ color: colors.primary, marginBottom: 10 }}>VeriVote Signup</h2>
      <p style={{ color: "#666", marginBottom: 18 }}>
        Create your VeriVote account to participate in secure online elections.
      </p>
      {message && <div style={{
        background: colors.success + "22",
        color: colors.success,
        borderRadius: "7px",
        padding: "10px 13px",
        marginBottom: "16px"
      }}>{message}</div>}
      {error && <div style={{
        background: colors.error + "22",
        color: colors.error,
        borderRadius: "7px",
        padding: "10px 13px",
        marginBottom: "16px"
      }}>{error}</div>}
      <form onSubmit={handleSubmit} aria-label="Signup Form" autoComplete="off">
        <label htmlFor="username" style={labelStyle}>Username</label>
        <input id="username" type="text" name="username" placeholder="Username" value={form.username} onChange={handleChange} required style={inputStyle} autoFocus />

        <label htmlFor="preferred_username" style={labelStyle}>Preferred Username</label>
        <input id="preferred_username" type="text" name="preferred_username" placeholder="Preferred Username" value={form.preferred_username} onChange={handleChange} required style={inputStyle} />

        <label htmlFor="email" style={labelStyle}>Email</label>
        <input id="email" type="email" name="email" placeholder="Email Address" value={form.email} onChange={handleChange} required style={inputStyle} />

        <label htmlFor="password" style={labelStyle}>Password</label>
        <input id="password" type="password" name="password" placeholder="Create Password" value={form.password} onChange={handleChange} required style={inputStyle} />

        <label htmlFor="name" style={labelStyle}>Full Name</label>
        <input id="name" type="text" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} required style={inputStyle} />

        <label htmlFor="birthdate" style={labelStyle}>Birthdate</label>
        <input id="birthdate" type="date" name="birthdate" value={form.birthdate} onChange={handleChange} required style={inputStyle} />

        <label htmlFor="phone_number" style={labelStyle}>Phone Number</label>
        <input id="phone_number" type="tel" name="phone_number" placeholder="+91 1234567890" value={form.phone_number} onChange={handleChange} required style={inputStyle} pattern="^\+\d{1,3}\d{10}$" />

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Signing up..." : "Sign up"}
        </button>
      </form>
      <div style={{ textAlign: "right", margin: "10px 0 0 0", fontSize: "0.95rem" }}>
        Already have an account? <a href="/login" style={{ color: colors.primary, textDecoration: "underline" }}>Login</a>
      </div>
    </div>
  );
};

export default Signup;
