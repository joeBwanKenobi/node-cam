const { spawn, exec } = require('child_process');
const pcam = require('pi-camera-connect');
const fs = require('fs');
const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = 5000;

// initializes camera devices and creates devices / stream list
const { devices, streams, startFeed, bindSocket } = require('./cameras.js');
//console.log(io);
//bindSocket(io);


server.listen(PORT, () => {
	console.log(`server listening on port: ${PORT}`);
});

io.on('connection', function(socket) {
    let now = new Date();
    console.log(`${now.toLocaleString('en-US', {timezone: 'EST'}).toString()}: Client connected -- id:${socket.id}  -- ip:${socket.client.conn.remoteAddress}`);
});

app.get('/', (req,res) => {
	res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/clicked/:id', (req, res) => {
    console.log(req.params.id);
    res.sendStatus(201);
    if (streams.length > 0) {
       clearInterval(streams[0]);
        streams.pop();
    //if (req.params.id === 'piCam') {
    //    devices[1].stopFeed();
    //    devices[0].startFeed();
    //} else if (req.params.id === 'streetCam') {
    //    devices[0].stopFeed();
    //    devices[1].startFeed();
    }
    streams.push(startFeed(req.params.id, devices, io));
});
