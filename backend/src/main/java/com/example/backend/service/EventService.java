package com.example.backend.service;

import com.example.backend.model.Event;
import com.example.backend.repository.EventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }
    
    public Optional<Event> getEventById(Long id) {
        return eventRepository.findById(id);
    }
    
    public List<Event> getEventsByCategory(String category) {
        return eventRepository.findByCategory(category);
    }
    
    public List<Event> searchEvents(String term) {
        return eventRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrLocationContainingIgnoreCase(
            term, term, term);
    }
    
    public Event createEvent(Event event, MultipartFile photo) {
        if (photo != null && !photo.isEmpty()) {
            try {
                String filePath = fileStorageService.storeFile(photo, "event-photos");
                event.setPhotoUrl("/uploads/" + filePath);
            } catch (Exception e) {
                throw new RuntimeException("Failed to upload event photo", e);
            }
        }
        
        return eventRepository.save(event);
    }
    
    public Event updateEvent(Long id, Event eventDetails, MultipartFile photo) {
        Event event = eventRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
        
        event.setName(eventDetails.getName());
        event.setDate(eventDetails.getDate());
        event.setTime(eventDetails.getTime());
        event.setEndDate(eventDetails.getEndDate());
        event.setEndTime(eventDetails.getEndTime());
        event.setLocation(eventDetails.getLocation());
        event.setDescription(eventDetails.getDescription());
        event.setCategory(eventDetails.getCategory());
        event.setRegistrationUrl(eventDetails.getRegistrationUrl());
        
        if (photo != null && !photo.isEmpty()) {
            try {
                String filePath = fileStorageService.storeFile(photo, "event-photos");
                event.setPhotoUrl("/uploads/" + filePath);
            } catch (Exception e) {
                throw new RuntimeException("Failed to upload event photo", e);
            }
        }
        
        return eventRepository.save(event);
    }
    
    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }
}
