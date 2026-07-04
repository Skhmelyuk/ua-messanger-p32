// components/NotificationItem.tsx
import { View, Text, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { Id } from "@/convex/_generated/dataModel";
import { COLORS } from "@/constants/theme";
import { styles } from "@/styles/notifications.styles";

export interface NotificationProps {
  notification: {
    _id: Id<"notifications">;
    type: "like" | "comment" | "follow";
    sender: {
      _id: Id<"users">;
      username: string;
      image: string;
    };
    post: {
      _id: Id<"posts">;
      imageUrl: string;
    } | null;
    comment: string | undefined;
    _creationTime: number;
  };
}

export function NotificationItem({ notification }: NotificationProps) {
  return (
    <View style={styles.notificationItem}>
      <View style={styles.notificationContent}>
        <Link href={`/user/${notification.sender._id}` as any} asChild>
          <TouchableOpacity style={styles.avatarContainer}>
            <Image
              source={notification.sender.image}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
            <View style={styles.iconBadge}>
              {notification.type === "like" ? (
                <Ionicons name="heart" size={12} color={COLORS.primary} />
              ) : notification.type === "follow" ? (
                <Ionicons name="person-add" size={12} color="#8B5CF6" />
              ) : (
                <Ionicons name="chatbubble" size={12} color="#3B82F6" />
              )}
            </View>
          </TouchableOpacity>
        </Link>

        <View style={styles.notificationInfo}>
          <Link href={`/user/${notification.sender._id}` as any} asChild>
            <TouchableOpacity>
              <Text style={styles.username}>
                {notification.sender.username}
              </Text>
            </TouchableOpacity>
          </Link>

          <Text style={styles.action}>
            {notification.type === "follow"
              ? "started following you"
              : notification.type === "like"
                ? "liked your post"
                : `commented: "${notification.comment}"`}
          </Text>

          <Text style={styles.timeAgo}>
            {formatDistanceToNow(notification._creationTime, {
              addSuffix: true,
            })}
          </Text>
        </View>
      </View>

      {notification.post && (
        <Link href={`/post/${notification.post._id}` as any} asChild>
          <TouchableOpacity>
            <Image
              source={notification.post.imageUrl}
              style={styles.postImage}
              contentFit="cover"
              transition={200}
            />
          </TouchableOpacity>
        </Link>
      )}
    </View>
  );
}
