package com.example.backend.dto;

import java.util.List;

public class PostRequest {
    private String text;
    private String username;
    private List<String> hashtags;
    
    // Getters and setters
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
    
    // New getters and setters for hashtags
    public List<String> getHashtags() {
        return hashtags;
    }
    
    public void setHashtags(List<String> hashtags) {
        this.hashtags = hashtags;
    }
}