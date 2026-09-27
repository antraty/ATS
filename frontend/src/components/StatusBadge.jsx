// Traduit un statut technique ("en_cours") en libellé lisible,
// et lui applique la couleur définie dans global.css.
const LABELS = {
  recue: "reçue",
  cv_consulte: "CV consulté",
  analyse: "en analyse",
  preselectionnee: "pré-sélectionnée",
  entretien_rh: "entretien RH",
  test_technique: "test technique",
  entretien_final: "entretien final",
  offre_envoyee: "offre envoyée",
  en_cours: "en cours",
  acceptee: "acceptée",
  refusee: "refusée",
  retiree: "retirée",
  archivee: "archivée",
};

export default function StatusBadge({ status }) {
  return <span className={`status-badge status-${status}`}>{LABELS[status] || status}</span>;
}
