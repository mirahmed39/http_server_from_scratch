// evenWarmer.js
// create Request and Response constructors...

const net = require('net');
const HOST = '127.0.0.1';
const PORT = 8080;

class Request {
    constructor(s) {

    }
}

const server = net.createServer((sock) => {
    sock.on('data', function (data) {
        let requestData = data.toString().split(' ');
        const path = requestData[1];
        const method = requestData[0];
        console.log(data.toString());
        //console.log(method);
        sock.end();
    });
});
server.listen(PORT);