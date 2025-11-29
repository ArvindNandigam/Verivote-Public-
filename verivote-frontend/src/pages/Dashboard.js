import React, { useEffect, useState } from "react";
import { authFetch } from "../utils/authFetch";
import { useNavigate } from "react-router-dom";

// Color palette for app branding
const colors = {
  primary: "#1976d2",
  accent: "#f5f5f5",
  success: "#34a853",
  warning: "#fbbc05",
  error: "#ea4335",
};

const mainBox = {
  maxWidth: "850px",
  margin: "44px auto",
  textAlign: "center",
  padding: "18px",
};

const sectionBox = {
  background: "#fff",
  padding: "24px",
  borderRadius: "14px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.11)",
  marginBottom: "36px",
};

const fieldStyle = {
  padding: "12px",
  borderRadius: "7px",
  border: "1px solid #ccc",
  margin: "7px 0 17px 0",
  width: "80%",
  fontSize: "1rem",
  background: colors.accent,
};

const labelStyle = {
  fontWeight: "bold",
  marginBottom: "5px",
  display: "block",
  color: colors.primary,
  textAlign: "left",
  marginLeft: "10%",
  fontSize: "1.03rem"
};

const buttonStyle = {
  padding: "11px 23px",
  borderRadius: "7px",
  border: "none",
  fontWeight: "bold",
  fontSize: "1.09rem",
  cursor: "pointer",
  margin: "6px 9px 6px 0",
  transition: "background 0.2s",
};

const actionBtn = color => ({
  ...buttonStyle,
  background: color,
  color: "#fff"
});

const chatBtnStyle = {
  ...buttonStyle,
  background: colors.primary,
  color: "#fff",
  marginTop: "8px",
  width: "220px"
};

