package com.example.backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.backend.model.Post;
import com.example.backend.model.PostLike;
import com.example.backend.model.Comment;
import com.example.backend.model.CommentLike;
import com.example.backend.model.Hashtag;
import com.example.backend.model.Users; // Added missing import
import com.example.backend.dto.PostRequest;
import com.example.backend.dto.CommentRequest;
import com.example.backend.repository.PostLikeRepository;
import com.example.backend.repository.PostRepository;
import com.example.backend.repository.CommentRepository;
import com.example.backend.repository.UserRepository;

import jakarta.transaction.Transactional;

import com.example.backend.repository.CommentLikeRepository;
import com.example.backend.repository.HashtagRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.Set; // Added missing import
import java.util.HashSet; // Added missing import

@Service
public class PostService {
    
    @Autowired
    private PostRepository postRepository;
    
    @Autowired
    private PostLikeRepository postLikeRepository;
    
    @Autowired
    private CommentRepository commentRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private CommentLikeRepository commentLikeRepository;
    
    @Autowired
    private HashtagRepository hashtagRepository;
    
    public Post createPost(PostRequest postRequest) {
        System.out.println("Received post request: " + postRequest.getText() + ", username: " + postRequest.getUsername());
        
        Post post = new Post();
        post.setText(postRequest.getText());
        
        // Set creation date
        post.setCreatedDate(LocalDateTime.now());
        
        // Save username if provided
        if(postRequest.getUsername() != null) {
            post.setUsername(postRequest.getUsername());
        }
        
        // Process hashtags
        if (postRequest.getHashtags() != null && !postRequest.getHashtags().isEmpty()) {
            Set<Hashtag> hashtagEntities = new HashSet<>();
            for (String hashtagName : postRequest.getHashtags()) {
                // Check if hashtag already exists
                Hashtag hashtag = hashtagRepository.findByName(hashtagName);
                if (hashtag == null) {
                    // Create new hashtag
                    hashtag = new Hashtag(hashtagName);
                    hashtag = hashtagRepository.save(hashtag); // Save the hashtag first
                }
                hashtagEntities.add(hashtag);
            }
            post.setHashtags(hashtagEntities);
        }
        
        Post savedPost = postRepository.save(post);
        System.out.println("Post saved with ID: " + savedPost.getId());
        return savedPost;
    }

    public Post createPostWithMedia(String text, String username, List<String> hashtags, 
                                    List<String> imageUrls, List<String> videoUrls) {
        // Find user
        Users user = userRepository.findByUsername(username);
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        
        // Create post
        Post post = new Post();
        post.setText(text);
        post.setUsername(username);
        post.setCreatedDate(LocalDateTime.now()); // Fixed: using LocalDateTime instead of Date
        
        // Add hashtags
        if (hashtags != null && !hashtags.isEmpty()) {
            Set<Hashtag> hashtagEntities = new HashSet<>();
            for (String tag : hashtags) {
                Hashtag hashtag = hashtagRepository.findByName(tag);
                if (hashtag == null) {
                    // Create new hashtag if it doesn't exist
                    hashtag = new Hashtag(tag);
                    hashtag = hashtagRepository.save(hashtag); // Save the hashtag first
                }
                hashtagEntities.add(hashtag);
            }
            post.setHashtags(hashtagEntities);
        }
        
        // Set media URLs
        if (imageUrls != null) {
            post.setImageUrls(imageUrls);
        }
        
        if (videoUrls != null) {
            post.setVideoUrls(videoUrls);
        }
        
        // Save post
        return postRepository.save(post);
    }

    public List<Post> getPostsByUsername(String username) {
        System.out.println("Fetching posts for username: " + username);
        List<Post> posts = postRepository.findByUsernameOrderByCreatedDateDesc(username);
        
        // Populate like count and author information for each post
        for (Post post : posts) {
            // Set like count
            int count = postLikeRepository.countByPostId(post.getId());
            post.setLikeCount(count);
            
            // Add author information
            Users author = userRepository.findByUsername(post.getUsername());
            if (author != null) {
                post.setAuthorUsername(post.getUsername());
                post.setAuthorName(author.getFirstName() + " " + author.getLastName());
                post.setAuthorProfilePhoto(author.getProfilePhoto());
                post.setAuthorMajor(author.getMajor());
            }
            
            // Fetch top-level comments for the post
            List<Comment> topLevelComments = commentRepository.findByPostIdAndParentIdIsNullOrderByCreatedDateAsc(post.getId());
            List<Map<String, Object>> formattedComments = new ArrayList<>();
            
            for (Comment comment : topLevelComments) {
                // Format comment with author info and like count
                Map<String, Object> formattedComment = formatComment(comment);
                
                // Get replies for this comment
                List<Comment> replies = commentRepository.findByParentIdOrderByCreatedDateAsc(comment.getId());
                List<Map<String, Object>> formattedReplies = new ArrayList<>();
                
                for (Comment reply : replies) {
                    formattedReplies.add(formatComment(reply));
                }
                
                if (!formattedReplies.isEmpty()) {
                    formattedComment.put("replies", formattedReplies);
                }
                
                formattedComments.add(formattedComment);
            }
            
            post.setComments(formattedComments);
        }
        
        return posts;
    }
    
