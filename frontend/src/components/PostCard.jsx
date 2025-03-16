import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, Calendar, Heart, Send, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PostCard = ({ 
  post,
  currentUser,
  likedPosts,
  likedComments,
  expandedComments,
  onLike,
  onComment,
  onDeletePost,
  onToggleComments,
  onLikeComment,
  onReply,
  onSubmitReply
}) => {
  const [postSlides, setPostSlides] = useState({});
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  
  const navigate = useNavigate();
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handlePrevSlide = (postId) => {
    setPostSlides(prev => ({
      ...prev,
      [postId]: (prev[postId] > 0 ? prev[postId] - 1 : 0)
    }));
  };

  const handleNextSlide = (postId, maxSlides) => {
    setPostSlides(prev => ({
      ...prev,
      [postId]: (prev[postId] < maxSlides - 1 ? prev[postId] + 1 : prev[postId])
    }));
  };

  const handleReplyLocal = (commentId, username) => {
    setReplyingTo({ commentId, username });
    setReplyText(`@${username} `);
    if (onReply) {
      onReply(post.id, commentId, username);
    }
  };

  const submitReplyLocal = (commentId) => {
    if (!replyText.trim()) return;
    
    if (onSubmitReply) {
      onSubmitReply(post.id, commentId, replyText);
    }
    
    setReplyingTo(null);
    setReplyText('');
  };

  const handleCommentLocal = () => {
    if (!commentText.trim()) return;
    
    if (onComment) {
      onComment(post.id, commentText);
    }
    
    setCommentText('');
  };
  
  return (
    <div style={styles.post}>
      {/* Post Header */}
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
        
        {post.author.username === currentUser?.username && (
          <div 
            style={styles.menuTrigger}
            onMouseEnter={() => setMenuVisible(true)}
            onMouseLeave={() => setMenuVisible(false)}
          >
            <MoreVertical size={18} color="#6B7280" />
            <div style={{
              ...styles.menuDropdown,
              display: menuVisible ? 'block' : 'none'
            }}>
              <button 
                onClick={() => onDeletePost && onDeletePost(post.id)} 
                style={styles.menuItem}
              >
                Delete Post
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Post Content */}
      <p style={styles.postText}>{post.text}</p>
      
      {/* Hashtags */}
      {post.hashtags && post.hashtags.length > 0 && (
        <div style={styles.hashtagContainer}>
          {post.hashtags.map((tag, index) => (
            <span key={index} style={styles.hashtag}>
              #{typeof tag === 'object' ? tag.name : tag}
            </span>
          ))}
        </div>
      )}
      
      {/* Media Gallery */}
      {((post.images && post.images.length > 0) || (post.videos && post.videos.length > 0)) && (
        <div style={styles.slideshow}>
          <div style={styles.slideshowContainer}>
            {/* Images */}
            {post.images && post.images.length > 0 && post.images.map((image, idx) => (
              <div 
                key={`img-${idx}`}
                style={{
                  ...styles.slide,
                  display: (postSlides[post.id] || 0) === idx ? 'block' : 'none'
                }}
              >
                <img 
                  src={image} 
                  alt={`Post image ${idx + 1}`} 
                  style={styles.slideImage}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/assets/placeholder-image.png';
                  }}
                />
              </div>
            ))}
            
            {/* Videos */}
            {post.videos && post.videos.length > 0 && post.videos.map((video, idx) => (
              <div 
                key={`vid-${idx}`}
                style={{
                  ...styles.slide,
                  display: (postSlides[post.id] || 0) === (post.images?.length || 0) + idx ? 'block' : 'none'
                }}
              >
                <video 
                  controls
                  src={video} 
                  style={styles.slideVideo}
                  onError={(e) => {
                    e.target.onerror = null;
                  }}
                />
              </div>
            ))}
          </div>
          
          {/* Navigation controls */}
          {((post.images?.length || 0) + (post.videos?.length || 0)) > 1 && (
            <>
              <button 
                style={styles.slidePrevButton} 
                onClick={() => handlePrevSlide(post.id)}
                aria-label="Previous slide"
              >
                &#10094;
              </button>
              <button 
                style={styles.slideNextButton} 
                onClick={() => handleNextSlide(post.id, (post.images?.length || 0) + (post.videos?.length || 0))}
                aria-label="Next slide"
              >
                &#10095;
              </button>
              <div style={styles.slideDots}>
                {[...(post.images || []), ...(post.videos || [])].map((_, idx) => (
                  <span 
                    key={idx} 
                    style={{
                      ...styles.slideDot,
                      backgroundColor: (postSlides[post.id] || 0) === idx ? '#1E40AF' : '#D1D5DB'
                    }}
                    onClick={() => setPostSlides({...postSlides, [post.id]: idx})}
                  ></span>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Post Actions */}
      <div style={styles.postActions}>
        <button 
          style={{
            ...styles.actionButton,
            color: likedPosts.includes(post.id) ? '#1E40AF' : '#6B7280'
          }}
          onClick={() => onLike && onLike(post.id)}
        >
          <ThumbsUp size={18} color={likedPosts.includes(post.id) ? '#1E40AF' : 'black'} />
          <span>{post.likes || 0}</span>
        </button>
        <button 
          style={styles.actionButton}
          onClick={() => onToggleComments && onToggleComments(post.id)}
        >
          <MessageSquare size={18} color='black' />
          <span>{post.comments?.length || 0}</span>
        </button>
        <button 
          style={styles.actionButton}
          onClick={() => post.onShare && post.onShare(post)}
        >
          <Share2 size={18} color='black' />
          <span>Share</span>
        </button>
      </div>
      
      {/* Comments Section */}
      <div style={styles.commentsSection}>
        {expandedComments.includes(post.id) && (
          <>
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
                          onClick={() => onLikeComment && onLikeComment(comment.id)}
                        >
                          Like
                        </button>
                        <button 
                          style={styles.commentActionButton}
                          onClick={() => handleReplyLocal(comment.id, comment.author.username)}
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
                    
                    {/* Comment Replies */}
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
                                    onClick={() => onLikeComment && onLikeComment(reply.id)}
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
                    
                    {/* Reply Input */}
                    {replyingTo && replyingTo.commentId === comment.id && (
                      <div style={styles.replyInputContainer}>
                        <img 
                          src={currentUser?.profilePhoto || '/assets/placeholder-profile.png'}
                          alt="Your Profile"
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
                              submitReplyLocal(comment.id);
                            }
                          }}
                        />
                        <button 
                          style={styles.sendButton}
                          onClick={() => submitReplyLocal(comment.id)}
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
            
            {/* Add Comment Input */}
            <div style={styles.addComment}>
              <img 
                src={currentUser?.profilePhoto || '/assets/placeholder-profile.png'} 
                alt="Your Profile" 
                style={styles.commentAuthorImage}
              />
              <div style={styles.commentInputContainer}>
                <input 
                  type="text"
                  placeholder="Write a comment..."
                  style={styles.commentInput}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleCommentLocal();
                    }
                  }}
                />
                <button 
                  style={styles.sendButton}
                  onClick={handleCommentLocal}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  // Post container
  post: {
    padding: '1.5rem',
    borderRadius: '0.5rem',
    backgroundColor: 'white',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  },
  // Post header
  postHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  postDate: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#6B7280',
  },
  // Post content
  postText: {
    margin: '0 0 1rem 0',
    lineHeight: '1.5',
  },
  // Hashtags
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
  // Slideshow
  slideshow: {
    position: 'relative',
    width: '100%',
    height: '400px',
    marginBottom: '1rem',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  slideshowContainer: {
    width: '100%',
    height: '100%',
  },
  slide: {
    width: '100%',
    height: '100%',
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
  slidePrevButton: {
    position: 'absolute',
    top: '50%',
    left: '16px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    fontSize: '16px',
    cursor: 'pointer',
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideNextButton: {
    position: 'absolute',
    top: '50%',
    right: '16px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: 'white',
    border: 'none',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    fontSize: '16px',
    cursor: 'pointer',
    zIndex: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideDots: {
    position: 'absolute',
    bottom: '16px',
    left: '0',
    right: '0',
    display: 'flex',
    justifyContent: 'center',
    gap: '6px',
  },
  slideDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
  },
  // Post actions
  postActions: {
    display: 'flex',
    borderTop: '1px solid #E5E7EB',
    borderBottom: '1px solid #E5E7EB',
    padding: '0.5rem 0',
  },
  actionButton: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.5rem',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  // Comments section
  commentsSection: {
    marginTop: '1rem',
  },
  comment: {
    display: 'flex',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  commentContentWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
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
  commentActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.25rem',
  },
  commentDate: {
    fontSize: '0.75rem',
    color: '#6B7280',
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
  // Replies
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
  // Reply input
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
    fontSize: '0.875rem',
  },
  // Comment input
  addComment: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  commentAuthorImage: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  commentInputContainer: {
    flex: 1,
    position: 'relative',
  },
  commentInput: {
    width: '100%',
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
    top: '50%',
    transform: 'translateY(-50%)',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '0.75rem',
    color: '#6B7280',
    cursor: 'pointer',
  },
  // Empty message
  emptyMessage: {
    textAlign: 'center',
    color: '#6B7280',
    padding: '1rem 0',
  },
  // Menu
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
};

export default PostCard;