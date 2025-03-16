package com.example.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "university_contacts")
public class UniversityContact {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String universityUsername;
    
    @Column(length = 500)
    private String fullAddress;
    
    @Column
    private String email;
    
    @Column
    private String phone;
    
    @Column
    private String website;
    
    @Column(columnDefinition = "LONGTEXT")
    private String directionsUrl;
    
    // Getters and setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getUniversityUsername() {
        return universityUsername;
    }
    
    public void setUniversityUsername(String universityUsername) {
        this.universityUsername = universityUsername;
    }
    
    public String getFullAddress() {
        return fullAddress;
    }
    
    public void setFullAddress(String fullAddress) {
        this.fullAddress = fullAddress;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPhone() {
        return phone;
    }
    
    public void setPhone(String phone) {
        this.phone = phone;
    }
    
    public String getWebsite() {
        return website;
    }
    
    public void setWebsite(String website) {
        this.website = website;
    }
    
    public String getDirectionsUrl() {
        return directionsUrl;
    }
    
    public void setDirectionsUrl(String directionsUrl) {
        this.directionsUrl = directionsUrl;
    }
}
