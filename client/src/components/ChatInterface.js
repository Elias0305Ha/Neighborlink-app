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
    if (assignment?._id) {
      fetchChatMessages();
    }
  }, [assignment?._id]);

  const fetchChatMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/v1/chats/assignment/${assignment._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const result = await response.json();
      if (result.success) {
        setMessages(result.data.messages || []);
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

    // Listen for new messages
    socket.on('new-message', (data) => {
      if (data.assignmentId === assignment._id) {
        setMessages(prev => [...prev, data.message]);
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
  }, [socket, assignment?._id, user._id]);

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

      const result = await response.json();
      if (result.success) {
        setNewMessage('');
        setSelectedFile(null);
        setShowFileUpload(false);
        
        // Add message to local state
        setMessages(prev => [...prev, result.data]);
        
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
    if (!assignment) return null;
    
    if (user._id === assignment.helper._id) {
      return assignment.post.createdBy;
    } else {
      return assignment.helper;
    }
  };

  const otherParticipant = getOtherParticipant();

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading chat...</p>
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
                  {assignment.post.title} • {assignment.status}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
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
