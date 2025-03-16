package com.example.backend.controller;

import com.example.backend.model.UniversityContact;
import com.example.backend.service.UniversityContactService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/university")
public class UniversityContactController {

    private final UniversityContactService contactService;
    
    public UniversityContactController(UniversityContactService contactService) {
        this.contactService = contactService;
    }
    
    @GetMapping("/contact")
    public ResponseEntity<?> getUniversityContact(@RequestParam String username) {
        try {
            UniversityContact contact = contactService.getContactByUsername(username);
            if (contact != null) {
                return ResponseEntity.ok(contact);
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("message", "Contact information not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to fetch contact information: " + e.getMessage()));
        }
    }
    
    @PostMapping("/contact")
    public ResponseEntity<?> createOrUpdateContact(@RequestBody UniversityContact contact) {
        try {
            // Check if contact already exists
            UniversityContact existingContact = contactService.getContactByUsername(contact.getUniversityUsername());
            
            if (existingContact != null) {
                // Update existing contact
                contact.setId(existingContact.getId());
            }
            
            UniversityContact savedContact = contactService.saveContact(contact);
            return ResponseEntity.ok(savedContact);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to save contact information: " + e.getMessage()));
        }
    }
    
    @DeleteMapping("/contact")
    public ResponseEntity<?> deleteContact(@RequestParam String username) {
        try {
            contactService.deleteContact(username);
            return ResponseEntity.ok(Map.of("message", "Contact deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete contact: " + e.getMessage()));
        }
    }
}
