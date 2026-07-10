import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export type TabName = "dashboard" | "magasin" | "journal" | "pubs" | "bouclier";

interface Props {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
  onFabPress: () => void;
}

export default function BottomNav({ activeTab, onTabChange, onFabPress }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";

  const bottomPad = isWeb ? 0 : insets.bottom;

  const handleTab = (tab: TabName) => {
    Haptics.selectionAsync();
    onTabChange(tab);
  };

  const handleFab = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onFabPress();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          paddingBottom: bottomPad > 0 ? bottomPad : isWeb ? 0 : 12,
          borderTopColor: colors.border,
        },
      ]}
    >
      <TouchableOpacity style={styles.tabBtn} onPress={() => handleTab("dashboard")}>
        <Feather
          name="grid"
          size={22}
          color={activeTab === "dashboard" ? colors.primary : colors.mutedForeground}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === "dashboard" ? colors.primary : colors.mutedForeground },
          ]}
        >
          Tableau
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabBtn} onPress={() => handleTab("magasin")}>
        <Feather
          name="shopping-bag"
          size={22}
          color={activeTab === "magasin" ? colors.primary : colors.mutedForeground}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === "magasin" ? colors.primary : colors.mutedForeground },
          ]}
        >
          Magasin
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={handleFab}>
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabBtn} onPress={() => handleTab("journal")}>
        <Feather
          name="book-open"
          size={20}
          color={activeTab === "journal" ? colors.primary : colors.mutedForeground}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === "journal" ? colors.primary : colors.mutedForeground },
          ]}
        >
          Journal
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabBtn} onPress={() => handleTab("pubs")}>
        <Feather
          name="radio"
          size={20}
          color={activeTab === "pubs" ? colors.warning : colors.mutedForeground}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === "pubs" ? colors.warning : colors.mutedForeground },
          ]}
        >
          Pub
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.tabBtn} onPress={() => handleTab("bouclier")}>
        <Feather
          name="shield"
          size={20}
          color={activeTab === "bouclier" ? colors.primary : colors.mutedForeground}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: activeTab === "bouclier" ? colors.primary : colors.mutedForeground },
          ]}
        >
          Fiscal
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 20,
  },
  tabBtn: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -30,
    borderWidth: 4,
    borderColor: "#f8fafc",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
});
