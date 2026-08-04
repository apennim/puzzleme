const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const PORT = process.env.PORT || 4000;

io.on('connection', (socket) => {
  console.log('client connected', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined ${roomId}`);
  });

  socket.on('vote', ({ roomId, optionId }) => {
    // For demo: broadcast a fake vote update (increment random option)
    io.to(roomId).emit('vote_update', [
      { id: 'A', label: '#老台北鐵窗花', votes: Math.floor(Math.random()*3) },
      { id: 'B', label: '#昭和復古風', votes: Math.floor(Math.random()*3) },
      { id: 'C', label: '#城市盲盒探險', votes: Math.floor(Math.random()*3) }
    ]);
  });

  socket.on('request_route', ({ roomId }) => {
    // Send back a mock room_result
    setTimeout(() => {
      io.to(roomId).emit('room_result', { title: 'A方案：經典大稻埕漫遊' });
    }, 800);
  });

  socket.on('disconnect', () => {
    console.log('client disconnect', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Mock Socket.IO server listening on ${PORT}`);
});
