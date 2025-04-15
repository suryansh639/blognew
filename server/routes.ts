import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertArticleSchema, insertCommentSchema } from "@shared/schema";
import { ZodError } from "zod";
import { 
  generateArticleSummary, 
  generateRelatedTopics, 
  analyzeWritingQuality,
  generateAudioFromText
} from "./openai";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { comments } from "@shared/schema";
import { hashPassword } from "./auth";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Authentication required" });
};

// Helper to format validation errors
const formatZodError = (error: ZodError) => {
  return error.errors.map(err => ({
    path: err.path.join('.'),
    message: err.message
  }));
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  // ----- Articles Routes -----
  
  // Get all articles with pagination and filtering
  app.get("/api/articles", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
      const tag = req.query.tag as string | undefined;
      const authorId = req.query.authorId ? parseInt(req.query.authorId as string) : undefined;
      
      const articles = await storage.getArticles({ limit, offset, tag, authorId });
      
      // If user is authenticated, check if articles are liked/bookmarked by the user
      if (req.isAuthenticated()) {
        const userId = req.user.id;
        
        for (const article of articles) {
          article.isLiked = await storage.isArticleLiked(userId, article.id);
          article.isBookmarked = await storage.isArticleBookmarked(userId, article.id);
        }
      }
      
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });
  
  // Get featured articles
  app.get("/api/articles/featured", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 3;
      const articles = await storage.getFeaturedArticles(limit);
      
      // If user is authenticated, check if articles are liked/bookmarked by the user
      if (req.isAuthenticated()) {
        const userId = req.user.id;
        
        for (const article of articles) {
          article.isLiked = await storage.isArticleLiked(userId, article.id);
          article.isBookmarked = await storage.isArticleBookmarked(userId, article.id);
        }
      }
      
      res.json(articles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch featured articles" });
    }
  });
  
  // Get a single article by id
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // If user is authenticated, check if article is liked/bookmarked by the user
      if (req.isAuthenticated()) {
        const userId = req.user.id;
        article.isLiked = await storage.isArticleLiked(userId, id);
        article.isBookmarked = await storage.isArticleBookmarked(userId, id);
      }
      
      res.json(article);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch article" });
    }
  });
  
  // Create a new article
  app.post("/api/articles", isAuthenticated, async (req, res) => {
    try {
      const articleData = { ...req.body, authorId: req.user.id };
      
      // Validate article data
      const validatedData = insertArticleSchema.parse(articleData);
      
      // Create the article
      const article = await storage.createArticle(validatedData);
      
      // Add tags to the article
      if (req.body.tags && Array.isArray(req.body.tags)) {
        for (const tagName of req.body.tags) {
          // Get or create tag
          let tag = await storage.getTagByName(tagName);
          if (!tag) {
            tag = await storage.createTag({ name: tagName });
          }
          
          // Add tag to article
          await storage.addTagToArticle({
            articleId: article.id,
            tagId: tag.id
          });
        }
      }
      
      // Return the article with author and tags
      const fullArticle = await storage.getArticle(article.id);
      res.status(201).json(fullArticle);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: formatZodError(error)
        });
      }
      res.status(500).json({ message: "Failed to create article" });
    }
  });
  
  // Update an article
  app.put("/api/articles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if user is the author
      if (article.authorId !== req.user.id) {
        return res.status(403).json({ message: "You are not authorized to update this article" });
      }
      
      // Update the article
      const updatedArticle = await storage.updateArticle(id, req.body);
      
      // Update tags if provided
      if (req.body.tags && Array.isArray(req.body.tags)) {
        // Remove existing tags
        const existingTags = await storage.getTagsByArticleId(id);
        for (const tag of existingTags) {
          await storage.removeTagFromArticle(id, tag.id);
        }
        
        // Add new tags
        for (const tagName of req.body.tags) {
          let tag = await storage.getTagByName(tagName);
          if (!tag) {
            tag = await storage.createTag({ name: tagName });
          }
          
          await storage.addTagToArticle({
            articleId: id,
            tagId: tag.id
          });
        }
      }
      
      // Return the updated article with author and tags
      const fullArticle = await storage.getArticle(id);
      res.json(fullArticle);
    } catch (error) {
      res.status(500).json({ message: "Failed to update article" });
    }
  });
  
  // Delete an article
  app.delete("/api/articles/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const article = await storage.getArticle(id);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Check if user is the author
      if (article.authorId !== req.user.id) {
        return res.status(403).json({ message: "You are not authorized to delete this article" });
      }
      
      // Delete the article
      await storage.deleteArticle(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete article" });
    }
  });
  
  // ----- Comments Routes -----
  
  // Get comments for an article
  app.get("/api/articles/:id/comments", async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const comments = await storage.getCommentsByArticleId(articleId);
      
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  
  // Add a comment to an article
  app.post("/api/articles/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const article = await storage.getArticle(articleId);
      
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      const commentData = {
        content: req.body.content,
        authorId: req.user.id,
        articleId
      };
      
      // Validate comment data
      const validatedData = insertCommentSchema.parse(commentData);
      
      // Create the comment
      const comment = await storage.createComment(validatedData);
      
      // Get the comment with author
      const commentWithAuthor = {
        ...comment,
        author: req.user
      };
      
      res.status(201).json(commentWithAuthor);
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: formatZodError(error)
        });
      }
      res.status(500).json({ message: "Failed to create comment" });
    }
  });
  
  // Delete a comment
  app.delete("/api/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get all comments for the article to find the one we want to delete
      // This is a workaround since we don't have a direct getComment method
      // In a real app, we would add a getComment method to the storage interface
      const allComments = await db.select().from(comments).where(eq(comments.id, id));
      const comment = allComments[0];
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if user is the author of the comment
      if (comment.authorId !== req.user?.id) {
        return res.status(403).json({ message: "You are not authorized to delete this comment" });
      }
      
      // Delete the comment
      await storage.deleteComment(id);
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });
  
  // ----- Like Routes -----
  
  // Like an article
  app.post("/api/articles/:id/like", isAuthenticated, async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Like the article
      await storage.likeArticle({ userId, articleId });
      
      // Get updated like count
      const likeCount = await storage.getLikeCount(articleId);
      
      res.json({ liked: true, likeCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to like article" });
    }
  });
  
  // Unlike an article
  app.delete("/api/articles/:id/like", isAuthenticated, async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Unlike the article
      await storage.unlikeArticle(userId, articleId);
      
      // Get updated like count
      const likeCount = await storage.getLikeCount(articleId);
      
      res.json({ liked: false, likeCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to unlike article" });
    }
  });
  
  // ----- Bookmark Routes -----
  
  // Bookmark an article
  app.post("/api/articles/:id/bookmark", isAuthenticated, async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Bookmark the article
      await storage.bookmarkArticle({ userId, articleId });
      
      res.json({ bookmarked: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to bookmark article" });
    }
  });
  
  // Remove bookmark
  app.delete("/api/articles/:id/bookmark", isAuthenticated, async (req, res) => {
    try {
      const articleId = parseInt(req.params.id);
      const userId = req.user.id;
      
      const article = await storage.getArticle(articleId);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      
      // Remove bookmark
      await storage.unbookmarkArticle(userId, articleId);
      
      res.json({ bookmarked: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove bookmark" });
    }
  });
  
  // Get user's bookmarks
  app.get("/api/bookmarks", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const bookmarks = await storage.getUserBookmarks(userId);
      
      // Mark articles as bookmarked (we know they are since they're in bookmarks)
      bookmarks.forEach(article => {
        article.isBookmarked = true;
        article.isLiked = storage.isArticleLiked(userId, article.id);
      });
      
      res.json(bookmarks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });
  
  // ----- Follow Routes -----
  
  // Follow a user
  app.post("/api/users/:id/follow", isAuthenticated, async (req, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const followerId = req.user.id;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "You cannot follow yourself" });
      }
      
      const userToFollow = await storage.getUser(followingId);
      if (!userToFollow) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Follow the user
      await storage.followUser({ followerId, followingId });
      
      // Get updated follower count
      const followerCount = await storage.getFollowerCount(followingId);
      
      res.json({ following: true, followerCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to follow user" });
    }
  });
  
  // Unfollow a user
  app.delete("/api/users/:id/follow", isAuthenticated, async (req, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const followerId = req.user.id;
      
      const userToUnfollow = await storage.getUser(followingId);
      if (!userToUnfollow) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Unfollow the user
      await storage.unfollowUser(followerId, followingId);
      
      // Get updated follower count
      const followerCount = await storage.getFollowerCount(followingId);
      
      res.json({ following: false, followerCount });
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });
  
  // ----- User Routes -----
  
  // Get user profile
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      // Get user stats
      const articlesCount = (await storage.getArticles({ authorId: userId })).length;
      const followersCount = await storage.getFollowerCount(userId);
      const followingCount = await storage.getFollowingCount(userId);
      
      // Check if authenticated user is following this user
      let isFollowing = false;
      if (req.isAuthenticated()) {
        isFollowing = await storage.isFollowing(req.user.id, userId);
      }
      
      const userWithStats = {
        ...userWithoutPassword,
        _count: {
          articles: articlesCount,
          followers: followersCount,
          following: followingCount
        },
        isFollowing
      };
      
      res.json(userWithStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user profile" });
    }
  });
  
  // Upload user photo
  app.post("/api/users/upload-photo", isAuthenticated, async (req, res) => {
    try {
      if (!req.files || !req.files.photo) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      const photo = req.files.photo;
      const fileName = `${Date.now()}-${photo.name}`;
      const uploadPath = `./uploads/${fileName}`;

      // Move photo to uploads directory
      await photo.mv(uploadPath);

      // Update user's avatar URL
      const avatarUrl = `/uploads/${fileName}`;
      await storage.updateUser(req.user.id, { avatarUrl });

      res.json({ avatarUrl });
    } catch (error) {
      console.error("Error uploading photo:", error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
  });

  // Update user profile
  app.put("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Check if user is updating their own profile
      if (userId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }
      
      const { username, password, firstName, lastName, bio, avatarUrl } = req.body;
      
      // If changing username, check if it's already taken
      if (username && username !== req.user.username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      // Prepare update data
      const updateData: any = {};
      if (username) updateData.username = username;
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (bio !== undefined) updateData.bio = bio;
      if (avatarUrl) updateData.avatarUrl = avatarUrl;
      
      // Hash password if provided
      if (password) {
        updateData.password = await hashPassword(password);
      }
      
      // Update user
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user profile" });
    }
  });
  
  // Get popular authors
  app.get("/api/authors/popular", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const authors = await storage.getPopularAuthors(limit);
      
      // Check if authenticated user is following these authors
      if (req.isAuthenticated()) {
        const userId = req.user.id;
        
        for (const author of authors) {
          author.isFollowing = await storage.isFollowing(userId, author.id);
        }
      }
      
      // Remove passwords from response
      const authorsWithoutPasswords = authors.map(author => {
        const { password, ...authorWithoutPassword } = author;
        return authorWithoutPassword;
      });
      
      res.json(authorsWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular authors" });
    }
  });
  
  // ----- Tag Routes -----
  
  // Get all tags
  app.get("/api/tags", async (req, res) => {
    try {
      const tags = await storage.getAllTags();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tags" });
    }
  });
  
  // Get popular tags
  app.get("/api/tags/popular", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const tags = await storage.getPopularTags(limit);
      res.json(tags);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular tags" });
    }
  });
  
  // ----- AI Feature Routes -----
  
  // Generate article summary
  app.post("/api/ai/summary", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.length < 10) {
        return res.status(400).json({ message: "Valid content is required" });
      }
      
      const summary = await generateArticleSummary(content);
      res.json({ summary });
    } catch (error) {
      console.error("Error generating summary:", error);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });
  
  // Generate related topics
  app.post("/api/ai/related-topics", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.length < 10) {
        return res.status(400).json({ message: "Valid content is required" });
      }
      
      const topics = await generateRelatedTopics(content);
      res.json({ topics });
    } catch (error) {
      console.error("Error generating related topics:", error);
      res.status(500).json({ message: "Failed to generate related topics" });
    }
  });
  
  // Analyze writing quality
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.length < 10) {
        return res.status(400).json({ message: "Valid content is required" });
      }
      
      const analysis = await analyzeWritingQuality(content);
      res.json(analysis);
    } catch (error) {
      console.error("Error analyzing writing:", error);
      res.status(500).json({ message: "Failed to analyze writing" });
    }
  });
  
  // Generate text-to-speech audio
  app.post("/api/ai/text-to-speech", async (req, res) => {
    try {
      const { text } = req.body;
      
      if (!text || typeof text !== 'string' || text.length < 10) {
        return res.status(400).json({ message: "Valid text is required" });
      }
      
      const audioBuffer = await generateAudioFromText(text);
      
      if (!audioBuffer) {
        return res.status(500).json({ message: "Failed to generate audio" });
      }
      
      // Set appropriate headers for audio
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', audioBuffer.length);
      
      // Send the audio buffer
      res.end(audioBuffer);
    } catch (error) {
      console.error("Error generating audio:", error);
      res.status(500).json({ message: "Failed to generate audio" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
