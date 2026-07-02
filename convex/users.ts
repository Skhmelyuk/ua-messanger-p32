import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Запит для отримання профілю поточного авторизованого користувача
 */
export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    // Отримуємо ID користувача із сесії Convex Auth
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    // Завантажуємо документ користувача з таблиці "users"
    return await ctx.db.get(userId);
  },
});

/**
 * Мутація для оновлення профілю користувача
 */
export const updateUserProfile = mutation({
  args: {
    username: v.optional(v.string()),
    fullname: v.optional(v.string()),
    bio: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized: Користувач не авторизований");
    }

    const patchData: any = {};
    if (args.username !== undefined) patchData.username = args.username;
    if (args.fullname !== undefined) patchData.fullname = args.fullname;
    if (args.bio !== undefined) patchData.bio = args.bio;

    if (args.imageStorageId) {
      const imageUrl = await ctx.storage.getUrl(args.imageStorageId);
      if (imageUrl) {
        patchData.image = imageUrl;
      }
    }

    // Оновлюємо дані користувача в таблиці "users"
    await ctx.db.patch(userId, patchData);
  },
});

/**
 * Запит для отримання профілю іншого користувача за його ID
 */
export const getUserProfile = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.id);
    if (!user) return null;
    return user;
  },
});

/**
 * Перевіряє, чи підписаний поточний користувач на іншого користувача
 */
export const isFollowing = query({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const follow = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", userId).eq("followingId", args.followingId),
      )
      .first();

    return !!follow;
  },
});

/**
 * Допоміжна функція для оновлення лічильників підписок
 */
async function updateFollowCounts(
  ctx: any,
  followerId: any,
  followingId: any,
  isFollow: boolean,
) {
  const follower = await ctx.db.get(followerId);
  const following = await ctx.db.get(followingId);

  if (follower && following) {
    await ctx.db.patch(followerId, {
      following: Math.max(0, (follower.following ?? 0) + (isFollow ? 1 : -1)),
    });
    await ctx.db.patch(followingId, {
      followers: Math.max(0, (following.followers ?? 0) + (isFollow ? 1 : -1)),
    });
  }
}

/**
 * Мутація для підписки / відписки від користувача та створення сповіщення
 */
export const toggleFollow = mutation({
  args: { followingId: v.id("users") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Unauthorized: Неавторизований доступ");
    }

    if (userId === args.followingId) {
      throw new Error("Ви не можете підписатися на самого себе");
    }

    const existing = await ctx.db
      .query("follows")
      .withIndex("by_both", (q) =>
        q.eq("followerId", userId).eq("followingId", args.followingId),
      )
      .first();

    if (existing) {
      // Відписка
      await ctx.db.delete(existing._id);
      await updateFollowCounts(ctx, userId, args.followingId, false);
    } else {
      // Підписка
      await ctx.db.insert("follows", {
        followerId: userId,
        followingId: args.followingId,
      });
      await updateFollowCounts(ctx, userId, args.followingId, true);

      // Створення сповіщення про підписку
      await ctx.db.insert("notifications", {
        receiverId: args.followingId,
        senderId: userId,
        type: "follow",
      });
    }
  },
});
