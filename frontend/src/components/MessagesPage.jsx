import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Search, ArrowLeft, MoreVertical, Phone, Video, Paperclip, X, Film, File } from 'lucide-react';
import NavBar from './NavBar';

const MessagesPage = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const messageEndRef = useRef(null);
  const loggedInUsername = localStorage.getItem('username');
  const [showNewMessageUI, setShowNewMessageUI] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchConversations = async () => {
    if (!loggedInUsername) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:8080/api/messages/conversations?username=${loggedInUsername}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`);
      }
      
      const data = await response.json();
      setConversations(data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      setError('Failed to load conversations. Please try again later.');
    }
  };

  useEffect(() => {
    if (loggedInUsername) {
      fetchConversations();
    }
  }, [loggedInUsername]);
  
  useEffect(() => {
    if (!loggedInUsername) return;
    
    const pollInterval = setInterval(() => {
      fetchConversations();
    }, 20000); 
    return () => clearInterval(pollInterval);
  }, [loggedInUsername]);
  
  useEffect(() => {
    if (conversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setSelectedConversation(conversation);
      } else {
        setSelectedConversation(null);
        navigate('/messages');
      }
    }
  }, [conversationId, conversations, navigate]);
  
  useEffect(() => {
    fetchMessages();
  }, [selectedConversation, loggedInUsername]);
  
  const fetchMessages = async () => {
    if (!selectedConversation || !loggedInUsername) return;
    
    try {
      setError(null);
      
      const response = await fetch(`http://localhost:8080/api/messages/conversation/${selectedConversation.id}?username=${loggedInUsername}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Include attachment fields here!
      const formattedMessages = data.map(msg => ({
        id: msg.id,
        senderId: msg.fromUsername,
        text: msg.text,
        timestamp: msg.timestamp,
        attachmentUrl: msg.attachmentUrl,
        attachmentType: msg.attachmentType,
        attachmentName: msg.attachmentName,
        isRead: msg.isRead
      }));
      
      setMessages(formattedMessages);
      

    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages. Please try again later.');
    }
  };
  
  useEffect(() => {
    if (!selectedConversation || !loggedInUsername) return;
    
    const fetchCurrentMessages = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/messages/conversation/${selectedConversation.id}?username=${loggedInUsername}&t=${Date.now()}`); // Add timestamp to prevent caching
        
        if (!response.ok) {
          throw new Error(`Failed to fetch messages: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if we should update the messages
        const serverMessageIds = new Set(data.map(msg => msg.id));
        const clientMessageIds = new Set(messages.map(msg => msg.id));
        
        // Also check read status changes
        const hasReadStatusChanges = data.some(serverMsg => {
          const clientMsg = messages.find(msg => msg.id === serverMsg.id);
          return clientMsg && clientMsg.isRead !== serverMsg.isRead;
        });
        
        const hasChanges = data.length !== messages.length || 
                           data.some(msg => !clientMessageIds.has(msg.id)) ||
                           hasReadStatusChanges;
        
        if (hasChanges) {
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            senderId: msg.fromUsername,
            text: msg.text,
            timestamp: msg.timestamp,
            attachmentUrl: msg.attachmentUrl,
            attachmentType: msg.attachmentType,
            attachmentName: msg.attachmentName,
            isRead: msg.isRead
          }));
          
          setMessages(formattedMessages);
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };
    
    // Poll more frequently for a better user experience
    const messagesPollInterval = setInterval(() => {
      fetchCurrentMessages();
    }, 2000); 
    
    return () => clearInterval(messagesPollInterval);
  }, [selectedConversation, loggedInUsername]);
  
  useEffect(() => {
    // Simple auto-scroll when messages change or conversation changes
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, selectedConversation?.id]);

  const handleSelectConversation = (conversation) => {
    setConversations(prevConversations => 
      prevConversations.map(conv => {
        if (conv.id === conversation.id) {
          return {
            ...conv,
            lastMessage: {
              ...conv.lastMessage,
              unread: false
            }
          };
        }
        return conv;
      })
    );
    
    setSelectedConversation(conversation);
    navigate(`/messages/${conversation.id}`);
  };
  
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !attachment) || !selectedConversation || !loggedInUsername) return;
    
    const messageData = {
      fromUsername: loggedInUsername,
      toUsername: selectedConversation.id,
      text: newMessage,
      // Add attachment information if available
      attachmentUrl: attachment?.url || null,
      attachmentType: attachment?.type || null,
      attachmentName: attachment?.name || null
    };
    
    const tempMessage = {
      id: `temp-${Date.now()}`,
      senderId: loggedInUsername,
      text: newMessage,
      timestamp: new Date().toISOString(),
      // Include attachment in the temp message
      attachmentUrl: attachment?.url,
      attachmentType: attachment?.type,
      attachmentName: attachment?.name
    };
    
    setMessages([...messages, tempMessage]);
    setNewMessage('');
    // Clear attachment after sending
    setAttachment(null);
    
    const updatedConversations = conversations.map(conversation => {
      if (conversation.id === selectedConversation.id) {
        return {
          ...conversation,
          lastMessage: {
            text: attachment ? `[${attachment.type}] ${newMessage || 'Attachment'}` : newMessage,
            timestamp: new Date().toISOString(),
            unread: false
          }
        };
      }
      return conversation;
    });
    setConversations(updatedConversations);
    
    try {
      const response = await fetch('http://localhost:8080/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }
      
      // Fetch messages immediately after sending
      fetchMessages();
      
    } catch (error) {
      setError('Failed to send message. Please try again.');
      setMessages(messages.filter(msg => msg.id !== tempMessage.id));
    }
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  const filteredConversations = searchTerm
    ? conversations.filter(conv => 
        conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        conv.user.username.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;

  const searchUsers = async (term) => {
    if (!term || term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setSearchingUsers(true);
      const response = await fetch(`http://localhost:8080/api/users/search?term=${encodeURIComponent(term)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const data = await response.json();
      const filteredResults = data.filter(user => user.username !== loggedInUsername);
      setSearchResults(filteredResults);
    } catch (error) {
      setError('Failed to search for users. Please try again.');
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleStartConversation = (user) => {
    const existingConversation = conversations.find(c => c.id === user.username);
    
    if (existingConversation) {
      setSelectedConversation(existingConversation);
      navigate(`/messages/${existingConversation.id}`);
    } else {
      const newConversation = {
        id: user.username,
        user: {
          username: user.username,
          name: `${user.firstName} ${user.lastName}`,
          profilePhoto: user.profilePhoto
        },
        lastMessage: {
          text: "No messages yet",
          timestamp: new Date().toISOString(),
          unread: false
        }
      };
      
      setConversations([newConversation, ...conversations]);
      
      setSelectedConversation(newConversation);
      navigate(`/messages/${newConversation.id}`);
    }
    
    setShowNewMessageUI(false);
    setUserSearchTerm('');
    setSearchResults([]);
  };

  const markConversationAsRead = (conversationId) => {
    if (!conversationId) return;
    
    setConversations(prevConversations => 
      prevConversations.map(conversation => {
        if (conversation.id === conversationId) {
          return {
            ...conversation,
            lastMessage: {
              ...conversation.lastMessage,
              unread: false
            }
          };
        }
        return conversation;
      })
    );
  };

  useEffect(() => {
    const markConversationAsRead = () => {
      if (!selectedConversation) return;
      
      setConversations(prevConversations => 
        prevConversations.map(conversation => {
          if (conversation.id === selectedConversation.id) {
            return {
              ...conversation,
              lastMessage: {
                ...conversation.lastMessage,
                unread: false
              }
            };
          }
          return conversation;
        })
      );
    };
    
    markConversationAsRead();
  }, [selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation?.id) {
      markConversationAsRead(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Determine file type category
      let type = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      if (file.type.startsWith('video/')) type = 'video';
      if (file.type.startsWith('audio/')) type = 'audio';
      
      formData.append('type', type);
      
      // Upload the file
      const response = await fetch('http://localhost:8080/api/messages/upload-attachment', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload attachment');
      }
      
      const data = await response.json();
      
      // Create a more user-friendly file name if needed
      const fileName = file.name.length > 20 
        ? file.name.substring(0, 17) + '...' + file.name.substring(file.name.lastIndexOf('.'))
        : file.name;
      
      // Store attachment information
      setAttachment({
        url: data.fileUrl,
        name: fileName,
        type: type,
        size: file.size,
        preview: type === 'image' ? URL.createObjectURL(file) : null
      });
      
    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload attachment. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleAttachmentButtonClick = () => {
    fileInputRef.current.click();
  };
  
  const handleRemoveAttachment = () => {
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachment(null);
  };


  return (
    <div style={styles.container}>
      <NavBar />
      
      <div style={styles.content}>
        {error && (
          <div style={styles.errorMessage}>
            {error}
            <button 
              style={styles.dismissButton} 
              onClick={() => setError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        
        <div style={styles.messagesContainer}>
          {/* Sidebar with conversations */}
          <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
              <div style={styles.sidebarHeaderContent}>
                <h2 style={styles.sidebarTitle}>Messages</h2>
                <button 
                  style={styles.newMessageButton} 
                  onClick={() => setShowNewMessageUI(!showNewMessageUI)}
                  title="New Message"
                >
                  <span style={styles.newMessageIcon}>+</span>
                </button>
              </div>
              
              {/* New Message Search UI */}
              {showNewMessageUI && (
                <div style={styles.newMessageContainer}>
                  <div style={styles.newMessageSearchContainer}>
                    <Search size={18} color="black" />
                    <input
                      type="text"
                      placeholder="Search for users..."
                      style={styles.newMessageSearchInput}
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        searchUsers(e.target.value);
                      }}
                    />
                  </div>
                  
                  <div style={styles.searchResultsContainer}>
                    {searchingUsers ? (
                      <div style={styles.searchingText}>Searching...</div>
                    ) : userSearchTerm.length < 2 ? (
                      null
                    ) : searchResults.length > 0 ? (
                      searchResults.map(user => (
                        <div 
                          key={user.username} 
                          style={styles.searchResultItem}
                          onClick={() => handleStartConversation(user)}
                        >
                          <img 
                            src={user.profilePhoto || '/assets/placeholder-profile.png'} 
                            alt={user.firstName} 
                            style={styles.searchResultImage}
                          />
                          <div style={styles.searchResultInfo}>
                            <div style={styles.searchResultName}>
                              {user.firstName} {user.lastName}
                            </div>
                            <div style={styles.searchResultUsername}>@{user.username}</div>
                          </div>
                        </div>
                      ))
                    ) : userSearchTerm.length >= 2 ? (
                      <div style={styles.noResultsText}>No users found</div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
            
            {/* Search conversations */}
            <div style={styles.searchContainer}>
              <Search size={18} color="black" />
              <input 
                type="text" 
                placeholder="Search conversations" 
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Conversations list */}
            <div style={styles.conversationsList}>
              {loading ? (
                <div style={styles.loadingText}>Loading conversations...</div>
              ) : filteredConversations.length > 0 ? (
                filteredConversations.map(conversation => (
                  <div 
                    key={conversation.id} 
                    style={{
                      ...styles.conversationItem,
                      backgroundColor: selectedConversation?.id === conversation.id ? '#EEF2FF' : 'transparent',
                      borderLeft: selectedConversation?.id === conversation.id ? '4px solid #1E40AF' : '4px solid transparent',
                    }}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <div style={styles.conversationImageWrapper}>
                      <img 
                        src={conversation.user.profilePhoto || '/assets/placeholder-profile.png'} 
                        alt={conversation.user.name} 
                        style={styles.conversationImage}
                      />
                      {conversation.user.online && <span style={styles.onlineIndicator}></span>}
                    </div>
                    <div style={styles.conversationInfo}>
                      <div style={styles.conversationHeader}>
                        <h3 style={styles.conversationName}>{conversation.user.name}</h3>
                        <span style={{
                          ...styles.conversationTime,
                          fontWeight: conversation.lastMessage.unread ? '600' : '400'
                        }}>
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      </div>
                      <div style={styles.conversationPreview}>
                        <p style={{
                          ...styles.previewText,
                          fontWeight: conversation.lastMessage.unread ? '600' : '400',
                          color: conversation.lastMessage.unread ? '#1F2937' : '#6B7280',
                        }}>
                          {conversation.lastMessage.text}
                        </p>
                        {conversation.lastMessage.unread && (
                          <div style={styles.unreadBadge}>{1}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyText}>No conversations found</div>
              )}
            </div>
          </div>
          
          {/* Chat area */}
          <div style={styles.chatArea}>
            {selectedConversation ? (
              <>
                {/* Chat header */}
                <div style={styles.chatHeader}>
                  <div style={styles.chatHeaderLeft}>
                    <div style={styles.mobileBackButton} onClick={() => navigate('/messages')}>
                      <ArrowLeft size={20} color="#1F2937" />
                    </div>
                    <img 
                      src={selectedConversation.user.profilePhoto || '/assets/placeholder-profile.png'} 
                      alt={selectedConversation.user.name} 
                      style={styles.chatUserImage}
                    />
                    <div>
                      <h3 style={styles.chatUserName}>{selectedConversation.user.name}</h3>
                    </div>
                  </div>
                  <div style={styles.chatHeaderRight}>
                    <button style={styles.headerButton}>
                      <Phone size={18} color="#4B5563" />
                    </button>
                    <button style={styles.headerButton}>
                      <Video size={18} color="#4B5563" />
                    </button>
                    <button style={styles.headerButton}>
                      <MoreVertical size={18} color="#4B5563" />
                    </button>
                  </div>
                </div>
                
                {/* Messages */}
                <div style={styles.messagesArea}>
                  {messages.map((message, index) => {
                    const isOwn = message.senderId === loggedInUsername;
                    const prevMessage = index > 0 ? messages[index - 1] : null;
                    const showSenderChange = !prevMessage || prevMessage.senderId !== message.senderId;
                    const timeGap = prevMessage && new Date(message.timestamp) - new Date(prevMessage.timestamp) > 5 * 60 * 1000;
                    
                    return (
                      <React.Fragment key={message.id}>
                        {(showSenderChange || timeGap) && (
                          <div style={styles.messageDivider}>
                            <span style={styles.timeIndicator}>
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                        <div 
                          style={{
                            ...styles.messageWrapper,
                            justifyContent: isOwn ? 'flex-end' : 'flex-start',
                            marginBottom: showSenderChange ? '0.75rem' : '0.25rem',
                          }}
                        >
                          {!isOwn && showSenderChange && (
                            <div style={styles.avatarContainer}>
                              <img 
                                src={selectedConversation?.user.profilePhoto || '/assets/placeholder-profile.png'}
                                alt={selectedConversation?.user.name}
                                style={styles.messageAvatar}
                              />
                            </div>
                          )}
                          <div 
                            style={{
                              ...styles.messageItem,
                              backgroundColor: isOwn ? '#1E40AF' : '#F3F4F6', 
                              color: isOwn ? 'white' : '#1F2937',
                              borderRadius: isOwn 
                                ? '18px 18px 4px 18px' 
                                : '18px 18px 18px 4px',
                              marginLeft: isOwn ? 0 : (showSenderChange ? '0.5rem' : '2.5rem'),
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            }}
                          >
                            <div style={styles.messageText}>
                              {message.text}
                              
                              {message.attachmentUrl && (
                                <div style={{
                                  ...styles.messageAttachment,
                                  marginTop: message.text ? '0.75rem' : '0'
                                }}>
                                  {message.attachmentType === 'image' ? (
                                    <div style={styles.imageAttachmentContainer}>
                                      <img 
                                        src={`http://localhost:8080${message.attachmentUrl}`} 
                                        alt="Image attachment" 
                                        style={styles.attachmentImage}
                                        onClick={() => window.open(`http://localhost:8080${message.attachmentUrl}`, '_blank')}
                                      />
                                    </div>
                                  ) : message.attachmentType === 'video' ? (
                                    <div style={styles.documentAttachmentContainer} onClick={() => window.open(`http://localhost:8080${message.attachmentUrl}`, '_blank')}>
                                      <div style={styles.documentIconWrapper}>
                                        <Film size={24} color={isOwn ? "white" : "#4B5563"} />
                                      </div>
                                      <div style={styles.documentDetails}>
                                        <span style={styles.attachmentName}>{message.attachmentName || 'Video'}</span>
                                        <span style={styles.attachmentType}>Video</span>
                                      </div>
                                    </div>
                                  ) : (
                                    <div style={styles.documentAttachmentContainer} onClick={() => window.open(`http://localhost:8080${message.attachmentUrl}`, '_blank')}>
                                      <div style={styles.documentIconWrapper}>
                                        <File size={24} color={isOwn ? "white" : "#4B5563"} />
                                      </div>
                                      <div style={styles.documentDetails}>
                                        <span style={styles.attachmentName}>{message.attachmentName || 'File'}</span>
                                        <span style={styles.attachmentType}>Document</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div 
                              style={{
                                ...styles.messageTime,
                                color: isOwn ? 'rgba(255,255,255,0.7)' : '#6B7280',
                                textAlign: 'right',
                              }}
                            >
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messageEndRef} />
                </div>
                
                {/* Message input - Simplified without emoji and attachment buttons */}
                <div style={styles.messageInputContainer}>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    style={{ display: 'none' }} 
                    onChange={handleFileSelect}
                  />
                  
                  {/* Updated attachment preview section */}
                  {attachment && (
                    <div style={styles.attachmentPreview}>
                      {attachment.type === 'image' ? (
                        <div style={styles.imagePreviewWrapper}>
                          <img 
                            src={attachment.preview} 
                            alt={attachment.name} 
                            style={styles.previewImage} 
                          />
                          <div style={styles.previewDetails}>
                            <span style={styles.previewFileName}>{attachment.name}</span>
                          </div>
                          <button 
                            type="button" 
                            style={styles.removeAttachmentButton}
                            onClick={handleRemoveAttachment}
                          >
                            <X size={18} color="white" />
                          </button>
                        </div>
                      ) : (
                        <div style={styles.filePreviewWrapper}>
                          <div style={styles.fileTypeIcon}>
                            {attachment.type === 'video' ? (
                              <Film size={24} color="#6B7280" />
                            ) : (
                              <File size={24} color="#6B7280" />
                            )}
                          </div>
                          <div style={styles.filePreviewInfo}>
                            <div style={styles.previewFileName}>{attachment.name}</div>
                            <div style={styles.fileSize}>
                              {Math.round(attachment.size / 1024)} KB • {attachment.type}
                            </div>
                          </div>
                          <button 
                            type="button"
                            style={styles.removeFileButton}
                            onClick={handleRemoveAttachment}
                          >
                            <X size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <form style={styles.inputArea} onSubmit={handleSendMessage}>
                    <div style={styles.inputWrapper}>
                      <button 
                        type="button"
                        style={styles.attachmentButton}
                        onClick={handleAttachmentButtonClick}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <div style={styles.spinnerSmall}></div>
                        ) : (
                          <Paperclip size={18} color="#6B7280" />
                        )}
                      </button>
                      <input 
                        type="text" 
                        placeholder="Type a message..." 
                        style={styles.messageInput}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                      />
                    </div>
                    <button 
                      type="submit" 
                      style={{
                        ...styles.sendButton,
                        backgroundColor: (newMessage.trim() || attachment) ? '#1E40AF' : '#E5E7EB',
                        cursor: (newMessage.trim() || attachment) ? 'pointer' : 'default',
                      }}
                      disabled={!newMessage.trim() && !attachment}
                    >
                      <Send size={18} color={(newMessage.trim() || attachment) ? "white" : "#9CA3AF"} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={styles.noChatSelected}>
                <div style={styles.noChatContent}>
                  <div style={styles.noChatIcon}>💬</div>
                  <h3 style={styles.noChatTitle}>Start a conversation</h3>
                  <p style={styles.noChatText}>
                    Select a conversation from the left or start a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  errorMessage: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    padding: '0.75rem 1rem',
    borderRadius: '0.375rem',
    marginBottom: '1rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: '#B91C1C',
    color: 'white',
    border: 'none',
    borderRadius: '0.25rem',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    cursor: 'pointer',
  },
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #F9FAFB, #F3F4F6)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  content: {
    paddingTop: '80px',
    maxWidth: '1200px',
    margin: '0 auto',
    marginTop: '4rem',
    padding: '1rem',
    height: 'calc(100vh - 120px)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    width: '100%',
  },
  messagesContainer: {
    display: 'flex',
    height: '100%',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',

  },
  sidebar: {
    width: '320px',
    backgroundColor: 'white',
    borderRight: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    
  },
  sidebarHeader: {
    padding: '1rem',
    borderBottom: '1px solid #E5E7EB',
  },
  sidebarHeaderContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newMessageButton: {
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  newMessageIcon: {
    fontSize: '1.25rem',
    lineHeight: '1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
    marginTop: '-2px',
  },
  newMessageContainer: {
    padding: '1rem',
    borderTop: '1px solid #E5E7EB',
  },
  newMessageSearchContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    maxHeight: 'calc(100vh - 200px)',
  },
  newMessageSearchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
    marginLeft: '0.5rem',
    width: '100%',
  },
  searchResultsContainer: {
    maxHeight: '200px',
    overflowY: 'auto',
    borderRadius: '0.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginTop: '0.5rem',
  },
  searchingText: {
    padding: '0.5rem',
    textAlign: 'center',
    color: '#6B7280',
  },
  searchHint: {
    padding: '0.5rem',
    textAlign: 'center',
    color: '#6B7280',
  },
  searchResultItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  searchResultImage: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: '0.75rem',
  },
  searchResultInfo: {
    flexGrow: 1,
  },
  searchResultName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    marginBottom: '0.25rem',
  },
  searchResultUsername: {
    fontSize: '0.75rem',
    color: '#6B7280',
  },
  noResultsText: {
    padding: '0.5rem',
    textAlign: 'center',
    color: '#6B7280',
  },
  sidebarTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    margin: 0,
    color: '#1E40AF',
  },
  searchContainer: {
    padding: '0.75rem 1rem',
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #E5E7EB',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
    marginLeft: '0.5rem',
    width: '100%',
  },
  conversationsList: {
    overflow: 'auto',
    flexGrow: 1,
  },
  conversationItem: {
    display: 'flex',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #F3F4F6',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    alignItems: 'center',
    borderLeft: '4px solid transparent',
    ':hover': {
      backgroundColor: '#F9FAFB',
    },
  },
  conversationImageWrapper: {
    position: 'relative',
  },
  conversationImage: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #F3F4F6',
  },
  onlineIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    border: '2px solid white',
    position: 'absolute',
    bottom: '2px',
    right: '2px',
  },
  unreadBadge: {
    minWidth: '20px',
    height: '20px',
    borderRadius: '10px',
    backgroundColor: '#1E40AF',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    padding: '0 6px',
  },
  conversationInfo: {
    marginLeft: '0.75rem',
    flexGrow: 1,
    minWidth: 0,
  },
  conversationHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.25rem',
  },
  conversationName: {
    margin: 0,
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  conversationTime: {
    fontSize: '0.75rem',
    color: '#6B7280',
  },
  conversationPreview: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewText: {
    margin: 0,
    fontSize: '0.75rem',
    color: '#6B7280',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '200px',
  },
  chatArea: {
    flexGrow: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    height: '100%',
    minHeight: 0,
    background: 'linear-gradient(to bottom, #FFFFFF, #FAFAFA)',
   
  },
  chatHeader: {
    padding: '1rem',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  mobileBackButton: {
    display: 'none',
    marginRight: '0.75rem',
    cursor: 'pointer',

  },
  chatUserImage: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
    marginRight: '0.75rem',
  },
  chatUserName: {
    margin: 0,
    fontSize: '1rem',
    fontWeight: '500',
  },
  chatHeaderRight: {
    display: 'flex',
    gap: '0.5rem',
  },
  headerButton: {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  messagesArea: {
    flexGrow: 1,
    overflowY: 'auto',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    backgroundColor: '#FFFFFF',
  },
  messageWrapper: {
    display: 'flex',
    alignItems: 'flex-end',
    transition: 'all 0.2s ease',
  },
  avatarContainer: {
    width: '28px',
    marginRight: '8px',
  },
  messageAvatar: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  messageItem: {
    maxWidth: '70%',
    padding: '0.75rem 1rem',
    position: 'relative',
    transition: 'all 0.15s ease',
    animation: 'fadeIn 0.3s',
  },
  messageDivider: {
    display: 'flex',
    justifyContent: 'center',
    margin: '1rem 0',
    position: 'relative',
  },
  timeIndicator: {
    backgroundColor: '#f0f0f0',
    fontSize: '0.7rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '12px',
    color: '#6B7280',
  },



  messageText: {
    marginBottom: '0.25rem',
    wordBreak: 'break-word',
  },
  messageTime: {
    fontSize: '0.7rem',
    textAlign: 'right',
  },
  inputArea: {
    padding: '1rem',
    display: 'flex',
    gap: '0.75rem',
    backgroundColor: '#FFFFFF',
  },
  
  inputWrapper: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    padding: '0 1rem',
    borderRadius: '1.5rem',
    border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  
  messageInput: {
    width: '100%',
    padding: '0.75rem 0',
    border: 'none',
    outline: 'none',
    fontSize: '0.875rem',
    backgroundColor: 'transparent',
  },
  sendButton: {
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0, 
},

  attachmentButton: {
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
    outline: 'none',
    marginRight: '0.25rem',
  },

  noChatSelected: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: '#F9FAFB',
  },
  
  noChatContent: {
    textAlign: 'center',
    maxWidth: '300px',
    padding: '2rem',
    borderRadius: '1rem',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
  },
  
  noChatIcon: {
    fontSize: '3rem',
    marginBottom: '1rem',
  },
  
  noChatTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
    color: '#1E40AF',
  },
  
  noChatText: {
    fontSize: '0.875rem',
    color: '#6B7280',
    lineHeight: '1.5',
  },
  attachmentPreview: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  
  imagePreviewWrapper: {
    position: 'relative',
    display: 'inline-block',
    maxWidth: '250px',
    borderRadius: '0.75rem',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  
  previewImage: {
    maxHeight: '180px',
    maxWidth: '250px',
    objectFit: 'cover',
    display: 'block',
  },
  
  previewDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '0.5rem',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
  },
  
  previewFileName: {
    fontSize: '0.75rem',
    fontWeight: '500',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  
  removeAttachmentButton: {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: 'none',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  
  filePreviewWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    maxWidth: '350px',
  },
  
  fileTypeIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#F3F4F6',
    marginRight: '0.75rem',
  },
  
  filePreviewInfo: {
    flex: 1,
    overflow: 'hidden',
  },
  
  fileSize: {
    fontSize: '0.7rem',
    color: '#6B7280',
    marginTop: '0.25rem',
  },
  
  removeFileButton: {
    background: 'none',
    border: 'none',
    padding: 0,
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    color: '#6B7280',
    transition: 'background-color 0.2s',
    marginLeft: '0.75rem',
  },
  messageAttachment: {
    display: 'block',
    maxWidth: '100%',
    marginTop: '0.75rem',
    borderRadius: '0.375rem',
    overflow: 'hidden',
    border: '1px solid rgba(0, 0, 0, 0.08)',
  },
  
  attachmentImage: {
    width: '100%',
    maxHeight: '200px',
    objectFit: 'cover',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    display: 'block',
  },
  
  documentAttachmentContainer: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem',
    borderRadius: '0.375rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    cursor: 'pointer',
    maxWidth: '280px', // Increased from 220px
    gap: '0.75rem',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    position: 'relative', // Added for download button positioning
  },

  // Add these new styles for the download button
  downloadButton: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: 'none',
  },

  imageAttachmentContainer: {
    maxWidth: '280px', // Increased from 250px
    borderRadius: '0.375rem',
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },

  // New style for the image download button
  imageDownloadButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    zIndex: 2,
  },

  // Add style for document details to limit text width
  documentDetails: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    maxWidth: '180px', // Add this to prevent text overlap with download button
  },
};

export default MessagesPage;