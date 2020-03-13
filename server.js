const { spawn, exec } = require('child_process');
const pcam = require('pi-camera-connect');
const fs = require('fs');
const express = require('express');
const path = require('path');
const cv = require('opencv4nodejs');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const PORT = 5000;
const FPS = 10;
const captureDevices = []; // array to hold camera objects
const devices = ['/dev/video0', '/dev/video1']; // system devices names, make this dynamic
const streams = [];  // arry to hold frame read timers for each camera, needs to be empty now make dynamic
cameraInit(captureDevices, devices);
console.log(captureDevices);

//const wCap = new cv.VideoCapture("/dev/video1");
//wCap.set(cv.CAP_PROP_FRAME_WIDTH, 960);
//wCap.set(cv.CAP_PROP_FRAME_HEIGHT, 540);
// Pi Camera Setup
//console.log('Pi Cam Setup');
//const wCap2 = new cv.VideoCapture("/dev/video0");
//wCap2.set(cv.CAP_PROP_FRAME_WIDTH, 960);
//wCap2.set(cv.CAP_PROP_FRAME_HEIGHT, 540);
//console.log('Pi Camera Setup finished....');

//const wCap3 = new cv.VideoCapture('rtsp://192.168.0.6:6001/unicast');

server.listen(PORT, () => {
	console.log(`server listening on port: ${PORT}`);
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
    }
    streams.push(startFeed(req.params.id, captureDevices));
});

function createSource(device) {
    let source = {
        dev: device
    }
    return source;
}

function cameraInit(deviceList, devices) {
    let width = 960;
    let height = 540;
    for (let i = 0; i < devices.length; i++) {
        let cam = {
            dev: devices[i],
            stream: new cv.VideoCapture(devices[i])
        };
        console.log(`setting width to ${width} on ${cam.stream}.`);
        cam.stream.set(cv.CAP_PROP_FRAME_WIDTH, width);
        console.log(`setting height to ${height} on ${cam.stream}.`);
        cam.stream.set(cv.CAP_PROP_FRAME_HEIGHT, height);
        deviceList.push(cam);
    }
}

function startFeed(camera, deviceList) {
    let device = '';
    if (camera === 'piCam') {
        device = "/dev/video0";
    } else if (camera === 'streetCam') {
        device = "/dev/video1";
    }
    const result = deviceList.find( ({ dev }) => dev === device  );
    console.log(`starting feed: ${result.dev}`);
    let timerId = setInterval(() => {
        const frame = result.stream.read();
        if (!frame.empty) {
            const image = cv.imencode('.jpg', frame).toString('base64');
            io.emit('currentimage', image);
        } else { console.log('frame empty'); }
    }, 1000 / FPS);
    return timerId;
}

//setInterval(() => {
//	const frame = wCap.read();
//	const image = cv.imencode('.jpg', frame).toString('base64');
//	io.emit('currentimage', image);
//    const piframe = wCap2.read();
//    if (!piframe.empty) {
//        const image = cv.imencode('.jpg', piframe).toString('base64');
//        io.emit('pimage', image);
//    } else { console.log('frame empty'); }
//}, 1000 / FPS);

//setInterval(() => {
//    const frame = wCap2.read();
//    if (!frame.empty) {
//        const image = cv.imencode('.jpg', frame).toString('base64');
//        io.emit('pimage', image);
//    } else { console.log('frame empty'); }
//}, 1000 / FPS);

