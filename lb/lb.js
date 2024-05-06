const WebSocket = require('ws');

const backendServers = ["ws://localhost:5002/","ws://localhost:5003/"];
const availableServers=[];

const socket = new WebSocket.Server({ port: 5001 });

//checks the health of the servers to only send data to available servers
async function healthCheck() {
    for (let i = 0; i < backendServers.length; i++) {
        const server = backendServers[i];
        const ws = new WebSocket(server);

        ws.on('open', function() {
            console.log(`Server ${server} is available.`);
            availableServers.push(server)
            ws.close();
        });

        ws.on('error', function(error) {
            console.log(`Error connecting to server ${server}: ${error.message}`);
        });
    }
}

// Load balancing logic - round-robin
let pos = 0;
function getNextBackendUrl() {
    const backendUrl = availableServers[pos];
    console.log(`Request sent to ${backendUrl}`);
    pos = (pos + 1) % availableServers.length; 
    return backendUrl;
}


// Function to forward requests to backend servers
async function forwardRequestToBackend(request, backendUrl) {
    const ws = new WebSocket(backendUrl);

    ws.on('open', function(){
        console.log(`WebSocket connection opened to ${backendUrl}`);

        // Send the request data as a JSON string
        ws.send(JSON.stringify(request));
    })

    // Event listener for incoming messages from the WebSocket server
    ws.onmessage = function (event) {
        const responseData = JSON.parse(event.data);
        console.log(`Received response from ${backendUrl}:`, responseData);
       
        // Resolve the promise with the received data
        resolve(responseData);        
        ws.close();
    };
   
}

socket.on('connection', function connection(ws) {
  console.log('WebSocket client connected');

  ws.on('message', function incoming(message) {
    console.log('Received message from React client:', message);

    // load balancing logic - round-robin
    const backendUrl = getNextBackendUrl();

    // Forward the request to the backend server
    forwardRequestToBackend(message, backendUrl)

  });

  ws.on('close', function close() {
    console.log('WebSocket client disconnected');
  });
});

// Add CORS headers for WebSocket connections
socket.on('headers', (headers, request) => {
    headers.push('Access-Control-Allow-Origin: http://localhost:3000');
    headers.push('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
    headers.push('Access-Control-Allow-Methods: GET, POST, OPTIONS');
});


healthCheck()  
console.log('WebSocket load balancer running');