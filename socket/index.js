const Filter = require('bad-words');
const { addMessage } = require('../controllers/protected/protectedMessageControllers');

const filter = new Filter()

module.exports = (io) => {
  io.on('connection', (socket) => {
    const { userId, handshakeString } = socket.handshake.query
    console.log(socket.id + ' connected');
        
    socket.join(userId);

    socket.use(function ([event, auth], next) {
      if (auth != handshakeString) 
      {
        socket.disconnect()
        console.log(userId + ' disconnected');
      }
      console.log(event);
      next()
    })

    socket.on('message', async (auth, data, cb) => {      
      const message = await addMessage(data.conversation, userId, data.content)
      socket.emit('received', message._id)
      socket.to(data.to).emit('receive', { message })
      cb()
    })
  });
}
