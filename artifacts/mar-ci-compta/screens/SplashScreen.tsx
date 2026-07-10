import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  onStart: () => void;
  isLoading: boolean;
}

export default function SplashScreen({ onStart, isLoading }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;
  const btnFade = useRef(new Animated.Value(0)).current;
  const [showBtn, setShowBtn] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, delay: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const t1 = setTimeout(() => {
        setShowBtn(true);
        Animated.timing(btnFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      }, 600);
      return () => { clearTimeout(t1); };
    }
  }, [isLoading]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#1e40af" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Logo M finance */}
        <Animated.View style={[styles.logoGroup, { transform: [{ scale: logoScale }] }]}>
          <View style={styles.logoBox}>
            <Text style={styles.logoM}>M</Text>
          </View>
          <Text style={styles.logoFinance}>finance</Text>
        </Animated.View>

        {/* App name */}
        <Animated.View style={[styles.appNameWrap, { transform: [{ translateY: slideAnim }], opacity: fadeAnim }]}>
          <Text style={styles.appName}>MAR-CI Compta</Text>
          <Text style={styles.appTagline}>
            La comptabilité simple pour les commerçants{"\n"}du Togo et du Bénin
          </Text>
        </Animated.View>

        {/* Welcome message */}
        <Animated.View style={[styles.messageWrap, { opacity: fadeAnim }]}>
          <Text style={styles.messageText}>
            Bienvenue dans MAR-CI Compta.{"\n"}Merci pour votre confiance.
          </Text>
        </Animated.View>

        {/* Loading / Button */}
        <View style={styles.bottomArea}>
          {isLoading ? (
            <ActivityIndicator size="large" color="rgba(255,255,255,0.9)" style={styles.loader} />
          ) : showBtn ? (
            <Animated.View style={{ opacity: btnFade }}>
              <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.85}>
                <Text style={styles.startBtnText}>Commencer</Text>
                <Feather name="arrow-right" size={20} color="#1e40af" />
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <ActivityIndicator size="large" color="rgba(255,255,255,0.6)" style={styles.loader} />
          )}
        </View>

        {/* Country badges */}
        <View style={styles.badges}>
          <View style={styles.badge}><Text style={styles.badgeText}>🇹🇬 Togo · OTR</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>🇧🇯 Bénin · DGI</Text></View>
          <View style={styles.badge}><Text style={styles.badgeText}>📴 Hors ligne</Text></View>
        </View>
      </Animated.View>

      {/* Bottom strip */}
      <View style={styles.bottomStrip}>
        <Text style={styles.bottomStripText}>MAR-CI v1.0 · Fintech Afrique de l'Ouest</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1e40af",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
    width: "100%",
  },
  logoGroup: {
    alignItems: "center",
    gap: 8,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  logoM: {
    fontSize: 60,
    fontWeight: "900",
    color: "#1e40af",
    fontFamily: "Inter_700Bold",
    lineHeight: 70,
  },
  logoFinance: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "300",
    letterSpacing: 6,
    fontFamily: "Inter_400Regular",
    textTransform: "lowercase",
  },
  appNameWrap: {
    alignItems: "center",
    gap: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    fontFamily: "Inter_700Bold",
    letterSpacing: -1,
  },
  appTagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  messageWrap: {
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  messageText: {
    fontSize: 15,
    color: "#fff",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  bottomArea: {
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  loader: {
    marginTop: 8,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e40af",
    fontFamily: "Inter_700Bold",
  },
  badges: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  bottomStrip: {
    paddingBottom: 24,
    paddingTop: 12,
  },
  bottomStripText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
