import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getAppShareHost } from "@/lib/appUrl";

function formatFcfa(n: number) {
  return n.toLocaleString("fr-TG") + " FCFA";
}

function buildSmtPdfHtml(params: {
  username: string;
  country: string;
  authority: string;
  annee: number;
  recettes: number;
  achats: number;
  charges: number;
  totalDepenses: number;
  beneficeImposable: number;
  disponibilites: number;
  actifCirculant: number;
  actifTotal: number;
  margeBrute: number;
  ratioRentabilite: number;
  appHost: string;
}): string {
  const { username, country, authority, annee, recettes, achats, charges, totalDepenses, beneficeImposable, disponibilites, actifCirculant, actifTotal, margeBrute, ratioRentabilite, appHost } = params;
  const today = new Date().toLocaleDateString("fr-TG", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const beneficeColor = beneficeImposable >= 0 ? "#16a34a" : "#dc2626";
  const margeColor = margeBrute >= 0 ? "#16a34a" : "#dc2626";
  const ratioColor = ratioRentabilite >= 0 ? "#16a34a" : "#dc2626";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Déclaration SMT — MAR-CI Compta</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; background: #fff; color: #111827; padding: 32px; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 2px solid #1e40af; }
    .logo-box { width: 52px; height: 52px; background: #1e40af; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .logo-m { font-size: 30px; font-weight: 900; color: #fff; }
    .header-info h1 { font-size: 19px; font-weight: 800; color: #1e40af; }
    .header-info p { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .badge { display: inline-block; margin-top: 10px; background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; padding: 6px 14px; border-radius: 20px; }
    .meta { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .meta-box { background: #f8fafc; border-radius: 12px; padding: 14px 20px; flex: 1; min-width: 140px; }
    .meta-label { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
    .meta-val { font-size: 15px; font-weight: 900; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead tr { background: #1e40af; }
    thead th { padding: 12px 16px; text-align: left; font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-transform: uppercase; }
    thead th:last-child { text-align: right; }
    tbody td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
    tbody td:last-child { text-align: right; font-weight: 700; }
    tbody tr.sub td { color: #6b7280; font-size: 13px; padding-left: 28px; border-bottom: 1px dashed #f1f5f9; }
    tbody tr.total td { background: #f8fafc; font-size: 16px; font-weight: 900; border-top: 2px solid #1e40af; border-bottom: none; }
    tbody tr.total td:last-child { color: ${beneficeColor}; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { font-size: 11px; color: #94a3b8; font-style: italic; letter-spacing: 0.3px; }
    .footer strong { color: #1e40af; font-style: normal; }
    .disclaimer { margin-top: 20px; font-size: 11px; color: #94a3b8; line-height: 16px; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-box"><span class="logo-m">M</span></div>
    <div class="header-info">
      <h1>DÉCLARATION FISCALE SIMPLIFIÉE (SMT)</h1>
      <p>Système Minimum de Trésorerie — Norme SYSCOHADA</p>
      <div class="badge">${country.toUpperCase()} · ${authority} · Exercice ${annee}</div>
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <div class="meta-label">Commerçant</div>
      <div class="meta-val" style="color:#1e40af;">${username}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Exercice fiscal</div>
      <div class="meta-val" style="color:#1e40af;">${annee}</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">Date d'édition</div>
      <div class="meta-val" style="color:#1e40af; font-size: 12px;">${today}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Compte de Résultat Simplifié (SMT)</th>
        <th style="text-align:right;">Montant</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Total des Recettes (Chiffre d'affaires — Ventes)</td>
        <td style="color:#16a34a;">+${recettes.toLocaleString("fr-TG")} FCFA</td>
      </tr>
      <tr>
        <td>Total des Dépenses (Achats + Charges d'exploitation)</td>
        <td style="color:#dc2626;">-${totalDepenses.toLocaleString("fr-TG")} FCFA</td>
      </tr>
      <tr class="sub">
        <td>— dont Achats</td>
        <td>-${achats.toLocaleString("fr-TG")} FCFA</td>
      </tr>
      <tr class="sub">
        <td>— dont Charges d'exploitation</td>
        <td>-${charges.toLocaleString("fr-TG")} FCFA</td>
      </tr>
      <tr class="total">
        <td>Bénéfice Imposable SMT</td>
        <td>${beneficeImposable >= 0 ? "+" : ""}${beneficeImposable.toLocaleString("fr-TG")} FCFA</td>
      </tr>
    </tbody>
  </table>

  <h2 style="font-size:15px;font-weight:800;color:#1e40af;margin-top:28px;margin-bottom:12px;">Analyses Avancées — Flux de trésorerie réels</h2>

  <div class="meta">
    <div class="meta-box">
      <div class="meta-label">💰 Disponibilités (Caisse)</div>
      <div class="meta-val" style="color:#1e40af;">${disponibilites.toLocaleString("fr-TG")} FCFA</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">📦 Actif Circulant (Stock)</div>
      <div class="meta-val" style="color:#1e40af;">${actifCirculant.toLocaleString("fr-TG")} FCFA</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">🏦 Actif Total (Bilan Flash)</div>
      <div class="meta-val" style="color:#1e40af;">${actifTotal.toLocaleString("fr-TG")} FCFA</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Soldes de Gestion Flash (Mini-SIG)</th>
        <th style="text-align:right;">Valeur</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Marge Brute de Trésorerie (Ventes − Achats marchandises)</td>
        <td style="color:${margeColor};">${margeBrute >= 0 ? "+" : ""}${margeBrute.toLocaleString("fr-TG")} FCFA</td>
      </tr>
      <tr>
        <td>Ratio de Rentabilité (Bénéfice Net / Chiffre d'Affaires)</td>
        <td style="color:${ratioColor};">${ratioRentabilite >= 0 ? "+" : ""}${ratioRentabilite.toFixed(1)}%</td>
      </tr>
    </tbody>
  </table>

  <p class="disclaimer">Ce document est une déclaration simplifiée indicative générée sur la base des opérations enregistrées dans MAR-CI Compta. Il ne remplace pas les formulaires officiels de l'${authority}. Consultez un expert-comptable agréé pour votre déclaration officielle.</p>

  <div class="footer">
    <p><strong>Généré par MAR-CI Compta</strong> — Votre allié de confiance &nbsp;·&nbsp; ${appHost}</p>
  </div>
</body>
</html>`;
}

// ─── Données Togo ───────────────────────────────────────────────
const TOGO_REGIMES = [
  {
    titre: "Taxe Professionnelle Unique (TPU)",
    seuil: "< 60 Millions FCFA/an",
    taux: "Forfait annuel — taux fixe",
    icon: "layers",
    color: "#22c55e",
    desc: "Régime simplifié pour les petits commerçants et artisans. Un seul impôt remplace l'IS, la TVA et la patente. Déclaration annuelle à l'OTR.",
  },
  {
    titre: "Régime Réel Simplifié (RRS)",
    seuil: "60M — 500M FCFA/an",
    taux: "IS 28% sur bénéfice net",
    icon: "bar-chart-2",
    color: "#3b82f6",
    desc: "Tenue d'une comptabilité simplifiée obligatoire. Déclaration trimestrielle TVA et dépôt des états financiers annuels à l'OTR.",
  },
  {
    titre: "Régime Réel Normal (RRN)",
    seuil: "> 500 Millions FCFA/an",
    taux: "IS 28% sur bénéfice net",
    icon: "trending-up",
    color: "#8b5cf6",
    desc: "Comptabilité complète selon le Système Comptable OHADA. États financiers certifiés exigés. Déclaration mensuelle TVA.",
  },
];

const TOGO_CONSEILS = [
  { titre: "Conservez vos factures", desc: "Gardez toutes vos factures d'achat pendant 5 ans — l'OTR peut les réclamer à tout moment.", icon: "file-text" },
  { titre: "Déclarez à temps à l'OTR", desc: "La déclaration annuelle doit être soumise avant le 30 avril.", icon: "calendar" },
  { titre: "TVA au Togo", desc: "Le taux standard de la TVA est de 18%. Elle est collectée sur vos ventes et récupérable sur vos achats professionnels.", icon: "percent" },
  { titre: "Patente commerciale", desc: "La patente est due chaque année selon la nature de votre activité et votre chiffre d'affaires.", icon: "award" },
];

// ─── Données Bénin ──────────────────────────────────────────────
const BENIN_REGIMES = [
  {
    titre: "Taxe Forfaitaire des Petits Opérateurs (TFPOB)",
    seuil: "< 50 Millions FCFA/an",
    taux: "Forfait fixe — selon activité",
    icon: "layers",
    color: "#f59e0b",
    desc: "Régime applicable aux micro-entrepreneurs. Paiement d'une taxe forfaitaire annuelle auprès de la DGI. Comptabilité allégée.",
  },
  {
    titre: "Impôt Synthétique (IS-Synthétique)",
    seuil: "50M — 500M FCFA/an",
    taux: "Taux progressif selon CA",
    icon: "bar-chart-2",
    color: "#3b82f6",
    desc: "Régime intermédiaire. Comptabilité simplifiée obligatoire. Déclaration semestrielle auprès de la DGI. Remplace TVA et IRPP.",
  },
  {
    titre: "Impôt sur les Sociétés (IS)",
    seuil: "> 500 Millions FCFA/an",
    taux: "IS 30% sur bénéfice net",
    icon: "trending-up",
    color: "#8b5cf6",
    desc: "Comptabilité complète selon le Système Comptable OHADA. Déclaration mensuelle TVA. États financiers certifiés requis par la DGI.",
  },
];

const BENIN_CONSEILS = [
  { titre: "Immatriculation à la DGI", desc: "Tout commerce doit être immatriculé auprès de la Direction Générale des Impôts du Bénin.", icon: "file-text" },
  { titre: "Délai de déclaration", desc: "La déclaration annuelle doit être déposée avant le 30 avril à la DGI.", icon: "calendar" },
  { titre: "TVA au Bénin", desc: "Le taux de la TVA est de 18%. Elle s'applique aux opérations commerciales au-dessus du seuil de la TFPOB.", icon: "percent" },
  { titre: "Registre du Commerce (RCCM)", desc: "Le RCCM est obligatoire pour exercer légalement au Bénin. Démarche auprès de l'ANPE ou du tribunal.", icon: "award" },
];

interface Props {
  bottomPad: number;
}

export default function BouclierScreen({ bottomPad }: Props) {
  const colors = useColors();
  const { soldeCaisse, totalEntrees, valeurMagasin, transactions } = useApp();
  const { user, hasFiscalAccess, daysRemaining, fiscalExpired } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [smtPdfLoading, setSmtPdfLoading] = useState(false);

  const anneeEnCours = new Date().getFullYear();

  const smt = useMemo(() => {
    const txAnnee = transactions.filter((t) => new Date(t.date).getFullYear() === anneeEnCours);
    const recettes = txAnnee
      .filter((t) => t.type === "entree" && t.categorie === "Ventes")
      .reduce((sum, t) => sum + t.montant, 0);
    const achats = txAnnee
      .filter((t) => t.type === "sortie" && t.categorie === "Achats")
      .reduce((sum, t) => sum + t.montant, 0);
    const charges = txAnnee
      .filter((t) => t.type === "sortie" && t.categorie !== "Achats")
      .reduce((sum, t) => sum + t.montant, 0);
    const totalDepenses = achats + charges;
    const beneficeImposable = recettes - totalDepenses;
    return { recettes, achats, charges, totalDepenses, beneficeImposable };
  }, [transactions, anneeEnCours]);

  // ─── Analyses Avancées : Bilan Flash + Mini-SIG (flux de trésorerie réels, toutes périodes) ───
  const analyses = useMemo(() => {
    const totalVentes = transactions
      .filter((t) => t.type === "entree" && t.categorie === "Ventes")
      .reduce((sum, t) => sum + t.montant, 0);
    const totalAchatsMarchandises = transactions
      .filter((t) => t.type === "sortie" && t.categorie === "Achats")
      .reduce((sum, t) => sum + t.montant, 0);

    const disponibilites = soldeCaisse;
    const actifCirculant = valeurMagasin;
    const actifTotal = disponibilites + actifCirculant;

    const margeBrute = totalVentes - totalAchatsMarchandises;
    const ratioRentabilite = totalEntrees > 0 ? (soldeCaisse / totalEntrees) * 100 : 0;

    return { disponibilites, actifCirculant, actifTotal, margeBrute, ratioRentabilite };
  }, [transactions, soldeCaisse, valeurMagasin, totalEntrees]);

  const isTogo = user?.country !== "benin";
  const country = isTogo ? "Togo" : "Bénin";
  const authority = isTogo ? "OTR" : "DGI";
  const regimes = isTogo ? TOGO_REGIMES : BENIN_REGIMES;
  const conseils = isTogo ? TOGO_CONSEILS : BENIN_CONSEILS;
  const taxRate = isTogo ? 28 : 30;

  const caEstime = totalEntrees * 12;
  const tva = totalEntrees * 0.18;
  const impotEstime = Math.max(0, soldeCaisse * (taxRate / 100));

  const getRegime = () => {
    const limit1 = isTogo ? 60_000_000 : 50_000_000;
    const limit2 = 500_000_000;
    if (caEstime < limit1) return regimes[0].titre;
    if (caEstime < limit2) return regimes[1].titre;
    return regimes[2].titre;
  };

  const regime = getRegime();

  const handleShare = () => {
    const today = new Date().toLocaleDateString("fr-TG", { day: "2-digit", month: "long", year: "numeric" });
    const text = `📊 MAR-CI Compta — Rapport Fiscal\n\n👤 ${user?.username ?? "Commerçant"} | ${country}\n📅 ${today}\n\n💰 Entrées : +${formatFcfa(totalEntrees)}\n🏦 Solde caisse : ${formatFcfa(soldeCaisse)}\n📦 Valeur stock : ${formatFcfa(valeurMagasin)}\n\n📈 CA estimé/an : ${formatFcfa(caEstime)}\n🔖 Régime : ${regime}\n📊 TVA estimée (18%) : ${formatFcfa(tva)}\n💼 Impôt estimé (${taxRate}%) : ${formatFcfa(impotEstime)}\n\n📱 Via MAR-CI Compta — ${authority}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleRenew = () => {
    const text = encodeURIComponent(`Bonjour Achille, je souhaite renouveler mon abonnement MAR-CI Compta.\nNom : ${user?.username}\nPays : ${country}`);
    Linking.openURL(`https://wa.me/22898671631?text=${text}`).catch(() => {});
  };

  const handleExportSmtPdf = async () => {
    setSmtPdfLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const html = buildSmtPdfHtml({
        username: user?.username ?? "Votre boutique",
        country,
        authority,
        annee: anneeEnCours,
        recettes: smt.recettes,
        achats: smt.achats,
        charges: smt.charges,
        totalDepenses: smt.totalDepenses,
        beneficeImposable: smt.beneficeImposable,
        disponibilites: analyses.disponibilites,
        actifCirculant: analyses.actifCirculant,
        actifTotal: analyses.actifTotal,
        margeBrute: analyses.margeBrute,
        ratioRentabilite: analyses.ratioRentabilite,
        appHost: getAppShareHost(),
      });
      if (Platform.OS === "web") {
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          setTimeout(() => win.print(), 500);
        } else {
          Alert.alert("Bloqué", "Autorisez les pop-ups pour télécharger le PDF.");
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Déclaration SMT MAR-CI Compta" });
        } else {
          await Print.printAsync({ html });
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de générer la déclaration SMT. Veuillez réessayer.");
    } finally {
      setSmtPdfLoading(false);
    }
  };

  const handleShareSmtWhatsapp = () => {
    const text = `📊 MAR-CI Compta — DÉCLARATION FISCALE SIMPLIFIÉE (SMT)\n\n👤 ${user?.username ?? "Commerçant"} | ${country} · ${authority}\n📅 Exercice ${anneeEnCours}\n\n💰 Total Recettes (CA) : +${formatFcfa(smt.recettes)}\n📦 Achats : -${formatFcfa(smt.achats)}\n🧾 Charges d'exploitation : -${formatFcfa(smt.charges)}\n📉 Total Dépenses : -${formatFcfa(smt.totalDepenses)}\n\n💼 Bénéfice Imposable SMT : ${smt.beneficeImposable >= 0 ? "+" : ""}${formatFcfa(smt.beneficeImposable)}\n\n📱 Via MAR-CI Compta — Système Minimum de Trésorerie (SYSCOHADA)`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {});
  };

  // Si accès fiscal expiré → mur de paiement
  if (fiscalExpired) {
    return (
      <View style={[styles.lockRoot, { backgroundColor: colors.background }]}>
        <View style={[styles.lockCard, { backgroundColor: "#1e293b" }]}>
          <Feather name="lock" size={48} color="#ef4444" />
          <Text style={styles.lockTitle}>Accès Fiscal Expiré</Text>
          <Text style={styles.lockSub}>
            {user?.tier === "gratuit"
              ? "Votre période d'essai gratuite (10 jours) est terminée."
              : "Votre abonnement Premium a expiré."}
            {"\n"}Renouvelez pour débloquer le Bouclier Fiscal.
          </Text>

          <TouchableOpacity style={styles.renewBtn} onPress={handleRenew}>
            <Feather name="message-circle" size={18} color="#fff" />
            <Text style={styles.renewBtnText}>Renouveler sur WhatsApp</Text>
          </TouchableOpacity>

          <View style={styles.tierInfo}>
            <Text style={styles.tierInfoTitle}>Nos abonnements</Text>
            <View style={styles.tierRow}>
              <View style={[styles.tierCard, { borderColor: "#eab308" }]}>
                <Text style={[styles.tierName, { color: "#eab308" }]}>⭐ VIP</Text>
                <Text style={styles.tierDesc}>Accès illimité{"\n"}à vie</Text>
              </View>
              <View style={[styles.tierCard, { borderColor: "#2563eb" }]}>
                <Text style={[styles.tierName, { color: "#2563eb" }]}>💎 Premium</Text>
                <Text style={styles.tierDesc}>30 jours{"\n"}d'accès complet</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={[styles.heroCard, { backgroundColor: "#1e293b" }]}>
        <View style={styles.heroTop}>
          <View style={[styles.heroIcon, { backgroundColor: "#334155" }]}>
            <Feather name="shield" size={28} color="#38bdf8" />
          </View>
          <View style={styles.heroTopRight}>
            <View style={[styles.heroBadge, { backgroundColor: "#0ea5e920" }]}>
              <Text style={[styles.heroBadgeText, { color: "#38bdf8" }]}>
                {isTogo ? "🇹🇬 TOGO · OTR" : "🇧🇯 BÉNIN · DGI"}
              </Text>
            </View>
            {daysRemaining !== null && (
              <View style={[styles.countdownBadge, { backgroundColor: daysRemaining <= 3 ? "#fee2e2" : "#dcfce7" }]}>
                <Feather name="clock" size={11} color={daysRemaining <= 3 ? "#ef4444" : "#22c55e"} />
                <Text style={[styles.countdownText, { color: daysRemaining <= 3 ? "#ef4444" : "#22c55e" }]}>
                  J-{daysRemaining}
                </Text>
              </View>
            )}
          </View>
        </View>
        <Text style={styles.heroTitle}>Votre Situation Fiscale</Text>
        <Text style={styles.heroSub}>Basée sur vos données — {country}</Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>CA estimé / an</Text>
            <Text style={styles.heroStatValue}>{formatFcfa(caEstime)}</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStat}>
            <Text style={styles.heroStatLabel}>Régime applicable</Text>
            <Text style={[styles.heroStatValue, { fontSize: 11 }]} numberOfLines={2}>{regime}</Text>
          </View>
        </View>

        {/* Bouton partager */}
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Feather name="share-2" size={15} color="#38bdf8" />
          <Text style={styles.shareBtnText}>Partager mon bilan sur WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Estimations */}
      <View style={[styles.estimCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Estimations fiscales</Text>
        <View style={styles.estimRow}>
          <View style={[styles.estimItem, { borderColor: "#fee2e2" }]}>
            <Feather name="percent" size={18} color="#ef4444" />
            <Text style={[styles.estimLabel, { color: colors.mutedForeground }]}>TVA collectée (18%)</Text>
            <Text style={[styles.estimValue, { color: "#ef4444" }]}>{formatFcfa(tva)}</Text>
          </View>
          <View style={[styles.estimItem, { borderColor: "#fef9c3" }]}>
            <Feather name="file" size={18} color="#ca8a04" />
            <Text style={[styles.estimLabel, { color: colors.mutedForeground }]}>Impôt estimé ({taxRate}%)</Text>
            <Text style={[styles.estimValue, { color: "#ca8a04" }]}>{formatFcfa(impotEstime)}</Text>
          </View>
        </View>
        <Text style={[styles.estimNote, { color: colors.mutedForeground }]}>
          Estimations indicatives. Consultez un expert-comptable agréé pour votre déclaration officielle à l'{authority}.
        </Text>
      </View>

      {/* Système Minimum de Trésorerie (SMT) */}
      <View style={[styles.smtCard, { backgroundColor: colors.card }]}>
        <View style={styles.smtHeader}>
          <View style={[styles.smtIcon, { backgroundColor: "#0ea5e920" }]}>
            <Feather name="clipboard" size={18} color="#0ea5e9" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Système Minimum de Trésorerie (SMT)</Text>
            <Text style={[styles.smtSub, { color: colors.mutedForeground }]}>Norme SYSCOHADA — Exercice {anneeEnCours}</Text>
          </View>
        </View>

        <View style={[styles.smtHero, { backgroundColor: "#0ea5e912" }]}>
          <Text style={[styles.smtHeroLabel, { color: colors.mutedForeground }]}>Chiffre d'Affaires Annuel SMT (Ventes)</Text>
          <Text style={styles.smtHeroValue}>{formatFcfa(smt.recettes)}</Text>
        </View>

        {/* Compte de résultat simplifié */}
        <View style={[styles.smtTable, { borderColor: colors.border }]}>
          <View style={[styles.smtRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.smtRowLabel, { color: colors.foreground }]}>Total des Recettes</Text>
            <Text style={[styles.smtRowValue, { color: "#16a34a" }]}>+{formatFcfa(smt.recettes)}</Text>
          </View>
          <View style={[styles.smtRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.smtRowLabel, { color: colors.foreground }]}>Total des Dépenses</Text>
            <Text style={[styles.smtRowValue, { color: "#dc2626" }]}>-{formatFcfa(smt.totalDepenses)}</Text>
          </View>
          <View style={styles.smtSubRow}>
            <Text style={[styles.smtSubLabel, { color: colors.mutedForeground }]}>— dont Achats</Text>
            <Text style={[styles.smtSubValue, { color: colors.mutedForeground }]}>-{formatFcfa(smt.achats)}</Text>
          </View>
          <View style={[styles.smtSubRow, { marginBottom: 10 }]}>
            <Text style={[styles.smtSubLabel, { color: colors.mutedForeground }]}>— dont Charges d'exploitation</Text>
            <Text style={[styles.smtSubValue, { color: colors.mutedForeground }]}>-{formatFcfa(smt.charges)}</Text>
          </View>
          <View style={[styles.smtTotalRow, { backgroundColor: smt.beneficeImposable >= 0 ? "#dcfce7" : "#fee2e2" }]}>
            <Text style={[styles.smtTotalLabel, { color: colors.foreground }]}>Bénéfice Imposable SMT</Text>
            <Text style={[styles.smtTotalValue, { color: smt.beneficeImposable >= 0 ? "#16a34a" : "#dc2626" }]}>
              {smt.beneficeImposable >= 0 ? "+" : ""}{formatFcfa(smt.beneficeImposable)}
            </Text>
          </View>
        </View>

        {/* Export Déclaration SMT */}
        <TouchableOpacity
          style={[styles.smtExportBtn, smtPdfLoading && { opacity: 0.6 }]}
          onPress={handleExportSmtPdf}
          disabled={smtPdfLoading}
        >
          <Feather name="file-text" size={16} color="#fff" />
          <Text style={styles.smtExportBtnText}>{smtPdfLoading ? "Génération..." : "Déclaration SMT (PDF)"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.smtWhatsappBtn} onPress={handleShareSmtWhatsapp}>
          <Feather name="message-circle" size={15} color="#25D366" />
          <Text style={styles.smtWhatsappBtnText}>Partager la déclaration sur WhatsApp</Text>
        </TouchableOpacity>

        <Text style={[styles.estimNote, { color: colors.mutedForeground, marginTop: 4 }]}>
          Déclaration simplifiée indicative. Ne remplace pas les formulaires officiels de l'{authority}.
        </Text>
      </View>

      {/* Analyses Avancées */}
      <View style={[styles.smtCard, { backgroundColor: colors.card }]}>
        <View style={styles.smtHeader}>
          <View style={[styles.smtIcon, { backgroundColor: "#8b5cf620" }]}>
            <Feather name="bar-chart-2" size={18} color="#8b5cf6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Analyses Avancées</Text>
            <Text style={[styles.smtSub, { color: colors.mutedForeground }]}>Basées sur vos flux de trésorerie réels</Text>
          </View>
        </View>

        {/* Situation Patrimoniale (Bilan Flash) */}
        <Text style={[styles.smtBlockTitle, { color: colors.foreground }]}>Situation Patrimoniale (Bilan Flash)</Text>
        <View style={styles.estimRow}>
          <View style={[styles.estimItem, { borderColor: "#dbeafe" }]}>
            <Feather name="dollar-sign" size={18} color="#2563eb" />
            <Text style={[styles.estimLabel, { color: colors.mutedForeground }]}>Disponibilités{"\n"}(Caisse)</Text>
            <Text style={[styles.estimValue, { color: "#2563eb" }]}>{formatFcfa(analyses.disponibilites)}</Text>
          </View>
          <View style={[styles.estimItem, { borderColor: "#ede9fe" }]}>
            <Feather name="package" size={18} color="#7c3aed" />
            <Text style={[styles.estimLabel, { color: colors.mutedForeground }]}>Actif Circulant{"\n"}(Stock)</Text>
            <Text style={[styles.estimValue, { color: "#7c3aed" }]}>{formatFcfa(analyses.actifCirculant)}</Text>
          </View>
        </View>
        <View style={[styles.smtTotalRow, { backgroundColor: "#f1f5f9", marginTop: -2 }]}>
          <Text style={[styles.smtTotalLabel, { color: colors.foreground }]}>Actif Total</Text>
          <Text style={[styles.smtTotalValue, { color: colors.foreground }]}>{formatFcfa(analyses.actifTotal)}</Text>
        </View>

        {/* Soldes de Gestion Flash (Mini-SIG) */}
        <Text style={[styles.smtBlockTitle, { color: colors.foreground, marginTop: 4 }]}>Soldes de Gestion Flash (Mini-SIG)</Text>
        <View style={[styles.smtTable, { borderColor: colors.border }]}>
          <View style={[styles.smtRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.smtRowLabel, { color: colors.foreground }]}>Marge Brute de Trésorerie</Text>
            <Text style={[styles.smtRowValue, { color: analyses.margeBrute >= 0 ? "#16a34a" : "#dc2626" }]}>
              {analyses.margeBrute >= 0 ? "+" : ""}{formatFcfa(analyses.margeBrute)}
            </Text>
          </View>
          <View style={styles.smtRow}>
            <Text style={[styles.smtRowLabel, { color: colors.foreground }]}>Ratio de Rentabilité</Text>
            <Text style={[styles.smtRowValue, { color: analyses.ratioRentabilite >= 0 ? "#16a34a" : "#dc2626" }]}>
              {analyses.ratioRentabilite >= 0 ? "+" : ""}{analyses.ratioRentabilite.toFixed(1)}%
            </Text>
          </View>
        </View>

        <Text style={[styles.estimNote, { color: colors.mutedForeground, marginTop: 4 }]}>
          Marge Brute = Total Ventes − Total Achats de marchandises. Ratio de Rentabilité = (Bénéfice Net / Chiffre d'Affaires) × 100. Inclus dans le rapport PDF de la déclaration SMT.
        </Text>
      </View>

      {/* Régimes */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginLeft: 4 }]}>
        Régimes fiscaux — {country}
      </Text>

      {regimes.map((r) => (
        <TouchableOpacity
          key={r.titre}
          onPress={() => setExpanded(expanded === r.titre ? null : r.titre)}
          style={[styles.regimeCard, { backgroundColor: colors.card }, regime === r.titre && { borderWidth: 2, borderColor: r.color }]}
        >
          <View style={styles.regimeHeader}>
            <View style={[styles.regimeIcon, { backgroundColor: r.color + "20" }]}>
              <Feather name={r.icon as never} size={20} color={r.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.regimeTitle, { color: colors.foreground }]} numberOfLines={2}>{r.titre}</Text>
              {regime === r.titre && (
                <View style={[styles.yourRegime, { backgroundColor: r.color }]}>
                  <Text style={styles.yourRegimeText}>VOTRE RÉGIME</Text>
                </View>
              )}
              <Text style={[styles.regimeSeuil, { color: colors.mutedForeground }]}>{r.seuil}</Text>
            </View>
            <Feather name={expanded === r.titre ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
          </View>
          {expanded === r.titre && (
            <View style={[styles.regimeBody, { borderTopColor: colors.border }]}>
              <Text style={[styles.regimeTaux, { color: r.color }]}>{r.taux}</Text>
              <Text style={[styles.regimeDesc, { color: colors.mutedForeground }]}>{r.desc}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}

      {/* Conseils */}
      <Text style={[styles.sectionTitle, { color: colors.foreground, marginLeft: 4, marginTop: 8 }]}>
        Conseils pratiques
      </Text>
      {conseils.map((c) => (
        <View key={c.titre} style={[styles.conseilCard, { backgroundColor: colors.card }]}>
          <View style={[styles.conseilIcon, { backgroundColor: colors.accent }]}>
            <Feather name={c.icon as never} size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.conseilTitle, { color: colors.foreground }]}>{c.titre}</Text>
            <Text style={[styles.conseilDesc, { color: colors.mutedForeground }]}>{c.desc}</Text>
          </View>
        </View>
      ))}

      {/* Renouveler si premium bientôt expiré */}
      {daysRemaining !== null && daysRemaining <= 5 && !fiscalExpired && (
        <TouchableOpacity style={styles.renewWarning} onPress={handleRenew} activeOpacity={0.85}>
          <Feather name="alert-triangle" size={16} color="#92400e" />
          <Text style={styles.renewWarningText}>
            Il vous reste {daysRemaining} jour{daysRemaining > 1 ? "s" : ""} — Renouveler sur WhatsApp
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  lockRoot: { flex: 1, padding: 24, justifyContent: "center" },
  lockCard: { borderRadius: 28, padding: 28, alignItems: "center", gap: 16 },
  lockTitle: { color: "#fff", fontSize: 22, fontWeight: "900", fontFamily: "Inter_700Bold", textAlign: "center" },
  lockSub: { color: "rgba(255,255,255,0.65)", fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  renewBtn: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#25D366", paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16 },
  renewBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, fontFamily: "Inter_700Bold" },
  tierInfo: { width: "100%", gap: 10 },
  tierInfoTitle: { color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  tierRow: { flexDirection: "row", gap: 10 },
  tierCard: { flex: 1, borderRadius: 14, borderWidth: 2, padding: 14, alignItems: "center", gap: 4 },
  tierName: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_700Bold" },
  tierDesc: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  heroCard: { borderRadius: 28, padding: 24 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  heroTopRight: { alignItems: "flex-end", gap: 6 },
  heroIcon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  heroBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  heroBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 1, fontFamily: "Inter_700Bold" },
  countdownBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  countdownText: { fontSize: 11, fontWeight: "800", fontFamily: "Inter_700Bold" },
  heroTitle: { color: "#fff", fontSize: 22, fontWeight: "900", fontFamily: "Inter_700Bold", marginBottom: 4 },
  heroSub: { color: "rgba(255,255,255,0.5)", fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 20 },
  heroStats: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, marginBottom: 14 },
  heroStat: { flex: 1, alignItems: "center", gap: 4 },
  heroStatDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.2)" },
  heroStatLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  heroStatValue: { color: "#fff", fontSize: 14, fontWeight: "800", fontFamily: "Inter_700Bold", textAlign: "center" },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.1)", paddingVertical: 12, borderRadius: 14 },
  shareBtnText: { color: "#38bdf8", fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },
  estimCard: { borderRadius: 20, padding: 18, gap: 12 },
  estimRow: { flexDirection: "row", gap: 12 },
  estimItem: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: "center", gap: 6 },
  estimLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  estimValue: { fontSize: 13, fontWeight: "800", fontFamily: "Inter_700Bold", textAlign: "center" },
  estimNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16, fontStyle: "italic" },
  sectionTitle: { fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold" },
  regimeCard: { borderRadius: 20, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  regimeHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  regimeIcon: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 2 },
  regimeTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  yourRegime: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4, marginBottom: 2 },
  yourRegimeText: { color: "#fff", fontSize: 9, fontWeight: "800", fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  regimeSeuil: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 4 },
  regimeBody: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 6 },
  regimeTaux: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  regimeDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  conseilCard: { flexDirection: "row", gap: 12, padding: 14, borderRadius: 16, alignItems: "flex-start" },
  conseilIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  conseilTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 4 },
  conseilDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  renewWarning: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fef3c7", padding: 14, borderRadius: 14 },
  renewWarningText: { flex: 1, color: "#92400e", fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },
  smtCard: { borderRadius: 20, padding: 18, gap: 14 },
  smtHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  smtIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  smtSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  smtBlockTitle: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 2 },
  smtHero: { borderRadius: 16, padding: 16, alignItems: "center", gap: 6 },
  smtHeroLabel: { fontSize: 12, fontFamily: "Inter_500Medium", textAlign: "center" },
  smtHeroValue: { fontSize: 24, fontWeight: "900", fontFamily: "Inter_700Bold", color: "#0ea5e9" },
  smtTable: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  smtRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1 },
  smtRowLabel: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  smtRowValue: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_700Bold" },
  smtSubRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingTop: 8 },
  smtSubLabel: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  smtSubValue: { fontSize: 12, fontFamily: "Inter_500Medium" },
  smtTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14 },
  smtTotalLabel: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_700Bold", flex: 1 },
  smtTotalValue: { fontSize: 16, fontWeight: "900", fontFamily: "Inter_700Bold" },
  smtExportBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#1e40af", paddingVertical: 14, borderRadius: 14 },
  smtExportBtnText: { color: "#fff", fontWeight: "800", fontSize: 14, fontFamily: "Inter_700Bold" },
  smtWhatsappBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#25D36615", paddingVertical: 12, borderRadius: 14 },
  smtWhatsappBtnText: { color: "#25D366", fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },
});
