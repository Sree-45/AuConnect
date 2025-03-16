package com.example.backend.service;

import com.example.backend.model.EventCategory;
import com.example.backend.repository.EventCategoryRepository;
import com.example.backend.repository.EventRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Arrays;

@Service
public class EventCategoryService {

    @Autowired
    private EventCategoryRepository categoryRepository;
    
    @Autowired
    private EventRepository eventRepository;
    
    public List<EventCategory> getAllCategories() {
        return categoryRepository.findAll();
    }
    
    public Optional<EventCategory> getCategoryByName(String name) {
        return categoryRepository.findByName(name);
    }
    
    public EventCategory createCategory(EventCategory category) {
        if (categoryRepository.existsByName(category.getName())) {
            throw new RuntimeException("Category already exists: " + category.getName());
        }
        return categoryRepository.save(category);
    }
    
    public EventCategory updateCategory(String oldName, String newName) {
        EventCategory category = categoryRepository.findByName(oldName)
            .orElseThrow(() -> new RuntimeException("Category not found: " + oldName));
        
        if (categoryRepository.existsByName(newName) && !oldName.equals(newName)) {
            throw new RuntimeException("Category name already exists: " + newName);
        }
        
        // Update all events with this category
        eventRepository.findByCategory(oldName).forEach(event -> {
            event.setCategory(newName);
            eventRepository.save(event);
        });
        
        category.setName(newName);
        return categoryRepository.save(category);
    }
    
    @Transactional
    public void deleteCategory(String name) {
        EventCategory category = categoryRepository.findByName(name)
            .orElseThrow(() -> new RuntimeException("Category not found: " + name));
        
        // Update all events with this category to "Other"
        eventRepository.findByCategory(name).forEach(event -> {
            event.setCategory("Other");
            eventRepository.save(event);
        });
        
        categoryRepository.delete(category);
    }
    
    public void initializeDefaultCategories() {
        List<String> defaultCategories = Arrays.asList(
            "Academic", "Cultural", "Sports", "Workshop", "Conference", "Seminar", "Other"
        );
        
        for (String categoryName : defaultCategories) {
            if (!categoryRepository.existsByName(categoryName)) {
                EventCategory category = new EventCategory();
                category.setName(categoryName);
                categoryRepository.save(category);
            }
        }
    }
}
