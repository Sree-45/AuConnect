package com.example.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "connections")
public class Connection {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String fromUsername;
    private String toUsername;
    private String status; // "pending", "connected", "rejected"
    private LocalDateTime requestDate;
    private LocalDateTime responseDate;
    
    public Connection() {}
    
    public Connection(String fromUsername, String toUsername) {
        this.fromUsername = fromUsername;
        this.toUsername = toUsername;
        this.status = "pending";
        this.requestDate = LocalDateTime.now();
    }
    
    // Getters and setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getFromUsername() {
        return fromUsername;
    }
    
    public void setFromUsername(String fromUsername) {
        this.fromUsername = fromUsername;
    }
    
    public String getToUsername() {
        return toUsername;
    }
    
    public void setToUsername(String toUsername) {
        this.toUsername = toUsername;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
    }
    
    public LocalDateTime getRequestDate() {
        return requestDate;
    }
    
    public void setRequestDate(LocalDateTime requestDate) {
        this.requestDate = requestDate;
    }
    
    public LocalDateTime getResponseDate() {
        return responseDate;
    }
    
    public void setResponseDate(LocalDateTime responseDate) {
        this.responseDate = responseDate;
    }
}
