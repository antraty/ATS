import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  fetchJob,
  deleteJob,
  applyToJob,
  fetchApplicationsForJob,
} from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    candidate_name: "",
    candidate_email: "",
    cover_letter: "",
  });
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function loadData() {
    setLoading(true);
    Promise.all([fetchJob(id), user?.role === "recruiter" ? fetchApplicationsForJob(id) : Promise.resolve([])])
      .then(([jobData, applicationsData]) => {
        setJob(jobData);
        setApplications(applicationsData);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadData, [id, user?.role]);

  async function handleApply(e) {
    e.preventDefault();
    setApplyError("");
    setApplySuccess(false);
    setSubmitting(true);
    try {
      await applyToJob(id, form);
      setForm({ candidate_name: "", candidate_email: "", cover_letter: "" });
      setApplySuccess(true);
      loadData(); // rafraîchit la liste des candidatures affichée à droite
    } catch (err) {
      setApplyError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Supprimer définitivement cette offre et ses candidatures ?")) return;
    await deleteJob(id);
    navigate("/");
  }

  if (loading) return <div className="page loading">Chargement...</div>;
  if (error) return <div className="page"><div className="alert alert-error">{error}</div></div>;
  if (!job) return null;

  const skills = (job.skills || "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="page">
      <div className="job-detail-header">
        <h1>{job.title}</h1>
        <div className="meta">
          {job.company} — {job.location} — {job.contract}
          {job.salary ? ` — ${job.salary}` : ""}
        </div>

        <div className="job-actions">
          {user?.role === "recruiter" && <Link to={`/offres/${job.id}/modifier`} className="btn btn-ghost">
            Modifier l'offre
          </Link>}
          {user?.role === "recruiter" && <button className="btn btn-danger" onClick={handleDelete}>
            Supprimer
          </button>}
        </div>
      </div>

      <div className="job-detail-body">
        <div>
          <p className="description">{job.description}</p>

          {skills.length > 0 && (
            <div className="skill-tags">
              {skills.map((skill) => (
                <span className="skill-tag" key={skill}>
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          {user?.role === "candidate" ? <div className="side-panel">
            <h3>Postuler à cette offre</h3>

            {applySuccess && (
              <div className="alert alert-success">
                Candidature envoyée. Bonne chance !
              </div>
            )}
            {applyError && <div className="alert alert-error">{applyError}</div>}

            <form onSubmit={handleApply}>
              <div className="form-field">
                <label htmlFor="candidate_name">Nom complet</label>
                <input id="candidate_name" type="text" value={user.name} readOnly />
              </div>
              <div className="form-field">
                <label htmlFor="candidate_email">Email</label>
                <input id="candidate_email" type="email" value={user.email} readOnly />
              </div>
              <div className="form-field">
                <label htmlFor="cover_letter">Message de motivation</label>
                <textarea
                  id="cover_letter"
                  value={form.cover_letter}
                  onChange={(e) => setForm({ ...form, cover_letter: e.target.value })}
                />
              </div>
              <button className="btn btn-primary" type="submit" disabled={submitting}>
                {submitting ? "Envoi..." : "Envoyer ma candidature"}
              </button>
            </form>
          </div> : <div className="side-panel recruiter-note"><h3>Prêt à postuler ?</h3><p>Connectez-vous pour envoyer votre candidature et suivre son avancement.</p><Link to="/connexion" className="btn btn-primary">Créer mon espace candidat</Link></div>}

          {user?.role === "recruiter" && <div className="side-panel" style={{ marginTop: 20 }}>
            <h3>
              Candidatures reçues{" "}
              <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>
                ({applications.length})
              </span>
            </h3>
            {applications.length === 0 ? (
              <p style={{ color: "var(--ink-soft)", fontSize: 14 }}>
                Aucune candidature pour le moment.
              </p>
            ) : (
              applications.map((app) => (
                <div className="mini-application" key={app.id}>
                  <div className="name">{app.candidate_name}</div>
                  <div className="email">{app.candidate_email}</div>
                </div>
              ))
            )}
          </div>}
        </div>
      </div>
    </div>
  );
}
