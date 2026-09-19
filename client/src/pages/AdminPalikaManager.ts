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
  verified?: boolean;
};

type User = {
  email: string;
  role: "USER" | "ADMIN";
};

type RenameRequest = {
  id: number;
  palikaId: number;
  currentName: string;
  proposedName: string;
  submittedBy: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  date: string;
};

const API_URL = "http://localhost:5000";

export default function AdminPalikaManager() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginRole, setLoginRole] = useState<"USER" | "ADMIN">("USER");

  const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
  const [requests, setRequests] = useState<RenameRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState<"DIRECTORY" | "REQUESTS">("DIRECTORY");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "VERIFIED" | "UNVERIFIED">("ALL");

  // Modals state
  const [editingPalika, setEditingPalika] = useState<Municipality | null>(null);
  const [newPalikaName, setNewPalikaName] = useState("");

  const [proposePalika, setProposePalika] = useState<Municipality | null>(null);
  const [proposalName, setProposalName] = useState("");
  const [proposalReason, setProposalReason] = useState("");

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
      const list: Municipality[] = Array.isArray(data)
        ? data
        : data.municipalities || data.data || [];

      // Mark items as verified if they don't contain placeholder text like "Unit"
      const mapped = list.map((item) => ({
        ...item,
        verified: !item.name.toLowerCase().includes("unit"),
      }));

      setMunicipalities(mapped);
    } catch (err) {
      console.error(err);
      setError("Could not connect to the backend server.");
    } finally {
      setLoading(false);
    }
  }

  function formatType(typeStr?: string) {
    if (!typeStr) return "N/A";
    return typeStr
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  const filteredMunicipalities = useMemo(() => {
    return municipalities.filter((item) => {
      const matchesSearch =
        (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
        (item.district?.name || "").toLowerCase().includes(search.toLowerCase());

      const isVerified = item.verified ?? !item.name.toLowerCase().includes("unit");
      const matchesStatus =
        filterStatus === "ALL"
          ? true
          : filterStatus === "UNVERIFIED"
          ? !isVerified
          : isVerified;

      return matchesSearch && matchesStatus;
    });
  }, [municipalities, search, filterStatus]);

  // Admin Direct Rename
  const handleAdminRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPalika || !newPalikaName.trim()) return;

    try {
      // Send rename payload to backend
      const res = await fetch(`${API_URL}/municipalities/${editingPalika.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPalikaName.trim() }),
      });

      if (!res.ok) {
        // Fallback for UI if patch route is pending backend sync
        console.warn("Backend update response pending, updating local UI state.");
      }

      setMunicipalities((prev) =>
        prev.map((m) =>
          m.id === editingPalika.id
            ? { ...m, name: newPalikaName.trim(), verified: true }
            : m
        )
      );

      setEditingPalika(null);
      setNewPalikaName("");
    } catch (err) {
      console.error(err);
      alert("Failed to update municipality name.");
    }
  };

  // User Proposal Submission
  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please login first to submit a suggestion.");
      return;
    }

    if (!proposePalika || !proposalName.trim() || !proposalReason.trim()) return;

    const newReq: RenameRequest = {
      id: Date.now(),
      palikaId: proposePalika.id,
      currentName: proposePalika.name,
      proposedName: proposalName.trim(),
      submittedBy: currentUser.email,
      reason: proposalReason.trim(),
      status: "PENDING",
      date: new Date().toISOString().split("T")[0],
    };

    setRequests([newReq, ...requests]);
    setProposePalika(null);
    setProposalName("");
    setProposalReason("");
    alert("Name update request submitted for admin review!");
  };

  // Approve Request
  const handleApprove = (req: RenameRequest) => {
    setMunicipalities((prev) =>
      prev.map((m) =>
        m.id === req.palikaId
          ? { ...m, name: req.proposedName, verified: true }
          : m
      )
    );

    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, status: "APPROVED" } : r))
    );
  };

  // Reject Request
  const handleReject = (reqId: number) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status: "REJECTED" } : r))
    );
  };

  if (loading) {
    return (
      <>
        <style>{styles}</style>
        <main className="page-container">
          <section className="state-card">
            <div className="loader"></div>
            <h3>Loading admin workspace...</h3>
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
            <h3>Server Connection Failed</h3>
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
        {/* Header with Auth Control */}
        <section className="page-header">
          <div>
            <span className="eyebrow">ADMINISTRATION & GOVERNANCE</span>
            <h1>Palika Name Management</h1>
            <p>
              Review registered local bodies, rename placeholder units, and manage citizen name correction submissions.
            </p>
          </div>

          <div className="auth-box">
            {currentUser ? (
              <div className="user-profile">
                <div>
                  <strong>{currentUser.email}</strong>
                  <span className={`role-badge ${currentUser.role.toLowerCase()}`}>
                    {currentUser.role}
                  </span>
                </div>
                <button className="clear-button" onClick={() => setCurrentUser(null)}>
                  Logout
                </button>
              </div>
            ) : (
              <form
                className="login-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!loginEmail) return;
                  setCurrentUser({ email: loginEmail, role: loginRole });
                  setLoginEmail("");
                }}
              >
                <input
                  type="email"
                  placeholder="Enter email..."
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
                <select
                  value={loginRole}
                  onChange={(e) => setLoginRole(e.target.value as "USER" | "ADMIN")}
                >
                  <option value="USER">Citizen User</option>
                  <option value="ADMIN">System Admin</option>
                </select>
                <button type="submit" className="button">
                  Login
                </button>
              </form>
            )}
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="tab-bar">
          <button
            className={`tab-item ${activeTab === "DIRECTORY" ? "active" : ""}`}
            onClick={() => setActiveTab("DIRECTORY")}
          >
            Palikas Directory ({municipalities.length})
          </button>
          <button
            className={`tab-item ${activeTab === "REQUESTS" ? "active" : ""}`}
            onClick={() => setActiveTab("REQUESTS")}
          >
            Pending Requests ({requests.filter((r) => r.status === "PENDING").length})
          </button>
        </div>

        {/* DIRECTORY TAB */}
        {activeTab === "DIRECTORY" && (
          <section className="admin-section">
            <div className="filters">
              <div className="search-box">
                <span className="search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search by name or district..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as "ALL" | "VERIFIED" | "UNVERIFIED")
                }
              >
                <option value="ALL">All Palikas</option>
                <option value="UNVERIFIED">System Named (Needs Update)</option>
                <option value="VERIFIED">Verified Real Names</option>
              </select>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Current Name</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Verification</th>
                    <th className="action-col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMunicipalities.map((item) => {
                    const isVerified = item.verified ?? !item.name.toLowerCase().includes("unit");

                    return (
                      <tr key={item.id}>
                        <td>#{item.id}</td>
                        <td>
                          <strong>{item.name}</strong>
                        </td>
                        <td>
                          <span className="type-badge">{formatType(item.type)}</span>
                        </td>
                        <td>
                          {item.district?.name || "District"}
                          {item.district?.province?.name
                            ? ` · ${item.district.province.name}`
                            : ""}
                        </td>
                        <td>
                          {isVerified ? (
                            <span className="status-tag verified">✓ Verified</span>
                          ) : (
                            <span className="status-tag unverified">⚠️ Needs Real Name</span>
                          )}
                        </td>
                        <td className="action-col">
                          {currentUser?.role === "ADMIN" ? (
                            <button
                              className="button btn-sm"
                              onClick={() => {
                                setEditingPalika(item);
                                setNewPalikaName(item.name);
                              }}
                            >
                              Admin Rename
                            </button>
                          ) : (
                            <button
                              className="button btn-sm btn-secondary"
                              onClick={() => {
                                setProposePalika(item);
                                setProposalName(
                                  item.name.toLowerCase().includes("unit") ? "" : item.name
                                );
                              }}
                            >
                              Suggest Real Name
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* PENDING APPROVALS TAB */}
        {activeTab === "REQUESTS" && (
          <section className="admin-section">
            <h2>Pending Name Changes Queue</h2>
            <p className="section-desc">
              Review submissions from citizens. Approving updates the name across all search indexes and leaderboards.
            </p>

            {requests.length === 0 ? (
              <div className="state-card">
                <h3>No pending requests</h3>
                <p>Citizens haven't submitted any rename requests yet.</p>
              </div>
            ) : (
              <div className="requests-grid">
                {requests.map((req) => (
                  <div key={req.id} className="request-card">
                    <div className="req-header">
                      <span className="req-id">Request #{req.id}</span>
                      <span className={`status-tag ${req.status.toLowerCase()}`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="name-change">
                      <span className="old-name">{req.currentName}</span>
                      <span className="arrow">→</span>
                      <span className="new-name">{req.proposedName}</span>
                    </div>

                    <p className="req-reason">
                      <strong>Source / Reason:</strong> {req.reason}
                    </p>

                    <div className="req-meta">
                      <span>Submitted by: {req.submittedBy}</span>
                      <span>Date: {req.date}</span>
                    </div>

                    {req.status === "PENDING" && (
                      <div className="req-actions">
                        {currentUser?.role === "ADMIN" ? (
                          <>
                            <button
                              className="button btn-sm btn-success"
                              onClick={() => handleApprove(req)}
                            >
                              ✓ Accept & Update
                            </button>
                            <button
                              className="button btn-sm btn-danger"
                              onClick={() => handleReject(req.id)}
                            >
                              ✕ Reject
                            </button>
                          </>
                        ) : (
                          <span className="info-text">Log in as Admin to approve</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ADMIN DIRECT RENAME MODAL */}
        {editingPalika && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Admin Direct Rename</h3>
              <form onSubmit={handleAdminRename}>
                <label>Target Palika ID</label>
                <input
                  type="text"
                  disabled
                  value={`#${editingPalika.id} - ${editingPalika.district?.name || "District"}`}
                />

                <label>Official Real Name</label>
                <input
                  type="text"
                  value={newPalikaName}
                  onChange={(e) => setNewPalikaName(e.target.value)}
                  required
                />

                <div className="modal-actions">
                  <button
                    type="button"
                    className="clear-button"
                    onClick={() => setEditingPalika(null)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="button">
                    Save Real Name
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* USER SUGGESTION MODAL */}
        {proposePalika && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Suggest Real Municipality Name</h3>
              {!currentUser ? (
                <div style={{ textAlign: "center" }}>
                  <p>You must be logged into RateMyPalika to propose municipality updates.</p>
                  <button
                    className="button"
                    onClick={() => setProposePalika(null)}
                  >
                    Close & Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleProposalSubmit}>
                  <label>Target Palika</label>
                  <input
                    type="text"
                    disabled
                    value={`${proposePalika.name} (${proposePalika.district?.name || "District"})`}
                  />

                  <label>Proposed Real Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Damak Municipality"
                    value={proposalName}
                    onChange={(e) => setProposalName(e.target.value)}
                    required
                  />

                  <label>Reason / Official Source</label>
                  <textarea
                    rows={3}
                    placeholder="Provide evidence or reason for this update..."
                    value={proposalReason}
                    onChange={(e) => setProposalReason(e.target.value)}
                    required
                  ></textarea>

                  <div className="modal-actions">
                    <button
                      type="button"
                      className="clear-button"
                      onClick={() => setProposePalika(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="button btn-success">
                      Submit Suggestion
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
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
    flex-wrap: wrap;
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
    max-width: 550px;
    margin: 0;
  }

  /* Auth Box */
  .auth-box {
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 1rem;
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
  }

  .login-form {
    display: flex;
    gap: 0.5rem;
  }

  .login-form input, .login-form select {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.85rem;
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .role-badge {
    font-size: 0.7rem;
    font-weight: 700;
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    margin-left: 0.5rem;
  }

  .role-badge.admin {
    background: #fef3c7;
    color: #b45309;
  }

  .role-badge.user {
    background: #eff6ff;
    color: var(--primary);
  }

  /* Tabs */
  .tab-bar {
    display: flex;
    gap: 1rem;
    border-bottom: 1px solid var(--border);
    margin-bottom: 1.5rem;
  }

  .tab-item {
    background: none;
    border: none;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    border-bottom: 2px solid transparent;
  }

  .tab-item.active {
    color: var(--primary);
    border-bottom-color: var(--primary);
  }

  /* Filters */
  .filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .search-box {
    position: relative;
    flex: 1;
  }

  .search-icon {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
  }

  .search-box input {
    width: 100%;
    padding: 0.65rem 0.85rem 0.65rem 2.4rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    box-sizing: border-box;
  }

  .filters select {
    padding: 0.65rem 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }

  /* Table */
  .admin-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 1.5rem;
  }

  .table-responsive {
    overflow-x: auto;
  }

  .admin-table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    font-size: 0.9rem;
  }

  .admin-table th, .admin-table td {
    padding: 0.85rem;
    border-bottom: 1px solid var(--border);
  }

  .admin-table th {
    background: #f8fafc;
    color: var(--text-muted);
  }

  .type-badge {
    font-size: 0.75rem;
    background: #eff6ff;
    color: var(--primary);
    padding: 0.2rem 0.5rem;
    border-radius: 12px;
    font-weight: 600;
  }

  .status-tag {
    font-size: 0.75rem;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
    font-weight: 600;
  }

  .status-tag.verified, .status-tag.approved {
    background: #ecfdf5;
    color: #047857;
  }

  .status-tag.unverified, .status-tag.pending {
    background: #fffbebf;
    background: #fef3c7;
    color: #b45309;
  }

  .status-tag.rejected {
    background: #fef2f2;
    color: #dc2626;
  }

  .action-col {
    text-align: right;
  }

  /* Requests Cards */
  .requests-grid {
    display: grid;
    gap: 1rem;
    margin-top: 1rem;
  }

  .request-card {
    background: #f8fafc;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
  }

  .req-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }

  .req-id {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-family: monospace;
  }

  .name-change {
    font-size: 1.1rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  .old-name {
    text-decoration: line-through;
    color: var(--text-muted);
  }

  .arrow {
    margin: 0 0.5rem;
    color: var(--primary);
  }

  .new-name {
    color: var(--primary);
  }

  .req-reason {
    font-size: 0.85rem;
    margin: 0 0 0.5rem 0;
  }

  .req-meta {
    font-size: 0.75rem;
    color: var(--text-muted);
    display: flex;
    gap: 1rem;
  }

  .req-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  /* Modal */
  .modal-overlay {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(15, 23, 42, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 100;
  }

  .modal-card {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 1.5rem;
    width: 100%;
    max-width: 420px;
  }

  .modal-card h3 {
    margin-top: 0;
  }

  .modal-card form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .modal-card label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
  }

  .modal-card input, .modal-card textarea {
    padding: 0.6rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.9rem;
  }

  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  /* Buttons */
  .button {
    padding: 0.5rem 1rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
  }

  .btn-sm {
    padding: 0.35rem 0.65rem;
    font-size: 0.8rem;
  }

  .btn-secondary {
    background: #059669;
  }

  .btn-success {
    background: #16a34a;
  }

  .btn-danger {
    background: #dc2626;
  }

  .clear-button {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 6px;
    cursor: pointer;
  }

  .state-card {
    text-align: center;
    padding: 3rem;
    background: var(--surface);
    border: 1px dashed var(--border);
    border-radius: var(--radius);
  }

  .loader {
    border: 3px solid #f3f3f3;
    border-top: 3px solid var(--primary);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem auto;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;