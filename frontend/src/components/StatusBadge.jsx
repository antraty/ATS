// Traduit un statut technique ("en_cours") en libellé lisible,
// et lui applique la couleur définie dans global.css.
const LABELS = {
  recue: "reçue",
  en_cours: "en cours",
  acceptee: "acceptée",
  refusee: "refusée",
};

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{LABELS[status] || status}</span>;
}
