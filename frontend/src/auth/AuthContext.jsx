import { createContext, useContext, useState } from "react";
import { login, register } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("recrute_user")) || null; } catch { return null; }
  });

  function saveSession(data) {
    localStorage.setItem("recrute_token", data.token);
    localStorage.setItem("recrute_user", JSON.stringify(data.user));
    setUser(data.user);
  }

  async function signIn(credentials) { saveSession(await login(credentials)); }
  async function signUp(details) { saveSession(await register(details)); }
  function signOut() { localStorage.removeItem("recrute_token"); localStorage.removeItem("recrute_user"); setUser(null); }

  return <AuthContext.Provider value={{ user, signIn, signUp, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() { return useContext(AuthContext); }