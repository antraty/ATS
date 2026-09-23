import { useEffect, useState } from "react";
import { fetchMyApplications } from "../api/client";
import StatusBadge from "../components/StatusBadge";

export default function CandidateApplicationsPage() {
  const [applications, setApplications] = useState([]); const [error, setError] = useState("");
  useEffect(() => { fetchMyApplications().then(setApplications).catch((err) => setError(err.message)); }, []);
  return <div className="page"><div className="dashboard-header"><div><span className="eyebrow">MON ESPACE</span><h1>Mes candidatures</h1><p className="muted">Suivez chaque étape, sans perdre le fil.</p></div><span className="stat-pill">{applications.length} candidature{applications.length > 1 ? "s" : ""}</span></div>{error && <div className="alert alert-error">{error}</div>}{applications.length === 0 ? <div className="empty-state">Vous n'avez pas encore candidaté. Les prochaines opportunités sont juste là.</div> : <div className="application-list">{applications.map((application) => <div className="application-row" key={application.id}><div><strong>{application.job_title}</strong><p>{application.job_company}</p><small>{application.created_at}</small></div><StatusBadge status={application.status} /></div>)}</div>}</div>;
}