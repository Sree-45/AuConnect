package com.example.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.backend.model.Connection;
import com.example.backend.model.Users;
import com.example.backend.repository.ConnectionRepository;
import com.example.backend.repository.UserRepository;

@Service
public class ConnectionService {

    @Autowired
    private ConnectionRepository connectionRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    // Create a connection request
    public Connection createConnectionRequest(String fromUsername, String toUsername) {
        // Check if a connection request already exists
        Optional<Connection> existingConnection = 
            connectionRepository.findByFromUsernameAndToUsername(fromUsername, toUsername);
        
        if (existingConnection.isPresent()) {
            Connection connection = existingConnection.get();
            // If it was previously rejected, we can reactivate it
            if (connection.getStatus().equals("rejected")) {
                connection.setStatus("pending");
                connection.setRequestDate(LocalDateTime.now());
                connection.setResponseDate(null);
                return connectionRepository.save(connection);
            }
            // Otherwise return the existing connection
            return connection;
        }
        
        // Create new connection request
        Connection connection = new Connection(fromUsername, toUsername);
        return connectionRepository.save(connection);
    }
    
    // Get connection status between two users
    public Map<String, String> getConnectionStatus(String fromUsername, String toUsername) {
        Map<String, String> result = new HashMap<>();
        
        // Check for direct connection
        Optional<Connection> fromToConnection = 
            connectionRepository.findByFromUsernameAndToUsername(fromUsername, toUsername);
            
        if (fromToConnection.isPresent()) {
            Connection connection = fromToConnection.get();
            result.put("status", connection.getStatus());
            return result;
        }
        
        // Check for reverse connection
        Optional<Connection> toFromConnection = 
            connectionRepository.findByFromUsernameAndToUsername(toUsername, fromUsername);
            
        if (toFromConnection.isPresent()) {
            Connection connection = toFromConnection.get();
            if (connection.getStatus().equals("connected")) {
                result.put("status", "connected");
            } else if (connection.getStatus().equals("pending")) {
                result.put("status", "received_request");
            } else {
                result.put("status", "not_connected");
            }
            return result;
        }
        
        // No connection exists
        result.put("status", "not_connected");
        return result;
    }
    
    // Accept a connection request
    public Connection acceptConnectionRequest(String fromUsername, String toUsername) {
        Optional<Connection> connectionOpt = 
            connectionRepository.findByFromUsernameAndToUsername(fromUsername, toUsername);
        
        if (connectionOpt.isPresent()) {
            Connection connection = connectionOpt.get();
            connection.setStatus("connected");
            connection.setResponseDate(LocalDateTime.now());
            return connectionRepository.save(connection);
        }
        
        throw new RuntimeException("Connection request not found");
    }
    
    // Reject a connection request
    public Connection rejectConnectionRequest(String fromUsername, String toUsername) {
        Optional<Connection> connectionOpt = 
            connectionRepository.findByFromUsernameAndToUsername(fromUsername, toUsername);
        
        if (connectionOpt.isPresent()) {
            Connection connection = connectionOpt.get();
            connection.setStatus("rejected");
            connection.setResponseDate(LocalDateTime.now());
            return connectionRepository.save(connection);
        }
        
        throw new RuntimeException("Connection request not found");
    }
    
    // Disconnect from a connection
    public void disconnectUsers(String fromUsername, String toUsername) {
        // Check both directions
        connectionRepository.findByFromUsernameAndToUsername(fromUsername, toUsername)
            .ifPresent(connectionRepository::delete);
        
        connectionRepository.findByFromUsernameAndToUsername(toUsername, fromUsername)
            .ifPresent(connectionRepository::delete);
    }
    
    // Get all pending connection requests for a user
    public List<Map<String, Object>> getPendingRequestsForUser(String username) {
        List<Connection> pendingConnections = 
            connectionRepository.findByToUsernameAndStatus(username, "pending");
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Connection connection : pendingConnections) {
            // For each connection, get the requesting user's info
            Users requestingUser = userRepository.findByUsername(connection.getFromUsername());
            if (requestingUser != null) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("username", requestingUser.getUsername());
                userInfo.put("firstName", requestingUser.getFirstName());
                userInfo.put("lastName", requestingUser.getLastName());
                userInfo.put("profilePhoto", requestingUser.getProfilePhoto());
                result.add(userInfo);
            }
        }
        
        return result;
    }

    // Add this method to the ConnectionService class
    public List<Map<String, Object>> getUserConnections(String username) {
        List<Connection> userConnections = 
            connectionRepository.findAllConnectionsForUser(username);
        
        List<Map<String, Object>> result = new ArrayList<>();
        for (Connection connection : userConnections) {
            // Determine which user is the connection (not the current user)
            String connectedUsername = connection.getFromUsername().equals(username) ? 
                                      connection.getToUsername() : connection.getFromUsername();
            
            // Get connected user's info
            Users connectedUser = userRepository.findByUsername(connectedUsername);
            if (connectedUser != null) {
                Map<String, Object> userInfo = new HashMap<>();
                userInfo.put("username", connectedUser.getUsername());
                userInfo.put("firstName", connectedUser.getFirstName());
                userInfo.put("lastName", connectedUser.getLastName());
                userInfo.put("profilePhoto", connectedUser.getProfilePhoto());
                result.add(userInfo);
            }
        }
        
        return result;
    }
}
