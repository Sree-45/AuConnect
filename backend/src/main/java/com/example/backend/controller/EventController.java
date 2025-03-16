package com.example.backend.controller;

import com.example.backend.model.Event;
import com.example.backend.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/events")
@CrossOrigin(origins = "http://localhost:5173")
public class EventController {

    @Autowired
    private EventService eventService;
    
    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        return ResponseEntity.ok(eventService.getAllEvents());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Event> getEventById(@PathVariable Long id) {
        return eventService.getEventById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<List<Event>> getEventsByCategory(@PathVariable String category) {
        return ResponseEntity.ok(eventService.getEventsByCategory(category));
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<Event>> searchEvents(@RequestParam String term) {
        return ResponseEntity.ok(eventService.searchEvents(term));
    }
    
    @PostMapping
    public ResponseEntity<Event> createEvent(
            @RequestParam("name") String name,
            @RequestParam("date") String date,
            @RequestParam("time") String time,
            @RequestParam(name = "endDate", required = false) String endDate,
            @RequestParam(name = "endTime", required = false) String endTime,
            @RequestParam("location") String location,
            @RequestParam("category") String category,
            @RequestParam(name = "description", required = false) String description,
            @RequestParam(name = "registrationUrl", required = false) String registrationUrl,
            @RequestParam(name = "photo", required = false) MultipartFile photo) {
        
        Event event = new Event();
        event.setName(name);
        event.setDate(date);
        event.setTime(time);
        event.setEndDate(endDate);
        event.setEndTime(endTime);
        event.setLocation(location);
        event.setCategory(category);
        event.setDescription(description);
        event.setRegistrationUrl(registrationUrl);
        
        Event createdEvent = eventService.createEvent(event, photo);
        return new ResponseEntity<>(createdEvent, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Event> updateEvent(
            @PathVariable Long id,
            @RequestParam("name") String name,
            @RequestParam("date") String date,
            @RequestParam("time") String time,
            @RequestParam(name = "endDate", required = false) String endDate,
            @RequestParam(name = "endTime", required = false) String endTime,
            @RequestParam("location") String location,
            @RequestParam("category") String category,
            @RequestParam(name = "description", required = false) String description,
            @RequestParam(name = "registrationUrl", required = false) String registrationUrl,
            @RequestParam(name = "photo", required = false) MultipartFile photo) {
        
        try {
            Event event = new Event();
            event.setName(name);
            event.setDate(date);
            event.setTime(time);
            event.setEndDate(endDate);
            event.setEndTime(endTime);
            event.setLocation(location);
            event.setCategory(category);
            event.setDescription(description);
            event.setRegistrationUrl(registrationUrl);
            
            Event updatedEvent = eventService.updateEvent(id, event, photo);
            return ResponseEntity.ok(updatedEvent);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteEvent(@PathVariable Long id) {
        try {
            eventService.deleteEvent(id);
            Map<String, Boolean> response = new HashMap<>();
            response.put("deleted", Boolean.TRUE);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
