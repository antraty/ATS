import { useEffect, useState } from "react";
import { fetchAllApplications, updateApplicationStatus } from "../api/client";

// Les 4 colonnes du pipeline de recrutement, dans l'ordre naturel
// du parcours d'une candidature.
const COLUMNS = [
  { status: "recue", label: "Reçues" },
  { status: "en_cours", label: "En cours" },
  { status: "acceptee", label: "Acceptées" },
  { status: "refusee", label: "Refusées" },
];

export default function RecruiterDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetchAllApplications()
      .then((data) => {
        setApplications(data);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleStatusChange(applicationId, newStatus) {
    // Mise à jour optimiste : on change l'affichage tout de suite,
    // puis on confirme auprès du serveur (et on annule si ça échoue).
    const previous = applications;
    setApplications((apps) =>
      apps.map((a) => (a.id === applicationId ? { ...a, status: newStatus } : a))
    );
    try {
      await updateApplicationStatus(applicationId, newStatus);
    } catch (err) {
      setApplications(previous);
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <div className="dashboard-header">
        <div>
          <h1 style={{ fontSize: 30 }}>Suivi des candidatures</h1>
          <p style={{ color: "var(--ink-soft)", marginTop: 6 }}>
            Vue d'ensemble du pipeline de recrutement, toutes offres confondues.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginTop: 24 }}>{error}</div>}

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <div className="pipeline">
          {COLUMNS.map((col) => {
            const items = applications.filter((a) => a.status === col.status);
            return (
              <div className="pipeline-column" key={col.status}>
                <h2>
                  {col.label} <span className="pipeline-count">({items.length})</span>
                </h2>

                {items.map((app) => (
                  <div className="candidate-card" key={app.id}>
                    <div className="name">{app.candidate_name}</div>
                    <div className="job">
                      {app.job_title}, {app.job_company}
                    </div>
                    <div className="email">{app.candidate_email}</div>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                    >
                      {COLUMNS.map((c) => (
                        <option key={c.status} value={c.status}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
