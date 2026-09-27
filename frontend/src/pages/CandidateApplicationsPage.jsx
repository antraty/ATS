import { useEffect, useState } from "react";
import { fetchCandidateDashboard, fetchMyApplications, withdrawApplication } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyApplications().then(setApplications).catch((err) => setError(err.message));
    fetchCandidateDashboard().then(setStats).catch((err) => setError(err.message));
  }, []);

  async function withdraw(id) {
    if (!window.confirm("Retirer cette candidature ?")) return;
    try {
      const updated = await withdrawApplication(id);
      setApplications((items) => items.map((item) => item.id === id ? { ...item, status: updated.status, history: [...(item.history || []), { status: updated.status, comment: "Candidature retirée par le candidat.", created_at: new Date().toISOString() }] } : item));
      fetchCandidateDashboard().then(setStats);
    } catch (err) { setError(err.message); }
  }

  return (
    <main className="page">
      <div className="dashboard-header"><div><span className="eyebrow">MON ESPACE</span><h1>Mes candidatures</h1><p className="muted">Suivez chaque étape et retrouvez votre historique.</p></div></div>
      {stats && <div className="metric-grid candidate-metrics">
        <div><span>Candidatures</span><strong>{stats.applications.total || 0}</strong></div>
        <div><span>En attente</span><strong>{stats.applications.pending || 0}</strong></div>
        <div><span>Entretiens</span><strong>{stats.applications.interviews || 0}</strong></div>
        <div><span>Acceptées</span><strong>{stats.applications.accepted || 0}</strong></div>
        <div><span>Refusées</span><strong>{stats.applications.rejected || 0}</strong></div>
        <div><span>Offres sauvegardées</span><strong>{stats.saved_jobs || 0}</strong></div>
      </div>}
      {error && <div className="alert alert-error">{error}</div>}
      {applications.length === 0 ? <div className="empty-state">Vous n'avez pas encore candidaté. Les prochaines opportunités sont sur la page des offres.</div> :
        <div className="application-list">{applications.map((application) => <article className="candidate-application" key={application.id}>
          <div className="application-row"><div><strong>{application.job_title}</strong><p>{application.job_company}</p><small>Envoyée le {new Date(application.created_at).toLocaleDateString("fr-FR")}</small></div>
            <StatusBadge status={application.status} />
            {!["acceptee", "refusee", "archivee", "retiree"].includes(application.status) && <button className="btn btn-ghost" onClick={() => withdraw(application.id)}>Retirer</button>}
          </div>
          <ol className="application-history">{(application.history || []).map((event, index) => <li key={`${event.created_at}-${index}`}>
            <span className="history-dot" /><div><strong><StatusBadge status={event.status} /></strong>{event.comment && <p>{event.comment}</p>}<time>{new Date(event.created_at).toLocaleString("fr-FR")}</time></div>
          </li>)}</ol>
        </article>)}</div>}
    </main>
  );
}