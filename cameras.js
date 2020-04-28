const { spawn, exec } = require('child_process');
const cv = require('opencv4nodejs');
const Camera = require('./camClass.js');

const FPS = 10;
const captureDevices = []; // array to hold camera objects
//const devices = ['/dev/video0', '/dev/video1']; // system devices names, make this dynamic
const devices = ['/dev/video1']; 
const usableDevs = ['bcm2835-v4l2', 'C920'];
const streams = [];  // arry to hold frame read timers for each camera, needs to be empty now make dynamic
var socket = {};


cameraInit(captureDevices, devices);
console.log(captureDevices);

function bindSocket(io) {
    socket = io;
}

function findDevices(usableDevList) {
    const vdList = exec('v4l2-ctl --list-devices');
    let l;
    vdList.stdout.on('data', (data) => {
        //console.log(`${data}`);
        l = data.split('\n');
        l = l.filter((el) => el != '');
    }); 
    vdList.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
    });
    vdList.on('close', (code) => {
        console.log(`program exited with code: ${code}`);
        for (let i = 0; i < l.length; i++) {
            console.log(l[i].substring(0, l[i].indexOf(usableDevList[0])));
        }
        console.log(l);
    });

}

// creates array of VideoCapture Objects from list of device names (devices)
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
                    console.log(`disabling auto focus and setting focus_absolute=1`);
                    exec(`v4l2-ctl -c focus_auto=0 -d ${cam.dev}`);
                    exec(`v4l2-ctl -c focus_absolute=1 -d ${cam.dev}`);
                    deviceList.push(cam);
                }
}

// creates an Interval timer to emit frames at FPS rate to websocket io
function startFeed(camera, deviceList, io) {
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

module.exports.devices = captureDevices;
module.exports.streams = streams;
module.exports.startFeed = startFeed;
module.exports.bindSocket = bindSocket;
