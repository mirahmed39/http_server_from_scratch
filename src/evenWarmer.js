// evenWarmer.js
// create Request and Response constructors...

const net = require('net');
const fs = require('fs');
const path = require('path');
const HOST = '127.0.0.1';
const PORT = 8080;

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

const server = net.createServer((sock) => {
    sock.on('data', function (data) {
        const req = new Request(data.toString());
        const res = new Response(sock);
        if (req.path === '/') {
            res.setHeader('Content-Type', 'text/html');
            res.send(200, "<link rel=\"stylesheet\" type=\"text/css\" href=\"/foo.css\"><h2>This is a red header</h2><em>hello</em><strong>world</strong>")
        }
        else if(req.path === '/foo.css') {
            res.setHeader('Content-Type', 'text/css');
            res.send(200, 'h2 {color: red;}');
        }
        else if (req.path === '/test') {
            res.sendFile('/html/test.html');
        }
        else if(req.path === '/bmo1.gif') {
            res.sendFile('/img/bmo1.gif');
        }
        else {
            res.setHeader('Content-Type', 'text/plain');
            res.send(404,'uh oh... 404 page not found!');
        }
    });
});
server.listen(PORT, HOST);

module.exports = {
    Request: Request,
    Response: Response
};
