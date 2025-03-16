package com.example.backend.service;

import com.example.backend.model.UniversityContact;
import com.example.backend.repository.UniversityContactRepository;
import org.springframework.stereotype.Service;

@Service
public class UniversityContactService {
    
    private final UniversityContactRepository contactRepository;
    
    public UniversityContactService(UniversityContactRepository contactRepository) {
        this.contactRepository = contactRepository;
    }
    
    public UniversityContact getContactByUsername(String username) {
        return contactRepository.findByUniversityUsername(username);
    }
    
    public UniversityContact saveContact(UniversityContact contact) {
        return contactRepository.save(contact);
    }
    
    public void deleteContact(String username) {
        UniversityContact contact = contactRepository.findByUniversityUsername(username);
        if (contact != null) {
            contactRepository.delete(contact);
        }
    }
}
