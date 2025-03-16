package com.example.backend.controller;

import com.example.backend.model.Faculty;
import com.example.backend.service.FacultyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.backend.service.FileStorageService;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/faculty")
@CrossOrigin(origins = "http://localhost:5173")
public class FacultyController {

    @Autowired
    private FacultyService facultyService;
    
    @Autowired
    private FileStorageService fileStorageService;
    
    @GetMapping
    public ResponseEntity<List<Faculty>> getAllFaculty(
        @RequestParam(required = false) Integer limit
    ) {
        List<Faculty> facultyList = facultyService.getAllFaculty();
        
        // Ensure profile photo URLs have the full path if they don't already
        facultyList.forEach(faculty -> {
            if (faculty.getProfilePhoto() != null && !faculty.getProfilePhoto().startsWith("http")) {
                faculty.setProfilePhoto("/uploads/" + faculty.getProfilePhoto());
            }
        });
        
        // Apply limit if specified
        if (limit != null && limit > 0 && limit < facultyList.size()) {
            facultyList = facultyList.subList(0, limit);
        }
        
        return ResponseEntity.ok(facultyList);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Faculty> getFacultyById(@PathVariable Long id) {
        Optional<Faculty> faculty = facultyService.getFacultyById(id);
        return faculty.map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @GetMapping("/department/{department}")
    public ResponseEntity<List<Faculty>> getFacultyByDepartment(@PathVariable String department) {
        return ResponseEntity.ok(facultyService.getFacultyByDepartment(department));
    }
    
    @PostMapping
    public ResponseEntity<Faculty> createFaculty(@RequestBody Faculty faculty) {
        return ResponseEntity.status(HttpStatus.CREATED).body(facultyService.saveFaculty(faculty));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Faculty> updateFaculty(@PathVariable Long id, @RequestBody Faculty faculty) {
        if (!facultyService.getFacultyById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        faculty.setId(id);
        return ResponseEntity.ok(facultyService.saveFaculty(faculty));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFaculty(@PathVariable Long id) {
        if (!facultyService.getFacultyById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        facultyService.deleteFaculty(id);
        return ResponseEntity.noContent().build();
    }
    
    @PostMapping("/upload-photo")
    public ResponseEntity<Map<String, String>> uploadFacultyPhoto(@RequestParam("file") MultipartFile file) {
        try {
            String filePath = fileStorageService.storeFile(file, "faculty-photos");
            
            Map<String, String> response = new HashMap<>();
            response.put("url", "/uploads/" + filePath);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}
