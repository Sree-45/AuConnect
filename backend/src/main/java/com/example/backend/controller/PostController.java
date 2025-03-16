package com.example.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.backend.model.Post;
import com.example.backend.model.Comment;
import com.example.backend.model.Users;
import com.example.backend.service.PostService;
import com.example.backend.dto.CommentRequest;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.ConnectionRepository;
import com.example.backend.repository.UserRepository;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Comparator;

@RestController
@RequestMapping("/api/posts")
@CrossOrigin(origins = "http://localhost:5173")
public class PostController {
    
    @Autowired
    private PostService postService;
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private ConnectionRepository connectionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping("")
    public ResponseEntity<Post> createPost(@RequestBody Map<String, Object> request) {
        String text = (String) request.get("text");
        String username = (String) request.get("username");
        
        @SuppressWarnings("unchecked")
        List<String> hashtags = (List<String>) request.get("hashtags");
        
        @SuppressWarnings("unchecked")
        List<String> imageUrls = (List<String>) request.get("imageUrls");
        
        @SuppressWarnings("unchecked")
        List<String> videoUrls = (List<String>) request.get("videoUrls");
        
        Post savedPost = postService.createPostWithMedia(text, username, hashtags, imageUrls, videoUrls);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedPost);
    }
    
    // Add this new endpoint to get posts by username
    @GetMapping
    public ResponseEntity<List<Post>> getUserPosts(@RequestParam String username) {
        List<Post> posts = postService.getPostsByUsername(username);
        return ResponseEntity.ok(posts);
    }

    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> togglePostLike(
            @PathVariable("id") Long postId,
            @RequestBody Map<String, Object> requestBody) {
        
        try {
            String username = (String) requestBody.get("username");
            Boolean isLiked = (Boolean) requestBody.get("isLiked");
            
            if (username == null || isLiked == null) {
                return ResponseEntity.badRequest().build();
            }
            
            // Update post like in database
            int likeCount = postService.updatePostLike(postId, username, isLiked);
            
            Map<String, Object> response = new HashMap<>();
            response.put("likeCount", likeCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/user-likes")
    public ResponseEntity<List<Long>> getUserLikedPosts(@RequestParam String username) {
        try {
            List<Long> likedPosts = postService.getUserLikedPostIds(username);
            return ResponseEntity.ok(likedPosts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<Comment> addComment(
            @PathVariable("id") Long postId,
            @RequestBody Map<String, String> requestBody) {
        
        try {
            String text = requestBody.get("text");
            String username = requestBody.get("username");
            
            if (text == null || username == null) {
                return ResponseEntity.badRequest().build();
            }
            
            CommentRequest commentRequest = new CommentRequest();
            commentRequest.setText(text);
            commentRequest.setUsername(username);
            commentRequest.setPostId(postId);
            
            Comment savedComment = postService.addCommentToPost(commentRequest);
            return new ResponseEntity<>(savedComment, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<Comment>> getComments(@PathVariable("id") Long postId) {
        try {
            List<Comment> comments = postService.getCommentsByPostId(postId);
            return ResponseEntity.ok(comments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Add reply to a comment
    @PostMapping("/{postId}/comments/{commentId}/replies")
    public ResponseEntity<Comment> addReply(
            @PathVariable("postId") Long postId,
            @PathVariable("commentId") Long commentId,
            @RequestBody Map<String, String> requestBody) {
        
        try {
            String text = requestBody.get("text");
            String username = requestBody.get("username");
            
            if (text == null || username == null) {
                return ResponseEntity.badRequest().build();
            }
            
            Comment savedReply = postService.addReplyToComment(postId, commentId, text, username);
            return new ResponseEntity<>(savedReply, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Like/unlike a comment
    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<Map<String, Object>> toggleCommentLike(
            @PathVariable("commentId") Long commentId,
            @RequestBody Map<String, Object> requestBody) {
        
        try {
            String username = (String) requestBody.get("username");
            Boolean isLiked = (Boolean) requestBody.get("isLiked");
            
            if (username == null || isLiked == null) {
                return ResponseEntity.badRequest().build();
            }
            
            int likeCount = postService.updateCommentLike(commentId, username, isLiked);
            
            Map<String, Object> response = new HashMap<>();
            response.put("likeCount", likeCount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Get liked comments for a user
    @GetMapping("/user-comment-likes")
    public ResponseEntity<List<Long>> getUserLikedComments(@RequestParam String username) {
        try {
            List<Long> likedComments = postService.getUserLikedCommentIds(username);
            return ResponseEntity.ok(likedComments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePost(@PathVariable("id") Long postId) {
        try {
            postService.deletePost(postId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/feed")
    public ResponseEntity<List<Post>> getFeedPosts(@RequestParam String username) {
        try {
            // 1. Get the user's own posts
            List<Post> userPosts = postRepository.findByUsernameOrderByCreatedDateDesc(username);
            
            // 2. Get the user's connections
            List<String> connections = findConnectionsByUsername(username);
            
            // 3. Get posts from connections
            List<Post> connectionPosts = connections.isEmpty() ? 
                new ArrayList<>() : 
                postRepository.findByUsernameInOrderByCreatedDateDesc(connections);
            
            // 4. Combine and sort all posts by date (newest first)
            List<Post> allPosts = new ArrayList<>();
            allPosts.addAll(userPosts);
            allPosts.addAll(connectionPosts);
            
            allPosts.sort(Comparator.comparing(Post::getCreatedDate).reversed());
            
            // 5. Enrich posts with additional data (author info, like counts, etc.)
            enrichPostsWithData(allPosts);
            
            return ResponseEntity.ok(allPosts);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Helper method to get connections for a user
    private List<String> findConnectionsByUsername(String username) {
        // Get all connections where status = 'connected' and the user is either the sender or receiver
        List<String> connections = new ArrayList<>();
        
        connectionRepository.findAllConnectionsForUser(username).forEach(connection -> {
            if (connection.getFromUsername().equals(username)) {
                connections.add(connection.getToUsername());
            } else {
                connections.add(connection.getFromUsername());
            }
        });
        
        return connections;
    }
    
    // Helper method to enrich posts with additional data
    private void enrichPostsWithData(List<Post> posts) {
        for (Post post : posts) {
            // Set like count
            int likeCount = postService.getPostLikeCount(post.getId());
            post.setLikeCount(likeCount);
            
            // Add author information
            Users author = userRepository.findByUsername(post.getUsername());
            if (author != null) {
                // Store the actual username in a separate field if needed
                post.setAuthorUsername(post.getUsername()); // Add this field to Post class
                // Set the author's name in a separate field
                post.setAuthorName(author.getFirstName() + " " + author.getLastName());
                post.setAuthorProfilePhoto(author.getProfilePhoto());
                // Remove or comment out this line until headline field is added to Users class
                // post.setAuthorHeadline(author.getHeadline());
                post.setAuthorMajor(author.getMajor());
            }
            
            // Add comments
            List<Comment> comments = postService.getCommentsByPostId(post.getId());
            post.setComments(formatComments(comments));
        }
    }
    
    // Helper method to format comments for response
    private List<Map<String, Object>> formatComments(List<Comment> comments) {
        List<Map<String, Object>> formattedComments = new ArrayList<>();
        
        // Group comments by parent ID to organize replies
        Map<Long, List<Comment>> repliesByParentId = new HashMap<>();
        List<Comment> topLevelComments = new ArrayList<>();
        
        // Separate top-level comments from replies
        for (Comment comment : comments) {
            if (comment.getParentId() == null) {
                topLevelComments.add(comment);
            } else {
                repliesByParentId
                    .computeIfAbsent(comment.getParentId(), k -> new ArrayList<>())
                    .add(comment);
            }
        }
        
        // Format top-level comments and their replies
        for (Comment comment : topLevelComments) {
            Map<String, Object> formattedComment = new HashMap<>();
            formattedComment.put("id", comment.getId());
            formattedComment.put("text", comment.getText());
            formattedComment.put("date", comment.getCreatedDate());
            
            // Add like count
            int likeCount = postService.getCommentLikeCount(comment.getId());
            formattedComment.put("likes", likeCount);
            
            // Add author information
            Users author = userRepository.findByUsername(comment.getUsername());
            Map<String, Object> authorInfo = new HashMap<>();
            if (author != null) {
                authorInfo.put("username", author.getUsername());
                authorInfo.put("name", author.getFirstName() + " " + author.getLastName());
                authorInfo.put("profilePhoto", author.getProfilePhoto());
            } else {
                authorInfo.put("username", comment.getUsername());
                authorInfo.put("name", "Unknown User");
                authorInfo.put("profilePhoto", null);
            }
            formattedComment.put("author", authorInfo);
            
            // Add replies if any
            List<Comment> replies = repliesByParentId.get(comment.getId());
            if (replies != null && !replies.isEmpty()) {
                List<Map<String, Object>> formattedReplies = new ArrayList<>();
                
                for (Comment reply : replies) {
                    Map<String, Object> formattedReply = new HashMap<>();
                    formattedReply.put("id", reply.getId());
                    formattedReply.put("text", reply.getText());
                    formattedReply.put("date", reply.getCreatedDate());
                    formattedReply.put("parentId", reply.getParentId());
                    
                    // Add reply like count
                    int replyLikeCount = postService.getCommentLikeCount(reply.getId());
                    formattedReply.put("likes", replyLikeCount);
                    
                    // Add reply author information
                    Users replyAuthor = userRepository.findByUsername(reply.getUsername());
                    Map<String, Object> replyAuthorInfo = new HashMap<>();
                    if (replyAuthor != null) {
                        replyAuthorInfo.put("username", replyAuthor.getUsername());
                        replyAuthorInfo.put("name", replyAuthor.getFirstName() + " " + replyAuthor.getLastName());
                        replyAuthorInfo.put("profilePhoto", replyAuthor.getProfilePhoto());
                    } else {
                        replyAuthorInfo.put("username", reply.getUsername());
                        replyAuthorInfo.put("name", "Unknown User");
                        replyAuthorInfo.put("profilePhoto", null);
                    }
                    formattedReply.put("author", replyAuthorInfo);
                    
                    formattedReplies.add(formattedReply);
                }
                
                formattedComment.put("replies", formattedReplies);
            }
            
            formattedComments.add(formattedComment);
        }
        
        return formattedComments;
    }
}
