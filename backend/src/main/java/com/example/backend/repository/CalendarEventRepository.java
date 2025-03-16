package com.example.backend.repository;

import com.example.backend.model.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, Long> {
    List<CalendarEvent> findByCategory(String category);
    
    List<CalendarEvent> findByEventContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String eventKeyword, String descriptionKeyword);
}
