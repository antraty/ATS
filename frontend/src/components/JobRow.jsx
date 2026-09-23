import { Link } from "react-router-dom";

// Une ligne de la liste d'offres. Volontairement sobre : pas de carte
// avec ombre, juste une ligne éditoriale séparée par un trait fin,
// avec une barre d'accent à gauche.
export default function JobRow({ job }) {
  const skills = (job.skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <Link to={`/offres/${job.id}`} className="job-row">
      <div className="job-row-main">
        <h3>{job.title}</h3>
        <div className="meta">
          {job.company} — {job.location}
        </div>
        {skills.length > 0 && <div className="skills">{skills.join(", ")}</div>}
      </div>
      <div className="job-row-side">
        {job.salary && <div className="salary">{job.salary}</div>}
        <span className="contract-tag">{job.contract}</span>
      </div>
    </Link>
  );
}
