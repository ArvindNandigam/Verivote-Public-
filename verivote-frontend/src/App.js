import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from "react-router-dom";
import Signup from "./pages/Signup";
import ConfirmSignup from "./pages/ConfirmSignup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Results from "./pages/Results";
import ResultsAccess from "./pages/ResultsAccess";
import Vote from "./pages/Vote";
import PrivateRoute from "./components/PrivateRoute";
import Chat from "./pages/Chat";

const colors = {
  primary: "#1976d2",
  accent: "#f5f5f5",
  success: "#34a853",
  warn: "#fbbc05",
  error: "#ea4335",
};

function AppContent() {
  const isAuthenticated = !!localStorage.getItem("accessToken");
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(to right top, #e3f2fd, #fce4ec, #fffde7)",
        padding: "0",
        fontFamily: "'Segoe UI', 'Roboto', 'Arial', sans-serif",
      }}
    >
      <header
        style={{
          padding: "36px 0 12px 0",
          textAlign: "center",
          background: "linear-gradient(90deg, #1976d2 65%, #fbbc05 100%)",
          color: "#fff",
          borderBottom: "2px solid #fbbc05",
          marginBottom: "12px",
        }}
      >
        <span style={{ fontSize: "2.2rem", marginRight: "13px" }}>🗳️</span>
        <span style={{ fontWeight: "bold", fontSize: "2.3rem", letterSpacing: "2px", verticalAlign: "middle" }}>
          VeriVote App
        </span>
      </header>

      {isAuthenticated && (
        <nav
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "22px",
            padding: "17px 6px",
            background: "#f5f5f5",
            borderRadius: "9px",
            margin: "0 auto 18px auto",
            maxWidth: "590px",
            boxShadow: "0 2px 9px rgba(0,0,0,0.09)",
            fontWeight: "500",
            alignItems: "center",
          }}
        >
          <NavLink to="/dashboard" label="Dashboard" />
          <NavLink to="/results" label="Results" />
          <NavLink to="/vote" label="Vote" />
          <NavLink to="/chat" label="Chatbot" />
          <button
            style={{
              marginLeft: "14px",
              background: colors.error,
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              padding: "8px 18px",
              fontWeight: "bold",
              fontSize: "1.01rem",
              boxShadow: "0 2px 8px rgba(0,0,0,0.07)",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onClick={() => {
              localStorage.clear();
              navigate("/login");
            }}
            title="Logout"
          >
            Logout
          </button>
        </nav>
      )}

      {/* Content Card */}
      <div
        style={{
          maxWidth: "650px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "14px",
          boxShadow: "0 6px 28px 2px rgba(25, 118, 210, 0.13)",
          padding: "32px 18px",
          minHeight: "66vh",
        }}
      >
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Signup />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/confirm" element={<ConfirmSignup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat" element={<Chat />} />

          {/* Private routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/results"
            element={
              <PrivateRoute>
                <ResultsAccess />
              </PrivateRoute>
            }
          />
          <Route
            path="/results/:code"
            element={
              <PrivateRoute>
                <Results />
              </PrivateRoute>
            }
          />
          <Route
            path="/vote"
            element={
              <PrivateRoute>
                <Vote />
              </PrivateRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Login />} />
        </Routes>
      </div>

      <footer
        style={{
          textAlign: "center",
          fontSize: "1.07rem",
          color: "#555",
          margin: "33px 0 12px 0",
        }}
      >
        <span style={{ marginRight: "6px" }}>© {new Date().getFullYear()} VeriVote |</span>
        <a
          href="https://github.com/ArvindNandigam/VeriVote-Cloud-blockchain-web-based-e-polling"
          target="_blank"
          rel="noreferrer"
          style={{ color: colors.primary, textDecoration: "underline" }}
        >
          Source & Info
        </a>
      </footer>
    </div>
  );
}

function NavLink({ to, label }) {
  return (
    <Link
      to={to}
      style={{
        color: colors.primary,
        padding: "7px 14px",
        borderRadius: "6px",
        background: "#fff",
        boxShadow: "0 1px 6px rgba(25,118,210,.09)",
        transition: "background 0.21s, color 0.21s",
        textDecoration: "none",
        fontWeight: "bold",
        fontSize: "1.02rem",
      }}
      onMouseEnter={e => (e.target.style.background = "#e3f2fd")}
      onMouseLeave={e => (e.target.style.background = "#fff")}
    >
      {label}
    </Link>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