const Dashboard = () => {
  const [elections, setElections] = useState([]);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState(null);
  const [summarizingId, setSummarizingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    type: "public",
    candidates: [],
    candidateInput: "",
    password: "",
    expiration: "",
    attachment: null,
  });

  const navigate = useNavigate();

  function parseJwt(token) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  }

  useEffect(() => {
    const idToken = localStorage.getItem("idToken");
    if (idToken) {
      const decoded = parseJwt(idToken);
      setUserId(decoded?.sub || null);
    }
    loadElections();
    // eslint-disable-next-line
  }, []);

  const loadElections = async () => {
    try {
      const res = await authFetch("/elections");
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Unable to load elections");
        setElections([]);
        return;
      }
      setElections(data);
      setMessage(data.length === 0 ? "No elections found." : "");
    } catch (err) {
      setMessage("Error loading elections");
    }
  };

  // Candidate input handlers
  const handleCandidateInputChange = (e) => {
    setForm({ ...form, candidateInput: e.target.value });
  };

  const handleAddCandidate = () => {
    const name = form.candidateInput.trim();
    if (!name) return;
    setForm({
      ...form,
      candidates: [...form.candidates, { id: (form.candidates.length + 1).toString(), name }],
      candidateInput: "",
    });
  };

  const handleRemoveCandidate = (idx) => {
    setForm({
      ...form,
      candidates: form.candidates.filter((_, i) => i !== idx),
    });
  };

  const handleCreate = async () => {
    if (!form.name || form.candidates.length === 0) {
      setMessage("Please fill all required fields");
      return;
    }
    if (form.type === "private" && !form.password) {
      setMessage("Private elections require a password");
      return;
    }

    try {
      let attachmentData = null;
      if (form.attachment) {
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(form.attachment);
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = err => reject(err);
        });
        attachmentData = {
          data: base64,
          filename: form.attachment.name,
        };
      }

      const res = await authFetch("/elections", {
        method: "POST",
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          password: form.type === "private" ? form.password : null,
          candidates: form.candidates,
          expiration: form.expiration || null,
          attachmentBase64: attachmentData?.data || null,
          attachmentName: attachmentData?.filename || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Error creating election");
        return;
      }

      setMessage("✅ Election created successfully!");
      setForm({
        name: "",
        type: "public",
        candidates: [],
        candidateInput: "",
        password: "",
        expiration: "",
        attachment: null,
      });
      loadElections();
    } catch (err) {
      setMessage("Error creating election");
    }
  };

  const handleDeleteElection = async (id) => {
    if (!window.confirm("Are you sure you want to delete this election?")) return;

    try {
      const res = await authFetch(`/elections/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Error deleting election");
        return;
      }
      setMessage("🗑️ Election deleted successfully!");
      loadElections();
    } catch (err) {
      setMessage("Error deleting election");
    }
  };

  const handleSummarizeExisting = async (election) => {
    if (!election.attachmentUrl) {
      alert("No attachment available for this election.");
      return;
    }

    setSummarizingId(election.ElectionId);

    try {
      const res = await authFetch("/summarize", {
        method: "POST",
        body: JSON.stringify({
          attachmentUrl: election.attachmentUrl,
          attachmentName: election.attachmentName
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error summarizing document");
      } else {
        alert("✅ Document Summary:\n\n" + data.summary);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to summarize document");
    } finally {
      setSummarizingId(null);
    }
  };

  const handleViewElection = (path, electionId) => {
    navigate(`${path}/${electionId}`);
  };

  // Redirect to chatbot
  const openChatbot = () => {
    window.location.href = "https://verivote-frontend.netlify.app/chat";
  };

  return (
    <div style={mainBox}>
      <h2 style={{ color: colors.primary, marginBottom: "6px" }}>Election Dashboard</h2>
      <span style={{ color: "#555", fontSize: "1.08rem", marginBottom: "21px", display: "block" }}>
        Manage elections, view results, vote, and chat for help.
      </span>

      <button
        style={chatBtnStyle}
        onClick={openChatbot}
        title="Chat for voting help or guidance"
      >
        💬 Chat with Chatbot
      </button>

      {/* Create Election Form */}
      <div style={sectionBox}>
        <h3 style={{ color: colors.primary, marginBottom: "10px" }}>Create New Election</h3>

        <label htmlFor="name" style={labelStyle}>Election Name</label>
        <input
          id="name"
          type="text"
          placeholder="Election Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={fieldStyle}
          autoFocus
        />

        {/* Candidate Input Field */}
        <label htmlFor="candidateInput" style={labelStyle}>Add Candidate</label>
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "10px",
          marginLeft: "10%",
          maxWidth: "510px"
        }}>
          <input
            id="candidateInput"
            type="text"
            placeholder="Candidate name"
            value={form.candidateInput}
            onChange={handleCandidateInputChange}
            style={{
              ...fieldStyle,
              width: "calc(100% - 110px)",
              marginBottom: 0,
              marginRight: "12px"
            }}
          />
          <button
            type="button"
            onClick={handleAddCandidate}
            style={{
              ...actionBtn(colors.success),
              minWidth: "98px",
              padding: "10px 0"
            }}
            disabled={!form.candidateInput.trim()}
          >
            Add
          </button>
        </div>
        {form.candidates.length > 0 && (
          <div style={{
            textAlign: "left",
            marginLeft: "10%",
            maxWidth: "510px"
          }}>
            <strong>Candidates:</strong>
            <ul style={{
              paddingLeft: "18px",
              marginTop: "8px",
              marginBottom: "8px"
            }}>
              {form.candidates.map((c, idx) => (
                <li key={c.id} style={{
                  margin: "7px 0",
                  display: "flex",
                  alignItems: "center"
                }}>
                  <span>{c.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveCandidate(idx)}
                    style={{
                      ...actionBtn(colors.error),
                      fontSize: "0.89rem",
                      padding: "5px 12px",
                      marginLeft: "18px",
                      minWidth: "68px"
                    }}
                    title="Remove candidate"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <label htmlFor="type" style={labelStyle}>Election Type</label>
        <select
          id="type"
          value={form.type}
          onChange={e => setForm({ ...form, type: e.target.value })}
          style={fieldStyle}
        >
          <option value="public">Public</option>
          <option value="private">Private (with password)</option>
        </select>

        {form.type === "private" && (
          <>
            <label htmlFor="password" style={labelStyle}>Set Password</label>
            <input
              id="password"
              type="password"
              placeholder="Set password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={fieldStyle}
            />
          </>
        )}

        <label htmlFor="expiration" style={labelStyle}>Expiration Date/Time</label>
        <input
          id="expiration"
          type="datetime-local"
          value={form.expiration}
          onChange={e => setForm({ ...form, expiration: e.target.value })}
          style={fieldStyle}
        />

        <label htmlFor="attachment" style={labelStyle}>Attach Document (optional)</label>
        <input
          id="attachment"
          type="file"
          onChange={e => setForm({ ...form, attachment: e.target.files[0] })}
          style={{ margin: "8px 0 17px 0" }}
        />

        <button
          onClick={handleCreate}
          style={actionBtn(colors.primary)}
          title="Create Election"
        >
          Create Election
        </button>
      </div>

      {message && <div style={{
        background: message.startsWith("✅") ? colors.success + "22" :
                  message.startsWith("🗑️") ? colors.warning + "22" :
                  message.toLowerCase().includes("error") ? colors.error + "22" :
                  "#eef",
        color: message.startsWith("✅") ? colors.success :
              message.startsWith("🗑️") ? colors.warning :
              message.toLowerCase().includes("error") ? colors.error :
              "#333",
        borderRadius: "8px",
        padding: "12px 14px",
        marginBottom: "18px",
        fontWeight: "bold"
      }}>{message}</div>}

      {/* Elections List */}
      {elections.map(e => {
        const isExpired = e.expiration && new Date(e.expiration) <= new Date();
        const isCreator = userId === e.creatorId;

        return (
          <div key={e.ElectionId} style={{
            background: "#fff",
            border: `2px solid ${isExpired ? "#fae9e8" : "#ddebe8"}`,
            borderRadius: "12px",
            padding: "22px",
            marginBottom: "20px",
            textAlign: "left",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            opacity: isExpired ? 0.7 : 1
          }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap" }}>
              <h3 style={{ color: colors.primary }}>
                {e.name} {isExpired && <span style={{ color: colors.error, fontSize: "1rem", marginLeft: "10px" }}>(Expired)</span>}
              </h3>
              {isCreator && (
                <button
                  onClick={() => handleDeleteElection(e.ElectionId)}
                  style={actionBtn(colors.error)}
                  title="Delete Election"
                >
                  🗑️ Delete
                </button>
              )}
            </div>

            <div style={{ color: "#333", margin: "9px 0 8px 0" }}>
              <span style={{ marginRight: "12px" }}><strong>Type:</strong> {e.type} {e.type === "private" && "🔒"}</span>
              <span style={{ marginRight: "12px" }}><strong>Access Code:</strong> {e.accessCode}</span>
              {e.expiration && <span><strong>Expires:</strong> {new Date(e.expiration).toLocaleString()}</span>}
            </div>

            {e.attachmentUrl && (
              <div style={{ margin: "8px 0" }}>
                <a href={e.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: colors.primary }}>
                  📎 View Attachment
                </a>
                <button
                  onClick={() => handleSummarizeExisting(e)}
                  style={actionBtn(colors.warning)}
                  disabled={summarizingId === e.ElectionId}
                  title="Summarize attached document"
                >
                  {summarizingId === e.ElectionId ? "Summarizing..." : "Summarize Document"}
                </button>
              </div>
            )}

            <div style={{ margin: "10px 0 6px 0" }}>
              <strong>Candidates:</strong> {e.candidates.map(c => c.name).join(", ")}
            </div>

            {!isExpired && (
              <div style={{ marginTop: "13px" }}>
                <button
                  onClick={() => navigate("/vote")}
                  style={actionBtn(colors.primary)}
                  title="Vote in this election"
                >
                  Vote
                </button>
                <button
                  onClick={() => handleViewElection("/results", e.ElectionId)}
                  style={actionBtn(colors.success)}
                  title="View election results"
                >
                  View Results
                </button>
              </div>
            )}

          </div>
        );
      })}
    </div>
  );
};

export default Dashboard;
