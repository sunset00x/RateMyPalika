import React, { useEffect, useMemo, useState } from "react";

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

export default function Compare() {
  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadMunicipalities();
  }, []);

  async function loadMunicipalities() {
    try {
      setLoading(true);

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

  function toggleMunicipality(id: number) {
    setSelected((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 3) {
        alert("You can compare up to 3 municipalities.");
        return current;
      }

      return [...current, id];
    });
  }

  function getScore(municipality: Municipality) {
    return municipality.scores?.[0]?.overallScore ?? null;
  }

  const selectedMunicipalities = useMemo(() => {
    return selected
      .map((id) =>
        municipalities.find((municipality) => municipality.id === id)
      )
      .filter(Boolean) as Municipality[];
  }, [selected, municipalities]);

  const availableMunicipalities = useMemo(() => {
    return municipalities
      .filter((municipality) => {
        const value = `${municipality.name || ""} ${
          municipality.district?.name || ""
        }`.toLowerCase();

        return value.includes(search.toLowerCase());
      })
      .slice(0, 20);
  }, [municipalities, search]);

  function formatType(typeStr?: string) {
    if (!typeStr) return "N/A";
    return typeStr
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <main className="page-container">
          <section className="state-card">
            <div className="loader"></div>
            <h3>Loading comparison data...</h3>
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

            <h3>Unable to load municipalities</h3>

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
            <span className="eyebrow">MUNICIPALITY COMPARISON</span>

            <h1>Compare Palikas</h1>

            <p>
              Select municipalities and view their available public
              information side by side.
            </p>
          </div>

          <div className="header-stat">
            <strong>{selected.length}/3</strong>
            <span>Selected</span>
          </div>
        </section>

        <section className="compare-selector">
          <div className="selector-heading">
            <div>
              <h2>Select municipalities</h2>
              <p>You can compare up to three municipalities.</p>
            </div>

            {selected.length > 0 && (
              <button
                className="clear-button"
                onClick={() => setSelected([])}
              >
                Clear selection
              </button>
            )}
          </div>

          <div className="search-box">
            <span className="search-icon">⌕</span>

            <input
              type="text"
              placeholder="Search municipality..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="selector-list">
            {availableMunicipalities.map((municipality) => {
              const isSelected = selected.includes(municipality.id);

              return (
                <button
                  key={municipality.id}
                  className={`selector-item ${
                    isSelected ? "selected" : ""
                  }`}
                  onClick={() => toggleMunicipality(municipality.id)}
                >
                  <div>
                    <strong>{municipality.name}</strong>

                    <span>
                      {municipality.district?.name || "District"}
                      {municipality.district?.province?.name
                        ? ` · ${municipality.district.province.name}`
                        : ""}
                    </span>
                  </div>

                  <div className="selector-check">
                    {isSelected ? "✓" : "+"}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {selectedMunicipalities.length === 0 ? (
          <section className="state-card">
            <div className="state-icon">⇄</div>

            <h3>Choose municipalities to compare</h3>

            <p>
              Select two or three municipalities above to create a
              side-by-side comparison.
            </p>
          </section>
        ) : (
          <section className="comparison-section">
            <div className="comparison-header">
              <div>
                <span className="eyebrow">COMPARISON</span>
                <h2>Municipality Overview</h2>
              </div>
            </div>

            <div className="comparison-table-wrapper">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Metric</th>

                    {selectedMunicipalities.map((municipality) => (
                      <th key={municipality.id}>
                        {municipality.name}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  <tr>
                    <td>Type</td>

                    {selectedMunicipalities.map((municipality) => (
                      <td key={municipality.id}>
                        {formatType(municipality.type)}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>Province</td>

                    {selectedMunicipalities.map((municipality) => (
                      <td key={municipality.id}>
                        {municipality.district?.province?.name ||
                          "Not available"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>District</td>

                    {selectedMunicipalities.map((municipality) => (
                      <td key={municipality.id}>
                        {municipality.district?.name ||
                          "Not available"}
                      </td>
                    ))}
                  </tr>

                  <tr>
                    <td>Population</td>

                    {selectedMunicipalities.map((municipality) => (
                      <td key={municipality.id}>
                        {municipality.population
                          ? municipality.population.toLocaleString()
                          : "Not available"}
                      </td>
                    ))}
                  </tr>

                  <tr className="score-row">
                    <td>Overall Score</td>

                    {selectedMunicipalities.map((municipality) => {
                      const score = getScore(municipality);

                      return (
                        <td key={municipality.id}>
                          {score !== null
                            ? `${score.toFixed(1)} / 100`
                            : "No data"}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="comparison-cards">
              {selectedMunicipalities.map((municipality) => {
                const score = getScore(municipality);

                return (
                  <article
                    className="comparison-card"
                    key={municipality.id}
                  >
                    <span className="type-badge">
                      {formatType(municipality.type)}
                    </span>

                    <h3>{municipality.name}</h3>

                    <p>
                      {municipality.district?.name}
                      {municipality.district?.province?.name
                        ? `, ${municipality.district.province.name}`
                        : ""}
                    </p>

                    <div className="big-score">
                      {score !== null ? score.toFixed(1) : "—"}
                    </div>

                    <span>Overall score</span>
                  </article>
                );
              })}
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

  /* Compare Selector Section */
  .compare-selector {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: var(--shadow-sm);
  }

  .selector-heading {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .selector-heading h2 {
    font-size: 1.25rem;
    margin: 0 0 0.25rem 0;
  }

  .selector-heading p {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0;
  }

  .clear-button {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-muted);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-button:hover {
    background-color: #f1f5f9;
    color: var(--text-main);
  }

  .search-box {
    position: relative;
    margin-bottom: 1rem;
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
    background: #f8fafc;
    box-sizing: border-box;
  }

  .selector-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.75rem;
    max-height: 260px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .selector-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
  }

  .selector-item:hover {
    border-color: var(--primary);
    background: #eff6ff;
  }

  .selector-item.selected {
    border-color: var(--primary);
    background: #eff6ff;
  }

  .selector-item div {
    display: flex;
    flex-direction: column;
  }

  .selector-item strong {
    font-size: 0.9rem;
    color: var(--text-main);
  }

  .selector-item span {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .selector-check {
    font-weight: bold;
    color: var(--primary);
    font-size: 1.1rem;
  }

  /* Comparison Display Section */
  .comparison-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 2rem;
    box-shadow: var(--shadow-sm);
  }

  .comparison-header h2 {
    margin: 0.25rem 0 1.5rem 0;
    font-size: 1.5rem;
  }

  .comparison-table-wrapper {
    overflow-x: auto;
    margin-bottom: 2rem;
  }

  .comparison-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .comparison-table th,
  .comparison-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--border);
  }

  .comparison-table th {
    font-size: 1.1rem;
    font-weight: 700;
    background: #f8fafc;
  }

  .comparison-table th:first-child {
    width: 20%;
  }

  .comparison-table td:first-child {
    font-weight: 600;
    color: var(--text-muted);
  }

  .score-row td {
    font-weight: 700;
    color: var(--primary);
  }

  /* Visual Score Cards Grid */
  .comparison-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .comparison-card {
    background: #f8fafc;
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 1.25rem;
    text-align: center;
  }

  .comparison-card .type-badge {
    font-size: 0.7rem;
    font-weight: 600;
    background: #eff6ff;
    color: var(--primary);
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
  }

  .comparison-card h3 {
    margin: 0.75rem 0 0.25rem 0;
    font-size: 1.1rem;
  }

  .comparison-card p {
    font-size: 0.8rem;
    color: var(--text-muted);
    margin: 0 0 1rem 0;
  }

  .big-score {
    font-size: 2.25rem;
    font-weight: 800;
    color: var(--primary);
    line-height: 1;
  }

  .comparison-card > span {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  /* State Components */
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