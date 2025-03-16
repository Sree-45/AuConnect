import React, { useState, useEffect } from 'react';
import NavBar from './NavBar';
import { useNavigate } from 'react-router-dom';
import { Calendar, ThumbsUp, MessageCircle, Share2, Send, MoreVertical, Heart } from 'lucide-react';
import CreatePostCard from './CreatePostCard';
import axios from 'axios';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getFullImageUrl = (path) => {
  if (!path) return '/assets/placeholder-profile.png';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `http://localhost:8080${path}`;
  return `http://localhost:8080/${path}`;
};

const FeedPage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [postsCount, setPostsCount] = useState(0);
  const [connectionsCount, setConnectionsCount] = useState(0);
  const loggedInUsername = localStorage.getItem('username');
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [expandedComments, setExpandedComments] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  // Add these new state variables
  const [postSlides, setPostSlides] = useState({});
  const [likedComments, setLikedComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [menuVisible, setMenuVisible] = useState(null);
  const [universityEvents, setUniversityEvents] = useState([]);
  const [universityData, setUniversityData] = useState(null);

  useEffect(() => {
    // Fetch the logged-in user's data
    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/profile?username=${loggedInUsername}&t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          
          // Fetch posts count
          fetchPostsCount(loggedInUsername);
          
          // Fetch connections count
          fetchConnectionsCount(loggedInUsername);
          
          // Fetch posts
          fetchPosts();
        } else {
          console.error('Failed to fetch user data');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (loggedInUsername) {
      fetchUserData();
    }
  }, [loggedInUsername]);

  // Add a specific useEffect to sync with localStorage on focus
  useEffect(() => {
    // This will refresh posts when we navigate back to this page
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPosts();
      }
    };
    
    // Event to detect when the user comes back to this tab
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // The existing focus event may not be sufficient, let's be thorough
    const handlePageFocus = () => {
      fetchPosts();
    };
    
    window.addEventListener('focus', handlePageFocus);
    
    // When navigating between pages within the app
    const handleRouteChange = () => {
      fetchPosts();
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handlePageFocus);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Force a reload when the component mounts or is revisited
  useEffect(() => {
    fetchPosts();
    fetchUniversityEvents();
  }, []);

  // Add new useEffect to fetch university profile data
  useEffect(() => {
    const fetchUniversityData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/profile?username=anurag_university`);
        if (response.ok) {
          const data = await response.json();
          setUniversityData(data);
        }
      } catch (error) {
        console.error('Error fetching university data:', error);
      }
    };

    fetchUniversityData();
  }, []);

  // Function to fetch the user's posts count
  const fetchPostsCount = async (username) => {
    try {
      // Use the existing endpoint to get all posts and count them
      const response = await fetch(`http://localhost:8080/api/posts?username=${username}`);
      if (response.ok) {
        const posts = await response.json();
        setPostsCount(posts.length);
      }
    } catch (error) {
      console.error('Error fetching posts count:', error);
    }
  };

  const fetchConnectionsCount = async (username) => {
    try {
      const response = await fetch(`http://localhost:8080/api/connections/user/${username}`);
      if (response.ok) {
        const connections = await response.json();
        setConnectionsCount(connections.length);
      }
    } catch (error) {
      console.error('Error fetching connections count:', error);
    }
  };

  const handleProfileClick = () => {
    navigate(isUniversityAccount() ? '/university' : '/profile');
  };

  const fetchPosts = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/posts/feed?username=${loggedInUsername}&t=${Date.now()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        const formattedPosts = data.map(post => {
          const isLiked = likedPosts.includes(post.id);
          
          return {
            ...post,
            author: {
              name: post.authorName,
              username: post.authorUsername,
              profilePhoto: getFullImageUrl(post.authorProfilePhoto)
            },
            comments: Array.isArray(post.comments) ? post.comments.map(comment => ({
              ...comment,
              replies: comment.replies || []
            })) : [],
            images: post.imageUrls ? post.imageUrls.map(url => getFullImageUrl(url)) : [],
            videos: post.videoUrls ? post.videoUrls.map(url => getFullImageUrl(url)) : [],
            date: post.createdDate,
            likeCount: post.likeCount || 0,
            isLiked: isLiked
          };
        });
        
        setPosts(formattedPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const toggleComments = (postId) => {
    setExpandedComments(prev => 
      prev.includes(postId) 
        ? prev.filter(id => id !== postId)
        : [...prev, postId]
    );
  };

  const handleLike = async (postId) => {
    // Check if the post is already liked by this user
    const isAlreadyLiked = likedPosts.includes(postId);
    const newIsLiked = !isAlreadyLiked;
    
    try {
      // Update UI first for better UX
      if (newIsLiked) {
        setLikedPosts([...likedPosts, postId]);
      } else {
        setLikedPosts(likedPosts.filter(id => id !== postId));
      }
      
      // Update posts state
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likeCount: newIsLiked ? (p.likeCount + 1) : Math.max(0, p.likeCount - 1),
              isLiked: newIsLiked
            };
          }
          return p;
        })
      );
      
      // Store in localStorage
      const likedPostsKey = `likedPosts_${loggedInUsername}`;
      let storedLikedPosts = JSON.parse(localStorage.getItem(likedPostsKey) || '[]');
      
      if (newIsLiked) {
        if (!storedLikedPosts.includes(postId)) {
          storedLikedPosts.push(postId);
        }
      } else {
        storedLikedPosts = storedLikedPosts.filter(id => id !== postId);
      }
      
      localStorage.setItem(likedPostsKey, JSON.stringify(storedLikedPosts));
      
      // Call API to update on server
      const response = await fetch(`http://localhost:8080/api/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loggedInUsername,
          isLiked: newIsLiked
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update like status');
      }
      
      // Optional: Update like count from server response if needed
      const data = await response.json();
      if (data.likeCount !== undefined) {
        setPosts(prevPosts => 
          prevPosts.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                likeCount: data.likeCount
              };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error('Error updating like:', error);
      
      // Revert UI changes on error
      if (isAlreadyLiked) {
        setLikedPosts([...likedPosts, postId]);
      } else {
        setLikedPosts(likedPosts.filter(id => id !== postId));
      }
      
      // Revert posts state
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likeCount: isAlreadyLiked ? (p.likeCount + 1) : Math.max(0, p.likeCount - 1),
              isLiked: isAlreadyLiked
            };
          }
          return p;
        })
      );
      
      // Revert localStorage
      const likedPostsKey = `likedPosts_${loggedInUsername}`;
      let storedLikedPosts = JSON.parse(localStorage.getItem(likedPostsKey) || '[]');
      
      if (isAlreadyLiked) {
        if (!storedLikedPosts.includes(postId)) {
          storedLikedPosts.push(postId);
        }
      } else {
        storedLikedPosts = storedLikedPosts.filter(id => id !== postId);
      }
      
      localStorage.setItem(likedPostsKey, JSON.stringify(storedLikedPosts));
    }
  };

  const handleComment = async (postId, commentText) => {
    if (!commentText.trim()) return;

    try {
      const response = await fetch(`http://localhost:8080/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: commentText,
          username: loggedInUsername
        })
      });

      if (response.ok) {
        // Refresh posts to get the new comment
        fetchPosts();
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Initialize likedPosts from localStorage
  useEffect(() => {
    if (loggedInUsername) {
      const likedPostsKey = `likedPosts_${loggedInUsername}`;
      const storedLikedPosts = JSON.parse(localStorage.getItem(likedPostsKey) || '[]');
      setLikedPosts(storedLikedPosts);
    }
  }, [loggedInUsername]);

  // Add event listeners to refresh posts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // When page becomes visible again, reload posts and refresh likedPosts
        fetchPosts();
        if (loggedInUsername) {
          const likedPostsKey = `likedPosts_${loggedInUsername}`;
          const storedLikedPosts = JSON.parse(localStorage.getItem(likedPostsKey) || '[]');
          setLikedPosts(storedLikedPosts);
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loggedInUsername]);

  // Add useEffect to load liked comments
  useEffect(() => {
    const fetchLikedComments = async () => {
      if (!loggedInUsername) return;
      
      try {
        const response = await fetch(`http://localhost:8080/api/posts/user-comment-likes?username=${loggedInUsername}`);
        if (response.ok) {
          const data = await response.json();
          setLikedComments(data);
        }
      } catch (error) {
        console.error('Error fetching liked comments:', error);
      }
    };
    
    fetchLikedComments();
  }, [loggedInUsername]);

  // Replace the existing handleCreatePost function with this one:
  const handleCreatePost = async (content, postData) => {
    try {
      // If postData is provided with complete information, use it directly
      if (postData) {
        const requestData = {
          text: postData.text || content,
          username: loggedInUsername,
          hashtags: postData.hashtags || [],
          imageUrls: postData.imageUrls || [],
          videoUrls: postData.videoUrls || []
        };
        
        // Call backend API to create post
        const response = await fetch('http://localhost:8080/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create post. Status: ${response.status}`);
        }
      } 
      // Otherwise use the old method (for backward compatibility)
      else {
        // Extract hashtags from post content
        const hashtags = [];
        const hashtagRegex = /#(\w+)/g;
        let match;
        
        while ((match = hashtagRegex.exec(content)) !== null) {
          hashtags.push(match[1]);
        }
        
        // Create post data
        const requestData = {
          text: content,
          username: loggedInUsername,
          hashtags: hashtags
        };
        
        // Call backend API to create post
        const response = await fetch('http://localhost:8080/api/posts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create post. Status: ${response.status}`);
        }
      }
      
      // Refresh posts to get the new post
      fetchPosts();
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  // Function to handle slide navigation for posts
  const navigatePostSlide = (postId, direction) => {
    const currentIndex = postSlides[postId] || 0;
    const post = posts.find(p => p.id === postId);
    
    if (!post) return;
    
    const mediaCount = (post.images?.length || 0) + (post.videos?.length || 0);
    if (mediaCount === 0) return;
    
    let newIndex;
    if (direction === 'next') {
      newIndex = (currentIndex + 1) % mediaCount;
    } else {
      newIndex = (currentIndex - 1 + mediaCount) % mediaCount;
    }
    
    setPostSlides({
      ...postSlides,
      [postId]: newIndex
    });
  };

  // Add comment like functionality
  const handleLikeComment = async (commentId) => {
    const isLiked = likedComments.includes(commentId);
    
    try {
      // Call backend API to update like status
      const response = await fetch(`http://localhost:8080/api/posts/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isLiked: !isLiked,
          username: loggedInUsername
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update comment like: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update UI based on response from server
      setPosts(posts.map(post => {
        const updatedComments = post.comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, likes: data.likeCount };
          }
          
          // Check if the comment is in replies
          if (comment.replies) {
            const updatedReplies = comment.replies.map(reply => {
              if (reply.id === commentId) {
                return { ...reply, likes: data.likeCount };
              }
              return reply;
            });
            
            return { ...comment, replies: updatedReplies };
          }
          
          return comment;
        });
        
        return { ...post, comments: updatedComments };
      }));
      
      // Update liked comments state
      if (isLiked) {
        setLikedComments(likedComments.filter(id => id !== commentId));
      } else {
        setLikedComments([...likedComments, commentId]);
      }
    } catch (error) {
      console.error('Error updating comment like:', error);
    }
  };

  // Add reply functionality
  const handleReply = (postId, commentId, replyToUsername) => {
    setReplyingTo({ postId, commentId, username: replyToUsername });
    setReplyText(`@${replyToUsername} `);
  };

  // Submit reply function
  const submitReply = async (postId, commentId) => {
    if (!replyText.trim()) return;
    
    try {
      const response = await fetch(`http://localhost:8080/api/posts/${postId}/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: replyText,
          username: loggedInUsername
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to add reply: ${response.status}`);
      }
      
      const savedReply = await response.json();
      
      // Format the saved reply for the UI using current user data
      const newReply = {
        id: savedReply.id,
        text: savedReply.text,
        date: savedReply.createdDate,
        likes: 0,
        author: {
          username: loggedInUsername,
          name: 'You',
          profilePhoto: userData?.profilePhoto ? getFullImageUrl(userData.profilePhoto) : '/assets/placeholder-profile.png'
        }
      };
      
      // Update UI with the new reply
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const updatedComments = post.comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                replies: [...(comment.replies || []), newReply]
              };
            }
            return comment;
          });
          
          return { ...post, comments: updatedComments };
        }
        return post;
      }));
      
      // Reset reply state
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  // Handle post deletion (if needed for own posts in feed)
  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/posts/${postId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete post. Status: ${response.status}`);
      }
      
      // If successful, update the UI
      setPosts(posts.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

  const handleUniversityClick = () => {
    navigate('/university');
  };

  const isUniversityAccount = () => {
    return loggedInUsername === 'anurag_university';
  };

  const navigateToUserProfile = (username) => {
    if (username === 'anurag_university') {
      navigate('/university');
    } else {
      navigate(`/profile/${username}`);
    }
  };

  const isEventToday = (eventDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const date = new Date(eventDate);
    date.setHours(0, 0, 0, 0);
    
    return date.getTime() === today.getTime();
  };

  const fetchUniversityEvents = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/events');
      if (response.status === 200) {
        // Filter for today's events
        const allEvents = response.data;
        const todaysEvents = allEvents.filter(event => isEventToday(event.date));
        
        // If we have events today, use those, otherwise take the most recent ones
        const eventsToShow = todaysEvents.length > 0 
          ? todaysEvents 
          : allEvents.sort((a, b) => new Date(a.date) - new Date(b.date)).slice(0, 3);
        
        setUniversityEvents(eventsToShow);
      }
    } catch (error) {
      console.error('Error fetching university events:', error);
      setUniversityEvents([]);
    }
  };

  return (
    <div style={styles.container}>
      <NavBar />
      
      <div style={styles.content}>
        <div style={styles.contentGrid}>
          <div style={styles.leftColumn}>
            {isUniversityAccount() ? (
              <div style={styles.profileCard}>
                {loading ? (
                  <div style={styles.profileLoading}>Loading university...</div>
                ) : (
                  <>
                    <div 
                      style={{
                        ...styles.profileBackground,
                        backgroundImage: `url(${universityData?.coverPhoto || '../public/au_cover.jpg'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    ></div>
                    <div style={styles.profileContent}>
                      <div style={styles.profileImageContainer} onClick={handleUniversityClick}>
                        <img 
                          src={universityData?.profilePhoto || '../public/au_logo.jpg'} 
                          alt="University"
                          style={styles.profileImage}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '../public/au_logo.jpg';
                          }}
                        />
                      </div>
                      <div style={styles.profileInfo}>
                        <h3 style={styles.profileName} onClick={handleUniversityClick}>
                          Anurag University
                        </h3>
                        <p style={styles.profileUsername}>@anurag_university</p>
                      </div>
                      
                      <div style={styles.universityEvents}>
                        <h4 style={styles.eventsTitle}>
                          {universityEvents.length > 0 ? "Today's Events" : "No events today"}
                        </h4>
                        {universityEvents.length > 0 ? (
                          universityEvents.slice(0, 3).map((event, index) => (
                            <div key={event.id || index} style={styles.eventItem}>
                              <span>{event.name} @ {event.time}</span>
                            </div>
                          ))
                        ) : (
                          <div style={styles.eventItem}>
                            <span>No upcoming events</span>
                          </div>
                        )}
                        <div style={{marginTop: '8px', textAlign: 'center'}}>
                          <a 
                            href="/events" 
                            style={{color: '#1E40AF', fontSize: '0.8rem', textDecoration: 'none'}}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate('/events');
                            }}
                          >
                            View all events →
                          </a>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div style={styles.profileCard}>
                {loading ? (
                  <div style={styles.profileLoading}>Loading profile...</div>
                ) : userData ? (
                  <>
                    <div 
                      style={{
                        ...styles.profileBackground,
                        backgroundImage: `url(${userData.coverPhoto || '/assets/placeholder-cover.png'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    ></div>
                    <div style={styles.profileContent}>
                      <div style={styles.profileImageContainer} onClick={handleProfileClick}>
                        <img 
                          src={userData.profilePhoto || '/assets/placeholder-profile.png'} 
                          alt="Profile"
                          style={styles.profileImage}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/placeholder-profile.png';
                          }}
                        />
                      </div>
                      <div style={styles.profileInfo}>
                        <h3 style={styles.profileName} onClick={handleProfileClick}>
                          {userData.firstName} {userData.lastName}
                        </h3>
                        <p style={styles.profileUsername}>@{userData.username}</p>
                        {userData.major && (
                          <div style={styles.profileMajor}>{userData.major} Student</div>
                        )}
                      </div>
                      
                      <div style={styles.profileStats}>
                        <div style={styles.statItem}>
                          <span style={styles.statValue}>{postsCount}</span>
                          <span style={styles.statLabel}>Posts</span>
                        </div>
                        <div style={styles.statItem}>
                          <span style={styles.statValue}>{connectionsCount}</span>
                          <span style={styles.statLabel}>Connections</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={styles.profileError}>Could not load profile</div>
                )}
              </div>
            )}

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Shortcuts</h3>
              <div style={styles.shortcutItem}>
                <span>My Profile</span>
              </div>
              <div style={styles.shortcutItem}>
                <span>Connections</span>
              </div>
              <div style={styles.shortcutItem}>
                <span>Events</span>
              </div>
              <div style={styles.shortcutItem}>
                <span>Groups</span>
              </div>
            </div>
          </div>
          
          <div style={styles.middleColumn}>
            <CreatePostCard 
              onPostSubmit={handleCreatePost}
              userData={userData}
            />

            {posts.length > 0 ? (
              posts.map((post) => (
                <div key={post.id} style={styles.post}>
                  <div style={styles.postHeader}>
                    <div style={styles.postHeaderLeft}>
                      <img 
                        src={post.author.profilePhoto || '/assets/placeholder-profile.png'} 
                        alt={post.author.name} 
                        style={{...styles.postAuthorImage, cursor: 'pointer'}}
                        onClick={() => navigateToUserProfile(post.author.username)}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = '/assets/placeholder-profile.png';
                        }}
                      />
                      <div>
                        <h4 
                          style={{...styles.postAuthorName, cursor: 'pointer'}}
                          onClick={() => navigateToUserProfile(post.author.username)}
                        >
                          {post.author.name}
                        </h4>
                        <p style={styles.postDate}>
                          <Calendar size={14} color="#6B7280" />
                          <span>{formatDate(post.date)}</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Show menu for own posts */}
                    {post.author.username === loggedInUsername && (
                      <div 
                        style={styles.menuTrigger}
                        onMouseEnter={() => setMenuVisible(post.id)}
                        onMouseLeave={() => setMenuVisible(null)}
                      >
                        <MoreVertical size={18} color="#6B7280" />
                        <div style={{
                          ...styles.menuDropdown,
                          display: menuVisible === post.id ? 'block' : 'none'
                        }}>
                          <button 
                            onClick={() => handleDeletePost(post.id)} 
                            style={styles.menuItem}
                          >
                            Delete Post
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p style={styles.postText}>{post.text}</p>
                  
                  {/* Hashtags section */}
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div style={styles.hashtagContainer}>
                      {post.hashtags.map((tag, index) => (
                        <span key={index} style={styles.hashtag}>
                          #{typeof tag === 'object' ? tag.name : tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Enhanced Media display with slideshow */}
                  {((post.images && post.images.length > 0) || (post.videos && post.videos.length > 0)) && (
                    <div style={styles.postMediaSlideshow}>
                      {[
                        ...(post.images || []).map(img => ({
                          type: 'image',
                          src: img
                        })),
                        ...(post.videos || []).map(video => ({
                          type: 'video',
                          src: video
                        }))
                      ].map((media, index) => (
                        <div 
                          key={index} 
                          style={{
                            ...styles.postMediaSlide,
                            display: (postSlides[post.id] || 0) === index ? 'block' : 'none'
                          }}
                        >
                          {media.type === 'image' ? (
                            <img 
                              src={media.src} 
                              alt="" 
                              style={styles.postMediaImage}
                              onError={(e) => {
                                console.error('Failed to load image:', media.src);
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <video src={media.src} controls style={styles.postMediaVideo} />
                          )}
                        </div>
                      ))}
                      
                      {/* Navigation buttons for slideshow */}
                      {(post.images?.length + (post.videos?.length || 0) > 1) && (
                        <>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigatePostSlide(post.id, 'prev');
                            }}
                            style={styles.postSlideNavButtonLeft}
                            aria-label="Previous media"
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                          </button>
                          
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigatePostSlide(post.id, 'next');
                            }}
                            style={styles.postSlideNavButtonRight}
                            aria-label="Next media"
                          >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="9 18 15 12 9 6"></polyline>
                            </svg>
                          </button>
                          
                          {/* Dot indicators */}
                          <div style={styles.postSlideIndicators}>
                            {Array((post.images?.length || 0) + (post.videos?.length || 0)).fill().map((_, idx) => (
                              <button
                                key={idx}
                                type="button"
                                style={{
                                  ...styles.postSlideIndicator,
                                  backgroundColor: (postSlides[post.id] || 0) === idx ? '#FFFFFF' : 'rgba(255, 255, 255, 0.5)'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPostSlides({
                                    ...postSlides,
                                    [post.id]: idx
                                  });
                                }}
                                aria-label={`Go to slide ${idx + 1}`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Post interactions */}
                  <div style={styles.postInteractions}>
                    <button 
                      style={{
                        ...styles.interactionButton,
                        color: likedPosts.includes(post.id) ? '#1E40AF' : '#4B5563'
                      }} 
                      onClick={() => handleLike(post.id)}
                    >
                      <ThumbsUp 
                        size={18} 
                        color={likedPosts.includes(post.id) ? '#1E40AF' : '#4B5563'} 
                        fill={likedPosts.includes(post.id) ? '#1E40AF' : 'none'}
                      />
                      <span>{post.likeCount || 0} Likes</span>
                    </button>
                    
                    <button 
                      style={styles.interactionButton} 
                      onClick={() => toggleComments(post.id)}
                    >
                      <MessageCircle size={18} color="#4B5563" />
                      <span>{post.comments?.length || 0} Comments</span>
                    </button>
                    
                    <button style={styles.interactionButton}>
                      <Share2 size={18} color="#4B5563" />
                      <span>Share</span>
                    </button>
                  </div>
                  
                  {/* Enhanced Comments section with replies */}
                  {expandedComments.includes(post.id) && (
                    <div style={styles.commentsSection}>
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                          <div key={comment.id} style={styles.comment}>
                            <img 
                              src={comment.author?.profilePhoto || '/assets/placeholder-profile.png'}
                              alt={comment.author?.name || 'User'}
                              style={{...styles.commentAuthorImage, cursor: 'pointer'}}
                              onClick={() => navigateToUserProfile(comment.author.username)}
                            />
                            <div style={styles.commentContentWrapper}>
                              <div style={styles.commentContent}>
                                <h5 
                                  style={{...styles.commentAuthorName, cursor: 'pointer'}}
                                  onClick={() => navigateToUserProfile(comment.author.username)}
                                >
                                  {comment.author?.name || 'Unknown User'}
                                </h5>
                                <p style={styles.commentText}>{comment.text}</p>
                                <div style={styles.commentActions}>
                                  <span style={styles.commentDate}>{formatDate(comment.date)}</span>
                                  <button 
                                    style={{
                                      ...styles.commentActionButton,
                                      color: likedComments.includes(comment.id) ? '#1E40AF' : '#6B7280'
                                    }}
                                    onClick={() => handleLikeComment(comment.id)}
                                  >
                                    Like
                                  </button>
                                  <button 
                                    style={styles.commentActionButton}
                                    onClick={() => handleReply(post.id, comment.id, comment.author.username)}
                                  >
                                    Reply
                                  </button>
                                  <span style={{
                                    ...styles.commentLikes,
                                    display: comment.likes ? 'flex' : 'none'
                                  }}>
                                    <Heart size={12} fill="#1E40AF" color="#1E40AF" />
                                    {comment.likes}
                                  </span>
                                </div>
                              </div>
                              
                              {/* Replies section */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div style={styles.repliesContainer}>
                                  {comment.replies.map(reply => (
                                    <div key={reply.id} style={styles.reply}>
                                      <img 
                                        src={reply.author?.profilePhoto || '/assets/placeholder-profile.png'}
                                        alt={reply.author?.name || 'User'}
                                        style={{...styles.commentAuthorImage, cursor: 'pointer'}}
                                        onClick={() => navigateToUserProfile(reply.author.username)}
                                      />
                                      <div style={styles.replyContentWrapper}>
                                        <div style={styles.commentContent}>
                                          <h5 
                                            style={{...styles.commentAuthorName, cursor: 'pointer'}}
                                            onClick={() => navigateToUserProfile(reply.author.username)}
                                          >
                                            {reply.author?.name || 'Unknown User'}
                                          </h5>
                                          <p style={styles.commentText}>{reply.text}</p>
                                          <div style={styles.commentActions}>
                                            <span style={styles.commentDate}>{formatDate(reply.date)}</span>
                                            <button 
                                              style={{
                                                ...styles.commentActionButton,
                                                color: likedComments.includes(reply.id) ? '#1E40AF' : '#6B7280'
                                              }}
                                              onClick={() => handleLikeComment(reply.id)}
                                            >
                                              Like
                                            </button>
                                            <span style={{
                                              ...styles.commentLikes,
                                              display: reply.likes ? 'flex' : 'none'
                                            }}>
                                              <Heart size={12} fill="#1E40AF" color="#1E40AF" />
                                              {reply.likes}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* Reply input */}
                              {replyingTo && replyingTo.commentId === comment.id && (
                                <div style={styles.replyInputContainer}>
                                  <img 
                                    src={userData?.profilePhoto || '/assets/placeholder-profile.png'}
                                    alt={userData?.firstName || 'You'}
                                    style={styles.commentAuthorImage}
                                  />
                                  <input
                                    type="text"
                                    placeholder={`Reply to ${replyingTo.username}...`}
                                    style={styles.replyInput}
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter') {
                                        submitReply(post.id, comment.id);
                                      }
                                    }}
                                  />
                                  <button 
                                    style={styles.sendButton}
                                    onClick={() => submitReply(post.id, comment.id)}
                                  >
                                    <Send size={16} />
                                  </button>
                                  <button
                                    style={styles.cancelButton}
                                    onClick={() => setReplyingTo(null)}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p style={styles.emptyMessage}>No comments yet. Be the first to comment!</p>
                      )}
                      
                      {/* Comment input */}
                      <div style={styles.addCommentContainer}>
                        <img 
                          src={userData?.profilePhoto || '/assets/placeholder-profile.png'}
                          alt="Profile"
                          style={styles.commentAuthorImage}
                        />
                        <input 
                          type="text"
                          placeholder="Write a comment..."
                          style={styles.commentInput}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleComment(post.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                        />
                        <button 
                          style={styles.sendButton}
                          onClick={(e) => {
                            const input = e.target.closest('div').querySelector('input');
                            handleComment(post.id, input.value);
                            input.value = '';
                          }}
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div style={styles.noPostsMessage}>No posts yet. Create your first post!</div>
            )}
          </div>
          
          {/* Right Column */}
          <div style={styles.rightColumn}>
            {/* Only show university profile if not logged in as university account */}
            {!isUniversityAccount() && (
              <div style={styles.profileCard}>
                {loading ? (
                  <div style={styles.profileLoading}>Loading university...</div>
                ) : (
                  <>
                    <div 
                      style={{
                        ...styles.profileBackground,
                        backgroundImage: `url(${universityData?.coverPhoto || '../public/au_cover.jpg'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    ></div>
                    <div style={styles.profileContent}>
                      <div style={styles.profileImageContainer} onClick={handleUniversityClick}>
                        <img 
                          src={universityData?.profilePhoto || '../public/au_logo.jpg'} 
                          alt="University"
                          style={styles.profileImage}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '../public/au_logo.jpg';
                          }}
                        />
                      </div>
                      <div style={styles.profileInfo}>
                        <h3 style={styles.profileName} onClick={handleUniversityClick}>
                          Anurag University
                        </h3>
                        <p style={styles.profileUsername}>@anurag_university</p>
                      </div>
                      
                      <div style={styles.universityEvents}>
                        <h4 style={styles.eventsTitle}>
                          {universityEvents.length > 0 ? "Today's Events" : "No events today"}
                        </h4>
                        {universityEvents.length > 0 ? (
                          universityEvents.slice(0, 3).map((event, index) => (
                            <div key={event.id || index} style={styles.eventItem}>
                              <span>{event.name} @ {event.time}</span>
                            </div>
                          ))
                        ) : (
                          <div style={styles.eventItem}>
                            <span>No upcoming events</span>
                          </div>
                        )}
                        <div style={{marginTop: '8px', textAlign: 'center'}}>
                          <a 
                            href="/events" 
                            style={{color: '#1E40AF', fontSize: '0.8rem', textDecoration: 'none'}}
                            onClick={(e) => {
                              e.preventDefault();
                              navigate('/events');
                            }}
                          >
                            View all events →
                          </a>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Suggested Connections</h3>
              <div style={styles.suggestionItem}>
                <span>Suggested users will appear here</span>
              </div>
            </div>
            
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Trending Topics</h3>
              <div style={styles.trendingItem}>
                <span>#AcademicSuccess</span>
              </div>
              <div style={styles.trendingItem}>
                <span>#CampusEvents</span>
              </div>
              <div style={styles.trendingItem}>
                <span>#StudentLife</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    width: '100vw',
    minHeight: '100vh',
    backgroundColor: '#F3F4F6',
    overflowX: 'hidden',
    position: 'relative',
  },
  content: {
    padding: '1.5rem 1rem',
    maxWidth: '1400px',
    margin: '0 auto',
    marginTop: '80px', // Adjust this value based on your navbar's height
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 2fr 1fr',
    gap: '1.5rem',
    width: '100%',
    overflow: 'visible',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  middleColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  // Profile Card Styles
  profileCard: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.5rem',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  profileBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '80px', // Increased height for better visibility of cover photo
    background: '#E5E7EB', // Fallback color if image fails to load
    zIndex: 0,
  },
  // Add to your styles object
universityEvents: {
  width: '100%',
  marginTop: '1.25rem',
  padding: '0.75rem 0 0',
  borderTop: '1px solid #F3F4F6',
},
eventsTitle: {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#111827',
  marginBottom: '0.5rem',
},
eventItem: {
  padding: '0.5rem 0',
  fontSize: '0.875rem',
  color: '#4B5563',
  borderBottom: '1px solid #F3F4F6',
},
  profileContent: {
    position: 'relative',
    zIndex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '20px', // Added to give space from the cover photo
  },
  profileImageContainer: {
    width: '85px',
    height: '85px',
    marginBottom: '1rem',
    cursor: 'pointer',
    borderRadius: '50%',
    padding: '3px',
    background: 'white',
    boxShadow: '0 3px 10px rgba(0, 0, 0, 0.12)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid white',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  profileName: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 0.25rem 0',
    cursor: 'pointer',
  },
  profileUsername: {
    fontSize: '0.875rem',
    color: '#6B7280',
    margin: '0 0 0.75rem 0',
  },
  profileMajor: {
    fontSize: '0.85rem',
    backgroundColor: '#EFF6FF',
    color: '#1E40AF',
    padding: '0.375rem 0.75rem',
    borderRadius: '9999px',
    margin: '0.25rem 0 0 0',
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: '500',
  },
  profileStats: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: '1.25rem',
    padding: '0.75rem 0 0',
    borderTop: '1px solid #F3F4F6',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#6B7280',
    marginTop: '0.125rem',
  },
  profileLoading: {
    padding: '1rem',
    color: '#6B7280',
    fontSize: '0.875rem',
  },
  profileError: {
    padding: '1rem',
    color: '#EF4444',
    fontSize: '0.875rem',
  },
  section: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #E5E7EB',
  },
  shortcutItem: {
    padding: '0.75rem 0',
    cursor: 'pointer',
    fontSize: '0.875rem',
    transition: 'color 0.2s',
    color: '#4B5563',
    borderBottom: '1px solid #F3F4F6',
  },
  suggestionItem: {
    padding: '0.75rem 0',
    fontSize: '0.875rem',
    color: '#4B5563',
  },
  trendingItem: {
    padding: '0.75rem 0',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#1E40AF',
    fontWeight: '500',
  },
  post: {
    padding: '1.5rem',
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  postHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  postAuthorImage: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    marginRight: '0.75rem',
    objectFit: 'cover',
  },
  postAuthorName: {
    margin: '0 0 0.25rem 0',
    fontSize: '1rem',
    fontWeight: '600',
  },
  postUsername: {
    fontSize: '0.875rem',
    color: '#6B7280',
    margin: '0 0 0.25rem 0',
    display: 'block',
  },
  postDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#6B7280',
  },
  postText: {
    margin: '0 0 1rem 0',
    lineHeight: '1.5',
  },
  hashtagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  hashtag: {
    fontSize: '0.875rem',
    color: '#1E40AF',
    fontWeight: '500',
    backgroundColor: '#E0E7FF',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    display: 'inline-block',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  postInteractions: {
    display: 'flex',
    borderTop: '1px solid #E5E7EB',
    borderBottom: '1px solid #E5E7EB',
    padding: '0.5rem 0',
    marginBottom: '1rem',
  },
  commentsSection: {
    marginTop: '1rem',
  },
  addCommentContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '1rem',
    position: 'relative',
  },
  commentAuthorImage: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  commentInput: {
    flex: 1,
    border: '1px solid #E5E7EB',
    borderRadius: '1.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    paddingRight: '2.5rem',
  },
  sendButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: 'none',
    color: '#1E40AF',
    cursor: 'pointer',
    padding: '0.25rem',
    borderRadius: '50%',
  },
  interactionButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    background: 'none',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#4B5563',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#F3F4F6',
    }
  },
  interactionButtonActive: {
    color: '#1E40AF',
    fill: '#1E40AF',
  },
  postImagesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  postImage: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '0.375rem',
    backgroundColor: '#F3F4F6',
  },
  comment: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: '0.5rem',
    padding: '0.75rem',
  },
  commentAuthorName: {
    margin: '0 0 0.25rem 0',
    fontSize: '0.875rem',
    fontWeight: '600',
  },
  commentText: {
    margin: '0 0 0.25rem 0',
    fontSize: '0.875rem',
  },
  commentDate: {
    fontSize: '0.75rem',
    color: '#6B7280',
  },
  noPostsMessage: {
    textAlign: 'center',
    padding: '2rem',
    color: '#6B7280',
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  // Add these to your styles object
  postMediaSlideshow: {
    position: 'relative',
    width: '100%',
    height: '450px',
    marginBottom: '1rem',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  postMediaSlide: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  postMediaImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    backgroundColor: '#000',
  },
  postMediaVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    backgroundColor: '#000',
  },
  postSlideNavButtonLeft: {
    position: 'absolute',
    top: '50%',
    left: '16px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 5,
    color: '#FFFFFF',
    transition: 'all 0.2s ease',
  },
  postSlideNavButtonRight: {
    position: 'absolute',
    top: '50%',
    right: '16px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 5,
    color: '#FFFFFF',
    transition: 'all 0.2s ease',
  },
  postSlideIndicators: {
    position: 'absolute',
    bottom: '16px',
    left: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
  },
  postSlideIndicator: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    border: 'none',
    padding: '0',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  menuTrigger: {
    position: 'relative',
    cursor: 'pointer',
  },
  menuDropdown: {
    position: 'absolute',
    right: 0,
    top: '100%',
    backgroundColor: 'white',
    borderRadius: '0.375rem',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
    padding: '0.5rem',
    zIndex: 10,
    display: 'none',
    width: '150px',
  },
  menuItem: {
    display: 'block',
    width: '100%',
    padding: '0.5rem',
    textAlign: 'left',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    color: '#EF4444',
  },
  commentContentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  commentActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.25rem',
  },
  commentLikes: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    color: '#1E40AF',
  },
  commentActionButton: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: '0.75rem',
    color: '#6B7280',
    fontWeight: '500',
    cursor: 'pointer',
  },
  repliesContainer: {
    marginLeft: '1.5rem',
    marginTop: '0.75rem',
  },
  reply: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.75rem',
  },
  replyContentWrapper: {
    flex: 1,
  },
  replyInputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginLeft: '1.5rem',
    marginTop: '0.5rem',
  },
  replyInput: {
    flex: 1,
    border: '1px solid #E5E7EB',
    borderRadius: '1.5rem',
    padding: '0.35rem 0.75rem',
    fontSize: '0.75rem',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
  }
};

export default FeedPage;
