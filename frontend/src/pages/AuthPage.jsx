import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("candidate");
  const [form, setForm] = useState({ name: "", company: "", email: "", password: "" });
  const [error, setError] = useState("");
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event) {
    event.preventDefault(); setError("");
    try {
      if (mode === "login") await signIn({ email: form.email, password: form.password });
      else await signUp({ ...form, role });
      navigate(location.state?.from || (role === "recruiter" ? "/recrutement" : "/"), { replace: true });
    } catch (err) { setError(err.message); }
  }

  return <main className="auth-shell"><section className="auth-intro"><span className="eyebrow">RECRUTE.</span><h1>Le bon poste. Le bon moment.</h1><p>Un espace clair pour trouver une opportunité ou faire grandir votre équipe.</p></section><section className="auth-panel">
    <div className="auth-tabs"><button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Se connecter</button><button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Créer un compte</button></div>
    <h2>{mode === "login" ? "Bienvenue parmi nous" : "Votre profil"}</h2><p className="muted">{mode === "login" ? "Retrouvez vos offres et vos candidatures." : "Choisissez votre expérience Recrute."}</p>
    {mode === "register" && <><div className="role-picker"><button className={role === "candidate" ? "selected" : ""} onClick={() => setRole("candidate")} type="button"><strong>Candidat</strong><span>Je cherche ma prochaine opportunité</span></button><button className={role === "recruiter" ? "selected" : ""} onClick={() => setRole("recruiter")} type="button"><strong>Recruteur</strong><span>Je construis mon équipe</span></button></div><div className="form-field"><label>Nom complet</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>{role === "recruiter" && <div className="form-field"><label>Entreprise</label><input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>}</>}
    {error && <div className="alert alert-error">{error}</div>}<form onSubmit={submit}><div className="form-field"><label>Email</label><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div><div className="form-field"><label>Mot de passe</label><input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div><button className="btn btn-primary auth-submit">{mode === "login" ? "Ouvrir mon espace" : "Créer mon espace"}</button></form>
    <p className="demo-hint">Démo : `candidat@recrute.test` ou `recruteur@recrute.test` · mot de passe `demo123`</p><Link className="back-link" to="/">← Voir les offres</Link>
  </section></main>;
}