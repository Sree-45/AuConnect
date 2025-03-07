package com.example.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comments")
public class Comment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(columnDefinition = "TEXT")
    private String text;
    
    private String username;
    
    @Column(name = "post_id")
    private Long postId;
    
    @Column(name = "parent_id")
    private Long parentId;  // Parent comment ID for replies
    
    @Column(name = "created_date")
    private LocalDateTime createdDate;
    
    @Transient
    private int likeCount;
    
    // Default constructor
    public Comment() {}
    
    // Constructor with fields
    public Comment(String text, String username, Long postId) {
        this.text = text;
        this.username = username;
        this.postId = postId;
        this.createdDate = LocalDateTime.now();
    }
    
    // Constructor with parent comment ID for replies
    public Comment(String text, String username, Long postId, Long parentId) {
        this.text = text;
        this.username = username;
        this.postId = postId;
        this.parentId = parentId;
        this.createdDate = LocalDateTime.now();
    }
    
    // Getters and setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getText() {
        return text;
    }
    
    public void setText(String text) {
        this.text = text;
    }
    
    public String getUsername() {
        return username;
    }
    
    public void setUsername(String username) {
        this.username = username;
    }
    
    public Long getPostId() {
        return postId;
    }
    
    public void setPostId(Long postId) {
        this.postId = postId;
    }
    
    public Long getParentId() {
        return parentId;
    }
    
    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }
    
    public LocalDateTime getCreatedDate() {
        return createdDate;
    }
    
    public void setCreatedDate(LocalDateTime createdDate) {
        this.createdDate = createdDate;
    }
    
    public int getLikeCount() {
        return likeCount;
    }
    
    public void setLikeCount(int likeCount) {
        this.likeCount = likeCount;
    }
}
