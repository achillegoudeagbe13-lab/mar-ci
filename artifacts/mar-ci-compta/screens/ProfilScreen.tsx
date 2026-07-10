import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getAppShareUrl } from "@/lib/appUrl";

const APP_VERSION = "MAR-CI v1.0";
const ADMIN_WA = "https://wa.me/22898671631?text=Bonjour%20Achille%2C%20j%27ai%20besoin%20d%27aide%20avec%20MAR-CI%20Compta.";

const TIER_CONFIG = {
  gratuit: { label: "Gratuit", color: "#64748b", bg: "#f1f5f9", icon: "radio" as const, desc: "Essai 10 jours inclus" },
  premium: { label: "⭐ Premium", color: "#2563eb", bg: "#dbeafe", icon: "star" as const, desc: "Accès fiscal 30 jours" },
  vip: { label: "💎 VIP ★", color: "#eab308", bg: "#fef9c3", icon: "award" as const, desc: "Accès illimité à tout" },
};

interface Props {
  onClose: () => void;
}

type Section = "main" | "change-pwd";

export default function ProfilScreen({ onClose }: Props) {
  const colors = useColors();
  const { user, logout, changePassword, updateWhatsapp, updateAvatar, daysRemaining } = useAuth();

  const [section, setSection] = useState<Section>("main");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp ?? "");
  const [savingWa, setSavingWa] = useState(false);
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  if (!user) return null;

  const tier = TIER_CONFIG[user.tier];

  const handlePickAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission refusée", "Autorisez l'accès à la galerie dans les paramètres de votre téléphone.");
        return;
      }
      setAvatarLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.35,
        base64: true,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        const base64 = `data:image/jpeg;base64,${result.assets[0].base64}`;
        await updateAvatar(base64);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert("Erreur", "Impossible de charger l'image. Veuillez réessayer.");
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleSaveWhatsapp = async () => {
    const digits = whatsapp.replace(/\D/g, "");
    if (digits.length < 8) {
      Alert.alert("Numéro invalide", "Veuillez saisir un numéro WhatsApp valide (ex: 90000000).");
      return;
    }
    setSavingWa(true);
    await updateWhatsapp(digits);
    setSavingWa(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Enregistré ✓", "Votre numéro WhatsApp a été mis à jour.");
  };

  // Direct logout — no Alert.alert (blocked in iframe)
  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await logout();
      onClose();
      // Web fallback: force navigation to login screen
      if (Platform.OS === "web" && typeof window !== "undefined") {
        setTimeout(() => {
          try { window.location.reload(); } catch { /* ignore */ }
        }, 80);
      }
    } finally {
      setLogoutLoading(false);
    }
  };

  const handleShareApp = async () => {
    const text = `📱 Essaie MAR-CI Compta — l'app de comptabilité gratuite pour commerçants du Togo et du Bénin !\n\n${getAppShareUrl()}`;
    try {
      await Share.share({ message: text });
    } catch {
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPwd || !newPwd || !newPwd2) {
      Alert.alert("Champs requis", "Veuillez remplir tous les champs.");
      return;
    }
    if (newPwd !== newPwd2) {
      Alert.alert("Erreur", "Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    const result = await changePassword(oldPwd, newPwd);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès ✓", "Votre mot de passe a été modifié.");
      setOldPwd(""); setNewPwd(""); setNewPwd2("");
      setSection("main");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", result.error ?? "Une erreur est survenue.");
    }
  };

  // ─── Change password view ─────────────────────────────────────
  if (section === "change-pwd") {
    return (
      <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setSection("main")}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Changer le mot de passe</Text>
          <View style={{ width: 22 }} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Mot de passe actuel</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} />
            <TextInput style={[styles.input, { color: colors.foreground }]} value={oldPwd} onChangeText={setOldPwd} secureTextEntry={!showOld} placeholder="••••••" placeholderTextColor={colors.mutedForeground} />
            <TouchableOpacity onPress={() => setShowOld(!showOld)}>
              <Feather name={showOld ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Nouveau mot de passe</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} />
            <TextInput style={[styles.input, { color: colors.foreground }]} value={newPwd} onChangeText={setNewPwd} secureTextEntry={!showNew} placeholder="Min. 4 caractères" placeholderTextColor={colors.mutedForeground} />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Feather name={showNew ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Confirmer le nouveau mot de passe</Text>
          <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
            <Feather name="lock" size={16} color={colors.mutedForeground} />
            <TextInput style={[styles.input, { color: colors.foreground }]} value={newPwd2} onChangeText={setNewPwd2} secureTextEntry placeholder="Répéter" placeholderTextColor={colors.mutedForeground} />
          </View>
          <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleChangePassword}>
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>Enregistrer le nouveau mot de passe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ─── Main profile view ────────────────────────────────────────
  return (
    <ScrollView style={[styles.root, { backgroundColor: colors.background }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mon Profil</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Avatar card with photo upload */}
      <View style={[styles.avatarCard, { backgroundColor: colors.primary }]}>
        <TouchableOpacity style={styles.avatarWrap} onPress={handlePickAvatar} disabled={avatarLoading} activeOpacity={0.8}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarLetter}>{user.username.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.avatarCameraBtn}>
            {avatarLoading ? (
              <ActivityIndicator size="small" color="#1e40af" />
            ) : (
              <Feather name="camera" size={14} color="#1e40af" />
            )}
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarName}>{user.username}</Text>
        <Text style={styles.avatarCountry}>{user.country === "togo" ? "🇹🇬 Togo" : "🇧🇯 Bénin"}</Text>
        <Text style={styles.avatarHint}>Appuyez sur la photo pour la modifier</Text>
        <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
          <Feather name={tier.icon} size={13} color={tier.color} />
          <Text style={[styles.tierBadgeText, { color: tier.color }]}>{tier.label}</Text>
          {daysRemaining !== null && (
            <Text style={[styles.tierDays, { color: tier.color }]}>· J-{daysRemaining}</Text>
          )}
        </View>
      </View>

      {/* Tier info */}
      <View style={[styles.card, { backgroundColor: tier.bg, borderColor: tier.color, borderWidth: 1 }]}>
        <View style={styles.cardRow}>
          <Feather name={tier.icon} size={18} color={tier.color} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardLabel, { color: tier.color }]}>Statut du compte</Text>
            <Text style={[styles.cardValue, { color: tier.color }]}>{tier.label} — {tier.desc}</Text>
          </View>
        </View>
        {user.tier === "gratuit" && (
          <Text style={[styles.upgradeHint, { color: tier.color }]}>
            Passez en Premium ou VIP pour publier des annonces et accéder au fiscal. Contactez l'administrateur.
          </Text>
        )}
      </View>

      {/* WhatsApp number */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📞 Numéro WhatsApp</Text>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          Utilisé pour vos annonces partenaires. Saisissez votre numéro local (ex: 90000000).
        </Text>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.dialCode, { color: colors.mutedForeground }]}>+228</Text>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            value={whatsapp}
            onChangeText={setWhatsapp}
            placeholder="90 00 00 00"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: "#25D366", opacity: savingWa ? 0.7 : 1 }]} onPress={handleSaveWhatsapp} disabled={savingWa}>
          <Feather name="save" size={16} color="#fff" />
          <Text style={styles.saveBtnText}>{savingWa ? "Enregistrement…" : "Enregistrer le numéro"}</Text>
        </TouchableOpacity>
      </View>

      {/* Security */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔐 Sécurité</Text>
        <TouchableOpacity style={[styles.actionRow, { borderColor: colors.border }]} onPress={() => setSection("change-pwd")}>
          <Feather name="lock" size={18} color={colors.foreground} />
          <Text style={[styles.actionRowText, { color: colors.foreground }]}>Changer le mot de passe</Text>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Support */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>💬 Support & Infos</Text>
        <TouchableOpacity style={[styles.actionRow, { borderColor: colors.border, borderBottomWidth: 1 }]} onPress={() => Linking.openURL(ADMIN_WA)}>
          <Feather name="message-circle" size={18} color="#25D366" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionRowText, { color: colors.foreground }]}>Contacter l'administrateur</Text>
            <Text style={[styles.actionRowSub, { color: colors.mutedForeground }]}>Passage VIP, problème technique…</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionRow, { borderColor: "transparent" }]} onPress={handleShareApp}>
          <Feather name="share-2" size={18} color={colors.primary} />
          <Text style={[styles.actionRowText, { color: colors.primary }]}>Partager l'application</Text>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
        <View style={[styles.versionRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.versionText, { color: colors.mutedForeground }]}>{APP_VERSION} · Togo & Bénin</Text>
        </View>
      </View>

      {/* Logout — direct, no Alert.alert (blocked in iframe) */}
      <TouchableOpacity
        style={[styles.logoutBtn, { opacity: logoutLoading ? 0.7 : 1 }]}
        onPress={handleLogout}
        disabled={logoutLoading}
        activeOpacity={0.85}
      >
        {logoutLoading ? (
          <ActivityIndicator size="small" color="#ef4444" />
        ) : (
          <Feather name="log-out" size={20} color="#ef4444" />
        )}
        <Text style={styles.logoutText}>{logoutLoading ? "Déconnexion…" : "Se déconnecter"}</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 18, fontWeight: "800", fontFamily: "Inter_700Bold" },
  avatarCard: { borderRadius: 24, padding: 28, alignItems: "center", gap: 8 },
  avatarWrap: { position: "relative", marginBottom: 4 },
  avatarImage: { width: 80, height: 80, borderRadius: 24, borderWidth: 3, borderColor: "rgba(255,255,255,0.4)" },
  avatarCircle: { width: 80, height: 80, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  avatarLetter: { fontSize: 36, fontWeight: "900", color: "#fff", fontFamily: "Inter_700Bold" },
  avatarCameraBtn: { position: "absolute", bottom: -4, right: -4, width: 28, height: 28, borderRadius: 10, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 3 },
  avatarName: { fontSize: 22, fontWeight: "800", color: "#fff", fontFamily: "Inter_700Bold" },
  avatarCountry: { fontSize: 14, color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular" },
  avatarHint: { fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "Inter_400Regular", fontStyle: "italic" },
  tierBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginTop: 4 },
  tierBadgeText: { fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },
  tierDays: { fontSize: 12, fontFamily: "Inter_500Medium" },
  card: { borderRadius: 20, padding: 16, gap: 10 },
  cardRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 2 },
  cardValue: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  upgradeHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", marginBottom: 2 },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  inputRow: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  dialCode: { fontSize: 14, fontFamily: "Inter_500Medium" },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 14 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14, fontFamily: "Inter_700Bold" },
  fieldLabel: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold", marginBottom: 2 },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: 0 },
  actionRowText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  actionRowSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  versionRow: { borderTopWidth: 1, paddingTop: 10, marginTop: 4 },
  versionText: { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#fee2e2", paddingVertical: 16, borderRadius: 20, marginTop: 4 },
  logoutText: { color: "#ef4444", fontWeight: "800", fontSize: 16, fontFamily: "Inter_700Bold" },
});
