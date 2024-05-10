const WebSocket = require('ws');

const backendServers = ["ws://localhost:5002/","ws://localhost:5003/","ws://localhost:5004/"];

//checks the server to make sure they are available to process request
async function healthCheck() {
    const newAvailableServers = [];

    for (let i = 0; i < backendServers.length; i++) {
        const server = backendServers[i];
        const ws = new WebSocket(server);

        await new Promise((resolve, reject) => {
            ws.on('open', function() {
                console.log(`Server ${server} is available.`);
                const serverName = ["Charmeleon","Charizard","Squirtle"]
                let serverInput = { id: i + 1, name: serverName[i] + "-" + 'LB' + "-" + (i+1), url: server, data: [] };
                newAvailableServers.push(serverInput);
                ws.close();
                resolve();
            });

            ws.on('error', function(error) {
                console.log(`Error connecting to server ${server}`);
                reject(error);
            });
        });
    }
    
    return newAvailableServers;
}

module.exports = { healthCheck };
