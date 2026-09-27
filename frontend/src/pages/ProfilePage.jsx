import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { changePassword, deactivateAccount, fetchProfile, updateProfile } from "../api/client";
import { useNavigate } from "react-router-dom";

const INITIAL = {
  email: "", first_name: "", last_name: "", phone: "", photo_url: "", address: "", birth_date: "", target_role: "",
  education_level: "", experience_years: 0, availability: "", salary_expectation: "",
  skills: [], education: [], experience: [], cv_url: "", cover_letter_url: "", portfolio_url: "",
  company_name: "", logo_url: "", sector: "", description: "", website: "",
};

export default function ProfilePage() {
  const { user } = useAuth();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const isCandidate = user?.role === "candidate";
  const [profile, setProfile] = useState(INITIAL);
  const [skillsText, setSkillsText] = useState("");
  const [educationText, setEducationText] = useState("[]");
  const [experienceText, setExperienceText] = useState("[]");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [password, setPassword] = useState({ current_password: "", new_password: "" });

  useEffect(() => {
    fetchProfile().then((data) => {
      setProfile({ ...INITIAL, ...data });
      setSkillsText((data.skills || []).join(", "));
      setEducationText(JSON.stringify(data.education || [], null, 2));
      setExperienceText(JSON.stringify(data.experience || [], null, 2));
    }).catch((err) => setError(err.message));
  }, []);

  function change(field, value) { setProfile((current) => ({ ...current, [field]: value })); setSaved(false); }

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const payload = isCandidate ? {
        ...profile,
        skills: skillsText.split(",").map((skill) => skill.trim()).filter(Boolean),
        education: JSON.parse(educationText || "[]"),
        experience: JSON.parse(experienceText || "[]"),
      } : profile;
      const result = await updateProfile(payload);
      setProfile({ ...INITIAL, ...result });
      setSaved(true);
    } catch (err) { setError(err instanceof SyntaxError ? "Les formations et expériences doivent être des tableaux JSON valides." : err.message); }
  }

  async function submitPassword(event) {
    event.preventDefault(); setError("");
    try { await changePassword(password); setPassword({ current_password: "", new_password: "" }); setSaved(true); }
    catch (err) { setError(err.message); }
  }

  async function deactivate() {
    if (!window.confirm("Désactiver votre compte ? Vous serez immédiatement déconnecté.")) return;
    try { await deactivateAccount(); signOut(); navigate("/"); }
    catch (err) { setError(err.message); }
  }

  return <main className="page"><section className="form-card profile-form">
    <span className="eyebrow">COMPTE</span><h1>{isCandidate ? "Profil candidat" : "Profil entreprise"}</h1>
    <p className="muted">Informations personnelles et professionnelles</p>
    {error && <div className="alert alert-error">{error}</div>}{saved && <div className="alert alert-success">Profil enregistré.</div>}
    <form onSubmit={submit}>
      <div className="form-field"><label htmlFor="profile_email">Adresse e-mail</label><input id="profile_email" type="email" required value={profile.email || user?.email || ""} onChange={(e) => change("email", e.target.value)} /></div>
      {isCandidate ? <>
        <div className="form-row">
          <div className="form-field"><label htmlFor="first_name">Prénom</label><input id="first_name" value={profile.first_name} onChange={(e) => change("first_name", e.target.value)} /></div>
          <div className="form-field"><label htmlFor="last_name">Nom</label><input id="last_name" value={profile.last_name} onChange={(e) => change("last_name", e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-field"><label htmlFor="phone">Téléphone</label><input id="phone" value={profile.phone} onChange={(e) => change("phone", e.target.value)} /></div>
          <div className="form-field"><label htmlFor="birth_date">Date de naissance</label><input id="birth_date" type="date" value={profile.birth_date || ""} onChange={(e) => change("birth_date", e.target.value)} /></div>
        </div>
        <div className="form-field"><label htmlFor="photo_url">Photo (URL)</label><input id="photo_url" type="url" value={profile.photo_url || ""} onChange={(e) => change("photo_url", e.target.value)} /></div>
        <div className="form-field"><label htmlFor="address">Adresse</label><input id="address" value={profile.address} onChange={(e) => change("address", e.target.value)} /></div>
        <div className="form-row">
          <div className="form-field"><label htmlFor="target_role">Métier recherché</label><input id="target_role" value={profile.target_role} onChange={(e) => change("target_role", e.target.value)} /></div>
          <div className="form-field"><label htmlFor="education_level">Niveau d’étude</label><input id="education_level" value={profile.education_level} onChange={(e) => change("education_level", e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-field"><label htmlFor="experience_years">Années d’expérience</label><input id="experience_years" type="number" min="0" step="0.5" value={profile.experience_years} onChange={(e) => change("experience_years", e.target.value)} /></div>
          <div className="form-field"><label htmlFor="availability">Disponibilité</label><input id="availability" value={profile.availability} onChange={(e) => change("availability", e.target.value)} /></div>
        </div>
        <div className="form-field"><label htmlFor="salary_expectation">Prétention salariale</label><input id="salary_expectation" value={profile.salary_expectation} onChange={(e) => change("salary_expectation", e.target.value)} /></div>
        <div className="form-field"><label htmlFor="skills">Compétences (séparées par des virgules)</label><input id="skills" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} /></div>
        <div className="form-field"><label htmlFor="cv_url">Lien vers le CV</label><input id="cv_url" type="url" value={profile.cv_url || ""} onChange={(e) => change("cv_url", e.target.value)} /></div>
        <div className="form-row">
          <div className="form-field"><label htmlFor="cover_letter_url">Lettre de motivation</label><input id="cover_letter_url" type="url" value={profile.cover_letter_url || ""} onChange={(e) => change("cover_letter_url", e.target.value)} /></div>
          <div className="form-field"><label htmlFor="portfolio_url">Portfolio</label><input id="portfolio_url" type="url" value={profile.portfolio_url || ""} onChange={(e) => change("portfolio_url", e.target.value)} /></div>
        </div>
        <div className="form-field"><label htmlFor="education">Formations (tableau JSON)</label><textarea id="education" rows={4} value={educationText} onChange={(e) => setEducationText(e.target.value)} /></div>
        <div className="form-field"><label htmlFor="experience">Expériences (tableau JSON)</label><textarea id="experience" rows={4} value={experienceText} onChange={(e) => setExperienceText(e.target.value)} /></div>
      </> : <>
        <div className="form-field"><label htmlFor="company_name">Entreprise</label><input id="company_name" value={profile.company_name || ""} onChange={(e) => change("company_name", e.target.value)} /></div>
        <div className="form-row">
          <div className="form-field"><label htmlFor="sector">Secteur</label><input id="sector" value={profile.sector || ""} onChange={(e) => change("sector", e.target.value)} /></div>
          <div className="form-field"><label htmlFor="website">Site web</label><input id="website" type="url" value={profile.website || ""} onChange={(e) => change("website", e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-field"><label htmlFor="phone">Téléphone</label><input id="phone" value={profile.phone || ""} onChange={(e) => change("phone", e.target.value)} /></div>
          <div className="form-field"><label htmlFor="logo_url">Logo (URL)</label><input id="logo_url" type="url" value={profile.logo_url || ""} onChange={(e) => change("logo_url", e.target.value)} /></div>
        </div>
        <div className="form-field"><label htmlFor="address">Adresse</label><input id="address" value={profile.address || ""} onChange={(e) => change("address", e.target.value)} /></div>
        <div className="form-field"><label htmlFor="description">Présentation de l’entreprise</label><textarea id="description" rows={6} value={profile.description || ""} onChange={(e) => change("description", e.target.value)} /></div>
      </>}
      <button className="btn btn-primary" type="submit">Enregistrer le profil</button>
    </form>
    <section className="profile-security">
      <h2>Sécurité du compte</h2>
      <form onSubmit={submitPassword}>
        <div className="form-row">
          <div className="form-field"><label htmlFor="current_password">Mot de passe actuel</label><input id="current_password" type="password" required value={password.current_password} onChange={(e) => setPassword({ ...password, current_password: e.target.value })} /></div>
          <div className="form-field"><label htmlFor="new_password">Nouveau mot de passe (8 caractères minimum)</label><input id="new_password" type="password" minLength={8} required value={password.new_password} onChange={(e) => setPassword({ ...password, new_password: e.target.value })} /></div>
        </div>
        <button className="btn btn-ghost" type="submit">Changer le mot de passe</button>
      </form>
      <button className="btn btn-danger deactivate-button" type="button" onClick={deactivate}>Désactiver mon compte</button>
    </section>
  </section></main>;
}