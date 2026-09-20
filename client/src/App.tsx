import React from "react";

import {
  BrowserRouter,
  Link,
  Route,
  Routes,
} from "react-router-dom";

import Home from "./pages/Home";
import Municipalities from "./pages/Municipalities";
import Detail from "./pages/MunicipalityDetail";
import Compare from "./pages/Compare";
import Rankings from "./pages/Rankings";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminMunicipalities from "./pages/AdminMunicipalities";

export default function App() {
  return (
    <BrowserRouter>
      <header>
        <Link
          to="/"
          className="brand"
        >
          RateMyPalika
        </Link>

        <nav>
          <Link to="/municipalities">
            Municipalities
          </Link>

          <Link to="/compare">
            Compare
          </Link>

          <Link to="/rankings">
            Rankings
          </Link>

          <Link
            to="/admin/login"
            className="admin-nav"
          >
            Admin
          </Link>
        </nav>
      </header>

      <Routes>
        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/municipalities"
          element={<Municipalities />}
        />

        <Route
          path="/municipalities/:id"
          element={<Detail />}
        />

        <Route
          path="/compare"
          element={<Compare />}
        />

        <Route
          path="/rankings"
          element={<Rankings />}
        />

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/admin/municipalities"
          element={<AdminMunicipalities />}
        />
      </Routes>
    </BrowserRouter>
  );
}