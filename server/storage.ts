import { 
  users, articles, tags, articleTags, comments, likes, follows, bookmarks,
  type User, type InsertUser, 
  type Article, type InsertArticle,
  type Tag, type InsertTag,
  type ArticleTag, type InsertArticleTag,
  type Comment, type InsertComment,
  type Like, type InsertLike,
  type Follow, type InsertFollow,
  type Bookmark, type InsertBookmark,
  type ArticleWithAuthor,
  type CommentWithAuthor,
  type UserWithStats
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { and, eq, desc, sql, count } from "drizzle-orm";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Articles
  createArticle(article: InsertArticle): Promise<Article>;
  getArticle(id: number): Promise<ArticleWithAuthor | undefined>;
  updateArticle(id: number, data: Partial<InsertArticle>): Promise<Article | undefined>;
  deleteArticle(id: number): Promise<boolean>;
  getArticles(options?: { limit?: number; offset?: number; tag?: string; authorId?: number }): Promise<ArticleWithAuthor[]>;
  getFeaturedArticles(limit?: number): Promise<ArticleWithAuthor[]>;
  
  // Tags
  createTag(tag: InsertTag): Promise<Tag>;
  getTagByName(name: string): Promise<Tag | undefined>;
  getAllTags(): Promise<Tag[]>;
  getPopularTags(limit?: number): Promise<Tag[]>;
  
  // ArticleTags
  addTagToArticle(articleTag: InsertArticleTag): Promise<ArticleTag>;
  removeTagFromArticle(articleId: number, tagId: number): Promise<boolean>;
  getTagsByArticleId(articleId: number): Promise<Tag[]>;
  
  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByArticleId(articleId: number): Promise<CommentWithAuthor[]>;
  deleteComment(id: number): Promise<boolean>;
  
  // Likes
  likeArticle(like: InsertLike): Promise<Like>;
  unlikeArticle(userId: number, articleId: number): Promise<boolean>;
  isArticleLiked(userId: number, articleId: number): Promise<boolean>;
  getLikeCount(articleId: number): Promise<number>;
  
  // Follows
  followUser(follow: InsertFollow): Promise<Follow>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  getFollowerCount(userId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;
  getFollowers(userId: number): Promise<User[]>;
  getFollowing(userId: number): Promise<User[]>;
  getPopularAuthors(limit?: number): Promise<UserWithStats[]>;
  
  // Bookmarks
  bookmarkArticle(bookmark: InsertBookmark): Promise<Bookmark>;
  unbookmarkArticle(userId: number, articleId: number): Promise<boolean>;
  isArticleBookmarked(userId: number, articleId: number): Promise<boolean>;
  getUserBookmarks(userId: number): Promise<ArticleWithAuthor[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private usersData: Map<number, User>;
  private articlesData: Map<number, Article>;
  private tagsData: Map<number, Tag>;
  private articleTagsData: ArticleTag[];
  private commentsData: Map<number, Comment>;
  private likesData: Map<number, Like>;
  private followsData: Follow[];
  private bookmarksData: Bookmark[];
  
  // Counters for primary keys
  private userIdCounter: number;
  private articleIdCounter: number;
  private tagIdCounter: number;
  private commentIdCounter: number;
  private likeIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.usersData = new Map();
    this.articlesData = new Map();
    this.tagsData = new Map();
    this.articleTagsData = [];
    this.commentsData = new Map();
    this.likesData = new Map();
    this.followsData = [];
    this.bookmarksData = [];
    
    this.userIdCounter = 1;
    this.articleIdCounter = 1;
    this.tagIdCounter = 1;
    this.commentIdCounter = 1;
    this.likeIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });
    
    // Initialize with some tags
    const initialTags = ["Programming", "Design", "Technology", "Data Science", "AI", "Business", "Web Development", "JavaScript", "React", "CSS"];
    initialTags.forEach(tagName => {
      this.createTag({ name: tagName });
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.usersData.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usersData.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.usersData.set(id, newUser);
    return newUser;
  }
  
  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.usersData.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.usersData.set(id, updatedUser);
    return updatedUser;
  }

  // Articles
  async createArticle(article: InsertArticle): Promise<Article> {
    const id = this.articleIdCounter++;
    const now = new Date();
    const newArticle: Article = { 
      ...article, 
      id, 
      createdAt: now
    };
    this.articlesData.set(id, newArticle);
    return newArticle;
  }
  
  async getArticle(id: number): Promise<ArticleWithAuthor | undefined> {
    const article = this.articlesData.get(id);
    if (!article) return undefined;
    
    const author = this.usersData.get(article.authorId);
    if (!author) return undefined;
    
    const tags = await this.getTagsByArticleId(id);
    
    const likesCount = await this.getLikeCount(id);
    const commentsCount = (await this.getCommentsByArticleId(id)).length;
    
    return {
      ...article,
      author,
      tags,
      _count: {
        likes: likesCount,
        comments: commentsCount
      }
    };
  }
  
  async updateArticle(id: number, data: Partial<InsertArticle>): Promise<Article | undefined> {
    const article = this.articlesData.get(id);
    if (!article) return undefined;
    
    const updatedArticle = { ...article, ...data };
    this.articlesData.set(id, updatedArticle);
    return updatedArticle;
  }
  
  async deleteArticle(id: number): Promise<boolean> {
    if (!this.articlesData.has(id)) return false;
    
    // Remove all related data
    const articleTagsToRemove = this.articleTagsData.filter(at => at.articleId === id);
    articleTagsToRemove.forEach(at => {
      this.removeTagFromArticle(at.articleId, at.tagId);
    });
    
    // Remove comments
    Array.from(this.commentsData.values())
      .filter(comment => comment.articleId === id)
      .forEach(comment => {
        this.commentsData.delete(comment.id);
      });
    
    // Remove likes
    Array.from(this.likesData.values())
      .filter(like => like.articleId === id)
      .forEach(like => {
        this.likesData.delete(like.id);
      });
    
    // Remove bookmarks
    this.bookmarksData = this.bookmarksData.filter(bookmark => bookmark.articleId !== id);
    
    // Remove the article
    this.articlesData.delete(id);
    return true;
  }
  
  async getArticles(options: { limit?: number; offset?: number; tag?: string; authorId?: number } = {}): Promise<ArticleWithAuthor[]> {
    const { limit = 10, offset = 0, tag, authorId } = options;
    
    let articles = Array.from(this.articlesData.values());
    
    // Filter by author if provided
    if (authorId) {
      articles = articles.filter(article => article.authorId === authorId);
    }
    
    // Filter by tag if provided
    if (tag) {
      const matchingTag = await this.getTagByName(tag);
      if (matchingTag) {
        const articleIdsWithTag = this.articleTagsData
          .filter(at => at.tagId === matchingTag.id)
          .map(at => at.articleId);
        
        articles = articles.filter(article => articleIdsWithTag.includes(article.id));
      } else {
        articles = [];
      }
    }
    
    // Sort by creation date (newest first)
    articles.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    
    // Apply pagination
    articles = articles.slice(offset, offset + limit);
    
    // Fetch additional data for each article
    const articlesWithAuthor: ArticleWithAuthor[] = [];
    
    for (const article of articles) {
      const author = this.usersData.get(article.authorId);
      if (!author) continue;
      
      const tags = await this.getTagsByArticleId(article.id);
      const likesCount = await this.getLikeCount(article.id);
      const commentsCount = (await this.getCommentsByArticleId(article.id)).length;
      
      articlesWithAuthor.push({
        ...article,
        author,
        tags,
        _count: {
          likes: likesCount,
          comments: commentsCount
        }
      });
    }
    
    return articlesWithAuthor;
  }
  
  async getFeaturedArticles(limit: number = 3): Promise<ArticleWithAuthor[]> {
    // In a real app, we might have some criteria for featuring articles
    // For now, let's return the most liked articles
    const articles = Array.from(this.articlesData.values());
    
    // Get like counts for each article
    const articleLikeCounts = await Promise.all(
      articles.map(async (article) => ({
        article,
        likeCount: await this.getLikeCount(article.id)
      }))
    );
    
    // Sort by like count in descending order
    articleLikeCounts.sort((a, b) => b.likeCount - a.likeCount);
    
    // Take the top N
    const topArticles = articleLikeCounts
      .slice(0, limit)
      .map(item => item.article);
    
    // Fetch additional data
    const featuredArticles: ArticleWithAuthor[] = [];
    
    for (const article of topArticles) {
      const author = this.usersData.get(article.authorId);
      if (!author) continue;
      
      const tags = await this.getTagsByArticleId(article.id);
      const likesCount = await this.getLikeCount(article.id);
      const commentsCount = (await this.getCommentsByArticleId(article.id)).length;
      
      featuredArticles.push({
        ...article,
        author,
        tags,
        _count: {
          likes: likesCount,
          comments: commentsCount
        }
      });
    }
    
    return featuredArticles;
  }
  
  // Tags
  async createTag(tag: InsertTag): Promise<Tag> {
    // Check if tag already exists
    const existingTag = await this.getTagByName(tag.name);
    if (existingTag) return existingTag;
    
    const id = this.tagIdCounter++;
    const newTag: Tag = { ...tag, id };
    this.tagsData.set(id, newTag);
    return newTag;
  }
  
  async getTagByName(name: string): Promise<Tag | undefined> {
    return Array.from(this.tagsData.values()).find(
      tag => tag.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  async getAllTags(): Promise<Tag[]> {
    return Array.from(this.tagsData.values());
  }
  
  async getPopularTags(limit: number = 10): Promise<Tag[]> {
    // Count occurrences of each tag in articles
    const tagCounts = new Map<number, number>();
    
    this.articleTagsData.forEach(at => {
      const count = tagCounts.get(at.tagId) || 0;
      tagCounts.set(at.tagId, count + 1);
    });
    
    // Sort tags by occurrence count
    const sortedTags = Array.from(this.tagsData.values())
      .map(tag => ({
        tag,
        count: tagCounts.get(tag.id) || 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map(item => item.tag);
    
    return sortedTags;
  }
  
  // ArticleTags
  async addTagToArticle(articleTag: InsertArticleTag): Promise<ArticleTag> {
    // Check if the association already exists
    const exists = this.articleTagsData.some(
      at => at.articleId === articleTag.articleId && at.tagId === articleTag.tagId
    );
    
    if (!exists) {
      this.articleTagsData.push(articleTag);
    }
    
    return articleTag;
  }
  
  async removeTagFromArticle(articleId: number, tagId: number): Promise<boolean> {
    const initialLength = this.articleTagsData.length;
    
    this.articleTagsData = this.articleTagsData.filter(
      at => !(at.articleId === articleId && at.tagId === tagId)
    );
    
    return this.articleTagsData.length < initialLength;
  }
  
  async getTagsByArticleId(articleId: number): Promise<Tag[]> {
    const tagIds = this.articleTagsData
      .filter(at => at.articleId === articleId)
      .map(at => at.tagId);
    
    return tagIds.map(id => this.tagsData.get(id)!).filter(Boolean);
  }
  
  // Comments
  async createComment(comment: InsertComment): Promise<Comment> {
    const id = this.commentIdCounter++;
    const now = new Date();
    const newComment: Comment = {
      ...comment,
      id,
      createdAt: now
    };
    
    this.commentsData.set(id, newComment);
    return newComment;
  }
  
  async getCommentsByArticleId(articleId: number): Promise<CommentWithAuthor[]> {
    const comments = Array.from(this.commentsData.values())
      .filter(comment => comment.articleId === articleId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return comments.map(comment => {
      const author = this.usersData.get(comment.authorId)!;
      return { ...comment, author };
    }).filter(c => c.author); // Filter out comments with non-existent authors
  }
  
  async deleteComment(id: number): Promise<boolean> {
    if (!this.commentsData.has(id)) return false;
    
    this.commentsData.delete(id);
    return true;
  }
  
  // Likes
  async likeArticle(like: InsertLike): Promise<Like> {
    // Check if already liked
    const existingLike = Array.from(this.likesData.values()).find(
      l => l.userId === like.userId && l.articleId === like.articleId
    );
    
    if (existingLike) return existingLike;
    
    const id = this.likeIdCounter++;
    const newLike: Like = { ...like, id };
    
    this.likesData.set(id, newLike);
    return newLike;
  }
  
  async unlikeArticle(userId: number, articleId: number): Promise<boolean> {
    const like = Array.from(this.likesData.values()).find(
      l => l.userId === userId && l.articleId === articleId
    );
    
    if (!like) return false;
    
    this.likesData.delete(like.id);
    return true;
  }
  
  async isArticleLiked(userId: number, articleId: number): Promise<boolean> {
    return Array.from(this.likesData.values()).some(
      like => like.userId === userId && like.articleId === articleId
    );
  }
  
  async getLikeCount(articleId: number): Promise<number> {
    return Array.from(this.likesData.values())
      .filter(like => like.articleId === articleId)
      .length;
  }
  
  // Follows
  async followUser(follow: InsertFollow): Promise<Follow> {
    // Check if already following
    const isAlreadyFollowing = await this.isFollowing(
      follow.followerId,
      follow.followingId
    );
    
    if (isAlreadyFollowing) {
      return follow;
    }
    
    this.followsData.push(follow);
    return follow;
  }
  
  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const initialLength = this.followsData.length;
    
    this.followsData = this.followsData.filter(
      f => !(f.followerId === followerId && f.followingId === followingId)
    );
    
    return this.followsData.length < initialLength;
  }
  
  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    return this.followsData.some(
      f => f.followerId === followerId && f.followingId === followingId
    );
  }
  
  async getFollowerCount(userId: number): Promise<number> {
    return this.followsData.filter(f => f.followingId === userId).length;
  }
  
  async getFollowingCount(userId: number): Promise<number> {
    return this.followsData.filter(f => f.followerId === userId).length;
  }
  
  async getFollowers(userId: number): Promise<User[]> {
    const followerIds = this.followsData
      .filter(f => f.followingId === userId)
      .map(f => f.followerId);
    
    return followerIds.map(id => this.usersData.get(id)!).filter(Boolean);
  }
  
  async getFollowing(userId: number): Promise<User[]> {
    const followingIds = this.followsData
      .filter(f => f.followerId === userId)
      .map(f => f.followingId);
    
    return followingIds.map(id => this.usersData.get(id)!).filter(Boolean);
  }
  
  async getPopularAuthors(limit: number = 5): Promise<UserWithStats[]> {
    const users = Array.from(this.usersData.values());
    
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const articleCount = Array.from(this.articlesData.values())
          .filter(article => article.authorId === user.id)
          .length;
        
        const followerCount = await this.getFollowerCount(user.id);
        const followingCount = await this.getFollowingCount(user.id);
        
        return {
          ...user,
          _count: {
            articles: articleCount,
            followers: followerCount,
            following: followingCount
          }
        };
      })
    );
    
    // Sort by follower count
    usersWithStats.sort((a, b) => 
      (b._count?.followers || 0) - (a._count?.followers || 0)
    );
    
    return usersWithStats.slice(0, limit);
  }
  
  // Bookmarks
  async bookmarkArticle(bookmark: InsertBookmark): Promise<Bookmark> {
    // Check if already bookmarked
    const isAlreadyBookmarked = await this.isArticleBookmarked(
      bookmark.userId,
      bookmark.articleId
    );
    
    if (isAlreadyBookmarked) {
      return bookmark;
    }
    
    this.bookmarksData.push(bookmark);
    return bookmark;
  }
  
  async unbookmarkArticle(userId: number, articleId: number): Promise<boolean> {
    const initialLength = this.bookmarksData.length;
    
    this.bookmarksData = this.bookmarksData.filter(
      b => !(b.userId === userId && b.articleId === articleId)
    );
    
    return this.bookmarksData.length < initialLength;
  }
  
  async isArticleBookmarked(userId: number, articleId: number): Promise<boolean> {
    return this.bookmarksData.some(
      b => b.userId === userId && b.articleId === articleId
    );
  }
  
  async getUserBookmarks(userId: number): Promise<ArticleWithAuthor[]> {
    const articleIds = this.bookmarksData
      .filter(b => b.userId === userId)
      .map(b => b.articleId);
    
    const bookmarkedArticles: ArticleWithAuthor[] = [];
    
    for (const articleId of articleIds) {
      const article = await this.getArticle(articleId);
      if (article) {
        bookmarkedArticles.push(article);
      }
    }
    
    return bookmarkedArticles;
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: any; // Using any to avoid type errors for now

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Articles
  async createArticle(article: InsertArticle): Promise<Article> {
    const [newArticle] = await db.insert(articles).values({
      ...article,
      createdAt: new Date()
    }).returning();
    return newArticle;
  }

  async getArticle(id: number): Promise<ArticleWithAuthor | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    if (!article) return undefined;

    const [author] = await db.select().from(users).where(eq(users.id, article.authorId));
    if (!author) return undefined;

    const tags = await this.getTagsByArticleId(id);

    const [likesResult] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.articleId, id));

    const [commentsResult] = await db
      .select({ count: count() })
      .from(comments)
      .where(eq(comments.articleId, id));

    return {
      ...article,
      author,
      tags,
      _count: {
        likes: Number(likesResult?.count) || 0,
        comments: Number(commentsResult?.count) || 0
      }
    };
  }

  async updateArticle(id: number, data: Partial<InsertArticle>): Promise<Article | undefined> {
    const [updatedArticle] = await db
      .update(articles)
      .set(data)
      .where(eq(articles.id, id))
      .returning();
    return updatedArticle;
  }

  async deleteArticle(id: number): Promise<boolean> {
    // First delete related data due to foreign key constraints
    await db.delete(articleTags).where(eq(articleTags.articleId, id));
    await db.delete(comments).where(eq(comments.articleId, id));
    await db.delete(likes).where(eq(likes.articleId, id));
    await db.delete(bookmarks).where(eq(bookmarks.articleId, id));

    // Then delete the article
    const result = await db.delete(articles).where(eq(articles.id, id));
    return result.rowCount > 0;
  }

  async getArticles(options: { limit?: number; offset?: number; tag?: string; authorId?: number } = {}): Promise<ArticleWithAuthor[]> {
    const { limit = 10, offset = 0, tag, authorId } = options;

    let query = db.select().from(articles).orderBy(desc(articles.createdAt)).limit(limit).offset(offset);

    if (authorId) {
      query = query.where(eq(articles.authorId, authorId));
    }

    const fetchedArticles = await query;
    const result: ArticleWithAuthor[] = [];

    for (const article of fetchedArticles) {
      const [author] = await db.select().from(users).where(eq(users.id, article.authorId));
      if (!author) continue;

      const tags = await this.getTagsByArticleId(article.id);

      const [likesResult] = await db
        .select({ count: count() })
        .from(likes)
        .where(eq(likes.articleId, article.id));

      const [commentsResult] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.articleId, article.id));

      if (tag) {
        const hasTag = tags.some(t => t.name.toLowerCase() === tag.toLowerCase());
        if (!hasTag) continue;
      }

      result.push({
        ...article,
        author,
        tags,
        _count: {
          likes: Number(likesResult?.count) || 0,
          comments: Number(commentsResult?.count) || 0
        }
      });
    }

    return result;
  }

  async getFeaturedArticles(limit: number = 3): Promise<ArticleWithAuthor[]> {
    const likeCounts = await db
      .select({
        articleId: likes.articleId,
        count: count()
      })
      .from(likes)
      .groupBy(likes.articleId)
      .orderBy(desc(sql`count`))
      .limit(limit);

    const result: ArticleWithAuthor[] = [];

    for (const item of likeCounts) {
      const [article] = await db.select().from(articles).where(eq(articles.id, item.articleId));
      if (!article) continue;

      const [author] = await db.select().from(users).where(eq(users.id, article.authorId));
      if (!author) continue;

      const tags = await this.getTagsByArticleId(article.id);

      result.push({
        ...article,
        author,
        tags,
        _count: {
          likes: Number(item.count) || 0,
          comments: (await this.getCommentsByArticleId(article.id)).length
        }
      });
    }

    // If we don't have enough featured articles, get the most recent ones
    if (result.length < limit) {
      const recentArticles = await db
        .select()
        .from(articles)
        .orderBy(desc(articles.createdAt))
        .limit(limit - result.length);

      for (const article of recentArticles) {
        // Skip if already in results
        if (result.some(a => a.id === article.id)) continue;

        const [author] = await db.select().from(users).where(eq(users.id, article.authorId));
        if (!author) continue;

        const tags = await this.getTagsByArticleId(article.id);

        const [likesResult] = await db
          .select({ count: count() })
          .from(likes)
          .where(eq(likes.articleId, article.id));

        const [commentsResult] = await db
          .select({ count: count() })
          .from(comments)
          .where(eq(comments.articleId, article.id));

        result.push({
          ...article,
          author,
          tags,
          _count: {
            likes: Number(likesResult?.count) || 0,
            comments: Number(commentsResult?.count) || 0
          }
        });
      }
    }

    return result;
  }

  // Tags
  async createTag(tag: InsertTag): Promise<Tag> {
    // Check if tag already exists
    const existingTag = await this.getTagByName(tag.name);
    if (existingTag) return existingTag;

    const [newTag] = await db.insert(tags).values(tag).returning();
    return newTag;
  }

  async getTagByName(name: string): Promise<Tag | undefined> {
    const [tag] = await db
      .select()
      .from(tags)
      .where(sql`LOWER(${tags.name}) = LOWER(${name})`);
    return tag;
  }

  async getAllTags(): Promise<Tag[]> {
    return db.select().from(tags);
  }

  async getPopularTags(limit: number = 10): Promise<Tag[]> {
    const tagUsage = await db
      .select({
        tagId: articleTags.tagId,
        count: count()
      })
      .from(articleTags)
      .groupBy(articleTags.tagId)
      .orderBy(desc(sql`count`))
      .limit(limit);

    const result: Tag[] = [];

    for (const item of tagUsage) {
      const [tag] = await db.select().from(tags).where(eq(tags.id, item.tagId));
      if (tag) result.push(tag);
    }

    // If we don't have enough tags, get the remaining ones
    if (result.length < limit) {
      const remainingTags = await db
        .select()
        .from(tags)
        .limit(limit - result.length);

      for (const tag of remainingTags) {
        if (!result.some(t => t.id === tag.id)) {
          result.push(tag);
        }
      }
    }

    return result;
  }

  // ArticleTags
  async addTagToArticle(articleTag: InsertArticleTag): Promise<ArticleTag> {
    // Check if association already exists
    const [existing] = await db
      .select()
      .from(articleTags)
      .where(
        and(
          eq(articleTags.articleId, articleTag.articleId),
          eq(articleTags.tagId, articleTag.tagId)
        )
      );

    if (existing) return existing;

    const [newArticleTag] = await db
      .insert(articleTags)
      .values(articleTag)
      .returning();

    return newArticleTag;
  }

  async removeTagFromArticle(articleId: number, tagId: number): Promise<boolean> {
    const result = await db
      .delete(articleTags)
      .where(
        and(
          eq(articleTags.articleId, articleId),
          eq(articleTags.tagId, tagId)
        )
      );

    return result.rowCount > 0;
  }

  async getTagsByArticleId(articleId: number): Promise<Tag[]> {
    const articleTagsResult = await db
      .select()
      .from(articleTags)
      .where(eq(articleTags.articleId, articleId));

    const result: Tag[] = [];

    for (const at of articleTagsResult) {
      const [tag] = await db.select().from(tags).where(eq(tags.id, at.tagId));
      if (tag) result.push(tag);
    }

    return result;
  }

  // Comments
  async createComment(comment: InsertComment): Promise<Comment> {
    const [newComment] = await db
      .insert(comments)
      .values({
        ...comment,
        createdAt: new Date()
      })
      .returning();

    return newComment;
  }

  async getCommentsByArticleId(articleId: number): Promise<CommentWithAuthor[]> {
    const commentsResult = await db
      .select()
      .from(comments)
      .where(eq(comments.articleId, articleId))
      .orderBy(desc(comments.createdAt));

    const result: CommentWithAuthor[] = [];

    for (const comment of commentsResult) {
      const [author] = await db.select().from(users).where(eq(users.id, comment.authorId));
      if (author) {
        result.push({
          ...comment,
          author
        });
      }
    }

    return result;
  }

  async deleteComment(id: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, id));
    return result.rowCount > 0;
  }

  // Likes
  async likeArticle(like: InsertLike): Promise<Like> {
    // Check if already liked
    const [existing] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, like.userId),
          eq(likes.articleId, like.articleId)
        )
      );

    if (existing) return existing;

    const [newLike] = await db.insert(likes).values(like).returning();
    return newLike;
  }

  async unlikeArticle(userId: number, articleId: number): Promise<boolean> {
    const result = await db
      .delete(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.articleId, articleId)
        )
      );

    return result.rowCount > 0;
  }

  async isArticleLiked(userId: number, articleId: number): Promise<boolean> {
    const [like] = await db
      .select()
      .from(likes)
      .where(
        and(
          eq(likes.userId, userId),
          eq(likes.articleId, articleId)
        )
      );

    return !!like;
  }

  async getLikeCount(articleId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(likes)
      .where(eq(likes.articleId, articleId));

    return Number(result?.count) || 0;
  }

  // Follows
  async followUser(follow: InsertFollow): Promise<Follow> {
    const isFollowing = await this.isFollowing(follow.followerId, follow.followingId);
    if (isFollowing) {
      return follow;
    }

    const [newFollow] = await db.insert(follows).values(follow).returning();
    return newFollow;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    const result = await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );

    return result.rowCount > 0;
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followingId, followingId)
        )
      );

    return !!follow;
  }

  async getFollowerCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userId));

    return Number(result?.count) || 0;
  }

  async getFollowingCount(userId: number): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return Number(result?.count) || 0;
  }

  async getFollowers(userId: number): Promise<User[]> {
    const followsResult = await db
      .select()
      .from(follows)
      .where(eq(follows.followingId, userId));

    const result: User[] = [];

    for (const follow of followsResult) {
      const [user] = await db.select().from(users).where(eq(users.id, follow.followerId));
      if (user) result.push(user);
    }

    return result;
  }

  async getFollowing(userId: number): Promise<User[]> {
    const followsResult = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, userId));

    const result: User[] = [];

    for (const follow of followsResult) {
      const [user] = await db.select().from(users).where(eq(users.id, follow.followingId));
      if (user) result.push(user);
    }

    return result;
  }

  async getPopularAuthors(limit: number = 5): Promise<UserWithStats[]> {
    // Get follower counts for each user
    const followerCounts = await db
      .select({
        userId: follows.followingId,
        count: count()
      })
      .from(follows)
      .groupBy(follows.followingId)
      .orderBy(desc(sql`count`))
      .limit(limit);

    const result: UserWithStats[] = [];

    for (const item of followerCounts) {
      const [user] = await db.select().from(users).where(eq(users.id, item.userId));
      if (!user) continue;

      // Count articles by this user
      const [articlesResult] = await db
        .select({ count: count() })
        .from(articles)
        .where(eq(articles.authorId, user.id));

      // Count people this user is following
      const [followingResult] = await db
        .select({ count: count() })
        .from(follows)
        .where(eq(follows.followerId, user.id));

      result.push({
        ...user,
        _count: {
          articles: Number(articlesResult?.count) || 0,
          followers: Number(item.count) || 0,
          following: Number(followingResult?.count) || 0
        }
      });
    }

    // If we don't have enough popular authors, get recent users
    if (result.length < limit) {
      const recentUsers = await db
        .select()
        .from(users)
        .limit(limit - result.length);

      for (const user of recentUsers) {
        // Skip if already in results
        if (result.some(u => u.id === user.id)) continue;

        // Count articles by this user
        const [articlesResult] = await db
          .select({ count: count() })
          .from(articles)
          .where(eq(articles.authorId, user.id));

        // Count followers
        const [followersResult] = await db
          .select({ count: count() })
          .from(follows)
          .where(eq(follows.followingId, user.id));

        // Count people this user is following
        const [followingResult] = await db
          .select({ count: count() })
          .from(follows)
          .where(eq(follows.followerId, user.id));

        result.push({
          ...user,
          _count: {
            articles: Number(articlesResult?.count) || 0,
            followers: Number(followersResult?.count) || 0,
            following: Number(followingResult?.count) || 0
          }
        });
      }
    }

    return result;
  }

  // Bookmarks
  async bookmarkArticle(bookmark: InsertBookmark): Promise<Bookmark> {
    const isBookmarked = await this.isArticleBookmarked(bookmark.userId, bookmark.articleId);
    if (isBookmarked) {
      return bookmark;
    }

    const [newBookmark] = await db.insert(bookmarks).values(bookmark).returning();
    return newBookmark;
  }

  async unbookmarkArticle(userId: number, articleId: number): Promise<boolean> {
    const result = await db
      .delete(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.articleId, articleId)
        )
      );

    return result.rowCount > 0;
  }

  async isArticleBookmarked(userId: number, articleId: number): Promise<boolean> {
    const [bookmark] = await db
      .select()
      .from(bookmarks)
      .where(
        and(
          eq(bookmarks.userId, userId),
          eq(bookmarks.articleId, articleId)
        )
      );

    return !!bookmark;
  }

  async getUserBookmarks(userId: number): Promise<ArticleWithAuthor[]> {
    const bookmarksResult = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId));

    const result: ArticleWithAuthor[] = [];

    for (const bookmark of bookmarksResult) {
      const [article] = await db.select().from(articles).where(eq(articles.id, bookmark.articleId));
      if (!article) continue;

      const [author] = await db.select().from(users).where(eq(users.id, article.authorId));
      if (!author) continue;

      const tags = await this.getTagsByArticleId(article.id);

      const [likesResult] = await db
        .select({ count: count() })
        .from(likes)
        .where(eq(likes.articleId, article.id));

      const [commentsResult] = await db
        .select({ count: count() })
        .from(comments)
        .where(eq(comments.articleId, article.id));

      result.push({
        ...article,
        author,
        tags,
        _count: {
          likes: Number(likesResult?.count) || 0,
          comments: Number(commentsResult?.count) || 0
        }
      });
    }

    return result;
  }
}

// Initialize database with sample tags
async function initializeDatabase() {
  try {
    // Check if tags already exist
    const existingTags = await db.select().from(tags);
    
    // Only seed if no tags exist
    if (existingTags.length === 0) {
      const initialTags = [
        "Programming", "Design", "Technology", "Data Science", 
        "AI", "Business", "Web Development", "JavaScript", 
        "React", "CSS"
      ];
      
      for (const tagName of initialTags) {
        await db.insert(tags).values({ name: tagName });
      }
      console.log("Database initialized with sample tags");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Initialize the database with sample data
initializeDatabase();

export const storage = new DatabaseStorage();
