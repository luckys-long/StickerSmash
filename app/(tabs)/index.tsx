import { Image, StyleSheet, Platform, ScrollView } from "react-native";

import { HelloWave } from "@/components/HelloWave";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import Diapad from "@/components/Diapad";

export default function HomeScreen() {
  return (
    <ScrollView>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Hello word!</ThemedText>
        <HelloWave />
      </ThemedView>
      <ThemedView>
        <Diapad />
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 64,
    marginBottom:16,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
});
