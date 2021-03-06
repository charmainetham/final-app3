// Setup basic express server
var express = require('express');
var mongoose = require('mongoose');
var app = express();
var server = require('http').createServer(app);
var io = require('../..')(server);
var port = process.env.PORT || 3000;
var users = [];

server.listen(port, function () {
  console.log('Server listening at port %d', port);
});


// MongoDB
mongoose.connect('mongodb://localhost/point', function(err){
  if(err){
    console.log(err);
  } else {
    console.log('Connection to mongodb');
  };
});

var pointSchema = mongoose.Schema({
  username: String, 
  points: Number,
  created: {type: Date, default: Date.now}
});

var Point = mongoose.model('Message',pointSchema);

// Routing
app.use(express.static(__dirname + '/public'));

// Chatroom

var numUsers = 0;
// var USERS = {};


io.on('connection', function (socket) {
  console.log(Point.find({}));
  var addedUser = false;
    console.log(socket.id)


    socket.emit('check',{
      users: users
    });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
      socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    if (addedUser) return;

    // we store the username in the socket session for this client


    socket.username = username;
    ++numUsers;
    addedUser = true;
    users.push(username);

    var newPoint = new Point({username: username, points: 0});
    newPoint.save(function(err){
      if (err) throw err;
    });
 
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers,
      users: users
    });

    socket.emit('online',{
    username: socket.username,
    numUsers: numUsers,
    users: users
    });


    
  });


  // when the client emits 'typing', we broadcast it to others
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

  // when the client emits 'stop typing', we broadcast it to others
  socket.on('stop typing', function () {
    socket.broadcast.emit('stop typing', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;
      // delete a user
      var index = users.indexOf(socket.username);
      users.splice(index, 1);
      // users.delete();

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers,
        users: users
      });
    }

  });
});
