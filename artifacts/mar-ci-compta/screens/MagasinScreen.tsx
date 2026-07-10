import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import StockModal from "@/components/StockModal";
import { StockItem, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function formatFcfa(n: number) {
  return n.toLocaleString("fr-TG") + " FCFA";
}

const CAT_COLORS: Record<string, string> = {
  Électronique: "#3b82f6",
  Textile: "#a855f7",
  Alimentaire: "#22c55e",
  Cosmétiques: "#ec4899",
  Matériaux: "#f97316",
  Autres: "#64748b",
};

const LOW_STOCK_THRESHOLD = 3;

function StockCard({ item, onEdit, onDelete }: { item: StockItem; onEdit: (item: StockItem) => void; onDelete: (id: string) => void }) {
  const colors = useColors();
  const catColor = CAT_COLORS[item.categorie] ?? "#64748b";
  const isLow = item.quantite < LOW_STOCK_THRESHOLD;

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, isLow && styles.cardLow]}>
      <View style={styles.cardHeader}>
        <View style={[styles.catBadge, { backgroundColor: catColor + "20" }]}>
          <Text style={[styles.catText, { color: catColor }]}>{item.categorie}</Text>
        </View>
        {isLow && (
          <View style={styles.alertBadge}>
            <Feather name="alert-triangle" size={11} color="#ef4444" />
            <Text style={styles.alertText}>Stock bas</Text>
          </View>
        )}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); onEdit(item); }}
            style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
          >
            <Feather name="edit-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { Haptics.selectionAsync(); onDelete(item.id); }}
            style={[styles.actionBtn, { backgroundColor: "#fee2e2" }]}
          >
            <Feather name="trash-2" size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.itemName, { color: colors.foreground }]}>{item.nom}</Text>

      <View style={styles.cardFooter}>
        <View>
          <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Quantité</Text>
          <Text style={[styles.metaValue, { color: isLow ? "#ef4444" : colors.foreground }]}>
            {item.quantite} unités{isLow ? " ⚠️" : ""}
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Prix unit.</Text>
          <Text style={[styles.metaValue, { color: colors.foreground }]}>{formatFcfa(item.prixUnitaire)}</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.metaLabel, { color: colors.mutedForeground }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            {formatFcfa(item.quantite * item.prixUnitaire)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function MagasinScreen({ bottomPad }: { bottomPad: number }) {
  const colors = useColors();
  const { stocks, valeurMagasin, deleteStock } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);

  const lowStockCount = stocks.filter((s) => s.quantite < LOW_STOCK_THRESHOLD).length;

  const handleEdit = (item: StockItem) => { setEditItem(item); setShowModal(true); };
  const handleAdd = () => { setEditItem(null); setShowModal(true); };

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Résumé */}
        <View style={[styles.summaryCard, { backgroundColor: colors.primary }]}>
          <Text style={styles.summaryLabel}>VALEUR TOTALE DU STOCK</Text>
          <Text style={styles.summaryAmount}>{formatFcfa(valeurMagasin)}</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Articles</Text>
              <Text style={styles.summaryItemValue}>{stocks.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryItemLabel}>Unités totales</Text>
              <Text style={styles.summaryItemValue}>{stocks.reduce((s, i) => s + i.quantite, 0)}</Text>
            </View>
            {lowStockCount > 0 && (
              <>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryItemLabel}>Stock bas ⚠️</Text>
                  <Text style={[styles.summaryItemValue, { color: "#fca5a5" }]}>{lowStockCount}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Alerte stock bas */}
        {lowStockCount > 0 && (
          <View style={styles.alertBanner}>
            <Feather name="alert-triangle" size={16} color="#92400e" />
            <Text style={styles.alertBannerText}>
              {lowStockCount} article{lowStockCount > 1 ? "s" : ""} en stock bas (moins de {LOW_STOCK_THRESHOLD} unités) — pensez à commander !
            </Text>
          </View>
        )}

        <View style={styles.listHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Articles en stock</Text>
          <TouchableOpacity onPress={handleAdd} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Feather name="plus" size={18} color="#fff" />
            <Text style={styles.addBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {stocks.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Feather name="package" size={44} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Stock vide</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Ajoutez vos premiers articles pour gérer votre inventaire
            </Text>
            <TouchableOpacity
              onPress={handleAdd}
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
            >
              <Feather name="plus" size={20} color="#fff" />
              <Text style={styles.emptyBtnText}>Ajouter un article</Text>
            </TouchableOpacity>
          </View>
        ) : (
          stocks.map((item) => (
            <StockCard key={item.id} item={item} onEdit={handleEdit} onDelete={deleteStock} />
          ))
        )}
      </ScrollView>

      <StockModal visible={showModal} onClose={() => setShowModal(false)} editItem={editItem} />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  summaryCard: { borderRadius: 28, padding: 24 },
  summaryLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "800", letterSpacing: 1.5, fontFamily: "Inter_700Bold", marginBottom: 6 },
  summaryAmount: { color: "#fff", fontSize: 28, fontWeight: "900", fontFamily: "Inter_700Bold", marginBottom: 16 },
  summaryRow: { flexDirection: "row", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 16, padding: 12, alignItems: "center" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.3)" },
  summaryItemLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  summaryItemValue: { color: "#fff", fontSize: 18, fontWeight: "800", fontFamily: "Inter_700Bold" },
  alertBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fef3c7", padding: 12, borderRadius: 14 },
  alertBannerText: { flex: 1, color: "#92400e", fontWeight: "600", fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },
  card: { borderRadius: 20, padding: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardLow: { borderWidth: 1.5, borderColor: "#fca5a5" },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catText: { fontSize: 11, fontWeight: "700", fontFamily: "Inter_700Bold" },
  alertBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fee2e2", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  alertText: { fontSize: 10, color: "#ef4444", fontWeight: "700", fontFamily: "Inter_700Bold" },
  cardActions: { flexDirection: "row", gap: 8 },
  actionBtn: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemName: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 12 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  metaLabel: { fontSize: 10, fontFamily: "Inter_400Regular", marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  totalValue: { fontSize: 15, fontWeight: "800", fontFamily: "Inter_700Bold" },
  emptyState: { borderRadius: 20, padding: 40, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 14, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 20 },
  emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 16, marginTop: 8 },
  emptyBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, fontFamily: "Inter_700Bold" },
});
