package com.example.backend.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Transient;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.CascadeType;
import jakarta.persistence.JoinTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ElementCollection;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.ArrayList;

@Entity
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String text;
    private String username;
    private LocalDateTime createdDate;
    
    @Transient // This field won't be stored in the database
    private int likeCount;
    
    @Transient
    private List<Map<String, Object>> comments;

    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.MERGE})
    @JoinTable(
        name = "post_hashtags",
        joinColumns = @JoinColumn(name = "post_id"),
        inverseJoinColumns = @JoinColumn(name = "hashtag_id")
    )
    private Set<Hashtag> hashtags = new HashSet<>();

    @ElementCollection
    private List<String> imageUrls = new ArrayList<>();

    @ElementCollection
    private List<String> videoUrls = new ArrayList<>();
    
    // Transient fields for author information
    @Transient
    private String authorUsername;
    
    @Transient
    private String authorName;
    
    @Transient
    private String authorProfilePhoto;
    
    @Transient
    private String authorHeadline;
    
    @Transient
    private String authorMajor;

    // Getters and Setters
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

    public List<Map<String, Object>> getComments() {
        return comments;
    }
    
    public void setComments(List<Map<String, Object>> comments) {
        this.comments = comments;
    }

    public Set<Hashtag> getHashtags() {
        return hashtags;
    }

    public void setHashtags(Set<Hashtag> hashtags) {
        this.hashtags = hashtags;
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls;
    }

    public List<String> getVideoUrls() {
        return videoUrls;
    }

    public void setVideoUrls(List<String> videoUrls) {
        this.videoUrls = videoUrls;
    }
    
    public String getAuthorUsername() {
        return authorUsername;
    }
    
    public void setAuthorUsername(String authorUsername) {
        this.authorUsername = authorUsername;
    }
    
    public String getAuthorName() {
        return authorName;
    }
    
    public void setAuthorName(String authorName) {
        this.authorName = authorName;
    }
    
    public String getAuthorProfilePhoto() {
        return authorProfilePhoto;
    }
    
    public void setAuthorProfilePhoto(String authorProfilePhoto) {
        this.authorProfilePhoto = authorProfilePhoto;
    }
    
    public String getAuthorHeadline() {
        return authorHeadline;
    }
    
    public void setAuthorHeadline(String authorHeadline) {
        this.authorHeadline = authorHeadline;
    }
    
    public String getAuthorMajor() {
        return authorMajor;
    }
    
    public void setAuthorMajor(String authorMajor) {
        this.authorMajor = authorMajor;
    }

    // Helper method to add a hashtag
    public void addHashtag(Hashtag hashtag) {
        this.hashtags.add(hashtag);
        hashtag.getPosts().add(this);
    }

    // Helper method to remove a hashtag
    public void removeHashtag(Hashtag hashtag) {
        this.hashtags.remove(hashtag);
        hashtag.getPosts().remove(this);
    }
    
    @Override
    public String toString() {
        return "Post{" +
                "id=" + id +
                ", text='" + text + '\'' +
                ", username='" + username + '\'' +
                ", createdDate=" + createdDate +
                ", likeCount=" + likeCount +
                '}';
    }
}
