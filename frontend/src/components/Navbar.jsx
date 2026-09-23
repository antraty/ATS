import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

// Barre de navigation simple : pas d'authentification dans ce projet
// pédagogique, on accède librement aux trois grandes vues.
export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  function logout() { signOut(); navigate("/"); }
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="wordmark">
          Recrute.
        </NavLink>
        <nav>
          <ul className="nav-links">
            {user?.role === "candidate" && <li>
              <NavLink to="/mes-candidatures" className={({ isActive }) => (isActive ? "active" : "")}>Mes candidatures</NavLink>
            </li>}
            {!user && <li>
              <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>Offres</NavLink>
            </li>}
            {user?.role === "recruiter" && <li>
              <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
                Offres
              </NavLink>
            </li>}
            {user ? <li><button className="nav-account" onClick={logout}>Quitter <span>{user.name.split(" ")[0]}</span></button></li> : <li><NavLink to="/connexion" className={({ isActive }) => (isActive ? "active" : "")}>Se connecter</NavLink></li>}
            {user?.role === "recruiter" && <li>
              <NavLink
                to="/offres/nouvelle"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Publier une offre
              </NavLink>
            </li>}
            {user?.role === "recruiter" && <li>
              <NavLink
                to="/recrutement"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Suivi des candidatures
              </NavLink>
            </li>}
          </ul>
        </nav>
      </div>
    </header>
  );
}
