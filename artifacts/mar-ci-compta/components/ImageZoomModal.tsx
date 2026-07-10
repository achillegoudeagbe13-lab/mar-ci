import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  imageUrl: string;
  title?: string;
  visible: boolean;
  onClose: () => void;
}

export default function ImageZoomModal({ imageUrl, title, visible, onClose }: Props) {
  if (!imageUrl) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.95)" />
      <View style={styles.overlay}>
        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}>
          <Feather name="x" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Title */}
        {title ? (
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        ) : null}

        {/* Full-screen image — tap anywhere to close */}
        <TouchableOpacity style={styles.imageWrap} activeOpacity={1} onPress={onClose}>
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="contain" />
        </TouchableOpacity>

        {/* Hint */}
        <Text style={styles.hint}>Appuyer n'importe où pour fermer</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    position: "absolute",
    top: 56,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  title: {
    position: "absolute",
    top: 60,
    left: 70,
    right: 70,
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
    zIndex: 10,
  },
  imageWrap: {
    width: "100%",
    height: "80%",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  hint: {
    position: "absolute",
    bottom: 40,
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
