import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ad, AdTier, useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const BADGE_COLORS = [
  { label: "Orange", value: "#f97316" },
  { label: "Vert", value: "#22c55e" },
  { label: "Bleu", value: "#2563eb" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Rose", value: "#ec4899" },
  { label: "Or", value: "#eab308" },
];

interface Props {
  onClose: () => void;
}

type ScreenView = "list" | "form";

const emptyForm = (ownerId: string, ownerUsername: string): Omit<Ad, "id" | "dateAjout"> => ({
  titre: "",
  description: "",
  badge: "PARTENAIRE",
  badgeColor: "#f97316",
  icon: "star",
  cta: "Contacter sur WhatsApp",
  contact: "",
  contactType: "whatsapp",
  imageUrl: "",
  tier: "gratuit",
  actif: true,
  ownerId,
  ownerUsername,
});

export default function MesAnnoncesScreen({ onClose }: Props) {
  const colors = useColors();
  const { user } = useAuth();
  const { ads, addAd, updateAd, deleteAd } = useApp();

  const [view, setView] = useState<ScreenView>("list");
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [form, setForm] = useState<Omit<Ad, "id" | "dateAjout">>(
    emptyForm(user?.id ?? "", user?.username ?? "")
  );
  const [imageLoading, setImageLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!user) return null;

  const myAds = ads.filter((a) => a.ownerId === user.id);
  const isGratuit = user.tier === "gratuit";
  const canCreate = !isGratuit || myAds.length === 0;

  const isAdVisible = (ad: Ad) =>
    user.tier === "premium" || user.tier === "vip";

  const handleOpenForm = (ad?: Ad) => {
    if (ad) {
      setEditingAd(ad);
      setForm({
        titre: ad.titre, description: ad.description, badge: ad.badge,
        badgeColor: ad.badgeColor, icon: ad.icon, cta: ad.cta,
        contact: ad.contact, contactType: "whatsapp",
        imageUrl: ad.imageUrl ?? "", tier: ad.tier, actif: ad.actif,
        ownerId: ad.ownerId, ownerUsername: ad.ownerUsername,
      });
    } else {
      setEditingAd(null);
      setForm(emptyForm(user.id, user.username));
    }
    setView("form");
  };

  const handlePickImage = async () => {
    try {
      setImageLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.4,
        base64: true,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        const uri = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setForm((f) => ({ ...f, imageUrl: uri }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Erreur", "Impossible de sélectionner l'image.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleSave = () => {
    if (!form.titre.trim()) {
      Alert.alert("Erreur", "Le nom de votre activité est obligatoire.");
      return;
    }
    if (!form.contact.trim()) {
      Alert.alert("Erreur", "Votre numéro WhatsApp est obligatoire.");
      return;
    }
    if (editingAd) {
      updateAd(editingAd.id, form);
    } else {
      addAd(form);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setView("list");
  };

  const handleDelete = async (adId: string) => {
    if (confirmDeleteId !== adId) {
      setConfirmDeleteId(adId);
      return;
    }
    setConfirmDeleteId(null);
    await deleteAd(adId);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  };

  // ─── Form View ────────────────────────────────────────────────
  if (view === "form") {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setView("list")}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>
            {editingAd ? "Modifier mon annonce" : "Publier une annonce"}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        {isGratuit && (
          <View style={[styles.visibilityBanner, { backgroundColor: "#fef3c7" }]}>
            <Feather name="eye-off" size={15} color="#92400e" />
            <Text style={[styles.visibilityText, { color: "#92400e" }]}>
              Votre annonce sera visible uniquement après passage en Premium ou VIP. Contactez l'admin.
            </Text>
          </View>
        )}

        {/* Image picker */}
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Photo de votre activité</Text>
        <TouchableOpacity
          style={[styles.imagePicker, { borderColor: colors.border, backgroundColor: colors.card }]}
          onPress={handlePickImage}
          disabled={imageLoading}
        >
          {form.imageUrl ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: form.imageUrl }} style={styles.imagePreview} resizeMode="cover" />
              <View style={styles.imageOverlay}>
                <Feather name="camera" size={18} color="#fff" />
                <Text style={styles.imageOverlayText}>Changer</Text>
              </View>
            </View>
          ) : (
            <View style={styles.imagePickerEmpty}>
              <Feather name={imageLoading ? "loader" : "camera"} size={28} color={colors.mutedForeground} />
              <Text style={[styles.imagePickerText, { color: colors.mutedForeground }]}>
                {imageLoading ? "Chargement…" : "Sélectionner une photo"}
              </Text>
              <Text style={[styles.imagePickerSub, { color: colors.mutedForeground }]}>
                Format 16:9 recommandé · Compressée automatiquement
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Nom de votre activité *</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          value={form.titre}
          onChangeText={(v) => setForm((f) => ({ ...f, titre: v }))}
          placeholder="Ex: Boutique Kojo, Pharmacie Centrale…"
          placeholderTextColor={colors.mutedForeground}
        />

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Description de l'offre</Text>
        <TextInput
          style={[styles.input, styles.inputMulti, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          value={form.description}
          onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
          placeholder="Décrivez vos produits ou services en quelques mots"
          placeholderTextColor={colors.mutedForeground}
          multiline
          numberOfLines={3}
        />

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Numéro WhatsApp *</Text>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={[styles.dialCode, { color: colors.mutedForeground }]}>+228</Text>
          <TextInput
            style={[styles.inputFlex, { color: colors.foreground }]}
            value={form.contact}
            onChangeText={(v) => setForm((f) => ({ ...f, contact: v, contactType: "whatsapp" }))}
            placeholder="90 00 00 00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
          />
        </View>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Étiquette badge</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          value={form.badge}
          onChangeText={(v) => setForm((f) => ({ ...f, badge: v.toUpperCase() }))}
          placeholder="Ex: PROMO, BOUTIQUE, SERVICE…"
          placeholderTextColor={colors.mutedForeground}
          autoCapitalize="characters"
        />

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Couleur du badge</Text>
        <View style={styles.colorRow}>
          {BADGE_COLORS.map((c) => (
            <TouchableOpacity
              key={c.value}
              style={[styles.colorDot, { backgroundColor: c.value, borderWidth: form.badgeColor === c.value ? 3 : 0, borderColor: colors.foreground }]}
              onPress={() => setForm((f) => ({ ...f, badgeColor: c.value }))}
            />
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Texte du bouton</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
          value={form.cta}
          onChangeText={(v) => setForm((f) => ({ ...f, cta: v }))}
          placeholder="Ex: Contacter sur WhatsApp"
          placeholderTextColor={colors.mutedForeground}
        />

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: "#25D366" }]}
          onPress={handleSave}
        >
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>
            {editingAd ? "Enregistrer les modifications" : "Publier mon annonce"}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ─── List View ────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.listHeader}>
        <TouchableOpacity onPress={onClose}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>Mes Annonces</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Visibility info */}
      <View style={[styles.infoCard, {
        backgroundColor: isGratuit ? "#fef3c7" : user.tier === "vip" ? "#fef9c3" : "#dbeafe",
        borderColor: isGratuit ? "#f59e0b" : user.tier === "vip" ? "#eab308" : "#2563eb",
      }]}>
        <Feather
          name={isGratuit ? "eye-off" : "eye"}
          size={16}
          color={isGratuit ? "#92400e" : user.tier === "vip" ? "#854d0e" : "#1e40af"}
        />
        <Text style={[styles.infoText, { color: isGratuit ? "#92400e" : user.tier === "vip" ? "#854d0e" : "#1e40af" }]}>
          {isGratuit
            ? `Compte Gratuit — votre annonce n'est pas encore visible publiquement. Passez en Premium pour l'activer.`
            : `Compte ${user.tier === "vip" ? "VIP 💎" : "Premium ⭐"} — vos annonces sont visibles de tous les utilisateurs.`
          }
        </Text>
      </View>

      {myAds.length === 0 ? (
        <View style={[styles.empty, { backgroundColor: colors.card }]}>
          <Feather name="radio" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucune annonce</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Publiez votre première annonce pour vous faire connaître auprès des commerçants.
          </Text>
        </View>
      ) : (
        myAds.map((ad) => (
          <View key={ad.id} style={[styles.adCard, { backgroundColor: colors.card }]}>
            {ad.imageUrl ? (
              <Image source={{ uri: ad.imageUrl }} style={styles.adImage} resizeMode="cover" />
            ) : null}
            <View style={styles.adCardBody}>
              <View style={styles.adCardTop}>
                <View style={[styles.adBadge, { backgroundColor: ad.badgeColor + "20" }]}>
                  <Text style={[styles.adBadgeText, { color: ad.badgeColor }]}>{ad.badge}</Text>
                </View>
                <View style={[styles.visibilityPill, {
                  backgroundColor: isAdVisible(ad) ? "#dcfce7" : "#fef3c7",
                }]}>
                  <Feather
                    name={isAdVisible(ad) ? "eye" : "eye-off"}
                    size={11}
                    color={isAdVisible(ad) ? "#16a34a" : "#92400e"}
                  />
                  <Text style={[styles.visibilityPillText, { color: isAdVisible(ad) ? "#16a34a" : "#92400e" }]}>
                    {isAdVisible(ad) ? "Visible" : "Non visible"}
                  </Text>
                </View>
              </View>
              <Text style={[styles.adTitle, { color: colors.foreground }]}>{ad.titre}</Text>
              {ad.description ? (
                <Text style={[styles.adDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {ad.description}
                </Text>
              ) : null}
              <View style={styles.adActions}>
                <TouchableOpacity
                  style={[styles.adActionBtn, { backgroundColor: colors.secondary }]}
                  onPress={() => handleOpenForm(ad)}
                >
                  <Feather name="edit-2" size={15} color={colors.primary} />
                  <Text style={[styles.adActionText, { color: colors.primary }]}>Modifier</Text>
                </TouchableOpacity>
                {confirmDeleteId === ad.id ? (
                  <>
                    <TouchableOpacity
                      style={[styles.adActionBtn, { backgroundColor: "#ef4444" }]}
                      onPress={() => handleDelete(ad.id)}
                    >
                      <Feather name="check" size={15} color="#fff" />
                      <Text style={[styles.adActionText, { color: "#fff" }]}>Confirmer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.adActionBtn, { backgroundColor: colors.secondary }]}
                      onPress={() => setConfirmDeleteId(null)}
                    >
                      <Feather name="x" size={15} color={colors.foreground} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={[styles.adActionBtn, { backgroundColor: "#fee2e2" }]}
                    onPress={() => handleDelete(ad.id)}
                  >
                    <Feather name="trash-2" size={15} color="#ef4444" />
                    <Text style={[styles.adActionText, { color: "#ef4444" }]}>Supprimer</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))
      )}

      {canCreate ? (
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: colors.primary }]}
          onPress={() => handleOpenForm()}
        >
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.createBtnText}>Publier une nouvelle annonce</Text>
        </TouchableOpacity>
      ) : (
        <View style={[styles.limitCard, { backgroundColor: "#fee2e2" }]}>
          <Feather name="lock" size={18} color="#ef4444" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.limitTitle, { color: "#ef4444" }]}>Limite atteinte</Text>
            <Text style={[styles.limitText, { color: "#991b1b" }]}>
              Le compte Gratuit n'autorise qu'une seule annonce. Passez en Premium pour en publier plus.
            </Text>
          </View>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16, gap: 12 },
  listHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 8, paddingTop: 20 },
  listTitle: { fontSize: 18, fontWeight: "800", fontFamily: "Inter_700Bold" },
  infoCard: { flexDirection: "row", gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, alignItems: "flex-start" },
  infoText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  empty: { borderRadius: 20, padding: 32, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  adCard: { borderRadius: 20, overflow: "hidden" },
  adImage: { width: "100%", height: 140 },
  adCardBody: { padding: 14, gap: 8 },
  adCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  adBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  adBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5, fontFamily: "Inter_700Bold" },
  visibilityPill: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  visibilityPillText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  adTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  adDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  adActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  adActionBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  adActionText: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  createBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 20 },
  createBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, fontFamily: "Inter_700Bold" },
  limitCard: { flexDirection: "row", gap: 12, padding: 16, borderRadius: 16, alignItems: "flex-start" },
  limitTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 4 },
  limitText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  formContent: { padding: 16, gap: 10 },
  formHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 20, paddingBottom: 8 },
  formTitle: { fontSize: 17, fontWeight: "800", fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginTop: 4 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: "Inter_400Regular" },
  inputMulti: { minHeight: 90, textAlignVertical: "top" },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  inputFlex: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  dialCode: { fontSize: 14, fontFamily: "Inter_500Medium" },
  colorRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  colorDot: { width: 32, height: 32, borderRadius: 10 },
  imagePicker: { borderWidth: 1.5, borderRadius: 16, borderStyle: "dashed", overflow: "hidden" },
  imagePickerEmpty: { padding: 24, alignItems: "center", gap: 8 },
  imagePickerText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  imagePickerSub: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  imagePreviewWrap: { position: "relative" },
  imagePreview: { width: "100%", height: 160 },
  imageOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.45)", flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 10,
  },
  imageOverlayText: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  visibilityBanner: { flexDirection: "row", gap: 10, padding: 12, borderRadius: 14, alignItems: "flex-start" },
  visibilityText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 15, borderRadius: 16, marginTop: 8 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, fontFamily: "Inter_700Bold" },
});
