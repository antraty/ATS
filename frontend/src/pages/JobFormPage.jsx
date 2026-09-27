import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createJob, fetchJob, updateJob } from "../api/client";

const EMPTY_JOB = {
  title: "",
  company: "",
  location: "",
  contract: "CDI",
  salary: "",
  description: "",
  skills: "",
  missions: "",
  city: "",
  region: "",
  sector: "",
  min_experience: 0,
  required_degree: "",
  education_level: "",
  openings: 1,
  deadline: "",
  remote: false,
  salary_min: "",
  salary_max: "",
  status: "published",
};

// Cette page sert à la fois pour CRÉER une offre (route /offres/nouvelle)
// et pour la MODIFIER (route /offres/:id/modifier). C'est le même
// formulaire ; seule la présence de `id` dans l'URL change le comportement.
export default function JobFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [job, setJob] = useState(EMPTY_JOB);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEditing) return;
    fetchJob(id)
      .then(setJob)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEditing]);

  function handleChange(field, value) {
    setJob((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const saved = isEditing ? await updateJob(id, job) : await createJob(job);
      navigate(`/offres/${saved.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page loading">Chargement...</div>;

  return (
    <div className="page">
      <div className="form-card">
        <h1 style={{ fontSize: 30, marginBottom: 28 }}>
          {isEditing ? "Modifier l'offre" : "Publier une nouvelle offre"}
        </h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="title">Intitulé du poste</label>
            <input
              id="title"
              type="text"
              required
              value={job.title}
              onChange={(e) => handleChange("title", e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="company">Entreprise</label>
              <input
                id="company"
                type="text"
                required
                value={job.company}
                onChange={(e) => handleChange("company", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="location">Lieu</label>
              <input
                id="location"
                type="text"
                required
                value={job.location}
                onChange={(e) => handleChange("location", e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label htmlFor="contract">Type de contrat</label>
              <select
                id="contract"
                value={job.contract}
                onChange={(e) => handleChange("contract", e.target.value)}
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="salary">Rémunération (facultatif)</label>
              <input
                id="salary"
                type="text"
                placeholder="Ex : 1 800 000 - 2 400 000 Ar"
                value={job.salary || ""}
                onChange={(e) => handleChange("salary", e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-field"><label htmlFor="city">Ville</label><input id="city" value={job.city || ""} onChange={(e) => handleChange("city", e.target.value)} /></div>
            <div className="form-field"><label htmlFor="region">Région</label><input id="region" value={job.region || ""} onChange={(e) => handleChange("region", e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label htmlFor="sector">Secteur</label><input id="sector" value={job.sector || ""} onChange={(e) => handleChange("sector", e.target.value)} /></div>
            <div className="form-field"><label htmlFor="openings">Nombre de postes</label><input id="openings" type="number" min="1" value={job.openings || 1} onChange={(e) => handleChange("openings", e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label htmlFor="min_experience">Expérience minimale (années)</label><input id="min_experience" type="number" min="0" step="0.5" value={job.min_experience || 0} onChange={(e) => handleChange("min_experience", e.target.value)} /></div>
            <div className="form-field"><label htmlFor="education_level">Niveau d’étude</label><input id="education_level" value={job.education_level || ""} onChange={(e) => handleChange("education_level", e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label htmlFor="required_degree">Diplôme requis</label><input id="required_degree" value={job.required_degree || ""} onChange={(e) => handleChange("required_degree", e.target.value)} /></div>
            <div className="form-field"><label htmlFor="deadline">Date limite</label><input id="deadline" type="date" value={job.deadline || ""} onChange={(e) => handleChange("deadline", e.target.value)} /></div>
          </div>
          <div className="form-row salary-range">
            <div className="form-field"><label htmlFor="salary_min">Salaire minimum (Ar)</label><input id="salary_min" type="number" min="0" value={job.salary_min || ""} onChange={(e) => handleChange("salary_min", e.target.value)} /></div>
            <div className="form-field"><label htmlFor="salary_max">Salaire maximum (Ar)</label><input id="salary_max" type="number" min="0" value={job.salary_max || ""} onChange={(e) => handleChange("salary_max", e.target.value)} /></div>
          </div>
          <label className="filter-toggle form-toggle"><input type="checkbox" checked={Boolean(job.remote)} onChange={(e) => handleChange("remote", e.target.checked)} /> Télétravail possible</label>

          <div className="form-field">
            <label htmlFor="missions">Missions principales</label>
            <textarea id="missions" rows={4} value={job.missions || ""} onChange={(e) => handleChange("missions", e.target.value)} />
          </div>

          <div className="form-field">
            <label htmlFor="description">Description du poste</label>
            <textarea
              id="description"
              required
              rows={7}
              value={job.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="skills">Compétences clés (séparées par des virgules)</label>
            <input
              id="skills"
              type="text"
              placeholder="Ex : javascript, react, sql"
              value={job.skills || ""}
              onChange={(e) => handleChange("skills", e.target.value)}
            />
          </div>

          <div className="form-actions">
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? "Enregistrement..." : isEditing ? "Enregistrer" : "Publier l'offre"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(-1)}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
