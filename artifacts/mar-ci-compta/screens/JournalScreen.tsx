import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import React, { useState } from "react";
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

import TransactionDetailModal from "@/components/TransactionDetailModal";
import { Transaction, useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getAppShareHost, getAppShareUrl } from "@/lib/appUrl";

type Filter = "tous" | "entree" | "sortie";

function formatFcfa(n: number) {
  return n.toLocaleString("fr-TG") + " FCFA";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-TG", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-TG", { hour: "2-digit", minute: "2-digit" });
}

function buildPdfHtml(transactions: Transaction[], totalEntrees: number, totalSorties: number, solde: number, username: string, appHost: string): string {
  const today = new Date().toLocaleDateString("fr-TG", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const rows = transactions.map((tx) => {
    const isEntree = tx.type === "entree";
    const color = isEntree ? "#16a34a" : "#dc2626";
    const sign = isEntree ? "+" : "-";
    return `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#374151;">${formatDate(tx.date)} ${formatTime(tx.date)}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#374151;">${tx.description}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#6b7280;">${tx.categorie}</td>
        <td style="padding:10px 14px;border-bottom:1px solid #f1f5f9;font-size:13px;font-weight:700;color:${color};text-align:right;">${sign}${tx.montant.toLocaleString("fr-TG")} FCFA</td>
      </tr>`;
  }).join("");

  const soldeColor = solde >= 0 ? "#16a34a" : "#dc2626";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Journal — MAR-CI Compta</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, Helvetica, Arial, sans-serif; background: #fff; color: #111827; padding: 32px; }
    .header { display: flex; align-items: center; gap: 16px; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 2px solid #1e40af; }
    .logo-box { width: 52px; height: 52px; background: #1e40af; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
    .logo-m { font-size: 30px; font-weight: 900; color: #fff; }
    .header-info h1 { font-size: 20px; font-weight: 800; color: #1e40af; }
    .header-info p { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .meta { display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
    .meta-box { background: #f8fafc; border-radius: 12px; padding: 14px 20px; flex: 1; min-width: 140px; }
    .meta-label { font-size: 10px; font-weight: 700; letter-spacing: 0.5px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
    .meta-val { font-size: 17px; font-weight: 900; }
    .meta-val.green { color: #16a34a; }
    .meta-val.red { color: #dc2626; }
    .meta-val.blue { color: #1e40af; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    thead tr { background: #1e40af; }
    thead th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #fff; letter-spacing: 0.5px; text-transform: uppercase; }
    thead th:last-child { text-align: right; }
    tbody tr:nth-child(even) { background: #f9fafb; }
    .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; }
    .footer p { font-size: 11px; color: #94a3b8; font-style: italic; letter-spacing: 0.3px; }
    .footer strong { color: #1e40af; font-style: normal; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo-box"><span class="logo-m">M</span></div>
    <div class="header-info">
      <h1>MAR-CI Compta — Journal des opérations</h1>
      <p>Boutique : <strong>${username}</strong> &nbsp;·&nbsp; Date d'édition : ${today}</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-box">
      <div class="meta-label">📈 Total Entrées</div>
      <div class="meta-val green">+${totalEntrees.toLocaleString("fr-TG")} FCFA</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">📉 Total Sorties</div>
      <div class="meta-val red">-${totalSorties.toLocaleString("fr-TG")} FCFA</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">💰 Bénéfice Net</div>
      <div class="meta-val" style="color:${soldeColor};">${solde >= 0 ? "+" : ""}${solde.toLocaleString("fr-TG")} FCFA</div>
    </div>
    <div class="meta-box">
      <div class="meta-label">📋 Nb. Opérations</div>
      <div class="meta-val blue">${transactions.length}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Date & Heure</th>
        <th>Description</th>
        <th>Catégorie</th>
        <th style="text-align:right;">Montant</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="4" style="text-align:center;padding:20px;color:#94a3b8;">Aucune opération enregistrée</td></tr>'}
    </tbody>
  </table>

  <div class="footer">
    <p><strong>Généré par MAR-CI Compta</strong> — Votre allié de confiance &nbsp;·&nbsp; ${appHost}</p>
  </div>
</body>
</html>`;
}

function TxItem({ tx, onPress }: { tx: Transaction; onPress: (tx: Transaction) => void }) {
  const colors = useColors();
  const isEntree = tx.type === "entree";
  return (
    <TouchableOpacity
      style={[styles.txRow, { backgroundColor: colors.card, borderLeftColor: isEntree ? colors.success : colors.destructive }]}
      onPress={() => { Haptics.selectionAsync(); onPress(tx); }}
      activeOpacity={0.7}
    >
      <View style={[styles.txIcon, { backgroundColor: isEntree ? "#dcfce7" : "#fee2e2" }]}>
        <Feather name={isEntree ? "arrow-down-left" : "arrow-up-right"} size={16} color={isEntree ? colors.success : colors.destructive} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.txDesc, { color: colors.foreground }]} numberOfLines={1}>{tx.description}</Text>
        <Text style={[styles.txMeta, { color: colors.mutedForeground }]}>
          {tx.categorie} · {formatDate(tx.date)} à {formatTime(tx.date)}
        </Text>
        {tx.linkedStockId && (
          <View style={styles.stockLink}>
            <Feather name="package" size={10} color="#7c3aed" />
            <Text style={styles.stockLinkText}>Stock lié</Text>
          </View>
        )}
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text style={[styles.txAmount, { color: isEntree ? colors.success : colors.destructive }]}>
          {isEntree ? "+" : "-"}{formatFcfa(tx.montant)}
        </Text>
        <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

interface Props {
  bottomPad: number;
  onAddPress?: () => void;
}

export default function JournalScreen({ bottomPad, onAddPress }: Props) {
  const colors = useColors();
  const { transactions, totalEntrees, totalSorties, soldeCaisse, deleteTransaction } = useApp();
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("tous");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const filtered = transactions.filter((t) => filter === "tous" ? true : t.type === filter);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "tous", label: "Toutes" },
    { key: "entree", label: "Entrées" },
    { key: "sortie", label: "Sorties" },
  ];

  const handleExportPdf = async () => {
    if (transactions.length === 0) {
      Alert.alert("Journal vide", "Enregistrez d'abord des opérations avant de générer le PDF.");
      return;
    }
    setPdfLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const html = buildPdfHtml(transactions, totalEntrees, totalSorties, soldeCaisse, user?.username ?? "Votre boutique", getAppShareHost());
      if (Platform.OS === "web") {
        // Web : ouvrir une nouvelle fenêtre avec le HTML et déclencher l'impression
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
          await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: "Journal MAR-CI Compta" });
        } else {
          await Print.printAsync({ html });
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert("Erreur", "Impossible de générer le PDF. Veuillez réessayer.");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleShareWhatsapp = () => {
    if (transactions.length === 0) {
      Alert.alert("Journal vide", "Enregistrez d'abord des opérations pour partager un résumé.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const today = new Date().toLocaleDateString("fr-TG", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    const soldeSign = soldeCaisse >= 0 ? "+" : "";
    const soldeEmoji = soldeCaisse >= 0 ? "📈" : "📉";
    const text = [
      `*MAR-CI Compta — Rapport du ${today}*`,
      `🏪 Boutique : *${user?.username ?? "Ma boutique"}*`,
      ``,
      `📈 Total Entrées : *+${totalEntrees.toLocaleString("fr-TG")} FCFA*`,
      `📉 Total Sorties : *-${totalSorties.toLocaleString("fr-TG")} FCFA*`,
      `${soldeEmoji} Bénéfice Net : *${soldeSign}${soldeCaisse.toLocaleString("fr-TG")} FCFA*`,
      ``,
      `📋 Opérations enregistrées : *${transactions.length}*`,
      ``,
      `_Généré par MAR-CI Compta — Votre allié de confiance_`,
      `🔗 ${getAppShareHost()}`,
    ].join("\n");
    Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderTopColor: colors.success }]}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>ENTRÉES</Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>+{formatFcfa(totalEntrees)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderTopColor: colors.destructive }]}>
            <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>SORTIES</Text>
            <Text style={[styles.summaryAmount, { color: colors.destructive }]}>-{formatFcfa(totalSorties)}</Text>
          </View>
        </View>

        <View style={[styles.balanceRow, { backgroundColor: colors.primary }]}>
          <Text style={styles.balanceLabel}>SOLDE NET</Text>
          <Text style={styles.balanceValue}>{formatFcfa(soldeCaisse)}</Text>
        </View>

        {/* Export buttons */}
        <View style={styles.exportRow}>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: "#1e40af", opacity: pdfLoading ? 0.7 : 1 }]}
            onPress={handleExportPdf}
            disabled={pdfLoading}
            activeOpacity={0.85}
          >
            <Feather name={pdfLoading ? "loader" : "file-text"} size={15} color="#fff" />
            <Text style={styles.exportBtnText}>{pdfLoading ? "Génération…" : "Télécharger PDF"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.exportBtn, { backgroundColor: "#25D366" }]}
            onPress={handleShareWhatsapp}
            activeOpacity={0.85}
          >
            <Feather name="message-circle" size={15} color="#fff" />
            <Text style={styles.exportBtnText}>Partager WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => { Haptics.selectionAsync(); setFilter(f.key); }}
              style={[styles.filterChip, { backgroundColor: filter === f.key ? colors.primary : colors.secondary }]}
            >
              <Text style={[styles.filterText, { color: filter === f.key ? "#fff" : colors.mutedForeground }]}>{f.label}</Text>
              {filter === f.key && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{filtered.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Transaction list */}
        {filtered.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Feather name="inbox" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucune opération</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Enregistrez vos ventes et dépenses pour suivre votre trésorerie
            </Text>
            {onAddPress && (
              <TouchableOpacity
                onPress={onAddPress}
                style={[styles.emptyBtn, { backgroundColor: colors.success }]}
                activeOpacity={0.85}
              >
                <Feather name="plus" size={20} color="#fff" />
                <Text style={styles.emptyBtnText}>Nouvelle opération</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <Text style={[styles.countText, { color: colors.mutedForeground }]}>
              {filtered.length} opération{filtered.length > 1 ? "s" : ""}
            </Text>
            {filtered.map((tx) => <TxItem key={tx.id} tx={tx} onPress={setSelectedTx} />)}
          </>
        )}
      </ScrollView>

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onDelete={(id) => { deleteTransaction(id); setSelectedTx(null); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 18, borderTopWidth: 3, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  summaryLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1, fontFamily: "Inter_700Bold", marginBottom: 6 },
  summaryAmount: { fontSize: 14, fontWeight: "900", fontFamily: "Inter_700Bold" },
  balanceRow: { borderRadius: 18, padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  balanceLabel: { color: "rgba(255,255,255,0.75)", fontSize: 12, fontWeight: "800", letterSpacing: 1, fontFamily: "Inter_700Bold" },
  balanceValue: { color: "#fff", fontSize: 18, fontWeight: "900", fontFamily: "Inter_700Bold" },
  exportRow: { flexDirection: "row", gap: 10 },
  exportBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingVertical: 13, borderRadius: 16 },
  exportBtnText: { color: "#fff", fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },
  filterRow: { flexDirection: "row", gap: 8 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  filterBadge: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 },
  filterBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  countText: { fontSize: 12, fontFamily: "Inter_400Regular", marginLeft: 4 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderLeftWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  txIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  txMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  stockLink: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  stockLinkText: { fontSize: 10, color: "#7c3aed", fontFamily: "Inter_500Medium" },
  txAmount: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_700Bold" },
  emptyState: { borderRadius: 20, padding: 40, alignItems: "center", gap: 12, marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 20 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, fontFamily: "Inter_700Bold" },
});
