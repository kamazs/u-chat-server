# Full Stack Chat Task (SERVER)
In this task, you need to create a chatroom web app which allow multiple users login/send message/receive message simultaneously. 
The task is to create a chat client and server application. Create separate projects for server and client, and submit your solution as GitHub repository links. Detailed requirements follow. 

1. Sends received messages to all connected clients (no rooms).
2. If a client is silent for more than a certain (configurable) amount of time, it is 
disconnected; a message about the event (e.g. "John was disconnected due to inactivity") is sent to all connected clients.
3. If a client is disconnected, but not due to inactivity, a different message is sent (e.g. 
"John left the chat, connection lost" instead.)
4. Doesn't allow multiple active users with the same nickname.
5. Validates data received over the network.
6. Terminates gracefully upon receiving SIGINT or SIGTERM signals.
7. Provide readable logging solution 

## How to
1. Checkout the repo
2. `npm install` in project directory to set up dependencies
3. `npm run build` to build the server
4. `npm run serve` to start it up
5. join with `u-chat-client`
