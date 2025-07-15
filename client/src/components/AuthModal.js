import React, { useState } from "react";

function AuthModal({ mode, setMode, onSubmit, error, loading }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content" style={{ maxWidth: 340 }}>
        <h3>{mode === "login" ? "Login" : "Register"}</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(username, password);
          }}
        >
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            style={{ width: "100%", marginBottom: 12 }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", marginBottom: 12 }}
            required
          />
          {error && (
            <div style={{ color: "var(--accent-error)", marginBottom: 8 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            className="place-bet-btn"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Loading..." : mode === "login" ? "Login" : "Register"}
          </button>
        </form>
        <div style={{ marginTop: 12, textAlign: "center" }}>
          {mode === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                className="tab-button"
                style={{ padding: 0 }}
                onClick={() => setMode("register")}
              >
                Register
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                className="tab-button"
                style={{ padding: 0 }}
                onClick={() => setMode("login")}
              >
                Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
