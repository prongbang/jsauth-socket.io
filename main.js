const express = require('express');
const app = express();
const http = require('http');
const mqtt = require('mqtt');
const server = http.createServer(app);
const { Server } = require("socket.io");

// Socket
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  }
});

let isUnauthorized = (token) => token != "JWT";

let checkUnauthorized = (socket, next) => {
  const token = socket.handshake.auth.token;

  if (isUnauthorized(token)) {
    return next(new Error("not authorized"));
  }

  next();
};

// Device namespace
const deviceNamespace = io.of("/device");
deviceNamespace.use(checkUnauthorized);
deviceNamespace.on("connection", (socket) => {
  console.log(`socket ${socket.id} connected`);

  socket.on("subscribe", (payload) => {
    let id = payload;
    let room = `device/${id}`;
    socket.join(room);
  });

  socket.on("disconnect", (reason) => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);
  });
});

// Main namespace
io.use(checkUnauthorized);
io.on("connection", (socket) => {
  console.log(`socket ${socket.id} connected`);
  socket.on("disconnect", (reason) => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);
  });
});

// Mqtt connection option
const options = {
  clean: true, // retain session
  connectTimeout: 4000, // Timeout period
  // Authentication information
  clientId: 'emqx_test',
  username: 'emqx_test',
  password: 'emqx_test',
}
const connectUrl = 'wss://broker.emqx.io:8084/mqtt'
const client = mqtt.connect(connectUrl, options)

client.on('connect', () => {
  console.log('Mqtt connected')

  // Subscribe to a topic
  client.subscribe('device', function (err) {
    if (err) {
      console.log("err:", err)
    }
  })
})

// Receive messages
client.on('message', function (topic, message) {
  // message is Buffer
  let payload = JSON.parse(message.toString());
  console.log(topic, payload)

  let room = `device/${payload.id}`;
  let event = room;
  deviceNamespace.to(room).emit(event, payload);
})

client.on('reconnect', (error) => {
  console.log('reconnecting:', error)
})

client.on('error', (error) => {
  console.log('Connection failed:', error)
})

// Express
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/device/publish', (req, res) => {
  let room = `device/1`;
  let event = `device/1`;
  deviceNamespace.to(room).emit(event, { message: "Hello" });
  res.json({ message: 'published' });
});

server.listen(3000, () => {
  console.log('listening on *:3000');
});