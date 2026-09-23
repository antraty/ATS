// api/client.js
// ------------------------------------------------------------------
// Petit client HTTP "maison" : toutes les pages passent par ces
// fonctions pour parler à l'API, au lieu d'écrire fetch() partout.
// Cela centralise l'URL de base et la gestion des erreurs.
// ------------------------------------------------------------------

const BASE_URL = "http://localhost:4000/api";

// Fonction générique utilisée par toutes les autres.
// Elle lève une erreur JS si la réponse HTTP n'est pas OK (status >= 400),
// pour que les pages puissent l'attraper avec un simple try/catch.
async function request(path, options = {}) {
  const token = localStorage.getItem("recrute_token");
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Erreur ${response.status}`);
  }

  // Les réponses 204 (suppression réussie) n'ont pas de corps JSON
  if (response.status === 204) return null;
  return response.json();
}

export function login(data) {
  return request("/auth/login", { method: "POST", body: JSON.stringify(data) });
}

export function register(data) {
  return request("/auth/register", { method: "POST", body: JSON.stringify(data) });
}

export function fetchMyApplications() {
  return request("/applications/mine");
}

// --------------------- Offres d'emploi ---------------------

export function fetchJobs({ q = "", contract = "" } = {}) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (contract) params.set("contract", contract);
  const query = params.toString();
  return request(`/jobs${query ? `?${query}` : ""}`);
}

export function fetchJob(id) {
  return request(`/jobs/${id}`);
}

export function createJob(data) {
  return request(`/jobs`, { method: "POST", body: JSON.stringify(data) });
}

export function updateJob(id, data) {
  return request(`/jobs/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export function deleteJob(id) {
  return request(`/jobs/${id}`, { method: "DELETE" });
}

// --------------------- Candidatures ---------------------

export function fetchApplicationsForJob(jobId) {
  return request(`/jobs/${jobId}/applications`);
}

export function applyToJob(jobId, data) {
  return request(`/jobs/${jobId}/applications`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function fetchAllApplications({ status = "" } = {}) {
  const query = status ? `?status=${status}` : "";
  return request(`/applications${query}`);
}

export function updateApplicationStatus(id, status) {
  return request(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteApplication(id) {
  return request(`/applications/${id}`, { method: "DELETE" });
}
