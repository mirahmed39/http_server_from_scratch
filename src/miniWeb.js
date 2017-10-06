// miniWeb.js
// define your Request, Response and App objects here
// evenWarmer.js
// create Request and Response constructors...

const net = require('net');
const fs = require('fs');
const path = require('path');

class Request {
    constructor(s) {
        //pre-processing for headers and body
        let headerData = {};
        let bodyData = '';
        let bodyArray = s.split('\r\n').slice(s.split('\r\n').indexOf('') + 1);
        let headerArray = s.split('\r\n').slice(1, s.split('\r\n').indexOf(''));
        headerArray.forEach(function (ele) {
            let key = ele.slice(0, ele.indexOf(':')).trim();
            let value = ele.slice(ele.indexOf(':')+2).trim();
            headerData[key] = value;
        });
        if (!bodyArray[0])
            bodyData = '';
        else {
            for(let i = 0; i < bodyArray.length; i++) {
                if (i === bodyArray.length - 1)
                    bodyData += bodyArray[i];
                else
                    bodyData += bodyArray[i] + "\r\n";
            }
        }
        //property initialization
        this.path = s.split(' ')[1];
        this.method = s.split(' ')[0];
        this.headers = headerData;
        this.body = bodyData;
        this.version = 'HTTP/1.1';
    }
    toString() {
        let requestOutput = "";
        requestOutput += this.method + " " + this.path + " " + this.version + "\r\n";
        for (let key in this.headers) {
            requestOutput += key + ": " + this.headers[key] + "\r\n";
        }
        // there is a \r\n before the body starts.
        requestOutput += "\r\n";
        requestOutput += this.body;
        return requestOutput;
    }
}

class Response {
    constructor(socket) {
        this.statCode = {
            200: 'OK',
            404: 'Not Found',
            500: 'Internal Server Error',
            400: 'Bad Request',
            301: 'Moved Permanently',
            302: 'Found',
            303: 'See Other'
        };
        this.sock = socket;
        this.headers = {};
        this.body = "";
        this.statusCode = NaN; // by default
        this.version = 'HTTP/1.1';
    }
    setHeader(name, value) {
        this.headers[name] = value;
    }
    write(data) {
        this.sock.write(data);
    }
    end(s) {
        this.sock.end(s);
    }
    send(statusCode, body) {
        let responseOutput = "";
        this.statusCode = statusCode;
        this.body = body;
        responseOutput += this.version + " " + this.statusCode + " " + this.statCode[statusCode] + "\r\n";
        responseOutput += this.printHeaders();
        responseOutput += body;
        this.end(responseOutput);
    }
    writeHead(statusCode) {
        let responseOutput = "";
        this.statusCode = statusCode;
        responseOutput += this.version + " " + this.statusCode + " " + this.statCode[statusCode] + "\r\n";
        responseOutput += this.printHeaders();
        this.write(responseOutput);
    }
    redirect(statusCode, url) {
        let responseOutput = "";
        if(arguments.length === 1) {
            this.statusCode = 301;
            this.setHeader('Location', statusCode);
        }
        else {
            this.statusCode = statusCode;
            this.setHeader('Location', url);
        }
        responseOutput += this.version + " " + this.statusCode + " " + this.statCode[this.statusCode] + "\r\n";
        responseOutput += this.printHeaders();
        this.end(responseOutput);
    }
    toString() {
        let responseOutput = this.version + " " + this.statusCode + " " + this.statCode[this.statusCode] + "\r\n";
        responseOutput += this.printHeaders();
        responseOutput += this.body;
        return responseOutput;
    }
    // helper function
    printHeaders() {
        let headerOutput = "";
        for(let key in this.headers) {
            if (this.headers.hasOwnProperty(key))
                headerOutput += key + ": " + this.headers[key] + "\r\n";
        }
        return headerOutput+"\r\n";
    }
    sendFile(fileName) {
        const fileTypes = {
            jpeg: "image/jpg",
            jpg: "image/jpg",
            png: "image/png",
            gif: "image/gif",
            html: "text/html",
            css: "text/css",
            txt: "text/plain"
        };
        const fileParts = fileName.split('/');
        const onlyFileName = fileParts[fileParts.length-1];
        let publicRoot = path.join(__dirname, '/../public');
        const filePath = path.join(publicRoot,fileName);
        const fileExtension = onlyFileName.split('.')[1];
        const contentType = fileTypes[fileExtension];
        if (fileExtension === 'html' || fileExtension === 'css' || fileExtension === 'txt'){
            fs.readFile(filePath,'utf8' ,(err, data) => {
                this.handleRead(contentType, err, data);
            });
        } else {
            fs.readFile(filePath, (err, data) => {
                this.handleRead(contentType, err, data);
            });
        }
    }
    handleRead(contentType, err, data) {
        if(err) {
            this.writeHead(500);
            this.end("Something went wrong reading the file");
        }
        else {
            this.setHeader('Content-Type', contentType);
            this.writeHead(200);
            this.write(data);
            this.end();
        }
    }

}

class App {
    constructor() {
        this.server = net.createServer(this.handleConnection.bind(this));
        this.routes = {};
    }
    get(path, cb) {
        this.routes[path] = cb;
    }
    listen(port, host) {
        this.server.listen(port, host);
    }
    handleConnection(sock) {
        sock.on('data', this.handleRequestData.bind(this, sock));
    }
    handleRequestData(sock, binaryData) {
        const stringData = binaryData.toString();
        const req = new Request(stringData);
        const res = new Response(sock);
        sock.on('close', this.logResponse.bind(this, req, res));
        let path = req.path;
        if (path.charAt(path.length-1) === '/' && path.length !== 1) {
            path = path.slice(0, path.length - 1);
        }
        if(req.headers.hasOwnProperty('Host') && this.routes.hasOwnProperty(path)) {
            let callBack = this.routes[path];
            callBack(req, res);
        }
        else {
            res.writeHead(404);
            res.end("404 not found!!!");
        }
    }
    logResponse(req, res) {
        let output = req.method + " " + req.path + " - " + res.statusCode + " " + res.statCode[res.statusCode];
        console.log(output);
    }
}

module.exports = {
    App: App,
    Request: Request,
    Response: Response,
};