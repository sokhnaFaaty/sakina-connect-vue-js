// src/services/notificationService.js
import { getSos } from "./sosService.js";
import { getAnnonces } from "./annonceService.js";
import { getPelerins } from "./pelerinService.js";
import { getUtilisateurs } from "./utilisateurService.js";
import { getGuideByUtilisateurId } from "./guideService.js"; 
import { getGroupes } from "./groupeService.js"; 
import { getProches } from "./procheService.js"; // ✅ On n'importe que la fonction CRUD de base

const POLE_PAR_ROLE = {
  ADMIN: "pole-urgence",
  GUIDE: "mon-pole-urgence",
  PROCHE: "suivi-familial",
};

const STATUT_ANNONCE = {
  EN_ATTENTE: "EN_ATTENTE",
  APPROUVE: "APPROUVE",
  REJETE: "REJETE",
};

function statutAnnonce(a) {
  return a.statut || STATUT_ANNONCE.APPROUVE;
}

async function getGroupeIdDuLecteur(user, role) {
  if (role === "GUIDE") {
    const guide = await getGuideByUtilisateurId(user.id);
    if (!guide) return null;
    const groupes = await getGroupes();
    const groupe = groupes.find(g => g.guideId === guide.id);
    return groupe?.id || null;
  }
  if (role === "PELERIN") {
    const pelerins = await getPelerins();
    const pelerin = pelerins.find((p) => p.utilisateurId === user.id);
    return pelerin?.groupeId || null;
  }
  if (role === "PROCHE") {
    // ✅ On récupère tous les proches et on filtre par utilisateurId
    const proches = await getProches();
    const proche = proches.find((p) => p.utilisateurId === user.id);
    if (!proche) return null;
    const pelerins = await getPelerins();
    const pelerin = pelerins.find((p) => p.id === proche.pelerinId);
    return pelerin?.groupeId || null;
  }
  return null;
}

export async function getNotifications(user, role) {
  const items = [];
  
  const [annoncesRaw, sos] = await Promise.all([
    getAnnonces().catch(() => []),
    getSos().catch(() => [])
  ]);

  // 1) Annonces
  let annoncesVisibles = [];
  try {
    if (role === "ADMIN") {
      annoncesVisibles = annoncesRaw;
    } else {
      const groupeId = await getGroupeIdDuLecteur(user, role);
      annoncesVisibles = annoncesRaw.filter((a) => {
        if (a.auteurId && a.auteurId === user.id) return true;
        if (statutAnnonce(a) !== STATUT_ANNONCE.APPROUVE) return false;
        return !a.groupeId || a.groupeId === groupeId;
      });
    }
    
    annoncesVisibles.slice(0, 10).forEach((a) => {
      items.push({
        id: "an-" + a.id,
        type: "annonce",
        icon: "fa-bullhorn",
        titre: a.titre,
        sous: a.contenu,
        date: a.datePublication,
        urgent: !!a.urgence,
        page: "annonces",
      });
    });
  } catch { /* on ignore silencieusement */ }

  // 2) SOS
  let sosPertinents = [];
  try {
    if (role === "ADMIN") {
      sosPertinents = sos.filter((s) => s.statut === "EN_ATTENTE");
    } else if (role === "GUIDE") {
      const guide = await getGuideByUtilisateurId(user.id);
      if (guide) {
        const groupes = await getGroupes();
        const groupe = groupes.find(g => g.guideId === guide.id);
        if (groupe) {
          const pels = await getPelerins();
          const ids = new Set(pels.filter(p => p.groupeId === groupe.id).map((p) => p.id));
          sosPertinents = sos.filter((s) => s.statut === "EN_ATTENTE" && ids.has(s.pelerinId));
        }
      }
    } else if (role === "PROCHE") {
      const proches = await getProches();
      const proche = proches.find((p) => p.utilisateurId === user.id);
      if (proche) {
        sosPertinents = sos.filter((s) => s.statut === "EN_ATTENTE" && s.pelerinId === proche.pelerinId);
      }
    }
  } catch { /* on ignore silencieusement */ }

  if (sosPertinents.length) {
    const [pelerins, utilisateurs] = await Promise.all([getPelerins().catch(() => []), getUtilisateurs().catch(() => [])]);
    const um = Object.fromEntries(utilisateurs.map((u) => [u.id, u]));
    const pm = Object.fromEntries(pelerins.map((p) => [p.id, p]));
    const nomPelerin = (pid) => um[pm[pid]?.utilisateurId]?.nomComplet || "Pèlerin";
    
    sosPertinents.forEach((s) => {
      items.push({
        id: "sos-" + s.id,
        type: "sos",
        icon: "fa-triangle-exclamation",
        titre: "Alerte SOS : " + nomPelerin(s.pelerinId),
        sous: s.commentaire || "Position transmise",
        date: s.dateHeure,
        urgent: true,
        page: POLE_PAR_ROLE[role] || "annonces",
      });
    });
  }

  items.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return items;
}

const KEY = (uid) => `notif:lastSeen:${uid}`;

export function getLastSeen(uid) {
  try { return localStorage.getItem(KEY(uid)); } catch { return null; }
}

export function markSeen(uid) {
  try { localStorage.setItem(KEY(uid), new Date().toISOString()); } catch { /* ignore */ }
}

export function countUnseen(items, uid) {
  const last = getLastSeen(uid);
  if (!last) return items.length;
  return items.filter((i) => String(i.date) > last).length;
}