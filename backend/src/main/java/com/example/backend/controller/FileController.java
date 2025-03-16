package com.example.backend.controller;

import com.example.backend.service.FileStorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/files")
public class FileController {

    @Autowired
    private FileStorageService fileStorageService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) {
        try {
            String folder = type.equals("profile") ? "profile-photos" : "cover-photos";
            String filePath = fileStorageService.storeFile(file, folder);
               
            Map<String, String> response = new HashMap<>();
            response.put("url", "http://localhost:8080/uploads/" + filePath);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    @PostMapping("/upload-base64")
    public ResponseEntity<Map<String, String>> uploadBase64Image(
            @RequestBody Map<String, String> request) {
        try {
            // Base64 handling logic would go here
            // For now, we'll just return a mock response
            Map<String, String> response = new HashMap<>();
            response.put("url", "http://localhost:8080/uploads/mock-base64-image.jpg");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Add this new endpoint specifically for post media uploads
    @PostMapping("/upload-media")
    public ResponseEntity<Map<String, String>> uploadMedia(
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") String type) {
        try {
            String folder = type.equals("image") ? "post-images" : "post-videos";
            String filePath = fileStorageService.storeFile(file, folder);
               
            Map<String, String> response = new HashMap<>();
            // Return full URL including context path
            response.put("fileUrl", "/uploads/" + filePath);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/debug/uploads")
    public ResponseEntity<Map<String, Object>> debugUploads() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Get upload directory information
            String uploadDir = fileStorageService.getUploadDir(); // Get from service
            Path uploadPath = Paths.get(uploadDir);
            result.put("uploadDir", uploadDir);
            result.put("absolutePath", uploadPath.toAbsolutePath().toString());
            result.put("exists", Files.exists(uploadPath));
            result.put("isDirectory", Files.isDirectory(uploadPath));
            result.put("isWritable", Files.isWritable(uploadPath));
            
            // List subdirectories
            if (Files.exists(uploadPath) && Files.isDirectory(uploadPath)) {
                List<String> subdirs = new ArrayList<>();
                try (DirectoryStream<Path> stream = Files.newDirectoryStream(uploadPath)) {
                    for (Path entry : stream) {
                        if (Files.isDirectory(entry)) {
                            subdirs.add(entry.getFileName().toString());
                        }
                    }
                }
                result.put("subdirectories", subdirs);
                
                // Check for post-images and post-videos
                Path postImagesPath = uploadPath.resolve("post-images");
                Path postVideosPath = uploadPath.resolve("post-videos");
                
                Map<String, Object> postImagesInfo = new HashMap<>();
                postImagesInfo.put("exists", Files.exists(postImagesPath));
                postImagesInfo.put("isDirectory", Files.isDirectory(postImagesPath));
                if (Files.exists(postImagesPath) && Files.isDirectory(postImagesPath)) {
                    List<String> files = new ArrayList<>();
                    try (DirectoryStream<Path> stream = Files.newDirectoryStream(postImagesPath)) {
                        for (Path entry : stream) {
                            if (Files.isRegularFile(entry)) {
                                files.add(entry.getFileName().toString());
                            }
                        }
                    }
                    postImagesInfo.put("fileCount", files.size());
                    postImagesInfo.put("sampleFiles", files.stream().limit(5).collect(Collectors.toList()));
                }
                result.put("postImages", postImagesInfo);
                
                // Similar check for post-videos
                Map<String, Object> postVideosInfo = new HashMap<>();
                postVideosInfo.put("exists", Files.exists(postVideosPath));
                postVideosInfo.put("isDirectory", Files.isDirectory(postVideosPath));
                if (Files.exists(postVideosPath) && Files.isDirectory(postVideosPath)) {
                    List<String> files = new ArrayList<>();
                    try (DirectoryStream<Path> stream = Files.newDirectoryStream(postVideosPath)) {
                        for (Path entry : stream) {
                            if (Files.isRegularFile(entry)) {
                                files.add(entry.getFileName().toString());
                            }
                        }
                    }
                    postVideosInfo.put("fileCount", files.size());
                    postVideosInfo.put("sampleFiles", files.stream().limit(5).collect(Collectors.toList()));
                }
                result.put("postVideos", postVideosInfo);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(result);
        }
    }
}