    // Helper method to format a comment with all necessary info
    private Map<String, Object> formatComment(Comment comment) {
        Map<String, Object> formattedComment = new HashMap<>();
        
        formattedComment.put("id", comment.getId());
        formattedComment.put("text", comment.getText());
        formattedComment.put("date", comment.getCreatedDate());
        
        // Add like count
        int likeCount = commentLikeRepository.countByCommentId(comment.getId());
        formattedComment.put("likes", likeCount);
        
        // Add parent ID if this is a reply
        if (comment.getParentId() != null) {
            formattedComment.put("parentId", comment.getParentId());
        }
        
        // Get author info
        Users user = userRepository.findByUsername(comment.getUsername());
        Map<String, Object> author = new HashMap<>();
        if (user != null) {
            author.put("username", user.getUsername());
            author.put("name", user.getFirstName() + " " + user.getLastName());
            author.put("profilePhoto", user.getProfilePhoto());
        } else {
            author.put("username", comment.getUsername());
            author.put("name", "Unknown User");
            author.put("profilePhoto", null);
        }
        formattedComment.put("author", author);
        
        return formattedComment;
    }

    public int updatePostLike(Long postId, String username, boolean isLiked) {
        // Check if the user has already liked the post
        PostLike existingLike = postLikeRepository.findByPostIdAndUsername(postId, username);
        
        if (isLiked) {
            // User wants to like the post
            if (existingLike == null) {
                // Create new like entry
                PostLike newLike = new PostLike();
                newLike.setPostId(postId);
                newLike.setUsername(username);
                newLike.setCreatedDate(LocalDateTime.now());
                postLikeRepository.save(newLike);
            }
            // Otherwise user has already liked the post, do nothing
        } else {
            // User wants to unlike the post
            if (existingLike != null) {
                postLikeRepository.delete(existingLike);
            }
        }
        
        // Return updated like count
        return postLikeRepository.countByPostId(postId);
    }
    
    // Get list of post IDs liked by user
    public List<Long> getUserLikedPostIds(String username) {
        return postLikeRepository.findPostIdsByUsername(username);
    }
    
    public Comment addCommentToPost(CommentRequest commentRequest) {
        Comment comment = new Comment();
        comment.setText(commentRequest.getText());
        comment.setUsername(commentRequest.getUsername());
        comment.setPostId(commentRequest.getPostId());
        comment.setCreatedDate(LocalDateTime.now());
        
        return commentRepository.save(comment);
    }
    
    public List<Comment> getCommentsByPostId(Long postId) {
        return commentRepository.findByPostIdOrderByCreatedDateAsc(postId);
    }
    
    public Comment addReplyToComment(Long postId, Long commentId, String text, String username) {
        Comment reply = new Comment();
        reply.setText(text);
        reply.setUsername(username);
        reply.setPostId(postId);
        reply.setParentId(commentId);
        reply.setCreatedDate(LocalDateTime.now());
        
        return commentRepository.save(reply);
    }
    
    public int updateCommentLike(Long commentId, String username, boolean isLiked) {
        // Check if the user has already liked the comment
        CommentLike existingLike = commentLikeRepository.findByCommentIdAndUsername(commentId, username);
        
        if (isLiked) {
            // User wants to like the comment
            if (existingLike == null) {
                // Create new like
                CommentLike newLike = new CommentLike();
                newLike.setCommentId(commentId);
                newLike.setUsername(username);
                newLike.setCreatedDate(LocalDateTime.now());
                commentLikeRepository.save(newLike);
            }
        } else {
            // User wants to unlike the comment
            if (existingLike != null) {
                commentLikeRepository.delete(existingLike);
            }
        }
        
        // Return updated like count
        return commentLikeRepository.countByCommentId(commentId);
    }
    
    // Get list of comment IDs liked by user
    public List<Long> getUserLikedCommentIds(String username) {
        return commentLikeRepository.findCommentIdsByUsername(username);
    }

    @Transactional
    public void deletePost(Long postId) {
        try {
            // Get the post first
            Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found with id: " + postId));
            
            // Delete comments and their likes
            List<Comment> comments = commentRepository.findByPostIdOrderByCreatedDateAsc(postId);
            for (Comment comment : comments) {
                commentLikeRepository.deleteByCommentId(comment.getId());
            }
            
            // Delete post likes
            postLikeRepository.deleteByPostId(postId);
            
            // Delete comments after their likes are deleted
            commentRepository.deleteByPostId(postId);
            
            // Finally delete the post itself
            postRepository.delete(post);
            
            System.out.println("Successfully deleted post with ID: " + postId);
        } catch (Exception e) {
            System.err.println("Error deleting post with ID " + postId + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }

    public int getPostLikeCount(Long postId) {
        return postLikeRepository.countByPostId(postId);
    }

    public int getCommentLikeCount(Long commentId) {
        return commentLikeRepository.countByCommentId(commentId);
    }
}
