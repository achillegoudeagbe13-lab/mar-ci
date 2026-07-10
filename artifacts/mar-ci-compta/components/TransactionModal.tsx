import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES_ENTREE = ["Ventes", "Services", "Remboursements", "Autres"];
const CATEGORIES_SORTIE = ["Achats", "Frais", "Salaires", "Transport", "Taxes", "Autres"];

export default function TransactionModal({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addTransaction, stocks, reduceStock } = useApp();

  const [type, setType] = useState<"entree" | "sortie">("entree");
  const [montant, setMontant] = useState("");
  const [description, setDescription] = useState("");
  const [categorie, setCategorie] = useState("Ventes");
  const [linkedStockId, setLinkedStockId] = useState<string | null>(null);
  const [linkedQty, setLinkedQty] = useState("1");
  const [showStockPicker, setShowStockPicker] = useState(false);

  const categories = type === "entree" ? CATEGORIES_ENTREE : CATEGORIES_SORTIE;
  const showStockLink = type === "entree" && categorie === "Ventes" && stocks.length > 0;
  const linkedStock = stocks.find((s) => s.id === linkedStockId);

  const handleTypeChange = (t: "entree" | "sortie") => {
    setType(t);
    setCategorie(t === "entree" ? "Ventes" : "Achats");
    setLinkedStockId(null);
    setLinkedQty("1");
    Haptics.selectionAsync();
  };

  const handleSave = () => {
    const amt = parseFloat(montant.replace(/\s/g, "").replace(",", "."));
    if (!amt || amt <= 0 || !description.trim()) return;

    const qty = parseInt(linkedQty) || 1;

    addTransaction({
      type,
      montant: amt,
      description: description.trim(),
      categorie,
      linkedStockId: linkedStockId ?? undefined,
      linkedStockQty: linkedStockId ? qty : undefined,
    });

    if (linkedStockId && qty > 0) {
      reduceStock(linkedStockId, qty);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMontant("");
    setDescription("");
    setCategorie(type === "entree" ? "Ventes" : "Achats");
    setLinkedStockId(null);
    setLinkedQty("1");
    onClose();
  };

  const s = createStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[s.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}>
          <TouchableOpacity onPress={onClose} style={s.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Nouvelle Transaction</Text>
          <TouchableOpacity
            onPress={handleSave}
            style={[s.saveBtn, { backgroundColor: type === "entree" ? colors.success : colors.destructive }]}
          >
            <Text style={s.saveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
          {/* Type toggle */}
          <View style={s.typeToggle}>
            <TouchableOpacity
              style={[s.typeBtn, type === "entree" && { backgroundColor: colors.success }]}
              onPress={() => handleTypeChange("entree")}
            >
              <Feather name="arrow-down-left" size={18} color={type === "entree" ? "#fff" : colors.mutedForeground} />
              <Text style={[s.typeBtnText, { color: type === "entree" ? "#fff" : colors.mutedForeground }]}>ENTRÉE</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.typeBtn, type === "sortie" && { backgroundColor: colors.destructive }]}
              onPress={() => handleTypeChange("sortie")}
            >
              <Feather name="arrow-up-right" size={18} color={type === "sortie" ? "#fff" : colors.mutedForeground} />
              <Text style={[s.typeBtnText, { color: type === "sortie" ? "#fff" : colors.mutedForeground }]}>SORTIE</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.label}>Montant (FCFA)</Text>
          <TextInput
            style={s.input}
            value={montant}
            onChangeText={setMontant}
            placeholder="0"
            keyboardType="numeric"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={s.label}>Description</Text>
          <TextInput
            style={s.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Ex: Vente de marchandises..."
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={s.label}>Catégorie</Text>
          <View style={s.categories}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[s.catChip, categorie === cat && { backgroundColor: colors.primary }]}
                onPress={() => { setCategorie(cat); Haptics.selectionAsync(); }}
              >
                <Text style={[s.catText, { color: categorie === cat ? "#fff" : colors.mutedForeground }]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Lien article stock (uniquement ENTRÉE > Ventes) */}
          {showStockLink && (
            <View style={[s.stockSection, { backgroundColor: "#f5f3ff", borderColor: "#7c3aed30" }]}>
              <View style={s.stockHeader}>
                <Feather name="package" size={16} color="#7c3aed" />
                <Text style={[s.stockTitle, { color: "#7c3aed" }]}>Lier à un article du stock</Text>
                <Text style={[s.stockOptional, { color: "#a78bfa" }]}>optionnel</Text>
              </View>

              <TouchableOpacity
                style={[s.stockPickerBtn, { backgroundColor: colors.card, borderColor: "#7c3aed30" }]}
                onPress={() => setShowStockPicker(!showStockPicker)}
              >
                <Text style={[s.stockPickerText, { color: linkedStock ? "#7c3aed" : colors.mutedForeground }]}>
                  {linkedStock ? `📦 ${linkedStock.nom}` : "Sélectionner un article…"}
                </Text>
                <Feather name={showStockPicker ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
              </TouchableOpacity>

              {showStockPicker && (
                <View style={[s.stockList, { backgroundColor: colors.card }]}>
                  <TouchableOpacity
                    style={s.stockItem}
                    onPress={() => { setLinkedStockId(null); setShowStockPicker(false); }}
                  >
                    <Text style={[s.stockItemText, { color: colors.mutedForeground }]}>— Aucun article —</Text>
                  </TouchableOpacity>
                  {stocks.map((st) => (
                    <TouchableOpacity
                      key={st.id}
                      style={[s.stockItem, linkedStockId === st.id && { backgroundColor: "#f5f3ff" }]}
                      onPress={() => { setLinkedStockId(st.id); setShowStockPicker(false); Haptics.selectionAsync(); }}
                    >
                      <Text style={[s.stockItemText, { color: colors.foreground }]}>{st.nom}</Text>
                      <Text style={[s.stockItemQty, { color: st.quantite < 3 ? "#ef4444" : colors.mutedForeground }]}>
                        {st.quantite} unités
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {linkedStock && (
                <View style={s.qtyRow}>
                  <Text style={[s.label, { color: "#7c3aed", marginTop: 0 }]}>Quantité vendue</Text>
                  <TextInput
                    style={[s.input, { borderColor: "#7c3aed30", marginTop: 4 }]}
                    value={linkedQty}
                    onChangeText={setLinkedQty}
                    keyboardType="numeric"
                    placeholder="1"
                    placeholderTextColor={colors.mutedForeground}
                  />
                  <Text style={[s.stockAvail, { color: "#a78bfa" }]}>
                    Stock disponible : {linkedStock.quantite} unités
                  </Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.card },
    closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
    headerTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    saveBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14, fontFamily: "Inter_700Bold" },
    content: { padding: 20, gap: 12 },
    typeToggle: { flexDirection: "row", gap: 12, marginBottom: 8 },
    typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.secondary },
    typeBtnText: { fontWeight: "800", fontSize: 13, letterSpacing: 1, fontFamily: "Inter_700Bold" },
    label: { fontSize: 12, fontWeight: "700", color: colors.mutedForeground, letterSpacing: 0.5, fontFamily: "Inter_700Bold", marginTop: 4 },
    input: { backgroundColor: colors.card, borderRadius: 14, padding: 16, fontSize: 16, color: colors.foreground, fontFamily: "Inter_400Regular", borderWidth: 1, borderColor: colors.border },
    categories: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.secondary },
    catText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    stockSection: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 10 },
    stockHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
    stockTitle: { fontWeight: "700", fontSize: 14, fontFamily: "Inter_700Bold" },
    stockOptional: { fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: "auto" },
    stockPickerBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderRadius: 12, padding: 12 },
    stockPickerText: { fontSize: 14, fontFamily: "Inter_500Medium" },
    stockList: { borderRadius: 12, overflow: "hidden" },
    stockItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
    stockItemText: { fontSize: 14, fontFamily: "Inter_500Medium" },
    stockItemQty: { fontSize: 12, fontFamily: "Inter_400Regular" },
    qtyRow: { gap: 4 },
    stockAvail: { fontSize: 11, fontFamily: "Inter_400Regular" },
  });
}
