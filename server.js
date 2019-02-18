const http = require('http');
const url = require('url');

const mimeTypes = {
    'html': 'text/html',
    'jpeg': 'image/jpeg',
    'jpg': 'image/jpeg',
    'gif': 'image/gif',
    'js': 'text/javascript',
    'css': 'text/css',
};

const blacklist = [
    'http://ocsp.digicert.com/',
    'http://clients1.google.com/ocsp',
];

let virtualDate = '2000';

http.createServer(function (request, response) {
    // TODO: Implement a whitelist to pass on to normal internets
    // TODO: Implement a wayback query to get a date for a thing
    const requestUrl = url.parse(request.url);

    if (requestUrl.hostname === 'setdate') {
        setDate (requestUrl, response);
    } else if (requestUrl.hostname === 'getdate') {
        getDate (response);
    } else if (!blacklist.includes(request.url)) {
        wayBack (requestUrl, response);
    }
}).listen(8080);

const getDate = (response) => {
    response.writeHead(200, {
        'Content-Type': 'text/html',
    });
    response.end(`Date set to: ${virtualDate}`, 'utf8');
};

const setDate = (requestUrl, response) => {
    virtualDate = requestUrl.pathname.split('/').pop();
    // TODO: validate the date
    response.writeHead(200, {
        'Content-Type': 'text/html',
    });
    response.end(`Date set to: ${virtualDate}`, 'utf8');
};

//TODO: pull wayback getter to separate module
const wayBack = (requestUrl, response) => {
    // TODO: cache dates for recent urls
    const ext = requestUrl.pathname.split('.').pop();
    const contentType = mimeTypes[ext] || 'text/html';
    const waybackUrl = `http://web.archive.org/web/${virtualDate}id_/${requestUrl.href}`;

    const proxyServe = (proxyUrl) => {
        const req = http.get(proxyUrl, (res) => {
            const { statusCode } = res;
            if (statusCode === 302 ) {
                proxyServe(url.parse(res.headers['location']));
            } else {
                const data = [];
                res.on('data', (chunk) => {
                    data.push(chunk);
                });
                res.on('end', () => {
                    const buffer = Buffer.concat(data);
                    response.writeHead(200, {
                        'Content-Type': contentType,
                    });
                    response.end(buffer, 'binary');
                });
            }
        });
        req.on('error', (ex) => {
            console.log('///////////// Error with the request /////////////');
            console.log ('Path: ' + req.path);
            console.log ('ex: ' + ex);
        });
    };

    proxyServe(waybackUrl);
};
