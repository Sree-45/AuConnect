import React, { useState, useRef, useEffect } from 'react'; // Add useRef and useEffect
import { Image, Film, X, Send } from 'lucide-react';

const CreatePostCard = ({ onPostSubmit, userData }) => {
  const [postContent, setPostContent] = useState('');
  const [postImages, setPostImages] = useState([]);
  const [postVideos, setPostVideos] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardRef = useRef(null); // Add ref for the component
  
  // Add this useEffect to handle outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      // If the card is expanded, there's no content, and the click is outside the card
      if (
        isExpanded && 
        !postContent.trim() && 
        postImages.length === 0 && 
        postVideos.length === 0 && 
        cardRef.current && 
        !cardRef.current.contains(event.target)
      ) {
        setIsExpanded(false);
      }
    };

    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded, postContent, postImages, postVideos]);
  
  const handleSubmit = async () => {
    if (!postContent.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Extract hashtags
      const hashtags = [];
      const hashtagRegex = /#(\w+)/g;
      let match;
      
      while ((match = hashtagRegex.exec(postContent)) !== null) {
        hashtags.push(match[1]);
      }
      
      // Create post data with media
      let postData = {
        text: postContent,
        hashtags: hashtags
      };
      
      // Handle media uploads if any
      if (postImages.length > 0 || postVideos.length > 0) {
        // Get media URLs from backend uploads
        const imageUrls = await uploadImages(postImages);
        const videoUrls = await uploadVideos(postVideos);
        
        // Add to post data
        postData.imageUrls = imageUrls;
        postData.videoUrls = videoUrls;
      }
      
      // Send to parent component for submission
      await onPostSubmit(postContent, postData);
      
      // Reset form after submission
      setPostContent('');
      setPostImages([]);
      setPostVideos([]);
      setIsExpanded(false);
    } catch (error) {
      console.error('Error creating post:', error);
      // You could add error handling UI here
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadImages = async (images) => {
    if (!images.length) return [];
    
    const imageUrls = [];
    for (const image of images) {
      const formData = new FormData();
      formData.append('file', image.file);
      formData.append('type', 'image');
      
      const response = await fetch('http://localhost:8080/api/posts/upload-media', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        imageUrls.push(data.fileUrl);
      }
    }
    
    return imageUrls;
  };
  
  const uploadVideos = async (videos) => {
    if (!videos.length) return [];
    
    const videoUrls = [];
    for (const video of videos) {
      const formData = new FormData();
      formData.append('file', video.file);
      formData.append('type', 'video');
      
      const response = await fetch('http://localhost:8080/api/posts/upload-media', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        videoUrls.push(data.fileUrl);
      }
    }
    
    return videoUrls;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setPostImages([...postImages, ...newImages]);
    setIsExpanded(true);
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    const newVideos = files.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    setPostVideos([...postVideos, ...newVideos]);
    setIsExpanded(true);
  };

  const handleRemoveImage = (index) => {
    const updatedImages = [...postImages];
    URL.revokeObjectURL(updatedImages[index].preview);
    updatedImages.splice(index, 1);
    setPostImages(updatedImages);
  };

  const handleRemoveVideo = (index) => {
    const updatedVideos = [...postVideos];
    URL.revokeObjectURL(updatedVideos[index].preview);
    updatedVideos.splice(index, 1);
    setPostVideos(updatedVideos);
  };

  return (
    <div style={styles.createPostCard} ref={cardRef}>
      <div style={styles.postHeader}>
        <img 
          src={userData?.profilePhoto || '/assets/placeholder-profile.png'} 
          alt={userData?.firstName || 'Profile'} 
          style={styles.profileImage}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/placeholder-profile.png';
          }}
        />
        <div style={styles.inputWrapper}>
          <textarea
            style={styles.postInput}
            placeholder="What's on your mind?"
            value={postContent}
            onChange={(e) => {
              setPostContent(e.target.value);
              if (e.target.value.trim() && !isExpanded) {
                setIsExpanded(true);
              }
            }}
            onClick={() => setIsExpanded(true)}
            rows={isExpanded ? 3 : 1}
          />
        </div>
      </div>
      
      {/* Media preview section */}
      {(postImages.length > 0 || postVideos.length > 0) && (
        <div style={styles.mediaPreviewContainer}>
          {/* Image previews */}
          {postImages.map((image, index) => (
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
          {postVideos.map((video, index) => (
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
      
      {isExpanded && (
        <div style={styles.expandedFooter}>
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
          
          <button 
            style={{
              ...styles.postButton,
              opacity: postContent.trim() ? 1 : 0.5,
              cursor: postContent.trim() ? 'pointer' : 'not-allowed'
            }}
            onClick={handleSubmit}
            disabled={!postContent.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <div style={styles.spinner}></div>
            ) : (
              <>
                <Send size={16} />
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const styles = {
  createPostCard: {
    backgroundColor: 'white',
    borderRadius: '0.75rem',
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    marginBottom: '1.5rem',
    overflow: 'hidden',
  },
  postHeader: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'flex-start',
  },
  profileImage: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  postInput: {
    width: '100%',
    border: '1px solid #E5E7EB',
    borderRadius: '1.5rem',
    padding: '0.75rem 1.25rem',
    fontSize: '0.95rem',
    resize: 'none',
    fontFamily: 'inherit',
    color: '#1F2937',
    backgroundColor: 'white',
    transition: 'all 0.2s ease',
    outline: 'none',
  },
  expandedFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1.25rem',
    paddingTop: '1rem',
    borderTop: '1px solid #E5E7EB',
  },
  attachmentOptions: {
    display: 'flex',
    gap: '1rem',
  },
  attachmentButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  attachmentLabel: {
    fontSize: '0.875rem',
    color: '#4B5563',
  },
  fileInput: {
    display: 'none',
  },
  postButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#1E40AF',
    color: 'white',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem 1.25rem',
    fontSize: '0.875rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  mediaPreviewContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  mediaPreview: {
    position: 'relative',
    borderRadius: '0.5rem',
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
    backgroundColor: '#000',
  },
  removeMediaButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    border: 'none',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    cursor: 'pointer',
    zIndex: 10,
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

export default CreatePostCard;