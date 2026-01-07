const User = require('./models/User');

module.exports = (io) => {
  const onlineUsers = new Map(); // userId -> socketId

  io.on('connection', (socket) => {
    console.log("New socket connection:", socket.id);

    // Join logic - User comes online
    socket.on('join', (userId) => {
      if (!userId) return;
      onlineUsers.set(userId, socket.id);
      socket.join(userId); // Join own room for DMs
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
      console.log(`User ${userId} came online`);
    });

    // Join Club/Room
    socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Socket ${socket.id} joined room ${roomId}`);
    });
    
    socket.on('leaveRoom', (roomId) => {
        socket.leave(roomId);
    });

    // Typing Indicators
    socket.on('typing', ({ to, fromUsername, conversationId, isClub }) => {
      // 'to' is either friendId (for DM) or clubId (for club)
      if (isClub) {
         // Broadcast to club room except sender
         socket.to(to).emit('typing', { fromUsername, conversationId, isClub: true });
      } else {
         // Direct Message -> Send to specific user room
         socket.to(to).emit('typing', { fromUsername, conversationId, isClub: false });
      }
    });
    
    socket.on('stopTyping', ({ to, fromUsername, conversationId, isClub }) => {
      if (isClub) {
         socket.to(to).emit('stopTyping', { fromUsername, conversationId, isClub: true });
      } else {
         socket.to(to).emit('stopTyping', { fromUsername, conversationId, isClub: false });
      }
    });

    // Read Receipts
    socket.on('markRead', ({ to, fromId, conversationId }) => {
        // 'to' is the friend whose messages I just read
        socket.to(to).emit('messageRead', { readerId: fromId, conversationId });
    });

    socket.on('disconnect', () => {
      // Find userId via value? Or user logic to track reverse?
      let disconnectedUserId = null;
      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === socket.id) {
          onlineUsers.delete(uid);
          disconnectedUserId = uid;
          break;
        }
      }
      if (disconnectedUserId) {
          io.emit('onlineUsers', Array.from(onlineUsers.keys()));
          console.log(`User ${disconnectedUserId} went offline`);
      }
    });
  });
};
