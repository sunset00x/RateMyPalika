import React, {
  useEffect,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000";

type Stats = {
  provinces: number;
  districts: number;
  municipalities: number;
  wards: number;
  projects: number;
  budgets: number;
  reports: number;
};

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] =
    useState<Stats | null>(null);

  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem(
    "ratemypalika_admin_token"
  );

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    loadStats();
  }, []);

  async function loadStats() {
    try {
      const response = await fetch(
        `${API_URL}/admin/stats`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();

      setStats(data.stats);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem(
      "ratemypalika_admin_token"
    );

    localStorage.removeItem(
      "ratemypalika_admin_user"
    );

    navigate("/admin/login");
  }

  const user = JSON.parse(
    localStorage.getItem(
      "ratemypalika_admin_user"
    ) || "{}"
  );

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <span className="eyebrow">
            RATEMYPALIKA ADMIN
          </span>

          <h1>Dashboard</h1>

          <p>
            Manage civic information and municipality
            data.
          </p>
        </div>

        <div className="admin-user">
          <span>
            {user.name || "Administrator"}
          </span>

          <button
            className="clear-button"
            onClick={logout}
          >
            Logout
          </button>
        </div>
      </header>

      {loading ? (
        <section className="state-card">
          <div className="loader"></div>
          <h3>Loading dashboard...</h3>
        </section>
      ) : (
        <>
          <section className="admin-stats">
            <div className="admin-stat">
              <span>Provinces</span>
              <strong>{stats?.provinces || 0}</strong>
            </div>

            <div className="admin-stat">
              <span>Districts</span>
              <strong>{stats?.districts || 0}</strong>
            </div>

            <div className="admin-stat">
              <span>Municipalities</span>
              <strong>
                {stats?.municipalities || 0}
              </strong>
            </div>

            <div className="admin-stat">
              <span>Wards</span>
              <strong>{stats?.wards || 0}</strong>
            </div>

            <div className="admin-stat">
              <span>Projects</span>
              <strong>{stats?.projects || 0}</strong>
            </div>

            <div className="admin-stat">
              <span>Reports</span>
              <strong>{stats?.reports || 0}</strong>
            </div>
          </section>

          <section className="admin-actions">
            <div>
              <span className="eyebrow">
                DATA MANAGEMENT
              </span>

              <h2>Manage RateMyPalika</h2>

              <p>
                Edit municipality information and
                maintain the public civic database.
              </p>
            </div>

            <Link
              to="/admin/municipalities"
              className="button"
            >
              Manage Municipalities →
            </Link>
          </section>
        </>
      )}
    </main>
  );
}