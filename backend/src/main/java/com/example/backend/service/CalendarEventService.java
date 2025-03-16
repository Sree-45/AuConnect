package com.example.backend.service;

import com.example.backend.model.CalendarEvent;
import com.example.backend.repository.CalendarEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CalendarEventService {

    @Autowired
    private CalendarEventRepository calendarEventRepository;
    
    public List<CalendarEvent> getAllEvents() {
        return calendarEventRepository.findAll();
    }
    
    public List<CalendarEvent> getEventsByCategory(String category) {
        return calendarEventRepository.findByCategory(category);
    }
    
    public Optional<CalendarEvent> getEventById(Long id) {
        return calendarEventRepository.findById(id);
    }
    
    public List<CalendarEvent> searchEvents(String keyword) {
        return calendarEventRepository.findByEventContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
                keyword, keyword);
    }
    
    public CalendarEvent createEvent(CalendarEvent calendarEvent) {
        calendarEvent.setCreatedAt(LocalDateTime.now());
        calendarEvent.setUpdatedAt(LocalDateTime.now());
        return calendarEventRepository.save(calendarEvent);
    }
    
    public CalendarEvent updateEvent(Long id, CalendarEvent updatedEvent) {
        Optional<CalendarEvent> existingEventOpt = calendarEventRepository.findById(id);
        
        if (existingEventOpt.isPresent()) {
            CalendarEvent existingEvent = existingEventOpt.get();
            existingEvent.setEvent(updatedEvent.getEvent());
            existingEvent.setDate(updatedEvent.getDate());
            existingEvent.setCategory(updatedEvent.getCategory());
            existingEvent.setDescription(updatedEvent.getDescription());
            existingEvent.setUpdatedAt(LocalDateTime.now());
            
            return calendarEventRepository.save(existingEvent);
        }
        
        return null;
    }
    
    public boolean deleteEvent(Long id) {
        Optional<CalendarEvent> existingEvent = calendarEventRepository.findById(id);
        
        if (existingEvent.isPresent()) {
            calendarEventRepository.delete(existingEvent.get());
            return true;
        }
        
        return false;
    }
    
    public void seedInitialData() {
        // Only seed if database is empty
        if (calendarEventRepository.count() == 0) {
            // Create initial calendar events similar to the hardcoded data
            createSampleEvents();
        }
    }
    
    private void createSampleEvents() {
        // Add sample calendar events (you can add more here)
        addSampleEvent("1st Spell of Instructions", 
                "November 11, 2023 - January 09, 2025", 
                "Academic", 
                "First phase of classroom instruction");
        
        addSampleEvent("1st Midterm Examinations", 
                "January 10, 2025", 
                "Examination", 
                "First midterm exams");
        
        addSampleEvent("Sankranti Vacation", 
                "January 11, 2025 - January 17, 2025", 
                "Holiday", 
                "Sankranti festival break");
        
        // Add more events as needed
    }
    
    private void addSampleEvent(String name, String date, String category, String description) {
        CalendarEvent event = new CalendarEvent();
        event.setEvent(name);
        event.setDate(date);
        event.setCategory(category);
        event.setDescription(description);
        event.setCreatedAt(LocalDateTime.now());
        event.setUpdatedAt(LocalDateTime.now());
        
        calendarEventRepository.save(event);
    }
}
