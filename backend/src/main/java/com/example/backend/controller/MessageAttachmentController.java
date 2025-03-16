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
@RequestMapping("/api/messages")
public class MessageAttachmentController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/upload-attachment")
    public ResponseEntity<Map<String, String>> uploadMessageAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) {
        try {
            // Determine folder based on file type
            String folder;
            switch (type) {
                case "image":
                    folder = "message-images";
                    break;
                case "video":
                    folder = "message-videos";
                    break;
                case "document":
                    folder = "message-documents";
                    break;
                default:
                    folder = "message-attachments";
            }
            
            // Store the file
            String filePath = fileStorageService.storeFile(file, folder);
            
            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", "/uploads/" + filePath);
            response.put("fileName", file.getOriginalFilename());
            response.put("fileType", type);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}
