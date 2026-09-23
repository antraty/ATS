import { useEffect, useState } from "react";
import { fetchJobs } from "../api/client";
import JobRow from "../components/JobRow";

const CONTRACTS = ["", "CDI", "CDD", "Stage", "Freelance"];

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState("");
  const [contract, setContract] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // On recharge la liste à chaque changement de recherche/filtre.
  // Un petit "debounce" évite d'appeler l'API à chaque frappe.
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetchJobs({ q: query, contract })
        .then((data) => {
          setJobs(data);
          setError("");
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, contract]);

  return (
    <div className="page">
      <section className="hero">
        <h1>Trouvez votre prochaine mission.</h1>
        <p>
          Des offres publiées directement par les entreprises qui recrutent — recherchez
          par mot-clé, filtrez par type de contrat, et postulez en quelques secondes.
        </p>

        <div className="search-row">
          <input
            type="text"
            placeholder="Rechercher un poste, une compétence, une entreprise..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <select value={contract} onChange={(e) => setContract(e.target.value)}>
            {CONTRACTS.map((c) => (
              <option key={c} value={c}>
                {c === "" ? "Tous les contrats" : c}
              </option>
            ))}
          </select>
        </div>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Chargement des offres...</div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          Aucune offre ne correspond à votre recherche pour le moment.
        </div>
      ) : (
        <div className="job-list">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
