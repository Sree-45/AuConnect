package com.example.backend.controller;

import com.example.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/posts")
public class PostMediaController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/upload-media")
    public ResponseEntity<Map<String, String>> uploadPostMedia(@RequestParam("file") MultipartFile file, 
                                                              @RequestParam("type") String type) {
        try {
            // Store file in post-images or post-videos subdirectory
            String folder = type.equals("image") ? "post-images" : "post-videos";
            String filePath = fileStorageService.storeFile(file, folder);
            
            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", "/uploads/" + filePath);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error uploading media: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
