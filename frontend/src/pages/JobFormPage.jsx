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
