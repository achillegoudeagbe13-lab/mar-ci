import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
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

import { StockItem, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  visible: boolean;
  onClose: () => void;
  editItem?: StockItem | null;
}

const CATEGORIES = [
  "Électronique",
  "Textile",
  "Alimentaire",
  "Cosmétiques",
  "Matériaux",
  "Autres",
];

export default function StockModal({ visible, onClose, editItem }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addStock, updateStock } = useApp();
  const [nom, setNom] = useState("");
  const [quantite, setQuantite] = useState("");
  const [prixUnitaire, setPrixUnitaire] = useState("");
  const [categorie, setCategorie] = useState("Électronique");

  useEffect(() => {
    if (editItem) {
      setNom(editItem.nom);
      setQuantite(editItem.quantite.toString());
      setPrixUnitaire(editItem.prixUnitaire.toString());
      setCategorie(editItem.categorie);
    } else {
      setNom("");
      setQuantite("");
      setPrixUnitaire("");
      setCategorie("Électronique");
    }
  }, [editItem, visible]);

  const handleSave = () => {
    const qty = parseInt(quantite);
    const prix = parseFloat(prixUnitaire.replace(/\s/g, "").replace(",", "."));
    if (!nom.trim() || !qty || qty <= 0 || !prix || prix <= 0) return;

    if (editItem) {
      updateStock(editItem.id, { nom: nom.trim(), quantite: qty, prixUnitaire: prix, categorie });
    } else {
      addStock({ nom: nom.trim(), quantite: qty, prixUnitaire: prix, categorie });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const styles = createStyles(colors);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top : 16 }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {editItem ? "Modifier Article" : "Nouvel Article"}
          </Text>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.saveBtnText}>
              {editItem ? "Modifier" : "Ajouter"}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Nom de l&apos;article</Text>
          <TextInput
            style={styles.input}
            value={nom}
            onChangeText={setNom}
            placeholder="Ex: Téléphones Samsung..."
            placeholderTextColor={colors.mutedForeground}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Quantité</Text>
              <TextInput
                style={styles.input}
                value={quantite}
                onChangeText={setQuantite}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Prix Unit. (FCFA)</Text>
              <TextInput
                style={styles.input}
                value={prixUnitaire}
                onChangeText={setPrixUnitaire}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={colors.mutedForeground}
              />
            </View>
          </View>

          <Text style={styles.label}>Catégorie</Text>
          <View style={styles.categories}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  categorie === cat && { backgroundColor: colors.primary },
                ]}
                onPress={() => {
                  setCategorie(cat);
                  Haptics.selectionAsync();
                }}
              >
                <Text
                  style={[
                    styles.catText,
                    { color: categorie === cat ? "#fff" : colors.mutedForeground },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {nom && quantite && prixUnitaire && (
            <View style={styles.totalPreview}>
              <Text style={styles.totalLabel}>Valeur totale estimée</Text>
              <Text style={[styles.totalAmount, { color: colors.primary }]}>
                {formatFcfa(
                  (parseInt(quantite) || 0) *
                    (parseFloat(prixUnitaire.replace(",", ".")) || 0)
                )}
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function formatFcfa(n: number) {
  return n.toLocaleString("fr-CI") + " FCFA";
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
    },
    closeBtn: {
      width: 36,
      height: 36,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    saveBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    saveBtnText: {
      color: "#fff",
      fontWeight: "700",
      fontSize: 14,
      fontFamily: "Inter_700Bold",
    },
    content: {
      padding: 20,
      gap: 12,
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    label: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.mutedForeground,
      letterSpacing: 0.5,
      fontFamily: "Inter_700Bold",
      marginTop: 4,
    },
    input: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      borderWidth: 1,
      borderColor: colors.border,
    },
    categories: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    catChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.secondary,
    },
    catText: {
      fontSize: 13,
      fontWeight: "600",
      fontFamily: "Inter_600SemiBold",
    },
    totalPreview: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      padding: 16,
      marginTop: 8,
      alignItems: "center",
    },
    totalLabel: {
      fontSize: 12,
      color: colors.accentForeground,
      fontFamily: "Inter_500Medium",
      marginBottom: 4,
    },
    totalAmount: {
      fontSize: 22,
      fontWeight: "900",
      fontFamily: "Inter_700Bold",
    },
  });
}
