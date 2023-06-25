const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
// const { Server } = require('socket.io');

// middleware imports
const cookieParser = require('cookie-parser');
const cors = require('cors');

// routes imports
const routes = require('./routes/index')

// initializing app
const app = express();
const server = require('http').createServer(app)

// middleware
app.use(
  cors({
    origin: 'https://sippets.vercel.app',
    // origin: 'http://localhost:5173',
    credentials: true,
  }),
  express.json(),
  cookieParser(),

  (req, res, next) => {
    console.log(req.path, req.method)
    next()
  }
)

app.use('/', routes)

// establishing db connection
const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI)
  server.listen(process.env.PORT, () => {
    console.log("I'm merry poppins y'all")
  })
}

connectDB()

// establishing socket connection
// const io = new Server(server, {
//   cors: {
//     origin: 'http://localhost:5173',
//     methods: ['GET', 'POST'],
//     credentials: true
//   },
// });

// require('./socket/')(io)