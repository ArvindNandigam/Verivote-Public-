import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";


// Brand color palette
const colors = {
  primary: "#1976d2",
  accent: "#f5f5f5",
  success: "#34a853",
  warn: "#fbbc05",
  error: "#ea4335",
};

const cardStyle = {
  background: "#fff",
  padding: "28px",
  borderRadius: "14px",
  boxShadow: "0 4px 18px rgba(0,0,0,0.12)",
  marginBottom: "22px",
};

const btnStyle = color => ({
  padding: "12px 27px",
  borderRadius: "8px",
  background: color,
  color: color === colors.warn ? "#222" : "#fff",
  border: "none",
  fontWeight: "bold",
  fontSize: "1.09rem",
  cursor: "pointer",
  margin: "10px 13px 0 0",
  boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
  transition: "background 0.2s",
});

const alertStyle = color => ({
  color,
  background: color + "22",
  fontWeight: "bold",
  borderRadius: "7px",
  padding: "11px 16px",
  margin: "22px 0 10px 0"
});

const Vote = () => {
  const [code, setCode] = useState(""); // ElectionId or AccessCode
  const [password, setPassword] = useState("");
  const [election, setElection] = useState(null);
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const [expired, setExpired] = useState(false);
  const navigate = useNavigate();

  // Load election by code
  const loadElection = async () => {
    if (!code) {
      setMessage("Enter election code");
      return;
    }
    try {
      const res = await authFetch(`/election/${code}`);
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Election not found");
        setElection(null);
        return;
      }
      setElection(data);

      // Check expiration
      if (data.expiration && new Date(data.expiration) < new Date()) {
        setExpired(true);
        setMessage("⚠️ This election has expired");
      } else {
        setExpired(false);
        setMessage("");
      }
    } catch (err) {
      setMessage("Error fetching election");
    }
  };

  // Submit vote
  const submitVote = async () => {
    if (!selected) {
      setMessage("Select a candidate");
      return;
    }
    if (election.type === "private" && !password) {
      setMessage("Enter password for private election");
      return;
    }
    if (expired) {
      setMessage("Cannot vote, election expired");
      return;
    }
    try {
      const res = await authFetch("/vote", {
        method: "POST",
        body: JSON.stringify({
          ElectionId: election.ElectionId,
          CandidateId: selected,
          Password: election.type === "private" ? password : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Error voting");
        return;
      }
      setMessage(data.message || "✅ Vote submitted!");
      setElection(null);
      setCode("");
      setSelected(null);
      setPassword("");
    } catch (err) {
      setMessage("Error submitting vote");
    }
  };

  return (
    <div style={{ maxWidth: "500px", margin: "50px auto", textAlign: "center", padding: "5px" }}>
      <h2 style={{ color: colors.primary, marginBottom: "8px" }}>🗳️ Cast Your Vote</h2>
      <div style={{ color: "#555", marginBottom: "25px", fontSize: "1.05rem" }}>
        Enter your voting access code and choose your candidate below.
      </div>

      {/* Election loading section */}
      {!election && (
        <form
          style={cardStyle}
          onSubmit={e => {
            e.preventDefault();
            loadElection();
          }}
          autoComplete="off"
        >
          <label htmlFor="code" style={{ fontWeight: "bold", color: colors.primary, marginBottom: "11px", display: "block", textAlign: "left" }}>Access Code</label>
          <input
            id="code"
            type="text"
            placeholder="Enter Election Code"
            value={code}
            onChange={e => setCode(e.target.value)}
            style={{
              padding: "12px",
              width: "100%",
              borderRadius: "7px",
              border: "1px solid #ccc",
              marginBottom: "14px",
              background: colors.accent,
              fontSize: "1.07rem",
              boxSizing: "border-box"
            }}
            autoFocus
          />
          <button
            type="submit"
            style={btnStyle(colors.primary)}
          >
            Load Election
          </button>
        </form>
      )}

      {/* Election voting card */}
      {election && (
        <form style={cardStyle} onSubmit={e => { e.preventDefault(); submitVote(); }}>
          <h3 style={{ color: colors.primary }}>{election.name}</h3>
          {election.attachmentUrl && (
            <p style={{ marginBottom: "7px" }}>
              <a
                href={election.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: colors.primary, textDecoration: "underline" }}
              >
                📎 Download Attachment
              </a>
            </p>
          )}
          <div style={{ marginBottom: "7px" }}>
            <strong>Type:</strong> {election.type} {election.type === "private" && "🔒"}
          </div>
          {election.expiration && (
            <div style={{ marginBottom: "7px" }}>
              <strong>Expires:</strong> {new Date(election.expiration).toLocaleString()}
            </div>
          )}
          {election.type === "private" && (
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{
                padding: "12px",
                width: "100%",
                borderRadius: "7px",
                border: "1px solid #ccc",
                marginBottom: "12px",
                background: colors.accent,
                fontSize: "1.09rem"
              }}
              autoFocus
            />
          )}
          <div style={{
            marginTop: "17px",
            marginBottom: "14px",
            textAlign: "left",
            display: "flex",
            flexDirection: "column",
            gap: "8px"
          }}>
            {election.candidates.map(c => (
              <div key={c.id} style={{
                padding: "9px 13px",
                background: colors.accent,
                borderRadius: "8px",
                display: "flex",
                alignItems: "center"
              }}>
                <input
                  type="radio"
                  id={`candidate-${c.id}`}
                  name="candidate"
                  value={c.id}
                  checked={selected === c.id}
                  onChange={() => setSelected(c.id)}
                  disabled={expired}
                  style={{ marginRight: "10px" }}
                />
                <label htmlFor={`candidate-${c.id}`} style={{
                  marginLeft: "0px",
                  fontWeight: "bold",
                  color: colors.primary,
                  cursor: expired ? "not-allowed" : "pointer"
                }}>
                  {c.name}
                </label>
              </div>
            ))}
          </div>

          <div>
            <button
              onClick={submitVote}
              type="submit"
              disabled={expired}
              style={btnStyle(colors.success)}
            >
              Submit Vote
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              type="button"
              style={btnStyle(colors.warn)}
            >
              Back to Dashboard
            </button>
          </div>
        </form>
      )}

      {/* Feedback messages */}
      {message && (
        <div style={alertStyle(message.startsWith("✅") ? colors.success : colors.error)}>
          {message}
        </div>
      )}
    </div>
  );
};

export default Vote;
