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
        const value = `${municipality.name} ${
          municipality.district?.name || ""
        }`.toLowerCase();

        return value.includes(search.toLowerCase());
      })
      .slice(0, 20);
  }, [municipalities, search]);

  function formatType(type: string) {
    return type
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  if (loading) {
    return (
      <main className="page-container">
        <section className="state-card">
          <div className="loader"></div>
          <h3>Loading comparison data...</h3>
        </section>
      </main>
    );
  }

  if (error) {
    return (
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
    );
  }

  return (
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
          <span>⌕</span>

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
  );
}