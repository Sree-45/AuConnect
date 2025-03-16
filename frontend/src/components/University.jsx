import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Mail, Phone, Link as LinkIcon, Calendar, Clock, ChevronDown, ThumbsUp, MessageSquare, Share2, User, Send, Heart, BookOpen, Award, Edit, X, Image, Film, MoreVertical, MessageCircle } from 'lucide-react';
import axios from 'axios';
import NavBar from './NavBar';
import { useNavigate } from 'react-router-dom';

const University = () => {
  const navigate = useNavigate();
  const [loggedInUsername, setLoggedInUsername] = useState(null);
  const [loggedInUserData, setLoggedInUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [universityData, setUniversityData] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [news, setNews] = useState([]);
  const [academicCalendar, setAcademicCalendar] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [expandedComments, setExpandedComments] = useState([]);
  const [likedComments, setLikedComments] = useState([]);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [postSlides, setPostSlides] = useState({});
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImages, setNewPostImages] = useState([]);
  const [newPostVideos, setNewPostVideos] = useState([]);
  const [submittingPost, setSubmittingPost] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [menuVisible, setMenuVisible] = useState(null);
  const commentInputRefs = useRef({});
  const [calendarEventsToShow, setCalendarEventsToShow] = useState([]);
  const [showingTodayEvents, setShowingTodayEvents] = useState(false);


  useEffect(() => {
    const fetchUniversityData = async () => {
      try {
        const profileResponse = await fetch(`http://localhost:8080/profile?username=anurag_university`);
        if (!profileResponse.ok) {
          throw new Error('Failed to fetch university profile');
        }
        const profileData = await profileResponse.json();
        const formattedProfilePhoto = formatImageUrl(profileData.profilePhoto);
        const formattedCoverPhoto = formatImageUrl(profileData.coverPhoto);
        let contactData = {};
        
        try {
          const contactResponse = await fetch(`http://localhost:8080/university/contact?username=anurag_university`);
          if (contactResponse.ok) {
            contactData = await contactResponse.json();
          }
        } catch (contactError) {
          console.error("Error fetching contact data:", contactError);
        }
        
        setUniversityData({
          name: `${profileData.firstName} ${profileData.lastName}`,
          location: profileData.location || 'Hyderabad, Telangana',
          profilePhoto: formattedProfilePhoto || '/au_logo.jpg',
          coverPhoto: formattedCoverPhoto || '/au_cover.jpg',
          email: contactData.email || profileData.email || 'admissionsic@anurag.edu.in',
          phone: contactData.phone || profileData.phoneNumber || '+91-8181057057',
          website: contactData.website || 'www.anurag.edu.in',
          fullAddress: contactData.fullAddress || 'Venkatapur, Ghatkesar, Medchal–Malkajgiri district, Hyderabad, Telangana, India. 500 088',
          directionsUrl: contactData.directionsUrl || 'https://maps.google.com/?q=Anurag+University+Hyderabad+Telangana',
        });

        try {
          const eventsResponse = await axios.get('http://localhost:8080/api/events');
          if (eventsResponse.status === 200) {
            // Map the API response to match the expected format
            const formattedEvents = eventsResponse.data.map(event => ({
              id: event.id,
              name: event.name,
              date: event.date,
              time: event.time,
              location: event.location,
              category: event.category,
              description: event.description,
              registration: event.registrationUrl
            }));

            // Sort by date (recent events first)
            formattedEvents.sort((a, b) => {
              const dateA = new Date(a.date);
              const dateB = new Date(b.date);
              return dateB - dateA; // For descending order (most recent first)
            });

            // Take the top 3 events
            setEvents(formattedEvents.slice(0, 3));
          }
        } catch (eventsError) {
          console.error("Error fetching events:", eventsError);
          setEvents([]); // Set empty array if API fails
        }

        // Fetch news from the backend API
        try {
          const newsResponse = await axios.get('http://localhost:8080/api/news?limit=5');
          if (newsResponse.status === 200) {
            // Transform API data to match our expected format
            const formattedNews = newsResponse.data.map(item => ({
              id: item.id,
              title: item.title,
              date: item.date || new Date().toISOString(),
              summary: item.summary,
              image: item.imageUrl || item.image,
              link: `/news/${item.id}`
            }));
            
            // Sort news by date (newest first)
            formattedNews.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            setNews(formattedNews);
          }
        } catch (newsError) {
          console.error("Error fetching news:", newsError);
          // Keep default news if API fails
        }

        

        try {
          const facultyResponse = await axios.get('http://localhost:8080/api/faculty?limit=5');
          if (facultyResponse.data) {
            const formattedFaculty = facultyResponse.data.map(member => ({
              id: member.id,
              name: member.name,
              title: member.title,
              department: member.department,
              specialization: member.specialization,
              email: member.email,
              profilePhoto: member.profilePhoto && member.profilePhoto.startsWith('http') 
                ? member.profilePhoto 
                : member.profilePhoto 
                  ? `http://localhost:8080${member.profilePhoto}` 
                  : '/assets/placeholder-profile.png'
            }));
            setFaculty(formattedFaculty);
          }
        } catch (facultyError) {
          console.error("Error fetching faculty data:", facultyError);
          // Fallback to empty array if API fails
          setFaculty([]);
        }

        // Add this code to fetch university posts
        try {
          const postsResponse = await fetch(`http://localhost:8080/api/posts?username=anurag_university`);
          if (postsResponse.ok) {
            const postsData = await postsResponse.json();

            // Format posts with proper structure for PostCard component
            const formattedPosts = postsData.map(post => ({
              id: post.id,
              text: post.text,
              date: post.createdDate,
              likes: post.likeCount || 0,
              hashtags: post.hashtags?.map(tag => tag.name) || [],
              images: post.imageUrls || [],
              videos: post.videoUrls || [],
              comments: post.comments || [],
              author: {
                username: post.username,
                name: post.authorName || 'Anurag University',
                profilePhoto: post.authorProfilePhoto || universityData?.profilePhoto || '/au_logo.jpg'
              }
            }));

            setPosts(formattedPosts);

            // Set liked posts if user is logged in
            if (loggedInUsername) {
              try {
                const likedPostsResponse = await fetch(`http://localhost:8080/api/posts/user-likes?username=${loggedInUsername}`);
                if (likedPostsResponse.ok) {
                  const likedPostIds = await likedPostsResponse.json();
                  setLikedPosts(likedPostIds);
                }
              } catch (error) {
                console.error('Error fetching liked posts:', error);
              }
            }
          }
        } catch (postsError) {
          console.error("Error fetching university posts:", postsError);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching university data:', error);
        setError('Failed to load university information. Please try again later.');
        setLoading(false);
      }
    };

    fetchUniversityData();
  }, [loggedInUsername]);

  // Helper function to format image URLs (similar to the one in EditPage)
  const formatImageUrl = (url) => {
    if (!url) return '';

    url = url.trim();

    if (url.includes(' ')) {
      const baseUrlPart = url.substring(0, url.lastIndexOf('/') + 1);
      const filenamePart = url.substring(url.lastIndexOf('/') + 1);
      // Encode just the filename part
      const encodedFilename = encodeURIComponent(filenamePart);
      url = baseUrlPart + encodedFilename;
    }

    // If it's already a complete URL, return as is
    if (url.startsWith('http')) return url;

    // If it's an absolute path starting with /, add the base URL
    if (url.startsWith('/')) return `http://localhost:8080${url}`;

    // Otherwise, add the base URL with a separator /
    return `http://localhost:8080/${url}`;
  };

  useEffect(() => {
    const username = localStorage.getItem('username');
    setLoggedInUsername(username);
  }, []);

  useEffect(() => {
    const fetchLoggedInUserData = async () => {
      if (loggedInUsername) {
        try {
          const response = await fetch(`http://localhost:8080/profile?username=${loggedInUsername}`);
          if (response.ok) {
            const data = await response.json();
            setLoggedInUserData(data);
          }
        } catch (error) {
          console.error('Error fetching logged-in user data:', error);
        }
      }
    };

    fetchLoggedInUserData();
  }, [loggedInUsername]);

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


const isDateInRange = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  
  try {
    if (dateString.includes("to")) {
      const [startStr, endStr] = dateString.split("to").map(d => d.trim());
      const startDate = new Date(startStr);
      const endDate = new Date(endStr);
      
      return today >= startDate && today <= endDate;
    } else {
      const eventDate = new Date(dateString);
      
      return (
        eventDate.getDate() === today.getDate() &&
        eventDate.getMonth() === today.getMonth() &&
        eventDate.getFullYear() === today.getFullYear()
      );
    }
  } catch (error) {
    console.error("Error parsing date:", error);
    return false;
  }
};

const sortEventsByDate = (events) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return [...events].sort((a, b) => {
    const dateA = a.date.includes("to") ? new Date(a.date.split("to")[0].trim()) : new Date(a.date);
    const dateB = b.date.includes("to") ? new Date(b.date.split("to")[0].trim()) : new Date(b.date);
    
    if (dateA < today && dateB < today) {
      return dateB - dateA;
    }
    else if (dateA > today && dateB > today) {
      return dateA - dateB;
    }
    else if (dateA.getTime() === today.getTime()) {
      return -1;
    } else if (dateB.getTime() === today.getTime()) {
      return 1;
    } else {
      return dateA > today ? -1 : 1;
    }
  });
};

  const handleLike = async (postId) => {
    const isAlreadyLiked = likedPosts.includes(postId);
    const newIsLiked = !isAlreadyLiked;

    try {
      if (newIsLiked) {
        setLikedPosts([...likedPosts, postId]);
      } else {
        setLikedPosts(likedPosts.filter(id => id !== postId));
      }

      setPosts(prevPosts =>
        prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes: newIsLiked ? (p.likes + 1) : Math.max(0, p.likes - 1)
            };
          }
          return p;
        })
      );
      
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

      const data = await response.json();
      if (data.likeCount !== undefined) {
        setPosts(prevPosts =>
          prevPosts.map(p => {
            if (p.id === postId) {
              return {
                ...p,
                likes: data.likeCount
              };
            }
            return p;
          })
        );
      }
    } catch (error) {
      console.error('Error updating like:', error);
      
      if (isAlreadyLiked) {
        setLikedPosts([...likedPosts, postId]);
      } else {
        setLikedPosts(likedPosts.filter(id => id !== postId));
      }
      
      setPosts(prevPosts => 
        prevPosts.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              likes: isAlreadyLiked ? (p.likes + 1) : Math.max(0, p.likes - 1)
            };
          }
          return p;
        })
      );
      
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

  const handleComment = async (postId) => {
    const commentInput = commentInputRefs.current[postId];
    if (!commentInput || !commentInput.value.trim()) return;

    try {
      const response = await fetch(`http://localhost:8080/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: commentInput.value,
          username: loggedInUsername
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.status}`);
      }

      const savedComment = await response.json();

      // Update UI with the new comment
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const newComment = {
            id: savedComment.id,
            text: savedComment.text,
            author: {
              username: loggedInUsername,
              name: 'You',
              profilePhoto: loggedInUserData?.profilePhoto || '/assets/placeholder-profile.png'
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
      commentInput.value = '';
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };


  // Helper function to fetch logged-in user's photo
  const fetchLoggedInUserPhoto = async () => {
    try {
      const response = await fetch(`http://localhost:8080/profile?username=${loggedInUsername}`);
      if (response.ok) {
        const data = await response.json();
        return data.profilePhoto || '/assets/placeholder-profile.png';
      }
      return '/assets/placeholder-profile.png';
    } catch (error) {
      console.error('Error fetching user photo:', error);
      return '/assets/placeholder-profile.png';
    }
  };

  const toggleComments = (postId) => {
    if (expandedComments.includes(postId)) {
      setExpandedComments(expandedComments.filter(id => id !== postId));
    } else {
      setExpandedComments([...expandedComments, postId]);
    }
  };

  const handleLikeComment = async (commentId) => {
    const isLiked = likedComments.includes(commentId);

    try {
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

      setPosts(posts.map(post => {
        const updatedComments = post.comments.map(comment => {
          if (comment.id === commentId) {
            return { ...comment, likes: data.likeCount };
          }

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

      if (isLiked) {
        setLikedComments(likedComments.filter(id => id !== commentId));
      } else {
        setLikedComments([...likedComments, commentId]);
      }
    } catch (error) {
      console.error('Error updating comment like:', error);
    }
  };

  const handleReply = (postId, commentId, replyToUsername) => {
    setReplyingTo({ postId, commentId, username: replyToUsername });
    setReplyText(`@${replyToUsername} `);
  };

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
      const loggedInUserPhoto = await fetchLoggedInUserPhoto();

      // Update UI with the new reply
      setPosts(posts.map(post => {
        if (post.id === postId) {
          const updatedComments = post.comments.map(comment => {
            if (comment.id === commentId) {
              const newReply = {
                id: savedReply.id,
                text: savedReply.text,
                date: savedReply.createdDate,
                likes: 0,
                author: {
                  username: loggedInUsername,
                  name: 'You',
                  profilePhoto: loggedInUserPhoto || '/assets/placeholder-profile.png'
                }
              };
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

      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const handleShare = (post) => {
    if (navigator.share) {
      navigator.share({
        title: `University Post by ${post.author.name}`,
        text: post.text,
        url: window.location.href
      }).catch(err => console.error('Error sharing: ', err));
    } else {
      alert('Share this post: ' + window.location.href);
    }
  };

  const handleEditProfile = () => {
    navigate('/edit'); // Navigate to the edit page
  };

  const handleDeletePost = async (postId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/posts/${postId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete post. Status: ${response.status}`);
      }

      // If deletion was successful, update the UI
      setPosts(posts.filter(post => post.id !== postId));

    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    }
  };

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

  useEffect(() => {
    if (academicCalendar.length > 0) {
      const todaysEvents = academicCalendar.filter(event => isDateInRange(event.date));
      
      if (todaysEvents.length > 0) {
        setCalendarEventsToShow(todaysEvents.slice(0, 3));
        setShowingTodayEvents(true);
      } else {
        const sortedEvents = sortEventsByDate(academicCalendar);
        setCalendarEventsToShow(sortedEvents.slice(0, 3));
        setShowingTodayEvents(false);
      }
    }
  }, [academicCalendar]);

  useEffect(() => {
    const fetchCalendarEvents = async () => {
      try {
        // Use the same API endpoint as in the AcademicCalendar component
        const response = await axios.get('http://localhost:8080/api/calendar');
        if (response.status === 200) {
          setAcademicCalendar(response.data);
        }
      } catch (error) {
        console.error("Error fetching academic calendar:", error);
      }
    };

    fetchCalendarEvents();
  }, []); // Empty dependency array means this runs once on component mount

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p>Loading university information...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }
  // Add these functions before the return statement

  const openPostModal = () => {
    setIsPostModalOpen(true);
  };

  const closePostModal = () => {
    setIsPostModalOpen(false);
    setNewPostContent('');
    setNewPostImages([]);
    setNewPostVideos([]);
    setCurrentSlide(0);
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setNewPostImages([...newPostImages, ...newImages]);
    setCurrentSlide(0);
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newVideos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setNewPostVideos([...newPostVideos, ...newVideos]);
    setCurrentSlide(0);
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

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setSubmittingPost(true);

    // Extract hashtags
    const hashtags = [];
    const hashtagRegex = /#(\w+)/g;
    let match;

    while ((match = hashtagRegex.exec(newPostContent)) !== null) {
      hashtags.push(match[1]);
    }

    try {
      // Prepare post data
      const postData = {
        text: newPostContent,
        hashtags,
        username: 'anurag_university',
      };

      // Upload images if any
      if (newPostImages.length > 0) {
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

          imageUrls.push(response.data.fileUrl);
        }
        postData.imageUrls = imageUrls;
      }

      // Upload videos if any
      if (newPostVideos.length > 0) {
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

          videoUrls.push(response.data.fileUrl);
        }
        postData.videoUrls = videoUrls;
      }

      // Create the post
      const response = await axios.post('http://localhost:8080/api/posts', postData);

      // Fix the post data before adding to state
      const newPost = {
        ...response.data,
        date: response.data.createdDate || new Date().toISOString(),
        author: {
          username: 'anurag_university',
          name: universityData?.name || 'Anurag University',
          profilePhoto: universityData?.profilePhoto || '/au_logo.jpg'
        },
        images: response.data.imageUrls || [],
        videos: response.data.videoUrls || [],
        hashtags: response.data.hashtags?.map(tag =>
          typeof tag === 'object' ? tag.name : tag
        ) || []
      };

      // Add the formatted post to the posts array
      setPosts(prevPosts => [newPost, ...prevPosts]);

      // Close the modal and reset state
      closePostModal();

    } catch (error) {
      console.error('Error creating post:', error);
      alert(`Failed to create post: ${error.message}`);
    } finally {
      setSubmittingPost(false);
    }
  };

  const navigateToProfile = (username) => {
    if (username === 'anurag_university') {
      navigate('/university');
    } else {
      navigate(`/profile/${username}`);
    }
  };

  return (
    <div style={styles.container}>
      <NavBar />

      <div
        style={{
          ...styles.coverPhoto,
          backgroundImage: `url(${universityData?.coverPhoto})`,
          backgroundPosition: 'center center'
        }}
      />

      <div style={styles.profileHeader}>
        <div style={styles.profilePhoto}>
          <img
            src={universityData?.profilePhoto}
            alt="University Logo"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              borderRadius: '50%'
            }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/assets/placeholder-profile.png';
            }}
          />
        </div>
        <div style={styles.profileInfo}>
          <div style={styles.profileInfoHeader}>
            <div>
              <h1 style={styles.name}>{universityData?.name}</h1>
              <p style={styles.username}>@anurag_university</p>
              <div style={{
                ...styles.locationContainer,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <MapPin size={16} color="#4B5563" style={{ flexShrink: 0 }} />
                <span style={styles.location}>{universityData?.location}</span>
              </div>

            </div>
            {loggedInUsername === 'anurag_university' && (
              <button onClick={handleEditProfile} style={styles.editProfileButton}>
                <Edit size={16} />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ ...styles.contentGrid, gridTemplateColumns: '1.2fr 2.5fr 1.3fr' }}>
        <div style={styles.leftColumn}>
          {/* News & Announcements Section */}
          <div style={styles.section}>
            <h3 style={{
              ...styles.sectionTitle,
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '1rem'
            }}>News & Announcements</h3>
            
            {news.length > 0 ? (
              news.map((item) => (
                <div key={item.id} style={styles.newsItem}>
                  <h4 style={styles.newsTitle}>{item.title}</h4>
                  <p style={styles.newsDate}>{formatDate(item.date)}</p>
                  <p style={styles.newsSummary}>{item.summary}</p>
                  <a 
                    href="#" 
                    style={styles.newsLink}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/news/${item.id}`);
                    }}
                  >
                    Read more
                  </a>
                </div>
              ))
            ) : (
              <p style={styles.emptyMessage}>No news available at this time.</p>
            )}
            
            <div style={styles.viewMoreContainer}>
              <a 
                href="#" 
                style={styles.viewMoreLink}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/news');
                }}
              >
                View all news & Announcements →
              </a>
            </div>
          </div>

          {/* Academic Calendar Section */}
          <div style={styles.section}>
            <h3 style={{
              ...styles.sectionTitle,
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '1rem'
            }}>Academic Calendar</h3>
            
            <p style={{
              fontSize: '0.9rem',
              color: '#4B5563',
              margin: '0 0 0.75rem 0',
              fontStyle: 'italic'
            }}>
              {showingTodayEvents ? "Today's events:" : "Upcoming/recent events:"}
            </p>
            
            <div style={styles.calendar}>
              {calendarEventsToShow.length > 0 ? (
                calendarEventsToShow.map((item, index) => (
                  <div key={index} style={styles.calendarItem}>
                    <div style={styles.calendarEvent}>{item.event}</div>
                    <div style={styles.calendarDate}>{item.date}</div>
                  </div>
                ))
              ) : (
                <p style={styles.emptyMessage}>No calendar events found.</p>
              )}
            </div>
            
            <div style={styles.viewMoreContainer}>
              <a 
                href="#" 
                style={styles.viewMoreLink}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/academic-calendar');
                }}
              >
                View full academic calendar →
              </a>
            </div>
          </div>


          <div style={styles.section}>
            <h3 style={{
              ...styles.sectionTitle,
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '1rem'
            }}>Contact Information</h3>
            <div style={{
              ...styles.contactItem,
              alignItems: 'flex-start',
            }}>
              <MapPin size={16} color="#4B5563" style={{ marginTop: '4px', flexShrink: 0 }} />
              <p style={{ margin: '0' }}>{universityData?.fullAddress}</p>
            </div>

            <div style={styles.contactItem}>
              <Mail size={16} color="#4B5563" />
              <a
                href={`mailto:${universityData?.email}`}
                style={styles.contactLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {universityData?.email}
              </a>
            </div>
            <div style={styles.contactItem}>
              <Phone size={16} color="#4B5563" />
              <a
                href={`tel:${universityData?.phone}`}
                style={styles.contactLink}
              >
                {universityData?.phone}
              </a>
            </div>
            <div style={styles.contactItem}>
              <LinkIcon size={16} color="#4B5563" />
              <a
                href={universityData?.website.startsWith('http') ? universityData?.website : `https://${universityData?.website}`}
                style={styles.contactLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {universityData?.website}
              </a>
            </div>
            <div style={styles.directionsLinkContainer}>
              <a href={universityData?.directionsUrl} target="_blank" rel="noopener noreferrer" style={styles.directionsLink}>
                <MapPin size={14} color="#1E40AF" style={{ flexShrink: 0 }} />
                <span>Directions to University →</span>
              </a>
            </div>

          </div>
        </div>

        {/* Middle Column - Posts */}
        <div style={styles.middleColumn}>
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <h3 style={styles.sectionTitle}>University Posts</h3>
              {loggedInUsername === 'anurag_university' && (
                <button
                  onClick={openPostModal}
                  style={{
                    ...styles.createPostButton,
                    marginTop: 0
                  }}
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
                        style={{ ...styles.postAuthorImage, cursor: 'pointer' }}
                        onClick={() => navigateToProfile(post.author.username)}
                      />
                      <div>
                        <h4
                          style={{ ...styles.postAuthorName, cursor: 'pointer' }}
                          onClick={() => navigateToProfile(post.author.username)}
                        >
                          {post.author?.name}
                        </h4>
                        <p style={styles.postDate}>
                          <Calendar size={14} color="#6B7280" />
                          <span>{formatDate(post.date)}</span>
                        </p>
                      </div>
                    </div>

                    {/* Show 3-dot menu for university's own posts */}
                    {post.author.username === 'anurag_university' && loggedInUsername === 'anurag_university' && (
                      <div
                        style={styles.menuTrigger}
                        onClick={() => setMenuVisible(menuVisible === post.id ? null : post.id)}
                      >
                        <MoreVertical size={18} color="#6B7280" />
                        <div style={{
                          ...styles.menuDropdown,
                          display: menuVisible === post.id ? 'block' : 'none'
                        }}>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            style={{
                              ...styles.menuItem,
                              color: '#EF4444'
                            }}        >
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
                                const newSrc = media.src.includes('?')
                                  ? media.src.split('?')[0] + `?reload=${Date.now()}`
                                  : `${media.src}?reload=${Date.now()}`;
                                e.target.src = newSrc;

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
                            &lt;
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
                            &gt;
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
                              style={{ ...styles.commentAuthorImage, cursor: 'pointer' }}
                              onClick={() => navigateToProfile(comment.author.username)}
                            />
                            <div style={styles.commentContentWrapper}>
                              <div style={styles.commentContent}>
                                <h5
                                  style={{ ...styles.commentAuthorName, cursor: 'pointer' }}
                                  onClick={() => navigateToProfile(comment.author.username)}
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
                                        style={{ ...styles.commentAuthorImage, cursor: 'pointer' }}
                                        onClick={() => navigateToProfile(reply.author.username)}
                                      />
                                      <div style={styles.replyContentWrapper}>
                                        <div style={styles.commentContent}>
                                          <h5
                                            style={{ ...styles.commentAuthorName, cursor: 'pointer' }}
                                            onClick={() => navigateToProfile(reply.author.username)}
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
                                    src={loggedInUserData?.profilePhoto || '/assets/placeholder-profile.png'}
                                    alt={loggedInUserData?.firstName || 'User'}
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
                          src={loggedInUserData?.profilePhoto || '/assets/placeholder-profile.png'}
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

        {/* Right Column - Events section */}
        <div style={styles.rightColumn}>
          <div style={{ ...styles.section, padding: '1rem' }}>
            <h3 style={{
              ...styles.sectionTitle,
              fontSize: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '1rem'
            }}>Upcoming Events</h3>
  
            {events.length === 0 ? (
              <p style={styles.emptyMessage}>No upcoming events at this time.</p>
            ) : (
              events.map((event, index) => (
                <div key={index} style={{ ...styles.eventCard, padding: '0.75rem', marginBottom: '0.75rem' }}>
                  <div style={{ ...styles.eventCategory, fontSize: '0.75rem' }}>{event.category}</div>
                  <h4 style={{ ...styles.eventTitle, fontSize: '1rem', marginBottom: '0.5rem' }}>{event.name}</h4>
                  <div style={{ ...styles.eventDetails, gap: '0.3rem' }}>
                    <div style={styles.eventDetail}>
                      <Calendar size={12} color="#4B5563" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric'
                      })}</span>
                    </div>
                    <div style={styles.eventDetail}>
                      <Clock size={12} color="#4B5563" />
                      <span>{event.time}</span>
                    </div>
                    <div style={styles.eventDetail}>
                      <MapPin size={12} color="#4B5563" />
                      <span>{event.location}</span>
                    </div>
                  </div>

                  <div style={{ ...styles.eventActions, gap: '0.3rem', marginTop: '0.3rem' }}>
                    <a
                      href={event.registration || "#"}
                      style={{
                        ...styles.eventActionBtn,
                        textDecoration: 'none',
                        display: 'inline-block',
                        padding: '0.3rem 0.75rem',
                        fontSize: '0.75rem'
                      }}
                    >
                      Register
                    </a>
                  </div>
                </div>
              ))
            )}
<div style={styles.viewMoreContainer}>
  <a 
    href="#" 
    style={styles.viewMoreLink}
    onClick={(e) => {
      e.preventDefault();
      navigate('/events');
    }}
  >
    View all events →
  </a>
</div>
          </div>

          <div style={{ ...styles.section, padding: '1rem' }}>
            <h3 style={{
              ...styles.sectionTitle,
              fontSize: '1rem',
              paddingBottom: '0.5rem',
              borderBottom: '1px solid #E5E7EB',
              marginBottom: '1rem'
            }}>Faculty Directory</h3>
            {faculty.map((member) => (
              <div key={member.id} style={{ ...styles.facultyCard, marginBottom: '0.75rem' }}>
                <div style={styles.facultyAvatar}>
                  <img
                    src={member.profilePhoto}
                    alt={member.name}
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/assets/placeholder-profile.png';
                    }}
                  />
                </div>
                <div style={styles.facultyInfo}>
                  <h4 style={{ ...styles.facultyName, fontSize: '0.95rem' }}>{member.name}</h4>
                  <p style={{ ...styles.facultyTitle, fontSize: '0.8rem' }}>{member.title} - {member.department}</p>
                  <p style={{ ...styles.facultySpecialization, fontSize: '0.8rem' }}>
                    <Award size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {member.specialization}
                  </p>
                  <a href={`mailto:${member.email}`} style={{ ...styles.facultyEmail, fontSize: '0.8rem' }}>
                    <Mail size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                    {member.email}
                  </a>
                </div>
              </div>
            ))}
            <div style={styles.viewMoreContainer}>
              <a 
                href="#" 
                style={styles.viewMoreLink}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/faculty-directory');
                }}
              >
                View all faculty members →
              </a>
            </div>
          </div>
        </div>
      </div>
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
                  src={universityData?.profilePhoto || '/assets/placeholder-profile.png'}
                  alt={universityData?.name}
                  style={styles.postAuthorThumbnail}
                />
                <h4>{universityData?.name}</h4>
              </div>

              <textarea
                style={styles.enhancedPostTextarea}
                placeholder="What would you like to share?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />

              {(newPostImages.length > 0 || newPostVideos.length > 0) && (
                <div style={styles.mediaSlideshow}>
                  {newPostImages.map((image, index) => (
                    <div
                      key={`image-${index}`}
                      style={{
                        ...styles.mediaSlide,
                        display: currentSlide === index ? 'block' : 'none'
                      }}
                    >
                      <img src={image.preview} alt="" style={styles.slideImage} />
                      <button
                        style={styles.removeMediaButton}
                        onClick={() => handleRemoveImage(index)}
                      >
                        <X size={16} color="white" />
                      </button>
                    </div>
                  ))}

                  {newPostVideos.map((video, index) => (
                    <div
                      key={`video-${index}`}
                      style={{
                        ...styles.mediaSlide,
                        display: currentSlide === newPostImages.length + index ? 'block' : 'none'
                      }}
                    >
                      <video src={video.preview} style={styles.slideVideo} controls />
                      <button
                        style={styles.removeMediaButton}
                        onClick={() => handleRemoveVideo(index)}
                      >
                        <X size={16} color="white" />
                      </button>
                    </div>
                  ))}

                  {(newPostImages.length + newPostVideos.length) > 1 && (
                    <>
                      <button
                        style={styles.slideNavButtonLeft}
                        onClick={() => setCurrentSlide(prev =>
                          prev > 0 ? prev - 1 : 0
                        )}
                      >
                        &lt;
                      </button>
                      <button
                        style={styles.slideNavButtonRight}
                        onClick={() => setCurrentSlide(prev =>
                          prev < (newPostImages.length + newPostVideos.length - 1) ? prev + 1 : prev
                        )}
                      >
                        &gt;
                      </button>

                      <div style={styles.slideIndicators}>
                        {[...Array(newPostImages.length + newPostVideos.length)].map((_, idx) => (
                          <button
                            key={idx}
                            style={{
                              ...styles.slideIndicator,
                              backgroundColor: currentSlide === idx ? '#1E40AF' : '#D1D5DB'
                            }}
                            onClick={() => setCurrentSlide(idx)}
                            aria-label={`Go to slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
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
                  disabled={!newPostContent.trim() || submittingPost}
                >
                  {submittingPost ? (
                    <div style={styles.spinner}></div>
                  ) : (
                    'Post'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    width: '100vw',
    height: '100vh',
    margin: '0 auto',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid rgba(0, 0, 0, 0.1)',
    borderTop: '4px solid #1E40AF',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
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
    backgroundColor: 'white',
  },
  profileInfo: {
    marginLeft: '2rem',
    paddingTop: '60px',
    width: '90%',
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
    color: '#4B5563',
  },
  contactLink: {
    color: '#1E40AF',
    textDecoration: 'none',
    transition: 'color 0.2s',
    fontWeight: '500',
  },
  directionsLinkContainer: {
    marginTop: '1rem',
    display: 'flex',
    justifyContent: 'center',
  },
  directionsLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#1E40AF',
    textDecoration: 'none',
    fontWeight: '500',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.375rem',
    transition: 'background-color 0.2s',
    backgroundColor: '#EEF2FF',
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
  // Add to your styles object
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
  userPostHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    marginBottom: '1rem',
  },

  postAuthorThumbnail: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
  },

  enhancedPostTextarea: {
    width: '100%',
    minHeight: '120px',
    padding: '1rem',
    borderRadius: '0.5rem',
    border: '1px solid #E5E7EB',
    resize: 'vertical',
    fontSize: '1rem',
    fontFamily: 'inherit',
    marginBottom: '1rem',
    boxSizing: 'border-box',
    backgroundColor: 'white',   // Add this to set white background
    color: '#111827',
  },

  cancelButton: {
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.5rem 1rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    marginRight: '0.5rem',
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
    justifyContent: 'space-between',
    gap: '0.75rem',
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
  postDate: {
    fontSize: '0.7rem',
    color: '#6B7280',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
 
  slideNavButtonLeft: {
    position: 'absolute',
    top: '50%',
    left: '16px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: 'none',
    borderRadius: '4px',
    width: '24px',
    height: '40px', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', 
    cursor: 'pointer',
    zIndex: 5,
    color: 'white',
    fontSize: '16px', 
    fontWeight: 'bold',
    padding: '0',
    lineHeight: 1, 
  },
  slideNavButtonRight: {
    position: 'absolute',
    top: '50%',
    right: '16px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: 'none',
    borderRadius: '4px',
    width: '24px', 
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', 
    cursor: 'pointer',
    zIndex: 5,
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '0', 
    lineHeight: 1,
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
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
    position: 'absolute',
    right: '8px',
  },
  replyInputContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginLeft: '1.5rem',
    marginTop: '0.5rem',
    position: 'relative',
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
    background: 'none',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#4B5563',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #E5E7EB',
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
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 3fr',
    gap: '1.5rem',
    padding: '0 2rem 2rem',
  },
  leftColumn: {},
  middleColumn: {},
  rightColumn: {},
  section: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    padding: '1.5rem',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  editProfileButton: {
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.375rem',
    padding: '0.5rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    marginTop: '0.5rem',
  },
  profileInfoHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#111827',
    marginTop: '0',
  },
  eventCard: {
    padding: '1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    borderLeft: '4px solid #1E40AF',
  },
  eventTitle: {
    margin: '0 0 0.75rem 0',
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
  },
  eventDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  eventDetail: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.875rem',
    color: '#4B5563',
  },
  emptyMessage: {
    textAlign: 'center',
    color: '#6B7280',
    padding: '1rem 0',
  },
  newsItem: {
    marginBottom: '1rem',
  },
  newsTitle: {
    fontSize: '1.125rem',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 0.5rem 0',
  },
  newsDate: {
    fontSize: '0.875rem',
    color: '#6B7280',
    margin: '0 0 0.5rem 0',
  },
  newsSummary: {
    fontSize: '0.875rem',
    color: '#4B5563',
    margin: '0 0 0.5rem 0',
  },
  newsLink: {
    fontSize: '0.875rem',
    color: '#1E40AF',
    textDecoration: 'none',
  },
  calendar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '1rem',
  },
  calendarItem: {
    backgroundColor: '#F9FAFB',
    padding: '1rem',
    borderRadius: '0.5rem',
    textAlign: 'center',
  },
  calendarEvent: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.5rem',
  },
  calendarDate: {
    fontSize: '0.875rem',
    color: '#6B7280',
  },
  eventCategory: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginBottom: '0.5rem',
  },
  eventActions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '0.5rem',
  },
  eventActionBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
  },
  facultyCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
  },
  facultyAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#E5E7EB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  facultyInfo: {
    flex: 1,
  },

  facultyName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.25rem',
  },
  facultyTitle: {
    fontSize: '0.875rem',
    color: '#6B7280',
    marginBottom: '0.25rem',
  },
  facultySpecialization: {
    fontSize: '0.875rem',
    color: '#4B5563',
    marginBottom: '0.25rem',
  },
  facultyEmail: {
    fontSize: '0.875rem',
    color: '#1E40AF',
    textDecoration: 'none',
  },
  viewMoreContainer: {
    textAlign: 'center',
    marginTop: '1rem',
  },
  viewMoreLink: {
    fontSize: '0.875rem',
    color: '#1E40AF',
    textDecoration: 'none',
  },
  researchCard: {
    padding: '1rem',
    backgroundColor: '#F9FAFB',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
  },
  researchTitle: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#111827',
    marginBottom: '0.5rem',
  },
  researchDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.875rem',
    color: '#4B5563',
    marginBottom: '0.25rem',
  },
  researchLabel: {
    fontWeight: '500',
  },
  filterDropdown: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 1rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    borderRadius: '0.25rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    width: '150px',
  },
  dropdownMenu: {
    position: 'absolute',
    marginTop: '0.25rem',
    backgroundColor: 'white',
    borderRadius: '0.25rem',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    zIndex: 100,
    width: '150px',
  },
  dropdownItem: {
    padding: '0.5rem 1rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#4B5563',
    ':hover': {
      backgroundColor: '#F3F4F6',
    }
  },
  eventFilterContainer: {
    position: 'relative',
    marginBottom: '1rem',
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
    justifyContent: 'space-between',
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

  // Media slideshow styles
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

  // Updated comment styling
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
  commentActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.25rem',
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
  commentLikes: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.75rem',
    color: '#1E40AF',
  },
  postHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
  },

  // Comment container styles
  commentContentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  // Reply styles
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
  replyInput: {
    flex: 1,
    border: '1px solid #E5E7EB',
    borderRadius: '1.5rem',
    padding: '0.35rem 0.75rem',
    fontSize: '0.75rem',
  },

  postSlideNavButtonLeft: {
    position: 'absolute',
    top: '50%',
    left: '16px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: 'none',
    borderRadius: '4px',
    width: '24px', 
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', 
    cursor: 'pointer',
    zIndex: 5,
    color: 'white',
    fontSize: '16px', 
    fontWeight: 'bold',
    padding: '0', 
    lineHeight: 1,
  },
  postSlideNavButtonRight: {
    position: 'absolute',
    top: '50%',
    right: '16px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    border: 'none',
    borderRadius: '4px',
    width: '24px', 
    height: '40px', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center', 
    cursor: 'pointer',
    zIndex: 5,
    color: 'white',
    fontSize: '16px', 
    fontWeight: 'bold',
    padding: '0', 
    lineHeight: 1,
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
};

function getFullImageUrl(path) {
  if (!path) return '/assets/placeholder-profile.png';
  if (path.startsWith('http')) return path;
  if (path.startsWith('/')) return `http://localhost:8080${path}`;

  return `http://localhost:8080/${path}`;
}

export default University;