import { useEffect, useState } from "react";
import { fetchSavedJobs, unsaveJob } from "../api/client";
import JobRow from "../components/JobRow";

export default function SavedJobsPage() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => { fetchSavedJobs().then(setJobs).catch((err) => setError(err.message)); }, []);
  async function remove(id) {
    try { await unsaveJob(id); setJobs((items) => items.filter((job) => job.id !== id)); }
    catch (err) { setError(err.message); }
  }

  return <main className="page"><div className="dashboard-header"><div><span className="eyebrow">MON ESPACE</span><h1>Offres sauvegardées</h1></div></div>
    {error && <div className="alert alert-error">{error}</div>}
    {jobs.length === 0 ? <div className="empty-state">Aucune offre sauvegardée.</div> : <div className="saved-job-list">
      {jobs.map((job) => <div className="saved-job-row" key={job.id}><JobRow job={job} /><button className="btn btn-ghost" onClick={() => remove(job.id)}>Retirer des favoris</button></div>)}
    </div>}
  </main>;
}