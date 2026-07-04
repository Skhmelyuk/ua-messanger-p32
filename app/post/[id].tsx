// app/post/[id].tsx
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Post } from "@/components/Post";
import { Comment } from "@/components/Comment";
import { Loader } from "@/components/Loader";
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";

export default function PostDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: Id<"posts"> }>();
  const router = useRouter();

  // Отримуємо дані посту
  const post = useQuery(api.posts.getPostById, { postId: id });

  // Отримуємо список коментарів
  const comments = useQuery(api.comments.getComments, { postId: id });

  if (post === undefined) {
    return <Loader />;
  }

  if (post === null) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Рендеримо сам пост */}
        <Post post={post} />

        {/* 2. Рендеримо список коментарів одразу під постом */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments</Text>

          {comments === undefined ? (
            <Loader />
          ) : comments.length === 0 ? (
            <Text style={styles.noCommentsText}>
              No comments yet. Be the first!
            </Text>
          ) : (
            comments.map((comment) => (
              <Comment key={comment._id} comment={comment} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.surface,
    backgroundColor: COLORS.background,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: COLORS.white,
    fontSize: 18,
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 60,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.surface,
  },
  commentsTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  noCommentsText: {
    color: COLORS.grey,
    textAlign: "center",
    marginTop: 10,
  },
});
