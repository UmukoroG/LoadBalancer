const express = require('express')
const WebSocket = require('ws')
const app = express()
const port = 5003

const server = app.listen(port, () => {
    console.log(`listening on port ${port}`)
})

//create a webSocket server that attaches to the HTTP Server
const socket = new WebSocket.Server({server})

//websocket connection handling
socket.on('connection',function connection(ws){
    console.log("Server2 websocket client connected")

    ws.on('close',function(event) {
        console.log("Server2 webSocket connection closed:", event.reason);
    });
})

