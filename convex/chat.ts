import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Отримати список користувачів, на яких підписаний поточний користувач
 */
export const getChatContacts = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    // Знаходимо всі підписки поточного користувача
    const follows = await ctx.db
      .query("follows")
      .withIndex("by_follower", (q) => q.eq("followerId", userId))
      .collect();

    // Завантажуємо профілі цих користувачів
    const contacts = await Promise.all(
      follows.map((f) => ctx.db.get(f.followingId))
    );

    return contacts.filter((u): u is NonNullable<typeof u> => u !== null);
  },
});

/**
 * Отримати або створити бесіду між двома користувачами
 */
export const getOrCreateConversation = mutation({
  args: { partnerId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    // Сортуємо ID для унікальності запису у БД
    const [user1Id, user2Id] = userId < args.partnerId ? [userId, args.partnerId] : [args.partnerId, userId];

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_users", (q) => q.eq("user1Id", user1Id).eq("user2Id", user2Id))
      .first();

    if (existing) return existing._id;

    // Створюємо нову бесіду
    return await ctx.db.insert("conversations", {
      user1Id,
      user2Id,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Отримати список повідомлень у бесіді (сортовані за часом)
 */
export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .order("asc")
      .collect();
  },
});

/**
 * Надіслати повідомлення (текст / фото / аудіо)
 */
export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    content: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    audioStorageId: v.optional(v.id("_storage")),
    audioDuration: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");

    let imageUrl: string | undefined;
    let audioUrl: string | undefined;
    let lastMessageText = "";
    let lastMessageType: "text" | "image" | "audio" = "text";

    if (args.imageStorageId) {
      const url = await ctx.storage.getUrl(args.imageStorageId);
      if (url) imageUrl = url;
      lastMessageText = "📷 Фотографія";
      lastMessageType = "image";
    }

    if (args.audioStorageId) {
      const url = await ctx.storage.getUrl(args.audioStorageId);
      if (url) audioUrl = url;
      lastMessageText = "🎤 Голосове повідомлення";
      lastMessageType = "audio";
    }

    if (args.content) {
      lastMessageText = args.content;
      lastMessageType = "text";
    }

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: userId,
      content: args.content,
      imageStorageId: args.imageStorageId,
      imageUrl,
      audioStorageId: args.audioStorageId,
      audioUrl,
      audioDuration: args.audioDuration,
      createdAt: Date.now(),
    });

    // Оновлюємо останнє повідомлення у бесіді
    await ctx.db.patch(args.conversationId, {
      lastMessage: lastMessageText,
      lastMessageType,
      updatedAt: Date.now(),
    });

    return messageId;
  },
});

/**
 * Згенерувати URL для завантаження медіафайлів (зображень/аудіо)
 */
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
