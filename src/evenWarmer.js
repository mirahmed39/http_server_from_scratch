// evenWarmer.js
// create Request and Response constructors...

const net = require('net');
const HOST = '127.0.0.1';
const PORT = 8080;

function getMethod(s) {
    let requestData = s.split(' ');
    return requestData[0];
}
function getPath(s) {
    let requestData = s.split(' ');
    return requestData[1];
}
function getHeader(s) {
    // there is ony one empty line between the header and the body.
    let obj = {};
    let requestData = s.split('\r\n');
    let headerInfo = [];
    for (let i = 1; i < requestData.length; i++) {
        if(requestData[i])
            headerInfo.push(requestData[i]);
        else
            break;
    }
    headerInfo.map(function (ele) {
        let headerKey = ele.substring(0,ele.indexOf(':')).trim();
        let headerValue = ele.substring(ele.indexOf(':')+1).trim();
        obj[headerKey] = headerValue;
    });
    return obj;
}

function getBody(s) {
    let bodyData = '';
    let requestData = s.split('\r\n');
    // if the second line after the header line is empty, then body is empty
    // otherwise body is not empty and need to get to the index where the body starts
    // and slice from that index to the end of the array to get the entire body.
    if (!requestData[requestData.length-1])
        return bodyData;
    let bodyIndex = requestData.indexOf('');
    let bodyContent = requestData.slice(bodyIndex+1);
    for(let i = 0; i < bodyContent.length; i++) {
        // if we are at the last line we do not want to add a new line ('\r\n') at the end.
        // otherwise, we will do so.
        if (i === bodyContent.length - 1)
            bodyData += bodyContent[i];
        else
            bodyData += bodyContent[i] + "\r\n";
    }
    return bodyData;
}

class Request {
    constructor(s) {
        this.path = getPath(s);
        this.method = getMethod(s);
        this.headers = getHeader(s);
        this.body = getBody(s);
        this.version = 'HTTP/1.1';
    }
    toString() {
        let requestOutput = "";
        requestOutput += this.method + " " + this.path + " " + this.version + "\r\n";
        let headerKeys = Object.keys(this.headers);
        console.log(this.path);
        headerKeys.forEach(function (ele) {
            //console.log(ele);
           requestOutput += ele + ": " + this.headers[ele] + "\r\n";
        });
        // there is a \r\n before the body starts.
        requestOutput += "\r\n";
        requestOutput += this.body;

        return requestOutput;
    }
}

const server = net.createServer((sock) => {
    sock.on('data', function (data) {
        const req = new Request(data.toString());
        console.log(req.headers);
        sock.end();
    });
});
server.listen(PORT);
/*
let s = 'GET /foo.html HTTP/1.1\r\n';
s += 'Host: localhost:8080\r\n';
s += 'Referer: http://bar.baz/qux.html\r\n';
s += '\r\n';
s += 'this is part of the body\r\n';
s += 'this is another part of the body';
//console.log(s.split('\r\n'));
req = new Request(s);

console.log(req.toString());
*/
// var myString= myString.substring(myString.indexOf('_')+1)

module.exports = {
    Request: Request
}