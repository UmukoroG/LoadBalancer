const WebSocket = require('ws');
const schedule = require('node-schedule');
const { healthCheck } = require('./healthCheckUtils');
const { getNextBackendUrl, forwardRequestToBackend, sendServerList, broadcastServerList } = require('./lbUtils');

let availableServers = []; // let availableServers = [{ id: 1, name: 'Server 1', url: 'ws://localhost:5002/' }];

//it automatically execute health checks every 10s; Make it 10s later
const job = schedule.scheduleJob('*/10 * * * * *', function(){
    healthCheck();
});


healthCheck().then(newAvailableServers => {
    const socket = new WebSocket.Server({ port: 5001 });

    availableServers = newAvailableServers;
    broadcastServerList(availableServers,socket.clients);

    // Load balancing logic - round-robin
    const getNextUrl = getNextBackendUrl(availableServers);

    socket.on('connection', function connection(ws) {
        console.log('WebSocket client connected');

        ws.on('message', function incoming(message) {
            console.log('Received message from React client:', message);

            if (message === 'getServerList') {
                console.log('serverlist sent', message);
                sendServerList(ws, availableServers);
            }  
            else {
                const backendUrl = getNextUrl();
                forwardRequestToBackend(message, backendUrl);

                //Sending server info and data to client
                const serverIndex = availableServers.findIndex(server => server.url === backendUrl);
                if (serverIndex !== -1) {
                    const messageString = message.toString('utf-8').replace(/^"(.*)"$/, '$1');
                    console.log("REQUEST IS:" , message);
                    availableServers[serverIndex].data.push(messageString)
                }

                broadcastServerList(availableServers, socket.clients);
            }
        });

        ws.on('close', function close() {
            console.log('WebSocket client disconnected');
        });

        sendServerList(ws, availableServers);
    });

    socket.on('headers', (headers, request) => {
        headers.push('Access-Control-Allow-Origin: http://localhost:3000');
        headers.push('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
        headers.push('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    });

    console.log('WebSocket load balancer running');
});
