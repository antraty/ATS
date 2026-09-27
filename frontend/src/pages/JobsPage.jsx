import { useEffect, useState } from "react";
import { fetchJobs } from "../api/client";
import JobRow from "../components/JobRow";

const CONTRACTS = ["", "CDI", "CDD", "Stage", "Freelance"];

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [query, setQuery] = useState("");
  const [contract, setContract] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [company, setCompany] = useState("");
  const [sector, setSector] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [experience, setExperience] = useState("");
  const [education, setEducation] = useState("");
  const [since, setSince] = useState("");
  const [remote, setRemote] = useState(false);
  const [sort, setSort] = useState("date");
  const [order, setOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // On recharge la liste à chaque changement de recherche/filtre.
  // Un petit "debounce" évite d'appeler l'API à chaque frappe.
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      fetchJobs({ search: query, contract, city, region, company, sector, salary_min: salaryMin, salary_max: salaryMax, experience, education, since, remote, sort, order, page, limit: 10 })
        .then((result) => {
          setJobs(result.data);
          setPagination(result);
          setError("");
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, contract, city, region, company, sector, salaryMin, salaryMax, experience, education, since, remote, sort, order, page]);

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
        </div>
        <div className="job-filters">
          <select value={contract} onChange={(e) => { setContract(e.target.value); setPage(1); }} aria-label="Type de contrat">
            {CONTRACTS.map((c) => <option key={c} value={c}>{c || "Tous les contrats"}</option>)}
          </select>
          <input value={city} onChange={(e) => { setCity(e.target.value); setPage(1); }} placeholder="Ville" aria-label="Ville" />
          <input value={region} onChange={(e) => { setRegion(e.target.value); setPage(1); }} placeholder="Région" aria-label="Région" />
          <input value={company} onChange={(e) => { setCompany(e.target.value); setPage(1); }} placeholder="Entreprise" aria-label="Entreprise" />
          <input value={sector} onChange={(e) => { setSector(e.target.value); setPage(1); }} placeholder="Secteur" aria-label="Secteur" />
          <input type="number" min="0" value={salaryMin} onChange={(e) => { setSalaryMin(e.target.value); setPage(1); }} placeholder="Salaire min. (Ar)" aria-label="Salaire minimum" />
          <input type="number" min="0" value={salaryMax} onChange={(e) => { setSalaryMax(e.target.value); setPage(1); }} placeholder="Salaire max. (Ar)" aria-label="Salaire maximum" />
          <input type="number" min="0" value={experience} onChange={(e) => { setExperience(e.target.value); setPage(1); }} placeholder="Expérience max." aria-label="Expérience maximale requise" />
          <input value={education} onChange={(e) => { setEducation(e.target.value); setPage(1); }} placeholder="Niveau d’étude" aria-label="Niveau d’étude" />
          <input type="date" value={since} onChange={(e) => { setSince(e.target.value); setPage(1); }} aria-label="Publiée depuis" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Trier les offres">
            <option value="date">Plus récentes</option><option value="relevance">Pertinence</option><option value="deadline">Date limite</option>
            <option value="salary">Salaire</option><option value="title">Intitulé</option>
          </select>
          <select value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Ordre de tri">
            <option value="desc">Décroissant</option><option value="asc">Croissant</option>
          </select>
          <label className="filter-toggle"><input type="checkbox" checked={remote} onChange={(e) => { setRemote(e.target.checked); setPage(1); }} /> Télétravail</label>
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
      {!loading && pagination.total > 0 && <div className="pagination-bar">
        <span>{pagination.total} offre{pagination.total > 1 ? "s" : ""}</span>
        <div><button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>Précédent</button>
          <span>Page {pagination.current_page} / {pagination.last_page}</span>
          <button className="btn btn-ghost" disabled={page >= pagination.last_page} onClick={() => setPage(page + 1)}>Suivant</button></div>
      </div>}
    </div>
  );
}
