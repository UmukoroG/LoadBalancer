const express = require('express')
const WebSocket = require('ws')
const {insertData} = require('../database/query')
const app = express()
const port = 5004

const server = app.listen(port, () => {
    console.log(`listening on port ${port}`)
})

//create a webSocket server that attaches to the HTTP Server
const socket = new WebSocket.Server({server})

//websocket connection handling
socket.on('connection',function connection(ws){
    console.log("Server3 websocket client connected")

    ws.on('message', function (event) {
        // Parse the received message as JSON
        const parsedMessage = JSON.parse(event);

        // Check if the parsed message has a 'type' field indicating it's a buffer
        if (parsedMessage && parsedMessage.type === "Buffer" && Array.isArray(parsedMessage.data)) {
            // Convert the buffer data to a string
            const responseData = Buffer.from(parsedMessage.data).toString('utf-8');
            // console.log("received message on server3", responseData);

            // insert data in a database
            insertData(responseData);
            
        }
    });


    ws.on('close',function(event) {
        console.log("Server3 webSocket connection closed:", event.reason);
    });
})

