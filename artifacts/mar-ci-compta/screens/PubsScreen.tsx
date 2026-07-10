import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import ImageZoomModal from "@/components/ImageZoomModal";
import { Ad, useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import AdminPubsScreen from "./AdminPubsScreen";
import MesAnnoncesScreen from "./MesAnnoncesScreen";

interface Props {
  bottomPad: number;
}

const OWNER_AD = {
  id: "__owner__",
  titre: "Besoin d'un Graphiste ou Développeur ?",
  description: "Logos, Affiches, Sites Web et Applis sur mesure. Achille Goudeagbe — disponible au Togo et au Bénin.",
  badge: "CRÉATEUR",
  badgeColor: "#7c3aed",
  icon: "cpu",
  cta: "Contacter sur WhatsApp",
  whatsappUrl: "https://wa.me/22898671631?text=Salut%20Achille%2C%20je%20t%27%C3%A9cris%20depuis%20MAR-CI%20pour%20un%20projet%20de%20design%2Fdev.",
};

function buildWhatsapp(phone: string, productName = "") {
  const digits = phone.replace(/\D/g, "");
  const full = digits.startsWith("228") ? digits : `228${digits}`;
  const msg = productName
    ? `Bonjour%2C%20je%20vous%20contacte%20via%20MAR-CI%20pour%20${encodeURIComponent(productName)}`
    : "Bonjour%2C%20je%20vous%20contacte%20via%20MAR-CI%20Compta.";
  return `https://wa.me/${full}?text=${msg}`;
}

function buildUrl(ad: Ad): string {
  const c = ad.contact.trim();
  switch (ad.contactType) {
    case "phone": return `tel:+228${c.replace(/\D/g, "")}`;
    case "whatsapp": return buildWhatsapp(c, ad.titre);
    case "laba": return `laba://chat?phone=228${c.replace(/\D/g, "")}`;
    case "email": return `mailto:${c}?subject=Contact%20via%20MAR-CI%20Compta`;
    case "web": return c.startsWith("http") ? c : `https://${c}`;
  }
}

function contactIcon(type: Ad["contactType"]) {
  switch (type) {
    case "phone": return "phone";
    case "whatsapp": return "message-circle";
    case "laba": return "send";
    case "email": return "mail";
    case "web": return "external-link";
  }
}

async function openUrl(url: string) {
  try { await Linking.openURL(url); } catch { /* ignore */ }
}

// ─── Carousel card (VIP / Premium) ───────────────────────────────
function CarouselCard({ ad, onImagePress }: { ad: Ad; onImagePress: (url: string, title: string) => void }) {
  const colors = useColors();
  const isVip = ad.tier === "vip";
  const borderColor = isVip ? "#eab308" : "#2563eb";
  const bgBadge = isVip ? "#fef9c3" : "#dbeafe";
  const labelColor = isVip ? "#ca8a04" : "#1e40af";
  const tierLabel = isVip ? "💎 VIP" : "⭐ PREMIUM";
  const hasImage = !!(ad.imageUrl && ad.imageUrl.length > 10);
  const ctaUrl = ad.contactType === "whatsapp" ? buildWhatsapp(ad.contact, ad.titre) : buildUrl(ad);

  return (
    <View style={[styles.carouselCard, { backgroundColor: colors.card, borderColor, shadowColor: borderColor }]}>
      {/* Tier ribbon */}
      <View style={[styles.carouselRibbon, { backgroundColor: bgBadge }]}>
        <Text style={[styles.carouselRibbonText, { color: labelColor }]}>{tierLabel}</Text>
      </View>

      {/* Image */}
      {hasImage ? (
        <TouchableOpacity activeOpacity={0.88} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onImagePress(ad.imageUrl!, ad.titre); }}>
          <Image source={{ uri: ad.imageUrl! }} style={styles.carouselImage} resizeMode="cover" />
          <View style={styles.zoomHint}>
            <Feather name="zoom-in" size={12} color="#fff" />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.carouselNoImage, { backgroundColor: ad.badgeColor + "12" }]}>
          <Feather name={ad.icon as never} size={38} color={ad.badgeColor} />
        </View>
      )}

      <View style={styles.carouselBody}>
        <View style={[styles.inlineBadge, { backgroundColor: ad.badgeColor + "20" }]}>
          <Text style={[styles.inlineBadgeText, { color: ad.badgeColor }]}>{ad.badge}</Text>
        </View>
        <Text style={[styles.carouselTitle, { color: colors.foreground }]} numberOfLines={2}>{ad.titre}</Text>
        {ad.description ? (
          <Text style={[styles.carouselDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
            {ad.description}
          </Text>
        ) : null}
        <TouchableOpacity
          style={[styles.carouselCta, { backgroundColor: ad.contactType === "whatsapp" ? "#25D366" : ad.badgeColor }]}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openUrl(ctaUrl); }}
          activeOpacity={0.85}
        >
          <Feather name={contactIcon(ad.contactType) as never} size={14} color="#fff" />
          <Text style={styles.carouselCtaText} numberOfLines={1}>{ad.cta}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Vertical list card ───────────────────────────────────────────
