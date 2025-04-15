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

export const storage = new MemStorage();
