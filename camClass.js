const cv = require('opencv4nodejs');

class Camera {
    constructor(devName, io) {
        this.devName = devName;
        this.stream = new cv.VideoCapture(devName);
        this.timer;
        this.FPS = 8;
        this.width = 960;
        this.height = 540;
        this.stream.set(cv.CAP_PROP_FRAME_WIDTH, this.width);
        this.stream.set(cv.CAP_PROP_FRAME_HEIGHT, this.height);
        this.io = io;
    }

    startFeed() {
        let timerId = setInterval(() => {
            const frame = this.stream.read();
            if (!frame.empty) {
                const image = cv.imencode('.jpg', frame).toString('base64');
                this.io.emit('currentimage', image);
            } else { console.log('frame empty'); }
        }, 1000 / this.FPS);
        this.timer = timerId;
    }

    stopFeed() {
        clearInterval(this.timer);
    }
}

module.exports = Camera;
