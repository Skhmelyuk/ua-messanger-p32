import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function ProfileScreen() {
  // Реагує автоматично на зміну даних у реальному часі
  const user = useQuery(api.users.currentUser);
  const { signOut } = useAuthActions();

  if (user === undefined) {
    return <ActivityIndicator size="large" color="#c7510cff" />;
  }

  if (user === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: "#fff" }}>Будь ласка, увійдіть у додаток</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000", padding: 20 }}>
      {user.image && (
        <Image
          source={{ uri: user.image }}
          style={{ width: 80, height: 80, borderRadius: 40, marginBottom: 15 }}
        />
      )}
      <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold" }}>
        {user.name ?? user.fullname ?? "Без імені"}
      </Text>
      <Text style={{ color: "#888", fontSize: 16 }}>{user.email}</Text>
      {user.bio && (
        <Text style={{ color: "#ccc", marginTop: 10 }}>{user.bio}</Text>
      )}

      {/* Кнопка виходу з акаунту */}
      <TouchableOpacity
        style={{
          marginTop: 30,
          backgroundColor: "#e53e3e",
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
        onPress={async () => {
          await signOut();
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>
          Вийти з акаунту
        </Text>
      </TouchableOpacity>
    </View>
  );
}
