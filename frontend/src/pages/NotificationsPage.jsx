import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchNotifications, markAllNotificationsRead } from "../api/client";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState("");

  function load() { fetchNotifications().then(setNotifications).catch((err) => setError(err.message)); }
  useEffect(load, []);

  async function markAllRead() {
    try { await markAllNotificationsRead(); load(); }
    catch (err) { setError(err.message); }
  }

  return <main className="page">
    <div className="dashboard-header"><div><span className="eyebrow">ACTUALITÉS</span><h1>Notifications</h1></div>
      {notifications.some((item) => !item.read_at) && <button className="btn btn-ghost" onClick={markAllRead}>Tout marquer comme lu</button>}
    </div>
    {error && <div className="alert alert-error">{error}</div>}
    {notifications.length === 0 ? <div className="empty-state">Aucune notification pour le moment.</div> :
      <div className="notification-list">{notifications.map((notification) => <article className={`notification-row ${notification.read_at ? "is-read" : ""}`} key={notification.id}>
        <span className="notification-mark" />
        <div><p>{notification.message}</p><time>{new Date(notification.created_at).toLocaleString("fr-FR")}</time></div>
        {notification.link && <Link to={notification.link}>Voir</Link>}
      </article>)}</div>}
  </main>;
}