function AdCard({ ad, onImagePress }: { ad: Ad; onImagePress: (url: string, title: string) => void }) {
  const colors = useColors();
  const tier = ad.tier ?? "gratuit";
  const isPremium = tier === "premium";
  const isVip = tier === "vip";
  const tierBorderColor = isVip ? "#eab308" : isPremium ? "#2563eb" : "transparent";
  const tierBgColor = isVip ? "#fef9c3" : isPremium ? "#dbeafe" : "transparent";
  const tierLabel = isVip ? "💎 VIP" : isPremium ? "⭐ PREMIUM" : null;
  const tierTextColor = isVip ? "#ca8a04" : "#1e40af";
  const hasImage = !!(ad.imageUrl && ad.imageUrl.length > 10);

  return (
    <View style={[styles.adCard, { backgroundColor: colors.card, borderColor: tierBorderColor, borderWidth: (isPremium || isVip) ? 2 : 0 }]}>
      {tierLabel && (
        <View style={[styles.tierBanner, { backgroundColor: tierBgColor }]}>
          <Text style={[styles.tierBannerText, { color: tierTextColor }]}>{tierLabel}</Text>
        </View>
      )}
      {hasImage && (
        <TouchableOpacity activeOpacity={0.88} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onImagePress(ad.imageUrl!, ad.titre); }}>
          <Image source={{ uri: ad.imageUrl! }} style={styles.adImage} resizeMode="cover" />
          <View style={styles.zoomHint}>
            <Feather name="zoom-in" size={14} color="#fff" />
            <Text style={styles.zoomHintText}>Agrandir</Text>
          </View>
        </TouchableOpacity>
      )}
      <View style={styles.adTop}>
        <View style={[styles.adIconBg, { backgroundColor: ad.badgeColor + "15" }]}>
          <Feather name={ad.icon as never} size={24} color={ad.badgeColor} />
        </View>
        <View style={[styles.adBadge, { backgroundColor: ad.badgeColor + "20" }]}>
          <Text style={[styles.adBadgeText, { color: ad.badgeColor }]}>{ad.badge}</Text>
        </View>
      </View>
      <Text style={[styles.adTitle, { color: colors.foreground }]}>{ad.titre}</Text>
      {ad.description ? (
        <Text style={[styles.adDesc, { color: colors.mutedForeground }]}>{ad.description}</Text>
      ) : null}
      <TouchableOpacity
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openUrl(ad.contactType === "whatsapp" ? buildWhatsapp(ad.contact, ad.titre) : buildUrl(ad)); }}
        style={[styles.adCta, { backgroundColor: ad.contactType === "whatsapp" ? "#25D366" : ad.badgeColor }]}
      >
        <Text style={styles.adCtaText}>{ad.cta}</Text>
        <Feather name={contactIcon(ad.contactType) as never} size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default function PubsScreen({ bottomPad }: Props) {
  const colors = useColors();
  const { ads, refreshAds } = useApp();
  const { user, fetchAllUsers } = useAuth();

  const [adminVisible, setAdminVisible] = useState(false);
  const [partenaireVisible, setPartenaireVisible] = useState(false);
  const [mesAnnoncesVisible, setMesAnnoncesVisible] = useState(false);
  const [zoomImage, setZoomImage] = useState("");
  const [zoomTitle, setZoomTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const headerTapCount = useRef(0);
  const headerTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch ads + users on mount, independently of admin state ──
  // This ensures the public tab NEVER depends on having visited Admin first.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([refreshAds(), fetchAllUsers()]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleImagePress = (url: string, title: string) => {
    setZoomImage(url);
    setZoomTitle(title);
  };

  // ─── Visibility logic (uses ad's own tier — no dependency on users list) ──
  // There is no manual admin validation step: any ad marked "actif" by its
  // owner (visible in "Mes Annonces") MUST appear in the public feed too.
  // Tier (gratuit/premium/vip) only affects placement (carousel eligibility
  // and card styling), never whether the ad is shown at all.
  const visibleAds = ads.filter((ad) => ad.actif !== false);

  // Carousel: VIP + Premium ads sorted newest first
  const carouselAds = [...visibleAds]
    .filter((a) => a.tier === "premium" || a.tier === "vip")
    .sort((a, b) => new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime());

  // All visible ads sorted newest first (for vertical list)
  const allSorted = [...visibleAds]
    .sort((a, b) => new Date(b.dateAjout).getTime() - new Date(a.dateAjout).getTime());

  const handleHeaderTap = () => {
    headerTapCount.current += 1;
    if (headerTapTimer.current) clearTimeout(headerTapTimer.current);
    headerTapTimer.current = setTimeout(() => { headerTapCount.current = 0; }, 2000);
    if (headerTapCount.current >= 5) {
      headerTapCount.current = 0;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAdminVisible(true);
    }
  };

  const CONTACTS_REGIE = [
    { label: "WhatsApp — 98 67 16 31", icon: "message-circle" as const, color: "#25D366", url: buildWhatsapp("98671631", "publicit%C3%A9%20MAR-CI%20Compta") },
    { label: "Laba — 98 67 16 31", icon: "send" as const, color: "#7c3aed", url: "laba://chat?phone=22898671631" },
    { label: "Appel — 92 42 65 13", icon: "phone" as const, color: "#2563eb", url: "tel:+22892426513" },
    { label: "Email", icon: "mail" as const, color: "#ea580c", url: "mailto:achillegoudeagbe13@gmail.com" },
  ];

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.topRow}>
          <TouchableOpacity activeOpacity={1} onPress={handleHeaderTap} style={[styles.headerCard, { backgroundColor: "#fff7ed", flex: 1 }]}>
            <Feather name="radio" size={26} color="#f97316" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: "#9a3412" }]}>Espace Publicitaire</Text>
              <Text style={[styles.headerSub, { color: "#c2410c" }]}>Offres pour commerçants — Togo & Bénin</Text>
            </View>
            {loading && <Feather name="loader" size={14} color="#c2410c" />}
          </TouchableOpacity>
          <TouchableOpacity style={[styles.partenaireBtn, { backgroundColor: colors.primary }]} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setPartenaireVisible(true); }}>
            <Feather name="star" size={15} color="#fff" />
            <Text style={styles.partenaireBtnText}>Devenir{"\n"}Partenaire</Text>
          </TouchableOpacity>
        </View>

        {/* Mes Annonces shortcut */}
        {user && (
          <TouchableOpacity
            style={[styles.mesAnnoncesBtn, { backgroundColor: colors.card, borderColor: colors.primary }]}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMesAnnoncesVisible(true); }}
          >
            <View style={[styles.mesAnnoncesIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="edit-3" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mesAnnoncesTitle, { color: colors.foreground }]}>Mes Annonces</Text>
              <Text style={[styles.mesAnnoncesSub, { color: colors.mutedForeground }]}>Gérer vos publicités partenaires</Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 1 — CARROUSEL HORIZONTAL VIP & PREMIUM
            ═══════════════════════════════════════════════════════ */}
        {carouselAds.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <View style={[styles.sectionDot, { backgroundColor: "#eab308" }]} />
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Espaces VIP & Premium</Text>
              <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{carouselAds.length} annonce{carouselAds.length > 1 ? "s" : ""}</Text>
            </View>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
              Faites défiler → pour voir toutes les offres Premium
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.carouselScroll}
              decelerationRate="fast"
              snapToInterval={CAROUSEL_CARD_WIDTH + 12}
              snapToAlignment="start"
            >
              {carouselAds.map((ad) => (
                <CarouselCard key={ad.id} ad={ad} onImagePress={handleImagePress} />
              ))}
            </ScrollView>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════
            SECTION 2 — FLUX VERTICAL : TOUTES LES ACTIVITÉS
            ═══════════════════════════════════════════════════════ */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Toutes les activités</Text>
          <Text style={[styles.sectionCount, { color: colors.mutedForeground }]}>{allSorted.length + 1} annonce{allSorted.length + 1 > 1 ? "s" : ""}</Text>
        </View>
        <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
          Les plus récentes en premier · Partenaires du marché
        </Text>

        {/* Pub propriétaire (toujours affichée) */}
        <View style={[styles.adCard, { backgroundColor: "#f5f3ff", borderColor: "#7c3aed", borderWidth: 2 }]}>
          <View style={[styles.tierBanner, { backgroundColor: "#ede9fe" }]}>
            <Text style={[styles.tierBannerText, { color: "#7c3aed" }]}>👑 CRÉATEUR DE L'APP</Text>
          </View>
          <View style={styles.adTop}>
            <View style={[styles.adIconBg, { backgroundColor: "#7c3aed15" }]}>
              <Feather name="cpu" size={24} color="#7c3aed" />
            </View>
            <View style={[styles.adBadge, { backgroundColor: "#7c3aed20" }]}>
              <Text style={[styles.adBadgeText, { color: "#7c3aed" }]}>CRÉATEUR</Text>
            </View>
          </View>
          <Text style={[styles.adTitle, { color: "#1e1b4b" }]}>{OWNER_AD.titre}</Text>
          <Text style={[styles.adDesc, { color: "#5b21b6" }]}>{OWNER_AD.description}</Text>
          <TouchableOpacity onPress={() => openUrl(OWNER_AD.whatsappUrl)} style={[styles.adCta, { backgroundColor: "#25D366" }]}>
            <Text style={styles.adCtaText}>{OWNER_AD.cta}</Text>
            <Feather name="message-circle" size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {allSorted.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Feather name="inbox" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aucune publicité partenaire</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Cet espace est disponible pour vos annonces. Devenez partenaire !
            </Text>
          </View>
        ) : (
          allSorted.map((ad) => <AdCard key={ad.id} ad={ad} onImagePress={handleImagePress} />)
        )}

        {/* Régie */}
        <View style={[styles.regieCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
          <Feather name="zap" size={20} color="#f97316" />
          <Text style={[styles.regieTitle, { color: colors.foreground }]}>Faites connaître votre activité</Text>
          <Text style={[styles.regieText, { color: colors.mutedForeground }]}>
            Touchez des milliers de commerçants au Togo et au Bénin.
          </Text>
          <TouchableOpacity style={[styles.regieBtn, { backgroundColor: colors.primary }]} onPress={() => setPartenaireVisible(true)}>
            <Feather name="phone-call" size={15} color="#fff" />
            <Text style={styles.regieBtnText}>Contacter la régie</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Zoom Modal */}
      <ImageZoomModal
        visible={!!zoomImage}
        imageUrl={zoomImage}
        title={zoomTitle}
        onClose={() => { setZoomImage(""); setZoomTitle(""); }}
      />

      {/* Admin modal (5 taps sur le titre) */}
      <Modal visible={adminVisible} animationType="slide" presentationStyle="pageSheet">
        <AdminPubsScreen onClose={() => setAdminVisible(false)} />
      </Modal>

      {/* Mes Annonces modal */}
      <Modal visible={mesAnnoncesVisible} animationType="slide" presentationStyle="pageSheet">
        <MesAnnoncesScreen onClose={() => setMesAnnoncesVisible(false)} />
      </Modal>

      {/* Devenir Partenaire */}
      <Modal visible={partenaireVisible} animationType="slide" presentationStyle="formSheet" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Devenir Partenaire</Text>
            <Text style={[styles.modalSub, { color: colors.mutedForeground }]}>
              Contactez la régie MAR-CI Compta pour diffuser votre publicité.
            </Text>
            <View style={styles.tierCards}>
              {[
                { label: "⭐ Premium", desc: "30 jours · priorité haute", color: "#eab308" },
                { label: "💎 VIP", desc: "Illimité · accès total", color: "#94a3b8" },
                { label: "Gratuit", desc: "1 pub · standard", color: "#22c55e" },
              ].map((t) => (
                <View key={t.label} style={[styles.tierPill, { borderColor: t.color }]}>
                  <Text style={[styles.tierPillLabel, { color: t.color }]}>{t.label}</Text>
                  <Text style={[styles.tierPillDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
                </View>
              ))}
            </View>
            <View style={styles.contactList}>
              {CONTACTS_REGIE.map((c, i) => (
                <TouchableOpacity key={i} style={[styles.contactRow, { backgroundColor: c.color }]} onPress={() => openUrl(c.url)}>
                  <Feather name={c.icon} size={18} color="#fff" />
                  <Text style={styles.contactRowText}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[styles.closeModalBtn, { borderColor: colors.border }]} onPress={() => setPartenaireVisible(false)}>
              <Text style={[styles.closeModalText, { color: colors.mutedForeground }]}>Fermer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const CAROUSEL_CARD_WIDTH = 272;

const styles = StyleSheet.create({
  content: { padding: 16, gap: 14 },

  // Header
  topRow: { flexDirection: "row", gap: 10, alignItems: "stretch" },
  headerCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  partenaireBtn: { borderRadius: 16, padding: 12, alignItems: "center", justifyContent: "center", minWidth: 72 },
  partenaireBtnText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold", textAlign: "center", marginTop: 4 },
  mesAnnoncesBtn: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 16, borderWidth: 1.5 },
  mesAnnoncesIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mesAnnoncesTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
  mesAnnoncesSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },

  // Section headers
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 0 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 14, fontWeight: "800", fontFamily: "Inter_700Bold", flex: 1 },
  sectionCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionSub: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: -8 },

  // ── Carousel ──────────────────────────────────────────────────
  carouselScroll: { paddingHorizontal: 4, gap: 12, paddingVertical: 4 },
  carouselCard: {
    width: CAROUSEL_CARD_WIDTH,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  carouselRibbon: { paddingHorizontal: 14, paddingVertical: 7 },
  carouselRibbonText: { fontSize: 10, fontWeight: "800", letterSpacing: 1, fontFamily: "Inter_700Bold" },
  carouselImage: { width: "100%", height: 130 },
  carouselNoImage: { width: "100%", height: 100, alignItems: "center", justifyContent: "center" },
  carouselBody: { padding: 14, gap: 6 },
  inlineBadge: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 14 },
  inlineBadgeText: { fontSize: 9, fontWeight: "800", letterSpacing: 0.5, fontFamily: "Inter_700Bold" },
  carouselTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold", lineHeight: 20 },
  carouselDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  carouselCta: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderRadius: 13, marginTop: 4,
  },
  carouselCtaText: { color: "#fff", fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },

  // ── Vertical cards ────────────────────────────────────────────
  adCard: { borderRadius: 20, overflow: "hidden", elevation: 2 },
  adImage: { width: "100%", height: 160 },
  zoomHint: {
    position: "absolute", bottom: 8, right: 12,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(0,0,0,0.4)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
  },
  zoomHintText: { color: "#fff", fontSize: 11, fontFamily: "Inter_400Regular" },
  tierBanner: { paddingHorizontal: 16, paddingVertical: 6 },
  tierBannerText: { fontSize: 10, fontWeight: "800", letterSpacing: 1, fontFamily: "Inter_700Bold" },
  adTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingBottom: 8 },
  adIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  adBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  adBadgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5, fontFamily: "Inter_700Bold" },
  adTitle: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold", paddingHorizontal: 16, marginBottom: 4 },
  adDesc: { fontSize: 13, lineHeight: 19, fontFamily: "Inter_400Regular", paddingHorizontal: 16, marginBottom: 4 },
  adCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, margin: 12, borderRadius: 14 },
  adCtaText: { color: "#fff", fontWeight: "700", fontSize: 14, fontFamily: "Inter_700Bold" },

  // Empty
  emptyCard: { borderRadius: 20, padding: 28, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },

  // Régie
  regieCard: { borderRadius: 20, padding: 18, alignItems: "center", gap: 8, borderWidth: 1.5 },
  regieTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  regieText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  regieBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 18, marginTop: 2 },
  regieBtnText: { color: "#fff", fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },

  // Partner modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  modalBox: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, gap: 12 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#d1d5db", alignSelf: "center", marginBottom: 8 },
  modalTitle: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold", textAlign: "center" },
  modalSub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  tierCards: { flexDirection: "row", gap: 8 },
  tierPill: { flex: 1, borderWidth: 1.5, borderRadius: 12, padding: 10, alignItems: "center", gap: 2 },
  tierPillLabel: { fontSize: 12, fontWeight: "800", fontFamily: "Inter_700Bold" },
  tierPillDesc: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  contactList: { gap: 10, marginTop: 4 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14 },
  contactRowText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  closeModalBtn: { borderWidth: 1.5, borderRadius: 14, padding: 14, alignItems: "center", marginTop: 4 },
  closeModalText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
