package com.example.backend.controller;

import com.example.backend.model.CalendarEvent;
import com.example.backend.service.CalendarEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/calendar")
@CrossOrigin(origins = "http://localhost:5173")
public class CalendarEventController {

    @Autowired
    private CalendarEventService calendarEventService;

    @GetMapping
    public ResponseEntity<List<CalendarEvent>> getAllEvents() {
        return ResponseEntity.ok(calendarEventService.getAllEvents());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CalendarEvent> getEventById(@PathVariable Long id) {
        Optional<CalendarEvent> event = calendarEventService.getEventById(id);
        return event.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<CalendarEvent>> getEventsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(calendarEventService.getEventsByCategory(category));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<CalendarEvent>> searchEvents(@RequestParam String keyword) {
        return ResponseEntity.ok(calendarEventService.searchEvents(keyword));
    }
    
    @PostMapping
    public ResponseEntity<CalendarEvent> createEvent(@RequestBody CalendarEvent calendarEvent) {
        CalendarEvent savedEvent = calendarEventService.createEvent(calendarEvent);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedEvent);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateEvent(
            @PathVariable Long id, 
            @RequestBody CalendarEvent calendarEvent) {
        
        CalendarEvent updatedEvent = calendarEventService.updateEvent(id, calendarEvent);
        
        if (updatedEvent == null) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Event not found with id: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        return ResponseEntity.ok(updatedEvent);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteEvent(@PathVariable Long id) {
        boolean isDeleted = calendarEventService.deleteEvent(id);
        
        if (!isDeleted) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Event not found with id: " + id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Event deleted successfully");
        return ResponseEntity.ok(response);
    }
}
