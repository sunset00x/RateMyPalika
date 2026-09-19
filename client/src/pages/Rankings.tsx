import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Municipality = {
  id: number;
  name: string;
  type: string;
  population?: number | null;
  district?: {
    name: string;
    province?: {
      name: string;
    };
  };
  scores?: {
    overallScore: number;
    year: number;
  }[];
};

const API_URL = "http://localhost:5000";

export default function Ranking() {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("ALL");
  const [type, setType] = useState("ALL");

  useEffect(() => {
    loadMunicipalities();
  }, []);

  async function loadMunicipalities() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/municipalities`);

      if (!response.ok) {
        throw new Error("Failed to load rankings data");
      }

      const data = await response.json();

      const list = Array.isArray(data)
        ? data
        : data.municipalities || data.data || [];

      setMunicipalities(list);
    } catch (err) {
      console.error(err);
      setError(
        "Could not connect to the server. Make sure your backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  function getScore(municipality: Municipality) {
    return municipality.scores?.[0]?.overallScore ?? null;
  }

  function formatType(typeStr?: string) {
    if (!typeStr) return "N/A";
    return typeStr
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  const provinces = useMemo(() => {
    const names = municipalities
      .map((m) => m.district?.province?.name)
      .filter(Boolean) as string[];

    return [...new Set(names)].sort();
  }, [municipalities]);

  // Filter and sort municipalities strictly by score descending
  const rankedMunicipalities = useMemo(() => {
    return municipalities
      .filter((municipality) => {
        const matchesSearch =
          (municipality.name || "")
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          (municipality.district?.name || "")
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesProvince =
          province === "ALL" ||
          municipality.district?.province?.name === province;

        const matchesType =
          type === "ALL" || municipality.type === type;

        return matchesSearch && matchesProvince && matchesType;
      })
      .sort((a, b) => {
        const scoreA = getScore(a) ?? -1;
        const scoreB = getScore(b) ?? -1;
        return scoreB - scoreA;
      });
  }, [municipalities, search, province, type]);

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <main className="page-container">
          <section className="state-card">
            <div className="loader"></div>
            <h3>Loading municipal rankings...</h3>
          </section>
        </main>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{styles}</style>
        <main className="page-container">
          <section className="state-card error-state">
            <div className="state-icon">!</div>
            <h3>Unable to load rankings</h3>
            <p>{error}</p>
            <button className="button" onClick={loadMunicipalities}>
              Try Again
            </button>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <main className="page-container">
        <section className="page-header">
          <div>
            <span className="eyebrow">PERFORMANCE LEADERBOARD</span>
            <h1>Palika Rankings</h1>
            <p>
              Compare performance scores and civic execution metrics of
              municipalities across Nepal.
            </p>
          </div>

          <div className="header-stat">
            <strong>{rankedMunicipalities.length}</strong>
            <span>Ranked Palikas</span>
          </div>
        </section>

        <section className="filters">
          <div className="search-box">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search municipality or district..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            value={province}
            onChange={(event) => setProvince(event.target.value)}
          >
            <option value="ALL">All Provinces</option>
            {provinces.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="ALL">All Types</option>
            <option value="METROPOLITAN">Metropolitan</option>
            <option value="SUB_METROPOLITAN">Sub-Metropolitan</option>
            <option value="MUNICIPALITY">Municipality</option>
            <option value="RURAL_MUNICIPALITY">Rural Municipality</option>
          </select>

          {(search || province !== "ALL" || type !== "ALL") && (
            <button
              className="clear-button"
              onClick={() => {
                setSearch("");
                setProvince("ALL");
                setType("ALL");
              }}
            >
              Clear filters
            </button>
          )}
        </section>

        {rankedMunicipalities.length === 0 ? (
          <section className="state-card">
            <div className="state-icon">⌕</div>
            <h3>No rankings found</h3>
            <p>Try adjusting your search query or provincial filter options.</p>
          </section>
        ) : (
          <section className="ranking-table-card">
            <div className="table-responsive">
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th className="rank-col">Rank</th>
                    <th>Municipality</th>
                    <th>Type</th>
                    <th>District / Province</th>
                    <th>Population</th>
                    <th className="score-col">Overall Score</th>
                    <th className="action-col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rankedMunicipalities.map((municipality, index) => {
                    const score = getScore(municipality);
                    const rank = index + 1;

                    return (
                      <tr key={municipality.id} className={`rank-row rank-${rank}`}>
                        <td className="rank-col">
                          <span className={`rank-badge ${rank <= 3 ? `top-${rank}` : ""}`}>
                            {rank === 1 ? "🥇 1" : rank === 2 ? "🥈 2" : rank === 3 ? "🥉 3" : `#${rank}`}
                          </span>
                        </td>
                        <td className="name-col">
                          <strong>{municipality.name}</strong>
                        </td>
                        <td>
                          <span className="type-badge">
                            {formatType(municipality.type)}
                          </span>
                        </td>
                        <td className="location-col">
                          {municipality.district?.name || "District"}
                          {municipality.district?.province?.name
                            ? ` · ${municipality.district.province.name}`
                            : ""}
                        </td>
                        <td>
                          {municipality.population
                            ? municipality.population.toLocaleString()
                            : "N/A"}
                        </td>
                        <td className="score-col">
                          <span className="score-tag">
                            {score !== null ? `${score.toFixed(1)} / 100` : "No data"}
                          </span>
                        </td>
                        <td className="action-col">
                          <Link
                            className="table-link"
                            to={`/municipalities/${municipality.id}`}
                          >
                            Details →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

const styles = `
  :root {
    --primary: #1d4ed8;
    --primary-hover: #1e40af;
    --background: #f8fafc;
    --surface: #ffffff;
    --text-main: #0f172a;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --radius: 12px;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .page-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2.5rem 1.5rem;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    color: var(--text-main);
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    gap: 2rem;
  }

  .eyebrow {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--primary);
    text-transform: uppercase;
  }

  .page-header h1 {
    font-size: 2.25rem;
    font-weight: 800;
    margin: 0.25rem 0 0.5rem 0;
  }

  .page-header p {
    color: var(--text-muted);
    font-size: 1rem;
    max-width: 600px;
    margin: 0;
    line-height: 1.5;
  }

  .header-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 1rem 1.5rem;
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
  }

  .header-stat strong {
    font-size: 2rem;
    font-weight: 800;
    color: var(--primary);
    line-height: 1;
  }

  .header-stat span {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-top: 0.25rem;
  }

  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  .search-box {
    position: relative;
    flex: 1;
    min-width: 260px;
  }

  .search-icon {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    font-size: 1.1rem;
  }

  .search-box input {
    width: 100%;
    padding: 0.65rem 0.85rem 0.65rem 2.4rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.95rem;
    outline: none;
    background: var(--surface);
    box-sizing: border-box;
  }

  .filters select {
    padding: 0.65rem 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background-color: var(--surface);
    font-size: 0.95rem;
    color: var(--text-main);
    outline: none;
    cursor: pointer;
  }

  .clear-button {
    padding: 0.65rem 1.25rem;
    background-color: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-muted);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-button:hover {
    background-color: #f1f5f9;
    color: var(--text-main);
  }

  .ranking-table-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .ranking-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.95rem;
  }

  .ranking-table th {
    background: #f8fafc;
    padding: 1rem;
    font-weight: 700;
    color: var(--text-muted);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  .ranking-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }

  .rank-row:hover {
    background-color: #f8fafc;
  }

  .rank-col {
    width: 80px;
    text-align: center;
  }

  .rank-badge {
    font-weight: 700;
    font-size: 0.9rem;
    padding: 0.35rem 0.65rem;
    border-radius: 20px;
    background: #f1f5f9;
    color: var(--text-muted);
    display: inline-block;
  }

  .rank-badge.top-1 {
    background: #fef3c7;
    color: #b45309;
  }

  .rank-badge.top-2 {
    background: #e2e8f0;
    color: #475569;
  }

  .rank-badge.top-3 {
    background: #ffedd5;
    color: #c2410c;
  }

  .name-col strong {
    font-size: 1rem;
    color: var(--text-main);
  }

  .type-badge {
    font-size: 0.75rem;
    font-weight: 600;
    background-color: #eff6ff;
    color: var(--primary);
    padding: 0.25rem 0.6rem;
    border-radius: 20px;
  }

  .location-col {
    color: var(--text-muted);
  }

  .score-col {
    font-weight: 700;
  }

  .score-tag {
    color: #047857;
    background: #ecfdf5;
    padding: 0.35rem 0.65rem;
    border-radius: 6px;
  }

  .action-col {
    text-align: right;
  }

  .table-link {
    color: var(--primary);
    font-weight: 600;
    text-decoration: none;
    font-size: 0.875rem;
  }

  .table-link:hover {
    color: var(--primary-hover);
    text-decoration: underline;
  }

  .state-card {
    text-align: center;
    padding: 4rem 2rem;
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: var(--radius);
    margin-top: 1rem;
  }

  .state-card h3 {
    margin: 1rem 0 0.5rem 0;
    font-size: 1.25rem;
  }

  .state-card p {
    color: var(--text-muted);
    margin: 0;
  }

  .state-icon {
    font-size: 2rem;
    width: 50px;
    height: 50px;
    line-height: 50px;
    background: #f1f5f9;
    border-radius: 50%;
    margin: 0 auto;
  }

  .error-state .state-icon {
    background: #fef2f2;
    color: #dc2626;
  }

  .button {
    margin-top: 1rem;
    padding: 0.6rem 1.2rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .button:hover {
    background: var(--primary-hover);
  }

  .loader {
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    width: 36px;
    height: 36px;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @media (max-width: 640px) {
    .page-header {
      flex-direction: column;
    }
    .header-stat {
      align-items: flex-start;
    }
  }
`;