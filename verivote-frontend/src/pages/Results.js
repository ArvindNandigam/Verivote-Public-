import React, { useState, useEffect } from "react";
import { authFetch } from "../utils/authFetch";
import { useParams, useNavigate } from "react-router-dom";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

// Branding palette
const colors = {
  primary: "#1976d2",
  accent: "#f5f5f5",
  success: "#34a853",
  warn: "#fbbc05",
  error: "#ea4335"
};

const boxStyle = {
  maxWidth: "560px",
  margin: "40px auto",
  textAlign: "center",
  padding: "10px",
};

const resultsBoxStyle = {
  background: "#fff",
  padding: "26px",
  borderRadius: "14px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.11)",
  marginBottom: "20px",
  transition: "box-shadow 0.2s",
};

const btnStyle = {
  padding: "12px 24px",
  borderRadius: "8px",
  background: colors.warn,
  color: "#222",
  border: "none",
  fontWeight: "bold",
  fontSize: "1.09rem",
  cursor: "pointer",
  marginTop: "17px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  transition: "background 0.2s",
};

const alertStyle = color => ({
  color,
  fontWeight: "bold",
  margin: "18px 0 12px 0",
  background: color + "22",
  borderRadius: "7px",
  padding: "10px 15px"
});

const tallyItemStyle = {
  textAlign: "left",
  margin: "9px 0",
  padding: "8px 13px",
  background: colors.accent,
  borderRadius: "6px",
  fontSize: "1.08rem"
};

const Results = () => {
  const { code } = useParams(); // ElectionId from URL
  const [data, setData] = useState(null);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (code) fetchResults(code);
  }, [code]);

  const fetchResults = async (electionCode) => {
    try {
      const res = await authFetch(`/results/${electionCode}`);
      const resultData = await res.json();

      if (!res.ok) {
        setMessage(resultData.error || "Election not found or restricted");
        setData(null);
        return;
      }

      setData(resultData);
      setMessage("");
    } catch (err) {
      setMessage("Error fetching results");
    }
  };

  if (!data) {
    return (
      <div style={boxStyle}>
        <h2 style={{ color: colors.primary }}>📊 Election Results</h2>
        {message && <div style={alertStyle(colors.error)}>{message}</div>}
        <button
          onClick={() => navigate("/dashboard")}
          style={btnStyle}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  // Prepare pie chart data
  const chartData = {
    labels: data.election.candidates.map(c => c.name),
    datasets: [
      {
        label: 'Votes',
        data: data.election.candidates.map(c => data.results[c.id] || 0),
        backgroundColor: [
          colors.primary,
          colors.success,
          colors.warn,
          colors.error,
          "#a142f4",
          "#00bfa5",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div style={boxStyle}>
      <h2 style={{ color: colors.primary, marginBottom: "6px" }}>📊 Election Results</h2>

      {/* Private election view restriction */}
      {data.election.type === "private" && !data.canView && (
        <div style={alertStyle(colors.error)}>
          🔒 Only the creator can view results for private elections
        </div>
      )}

      {/* Results Content */}
      {data.canView && (
        <div style={resultsBoxStyle}>
          <h3 style={{ color: colors.primary }}>{data.election.name}</h3>
          {data.election.expiration && (
            <p style={{ marginBottom: "9px" }}>
              <strong>Election Expiration:</strong>{" "}
              {new Date(data.election.expiration).toLocaleString()}
            </p>
          )}
          {data.election.attachmentUrl && (
            <p style={{ marginBottom: "9px" }}>
              <a href={data.election.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: colors.primary, textDecoration: "underline" }}>
                📎 View Attachment
              </a>
            </p>
          )}

          {/* Pie chart votes */}
          <div style={{ width: "340px", margin: "0 auto" }}>
            <Pie data={chartData} />
          </div>

          <h4 style={{ margin: "28px 0 8px 0", color: colors.success }}>Vote Tally</h4>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {data.election.candidates.map(c => (
              <li key={c.id} style={tallyItemStyle}>
                <strong>{c.name}</strong>: <span style={{ color: colors.primary, fontWeight: "bold" }}>{data.results[c.id] || 0}</span> votes
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={() => navigate("/dashboard")}
        style={btnStyle}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default Results;
