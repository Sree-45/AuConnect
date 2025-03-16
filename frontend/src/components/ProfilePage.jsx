import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  MapPin, Mail, Phone, Edit3, Calendar, Briefcase, Award, Link as LinkIcon, 
  ThumbsUp, MessageCircle, Share2, X, Smile, Image, Film, Hash, 
  MoreVertical, Send, Heart, UserPlus, Check, UserX, Clock, Users 
} from 'lucide-react';
import NavBar from './NavBar'; 
import axios from 'axios';

const spinKeyframes = '@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }';

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImages, setNewPostImages] = useState([]);
  const [newPostVideos, setNewPostVideos] = useState([]);
  const [newPostHashtags, setNewPostHashtags] = useState('');
  const [newPostFiles, setNewPostFiles] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [likedComments, setLikedComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [menuVisible, setMenuVisible] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [postSlides, setPostSlides] = useState({});
  
  const navigate = useNavigate();
  const { username: profileUsername } = useParams(); 
  const loggedInUsername = localStorage.getItem('username'); 
  const displayUsername = profileUsername || loggedInUsername;
  
  const [expandedComments, setExpandedComments] = useState([]);
  
  const commentInputRefs = useRef({});
  
  const [submittingPost, setSubmittingPost] = useState(false);

  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const [loggedInUserData, setLoggedInUserData] = useState(null);

  const [connectionStatus, setConnectionStatus] = useState('not_connected'); 
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [isConnectButtonHovered, setIsConnectButtonHovered] = useState(false);

  const [connectionsCount, setConnectionsCount] = useState(0);

  const location = useLocation();

  useEffect(() => {
    if (loggedInUsername) {
      const likedPostsKey = `likedPosts_${loggedInUsername}`;
      const storedLikedPosts = JSON.parse(localStorage.getItem(likedPostsKey) || '[]');
      setLikedPosts(storedLikedPosts);
    }
  }, [loggedInUsername]);

  useEffect(() => {
    setIsOwnProfile(displayUsername === loggedInUsername);
    setConnectionStatus(null);
    
    console.log("Profile changed, isOwnProfile:", displayUsername === loggedInUsername);
    
    if (displayUsername !== loggedInUsername) {
      console.log("Setting loading to true before fetching status");
      setConnectionLoading(true);
      fetchConnectionStatus();
    } else {
      setConnectionLoading(false);
    }

    const fetchLoggedInUserData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/profile?username=${loggedInUsername}&t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          setLoggedInUserData(data);
        }
      } catch (error) {
        console.error('Error fetching logged-in user data:', error);
      }
    };

    const fetchUserData = async () => {
      try {
        const response = await fetch(`http://localhost:8080/profile?username=${displayUsername}&t=${Date.now()}`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Server error details:', errorData);
          throw new Error(`Network response was not ok. Status: ${response.status}`);
        }
        const data = await response.json();
        
        const userData = {
          ...data,
          experiences: data.professionalExperiences || [],
          achievements: data.academicAchievements || [],
          interests: data.interests || [],
          socialLinks: data.socialLinks ? Object.entries(data.socialLinks).map(([platform, url]) => ({ platform, url })) : []
        };
        
        setUserData(userData);
        
        await fetchUserPosts(userData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    const fetchUserPosts = async (userData) => {
      try {
        const response = await fetch(`http://localhost:8080/api/posts?username=${displayUsername}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.status}`);
        }
        const postsData = await response.json();
        
        const likesResponse = await fetch(`http://localhost:8080/api/posts/user-likes?username=${loggedInUsername}`);
        let userLikedPostIds = [];
        
        if (likesResponse.ok) {
          userLikedPostIds = await likesResponse.json();
          setLikedPosts(userLikedPostIds);
        }
        
        const commentLikesResponse = await fetch(`http://localhost:8080/api/posts/user-comment-likes?username=${loggedInUsername}`);
        let userLikedCommentIds = [];
        
        if (commentLikesResponse.ok) {
          userLikedCommentIds = await commentLikesResponse.json();
          setLikedComments(userLikedCommentIds);
        }
        
        const formattedPosts = postsData.map(post => ({
          id: post.id,
          text: post.text,
          date: post.createdDate,
          likes: post.likeCount || 0,
          hashtags: post.hashtags ? post.hashtags.map(tag => tag.name) : [],
          images: post.imageUrls || [],
          videos: post.videoUrls || [],
          comments: (post.comments || []).map(comment => {
            const isOwnComment = comment.author.username === loggedInUsername;
            
            return {
              id: comment.id,
              text: comment.text,
              date: comment.date,
              likes: comment.likes || 0,
              author: {
                username: comment.author.username,
                name: isOwnComment ? 'You' : comment.author.name,
                profilePhoto: isOwnComment ? 
                  getFullImageUrl(userData.profilePhoto) : 
                  getFullImageUrl(comment.author.profilePhoto)
              },
              replies: (comment.replies || []).map(reply => {
                const isOwnReply = reply.author.username === loggedInUsername;
                
                return {
                  id: reply.id,
                  text: reply.text,
                  date: reply.date,
                  likes: reply.likes || 0,
                  author: {
                    username: reply.author.username,
                    // Show "You" if the reply is from the logged-in user
                    name: isOwnReply ? 'You' : reply.author.name,
                    // Process URLs correctly
                    profilePhoto: isOwnReply ? 
                      getFullImageUrl(userData.profilePhoto) : 
                      getFullImageUrl(reply.author.profilePhoto)
                  }
                };
              })
            };
          }),
          author: {
            username: post.authorUsername || userData.username,
            name: post.authorName || `${userData.firstName} ${userData.lastName}`,
            profilePhoto: post.authorProfilePhoto || userData.profilePhoto
          }
        }));
        
        setPosts(formattedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      }
    };

    // Call both functions
    fetchLoggedInUserData();
    fetchUserData();
    fetchUserConnections(); // Add this line
  }, [displayUsername, loggedInUsername, location.pathname]);

  // Then in your component before the return statement
  useEffect(() => {
    // Create a style element
    const styleElement = document.createElement('style');
    // Add the keyframes definition
    styleElement.innerHTML = spinKeyframes;
    // Append to document head
    document.head.appendChild(styleElement);
    
    // Cleanup
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Update fetchConnectionStatus to include more logging
const fetchConnectionStatus = async () => {
  if (isOwnProfile) return; // No need to check connection status for own profile
  
  try {
    console.log("Fetching connection status...");
    const response = await fetch(
      `http://localhost:8080/api/connections/status?fromUsername=${loggedInUsername}&toUsername=${displayUsername}&t=${Date.now()}`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log("Connection status received:", data.status);
      setConnectionStatus(data.status);
    }
  } catch (error) {
    console.error('Error fetching connection status:', error);
  } finally {
    console.log("Setting loading to false after fetch");
    setConnectionLoading(false);
  }
};

  const handleEditProfile = () => {
    console.log("Navigating to edit page...");
    // Make sure we're using the correct path with the username
    navigate(`/edit`);
  };

  // New functions for post handling
  const openPostModal = () => {
    setIsPostModalOpen(true)
  };

  const closePostModal = () => {
    setIsPostModalOpen(false);
    // Reset form data
    setNewPostContent('');
    setNewPostImages([]);
    setNewPostVideos([]);
    setNewPostHashtags('');
    setNewPostFiles([]);
    setCurrentSlide(0);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setNewPostImages([...newPostImages, ...newImages]);
    setCurrentSlide(0); // Reset to first slide when new media is added
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newVideos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setNewPostVideos([...newPostVideos, ...newVideos]);
    setCurrentSlide(0); // Reset to first slide when new media is added
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...newPostImages];
    URL.revokeObjectURL(updatedImages[index].preview);
    updatedImages.splice(index, 1);
    setNewPostImages(updatedImages);
  };

  const handleRemoveVideo = (index) => {
    const updatedVideos = [...newPostVideos];
    URL.revokeObjectURL(updatedVideos[index].preview);
    updatedVideos.splice(index, 1);
    setNewPostVideos(updatedVideos);
  };

  // Update handlePostSubmit to extract hashtags from post content with improved regex
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    
    // Extract hashtags from post content with improved regex
    const hashtags = [];
    const hashtagRegex = /#(\w+)/g;
    let match;
    
    while ((match = hashtagRegex.exec(newPostContent)) !== null) {
      // match[1] contains the captured group (the word after the #)
      hashtags.push(match[1]);
    }
    
    // Create new post object with hashtags data needed for backend
    const postDataForBackend = {
      text: newPostContent,
      username: userData.username,
      hashtags: hashtags
    };
    
    try {
      // Show loading state
      setSubmittingPost(true);
      
      // Call backend API with upload handling
      const savedPost = await createPost(postDataForBackend);
      console.log('Post saved successfully:', savedPost);
      
      // Then update UI with the saved post data including real URLs
      const newPost = {
        id: savedPost.id,
        text: savedPost.text,
        hashtags: hashtags,
        images: savedPost.imageUrls || [],
        videos: savedPost.videoUrls || [],
        date: savedPost.createdDate,
        likes: 0,
        comments: [],
        author: {
          username: userData.username,
          name: `${userData.firstName} ${userData.lastName}`,
          profilePhoto: userData.profilePhoto
        }
      };
      
      // Add the new post to the posts array
      setPosts([newPost, ...posts]);
      
      // Close modal and reset form
      closePostModal();
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setSubmittingPost(false);
    }
  };

  // Modified handleLike to toggle likes and ensure cross-page consistency
  const handleLike = async (postId) => {
    // Check if the post is already liked by this user
    const isAlreadyLiked = likedPosts.includes(postId);
    const newIsLiked = !isAlreadyLiked;
    
    try {
      // Call backend API first to update like status
      const response = await updatePostLike(postId, newIsLiked);
      
      // Update UI based on response from server
      setPosts(posts.map(post => {
        if (post.id === postId) {
          return { 
            ...post, 
            likes: response.likeCount || (isAlreadyLiked ? Math.max(0, post.likes - 1) : post.likes + 1)
          };
        }
        return post;
      }));
      
      // Update liked posts state
      if (isAlreadyLiked) {
        setLikedPosts(likedPosts.filter(id => id !== postId));
      } else {
        setLikedPosts([...likedPosts, postId]);
      }
      
      // Store the liked status in localStorage for cross-page consistency
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
    } catch (error) {
      console.error('Error updating post like:', error);
    }
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
          username: localStorage.getItem('username')
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

  // Add functionality to handle comment replies
  const handleReply = (postId, commentId, replyToUsername) => {
    setReplyingTo({ postId, commentId, username: replyToUsername });
    setReplyText(`@${replyToUsername} `);
  };
  
  // Submit a reply to a comment
const submitReply = async (postId, commentId) => {
  if (!replyText.trim()) return;
  
  try {
    // Call backend API to add reply
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
    
    // Use logged-in user's profile photo
    const profilePhotoUrl = isOwnProfile 
      ? userData.profilePhoto 
      : loggedInUserData?.profilePhoto;
    
    // Format the saved reply for the UI using current user data
    const newReply = {
      id: savedReply.id,
      text: savedReply.text,
      date: savedReply.createdDate,
      likes: 0,
      author: {
        username: loggedInUsername,
        name: 'You',
        // Use logged-in user's photo
        profilePhoto: getFullImageUrl(profilePhotoUrl)
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
  
  // Add functionality to delete posts
  const deletePost = async (postId) => {
    // Filter out the deleted post
    setPosts(posts.filter(post => post.id !== postId));
    
    // Call backend API to delete post
    try {
      await deletePostAPI(postId);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // Fix the handler function to call the API function correctly
const handleDeletePost = async (postId) => {
  try {
    // Call the API first
    await deletePostAPI(postId);
    
    // If successful, update the UI
    setPosts(posts.filter(post => post.id !== postId));
  } catch (error) {
    console.error('Error deleting post:', error);
    alert('Failed to delete post. Please try again.');
  }
};

  // Function to toggle comment visibility
  const toggleComments = (postId) => {
    if (expandedComments.includes(postId)) {
      setExpandedComments(expandedComments.filter(id => id !== postId));
    } else {
      setExpandedComments([...expandedComments, postId]);
    }
  };

  // Update the handleComment function to always use the logged-in user's profile picture
const handleComment = async (postId) => {
  const commentText = commentInputRefs.current[postId]?.value;
  if (!commentText || !commentText.trim()) return;
  
  try {
    // Call backend API to add comment
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
    
    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.status}`);
    }
    
    const savedComment = await response.json();
    
    // Use the logged-in user's profile picture, not the profile owner's
    const profilePhotoUrl = isOwnProfile 
      ? userData.profilePhoto 
      : loggedInUserData?.profilePhoto;
      
    // Update UI with the new comment
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const newComment = {
          id: savedComment.id,
          text: savedComment.text,
          author: {
            username: loggedInUsername,
            name: 'You', 
            // Use logged-in user's photo
            profilePhoto: getFullImageUrl(profilePhotoUrl)
          },
          date: savedComment.createdDate,
          likes: 0
        };
        return { 
          ...post, 
          comments: [...(post.comments || []), newComment]
        };
      }
      return post;
    }));

    // Clear the input after posting
    if (commentInputRefs.current[postId]) {
      commentInputRefs.current[postId].value = '';
    }
  } catch (error) {
    console.error('Error adding comment:', error);
  }
};

  // Function to handle slide navigation for posts
  const navigatePostSlide = (postId, direction) => {
    const currentIndex = postSlides[postId] || 0;
    const post = posts.find(p => p.id === postId);
    
    // Fix: Check if post has media before calculating count
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

  // Move the createPost function here inside the component
  const createPost = async (postData) => {
    try {
      // Upload images first
      const imageUrls = [];
      for (const image of newPostImages) {
        const formData = new FormData();
        formData.append('file', image.file);
        formData.append('type', 'image');
        
        const response = await axios.post(
          'http://localhost:8080/api/posts/upload-media', 
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        
        // Don't add http://localhost:8080 here - just use the returned URL
        imageUrls.push(response.data.fileUrl);
      }
      
      // Upload videos
      const videoUrls = [];
      for (const video of newPostVideos) {
        const formData = new FormData();
        formData.append('file', video.file);
        formData.append('type', 'video');
        
        const response = await axios.post(
          'http://localhost:8080/api/posts/upload-media', 
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        
        // Don't add http://localhost:8080 here - just use the returned URL
        videoUrls.push(response.data.fileUrl);
      }
  
      // Create post with media URLs
      const requestData = {
        text: postData.text,
        username: postData.username,
        hashtags: postData.hashtags,
        imageUrls: imageUrls,
        videoUrls: videoUrls
      };
  
      console.log('Sending post data:', requestData);
  
      const response = await fetch('http://localhost:8080/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  };

  const handleConnection = async () => {
    try {
      setConnectionLoading(true);
      
      const action = connectionStatus === 'connected' ? 'disconnect' : 'connect';
      
      const response = await fetch(`http://localhost:8080/api/connections/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          fromUsername: loggedInUsername,
          toUsername: displayUsername 
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action}: ${response.status}`);
      }
      
      // After action completes, refresh connection status from server
      await fetchConnectionStatus();
      
      // Also refresh connections count
      fetchUserConnections();
      
    } catch (error) {
      console.error(`Error handling connection: ${error.message}`);
    } finally {
      setConnectionLoading(false);
    }
  };

  const fetchUserConnections = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/connections/user/${displayUsername}`);
      if (response.ok) {
        const data = await response.json();
        setConnectionsCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>Error loading profile</h2>
        <p>{error}</p>
        <p>Please try again later or contact support.</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
      
      };
      return new Date(dateString).toLocaleString(undefined, options);
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString;
    }
  };

  // Add this function to your component
  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return interval === 1 ? '1 year ago' : `${interval} years ago`;
    }
    
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return interval === 1 ? '1 month ago' : `${interval} months ago`;
    }
    
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return interval === 1 ? '1 day ago' : `${interval} days ago`;
    }
    
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return interval === 1 ? '1 hour ago' : `${interval} hours ago`;
    }
    
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return interval === 1 ? '1 minute ago' : `${interval} minutes ago`;
    }
    
    return seconds < 10 ? 'just now' : `${Math.floor(seconds)} seconds ago`;
  };

  return (
    <div style={styles.container}>
      <NavBar />
      
      {/* Add cover photo */}
      <div 
        style={{
          ...styles.coverPhoto,
          backgroundImage: `url(${userData.coverPhoto || '/assets/placeholder-cover.png'})`,
          backgroundPosition: 'center center'
        }}
      >
        {/* Remove the connection button from here */}
      </div>

      {/* Profile Header - adjusted positioning */}
      <div style={styles.profileHeader}>
        <div style={{...styles.profilePhoto, position: 'relative'}}>
          <img 
            src={userData.profilePhoto || '/assets/placeholder-profile.png'} 
            alt="Profile" 
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/placeholder-profile.png';
              console.log('Failed to load profile image:', userData.profilePhoto);
            }}
          />
        </div>
        <div style={styles.profileInfo}>
          {/* Add a nameContainer div that wraps the name and buttons */}
          <div style={styles.nameContainer}>
            <h1 style={styles.name}>{userData.firstName} {userData.lastName}</h1>
            
            {/* Only show Edit Profile button if it's the user's own profile */}
            {isOwnProfile && (
              <button 
                style={{
                  ...styles.editButton, 
                  ...(isHovered ? styles.editButtonHover : {})
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleEditProfile}
              >
                <Edit3 size={16} />
                <span>Edit Profile</span>
              </button>
            )}
            
            {/* Add connection button when viewing someone else's profile */}
            {!isOwnProfile && (
              <button 
                style={{
                  ...styles.editButton, // Reuse the editButton style instead of connectButton
                  backgroundColor: 
                    connectionStatus === 'connected' ? '#EF4444' : 
                    connectionStatus === 'pending' ? '#F59E0B' : 
                    '#1E40AF',
                  ...(isConnectButtonHovered ? styles.editButtonHover : {})
                }}
                onMouseEnter={() => setIsConnectButtonHovered(true)}
                onMouseLeave={() => setIsConnectButtonHovered(false)}
                onClick={handleConnection}
                disabled={connectionLoading}
              >
                {connectionLoading ? (
                  <div style={styles.miniSpinner}></div>
                ) : connectionStatus === null ? (
                  <>
                    <UserPlus size={16} />
                    <span>Connect</span>
                  </>
                ) : (
                  <>
                    {connectionStatus === 'connected' ? (
                      <>
                        <UserX size={16} />
                        <span>Remove Connection</span>
                      </>
                    ) : (
                      <>
                        {connectionStatus === 'pending' ? <Clock size={16} /> : <UserPlus size={16} />}
                        <span>
                          {connectionStatus === 'pending' ? 'Request Sent' : 'Connect'}
                        </span>
                      </>
                    )}
                  </>
                )}
              </button>
            )}
          </div>
          
          <p style={styles.username}>@{userData.username}</p>
          <h2 style={styles.headline}>{userData.major} Student</h2>
          <div style={styles.locationContainer}>
            <MapPin size={16} color="#4B5563" />
            <span style={styles.location}>{userData.location}</span>
          </div>
        </div>
      </div>
      
      {/* Rest of the component */}
      <div style={styles.contentGrid}>
        {/* Left Column */}
        <div style={styles.leftColumn}>
          {/* About Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>About</h3>
            <p style={styles.bio}>{userData.bio}</p>
          </div>

          {/* Academic Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Academic Information</h3>
            <div style={styles.academicInfo}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Roll Number:</span>
                <span>{userData.rollNumber}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Degree:</span>
                <span>{userData.degree}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Major:</span>
                <span>{userData.major}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Current Year:</span>
                <span>{userData.currentYear}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Semester:</span>
                <span>{userData.semester}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Admission ID:</span>
                <span>{userData.admissionId}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Date of Joining:</span>
                <span>{formatDate(userData.dateOfJoining)}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Date of Birth:</span>
                <span>{userData.dateOfBirth ? formatDate(userData.dateOfBirth) : 'Not specified'}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>CGPA:</span>
                <span>{userData.cgpa || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Experience Section */}

          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Experience</h3>
            {userData.experiences && userData.experiences.length > 0 ? (
              userData.experiences.map((experience, index) => (
                <div key={index} style={styles.experienceItem}>
                  <div style={styles.experienceIcon}>
                    <Briefcase size={20} color="#1E40AF" />
                  </div>
                  <div style={styles.experienceText}>
                    {experience}
                  </div>
                </div>
              ))
            ) : (
              <p style={styles.emptyMessage}>No experience listed</p>
            )}
          </div>

          {/* Skills Section */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Skills</h3>
            <ul style={styles.skillsList}>
              {userData.skills && userData.skills.map((skill, index) => (
                <li key={index} style={styles.skillItem}>
                  <Award size={16} color="#1E40AF" />
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Contact Information</h3>
            <div style={styles.contactItem}>
              <Mail size={16} color="#4B5563" />
              <a 
                href={`mailto:${userData.email}`} 
                style={styles.contactLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {userData.email}
              </a>
            </div>
            <div style={styles.contactItem}>
              <Phone size={16} color="#4B5563" />
              <a 
                href={`tel:${userData.phoneNumber}`} 
                style={styles.contactLink}
              >
                {userData.phoneNumber}
              </a>
            </div>
          </div>

          {/* Social Links */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Social Links</h3>
            <div style={styles.socialLinks}>
              {Array.isArray(userData.socialLinks) && userData.socialLinks.map((link, index) => (
                <a 
                  key={index} 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={styles.socialLink}
                >
                  <LinkIcon size={16} color="#1E40AF" />
                  <span>{link.platform}</span>
                </a>
              ))}
            </div>
          </div>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Achievements</h3>
            <ul style={styles.skillsList}>
              {Array.isArray(userData.academicAchievements) && userData.academicAchievements.map((achievement, index) => (
                <li key={index} style={styles.skillItem}>
                  <Award size={16} color="#1E40AF" />
                  <span>{achievement}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Interests</h3>
            <ul style={styles.skillsList}>
              {Array.isArray(userData.interests) && userData.interests.map((interest, index) => (
                <li key={index} style={styles.skillItem}>
                  <Award size={16} color="#1E40AF" />
                  <span>{interest}</span>
                </li>
              ))}
            </ul>
          </div>
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Connections</h3>
            <div 
              style={styles.connectionSummary} 
              onClick={() => navigate(`/connections/${userData.username}`)}
            >
              <Users size={20} color="#1E40AF" />
              <div style={styles.connectionCount}>
                {connectionsCount} connections
              </div>
              <div style={styles.viewAllText}>View all</div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={styles.rightColumn}>
          {/* Posts Section */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>Recent Posts</h3>
              {/* Only show Create Post button on own profile */}
              {isOwnProfile && (
                <button 
                  onClick={openPostModal}
                  style={styles.createPostButton}
                >
                  Create Post
                </button>
              )}
            </div>
            
            {posts.length === 0 ? (
              <p style={styles.emptyMessage}>No posts yet. {isOwnProfile ? 'Create your first post!' : ''}</p>
              ) : (
              posts.map((post) => (
                <div key={post.id} style={styles.post}>
                  <div style={styles.postHeader}>
                    <div style={styles.postHeaderLeft}>
                      <img 
                        src={post.author?.profilePhoto || '/assets/placeholder-profile.png'} 
                        alt={post.author?.name} 
                        style={{...styles.postAuthorImage, cursor: 'pointer'}}
                        onClick={() => navigate(`/profile/${post.author.username}`)}
                      />
                      <div>
                        <h4 
                          style={{...styles.postAuthorName, cursor: 'pointer'}}
                          onClick={() => navigate(`/profile/${post.author.username}`)}
                        >
                          {post.author?.name}
                        </h4>
                        <p style={styles.postDate}>
                          <Calendar size={14} color="#6B7280" />
                          <span>{formatDate(post.date)}</span>
                        </p>
                      </div>
                    </div>
                    
                    {/* Only show 3-dot menu if it's the user's own post */}
                    {isOwnProfile && (
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
                  
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div style={styles.hashtagContainer}>
                      {post.hashtags.map((tag, index) => (
                        <span key={index} style={styles.hashtag}>#{tag}</span>
                      ))}
                    </div>
                  )}
                  
                  {/* New Instagram-style slideshow for post media */}
                  {((post.images && post.images.length > 0) || (post.videos && post.videos.length > 0)) && (
                    <div style={styles.postMediaSlideshow}>
                      {console.log("Post images:", post.images)}
                      {/* Combine images and videos for slideshow */}
                      {[
                        ...(post.images || []).map(img => {
                          const src = getFullImageUrl(img);
                          console.log("Image transformed URL:", src);
                          return { type: 'image', src };
                        }),
                        ...(post.videos || []).map(video => ({ 
                          type: 'video', 
                          src: getFullImageUrl(video)
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
                                console.error("Failed to load image:", media.src);
                                // Try reloading the image with a new timestamp
                                const newSrc = media.src.includes('?') 
                                  ? media.src.split('?')[0] + `?reload=${Date.now()}` 
                                  : `${media.src}?reload=${Date.now()}`;
                                e.target.src = newSrc;
                                
                                // Set a fallback if it fails again
                                e.target.onerror = () => {
                                  e.target.onerror = null;
                                  e.target.src = '/assets/placeholder-profile.png';
                                };
                              }} 
                            />
                          ) : (
                            <video src={media.src} controls style={styles.postMediaVideo} />
                          )}
                        </div>
                      ))}
                      
                      {/* Navigation arrows - only if more than one media item */}
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
                      <span>{post.likes || 0} Likes</span>
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
                  
                  {/* Show comments section only if expanded for this post */}
                  {expandedComments.includes(post.id) && (
                    <div style={styles.commentsSection}>
                      {/* Updated comment section to show likes and replies */}
                      {post.comments && post.comments.length > 0 ? (
                        post.comments.map((comment) => (
                          <div key={comment.id} style={styles.comment}>
                            <img 
                              src={comment.author.profilePhoto || '/assets/placeholder-profile.png'}
                              alt={comment.author.name}
                              style={{...styles.commentAuthorImage, cursor: 'pointer'}}
                              onClick={() => navigate(`/profile/${comment.author.username}`)}
                            />
                            <div style={styles.commentContentWrapper}>
                              <div style={styles.commentContent}>
                                <h5 
                                  style={{...styles.commentAuthorName, cursor: 'pointer'}}
                                  onClick={() => navigate(`/profile/${comment.author.username}`)}
                                >
                                  {comment.author.name}
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
                                        src={reply.author.profilePhoto || '/assets/placeholder-profile.png'}
                                        alt={reply.author.name}
                                        style={{...styles.commentAuthorImage, cursor: 'pointer'}}
                                        onClick={() => navigate(`/profile/${reply.author.username}`)}
                                      />
                                      <div style={styles.replyContentWrapper}>
                                        <div style={styles.commentContent}>
                                          <h5 
                                            style={{...styles.commentAuthorName, cursor: 'pointer'}}
                                            onClick={() => navigate(`/profile/${reply.author.username}`)}
                                          >
                                            {reply.author.name}
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
                              
                              {/* Reply input - show only if replying to this comment */}
                              {replyingTo && replyingTo.commentId === comment.id && (
                                <div style={styles.replyInputContainer}>
                                  <img 
                                    src={userData.profilePhoto || '/assets/placeholder-profile.png'}
                                    alt={userData.firstName}
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
                      
                      {/* Comment input with working send button */}
                      <div style={styles.addCommentContainer}>
                        <img 
                          src={isOwnProfile 
                            ? (userData?.profilePhoto || '/assets/placeholder-profile.png')
                            : (loggedInUserData?.profilePhoto || '/assets/placeholder-profile.png')}
                          alt={loggedInUserData?.firstName || 'Profile'}
                          style={styles.commentAuthorImage}
                        />
                        <input 
                          ref={el => commentInputRefs.current[post.id] = el}
                          type="text"
                          placeholder="Write a comment..."
                          style={styles.commentInput}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleComment(post.id);
                            }
                          }}
                        />
                        <button 
                          style={styles.sendButton}
                          onClick={() => handleComment(post.id)}
                        >
                          <Send size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      {/* Add this at the end, just before the closing div */}
      {isPostModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Create Post</h3>
              <button 
                style={styles.closeButton} 
                onClick={closePostModal}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.userPostHeader}>
                <img 
                  src={userData.profilePhoto || '/assets/placeholder-profile.png'} 
                  alt={userData.firstName}
                  style={styles.postAuthorThumbnail} 
                />
                <h4>{userData.firstName} {userData.lastName}</h4>
              </div>
              
              <textarea
                style={styles.enhancedPostTextarea}
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              
              {/* Media previews */}
              {(newPostImages.length > 0 || newPostVideos.length > 0) && (
                <div style={styles.mediaPreviewContainer}>
                  {/* Image previews */}
                  {newPostImages.map((image, index) => (
                    <div key={`image-${index}`} style={styles.mediaPreview}>
                      <img src={image.preview} alt="" style={styles.previewImage} />
                      <button 
                        style={styles.removeMediaButton}
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X size={16} color="white" />
                      </button>
                    </div>
                  ))}
                  
                  {/* Video previews */}
                  {newPostVideos.map((video, index) => (
                    <div key={`video-${index}`} style={styles.mediaPreview}>
                      <video src={video.preview} style={styles.previewVideo} />
                      <button 
                        style={styles.removeMediaButton}
                        onClick={() => handleRemoveVideo(index)}
                      >
                        <X size={16} color="white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={styles.modalFooter}>
              <div style={styles.attachmentOptions}>
                <label style={styles.attachmentButton}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={styles.fileInput} 
                    onChange={handleImageUpload} 
                    multiple
                  />
                  <Image size={20} color="#4B5563" />
                  <span style={styles.attachmentLabel}>Image</span>
                </label>
                
                <label style={styles.attachmentButton}>
                  <input 
                    type="file" 
                    accept="video/*" 
                    style={styles.fileInput} 
                    onChange={handleVideoUpload} 
                    multiple
                  />
                  <Film size={20} color="#4B5563" />
                  <span style={styles.attachmentLabel}>Video</span>
                </label>
              </div>
              
              <div>
                <button 
                  style={styles.cancelButton} 
                  onClick={closePostModal}
                >
                  Cancel
                </button>
                <button 
                  style={{
                    ...styles.postButton, 
                    opacity: newPostContent.trim() ? 1 : 0.5,
                    cursor: newPostContent.trim() ? 'pointer' : 'not-allowed'
                  }} 
                  onClick={handlePostSubmit}
                  disabled={!newPostContent.trim()}
                >
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// For profile photos, cover photos, and other images
function getFullImageUrl(path) {
  console.log("Original image path:", path);
  
  if (!path) return '/assets/placeholder-profile.png';
  if (path.startsWith('http')) return `${path}?t=${Date.now()}`;
  if (path.startsWith('/')) return `http://localhost:8080${path}?t=${Date.now()}`;
  
  const result = `http://localhost:8080/${path}?t=${Date.now()}`;
  console.log("Transformed image URL:", result);
  return result;
}

// Remove the createPost function from outside the component

// Keep other utility functions like deletePostAPI, updatePostLike, etc.
const deletePostAPI = async (postId) => {
  try {
    const response = await fetch(`http://localhost:8080/api/posts/${postId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete post. Status: ${response.status}`);
    }
    
    return true; // Return success status
  } catch (error) {
    console.error('Error deleting post:', error);
    throw error;
  }
};

const updatePostLike = async (postId, isLiked) => {
  try {
    const response = await fetch(`http://localhost:8080/api/posts/${postId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        isLiked,
        username: localStorage.getItem('username') // Send username to identify who liked the post
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update like status: ${response.status}`);
    }
    
    return await response.json(); // Return updated like count if available
  } catch (error) {
    console.error('Error updating post like:', error);
    throw error;
  }
};

const addComment = async (postId, commentData) => {
  try {
    const response = await fetch(`http://localhost:8080/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(commentData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

const updateCommentLike = async (postId, commentId, isLiked) => {
  try {
    await fetch(`http://localhost:8080/api/posts/${postId}/comments/${commentId}/like`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isLiked })
    });
  } catch (error) {
    console.error('Error updating comment like:', error);
    throw error;
  }
};

const addReply = async (postId, commentId, replyData) => {
  try {
    const response = await fetch(`http://localhost:8080/api/posts/${postId}/comments/${commentId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(replyData)
    });
    return await response.json();
  } catch (error) {
    console.error('Error adding reply:', error);
    throw error;
  }
};

const handleFileUpload = (e) => {
  const files = Array.from(e.target.files);
  const newFiles = files.map(file => ({
    file,
    preview: URL.createObjectURL(file),
    type: file.type
  }));
  setNewPostFiles([...newPostFiles, ...newFiles]);
};

const handleRemoveFile = (index) => {
  const updatedFiles = [...newPostFiles];
  URL.revokeObjectURL(updatedFiles[index].preview);
  updatedFiles.splice(index, 1);
  setNewPostFiles(updatedFiles);
};

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    margin: '0 auto',
  },
  errorContainer: {
    padding: '2rem',
    textAlign: 'center',
    color: '#EF4444',
  },
  coverPhoto: {
    height: '200px',
    width: '100%',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    right: '20px',
    bottom: '20px',
    backgroundColor: '#1E40AF', 
    border: '1px solid #1E40AF',
    borderRadius: '0.375rem',
    padding: '0.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500',
    color: 'white',
    transition: 'background-color 0.3s, transform 0.3s',
    zIndex: '100000',
  },
  editButtonHover: {
    backgroundColor: '#1E40AF',
    transform: 'scale(1.05)',
  },
  profileHeader: {
    display: 'flex',
    padding: '0 2rem',
    marginTop: '-60px',
    marginBottom: '2rem',
    position: 'relative',
    zIndex: 10
  },
  profilePhoto: {
    width: '150px',
    height: '150px',
    borderRadius: '50%',
    border: '4px solid white',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 20,
    position: 'relative',
  },
  profileInfo: {
    marginLeft: '2rem',
    paddingTop: '60px',
  },
  name: {
    fontSize: '1.875rem',
    fontWeight: 'bold',
    margin: '0',
    color: '#111827',
  },
  username: {
    fontSize: '0.95rem',
    color: '#6B7280',
    margin: '0 0 0.5rem 0',
    fontWeight: '400',
  },
  headline: {
    fontSize: '1.25rem',
    fontWeight: 'normal',
    color: '#4B5563',
    margin: '0.5rem 0',
  },
  locationContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#4B5563',
  },
  location: {
    fontSize: '0.875rem',
  },
contactLink: {
  color: '#1E40AF',
  textDecoration: 'none',
  marginLeft: '0.5rem',
  transition: 'color 0.2s, text-decoration 0.2s',
  fontWeight: '500',
  fontSize: '0.95rem',
},
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr',
    gap: '1.5rem',
    padding: '0 2rem 2rem',
  },
  leftColumn: {},
  rightColumn: {},
  section: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    marginTop: '0',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #E5E7EB',
  },
  bio: {
    lineHeight: '1.6',
    color: '#4B5563',
  },
  academicInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  infoLabel: {
    fontWeight: '500',
    color: '#6B7280',
    fontSize: '0.875rem',
  },
  experienceItem: {
    display: 'flex',
    marginBottom: '1.5rem',
  },
  experienceIcon: {
    marginRight: '1rem',
    marginTop: '0.25rem',
  },
  experienceDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: '0 0 0.25rem 0',
    color: '#111827',
  },
  position: {
    fontSize: '1rem',
    color: '#4B5563',
    margin: '0 0 0.25rem 0',
  },
  dates: {
    fontSize: '0.875rem',
    color: '#6B7280',
    margin: 0,
  },
  skillsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
  },
  skillItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#F3F4F6',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.25rem',
    fontSize: '0.875rem',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
    color: '#4B5563',
  },
  socialLinks: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  socialLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    color: '#1E40AF',
    textDecoration: 'none',
    padding: '0.5rem 0',
    borderRadius: '0.25rem',
    transition: 'background-color 0.2s',
  },
  
  // Enhanced post styles
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
  postText: {
    margin: '0 0 1rem 0',
    lineHeight: '1.5',
  },
  postDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#6B7280',
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
    textDecoration: 'none',
  },
  postImagesContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  postImage: {
    width: '100%',
    borderRadius: '0.375rem',
    objectFit: 'cover',
  },
  postVideosContainer: {
    marginBottom: '1rem',
  },
  postVideo: {
    width: '100%',
    borderRadius: '0.375rem',
    marginBottom: '0.5rem',
  },
  postInteractions: {
    display: 'flex',
    borderTop: '1px solid #E5E7EB',
    borderBottom: '1px solid #E5E7EB',
    padding: '0.5rem 0',
    marginBottom: '1rem',
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
    borderRadius: '0.25rem',
    cursor: 'pointer',
    color: '#4B5563',
    fontSize: '0.875rem',
    transition: 'background-color 0.2s',
  },
  
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    width: '90%',
    maxWidth: '600px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid #E5E7EB',
  },
  modalTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    padding: '0.5rem',
    borderRadius: '50%',
    color: '#6B7280',
  },
  modalBody: {
    padding: '1rem',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  modalFooter: {
    padding: '1rem',
    borderTop: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
  },
  enhancedPostTextarea: {
    width: '100%',
    minHeight: '120px',
    padding: '1rem',
    border: 'none',
    borderRadius: '0.375rem',
    resize: 'none',
    fontSize: '1.125rem',
    marginBottom: '1rem',
    backgroundColor: 'transparent',
    outline: 'none',
    fontFamily: 'inherit',
    color: '#111827', // Added text color to ensure visibility
  },
  // Media preview styles
  mediaPreviewContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  mediaPreview: {
    position: 'relative',
    borderRadius: '0.375rem',
    overflow: 'hidden',
    aspectRatio: '1 / 1',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  previewVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  removeMediaButton: {
    position: 'absolute',
    top: '16px',
    right: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    zIndex: 10,
    transition: 'background-color 0.2s ease',
  },
  userPostHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  postAuthorThumbnail: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  enhancedPostActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #E5E7EB',
    paddingTop: '1rem',
  },
  attachmentOptions: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  attachmentButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    transition: 'background-color 0.2s',
  },
  attachmentLabel: {
    fontSize: '0.875rem',
    color: '#6B7280',
  },
  fileInput: {
    display: 'none',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.5rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  postButton: {
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.5rem 1.5rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  
  // Section header styles
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #E5E7EB',
  },
  createPostButton: {
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  
  // Comments section
  commentsSection: {
    marginTop: '1rem',
  },
  comment: {
    display: 'flex',
    marginBottom: '1rem',
  },
  commentAuthorImage: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    marginRight: '0.75rem',
    objectFit: 'cover',
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
  addCommentContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '1rem',
    position: 'relative',
  },
  commentInput: {
    flex: 1,
    border: '1px solid #E5E7EB',
    borderRadius: '1.5rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    paddingRight: '2.5rem',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#6B7280',
    padding: '1rem 0',
  },
  
  // Post header with menu
  postHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  postMenu: {
    position: 'relative',
  },
  menuTrigger: {
    position: 'relative',
    cursor: 'pointer',
    '&:hover > div': {
      display: 'block',
    },
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
    // Remove the &:hover syntax
  },
  menuItemHover: { // Add a separate hover style
    backgroundColor: '#F3F4F6',
  },
  
  // Also fix this for other hover styles:
  commentActionButton: {
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: '0.75rem',
    color: '#6B7280',
    fontWeight: '500',
    cursor: 'pointer',
    // Remove the &:hover syntax
  },
  commentActionButtonHover: { // Add a separate hover style
    color: '#1E40AF',
  },
  
  // Same for sendButton
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
    // Remove the &:hover syntax
  },
  sendButtonHover: { // Add a separate hover style
    backgroundColor: '#F3F4F6',
  },
  
  // Comment styles
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


  replyContent: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
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
  
  // Media slideshow styles
  mediaSlideshow: {
    position: 'relative',
    width: '100%',
    height: '400px',
    marginBottom: '1.5rem',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  mediaSlide: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  slideVideo: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
  // Replace the old slideNavButton with these two separate styles
  slideNavButtonLeft: {
    position: 'absolute',
    top: '50%',
    left: '16px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 5,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
    color: '#111827',
    transition: 'all 0.2s ease',
  },
  slideNavButtonRight: {
    position: 'absolute',
    top: '50%',
    right: '16px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    border: 'none',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    zIndex: 5,
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
    color: '#111827',
    transition: 'all 0.2s ease',
  },
  slideIndicators: {
    position: 'absolute',
    bottom: '20px',
    left: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'center',
    gap: '8px',
  },
  slideIndicator: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: 'none',
    padding: '0',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  
  // Add new styles for post media slideshow
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
  
  // Add these styles to the existing styles object
  replyContentWrapper: {
    flex: 1,
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

  connectButton: {
    position: 'absolute',
    right: '20px',
    bottom: '20px',
    backgroundColor: '#1E40AF',
    border: 'none',
    borderRadius: '20px',
    padding: '0.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500',
    color: 'white',
    transition: 'background-color 0.3s, transform 0.3s',
    zIndex: '100',
  },
  connectButtonHover: {
    transform: 'scale(1.05)',
  },
  miniSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },

  connectionSummary: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: '#F3F4F6',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  connectionCount: {
    flex: 1,
    fontSize: '0.95rem',
    color: '#4B5563',
  },
  viewAllText: {
    fontSize: '0.85rem',
    color: '#1E40AF',
    fontWeight: '500',
  },

  clickable: {
    cursor: 'pointer',
  },

};


export default ProfilePage;