import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "black" }}>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaView>
  );
}
