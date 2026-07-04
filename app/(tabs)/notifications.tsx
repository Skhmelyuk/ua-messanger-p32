// app/(tabs)/notifications.tsx
import { View, Text, FlatList } from "react-native";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { COLORS } from "@/constants/theme";
import { Loader } from "@/components/Loader";
import { NotificationItem } from "@/components/NotificationItem";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/styles/notifications.styles";

function NoNotificationsFound() {
  return (
    <View style={[styles.container, styles.centered]}>
      <Ionicons name="notifications-outline" size={48} color={COLORS.primary} />
      <Text style={{ fontSize: 18, color: COLORS.white, marginTop: 12 }}>
        No notifications yet
      </Text>
    </View>
  );
}

export default function NotificationsScreen() {
  const notifications = useQuery(api.notifications.getNotifications);

  if (notifications === undefined) {
    return <Loader />;
  }

  if (notifications.length === 0) {
    return <NoNotificationsFound />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <FlatList
        data={notifications}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 16 }}>
            <NotificationItem notification={item} />
          </View>
        )}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}
