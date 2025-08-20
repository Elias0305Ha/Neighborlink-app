const Comment = require('../models/Comment');
const Post = require('../models/Post');

// @desc    Create a comment
// @route   POST /api/v1/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { text, postId } = req.body;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      text,
      createdBy: req.user.userId,
      post: postId
    });

    // Populate the createdBy field to get user info
    await comment.populate('createdBy', 'name');

    // Notify ONLY the post owner about the new comment
    const io = req.app.get('io');
    const userConnections = req.app.get('userConnections');
    
    if (io && userConnections) {
      const postOwnerSocketId = userConnections.get(post.createdBy.toString());
      
      if (postOwnerSocketId) {
        io.to(postOwnerSocketId).emit('new-comment', {
          ...comment.toObject(),
          postId: postId,
          user: { username: comment.createdBy.name }
        });
        console.log(`Notified post owner ${post.createdBy} about new comment`);
      }
    }

    res.status(201).json({
      success: true,
      data: comment
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get comments for a post
// @route   GET /api/v1/comments/post/:postId
// @access  Public
const getCommentsByPost = async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ post: postId })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/v1/comments/:id
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is comment author or post owner
    const post = await Post.findById(comment.post);
    const isCommentAuthor = comment.createdBy.toString() === req.user.userId;
    const isPostOwner = post.createdBy.toString() === req.user.userId;

    if (!isCommentAuthor && !isPostOwner) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    await Comment.findByIdAndDelete(req.params.id);

    // Notify ONLY the post owner about comment deletion
    const io = req.app.get('io');
    const userConnections = req.app.get('userConnections');
    
    if (io && userConnections) {
      const postOwnerSocketId = userConnections.get(post.createdBy.toString());
      
      if (postOwnerSocketId) {
        io.to(postOwnerSocketId).emit('comment-deleted', req.params.id);
        console.log(`Notified post owner ${post.createdBy} about comment deletion`);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createComment,
  getCommentsByPost,
  deleteComment
}; 