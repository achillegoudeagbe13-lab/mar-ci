import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { UserCountry, useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getAppShareUrl } from "@/lib/appUrl";
import AdminPubsScreen from "./AdminPubsScreen";

type Mode = "login" | "register" | "forgot";

export default function LoginScreen() {
  const colors = useColors();
  const { login, register, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState<UserCountry>("togo");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);

  // Forgot password fields
  const [forgotUsername, setForgotUsername] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotNewPwd, setForgotNewPwd] = useState("");
  const [forgotShowPwd, setForgotShowPwd] = useState(false);

  const logoTapCount = useRef(0);
  const logoTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoTap = () => {
    logoTapCount.current += 1;
    if (logoTapTimer.current) clearTimeout(logoTapTimer.current);
    logoTapTimer.current = setTimeout(() => { logoTapCount.current = 0; }, 2000);
    if (logoTapCount.current >= 5) {
      logoTapCount.current = 0;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAdminModalVisible(true);
    }
  };

  const handleSubmit = async () => {
    if (!username.trim() || !password) {
      Alert.alert("Champs requis", "Veuillez remplir tous les champs.");
      return;
    }
    if (mode === "register" && !phone.trim()) {
      Alert.alert("Téléphone requis", "Le numéro de téléphone est obligatoire pour l'inscription.");
      return;
    }
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = mode === "login"
      ? await login(username.trim(), password)
      : await register(username.trim(), password, country, phone.trim());
    setLoading(false);
    if (!result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", result.error ?? "Une erreur est survenue.");
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotUsername.trim()) {
      Alert.alert("Champ requis", "Entrez votre nom d'utilisateur.");
      return;
    }
    if (!forgotCode.trim()) {
      Alert.alert("Champ requis", "Entrez le code de déblocage reçu.");
      return;
    }
    if (!forgotNewPwd || forgotNewPwd.length < 4) {
      Alert.alert("Mot de passe invalide", "Le nouveau mot de passe doit avoir au moins 4 caractères.");
      return;
    }
    setLoading(true);
    const result = await resetPassword(forgotUsername.trim(), forgotCode.trim(), forgotNewPwd);
    setLoading(false);
    if (result.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Succès ✓", "Mot de passe réinitialisé. Connectez-vous avec votre nouveau mot de passe.", [
        { text: "Se connecter", onPress: () => { setMode("login"); setUsername(forgotUsername); setPassword(""); setForgotUsername(""); setForgotCode(""); setForgotNewPwd(""); } },
      ]);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Erreur", result.error ?? "Code incorrect.");
    }
  };

  const shareApp = async () => {
    const text = `📱 Essaie MAR-CI Compta — l'app de comptabilité gratuite pour commerçants du Togo et du Bénin !\n\n${getAppShareUrl()}`;
    try { await Share.share({ message: text }); }
    catch { Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`); }
  };

  const COUNTRIES: { value: UserCountry; label: string; flag: string; color: string }[] = [
    { value: "togo", label: "Togo", flag: "🇹🇬", color: "#22c55e" },
    { value: "benin", label: "Bénin", flag: "🇧🇯", color: "#f59e0b" },
  ];

  // ─── Forgot password screen ───────────────────────────────────
  if (mode === "forgot") {
    return (
      <>
        <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={[styles.forgotHeader, { backgroundColor: "#1e40af" }]}>
              <TouchableOpacity onPress={() => setMode("login")} style={styles.backBtn}>
                <Feather name="arrow-left" size={20} color="#fff" />
                <Text style={styles.backText}>Retour</Text>
              </TouchableOpacity>
              <View style={styles.forgotLogoWrap}>
                <View style={styles.forgotLogoBox}><Text style={styles.forgotLogoM}>M</Text></View>
                <Text style={styles.forgotLogoFinance}>finance</Text>
              </View>
              <Text style={styles.forgotTitle}>Récupération de compte</Text>
              <Text style={styles.forgotSubtitle}>Obtenez votre code de déblocage auprès de l'administrateur.</Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {/* Contact admin first */}
              <View style={[styles.infoBox, { backgroundColor: "#eff6ff", borderColor: "#2563eb" }]}>
                <Feather name="info" size={16} color="#2563eb" />
                <Text style={[styles.infoText, { color: "#1d4ed8" }]}>
                  Étape 1 — Contactez l'administrateur sur WhatsApp pour recevoir votre code de déblocage personnel.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.waBtn, { backgroundColor: "#25D366" }]}
                onPress={() => Linking.openURL("https://wa.me/22898671631?text=Bonjour%2C%20j%27ai%20oubli%C3%A9%20mon%20mot%20de%20passe%20MAR-CI%20Compta.%20Mon%20nom%20d%27utilisateur%20est%20:")}
              >
                <Feather name="message-circle" size={18} color="#fff" />
                <Text style={styles.waBtnText}>Contacter Admin — WhatsApp</Text>
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerLabel, { color: colors.mutedForeground }]}>— puis remplissez ci-dessous —</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Form */}
              <Text style={[styles.label, { color: colors.mutedForeground }]}>Votre nom d'utilisateur</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Feather name="user" size={17} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={forgotUsername}
                  onChangeText={setForgotUsername}
                  placeholder="Votre identifiant MAR-CI"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={[styles.label, { color: colors.mutedForeground }]}>Code de déblocage</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Feather name="key" size={17} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={forgotCode}
                  onChangeText={setForgotCode}
                  placeholder="Code reçu par l'administrateur"
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <Text style={[styles.label, { color: colors.mutedForeground }]}>Nouveau mot de passe</Text>
              <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
                <Feather name="lock" size={17} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.input, { color: colors.foreground }]}
                  value={forgotNewPwd}
                  onChangeText={setForgotNewPwd}
                  placeholder="Min. 4 caractères"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!forgotShowPwd}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setForgotShowPwd(!forgotShowPwd)}>
                  <Feather name={forgotShowPwd ? "eye-off" : "eye"} size={17} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: "#1e40af", opacity: loading ? 0.7 : 1 }]}
                onPress={handleForgotPassword}
                disabled={loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="unlock" size={18} color="#fff" />
                    <Text style={styles.submitText}>Réinitialiser le mot de passe</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <Text style={[styles.versionText, { color: colors.mutedForeground }]}>MAR-CI v1.0 · Togo & Bénin</Text>
          </ScrollView>
        </KeyboardAvoidingView>

        <Modal visible={adminModalVisible} animationType="slide" presentationStyle="pageSheet">
          <AdminPubsScreen onClose={() => setAdminModalVisible(false)} />
        </Modal>
      </>
    );
  }

  // ─── Login / Register ─────────────────────────────────────────
  return (
    <>
      <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Hero — 5 taps = admin */}
          <TouchableOpacity activeOpacity={1} onPress={handleLogoTap} style={[styles.hero, { backgroundColor: colors.primary }]}>
            <View style={styles.heroLogo}>
              <Text style={styles.heroLogoText}>MAR-CI</Text>
              <Text style={styles.heroLogoSub}>Compta</Text>
            </View>
            <Text style={styles.heroTagline}>La comptabilité simple pour les commerçants du Togo et du Bénin</Text>
            <View style={styles.heroBadges}>
              <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>🇹🇬 Togo · OTR</Text></View>
              <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>🇧🇯 Bénin · DGI</Text></View>
              <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>📴 Hors ligne</Text></View>
            </View>
          </TouchableOpacity>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            {/* Toggle login / register */}
            <View style={[styles.toggle, { backgroundColor: colors.secondary }]}>
              {(["login", "register"] as const).map((m) => (
                <TouchableOpacity key={m} style={[styles.toggleBtn, mode === m && { backgroundColor: colors.primary }]} onPress={() => { setMode(m); Haptics.selectionAsync(); }}>
                  <Text style={[styles.toggleText, { color: mode === m ? "#fff" : colors.mutedForeground }]}>
                    {m === "login" ? "Connexion" : "Inscription"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Country selector (register only) */}
            {mode === "register" && (
              <>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Votre pays</Text>
                <View style={styles.countryRow}>
                  {COUNTRIES.map((c) => (
                    <TouchableOpacity
                      key={c.value}
                      style={[styles.countryBtn, { borderColor: country === c.value ? c.color : colors.border, backgroundColor: country === c.value ? c.color + "15" : colors.background, borderWidth: country === c.value ? 2 : 1 }]}
                      onPress={() => { setCountry(c.value); Haptics.selectionAsync(); }}
                    >
                      <Text style={styles.countryFlag}>{c.flag}</Text>
                      <Text style={[styles.countryLabel, { color: country === c.value ? c.color : colors.foreground }]}>{c.label}</Text>
                      {country === c.value && <Feather name="check-circle" size={14} color={c.color} />}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Username */}
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Nom d'utilisateur</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Feather name="user" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={username}
                onChangeText={setUsername}
                placeholder="Votre identifiant"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Mot de passe</Text>
            <View style={[styles.inputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Feather name="lock" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPwd}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
                <Feather name={showPwd ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Forgot password — login only */}
            {mode === "login" && (
              <TouchableOpacity onPress={() => { setMode("forgot"); setForgotUsername(username); }} style={styles.forgotLink}>
                <Feather name="help-circle" size={13} color={colors.primary} />
                <Text style={[styles.forgotLinkText, { color: colors.primary }]}>Mot de passe oublié ?</Text>
              </TouchableOpacity>
            )}

            {/* Phone — register only, obligatoire */}
            {mode === "register" && (
              <>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>
                  Numéro de téléphone <Text style={{ color: "#ef4444" }}>*</Text>
                </Text>
                <View style={[styles.inputWrap, { borderColor: !phone ? "#ef4444" : colors.border, backgroundColor: colors.background }]}>
                  <Feather name="phone" size={18} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Ex: 90 00 00 00 (WhatsApp)"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="phone-pad"
                  />
                </View>
                <Text style={[styles.phoneHint, { color: colors.mutedForeground }]}>
                  Utilisé pour les notifications et la récupération de compte.
                </Text>
              </>
            )}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1, marginTop: mode === "register" ? 8 : 4 }]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name={mode === "login" ? "log-in" : "user-plus"} size={18} color="#fff" />
                  <Text style={styles.submitText}>{mode === "login" ? "Se connecter" : "Créer mon compte"}</Text>
                </>
              )}
            </TouchableOpacity>

            {mode === "register" && (
              <View style={[styles.infoBanner, { backgroundColor: colors.accent }]}>
                <Feather name="info" size={14} color={colors.primary} />
                <Text style={[styles.infoBannerText, { color: colors.primary }]}>
                  Compte gratuit — accès au Fiscal pendant 10 jours d'essai.
                </Text>
              </View>
            )}
          </View>

          {/* Share */}
          <TouchableOpacity style={[styles.shareBtn, { borderColor: colors.border }]} onPress={shareApp}>
            <Feather name="share-2" size={15} color={colors.primary} />
            <Text style={[styles.shareBtnText, { color: colors.primary }]}>Partager l'application</Text>
          </TouchableOpacity>

          <Text style={[styles.versionText, { color: colors.mutedForeground }]}>MAR-CI v1.0 · Togo & Bénin</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={adminModalVisible} animationType="slide" presentationStyle="pageSheet">
        <AdminPubsScreen onClose={() => setAdminModalVisible(false)} />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  hero: { paddingTop: 64, paddingBottom: 40, paddingHorizontal: 24, alignItems: "center", gap: 12 },
  heroLogo: { alignItems: "center" },
  heroLogoText: { color: "#fff", fontSize: 36, fontWeight: "900", fontFamily: "Inter_700Bold", letterSpacing: -1 },
  heroLogoSub: { color: "rgba(255,255,255,0.75)", fontSize: 20, fontWeight: "300", fontStyle: "italic", marginTop: -4 },
  heroTagline: { color: "rgba(255,255,255,0.85)", fontSize: 13, textAlign: "center", fontFamily: "Inter_400Regular", lineHeight: 19 },
  heroBadges: { flexDirection: "row", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  heroBadge: { backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  heroBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_500Medium" },
  card: { margin: 16, borderRadius: 24, padding: 20, gap: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 4 },
  toggle: { flexDirection: "row", borderRadius: 14, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
  toggleText: { fontWeight: "700", fontSize: 14, fontFamily: "Inter_700Bold" },
  label: { fontSize: 12, fontWeight: "700", letterSpacing: 0.5, fontFamily: "Inter_700Bold", marginTop: 4 },
  countryRow: { flexDirection: "row", gap: 10 },
  countryBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, padding: 12, borderRadius: 14 },
  countryFlag: { fontSize: 20 },
  countryLabel: { fontWeight: "700", fontFamily: "Inter_700Bold", fontSize: 14 },
  inputWrap: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  forgotLink: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-end", marginTop: -4 },
  forgotLinkText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  phoneHint: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: -4 },
  submitBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 16 },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16, fontFamily: "Inter_700Bold" },
  infoBanner: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12 },
  infoBannerText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  shareBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 16, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, marginTop: 8 },
  shareBtnText: { fontWeight: "700", fontSize: 14, fontFamily: "Inter_700Bold" },
  versionText: { textAlign: "center", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 12 },
  // Forgot password specific
  forgotHeader: { paddingTop: 64, paddingBottom: 32, paddingHorizontal: 24, alignItems: "center", gap: 12 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  backText: { color: "#fff", fontSize: 14, fontFamily: "Inter_500Medium" },
  forgotLogoWrap: { alignItems: "center", gap: 4 },
  forgotLogoBox: { width: 64, height: 64, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  forgotLogoM: { fontSize: 38, fontWeight: "900", color: "#1e40af", fontFamily: "Inter_700Bold" },
  forgotLogoFinance: { color: "rgba(255,255,255,0.8)", fontSize: 16, letterSpacing: 4, fontFamily: "Inter_400Regular" },
  forgotTitle: { color: "#fff", fontSize: 22, fontWeight: "900", fontFamily: "Inter_700Bold" },
  forgotSubtitle: { color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  infoBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, borderRadius: 14, borderWidth: 1.5 },
  infoText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  waBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 16 },
  waBtnText: { color: "#fff", fontWeight: "700", fontSize: 15, fontFamily: "Inter_700Bold" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
