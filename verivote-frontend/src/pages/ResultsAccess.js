import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

// Branding colors
const colors = {
  primary: "#1976d2",
  accent: "#f5f5f5",
};

const boxStyle = {
  maxWidth: "400px",
  margin: "68px auto",
  textAlign: "center",
  padding: "32px 18px",
  background: "#fff",
  borderRadius: "14px",
  boxShadow: "0 4px 18px rgba(0,0,0,0.13)",
};

const inputStyle = {
  padding: "12px",
  width: "100%",
  borderRadius: "7px",
  border: "1px solid #c2c2c2",
  marginBottom: "18px",
  background: colors.accent,
  fontSize: "1.07rem",
  boxSizing: "border-box",
};

const labelStyle = {
  fontWeight: "bold",
  color: colors.primary,
  marginBottom: "9px",
  display: "block",
  fontSize: "1.03rem",
  textAlign: "left",
};

const buttonStyle = {
  width: "100%",
  padding: "13px 0",
  borderRadius: "7px",
  background: colors.primary,
  color: "#fff",
  border: "none",
  fontWeight: "bold",
  fontSize: "1.09rem",
  cursor: "pointer",
  transition: "background 0.2s",
  marginTop: "9px",
};

const ResultsAccess = () => {
  const [accessId, setAccessId] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (accessId.trim()) {
      navigate(`/results/${accessId.trim()}`);
    }
  };

  return (
    <div style={boxStyle}>
      <h2 style={{ color: colors.primary, marginBottom: "6px" }}>📊 View Election Results</h2>
      <p style={{ color: "#555", marginBottom: "28px", fontSize: "1.03rem" }}>
        Enter your <strong>Election Access ID</strong> to check the results.
      </p>
      <form onSubmit={handleSubmit} autoComplete="off">
        <label htmlFor="accessId" style={labelStyle}>
          Access ID
        </label>
        <input
          id="accessId"
          type="text"
          placeholder="E.g. 4K7X9S..."
          value={accessId}
          onChange={(e) => setAccessId(e.target.value)}
          style={inputStyle}
          autoFocus
        />
        <button
          type="submit"
          style={buttonStyle}
          disabled={!accessId.trim()}
        >
          View Results
        </button>
      </form>
      <div style={{ marginTop: "20px", color: "#888", fontSize: "0.97rem" }}>
        Didn’t receive your ID? Contact your election admin.
      </div>
    </div>
  );
};

export default ResultsAccess;
