import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
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

import { Ad, AdContactType, AdTier, useApp } from "@/context/AppContext";
import { AppUser, UserTier, useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const PIN_KEY = "marci_admin_pin";
const DEFAULT_PIN = "1105";

const BADGE_COLORS = [
  { label: "Orange", value: "#f97316" },
  { label: "Vert", value: "#22c55e" },
  { label: "Bleu", value: "#2563eb" },
  { label: "Violet", value: "#8b5cf6" },
  { label: "Rouge", value: "#ef4444" },
  { label: "Or", value: "#eab308" },
];

const CONTACT_TYPES: { label: string; value: AdContactType; icon: string }[] = [
  { label: "WhatsApp", value: "whatsapp", icon: "message-circle" },
  { label: "Téléphone", value: "phone", icon: "phone" },
  { label: "Laba", value: "laba", icon: "send" },
  { label: "Email", value: "email", icon: "mail" },
  { label: "Site web", value: "web", icon: "globe" },
];

const AD_TIERS: { label: string; value: AdTier; color: string }[] = [
  { label: "⭐ Premium", value: "premium", color: "#eab308" },
  { label: "💎 VIP", value: "vip", color: "#94a3b8" },
  { label: "Gratuit", value: "gratuit", color: "#22c55e" },
];

const USER_TIERS: { label: string; value: UserTier; color: string }[] = [
  { label: "Gratuit", value: "gratuit", color: "#64748b" },
  { label: "Premium", value: "premium", color: "#2563eb" },
  { label: "VIP ★", value: "vip", color: "#eab308" },
];

interface Props {
  onClose: () => void;
  startUnlocked?: boolean;
}

const emptyForm = (): Omit<Ad, "id" | "dateAjout"> => ({
  titre: "", description: "", badge: "PARTENAIRE", badgeColor: "#f97316",
  icon: "star", cta: "Contacter sur WhatsApp", contact: "",
  contactType: "whatsapp", imageUrl: "", tier: "gratuit", actif: true,
});

type AdminTab = "pubs" | "users" | "notifs";
type AdminView = "list" | "form" | "pin-change" | "notif-send";

export default function AdminPubsScreen({ onClose, startUnlocked = false }: Props) {
  const colors = useColors();
  const { ads, addAd, updateAd, deleteAd, isDemoMode, toggleDemoMode, refreshAds } = useApp();
  const { users, updateUserTier, blockUser, adminResetPassword, sendNotification, fetchAllUsers } = useAuth();

  const [pin, setPin] = useState("");
  const [savedPin, setSavedPin] = useState(DEFAULT_PIN);
  const [unlocked, setUnlocked] = useState(startUnlocked);
  const [adminTab, setAdminTab] = useState<AdminTab>("pubs");
  const [view, setView] = useState<AdminView>("list");
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [newPin1, setNewPin1] = useState("");
  const [newPin2, setNewPin2] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);
  const [notifTarget, setNotifTarget] = useState<string>("all");
  const [notifMsg, setNotifMsg] = useState("");
  const [imageLoading, setImageLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Admin password reset inline
  const [resetPwdUserId, setResetPwdUserId] = useState<string | null>(null);
  const [resetPwdValue, setResetPwdValue] = useState("");

  const pinAttempts = useRef(0);

  useEffect(() => {
    AsyncStorage.getItem(PIN_KEY).then((v) => { if (v) setSavedPin(v); });
  }, []);

  useEffect(() => {
    if (unlocked) {
      fetchAllUsers();
      refreshAds();
    }
  }, [unlocked]);

  // ─── PIN Auth ─────────────────────────────────────────────────
  const handlePinSubmit = () => {
    if (pin === savedPin) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUnlocked(true);
      setPin("");
      pinAttempts.current = 0;
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      pinAttempts.current += 1;
      setPin("");
      if (pinAttempts.current >= 3) {
        Alert.alert("Accès bloqué", "Trop de tentatives incorrectes.");
        onClose();
      } else {
        Alert.alert("Code incorrect", `${3 - pinAttempts.current} tentative(s) restante(s).`);
      }
    }
  };

  // ─── Demo mode — direct, no Alert confirmation ────────────────
  const handleToggleDemo = async () => {
    setDemoLoading(true);
    await toggleDemoMode(!isDemoMode);
    setDemoLoading(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ─── Image Picker ─────────────────────────────────────────────
  const handlePickImage = async () => {
    try {
      setImageLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [16, 9], quality: 0.4, base64: true,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        setForm((f) => ({ ...f, imageUrl: `data:image/jpeg;base64,${result.assets[0].base64}` }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch { Alert.alert("Erreur", "Impossible de sélectionner l'image."); }
    finally { setImageLoading(false); }
  };

  // ─── Ad form ──────────────────────────────────────────────────
  const handleOpenForm = (ad?: Ad) => {
    if (ad) {
      setEditingAd(ad);
      setForm({ titre: ad.titre, description: ad.description, badge: ad.badge, badgeColor: ad.badgeColor, icon: ad.icon, cta: ad.cta, contact: ad.contact, contactType: ad.contactType, imageUrl: ad.imageUrl ?? "", tier: ad.tier ?? "gratuit", actif: ad.actif, ownerId: ad.ownerId, ownerUsername: ad.ownerUsername });
    } else { setEditingAd(null); setForm(emptyForm()); }
    setView("form");
  };

  const handleSaveAd = async () => {
    if (!form.titre.trim()) { Alert.alert("Erreur", "Le nom du partenaire est obligatoire."); return; }
    if (!form.contact.trim()) { Alert.alert("Erreur", "Le contact est obligatoire."); return; }
    setActionLoading("save");
    try {
      if (editingAd) await updateAd(editingAd.id, form); else await addAd(form);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setView("list");
    } catch { Alert.alert("Erreur", "La sauvegarde a échoué. Vérifiez la connexion."); }
    finally { setActionLoading(null); }
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

  const handleSavePin = async () => {
    if (newPin1.length < 4) { Alert.alert("Erreur", "Le code doit avoir au moins 4 chiffres."); return; }
    if (newPin1 !== newPin2) { Alert.alert("Erreur", "Les codes ne correspondent pas."); return; }
    await AsyncStorage.setItem(PIN_KEY, newPin1);
    setSavedPin(newPin1);
    setNewPin1(""); setNewPin2("");
    setView("list");
    Alert.alert("Succès", "Code PIN mis à jour.");
  };

  const handleSendNotif = async () => {
    if (!notifMsg.trim()) { Alert.alert("Erreur", "Le message est vide."); return; }
    await sendNotification(notifTarget, notifMsg.trim());
    setNotifMsg("");
    Alert.alert("Envoyé ✓", notifTarget === "all" ? "Message envoyé à tous les utilisateurs." : "Message envoyé.");
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // ─── Tier — direct, NO Alert confirmation (fixes iframe blocking) ─
  const handleUserTier = async (userId: string, tier: UserTier, currentTier: UserTier) => {
    if (tier === currentTier) return;
    if (actionLoading === userId) return;
    setActionLoading(userId);
    try {
      await updateUserTier(userId, tier, tier === "premium" ? 30 : undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Erreur", "La mise à jour a échoué. Vérifiez la connexion.");
    } finally { setActionLoading(null); }
  };

  // ─── Block — direct, NO Alert confirmation ────────────────────
  const handleBlock = async (u: AppUser) => {
    if (actionLoading === u.id + "_block") return;
    setActionLoading(u.id + "_block");
    try {
      await blockUser(u.id, !u.blocked);
      Haptics.notificationAsync(!u.blocked ? Haptics.NotificationFeedbackType.Warning : Haptics.NotificationFeedbackType.Success);
    } catch { Alert.alert("Erreur", "Le blocage a échoué."); }
    finally { setActionLoading(null); }
  };

  // ─── Admin password reset ─────────────────────────────────────
  const handleAdminResetPassword = async (userId: string) => {
    if (!resetPwdValue || resetPwdValue.length < 4) {
      Alert.alert("Erreur", "Le nouveau mot de passe doit avoir au moins 4 caractères."); return;
    }
    setActionLoading(userId + "_pwd");
    const result = await adminResetPassword(userId, resetPwdValue);
    setActionLoading(null);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès ✓", "Mot de passe réinitialisé.");
      setResetPwdUserId(null); setResetPwdValue("");
    } else { Alert.alert("Erreur", result.error ?? "Échec."); }
  };

  // ─── PIN screen ───────────────────────────────────────────────
  if (!unlocked) {
    return (
      <View style={[styles.pinScreen, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.xBtn} onPress={onClose}>
          <Feather name="x" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={styles.pinBox}>
          <View style={[styles.pinIconBg, { backgroundColor: colors.primary + "15" }]}>
            <Feather name="shield" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.pinTitle, { color: colors.foreground }]}>Espace Administrateur</Text>
          <Text style={[styles.pinSub, { color: colors.mutedForeground }]}>Saisissez le code PIN pour continuer.</Text>
          <TextInput style={[styles.pinInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="••••" placeholderTextColor={colors.mutedForeground} onSubmitEditing={handlePinSubmit} />
          <TouchableOpacity style={[styles.pinBtn, { backgroundColor: colors.primary }]} onPress={handlePinSubmit}>
            <Feather name="unlock" size={18} color="#fff" />
            <Text style={styles.pinBtnText}>Valider</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ─── Change PIN ───────────────────────────────────────────────
  if (view === "pin-change") {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.formContent}>
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setView("list")}><Feather name="arrow-left" size={22} color={colors.foreground} /></TouchableOpacity>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Changer le code PIN</Text>
          <View style={{ width: 22 }} />
        </View>
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Nouveau code PIN</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={newPin1} onChangeText={setNewPin1} keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="Min. 4 chiffres" placeholderTextColor={colors.mutedForeground} />
        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Confirmer le code</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={newPin2} onChangeText={setNewPin2} keyboardType="number-pad" secureTextEntry maxLength={6} placeholder="Répéter le code" placeholderTextColor={colors.mutedForeground} />
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSavePin}>
          <Feather name="check" size={18} color="#fff" /><Text style={styles.saveBtnText}>Enregistrer le PIN</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─── Ad Form ──────────────────────────────────────────────────
  if (view === "form") {
    const hasImage = !!(form.imageUrl && form.imageUrl.length > 10);
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => setView("list")}><Feather name="arrow-left" size={22} color={colors.foreground} /></TouchableOpacity>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>{editingAd ? "Modifier la pub" : "Nouvelle publicité"}</Text>
          <View style={{ width: 22 }} />
        </View>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Niveau de la pub</Text>
        <View style={styles.tierRow}>
          {AD_TIERS.map((t) => (
            <TouchableOpacity key={t.value} style={[styles.tierBtn, { borderColor: form.tier === t.value ? t.color : colors.border, backgroundColor: form.tier === t.value ? t.color + "15" : colors.card }]} onPress={() => setForm((f) => ({ ...f, tier: t.value }))}>
              <Text style={[styles.tierBtnText, { color: form.tier === t.value ? t.color : colors.mutedForeground }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Photo du partenaire</Text>
        <TouchableOpacity style={[styles.imagePicker, { borderColor: colors.border, backgroundColor: colors.card }]} onPress={handlePickImage} disabled={imageLoading}>
          {hasImage ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: form.imageUrl ?? undefined }} style={styles.imagePreview} resizeMode="cover" />
              <View style={styles.imageOverlay}><Feather name="camera" size={16} color="#fff" /><Text style={styles.imageOverlayText}>Changer la photo</Text></View>
            </View>
          ) : (
            <View style={styles.imagePickerEmpty}>
              <Feather name={imageLoading ? "loader" : "image"} size={24} color={colors.mutedForeground} />
              <Text style={[styles.imagePickerText, { color: colors.mutedForeground }]}>{imageLoading ? "Chargement…" : "Sélectionner une photo"}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Nom du partenaire *</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={form.titre} onChangeText={(v) => setForm((f) => ({ ...f, titre: v }))} placeholder="Ex: Boutique Kojo Lomé" placeholderTextColor={colors.mutedForeground} />

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Description</Text>
        <TextInput style={[styles.input, styles.inputMulti, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={form.description} onChangeText={(v) => setForm((f) => ({ ...f, description: v }))} placeholder="Courte description" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={3} />

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Type de contact</Text>
        <View style={styles.typeRow}>
          {CONTACT_TYPES.map((t) => (
            <TouchableOpacity key={t.value} style={[styles.typeBtn, { backgroundColor: form.contactType === t.value ? colors.primary : colors.card, borderColor: form.contactType === t.value ? colors.primary : colors.border }]} onPress={() => setForm((f) => ({ ...f, contactType: t.value, contact: "" }))}>
              <Feather name={t.icon as never} size={14} color={form.contactType === t.value ? "#fff" : colors.foreground} />
              <Text style={[styles.typeBtnTxt, { color: form.contactType === t.value ? "#fff" : colors.foreground }]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
          {form.contactType === "whatsapp" ? "Numéro WhatsApp *" : form.contactType === "phone" ? "Numéro téléphone *" : "Contact *"}
        </Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={form.contact} onChangeText={(v) => setForm((f) => ({ ...f, contact: v }))} placeholder={form.contactType === "whatsapp" || form.contactType === "phone" ? "Ex: 90000000 (sans +228)" : "Email ou URL"} placeholderTextColor={colors.mutedForeground} keyboardType={form.contactType === "whatsapp" || form.contactType === "phone" ? "phone-pad" : "default"} autoCapitalize="none" />

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Étiquette badge</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={form.badge} onChangeText={(v) => setForm((f) => ({ ...f, badge: v.toUpperCase() }))} placeholder="Ex: PARTENAIRE, PROMO…" placeholderTextColor={colors.mutedForeground} autoCapitalize="characters" />

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Couleur du badge</Text>
        <View style={styles.colorRow}>
          {BADGE_COLORS.map((c) => (
            <TouchableOpacity key={c.value} style={[styles.colorDot, { backgroundColor: c.value, borderWidth: form.badgeColor === c.value ? 3 : 0, borderColor: colors.foreground }]} onPress={() => setForm((f) => ({ ...f, badgeColor: c.value }))} />
          ))}
        </View>

        <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Texte du bouton</Text>
        <TextInput style={[styles.input, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]} value={form.cta} onChangeText={(v) => setForm((f) => ({ ...f, cta: v }))} placeholder="Ex: Contacter sur WhatsApp" placeholderTextColor={colors.mutedForeground} />

        <View style={styles.toggleRow}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground, marginBottom: 0 }]}>Publicité active</Text>
          <TouchableOpacity style={[styles.toggle, { backgroundColor: form.actif ? "#22c55e" : colors.border }]} onPress={() => setForm((f) => ({ ...f, actif: !f.actif }))}>
            <View style={[styles.toggleThumb, { transform: [{ translateX: form.actif ? 20 : 2 }] }]} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#22c55e", opacity: actionLoading === "save" ? 0.7 : 1 }]} onPress={handleSaveAd} disabled={actionLoading === "save"}>
          <Feather name="check" size={18} color="#fff" />
          <Text style={styles.saveBtnText}>{actionLoading === "save" ? "Sauvegarde…" : editingAd ? "Enregistrer les modifications" : "Publier la publicité"}</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // ─── Main list ────────────────────────────────────────────────
  const realAds = ads.filter((a) => !a.id.startsWith("__demo_"));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.listHeader}>
        <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>Administration</Text>
        <TouchableOpacity onPress={() => setView("pin-change")}><Feather name="settings" size={20} color={colors.mutedForeground} /></TouchableOpacity>
      </View>

      {/* Tab selector */}
      <View style={[styles.tabRow, { backgroundColor: colors.secondary }]}>
        {([["pubs", "radio", "Publicités"], ["users", "users", "Entreprises"], ["notifs", "bell", "Messages"]] as const).map(([tab, icon, label]) => (
          <TouchableOpacity key={tab} style={[styles.tabBtn, adminTab === tab && { backgroundColor: colors.primary }]} onPress={() => { setAdminTab(tab); Haptics.selectionAsync(); }}>
            <Feather name={icon as never} size={14} color={adminTab === tab ? "#fff" : colors.mutedForeground} />
            <Text style={[styles.tabBtnText, { color: adminTab === tab ? "#fff" : colors.mutedForeground }]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── PUBS TAB ── */}
      {adminTab === "pubs" && (
        <>
          {/* Demo toggle — direct action */}
          <View style={[styles.demoCard, { backgroundColor: isDemoMode ? "#fef3c7" : colors.card, borderColor: isDemoMode ? "#f59e0b" : colors.border }]}>
            <View style={styles.demoRow}>
              <View style={[styles.demoIconBg, { backgroundColor: isDemoMode ? "#fde68a" : colors.secondary }]}>
                <Feather name="eye" size={20} color={isDemoMode ? "#92400e" : colors.mutedForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.demoTitle, { color: isDemoMode ? "#92400e" : colors.foreground }]}>
                  Mode Démo {isDemoMode ? "— ACTIF ✓" : ""}
                </Text>
                <Text style={[styles.demoSub, { color: isDemoMode ? "#b45309" : colors.mutedForeground }]}>
                  {isDemoMode ? "Partenaires fictifs visibles (Samsung, Boutique sacs…)" : "Affiche des partenaires exemples dans toute l'app"}
                </Text>
              </View>
              <TouchableOpacity style={[styles.toggle, { backgroundColor: isDemoMode ? "#f59e0b" : colors.border }]} onPress={handleToggleDemo} disabled={demoLoading}>
                <View style={[styles.toggleThumb, { transform: [{ translateX: isDemoMode ? 20 : 2 }] }]} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Stats */}
          <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
            <View style={styles.statBox}><Text style={[styles.statNum, { color: colors.primary }]}>{realAds.length}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text></View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}><Text style={[styles.statNum, { color: "#eab308" }]}>{realAds.filter((a) => a.tier === "premium").length}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Premium</Text></View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}><Text style={[styles.statNum, { color: "#94a3b8" }]}>{realAds.filter((a) => a.tier === "vip").length}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>VIP</Text></View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}><Text style={[styles.statNum, { color: "#22c55e" }]}>{realAds.filter((a) => a.actif).length}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Actives</Text></View>
          </View>

          {realAds.length === 0 ? (
            <View style={styles.empty}><Feather name="radio" size={40} color={colors.mutedForeground} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucune publicité.{"\n"}Ajoutez votre premier partenaire !</Text></View>
          ) : (
            realAds.map((ad) => (
              <View key={ad.id} style={[styles.adRow, { backgroundColor: colors.card }]}>
                {ad.imageUrl && ad.imageUrl.length > 10 && (
                  <Image source={{ uri: ad.imageUrl ?? undefined }} style={styles.adRowImage} resizeMode="cover" />
                )}
                <View style={styles.adRowBody}>
                  <View style={styles.adRowTop}>
                    <View style={[styles.adRowBadge, { backgroundColor: ad.badgeColor + "20" }]}>
                      <Text style={[styles.adRowBadgeText, { color: ad.badgeColor }]}>{ad.badge}</Text>
                    </View>
                    <View style={[styles.adRowTier, { backgroundColor: ad.tier === "premium" ? "#fef9c3" : ad.tier === "vip" ? "#f1f5f9" : colors.secondary }]}>
                      <Text style={[styles.adRowTierText, { color: ad.tier === "premium" ? "#ca8a04" : ad.tier === "vip" ? "#64748b" : colors.mutedForeground }]}>
                        {ad.tier === "premium" ? "⭐ PREM" : ad.tier === "vip" ? "💎 VIP" : "Gratuit"}
                      </Text>
                    </View>
                    <View style={[styles.adRowStatus, { backgroundColor: ad.actif ? "#dcfce7" : "#fee2e2" }]}>
                      <Text style={[styles.adRowStatusText, { color: ad.actif ? "#16a34a" : "#dc2626" }]}>{ad.actif ? "Actif" : "Off"}</Text>
                    </View>
                  </View>
                  <Text style={[styles.adRowTitle, { color: colors.foreground }]} numberOfLines={1}>{ad.titre}</Text>
                  {ad.ownerUsername && <Text style={[styles.adRowOwner, { color: colors.mutedForeground }]}>Partenaire: {ad.ownerUsername}</Text>}
                  <View style={styles.adRowActions}>
                    <TouchableOpacity style={[styles.adRowBtn, { backgroundColor: colors.secondary }]} onPress={() => handleOpenForm(ad)}>
                      <Feather name="edit-2" size={14} color={colors.primary} />
                      <Text style={[styles.adRowBtnText, { color: colors.primary }]}>Modifier</Text>
                    </TouchableOpacity>
                    {confirmDeleteId === ad.id ? (
                      <View style={{ flexDirection: "row", gap: 6, flex: 1 }}>
                        <TouchableOpacity style={[styles.adRowBtn, { backgroundColor: "#ef4444", flex: 1 }]} onPress={() => handleDelete(ad.id)}>
                          <Feather name="check" size={14} color="#fff" />
                          <Text style={[styles.adRowBtnText, { color: "#fff" }]}>Confirmer</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.adRowBtn, { backgroundColor: colors.secondary }]} onPress={() => setConfirmDeleteId(null)}>
                          <Feather name="x" size={14} color={colors.foreground} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={[styles.adRowBtn, { backgroundColor: "#fee2e2" }]} onPress={() => handleDelete(ad.id)}>
                        <Feather name="trash-2" size={14} color="#ef4444" />
                        <Text style={[styles.adRowBtnText, { color: "#ef4444" }]}>Supprimer</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            ))
          )}

          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => handleOpenForm()}>
            <Feather name="plus" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Ajouter une publicité</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ── USERS TAB ── */}
      {adminTab === "users" && (
        <>
          <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
            <View style={styles.statBox}><Text style={[styles.statNum, { color: colors.primary }]}>{users.length}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text></View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}><Text style={[styles.statNum, { color: "#eab308" }]}>{users.filter((u) => u.tier === "premium").length}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Premium</Text></View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}><Text style={[styles.statNum, { color: "#94a3b8" }]}>{users.filter((u) => u.tier === "vip").length}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>VIP</Text></View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}><Text style={[styles.statNum, { color: "#ef4444" }]}>{users.filter((u) => u.blocked).length}</Text><Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Bloqués</Text></View>
          </View>

          {users.length === 0 ? (
            <View style={styles.empty}><Feather name="users" size={40} color={colors.mutedForeground} /><Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Aucun utilisateur inscrit.</Text></View>
          ) : (
            users.map((u) => {
              const adCount = realAds.filter((a) => a.ownerId === u.id).length;
              const isLoadingThis = actionLoading === u.id || actionLoading === u.id + "_block";
              return (
                <View key={u.id} style={[styles.userCard, { backgroundColor: colors.card, borderColor: u.blocked ? "#ef4444" : colors.border }]}>
                  <View style={styles.userCardTop}>
                    <View style={[styles.userAvatar, { backgroundColor: colors.primary + "15" }]}>
                      <Text style={[styles.userAvatarText, { color: colors.primary }]}>{u.username.charAt(0).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userName, { color: colors.foreground }]}>{u.username}</Text>
                      <Text style={[styles.userMeta, { color: colors.mutedForeground }]}>
                        {u.country === "togo" ? "🇹🇬" : "🇧🇯"} {u.whatsapp || "—"} · {adCount} annonce{adCount !== 1 ? "s" : ""}
                      </Text>
                    </View>
                    {u.blocked && (
                      <View style={[styles.blockedBadge, { backgroundColor: "#fee2e2" }]}>
                        <Text style={[styles.blockedBadgeText, { color: "#ef4444" }]}>BLOQUÉ</Text>
                      </View>
                    )}
                  </View>

                  {/* Tier selectors — direct action, no Alert */}
                  <View style={styles.tierSelectorRow}>
                    {USER_TIERS.map((t) => (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.userTierBtn, {
                          borderColor: u.tier === t.value ? t.color : colors.border,
                          backgroundColor: u.tier === t.value ? t.color + "20" : colors.card,
                          opacity: isLoadingThis ? 0.5 : 1,
                        }]}
                        onPress={() => handleUserTier(u.id, t.value, u.tier)}
                        disabled={!!actionLoading}
                      >
                        <Text style={[styles.userTierBtnText, { color: u.tier === t.value ? t.color : colors.mutedForeground, fontWeight: u.tier === t.value ? "800" : "400" }]}>
                          {actionLoading === u.id && u.tier !== t.value ? "…" : t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Block + Reset MDP */}
                  <View style={styles.userCardActions}>
                    <TouchableOpacity
                      style={[styles.userActionBtn, { backgroundColor: u.blocked ? "#dcfce7" : "#fee2e2", opacity: isLoadingThis ? 0.6 : 1 }]}
                      onPress={() => handleBlock(u)}
                      disabled={!!actionLoading}
                    >
                      <Feather name={u.blocked ? "unlock" : "slash"} size={14} color={u.blocked ? "#16a34a" : "#ef4444"} />
                      <Text style={[styles.userActionBtnText, { color: u.blocked ? "#16a34a" : "#ef4444" }]}>
                        {actionLoading === u.id + "_block" ? "…" : u.blocked ? "Débloquer" : "Bloquer"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.userActionBtn, { backgroundColor: "#eff6ff", borderColor: "#2563eb" }]}
                      onPress={() => { setResetPwdUserId(resetPwdUserId === u.id ? null : u.id); setResetPwdValue(""); }}
                    >
                      <Feather name="key" size={14} color="#2563eb" />
                      <Text style={[styles.userActionBtnText, { color: "#2563eb" }]}>Réinit. MDP</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Inline password reset form */}
                  {resetPwdUserId === u.id && (
                    <View style={[styles.resetPwdBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <TextInput
                        style={[styles.resetPwdInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.card }]}
                        value={resetPwdValue}
                        onChangeText={setResetPwdValue}
                        placeholder="Nouveau mot de passe (min. 4 car.)"
                        placeholderTextColor={colors.mutedForeground}
                        autoCapitalize="none"
                        secureTextEntry
                      />
                      <TouchableOpacity
                        style={[styles.resetPwdBtn, { backgroundColor: "#2563eb", opacity: actionLoading === u.id + "_pwd" ? 0.6 : 1 }]}
                        onPress={() => handleAdminResetPassword(u.id)}
                        disabled={actionLoading === u.id + "_pwd"}
                      >
                        <Feather name="check" size={16} color="#fff" />
                        <Text style={styles.resetPwdBtnText}>{actionLoading === u.id + "_pwd" ? "…" : "Confirmer"}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
          <TouchableOpacity style={[styles.refreshBtn, { borderColor: colors.border }]} onPress={fetchAllUsers}>
            <Feather name="refresh-cw" size={15} color={colors.primary} />
            <Text style={[styles.refreshBtnText, { color: colors.primary }]}>Actualiser la liste</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ── NOTIFS TAB ── */}
      {adminTab === "notifs" && (
        <View style={[styles.notifCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.formTitle, { color: colors.foreground }]}>Envoyer un message</Text>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Destinataire</Text>
          <View style={styles.typeRow}>
            <TouchableOpacity style={[styles.typeBtn, { backgroundColor: notifTarget === "all" ? colors.primary : colors.card, borderColor: notifTarget === "all" ? colors.primary : colors.border }]} onPress={() => setNotifTarget("all")}>
              <Feather name="users" size={14} color={notifTarget === "all" ? "#fff" : colors.foreground} />
              <Text style={[styles.typeBtnTxt, { color: notifTarget === "all" ? "#fff" : colors.foreground }]}>Tous</Text>
            </TouchableOpacity>
            {users.map((u) => (
              <TouchableOpacity key={u.id} style={[styles.typeBtn, { backgroundColor: notifTarget === u.id ? colors.primary : colors.card, borderColor: notifTarget === u.id ? colors.primary : colors.border }]} onPress={() => setNotifTarget(u.id)}>
                <Text style={[styles.typeBtnTxt, { color: notifTarget === u.id ? "#fff" : colors.foreground }]}>{u.username}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Message</Text>
          <TextInput style={[styles.input, styles.inputMulti, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]} value={notifMsg} onChangeText={setNotifMsg} placeholder="Votre message pour les utilisateurs…" placeholderTextColor={colors.mutedForeground} multiline numberOfLines={4} />
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSendNotif}>
            <Feather name="send" size={18} color="#fff" /><Text style={styles.saveBtnText}>Envoyer le message</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  pinScreen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  xBtn: { position: "absolute", top: 56, right: 20 },
  pinBox: { width: "100%", maxWidth: 360, alignItems: "center", gap: 16 },
  pinIconBg: { width: 80, height: 80, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  pinTitle: { fontSize: 22, fontWeight: "800", fontFamily: "Inter_700Bold" },
  pinSub: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  pinInput: { width: "100%", borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 20, paddingVertical: 16, fontSize: 24, textAlign: "center", fontWeight: "800", fontFamily: "Inter_700Bold", letterSpacing: 8 },
  pinBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, marginTop: 4 },
  pinBtnText: { color: "#fff", fontWeight: "700", fontSize: 16, fontFamily: "Inter_700Bold" },
  formContent: { padding: 20, gap: 12 },
  formHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  formTitle: { fontSize: 18, fontWeight: "800", fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, fontFamily: "Inter_700Bold", marginTop: 4, textTransform: "uppercase" },
  tierRow: { flexDirection: "row", gap: 8 },
  tierBtn: { flex: 1, borderWidth: 1.5, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  tierBtnText: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  imagePicker: { borderWidth: 1.5, borderStyle: "dashed", borderRadius: 16, overflow: "hidden" },
  imagePreviewWrap: { position: "relative" },
  imagePreview: { width: "100%", height: 140 },
  imageOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "rgba(0,0,0,0.5)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 8 },
  imageOverlayText: { color: "#fff", fontFamily: "Inter_500Medium", fontSize: 13 },
  imagePickerEmpty: { height: 100, alignItems: "center", justifyContent: "center", gap: 8 },
  imagePickerText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  input: { borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, fontFamily: "Inter_400Regular" },
  inputMulti: { height: 90, textAlignVertical: "top", paddingTop: 12 },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  typeBtnTxt: { fontSize: 12, fontFamily: "Inter_500Medium" },
  colorRow: { flexDirection: "row", gap: 12, paddingVertical: 4 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  toggle: { width: 44, height: 26, borderRadius: 13, justifyContent: "center" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 16 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, fontFamily: "Inter_700Bold" },
  listContent: { paddingBottom: 32, gap: 12 },
  listHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  listTitle: { fontSize: 20, fontWeight: "900", fontFamily: "Inter_700Bold" },
  tabRow: { flexDirection: "row", marginHorizontal: 16, borderRadius: 14, padding: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 11 },
  tabBtnText: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  demoCard: { marginHorizontal: 16, borderRadius: 16, padding: 14, borderWidth: 1.5 },
  demoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  demoIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  demoTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  demoSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statsRow: { flexDirection: "row", marginHorizontal: 16, borderRadius: 16, padding: 14 },
  statBox: { flex: 1, alignItems: "center", gap: 2 },
  statDivider: { width: 1, marginVertical: 4 },
  statNum: { fontSize: 22, fontWeight: "900", fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 40 },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  adRow: { marginHorizontal: 16, borderRadius: 16, overflow: "hidden" },
  adRowImage: { width: "100%", height: 100 },
  adRowBody: { padding: 14, gap: 6 },
  adRowTop: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  adRowBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  adRowBadgeText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  adRowTier: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  adRowTierText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  adRowStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  adRowStatusText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  adRowTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  adRowOwner: { fontSize: 11, fontFamily: "Inter_400Regular" },
  adRowActions: { flexDirection: "row", gap: 8, marginTop: 4 },
  adRowBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10 },
  adRowBtnText: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, marginHorizontal: 16, paddingVertical: 14, borderRadius: 16, marginTop: 4 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, fontFamily: "Inter_700Bold" },
  userCard: { marginHorizontal: 16, borderRadius: 18, padding: 16, gap: 12, borderWidth: 1.5 },
  userCardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  userAvatar: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  userAvatarText: { fontSize: 20, fontWeight: "900", fontFamily: "Inter_700Bold" },
  userName: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  userMeta: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  blockedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  blockedBadgeText: { fontSize: 10, fontWeight: "800", fontFamily: "Inter_700Bold" },
  tierSelectorRow: { flexDirection: "row", gap: 6 },
  userTierBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  userTierBtnText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  userCardActions: { flexDirection: "row", gap: 8 },
  userActionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1, borderColor: "transparent" },
  userActionBtnText: { fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  resetPwdBox: { flexDirection: "row", gap: 8, padding: 10, borderRadius: 12, borderWidth: 1 },
  resetPwdInput: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13, fontFamily: "Inter_400Regular" },
  resetPwdBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  resetPwdBtnText: { color: "#fff", fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },
  refreshBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, paddingVertical: 12, borderRadius: 14, borderWidth: 1.5 },
  refreshBtnText: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  notifCard: { marginHorizontal: 16, borderRadius: 20, padding: 20, gap: 12 },
});
