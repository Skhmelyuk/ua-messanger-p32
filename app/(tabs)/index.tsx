import { Post } from "@/components/Post";
import { StoriesSection } from "@/components/StoriesSection";
import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { styles } from "@/styles/feed.styles";
import { useAuthActions } from "@convex-dev/auth/react";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { useState } from "react";
import NewChatModal from "@/components/NewChatModal";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function FeedScreen() {
  const posts = useQuery(api.posts.getPosts);
  const { signOut } = useAuthActions();
  const [modalVisible, setModalVisible] = useState(false);

  if (posts === undefined) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>ua-messenger</Text>
        <TouchableOpacity onPress={() => signOut()}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      {/* FEED (Стрічка постів) */}
      <FlatList
        data={posts}
        renderItem={({ item }) => <Post post={item} />}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={<StoriesSection />}
        ListEmptyComponent={
          <View style={[styles.centered, { marginTop: 40 }]}>
            <Text style={{ color: COLORS.grey, fontSize: 16 }}>
              Постів ще немає
            </Text>
          </View>
        }
      />

      {/* FLOATING CHAT BUTTON */}
      <TouchableOpacity
        style={localStyles.chatButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="chatbubble-ellipses" size={26} color={COLORS.white} />
      </TouchableOpacity>

      <NewChatModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </View>
  );
}

const localStyles = StyleSheet.create({
  chatButton: {
    position: "absolute",
    bottom: 76,
    right: 16,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
});

