import { View, Text, StyleSheet } from "react-native";

export default function ScreenCreate() {
  return (
    <View style={styles.container}>
      <Text style={{ color: "#fff" }}>Create Title</Text>
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
