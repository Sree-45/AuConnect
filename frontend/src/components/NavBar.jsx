import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Bell, MessageSquare, LogOut, UserCheck, UserX, User, ChevronDown } from 'lucide-react';
import EventBus from '../utils/EventBus';

const NavBar = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);
  
  // Connection requests state
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [showConnectionDropdown, setShowConnectionDropdown] = useState(false);
  const connectionRef = useRef(null);
  const loggedInUsername = localStorage.getItem('username');

  // User dropdown state
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userDropdownRef = useRef(null);
  
  // New message dropdown state
  const [messages, setMessages] = useState([]);
  const [showMessageDropdown, setShowMessageDropdown] = useState(false);
  const messageRef = useRef(null);

  // Handle clicks outside of dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (connectionRef.current && !connectionRef.current.contains(event.target)) {
        setShowConnectionDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (messageRef.current && !messageRef.current.contains(event.target)) {
        setShowMessageDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch connection requests and messages on component mount
  useEffect(() => {
    fetchConnectionRequests();
    fetchMessages();
  }, []);

  const fetchConnectionRequests = async () => {
    if (!loggedInUsername) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/connections/requests?username=${loggedInUsername}`);
      if (response.ok) {
        const data = await response.json();
        setConnectionRequests(data);
      }
    } catch (error) {
      console.error('Error fetching connection requests:', error);
    }
  };

  // Enhance the fetchMessages function for better debugging
  const fetchMessages = async () => {
    if (!loggedInUsername) return;
    
    try {
      // Add a timestamp parameter to prevent caching
      const timestamp = new Date().getTime();
      const response = await fetch(`http://localhost:8080/api/messages/recent?username=${loggedInUsername}&t=${timestamp}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Recent messages fetched:', data.length, 'unread:', data.filter(msg => msg.unread).length);
        setMessages(data);
      } else {
        console.error('Failed to fetch messages:', response.status);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Add this function inside your NavBar component
  const markMessageAsRead = async (messageId) => {
    try {
      // Optimistically update UI first
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? {...msg, unread: false} : msg
      );
      setMessages(updatedMessages);
      
      // Then update backend
      const response = await fetch(`http://localhost:8080/api/messages/read/${messageId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: loggedInUsername })
      });
      
      if (!response.ok) {
        console.error('Failed to mark message as read:', response.status);
        // If failed, revert the UI update
        fetchMessages();
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
      // If failed, revert the UI update
      fetchMessages();
    }
  };

  // Connection request response handling (existing code)
  const handleConnectionResponse = async (fromUsername, action) => {
    try {
      const response = await fetch(`http://localhost:8080/api/connections/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fromUsername: fromUsername,
          toUsername: loggedInUsername
        })
      });
      
      if (response.ok) {
        // Remove the request from the list
        setConnectionRequests(connectionRequests.filter(req => req.username !== fromUsername));
      }
    } catch (error) {
      console.error(`Error ${action} connection request:`, error);
    }
  };

  // Toggle connection dropdown (existing)
  const toggleConnectionDropdown = () => {
    setShowConnectionDropdown(prev => !prev);
    if (!showConnectionDropdown) {
      // Refresh requests when opening the dropdown
      fetchConnectionRequests();
    }
  };

  // New function to toggle message dropdown
  const toggleMessageDropdown = () => {
    setShowMessageDropdown(prev => !prev);
    if (!showMessageDropdown) {
      // Refresh messages when opening the dropdown
      fetchMessages();
    }
  };

  // Format message time for display
  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Search functionality (existing code)
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim().length > 0) {
      setIsSearching(true);
      try {
        const response = await fetch(`http://localhost:8080/api/users/search?term=${value}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data);
          setShowDropdown(true);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching for users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleResultClick = (username, firstName, lastName) => {
    // Check if this is the university search result
    if (username === 'anurag_university' || 
        (firstName && lastName && firstName + ' ' + lastName === 'Anurag University')) {
      navigate('/university');
    } else {
      navigate(`/profile/${username}`);
    }
    setSearchTerm('');
    setShowDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('username');
    navigate('/login');
  };

  // Add periodic polling for new messages
  useEffect(() => {
    if (!loggedInUsername) return;
    
    // Initial fetch
    fetchMessages();
    
    // Set up polling interval
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [loggedInUsername]);

  useEffect(() => {
    const handleMessagesRead = (data) => {
      // Refresh messages when a conversation is read
      fetchMessages();
    };
    
    EventBus.on('messagesRead', handleMessagesRead);
    
    return () => {
      EventBus.off('messagesRead', handleMessagesRead);
    };
  }, []);

  // Add this function above the return statement in NavBar component
  const isUniversityAccount = () => {
    return loggedInUsername === 'anurag_university';
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo} onClick={() => navigate('/')}>AuConnect.</div>
      <div style={styles.navItems}>
        {/* Search box (existing) */}
        <div style={styles.search} ref={searchRef}>
          <input 
            type="text" 
            placeholder="Search..." 
            style={styles.searchInput} 
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <button style={styles.searchButton}>
            {isSearching ? (
              <div style={styles.spinner}></div>
            ) : (
              <Search size={18} color="black" />
            )}
          </button>
          
          {/* Search results dropdown */}
          {showDropdown && searchTerm.trim() && (
            <div style={styles.searchDropdown}>
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div 
                    key={user.username} 
                    style={styles.searchResult}
                    onClick={() => handleResultClick(user.username, user.firstName, user.lastName)}
                  >
                    <img 
                      src={user.profilePhoto || '/assets/placeholder-profile.png'} 
                      alt={user.username} 
                      style={styles.searchResultImage} 
                    />
                    <div style={styles.searchResultInfo}>
                      <div style={styles.searchResultName}>{user.firstName} {user.lastName}</div>
                      <div style={styles.searchResultUsername}>@{user.username}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.noResults}>No users found</div>
              )}
            </div>
          )}
        </div>
        
        {/* Connection requests (existing) */}
        <div style={styles.navItem} ref={connectionRef} onClick={toggleConnectionDropdown}>
          <div style={styles.iconContainer}>
            <Users size={20} color="white" />
            {connectionRequests.length > 0 && (
              <div style={styles.badge}>{connectionRequests.length}</div>
            )}
          </div>
          
          {/* Connection requests dropdown - updated to match search dropdown style */}
          {showConnectionDropdown && (
            <div style={styles.connectionDropdown}>
              <div style={styles.dropdownHeader}>Connection Requests</div>
              {connectionRequests.length > 0 ? (
                connectionRequests.map((request) => (
                  <div key={request.username} style={styles.connectionRequest}>
                    <div style={styles.requestUserInfo}>
                      <img 
                        src={request.profilePhoto || '/assets/placeholder-profile.png'} 
                        alt={request.username} 
                        style={styles.requestUserImage} 
                      />
                      <div>
                        <div style={styles.requestUserName}>{request.firstName} {request.lastName}</div>
                        <div style={styles.requestUsername}>@{request.username}</div>
                      </div>
                    </div>
                    <div style={styles.requestActions}>
                      <button 
                        style={styles.acceptButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnectionResponse(request.username, 'accept');
                        }}
                      >
                        <UserCheck size={16} color="white" />
                      </button>
                      <button 
                        style={styles.rejectButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConnectionResponse(request.username, 'reject');
                        }}
                      >
                        <UserX size={16} color="white" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.noRequests}>No pending requests</div>
              )}
              
              {/* Add this new link at the bottom of the dropdown */}
              <div 
                style={styles.showAllConnectionsLink} 
                onClick={() => {
                  navigate('/connections');
                  setShowConnectionDropdown(false);
                }}
              >
                Show all connections
              </div>
            </div>
          )}
        </div>
        
        {/* Notifications (existing) */}
        <div style={styles.navItem}>
          <Bell size={20} color="white" />
        </div>
        
        {/* Messages - new dropdown */}
        <div style={styles.navItem} ref={messageRef} onClick={toggleMessageDropdown}>
          <div style={styles.iconContainer}>
            <MessageSquare size={20} color="white" />
            {messages.filter(msg => msg.unread).length > 0 && (
              <div style={styles.badge}>{messages.filter(msg => msg.unread).length}</div>
            )}
          </div>
          
          {/* Message dropdown content */}
          {showMessageDropdown && (
            <div style={styles.messageDropdown}>
              <div style={styles.dropdownHeader}>
                Messages {messages.filter(msg => msg.unread).length > 0 && 
                  <span style={{color: '#EF4444', marginLeft: '5px'}}>
                    ({messages.filter(msg => msg.unread).length} unread)
                  </span>
                }
              </div>
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div 
                    key={message.id} 
                    style={{
                      ...styles.messageItem,
                      backgroundColor: message.unread ? '#EFF6FF' : 'transparent',
                    }}
                    onClick={() => {
                      markMessageAsRead(message.id);
                      navigate(`/messages/${message.sender}`);
                      setShowMessageDropdown(false);
                    }}
                  >
                    {/* Show unread indicator */}
                    {message.unread && (
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#1E40AF',
                        position: 'absolute',
                        left: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}></div>
                    )}
                    <div style={{...styles.messageUserInfo, paddingLeft: message.unread ? '16px' : '0px'}}>
                      <img 
                        src={message.senderPhoto || '/assets/placeholder-profile.png'} 
                        alt={message.senderName} 
                        style={styles.messageUserImage} 
                      />
                      <div>
                        <div style={{
                          ...styles.messageUserName,
                          fontWeight: message.unread ? '600' : '500',
                        }}>{message.senderName}</div>
                        <div style={styles.messagePreview}>{message.preview}</div>
                      </div>
                    </div>
                    <div style={styles.messageTime}>{formatMessageTime(message.timestamp)}</div>
                  </div>
                ))
              ) : (
                <div style={styles.noMessages}>No messages</div>
              )}
              
              <div 
                style={styles.showAllMessagesLink} 
                onClick={() => {
                  navigate('/messages');
                  setShowMessageDropdown(false);
                }}
              >
                View all messages
              </div>
            </div>
          )}
        </div>
        
        {/* User dropdown (existing) */}
        <div style={styles.navItem} ref={userDropdownRef} onClick={() => setShowUserDropdown(!showUserDropdown)}>
          <div style={styles.userButton}>
            <span style={styles.username}>{loggedInUsername}</span>
            <ChevronDown size={16} color="white" />
          </div>
          
          {showUserDropdown && (
            <div style={styles.userDropdown}>
              <div 
                style={styles.userDropdownItem}
                onClick={() => {
                  navigate(isUniversityAccount() ? '/university' : '/profile');
                  setShowUserDropdown(false);
                }}
              >
                <User size={16} />
                <span>Profile</span>
              </div>
              <div 
                style={styles.userDropdownItem}
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  search: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: '999px',
    padding: '0.1rem 0.25rem',
    width: '300px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '1rem',
    flex: 1,
    color: '#374151',
    backgroundColor: 'transparent',
    boxShadow: 'none',
  },
  searchButton: {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '999px',
    padding: '0.25rem',
    marginLeft: '0.5rem',
    cursor: 'pointer',
  },
  navItems: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    position: 'relative', // Add this to ensure dropdown positioning works
    zIndex: 101, // Add this to ensure proper layering
  },
  // New styles for search functionality
  searchDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    marginTop: '0.5rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 100,
  },
  searchResult: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderBottom: '1px solid #f1f1f1',
  },
  searchResultImage: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    marginRight: '0.75rem',
    objectFit: 'cover',
  },
  searchResultInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  searchResultName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#111827',
  },
  searchResultUsername: {
    fontSize: '0.75rem',
    color: '#6B7280',
  },
  noResults: {
    padding: '0.75rem 1rem',
    color: '#6B7280',
    fontSize: '0.875rem',
    textAlign: 'center',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(0, 0, 0, 0.1)',
    borderTopColor: '#1E40AF',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr',
    gap: '1.5rem',
    padding: '0 2rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  // New styles for connection requests
  iconContainer: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    backgroundColor: '#EF4444',
    color: 'white',
    fontSize: '0.7rem',
    fontWeight: 'bold',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    marginTop: '0.75rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    width: '320px',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000, // Increased z-index
  },
  dropdownHeader: {
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #f1f1f1',
    fontWeight: '600',
    color: '#1E40AF',
    backgroundColor: '#F3F4F6',
  },
  connectionRequest: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f1f1',
    transition: 'background-color 0.2s',
  },
  requestUserInfo: {
    display: 'flex',
    alignItems: 'center',
  },
  requestUserImage: {
    width: '36px', // Match search dropdown image size
    height: '36px',
    borderRadius: '50%',
    marginRight: '0.75rem',
    objectFit: 'cover',
  },
  requestUserName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#111827',
  },
  requestUsername: {
    fontSize: '0.75rem',
    color: '#6B7280',
  },
  requestActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.5rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRequests: {
    padding: '0.75rem 1rem',
    color: '#6B7280',
    fontSize: '0.875rem',
    textAlign: 'center',
  },
  showAllConnectionsLink: {
    padding: '0.75rem 1rem',
    color: '#1E40AF',
    fontSize: '0.875rem',
    textAlign: 'center',
    cursor: 'pointer',
    borderTop: '1px solid #f1f1f1',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  // Add these new styles
  userButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    cursor: 'pointer',
  },
  username: {
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  userDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    marginTop: '0.75rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    width: '180px',
    zIndex: 1000,
    overflow: 'hidden',
  },
  userDropdownItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f1f1',
    color: '#374151',
    transition: 'background-color 0.2s',
    hoverBackgroundColor: '#F3F4F6',
  },
  messageDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    marginTop: '0.75rem',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
    width: '320px',
    maxHeight: '300px',
    overflowY: 'auto',
    zIndex: 1000,
  },
  messageItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    cursor: 'pointer',
    borderBottom: '1px solid #f1f1f1',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#F9FAFB',
    },
  },
  messageUserInfo: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0, // Important for text truncation
  },
  messageUserImage: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    marginRight: '0.75rem',
    objectFit: 'cover',
  },
  messageUserName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#111827',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  messagePreview: {
    fontSize: '0.75rem',
    color: '#6B7280',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '200px',
  },
  messageTime: {
    fontSize: '0.75rem',
    color: '#6B7280',
    marginLeft: '0.75rem',
    whiteSpace: 'nowrap',
  },
  noMessages: {
    padding: '0.75rem 1rem',
    color: '#6B7280',
    fontSize: '0.875rem',
    textAlign: 'center',
  },
  showAllMessagesLink: {
    padding: '0.75rem 1rem',
    color: '#1E40AF',
    fontSize: '0.875rem',
    textAlign: 'center',
    cursor: 'pointer',
    borderTop: '1px solid #f1f1f1',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    '&:hover': {
      backgroundColor: '#F9FAFB',
    },
  },
};

export default NavBar;
