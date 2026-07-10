import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import TransactionDetailModal from "@/components/TransactionDetailModal";
import { Transaction, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function formatFcfa(n: number) {
  return n.toLocaleString("fr-TG") + " FCFA";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-TG", { day: "2-digit", month: "short" });
}

interface TransactionRowProps {
  tx: Transaction;
  onPress: (tx: Transaction) => void;
  onDelete: (id: string) => void;
}

function TransactionRow({ tx, onPress, onDelete }: TransactionRowProps) {
  const colors = useColors();
  const isEntree = tx.type === "entree";

  return (
    <TouchableOpacity
      style={[
        styles.txRow,
        {
          backgroundColor: colors.card,
          borderLeftColor: isEntree ? colors.success : colors.destructive,
        },
      ]}
      onPress={() => onPress(tx)}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.txIcon,
          { backgroundColor: isEntree ? "#dcfce7" : "#fee2e2" },
        ]}
      >
        <Feather
          name={isEntree ? "arrow-down-left" : "arrow-up-right"}
          size={16}
          color={isEntree ? colors.success : colors.destructive}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.txDesc, { color: colors.foreground }]}>{tx.description}</Text>
        <Text style={[styles.txMeta, { color: colors.mutedForeground }]}>
          {tx.categorie} · {formatDate(tx.date)}
        </Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <Text
          style={[
            styles.txAmount,
            { color: isEntree ? colors.success : colors.destructive },
          ]}
        >
          {isEntree ? "+" : "-"}{formatFcfa(tx.montant)}
        </Text>
        <Feather name="chevron-right" size={12} color={colors.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

interface Props {
  bottomPad: number;
}

export default function DashboardScreen({ bottomPad }: Props) {
  const colors = useColors();
  const { soldeCaisse, totalEntrees, totalSorties, valeurMagasin, transactions, deleteTransaction } = useApp();
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const recent = transactions.slice(0, 6);

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <View style={styles.balanceTop}>
            <Text style={styles.balanceLabel}>SOLDE DE CAISSE</Text>
            <View style={styles.offlineBadge}>
              <View style={styles.offlineDot} />
              <Text style={styles.offlineText}>HORS LIGNE</Text>
            </View>
          </View>
          <Text style={styles.balanceAmount}>{formatFcfa(soldeCaisse)}</Text>
          <Text style={styles.balanceDate}>
            {new Date().toLocaleDateString("fr-TG", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderLeftColor: colors.success }]}>
            <View style={[styles.statIconBg, { backgroundColor: "#dcfce7" }]}>
              <Feather name="trending-up" size={16} color={colors.success} />
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>ENTRÉES</Text>
            <Text style={[styles.statAmount, { color: colors.success }]}>
              +{formatFcfa(totalEntrees)}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderLeftColor: colors.destructive }]}>
            <View style={[styles.statIconBg, { backgroundColor: "#fee2e2" }]}>
              <Feather name="trending-down" size={16} color={colors.destructive} />
            </View>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>SORTIES</Text>
            <Text style={[styles.statAmount, { color: colors.destructive }]}>
              -{formatFcfa(totalSorties)}
            </Text>
          </View>
        </View>

        <View style={[styles.magasinCard, { backgroundColor: colors.card }]}>
          <View style={styles.magasinHeader}>
            <View>
              <Text style={[styles.magasinLabel, { color: colors.mutedForeground }]}>VALEUR MAGASIN</Text>
              <Text style={[styles.magasinAmount, { color: colors.primary }]}>
                {formatFcfa(valeurMagasin)}
              </Text>
            </View>
            <View style={[styles.magasinIconBg, { backgroundColor: colors.accent }]}>
              <Feather name="package" size={22} color={colors.primary} />
            </View>
          </View>

          <View style={styles.miniBarContainer}>
            {[0.2, 0.6, 0.4, 0.8, 0.5, 0.7, 0.45].map((h, i) => (
              <View
                key={i}
                style={[
                  styles.miniBar,
                  {
                    height: 36 * h,
                    backgroundColor: i === 6 ? colors.primary : colors.accent,
                    opacity: i === 6 ? 1 : 0.6 + i * 0.06,
                  },
                ]}
              />
            ))}
          </View>
        </View>

        {recent.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Opérations récentes
            </Text>
            <Text style={[styles.sectionHint, { color: colors.mutedForeground }]}>
              Appuyez sur une opération pour voir les détails
            </Text>
            {recent.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                onPress={setSelectedTx}
                onDelete={deleteTransaction}
              />
            ))}
          </>
        )}
      </ScrollView>

      <TransactionDetailModal
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        onDelete={(id) => {
          deleteTransaction(id);
          setSelectedTx(null);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  balanceCard: { borderRadius: 28, padding: 28 },
  balanceTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  balanceLabel: { color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, fontFamily: "Inter_700Bold" },
  offlineBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  offlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fbbf24" },
  offlineText: { color: "#fbbf24", fontSize: 10, fontWeight: "800", letterSpacing: 0.5, fontFamily: "Inter_700Bold" },
  balanceAmount: { color: "#fff", fontSize: 34, fontWeight: "900", marginBottom: 4, fontFamily: "Inter_700Bold" },
  balanceDate: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "capitalize" },
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 20, borderLeftWidth: 4, gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statIconBg: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 1, fontFamily: "Inter_700Bold" },
  statAmount: { fontSize: 14, fontWeight: "900", fontFamily: "Inter_700Bold" },
  magasinCard: { borderRadius: 24, padding: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  magasinHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  magasinLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1, fontFamily: "Inter_700Bold", marginBottom: 4 },
  magasinAmount: { fontSize: 20, fontWeight: "900", fontFamily: "Inter_700Bold" },
  magasinIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  miniBarContainer: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 48 },
  miniBar: { flex: 1, borderRadius: 6, minHeight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold", marginTop: 4 },
  sectionHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -6 },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 16, borderLeftWidth: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  txIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  txMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_700Bold" },
});
