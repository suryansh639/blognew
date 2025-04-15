import { pgTable, text, serial, integer, boolean, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
});

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  authorId: integer("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  readTime: integer("read_time"),
  coverImage: text("cover_image"),
});

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const articleTags = pgTable("article_tags", {
  articleId: integer("article_id").notNull().references(() => articles.id),
  tagId: integer("tag_id").notNull().references(() => tags.id),
}, (t) => ({
  pk: primaryKey(t.articleId, t.tagId),
}));

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
  articleId: integer("article_id").notNull().references(() => articles.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  articleId: integer("article_id").notNull().references(() => articles.id),
});

export const follows = pgTable("follows", {
  followerId: integer("follower_id").notNull().references(() => users.id),
  followingId: integer("following_id").notNull().references(() => users.id),
}, (t) => ({
  pk: primaryKey(t.followerId, t.followingId),
}));

export const bookmarks = pgTable("bookmarks", {
  userId: integer("user_id").notNull().references(() => users.id),
  articleId: integer("article_id").notNull().references(() => articles.id),
}, (t) => ({
  pk: primaryKey(t.userId, t.articleId),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  firstName: true,
  lastName: true,
  bio: true,
  avatarUrl: true,
});

export const insertArticleSchema = createInsertSchema(articles).pick({
  title: true,
  content: true,
  excerpt: true,
  authorId: true,
  readTime: true,
  coverImage: true,
});

export const insertTagSchema = createInsertSchema(tags).pick({
  name: true,
});

export const insertArticleTagSchema = createInsertSchema(articleTags);

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  authorId: true,
  articleId: true,
});

export const insertLikeSchema = createInsertSchema(likes).pick({
  userId: true,
  articleId: true,
});

export const insertFollowSchema = createInsertSchema(follows);

export const insertBookmarkSchema = createInsertSchema(bookmarks);

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articles.$inferSelect;

export type InsertTag = z.infer<typeof insertTagSchema>;
export type Tag = typeof tags.$inferSelect;

export type InsertArticleTag = z.infer<typeof insertArticleTagSchema>;
export type ArticleTag = typeof articleTags.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertLike = z.infer<typeof insertLikeSchema>;
export type Like = typeof likes.$inferSelect;

export type InsertFollow = z.infer<typeof insertFollowSchema>;
export type Follow = typeof follows.$inferSelect;

export type InsertBookmark = z.infer<typeof insertBookmarkSchema>;
export type Bookmark = typeof bookmarks.$inferSelect;

// Extended types for frontend
export type ArticleWithAuthor = Article & {
  author: User;
  tags: Tag[];
  _count?: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
};

export type CommentWithAuthor = Comment & {
  author: User;
};

export type UserWithStats = User & {
  _count?: {
    articles: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
};
