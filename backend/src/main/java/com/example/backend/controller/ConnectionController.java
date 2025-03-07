package com.example.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.backend.model.Connection;
import com.example.backend.service.ConnectionService;

@RestController
@RequestMapping("/api/connections")
@CrossOrigin(origins = "http://localhost:5173")
public class ConnectionController {

    @Autowired
    private ConnectionService connectionService;
    
    // Get connection status between two users
    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> getConnectionStatus(
            @RequestParam String fromUsername, 
            @RequestParam String toUsername) {
        
        Map<String, String> status = connectionService.getConnectionStatus(fromUsername, toUsername);
        return ResponseEntity.ok(status);
    }
    
    // Create a connection request
    @PostMapping("/connect")
    public ResponseEntity<Connection> createConnectionRequest(@RequestBody Map<String, String> request) {
        String fromUsername = request.get("fromUsername");
        String toUsername = request.get("toUsername");
        
        Connection connection = connectionService.createConnectionRequest(fromUsername, toUsername);
        return ResponseEntity.ok(connection);
    }
    
    // Accept a connection request
    @PostMapping("/accept")
    public ResponseEntity<Connection> acceptConnectionRequest(@RequestBody Map<String, String> request) {
        String fromUsername = request.get("fromUsername");
        String toUsername = request.get("toUsername");
        
        Connection connection = connectionService.acceptConnectionRequest(fromUsername, toUsername);
        return ResponseEntity.ok(connection);
    }
    
    // Reject a connection request
    @PostMapping("/reject")
    public ResponseEntity<Connection> rejectConnectionRequest(@RequestBody Map<String, String> request) {
        String fromUsername = request.get("fromUsername");
        String toUsername = request.get("toUsername");
        
        Connection connection = connectionService.rejectConnectionRequest(fromUsername, toUsername);
        return ResponseEntity.ok(connection);
    }
    
    // Disconnect from a connection
    @PostMapping("/disconnect")
    public ResponseEntity<Void> disconnectUsers(@RequestBody Map<String, String> request) {
        String fromUsername = request.get("fromUsername");
        String toUsername = request.get("toUsername");
        
        connectionService.disconnectUsers(fromUsername, toUsername);
        return ResponseEntity.ok().build();
    }
    
    // Get pending connection requests for a user
    @GetMapping("/requests")
    public ResponseEntity<List<Map<String, Object>>> getPendingRequests(@RequestParam String username) {
        List<Map<String, Object>> pendingRequests = connectionService.getPendingRequestsForUser(username);
        return ResponseEntity.ok(pendingRequests);
    }
    
    // Add this new endpoint to the ConnectionController class
    @GetMapping("/user/{username}")
    public ResponseEntity<List<Map<String, Object>>> getUserConnections(@PathVariable String username) {
        List<Map<String, Object>> connections = connectionService.getUserConnections(username);
        return ResponseEntity.ok(connections);
    }
}
