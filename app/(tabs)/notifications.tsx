import { View, Text, StyleSheet } from "react-native";

export default function ScreenNotifications() {
  return (
    <View style={styles.container}>
      <Text style={{ color: "#fff" }}>Notifications Title</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
});
