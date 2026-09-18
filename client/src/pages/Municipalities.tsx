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
        municipality.name.toLowerCase().includes(search.toLowerCase()) ||
        municipality.district?.name
          ?.toLowerCase()
          .includes(search.toLowerCase());

      const matchesProvince =
        province === "ALL" ||
        municipality.district?.province?.name === province;

      const matchesType =
        type === "ALL" || municipality.type === type;

      return matchesSearch && matchesProvince && matchesType;
    });
  }, [municipalities, search, province, type]);

  function formatType(type: string) {
    return type
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  function getScore(municipality: Municipality) {
    if (!municipality.scores || municipality.scores.length === 0) {
      return null;
    }

    return municipality.scores[0]?.overallScore ?? null;
  }

  return (
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
          <span>⌕</span>

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
          <option value="RURAL_MUNICIPALITY">
            Rural Municipality
          </option>
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

              <p>
                Try changing your search or filter options.
              </p>
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
  );
}