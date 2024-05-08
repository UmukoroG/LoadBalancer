const WebSocket = require('ws');
const schedule = require('node-schedule')


const backendServers = ["ws://localhost:5002/","ws://localhost:5003/","ws://localhost:5004/"];
let availableServers=[];
// let availableServers = [
//     { id: 1, name: 'Server 1', url: 'ws://localhost:5002/' },
//     { id: 2, name: 'Server 2', url: 'ws://localhost:5003/' },
//     { id: 3, name: 'Server 3', url: 'ws://localhost:5004/' },
// ];

let serverData = {}; // Object to store data received from each server

const socket = new WebSocket.Server({ port: 5001 });

//checks the health of the servers to only send data to available servers
async function healthCheck() {
    const newAvailablServers = [];

    //Array to store all promises for concurrent execution
    const healthCheckPromises = []
    const serverName = ["Charmeleon","Charizard","Squirtle"]
    
    for (let i = 0; i < backendServers.length; i++) {
        const server = backendServers[i];
        const ws = new WebSocket(server);

        ws.on('open', function() {
            console.log(`Server ${server} is available.`);
            let serverInput = {id: i+1, name: serverName[i], url : server }
            newAvailablServers.push(serverInput);
            ws.close();
        });

        ws.on('error', function(error) {
            console.log(`Error connecting to server ${server}`);
        });
    }
    availableServers=newAvailablServers;
}

//it automatically execute health checks every 1s; Make it 10s later
const job = schedule.scheduleJob('*/10 * * * * *', function(){
    healthCheck();
});

// Load balancing logic - round-robin
let pos = 0;
function getNextBackendUrl() {
    const backendUrl = availableServers[pos].url;
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

        // Store the received data in the serverData object
        if (!serverData[backendUrl]) {
            serverData[backendUrl] = [];
        }
        serverData[backendUrl].push(responseData);
       
        // // Resolve the promise with the received data
        // resolve(responseData);        
        ws.close();
    };
   
}

// Function to send server list to a client

function sendServerList(ws){
    const messageData = {
        type: 'serverList',
        servers: availableServers,
    };
    ws.send(JSON.stringify(messageData));
}
function sendServerListAndData(ws) {
    const messageData = {
      type: 'serverList',
      servers: availableServers,
    //   serverData: serverData // Include server data in the message
      
    };
    ws.send(JSON.stringify(messageData));
}

socket.on('connection', function connection(ws) {
  console.log('WebSocket client connected');

  ws.on('message', function incoming(message) {
    console.log('Received message from React client:', message);


    // If the client requests the server list and data
    // if (message === 'getServerListAndData') {
    //     // Send the server list and data to the client
    //     sendServerListAndData(ws);
    // }
    // Assuming the message contains a request for server list
    if (message === 'getServerList') {
        console.log('serverlist sent', message);
        sendServerList(ws);
    }  
    else {
        // Forward the request to the backend server
        const backendUrl = getNextBackendUrl();
        forwardRequestToBackend(message, backendUrl);
      }

  });


  ws.on('close', function close() {
    console.log('WebSocket client disconnected');
  });

  // Send the server list when the client connects
  sendServerList(ws);
});

// Add CORS headers for WebSocket connections
socket.on('headers', (headers, request) => {
    headers.push('Access-Control-Allow-Origin: http://localhost:3000');
    headers.push('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept');
    headers.push('Access-Control-Allow-Methods: GET, POST, OPTIONS');
});


healthCheck()  
console.log('WebSocket load balancer running');