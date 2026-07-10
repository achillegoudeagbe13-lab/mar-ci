import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BottomNav, { TabName } from "@/components/BottomNav";
import TransactionModal from "@/components/TransactionModal";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import AdminPubsScreen from "@/screens/AdminPubsScreen";
import BouclierScreen from "@/screens/BouclierScreen";
import DashboardScreen from "@/screens/DashboardScreen";
import JournalScreen from "@/screens/JournalScreen";
import LoginScreen from "@/screens/LoginScreen";
import MagasinScreen from "@/screens/MagasinScreen";
import ProfilScreen from "@/screens/ProfilScreen";
import PubsScreen from "@/screens/PubsScreen";
import SplashScreen from "@/screens/SplashScreen";

const NAV_HEIGHT = 80;
const SPLASH_KEY = "marci_splash_done";

const TIER_LABEL: Record<string, string> = {
  gratuit: "Gratuit",
  premium: "⭐ Premium",
  vip: "💎 VIP",
};
const TIER_COLOR: Record<string, string> = {
  gratuit: "#64748b",
  premium: "#2563eb",
  vip: "#eab308",
};

function NotificationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { user, markNotificationsRead } = useAuth();
  const notifs = user?.notifications ?? [];
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-TG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  useEffect(() => { if (visible) markNotificationsRead(); }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.notifModal, { backgroundColor: colors.background }]}>
        <View style={[styles.notifHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.notifTitle, { color: colors.foreground }]}>Notifications</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={colors.foreground} /></TouchableOpacity>
        </View>
        {notifs.length === 0 ? (
          <View style={styles.notifEmpty}>
            <Feather name="bell-off" size={36} color={colors.mutedForeground} />
            <Text style={[styles.notifEmptyText, { color: colors.mutedForeground }]}>Aucune notification</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.notifList}>
            {notifs.map((n) => (
              <View key={n.id} style={[styles.notifItem, { backgroundColor: colors.card }]}>
                <View style={[styles.notifDot, { backgroundColor: n.read ? colors.border : colors.primary }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.notifMsg, { color: colors.foreground }]}>{n.message}</Text>
                  <Text style={[styles.notifDate, { color: colors.mutedForeground }]}>{formatDate(n.date)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isAdmin, isLoading, logout, unreadCount, daysRemaining } = useAuth();

  // Splash: skip if user already has a valid session, or if they've already pressed Commencer this session
  const [splashDone, setSplashDone] = useState(false);
  const [activeTab, setActiveTab] = useState<TabName>("dashboard");
  const [showTxModal, setShowTxModal] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfil, setShowProfil] = useState(false);
  const isWeb = Platform.OS === "web";

  // Skip splash automatically if user has an active session or already pressed Commencer
  useEffect(() => {
    if (!isLoading && (user !== null || isAdmin)) {
      setSplashDone(true);
    }
  }, [isLoading, user, isAdmin]);

  // Auto-close profil modal when user logs out (covers web where Modal may not dismiss cleanly)
  useEffect(() => {
    if (!user && !isAdmin) {
      setShowProfil(false);
    }
  }, [user, isAdmin]);

  // Also restore the splash-done flag from AsyncStorage (persists until logout)
  useEffect(() => {
    AsyncStorage.getItem(SPLASH_KEY).then((v) => { if (v === "true") setSplashDone(true); });
  }, []);

  const handleStart = async () => {
    await AsyncStorage.setItem(SPLASH_KEY, "true");
    setSplashDone(true);
  };

  const topPad = isWeb ? 67 : insets.top;
  const bottomNavHeight = NAV_HEIGHT + (isWeb ? 0 : insets.bottom);
  const contentBottomPad = bottomNavHeight;

  const tabTitle: Record<TabName, string> = {
    dashboard: "Tableau de bord",
    magasin: "Mon Magasin",
    journal: "Journal des opérations",
    pubs: "Espace Publicitaire",
    bouclier: "Bouclier Fiscal",
  };

  // ─── Splash ────────────────────────────────────────────────────
  if (!splashDone || isLoading) {
    return <SplashScreen onStart={handleStart} isLoading={isLoading} />;
  }

  if (!user && !isAdmin) return <LoginScreen />;

  // ─── Admin panel ───────────────────────────────────────────────
  if (isAdmin) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.card} />
        <View style={[styles.topNav, { backgroundColor: colors.card, paddingTop: topPad, borderBottomColor: colors.border }]}>
          <View>
            <Text style={[styles.logo, { color: colors.primary }]}>MAR-CI <Text style={[styles.logoLight, { color: colors.primary }]}>Admin</Text></Text>
            <Text style={[styles.pageTitle, { color: colors.mutedForeground }]}>Panneau de contrôle</Text>
          </View>
          <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: "#fee2e2" }]} onPress={logout}>
            <Feather name="log-out" size={15} color="#ef4444" />
            <Text style={styles.logoutText}>Quitter</Text>
          </TouchableOpacity>
        </View>
        <AdminPubsScreen onClose={logout} startUnlocked />
      </View>
    );
  }

  // ─── Main app ──────────────────────────────────────────────────
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

      <View style={[styles.topNav, { backgroundColor: colors.card, paddingTop: topPad, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.logo, { color: colors.primary }]}>MAR-CI <Text style={[styles.logoLight, { color: colors.primary }]}>Compta</Text></Text>
          <Text style={[styles.pageTitle, { color: colors.mutedForeground }]}>{tabTitle[activeTab]}</Text>
        </View>

        <View style={styles.headerRight}>
          {user && (
            <View style={[styles.tierBadge, { backgroundColor: TIER_COLOR[user.tier] + "20" }]}>
              <Text style={[styles.tierText, { color: TIER_COLOR[user.tier] }]}>{TIER_LABEL[user.tier]}</Text>
              {daysRemaining !== null && <Text style={[styles.tierDays, { color: TIER_COLOR[user.tier] }]}> J-{daysRemaining}</Text>}
            </View>
          )}
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowNotifs(true)}>
            <Feather name="bell" size={20} color={colors.foreground} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.primary + "15", borderRadius: 12 }]} onPress={() => setShowProfil(true)}>
            <Text style={[styles.profileInitial, { color: colors.primary }]}>{user?.username?.charAt(0)?.toUpperCase() ?? "?"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ flex: 1 }}>
        {activeTab === "dashboard" && <DashboardScreen bottomPad={contentBottomPad} />}
        {activeTab === "magasin" && <MagasinScreen bottomPad={contentBottomPad} />}
        {activeTab === "journal" && <JournalScreen bottomPad={contentBottomPad} onAddPress={() => setShowTxModal(true)} />}
        {activeTab === "pubs" && <PubsScreen bottomPad={contentBottomPad} />}
        {activeTab === "bouclier" && <BouclierScreen bottomPad={contentBottomPad} />}
      </View>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} onFabPress={() => setShowTxModal(true)} />
      <TransactionModal visible={showTxModal} onClose={() => setShowTxModal(false)} />
      <NotificationsModal visible={showNotifs} onClose={() => setShowNotifs(false)} />
      <Modal visible={showProfil} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowProfil(false)}>
        <ProfilScreen onClose={() => setShowProfil(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  logo: { fontSize: 22, fontWeight: "900", fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  logoLight: { fontWeight: "300", fontStyle: "italic" },
  pageTitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  tierBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, flexDirection: "row", alignItems: "center" },
  tierText: { fontSize: 10, fontWeight: "800", fontFamily: "Inter_700Bold" },
  tierDays: { fontSize: 10, fontFamily: "Inter_700Bold" },
  iconBtn: { position: "relative", width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  profileInitial: { fontSize: 16, fontWeight: "900", fontFamily: "Inter_700Bold" },
  bellBadge: { position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800", fontFamily: "Inter_700Bold" },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12 },
  logoutText: { color: "#ef4444", fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },
  notifModal: { flex: 1 },
  notifHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 56, borderBottomWidth: 1 },
  notifTitle: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold" },
  notifEmpty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notifEmptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  notifList: { padding: 16, gap: 10 },
  notifItem: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 14 },
  notifDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  notifMsg: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  notifDate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4 },
});
