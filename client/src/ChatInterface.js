import React, { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Image, File, X, MessageCircle } from 'lucide-react';

const ChatInterface = ({ assignment, user, onClose, socket }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fullAssignment, setFullAssignment] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch chat messages
  useEffect(() => {
    console.log('ChatInterface useEffect - assignment:', assignment);
    if (assignment?._id) {
      console.log('Fetching chat messages for assignment:', assignment._id);
      fetchChatMessages();
      
      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('Chat loading timeout - forcing stop');
        setIsLoading(false);
      }, 10000); // 10 seconds timeout
      
      return () => clearTimeout(timeout);
    }
  }, [assignment?._id]);

  // Add refresh button for testing
  const refreshChat = () => {
    console.log('Refreshing chat messages...');
    fetchChatMessages();
  };

  // Mark messages as read
  const markMessagesAsRead = async () => {
    if (!assignment?._id || !user?._id) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`http://localhost:5000/api/v1/chats/assignment/${assignment._id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Emit notification update to update unread count
      if (socket) {
        socket.emit('notification-updated', {
          action: 'marked-read',
          assignmentId: assignment._id
        });
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchChatMessages = async () => {
    try {
      console.log('Fetching chat messages for assignment:', assignment);
      
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`http://localhost:5000/api/v1/chats/assignment/${assignment._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      console.log('Chat API response status:', response.status);
      const result = await response.json();
      console.log('Chat API response:', result);
      
      if (result.success) {
        setMessages(result.data.messages || []);
        setFullAssignment(result.data.assignment); // Store the full populated assignment
        setIsLoading(false);
        
        // Mark messages as read when entering chat
        markMessagesAsRead();
      } else {
        console.error('Chat API failed:', result.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      setIsLoading(false);
    }
  };

  // Socket.IO event listeners
  useEffect(() => {
    if (!socket || !assignment?._id) return;

    // Clean up any existing listeners first
    socket.off('new-message');
    socket.off('user-typing');
    socket.off('user-stop-typing');

    // Listen for new messages
    socket.on('new-message', (data) => {
      console.log('Received real-time message:', data);
      if (data.assignmentId === assignment._id) {
        console.log('Adding message to chat:', data.message);
        
        // Prevent duplicate messages by checking if message already exists
        setMessages(prev => {
          // First check by message ID (most reliable)
          if (data.message._id && prev.some(msg => msg._id === data.message._id)) {
            console.log('Message with this ID already exists, not adding duplicate');
            return prev;
          }
          
          // Fallback check by content, sender, and timestamp
          const messageExists = prev.some(msg => 
            msg.content === data.message.content && 
            msg.sender === data.message.sender && 
            Math.abs(new Date(msg.createdAt || Date.now()) - new Date(data.message.createdAt || Date.now())) < 2000
          );
          
          if (messageExists) {
            console.log('Message with similar content already exists, not adding duplicate');
            return prev;
          }
          
          console.log('Adding new message to chat');
          return [...prev, data.message];
        });
      } else {
        console.log('Message assignment ID mismatch:', data.assignmentId, 'vs', assignment._id);
      }
    });

    // Listen for typing indicators
    socket.on('user-typing', (data) => {
      if (data.assignmentId === assignment._id && data.userId !== user._id) {
        setTypingUsers(prev => new Set(prev).add(data.userName));
        setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userName);
            return newSet;
          });
        }, 3000);
      }
    });

    // Listen for typing stop
    socket.on('user-stop-typing', (data) => {
      if (data.assignmentId === assignment._id && data.userId !== user._id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userName);
          return newSet;
        });
      }
    });

    return () => {
      socket.off('new-message');
      socket.off('user-typing');
      socket.off('user-stop-typing');
    };
  }, [socket, user._id]); // Removed assignment?._id to prevent listener recreation

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !assignment?._id) return;

    socket.emit('typing', {
      assignmentId: assignment._id,
      userId: user._id,
      userName: user.name
    });

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', {
        assignmentId: assignment._id,
        userId: user._id,
        userName: user.name
      });
    }, 1000);
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    try {
      console.log('Sending message:', { content: newMessage.trim(), file: selectedFile });
      
      const token = localStorage.getItem('token');
      const formData = new FormData();
      
      if (newMessage.trim()) {
        formData.append('content', newMessage.trim());
      }
      
      if (selectedFile) {
        formData.append('image', selectedFile);
        formData.append('messageType', 'image');
      }

      const response = await fetch(`http://localhost:5000/api/v1/chats/assignment/${assignment._id}/message`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('Message API response status:', response.status);
      const result = await response.json();
      console.log('Message API response:', result);
      
      if (result.success) {
        setNewMessage('');
        setSelectedFile(null);
        setShowFileUpload(false);
        
        // DON'T add message to local state here - let Socket.IO handle it
        // This prevents duplication
        
        // Emit stop typing
        if (socket) {
          socket.emit('stop-typing', {
            assignmentId: assignment._id,
            userId: user._id,
            userName: user.name
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setSelectedFile(file);
        setShowFileUpload(false);
      } else {
        alert('Please select an image file');
      }
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Get other participant info
  const getOtherParticipant = () => {
    console.log('Getting other participant - fullAssignment:', fullAssignment);
    console.log('User:', user);
    
    if (!fullAssignment || !user?._id) return null;
    
    // Safely access nested properties from the full populated assignment
    const helperId = fullAssignment?.helper?._id;
    const postCreatorId = fullAssignment?.post?.createdBy?._id;
    
    if (!helperId || !postCreatorId) {
      console.error('Missing assignment data:', { helperId, postCreatorId, fullAssignment });
      return null;
    }
    
    if (user._id === helperId) {
      console.log('User is helper, other participant is post creator:', fullAssignment.post.createdBy);
      return fullAssignment.post.createdBy;
    } else if (user._id === postCreatorId) {
      console.log('User is post creator, other participant is helper:', fullAssignment.helper);
      return fullAssignment.helper;
    } else {
      console.error('User is neither helper nor post creator:', { userId: user._id, helperId, postCreatorId });
      return null;
    }
  };

  const otherParticipant = getOtherParticipant();

  // Show loading state while fetching data
  if (isLoading || !fullAssignment) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-center">Loading chat...</p>
          <p className="mt-2 text-sm text-gray-500 text-center">This may take a few seconds</p>
          <button
            onClick={() => {
              console.log('User cancelled loading');
              onClose();
            }}
            className="mt-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Early return if we can't determine the other participant (only after loading)
  if (!otherParticipant) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unable to Load Chat</h3>
            <p className="text-gray-600 mb-4">The assignment data is incomplete or corrupted.</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Chat with {otherParticipant?.name}</h3>
                <p className="text-blue-100 text-sm">
                  {fullAssignment?.post?.title || 'Untitled Post'} • {fullAssignment?.status || 'Unknown Status'}
                </p>
              </div>
            </div>
                         <div className="flex items-center space-x-2">
               <button
                 onClick={refreshChat}
                 className="text-white/80 hover:text-white transition-colors p-1"
                 title="Refresh messages"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                 </svg>
               </button>
               <button
                 onClick={onClose}
                 className="text-white/80 hover:text-white transition-colors"
               >
                 <X className="w-6 h-6" />
               </button>
             </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No messages yet</p>
              <p className="text-gray-400">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={message._id || index}
                  className={`flex ${message.sender._id === user._id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.sender._id === user._id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-800 shadow-md'
                    }`}
                  >
                    {/* Message Header */}
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden">
                        {message.sender.profilePicture ? (
                          <img
                            src={`http://localhost:5000${message.sender.profilePicture}`}
                            alt={message.sender.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-600">
                            {message.sender.name?.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-xs opacity-80">{message.sender.name}</span>
                      <span className="text-xs opacity-60">
                        {new Date(message.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>

                    {/* Message Content */}
                    {message.messageType === 'image' ? (
                      <div className="space-y-2">
                        {message.content && (
                          <p className="text-sm">{message.content}</p>
                        )}
                        <img
                          src={`http://localhost:5000${message.fileUrl}`}
                          alt="Shared image"
                          className="max-w-full rounded-lg"
                        />
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Typing Indicator */}
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-800 shadow-md px-4 py-3 rounded-2xl">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {Array.from(typingUsers).join(', ')} typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-6 bg-white border-t border-gray-200 rounded-b-2xl">
          {/* File Preview */}
          {selectedFile && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-800">{selectedFile.name}</span>
              </div>
              <button
                onClick={() => setSelectedFile(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end space-x-3">
            {/* File Upload Button */}
            <button
              onClick={() => setShowFileUpload(!showFileUpload)}
              className="p-3 text-gray-500 hover:text-blue-600 transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* File Input */}
            {showFileUpload && (
              <div className="absolute bottom-20 left-6 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                <label className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-50 rounded cursor-pointer">
                  <Image className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Message Input */}
            <div className="flex-1">
              <textarea
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="1"
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />
            </div>

            {/* Send Button */}
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim() && !selectedFile}
              className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
