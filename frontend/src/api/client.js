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

export function refreshSession() { return request("/auth/refresh", { method: "POST" }); }
export function changePassword(data) {
  return request("/auth/change-password", { method: "POST", body: JSON.stringify(data) });
}
export function deactivateAccount() { return request("/auth/deactivate", { method: "POST" }); }

export function fetchMyApplications() {
  return request("/applications/mine");
}

// --------------------- Offres d'emploi ---------------------

export function fetchJobs(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) params.set(key, value);
  });
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

export function updateJobStatus(id, action) {
  return request(`/jobs/${id}/${action}`, { method: "PATCH" });
}

export function duplicateJob(id) {
  return request(`/jobs/${id}/duplicate`, { method: "POST" });
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

export function fetchAllApplications(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) params.set(key, value);
  });
  const query = params.toString() ? `?${params}` : "";
  return request(`/applications${query}`);
}

export function updateApplicationStatus(id, status, comment = "") {
  return request(`/applications/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, comment }),
  });
}

export function deleteApplication(id) {
  return request(`/applications/${id}`, { method: "DELETE" });
}

export function fetchApplicationHistory(id) { return request(`/applications/${id}/history`); }
export function updateApplicationNote(id, note) {
  return request(`/applications/${id}/note`, { method: "PATCH", body: JSON.stringify({ note }) });
}
export function withdrawApplication(id) { return request(`/applications/${id}/withdraw`, { method: "PATCH" }); }
export function fetchRecruiterStats() { return request("/applications/stats"); }
export function fetchProfile() { return request("/account/profile"); }
export function updateProfile(profile) {
  return request("/account/profile", { method: "PUT", body: JSON.stringify(profile) });
}
export function fetchCandidateDashboard() { return request("/account/candidate-dashboard"); }
export function fetchNotifications() { return request("/account/notifications"); }
export function markAllNotificationsRead() { return request("/account/notifications/read-all", { method: "PATCH" }); }
export function fetchSavedJobs() { return request("/account/saved-jobs"); }
export function saveJob(id) { return request(`/account/saved-jobs/${id}`, { method: "POST" }); }
export function unsaveJob(id) { return request(`/account/saved-jobs/${id}`, { method: "DELETE" }); }
