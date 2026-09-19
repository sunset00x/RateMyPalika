import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

type Municipality = {
  id: number;
  name: string;
  type: string;
  population?: number | null;
  district?: {
    id: number;
    name: string;
    province?: {
      id: number;
      name: string;
    };
  };
  scores?: {
    overallScore: number;
    year: number;
  }[];
};

const API_URL = "http://localhost:5000";

export default function Municipalities() {
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
        throw new Error("Failed to load municipalities");
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

  const provinces = useMemo(() => {
    const names = municipalities
      .map((m) => m.district?.province?.name)
      .filter(Boolean) as string[];

    return [...new Set(names)].sort();
  }, [municipalities]);

  const filteredMunicipalities = useMemo(() => {
    return municipalities.filter((municipality) => {
      const matchesSearch =
        (municipality.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (municipality.district?.name || "")
          .toLowerCase()
          .includes(search.toLowerCase());

      const matchesProvince =
        province === "ALL" ||
        municipality.district?.province?.name === province;

      const matchesType =
        type === "ALL" || municipality.type === type;

      return matchesSearch && matchesProvince && matchesType;
    });
  }, [municipalities, search, province, type]);

  function formatType(typeStr?: string) {
    if (!typeStr) return "N/A";
    return typeStr
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getScore(municipality: Municipality) {
    if (!municipality.scores || municipality.scores.length === 0) {
      return null;
    }
    return municipality.scores[0]?.overallScore ?? null;
  }

  return (
    <>
      <style>{styles}</style>
      <main className="page-container">
        <section className="page-header">
          <div>
            <span className="eyebrow">NEPAL CIVIC DIRECTORY</span>
            <h1>Municipalities</h1>
            <p>
              Explore municipalities across Nepal and view their public
              information, performance data, projects and budgets.
            </p>
          </div>

          <div className="header-stat">
            <strong>{municipalities.length}</strong>
            <span>Municipalities</span>
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

          <button
            className="clear-button"
            onClick={() => {
              setSearch("");
              setProvince("ALL");
              setType("ALL");
            }}
          >
            Clear
          </button>
        </section>

        {loading && (
          <section className="state-card">
            <div className="loader"></div>
            <h3>Loading municipalities...</h3>
            <p>Getting data from the RateMyPalika server.</p>
          </section>
        )}

        {!loading && error && (
          <section className="state-card error-state">
            <div className="state-icon">!</div>
            <h3>Server connection failed</h3>
            <p>{error}</p>
            <button className="button" onClick={loadMunicipalities}>
              Try Again
            </button>
          </section>
        )}

        {!loading && !error && (
          <>
            <div className="results-bar">
              <span>
                Showing <strong>{filteredMunicipalities.length}</strong>{" "}
                municipalities
              </span>

              {search && <span>Search: "{search}"</span>}
            </div>

            {filteredMunicipalities.length === 0 ? (
              <section className="state-card">
                <div className="state-icon">⌕</div>
                <h3>No municipalities found</h3>
                <p>Try changing your search or filter options.</p>
              </section>
            ) : (
              <section className="municipality-grid">
                {filteredMunicipalities.map((municipality) => {
                  const score = getScore(municipality);

                  return (
                    <article
                      className="municipality-card"
                      key={municipality.id}
                    >
                      <div className="card-top">
                        <span className="type-badge">
                          {formatType(municipality.type)}
                        </span>

                        {score !== null && (
                          <span className="score-badge">
                            {score.toFixed(1)}
                          </span>
                        )}
                      </div>

                      <h2>{municipality.name}</h2>

                      <p className="location">
                        {municipality.district?.name || "District"}
                        {municipality.district?.province?.name
                          ? ` · ${municipality.district.province.name}`
                          : ""}
                      </p>

                      <div className="card-details">
                        <div>
                          <span>Population</span>
                          <strong>
                            {municipality.population
                              ? municipality.population.toLocaleString()
                              : "Not available"}
                          </strong>
                        </div>

                        <div>
                          <span>Performance</span>
                          <strong>
                            {score !== null
                              ? `${score.toFixed(1)}/100`
                              : "No data"}
                          </strong>
                        </div>
                      </div>

                      <Link
                        className="card-link"
                        to={`/municipalities/${municipality.id}`}
                      >
                        View Municipality
                        <span>→</span>
                      </Link>
                    </article>
                  );
                })}
              </section>
            )}
          </>
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
    --radius: 10px;
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.05);
  }

  .page-container {
    max-width: 1200px;
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
    border-radius: var(--radius);
    font-size: 0.95rem;
    outline: none;
    background: var(--surface);
    box-sizing: border-box;
  }

  .filters select {
    padding: 0.65rem 1rem;
    border: 1px solid var(--border);
    border-radius: var(--radius);
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
    border-radius: var(--radius);
    color: var(--text-muted);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-button:hover {
    background-color: #f1f5f9;
    color: var(--text-main);
  }

  .results-bar {
    display: flex;
    justify-content: space-between;
    font-size: 0.9rem;
    color: var(--text-muted);
    margin-bottom: 1.5rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border);
  }

  .municipality-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .municipality-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    box-shadow: var(--shadow-sm);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .municipality-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
  }

  .type-badge {
    font-size: 0.75rem;
    font-weight: 600;
    background-color: #eff6ff;
    color: var(--primary);
    padding: 0.25rem 0.6rem;
    border-radius: 20px;
  }

  .score-badge {
    font-size: 0.85rem;
    font-weight: 700;
    background-color: #ecfdf5;
    color: #047857;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
  }

  .municipality-card h2 {
    font-size: 1.35rem;
    margin: 0 0 0.25rem 0;
    font-weight: 700;
  }

  .location {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0 0 1.25rem 0;
  }

  .card-details {
    display: flex;
    justify-content: space-between;
    background: #f8fafc;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    margin-bottom: 1.25rem;
    margin-top: auto;
  }

  .card-details div {
    display: flex;
    flex-direction: column;
  }

  .card-details span {
    font-size: 0.75rem;
    color: var(--text-muted);
    margin-bottom: 0.15rem;
  }

  .card-details strong {
    font-size: 0.95rem;
  }

  .card-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-decoration: none;
    color: var(--primary);
    font-weight: 600;
    font-size: 0.95rem;
  }

  .card-link:hover {
    color: var(--primary-hover);
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
    border-radius: var(--radius);
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