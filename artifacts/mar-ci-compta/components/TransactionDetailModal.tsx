import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Transaction } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

function formatFcfa(n: number) {
  return n.toLocaleString("fr-TG") + " FCFA";
}

function formatDateLong(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-TG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-TG", { hour: "2-digit", minute: "2-digit" });
}

export default function TransactionDetailModal({ transaction, onClose, onDelete }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  if (!transaction) return null;

  const isEntree = transaction.type === "entree";
  const accentColor = isEntree ? colors.success : colors.destructive;
  const bgLight = isEntree ? "#dcfce7" : "#fee2e2";

  return (
    <Modal
      visible={!!transaction}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.card,
              paddingTop: insets.top > 0 ? insets.top : 16,
              borderBottomColor: colors.border,
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Détail opération
          </Text>
          <TouchableOpacity
            onPress={() => {
              onDelete(transaction.id);
              onClose();
            }}
            style={styles.deleteBtn}
          >
            <Feather name="trash-2" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={[styles.amountCard, { backgroundColor: accentColor }]}>
            <View style={[styles.typeIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Feather
                name={isEntree ? "arrow-down-left" : "arrow-up-right"}
                size={28}
                color="#fff"
              />
            </View>
            <Text style={styles.amountLabel}>
              {isEntree ? "ENTRÉE DE CAISSE" : "SORTIE DE CAISSE"}
            </Text>
            <Text style={styles.amountValue}>
              {isEntree ? "+" : "-"}{formatFcfa(transaction.montant)}
            </Text>
          </View>

          <View style={[styles.detailCard, { backgroundColor: colors.card }]}>
            <DetailRow
              icon="file-text"
              label="Description"
              value={transaction.description}
              colors={colors}
            />
            <Separator colors={colors} />
            <DetailRow
              icon="tag"
              label="Catégorie"
              value={transaction.categorie}
              colors={colors}
            />
            <Separator colors={colors} />
            <DetailRow
              icon="calendar"
              label="Date"
              value={formatDateLong(transaction.date)}
              colors={colors}
              capitalize
            />
            <Separator colors={colors} />
            <DetailRow
              icon="clock"
              label="Heure"
              value={formatTime(transaction.date)}
              colors={colors}
            />
            <Separator colors={colors} />
            <DetailRow
              icon="hash"
              label="Référence"
              value={transaction.id.slice(0, 12).toUpperCase()}
              colors={colors}
              mono
            />
          </View>

          <View style={[styles.statusCard, { backgroundColor: bgLight }]}>
            <Feather name="check-circle" size={18} color={accentColor} />
            <Text style={[styles.statusText, { color: accentColor }]}>
              Opération enregistrée avec succès
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface DetailRowProps {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  capitalize?: boolean;
  mono?: boolean;
}

function DetailRow({ icon, label, value, colors, capitalize, mono }: DetailRowProps) {
  return (
    <View style={rowStyles.row}>
      <View style={[rowStyles.iconBg, { backgroundColor: colors.secondary }]}>
        <Feather name={icon as never} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[rowStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text
          style={[
            rowStyles.value,
            { color: colors.foreground },
            capitalize && { textTransform: "capitalize" },
            mono && { fontFamily: "Inter_400Regular", letterSpacing: 1 },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function Separator({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[sepStyles.sep, { backgroundColor: colors.border }]} />;
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});

const sepStyles = StyleSheet.create({
  sep: { height: 1, marginHorizontal: 16 },
});

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
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
    fontFamily: "Inter_700Bold",
  },
  deleteBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 16,
    gap: 14,
  },
  amountCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  typeIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  amountLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    fontFamily: "Inter_700Bold",
  },
  amountValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
    fontFamily: "Inter_700Bold",
  },
  detailCard: {
    borderRadius: 20,
    overflow: "hidden",
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 14,
  },
  statusText: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
