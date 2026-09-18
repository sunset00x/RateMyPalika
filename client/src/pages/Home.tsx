import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <main className="hero">
      <span>NEPAL CIVIC TRANSPARENCY</span>

      <h1>
        Measure.
        <br />
        Compare.
        <br />
        <b>Improve.</b>
      </h1>

      <p>
        Explore municipality performance, public projects, budgets and citizen
        reports.
      </p>

      <Link className="button" to="/municipalities">
        Explore Municipalities
      </Link>
    </main>
  );
}