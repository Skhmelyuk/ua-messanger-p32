import { COLORS } from "@/constants/theme";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { styles } from "@/styles/feed.styles";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import { CommentsModal } from "./CommentsModal";

export type PostProps = {
  post: {
    _id: Id<"posts">;
    userId: Id<"users">;
    imageUrl: string;
    caption?: string;
    likes: number;
    comments: number;
    _creationTime: number;
    isLiked: boolean;
    isBookmarked: boolean;
    author: {
      _id?: Id<"users">;
      username: string;
      image: string;
    };
  };
};

export const Post = ({ post }: PostProps) => {
  // Отримуємо профіль поточного користувача
  const currentUser = useQuery(api.users.currentUser);

  // Стан для миттєвого оновлення UI
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likes);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked);
  const [commentsCount, setCommentsCount] = useState(post.comments);
  const [showComments, setShowComments] = useState(false);

  // Mutations
  const toggleLike = useMutation(api.posts.toggleLike);
  const toggleBookmark = useMutation(api.bookmarks.toggleBookmark);
  const deletePost = useMutation(api.posts.deletePost);

  // Перемикач лайка з оптимістичним оновленням
  const handleLike = async () => {
    try {
      const nextIsLiked = !isLiked;
      setIsLiked(nextIsLiked);
      setLikesCount((prev) => (nextIsLiked ? prev + 1 : Math.max(0, prev - 1)));

      const serverIsLiked = await toggleLike({ postId: post._id });

      if (serverIsLiked !== nextIsLiked) {
        setIsLiked(serverIsLiked);
        setLikesCount((prev) =>
          serverIsLiked ? prev + 1 : Math.max(0, prev - 1),
        );
      }
    } catch (error) {
      console.error(error);
      setIsLiked(post.isLiked);
      setLikesCount(post.likes);
    }
  };

  // Перемикач закладки
  const handleBookmark = async () => {
    try {
      setIsBookmarked(!isBookmarked);
      await toggleBookmark({ postId: post._id });
    } catch (error) {
      console.error(error);
      setIsBookmarked(post.isBookmarked);
    }
  };

  // Видалення поста
  const handleDelete = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deletePost({ postId: post._id });
            Alert.alert("Success", "Post deleted successfully.");
          } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to delete post.");
          }
        },
      },
    ]);
  };

  const isOwner = currentUser?._id === post.userId;

  return (
    <View style={styles.post}>
      {/* HEADER POST */}
      <View style={styles.postHeader}>
        <View style={styles.postHeaderLeft}>
          <Image
            source={{ uri: post.author.image }}
            style={styles.postAvatar}
          />
          <Text style={styles.postUsername}>{post.author.username}</Text>
        </View>

        {/* Кнопка видалення показується лише власнику поста */}
        {isOwner && (
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>

      {/* POST IMAGE */}
      <Image
        source={{ uri: post.imageUrl }}
        style={styles.postImage}
        resizeMode="cover"
      />

      {/* ACTIONS ROW */}
      <View style={styles.postActions}>
        <View style={styles.postActionsLeft}>
          <TouchableOpacity onPress={handleLike}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#e53e3e" : COLORS.white}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setShowComments(true)}>
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleBookmark}>
          <Ionicons
            name={isBookmarked ? "bookmark" : "bookmark-outline"}
            size={22}
            color={COLORS.white}
          />
        </TouchableOpacity>
      </View>

      {/* POST INFO */}
      <View style={styles.postInfo}>
        <Text style={styles.likesText}>
          {likesCount > 0
            ? `${likesCount.toLocaleString()} likes`
            : "Be the first to like"}
        </Text>

        {post.caption && (
          <View style={styles.captionContainer}>
            <Text style={styles.captionUsername}>{post.author.username}</Text>
            <Text style={styles.captionText}>{post.caption}</Text>
          </View>
        )}

        {commentsCount > 0 && (
          <TouchableOpacity onPress={() => setShowComments(true)}>
            <Text style={styles.commentsText}>
              View all {commentsCount} comments
            </Text>
          </TouchableOpacity>
        )}

        <Text style={styles.timeAgo}>
          {formatDistanceToNow(post._creationTime, { addSuffix: true })}
        </Text>
      </View>

      {/* MODAL WINDOW FOR COMMENTS */}
      {showComments && (
        <CommentsModal
          postId={post._id}
          visible={showComments}
          onClose={() => setShowComments(false)}
          onCommentsCountChange={setCommentsCount}
        />
      )}
    </View>
  );
};
