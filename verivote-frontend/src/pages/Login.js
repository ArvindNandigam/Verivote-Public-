import React, { useState } from "react";
import { login } from "../api";
import { Link } from "react-router-dom";

// Brand styling - consistent with Signup/ConfirmSignup
const colors = {
  primary: "#1976d2",
  accent: "#f5f5f5",
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
  margin: "9px 0 15px 0",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "1rem",
  background: colors.accent,
};
const buttonStyle = {
  width: "100%",
  padding: "12px",
  background: colors.primary,
  color: "#fff",
  fontWeight: "bold",
  border: "none",
  borderRadius: "6px",
  fontSize: "1.07rem",
  cursor: "pointer",
  transition: "background 0.2s",
  marginTop: "10px",
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const result = await login({ username, password });
    if (result.accessToken) {
      localStorage.setItem("accessToken", result.accessToken);
      localStorage.setItem("idToken", result.idToken);
      localStorage.setItem("refreshToken", result.refreshToken);
      localStorage.setItem("username", result.username);
      window.location.href = "/dashboard";
    } else {
      setError(result.error || "Login failed.");
    }
    setLoading(false);
  };

  return (
    <div style={boxStyle}>
      <h2 style={{ color: colors.primary, marginBottom: 10 }}>Login to VeriVote</h2>
      <p style={{ color: "#666", marginBottom: 20 }}>
        Secure access to voting, results, and your profile.
      </p>
      {error && <div style={{
        background: colors.error + "22",
        color: colors.error,
        borderRadius: "7px",
        padding: "10px 13px",
        marginBottom: "16px"
      }}>{error}</div>}
      <form onSubmit={handleSubmit} aria-label="Login Form" autoComplete="off">
        <label htmlFor="username" style={labelStyle}>Username</label>
        <input
          id="username"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={inputStyle}
          autoFocus
        />

        <label htmlFor="password" style={labelStyle}>Password</label>
        <input
          id="password"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={inputStyle}
        />

        <button type="submit" style={buttonStyle} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div style={{ textAlign: "right", marginTop: "20px", fontSize: "0.97rem" }}>
        Don't have an account?{" "}
        <Link to="/signup" style={{ color: colors.primary, textDecoration: "underline" }}>
          Signup here
        </Link>
      </div>
      <div style={{ textAlign: "right", marginTop: "10px", fontSize: "0.97rem" }}>
        <Link to="/confirm" style={{ color: colors.primary, textDecoration: "underline" }}>
          Confirm Signup
        </Link>
      </div>
    </div>
  );
};

export default Login;
