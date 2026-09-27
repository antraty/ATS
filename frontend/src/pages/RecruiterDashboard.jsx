import { useEffect, useState } from "react";
import { fetchAllApplications, fetchRecruiterStats, updateApplicationNote, updateApplicationStatus } from "../api/client";
import StatusBadge from "../components/StatusBadge";

const STATUSES = [
  ["recue", "Reçue"], ["cv_consulte", "CV consulté"], ["analyse", "En analyse"],
  ["preselectionnee", "Pré-sélectionnée"], ["entretien_rh", "Entretien RH"],
  ["test_technique", "Test technique"], ["entretien_final", "Entretien final"],
  ["offre_envoyee", "Offre envoyée"], ["acceptee", "Acceptée"], ["refusee", "Refusée"],
  ["retiree", "Retirée"], ["archivee", "Archivée"], ["en_cours", "En cours"],
];

export default function RecruiterDashboard() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [candidateFilters, setCandidateFilters] = useState({ experience: "", education: "", city: "", skill: "", availability: "" });
  const [error, setError] = useState("");
  const [savingNote, setSavingNote] = useState(null);

  useEffect(() => {
    fetchRecruiterStats().then(setStats).catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAllApplications({ status, search, ...candidateFilters, limit: 100 })
        .then((result) => { setApplications(result.data); setError(""); })
        .catch((err) => setError(err.message));
    }, 250);
    return () => clearTimeout(timer);
  }, [status, search, candidateFilters]);

  function updateCandidateFilter(field, value) {
    setCandidateFilters((current) => ({ ...current, [field]: value }));
  }

  async function changeStatus(applicationId, nextStatus) {
    const comment = window.prompt("Ajouter un commentaire à l’historique (facultatif) :") || "";
    try {
      await updateApplicationStatus(applicationId, nextStatus, comment);
      setApplications((items) => items.map((item) => item.id === applicationId ? { ...item, status: nextStatus } : item));
      fetchRecruiterStats().then(setStats);
    } catch (err) { setError(err.message); }
  }

  async function saveNote(applicationId, note) {
    setSavingNote(applicationId);
    try { await updateApplicationNote(applicationId, note); }
    catch (err) { setError(err.message); }
    finally { setSavingNote(null); }
  }

  return (
    <main className="page recruiter-dashboard">
      <div className="dashboard-header">
        <div><span className="eyebrow">ESPACE RECRUTEUR</span><h1>Suivi des candidatures</h1>
          <p className="muted">Toutes vos candidatures, du dépôt à la décision.</p></div>
      </div>

      {stats && <div className="metric-grid">
        <div><span>Offres actives</span><strong>{stats.jobs.active || 0}</strong></div>
        <div><span>Offres expirées</span><strong>{stats.jobs.expired || 0}</strong></div>
        <div><span>Candidatures</span><strong>{stats.applications.total || 0}</strong></div>
        <div><span>Aujourd’hui</span><strong>{stats.applications.today || 0}</strong></div>
        <div><span>Entretiens</span><strong>{stats.applications.interviews || 0}</strong></div>
        <div><span>Acceptées</span><strong>{stats.applications.accepted || 0}</strong></div>
        <div><span>Taux d’acceptation</span><strong>{stats.applications.acceptance_rate || 0}%</strong></div>
        <div><span>Délai moyen</span><strong>{stats.applications.average_days_to_hire == null ? "—" : `${Math.round(stats.applications.average_days_to_hire)} j`}</strong></div>
      </div>}

      {error && <div className="alert alert-error">{error}</div>}

      <div className="application-toolbar">
        <input type="search" placeholder="Nom, email, compétence ou n° de dossier" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input type="number" min="0" placeholder="Expérience min." aria-label="Expérience minimale" value={candidateFilters.experience} onChange={(e) => updateCandidateFilter("experience", e.target.value)} />
        <input placeholder="Diplôme" aria-label="Diplôme candidat" value={candidateFilters.education} onChange={(e) => updateCandidateFilter("education", e.target.value)} />
        <input placeholder="Ville" aria-label="Ville candidat" value={candidateFilters.city} onChange={(e) => updateCandidateFilter("city", e.target.value)} />
        <input placeholder="Compétence" aria-label="Compétence candidat" value={candidateFilters.skill} onChange={(e) => updateCandidateFilter("skill", e.target.value)} />
        <input placeholder="Disponibilité" aria-label="Disponibilité candidat" value={candidateFilters.availability} onChange={(e) => updateCandidateFilter("availability", e.target.value)} />
      </div>

      <div className="recruiter-applications">
        {applications.length === 0 ? <div className="empty-state">Aucune candidature pour ces filtres.</div> : applications.map((application) => (
          <article className="recruiter-application" key={application.id}>
            <div className="application-summary">
              <div className="candidate-identity">{application.candidate_photo_url && <img src={application.candidate_photo_url} alt="" />}<div><strong>{application.candidate_name}</strong><p>{application.candidate_email}</p></div></div>
              <div><a href={`/offres/${application.job_id}`}>{application.job_title}</a><p>{application.job_company}</p></div>
              <time>{new Date(application.created_at).toLocaleDateString("fr-FR")}</time>
              <StatusBadge status={application.status} />
            </div>
            <div className="candidate-profile-summary">
              {application.experience_years > 0 && <span>{application.experience_years} an(s) d’expérience</span>}
              {application.candidate_education && <span>{application.candidate_education}</span>}
              {application.candidate_skills && <span>{JSON.parse(application.candidate_skills || "[]").join(", ")}</span>}
            </div>
            <div className="application-management">
              {(application.cv_url || application.profile_cv_url) && <a className="text-link" href={application.cv_url || application.profile_cv_url} target="_blank" rel="noreferrer">Consulter le CV</a>}
              {application.cover_letter && <details><summary>Lettre de motivation</summary><p>{application.cover_letter}</p></details>}
              <select value={application.status} onChange={(e) => changeStatus(application.id, e.target.value)} aria-label={`Changer le statut de ${application.candidate_name}`}>
                {STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <input defaultValue={application.internal_note || ""} placeholder="Note interne" aria-label={`Note interne pour ${application.candidate_name}`} onBlur={(e) => e.target.value !== (application.internal_note || "") && saveNote(application.id, e.target.value)} />
              {savingNote === application.id && <small>Enregistrement…</small>}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}