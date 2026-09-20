import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState(
    "admin@ratemypalika.local"
  );

  const [password, setPassword] = useState(
    "ChangeMe123!"
  );

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: React.FormEvent
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }

      localStorage.setItem(
        "ratemypalika_admin_token",
        data.token
      );

      localStorage.setItem(
        "ratemypalika_admin_user",
        JSON.stringify(data.user)
      );

      navigate("/admin");
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Login failed"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-card">
        <div className="admin-logo">
          RM
        </div>

        <span className="eyebrow">
          RATEMYPALIKA ADMIN
        </span>

        <h1>Admin Login</h1>

        <p>
          Sign in to manage municipality information
          and civic data.
        </p>

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <label>
            Email

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />
          </label>

          <button
            className="button admin-submit"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>
        </form>

        <small>
          Authorized administrators only.
        </small>
      </div>
    </main>
  );
}