package com.example.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${file.upload-dir}")
    private String uploadDir;

    public String storeFile(MultipartFile file, String folder) throws IOException {
        try {
            System.out.println("Beginning file storage process");
            System.out.println("Base upload directory: " + uploadDir);
            
            Path uploadPath = Paths.get(uploadDir, folder);
            System.out.println("Target folder path: " + uploadPath.toAbsolutePath());
            
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                System.out.println("Created directory: " + uploadPath.toAbsolutePath());
            } else {
                System.out.println("Directory already exists: " + uploadPath.toAbsolutePath());
            }

            // Generate unique filename
            String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = uploadPath.resolve(fileName);
            System.out.println("Saving file to: " + filePath.toAbsolutePath());

            // Save file
            Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
            System.out.println("File saved successfully");

            // Return relative file path for URL construction
            return folder + "/" + fileName;
        } catch (Exception e) {
            System.err.println("Failed to store file: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("Failed to store file: " + e.getMessage(), e);
        }
    }

    public String getFileUrl(String filePath) {
        return "/uploads/" + filePath;
    }

    public String getUploadDir() {
        return this.uploadDir;
    }
}
