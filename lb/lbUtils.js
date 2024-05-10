const WebSocket = require('ws');

function getNextBackendUrl(availableServers) {
    let pos = 0;
    return function() {
        const backendUrl = availableServers[pos].url;
        console.log(`Request sent to ${backendUrl}`);
        pos = (pos + 1) % availableServers.length; 
        return backendUrl;
    };
}

function forwardRequestToBackend(request, backendUrl) {
    const ws = new WebSocket(backendUrl);

    ws.on('open', function(){
        console.log(`WebSocket connection opened to ${backendUrl}`);
        ws.send(JSON.stringify(request));
    });

    ws.onmessage = function (event) {
        const responseData = JSON.parse(event.data);
        console.log(`Received response from ${backendUrl}:`, responseData);
        ws.close();
    };
}

function sendServerList(ws, availableServers) {
    const messageData = {
        type: 'serverList',
        servers: availableServers,
    };
    ws.send(JSON.stringify(messageData));
}

// Broadcast server data to all connected clients in real time
const broadcastServerList = (serverList, clients) => {
    const serverListMessage = JSON.stringify({ type: 'serverList', servers: serverList });
    console.log("BROADCASTINGGGGGGGGG WORKINGGGGGG")
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(serverListMessage);
        }
    });
};

module.exports = { getNextBackendUrl, forwardRequestToBackend, sendServerList, broadcastServerList };
