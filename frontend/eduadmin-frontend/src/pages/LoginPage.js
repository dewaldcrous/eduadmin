import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err) {
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Decorative background */}
      <div style={styles.bgPattern} />
      <div style={styles.bgGradient} />

      <div style={styles.container}>
        {/* Left panel - branding */}
        <div style={styles.brandPanel}>
          <div style={styles.brandContent}>
            <div style={styles.logoRow}>
              <div style={styles.logoIcon}>
                <BookOpen size={28} color="#FEF3C7" />
              </div>
              <span style={styles.logoText}>EduAdmin</span>
            </div>
            <h1 style={styles.brandTitle}>
              Focus on teaching,<br />not paperwork.
            </h1>
            <p style={styles.brandSubtitle}>
              Your single intelligent workspace for lesson planning, learner
              tracking, and school-wide analytics.
            </p>
            <div style={styles.statsRow}>
              {[
                { label: "Admin hours saved", value: "5+/week" },
                { label: "One source of truth", value: "All data" },
                { label: "Early intervention", value: "At-risk alerts" },
              ].map((stat, i) => (
                <div key={i} style={styles.stat}>
                  <div style={styles.statValue}>{stat.value}</div>
                  <div style={styles.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={styles.brandFooter}>
            <span style={styles.footerText}>Greenfield High School</span>
          </div>
        </div>

        {/* Right panel - login form */}
        <div style={styles.formPanel}>
          <div style={styles.formContainer}>
            <div style={styles.formHeader}>
              <h2 style={styles.formTitle}>Welcome back</h2>
              <p style={styles.formSubtitle}>Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
              {error && (
                <div style={styles.errorBox}>
                  <span>{error}</span>
                </div>
              )}

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. t.williams"
                  style={styles.input}
                  required
                  autoFocus
                />
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.passwordWrap}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    style={{ ...styles.input, paddingRight: 44 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...styles.submitBtn,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div style={styles.helpText}>
              <p>Demo accounts: <strong>t.williams</strong>, <strong>hod.naidoo</strong>, <strong>principal.mokoena</strong></p>
              <p>Password: <strong>EduAdmin2026!</strong></p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { outline: none; border-color: var(--color-accent) !important; box-shadow: var(--shadow-glow) !important; }
        button[type="submit"]:hover:not(:disabled) { background: var(--color-accent-dark) !important; transform: translateY(-1px); }
        button[type="submit"] { transition: all 0.2s ease; }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    background: "var(--color-bg)",
    padding: "var(--space-md)",
  },
  bgPattern: {
    position: "absolute",
    inset: 0,
    backgroundImage: `radial-gradient(circle at 1px 1px, rgba(15,23,42,0.03) 1px, transparent 0)`,
    backgroundSize: "32px 32px",
  },
  bgGradient: {
    position: "absolute",
    top: "-40%",
    right: "-20%",
    width: "70%",
    height: "120%",
    background: "radial-gradient(ellipse, rgba(217,119,6,0.06) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  container: {
    display: "flex",
    width: "100%",
    maxWidth: 960,
    minHeight: 580,
    background: "var(--color-surface)",
    borderRadius: "var(--radius-xl)",
    overflow: "hidden",
    boxShadow: "var(--shadow-lg)",
    animation: "fadeInUp 0.6s ease-out",
    position: "relative",
    zIndex: 1,
  },
  brandPanel: {
    flex: "1 1 45%",
    background: "var(--color-navy)",
    padding: "var(--space-2xl)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    position: "relative",
    overflow: "hidden",
  },
  brandContent: {
    position: "relative",
    zIndex: 1,
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    gap: "var(--space-sm)",
    marginBottom: "var(--space-2xl)",
  },
  logoIcon: {
    width: 48,
    height: 48,
    borderRadius: "var(--radius-md)",
    background: "rgba(217, 119, 6, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: "var(--font-display)",
    fontSize: 22,
    fontWeight: 700,
    color: "#FEF3C7",
    letterSpacing: "-0.02em",
  },
  brandTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 32,
    fontWeight: 600,
    color: "#FFFFFF",
    lineHeight: 1.2,
    marginBottom: "var(--space-md)",
    letterSpacing: "-0.02em",
  },
  brandSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.6,
    marginBottom: "var(--space-2xl)",
  },
  statsRow: {
    display: "flex",
    gap: "var(--space-lg)",
  },
  stat: {
    flex: 1,
  },
  statValue: {
    fontFamily: "var(--font-display)",
    fontSize: 16,
    fontWeight: 600,
    color: "#FEF3C7",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
  },
  brandFooter: {
    position: "relative",
    zIndex: 1,
  },
  footerText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
  },
  formPanel: {
    flex: "1 1 55%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "var(--space-2xl)",
  },
  formContainer: {
    width: "100%",
    maxWidth: 360,
  },
  formHeader: {
    marginBottom: "var(--space-xl)",
  },
  formTitle: {
    fontFamily: "var(--font-display)",
    fontSize: 26,
    fontWeight: 600,
    color: "var(--color-navy)",
    letterSpacing: "-0.02em",
    marginBottom: "var(--space-xs)",
  },
  formSubtitle: {
    fontSize: 15,
    color: "var(--color-slate)",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-md)",
  },
  errorBox: {
    background: "var(--color-danger-light)",
    color: "var(--color-danger)",
    padding: "var(--space-sm) var(--space-md)",
    borderRadius: "var(--radius-sm)",
    fontSize: 14,
    border: "1px solid rgba(220, 38, 38, 0.15)",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-xs)",
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "var(--color-slate)",
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    fontSize: 15,
    fontFamily: "var(--font-body)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "var(--radius-md)",
    background: "var(--color-surface)",
    color: "var(--color-navy)",
    transition: "border 0.2s, box-shadow 0.2s",
  },
  passwordWrap: {
    position: "relative",
  },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    color: "var(--color-slate-light)",
    cursor: "pointer",
    padding: 4,
  },
  submitBtn: {
    width: "100%",
    padding: "13px",
    fontSize: 15,
    fontWeight: 600,
    fontFamily: "var(--font-body)",
    background: "var(--color-accent)",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "var(--radius-md)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: "var(--space-sm)",
  },
  helpText: {
    marginTop: "var(--space-lg)",
    padding: "var(--space-md)",
    background: "var(--color-surface-alt)",
    borderRadius: "var(--radius-md)",
    fontSize: 13,
    color: "var(--color-slate)",
    lineHeight: 1.7,
    textAlign: "center",
  },
};
