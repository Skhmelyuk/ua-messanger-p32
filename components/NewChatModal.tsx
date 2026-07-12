import React from "react";
import { Modal, View, Text, FlatList, TouchableOpacity, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";

interface NewChatModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function NewChatModal({ visible, onClose }: NewChatModalProps) {
  const contacts = useQuery(api.chat.getChatContacts);
  const startConversation = useMutation(api.chat.getOrCreateConversation);
  const router = useRouter();

  const handleSelectContact = async (partnerId: any) => {
    try {
      const conversationId = await startConversation({ partnerId });
      onClose();
      // Navigate to chat screen
      router.push({
        pathname: "/chat/[id]",
        params: { id: conversationId, partnerId },
      });
    } catch (error) {
      console.error("Помилка створення чату:", error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Нове повідомлення</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={contacts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={48} color={COLORS.grey} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>Ви ще ні на кого не підписані.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => handleSelectContact(item._id)}
              activeOpacity={0.7}
            >
              <Image 
                source={{ uri: item.image ?? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde" }} 
                style={styles.avatar} 
              />
              <View style={styles.textContainer}>
                <Text style={styles.fullname}>{item.fullname ?? item.name ?? "Користувач"}</Text>
                <Text style={styles.username}>@{item.username ?? "user"}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={COLORS.grey} />
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.background 
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
    backgroundColor: COLORS.background,
  },
  title: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: COLORS.white 
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    paddingHorizontal: 8,
  },
  contactItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginVertical: 4,
  },
  avatar: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  textContainer: {
    flex: 1,
  },
  fullname: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: COLORS.white 
  },
  username: { 
    fontSize: 14, 
    color: COLORS.grey,
    marginTop: 2,
  },
  emptyContainer: { 
    padding: 60, 
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: { 
    color: COLORS.grey, 
    textAlign: "center",
    fontSize: 16,
  },
});
