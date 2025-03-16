package com.example.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.example.backend.model.Users;
import com.example.backend.repository.UserRepository;
import com.example.backend.service.FileStorageService;
import org.springframework.web.multipart.MultipartFile;
import com.example.backend.dto.UserRegistrationDto;
import com.example.backend.service.EmailService;
import com.example.backend.service.OTPService;
import com.example.backend.service.UserService;

import jakarta.mail.MessagingException;

import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
public class UserController {

    @Autowired
    UserRepository ur;

    @Autowired
    private FileStorageService fileStorageService;

    @Autowired
    private OTPService otpService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private UserService userService;

    @PostMapping("/register")
    String reg(@RequestBody Users user) {
        System.out.println("Received user: " + user);
        Users savedUser = this.ur.save(user);
        System.out.println("Saved user: " + savedUser);
        return "registration done";
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Users user) {
        System.out.println("Login attempt for user: " + user.getUsername());
        // Convert username to lowercase for case-insensitive comparison
        user.setUsername(user.getUsername().toLowerCase());
        Users foundUser = ur.findByUsernameAndPassword(user.getUsername(), user.getPassword());
        if (foundUser != null) {
            System.out.println("User logged in: " + foundUser);
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("redirect", "/profile");
            return ResponseEntity.ok(response);
        } else {
            System.out.println("Invalid login attempt for user: " + user.getUsername());
            Map<String, String> response = new HashMap<>();
            response.put("status", "error");
            response.put("message", "Invalid username or password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<Users> getProfile(@RequestParam String username) {
        Users user = ur.findByUsername(username);
        if (user != null) {
            return ResponseEntity.ok(user);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @PutMapping("/profile")
    public ResponseEntity<Users> updateProfile(@RequestParam String username, @RequestBody Users updatedUser) {
        Users existingUser = ur.findByUsername(username);
        if (existingUser != null) {
            updatedUser.setId(existingUser.getId()); // Ensure the ID remains the same
            Users savedUser = ur.save(updatedUser);
            return ResponseEntity.ok(savedUser);
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(null);
        }
    }

    @PostMapping("/upload/profile-photo")
    public ResponseEntity<Map<String, String>> uploadProfilePhoto(@RequestParam("file") MultipartFile file) {
        try {
            String filePath = fileStorageService.storeFile(file, "profile-photos");
            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", "/uploads/" + filePath);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/upload/cover-photo")
    public ResponseEntity<Map<String, String>> uploadCoverPhoto(@RequestParam("file") MultipartFile file) {
        try {
            String filePath = fileStorageService.storeFile(file, "cover-photos");
            Map<String, String> response = new HashMap<>();
            response.put("fileUrl", "/uploads/" + filePath);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @PostMapping("/register/initiate")
    public ResponseEntity<Map<String, String>> initiateRegistration(@RequestBody UserRegistrationDto userDto) {
        Map<String, String> response = new HashMap<>();
        
        try {
            // Convert username to lowercase for consistency
            userDto.setUsername(userDto.getUsername().toLowerCase());
            
            // Validate if email is from anurag.edu.in domain
            if (!userDto.getEmail().endsWith("@anurag.edu.in")) {
                response.put("status", "error");
                response.put("message", "Registration is restricted to @anurag.edu.in email addresses only");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Validate username format
            if (!userDto.getUsername().matches("^[a-z0-9_]+$")) {
                response.put("status", "error");
                response.put("message", "Username can only contain letters, numbers, and underscores");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Validate password complexity
            if (userDto.getPassword().length() < 6 || 
                !userDto.getPassword().matches(".*[A-Z].*") ||
                !userDto.getPassword().matches(".*[0-9].*") ||
                !userDto.getPassword().matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
                response.put("status", "error");
                response.put("message", "Password must be at least 6 characters with at least one capital letter, one number, and one special character");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Check if username already exists (case-insensitive check is handled by using lowercase)
            if (ur.findByUsername(userDto.getUsername()) != null) {
                response.put("status", "error");
                response.put("message", "Username already exists");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            
            // Check if email already exists
            if (ur.findByEmail(userDto.getEmail()) != null) {
                response.put("status", "error");
                response.put("message", "Email already registered");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            
            // Generate OTP
            String otp = otpService.generateOTP(userDto.getEmail());
            
            // Send OTP via email
            emailService.sendVerificationEmail(userDto.getEmail(), otp);
            
            response.put("status", "success");
            response.put("message", "Verification code sent to your email");
            return ResponseEntity.ok(response);
        } catch (MessagingException e) {
            System.err.println("Error sending email: " + e.getMessage());
            response.put("status", "error");
            response.put("message", "Failed to send verification email. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        } catch (Exception e) {
            System.err.println("Unexpected error: " + e.getMessage());
            response.put("status", "error");
            response.put("message", "An unexpected error occurred. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/register/verify")
    public ResponseEntity<Map<String, String>> verifyAndRegister(@RequestBody Map<String, String> verificationRequest) {
        Map<String, String> response = new HashMap<>();
        
        try {
            String email = verificationRequest.get("email");
            String otp = verificationRequest.get("otp");
            String firstName = verificationRequest.get("firstName");
            String lastName = verificationRequest.get("lastName");
            String username = verificationRequest.get("username").toLowerCase(); // Ensure lowercase
            String password = verificationRequest.get("password");
            
            // Validate OTP
            if (!otpService.validateOTP(email, otp)) {
                response.put("status", "error");
                response.put("message", "Invalid or expired verification code");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Create user
            Users user = new Users();
            user.setFirstName(firstName);
            user.setLastName(lastName);
            user.setEmail(email);
            user.setUsername(username); // Already lowercase
            user.setPassword(password);
            
            // Save user
            Users savedUser = ur.save(user);
            System.out.println("Registered user: " + savedUser);
            
            response.put("status", "success");
            response.put("message", "Registration successful");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error registering user: " + e.getMessage());
            response.put("status", "error");
            response.put("message", "Registration failed. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/api/users/search")
    public ResponseEntity<List<Map<String, Object>>> searchUsers(@RequestParam String term) {
        List<Users> users = ur.findByUsernameContainingIgnoreCase(term);
        
        List<Map<String, Object>> results = users.stream()
            .map(user -> {
                Map<String, Object> result = new HashMap<>();
                result.put("username", user.getUsername());
                result.put("firstName", user.getFirstName());
                result.put("lastName", user.getLastName());
                result.put("profilePhoto", user.getProfilePhoto());
                return result;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(results);
    }

    @DeleteMapping("/profile/delete")
    public ResponseEntity<?> deleteUserAccount(@RequestParam String username) {
        try {
            userService.deleteUserAccount(username); // Make sure this is correctly wired
            return ResponseEntity.ok().body(Map.of("message", "Account deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to delete account: " + e.getMessage()));
        }
    }
    @PostMapping("/api/users/verify-password")
public ResponseEntity<Map<String, String>> verifyPassword(@RequestBody Map<String, String> credentials) {
    Map<String, String> response = new HashMap<>();
    
    try {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        // Validate input
        if (username == null || password == null) {
            response.put("status", "error");
            response.put("message", "Missing username or password");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        
        // Find the user
        Users user = ur.findByUsername(username);
        if (user == null) {
            response.put("status", "error");
            response.put("message", "User not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
        
        // Verify password
        if (user.getPassword().equals(password)) {
            response.put("status", "success");
            return ResponseEntity.ok(response);
        } else {
            response.put("status", "error");
            response.put("message", "Incorrect password");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
        
    } catch (Exception e) {
        response.put("status", "error");
        response.put("message", "An unexpected error occurred");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}

    @PostMapping("/api/users/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@RequestBody Map<String, String> passwordData) {
        Map<String, String> response = new HashMap<>();
        
        try {
            String username = passwordData.get("username");
            String currentPassword = passwordData.get("currentPassword");
            String newPassword = passwordData.get("newPassword");
            
            // Validate required fields
            if (username == null || currentPassword == null || newPassword == null) {
                response.put("status", "error");
                response.put("message", "Missing required fields");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Find the user
            Users user = ur.findByUsername(username);
            if (user == null) {
                response.put("status", "error");
                response.put("message", "User not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
            
            // Check if current password matches
            if (!user.getPassword().equals(currentPassword)) {
                response.put("status", "error");
                response.put("message", "Current password is incorrect");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            
            // Validate password complexity
            if (newPassword.length() < 6 || 
                !newPassword.matches(".*[A-Z].*") ||
                !newPassword.matches(".*[0-9].*") ||
                !newPassword.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
                response.put("status", "error");
                response.put("message", "Password must be at least 6 characters with at least one capital letter, one number, and one special character");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }
            
            // Update password
            user.setPassword(newPassword);
            ur.save(user);
            
            response.put("status", "success");
            response.put("message", "Password changed successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error changing password: " + e.getMessage());
            response.put("status", "error");
            response.put("message", "An unexpected error occurred. Please try again.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}