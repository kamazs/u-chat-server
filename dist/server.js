"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = __importDefault(require("socket.io"));
const logging_1 = require("./logging");
var IncomingSocketEvent;
(function (IncomingSocketEvent) {
    IncomingSocketEvent["Connection"] = "connection";
    IncomingSocketEvent["Join"] = "join";
    IncomingSocketEvent["Message"] = "message";
    IncomingSocketEvent["Disconnect"] = "disconnect";
})(IncomingSocketEvent || (IncomingSocketEvent = {}));
var OutgoingSocketEvent;
(function (OutgoingSocketEvent) {
    OutgoingSocketEvent["Join"] = "join";
    OutgoingSocketEvent["Message"] = "message";
})(OutgoingSocketEvent || (OutgoingSocketEvent = {}));
function startServer({ port = 3000, timeOut = 20000 }) {
    const clients = [];
    const io = socket_io_1.default();
    io.on(IncomingSocketEvent.Connection, socket => {
        let client = { name: "unknown", socket, lastActivity: Date.now() };
        logging_1.logger.log({ level: "info", message: `Client connected: ${socket.id}` });
        socket.on(IncomingSocketEvent.Join, data => {
            try {
                const joinData = JSON.parse(data);
                client = {
                    name: joinData.name,
                    socket: socket,
                    lastActivity: Date.now(),
                };
                const existingClient = clients.find(entry => entry.name === joinData.name);
                if (existingClient) {
                    socket.emit(OutgoingSocketEvent.Join, JSON.stringify({ joined: false }));
                    socket.emit(OutgoingSocketEvent.Message, `:User with name ${client.name} already exists!`);
                    logging_1.logger.log({ level: "warn", message: `User with name ${client.name} already exists!` });
                    return;
                }
                clients.push(client);
                logging_1.logger.log({ level: "info", message: `User ${client.name} has joined!` });
                client.socket.emit(OutgoingSocketEvent.Join, JSON.stringify({
                    joined: true,
                    userName: client.name,
                }));
                client.socket.emit(OutgoingSocketEvent.Message, `:Welcome to u-chat ${client.name}!`);
                socket.on(IncomingSocketEvent.Message, (incomingMessage) => {
                    const message = `${client.name}:${incomingMessage}`;
                    socket.broadcast.emit(OutgoingSocketEvent.Message, message);
                    logging_1.logger.log({ level: "verbose", message });
                    client.lastActivity = Date.now();
                });
                const checkTimeOut = () => {
                    const timeSinceLastActivity = Date.now() - client.lastActivity;
                    if (timeSinceLastActivity > timeOut) {
                        const message = `${client.name} has been disconnected due to inactivity`;
                        socket.broadcast.emit(OutgoingSocketEvent.Message, message);
                        client.socket.emit(OutgoingSocketEvent.Message, ":You have been disconnected due to inactivity!");
                        logging_1.logger.log({ level: "warn", message });
                        socket.disconnect();
                        return;
                    }
                    setTimeout(checkTimeOut, timeOut);
                };
                checkTimeOut();
            }
            catch (error) {
                logging_1.logger.log({ level: "error", message: "Unexpected format for join message!", error });
            }
        });
        socket.on(IncomingSocketEvent.Disconnect, () => {
            socket.broadcast.emit(OutgoingSocketEvent.Message, `${client.name} has left`);
            logging_1.logger.log({ level: "info", message: `User ${client.name} disconnected` });
        });
    });
    const stopServer = (reason) => {
        logging_1.logger.error({ level: "error", message: `Server stopped because of ${reason}` });
        io.close();
    };
    process.once("SIGINT", () => stopServer("SIGINT"));
    process.once("SIGTERM", () => stopServer("SIGTERM"));
    io.listen(port);
}
exports.startServer = startServer;
//# sourceMappingURL=server.js.map