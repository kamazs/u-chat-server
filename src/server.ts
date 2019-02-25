import socketIO from "socket.io";
import { logger } from "./logging";

enum IncomingSocketEvent {
    Connection = "connection",
    Join = "join",
    Message = "message",
    Disconnect = "disconnect",
}

enum OutgoingSocketEvent {
    Join = "join",
    Message = "message",
}

type TimeStamp = number;

type Client = {
    name: string;
    socket: SocketIO.Socket;
    lastActivity: TimeStamp;
}

const userNameRegexp = new RegExp(/^[a-zA-Z]([._](?![._])|[a-zA-Z0-9]){4,21}[a-zA-Z0-9]$/);
export function isValidUsername(userName: string) {
    return userNameRegexp.test(userName);
}

export function startServer({ port = 3000, timeOut = 20000 }) {
    let clients: Client[] = [];
    const io = socketIO();

    io.on(IncomingSocketEvent.Connection, socket => {
        let client = { name: "unknown", socket, lastActivity: Date.now() };

        logger.log({ level: "info", message: `Client connected: ${socket.id}` });

        socket.on(IncomingSocketEvent.Join, userName => {

            /** Validate user name */

            if (!isValidUsername(userName)) {
                socket.emit(
                    OutgoingSocketEvent.Join,
                    JSON.stringify({ joined: false }),
                );
                socket.emit(
                    OutgoingSocketEvent.Message,
                    `:${userName} is not valid user name!`,
                );
                logger.log({ level: "warn", message: `${userName} is not valid user name!` });
                return;
            }

            /** USER name exists */

            const existingClient = clients.find(entry => entry.name === client.name);
            if (existingClient) {
                socket.emit(
                    OutgoingSocketEvent.Join,
                    JSON.stringify({ joined: false }),
                );
                socket.emit(
                    OutgoingSocketEvent.Message,
                    `:User with name ${userName} already exists!`,
                );
                logger.log({ level: "warn", message: `User with name ${userName} already exists!` });
                return;
            }

            /** New USER joined */

            client = {
                name: userName,
                socket: socket,
                lastActivity: Date.now(),
            };

            clients.push(client);
            logger.log({ level: "info", message: `User ${client.name} has joined!` });

            client.socket.emit(
                OutgoingSocketEvent.Join,
                JSON.stringify(
                    {
                        joined: true,
                        userName: client.name,
                    }
                ),
            );
            client.socket.emit(
                OutgoingSocketEvent.Message,
                `:Welcome to u-chat ${client.name}!`,
            );

            // broadcast al incoming messages from this client to rest of the clients
            socket.on(IncomingSocketEvent.Message, (incomingMessage: string) => {
                const message = `${client.name}:${incomingMessage}`;
                socket.broadcast.emit(OutgoingSocketEvent.Message, message);
                logger.log({ level: "verbose", message });
                client.lastActivity = Date.now();
            });

            // inactivity check
            const checkTimeOut = () => {
                const timeSinceLastActivity = Date.now() - client.lastActivity;
                if (timeSinceLastActivity > timeOut) {
                    const message = `:${client.name} has been disconnected due to inactivity`;
                    socket.broadcast.emit(OutgoingSocketEvent.Message, message);
                    client.socket.emit(OutgoingSocketEvent.Message, ":You have been disconnected due to inactivity!");
                    logger.log({ level: "warn", message });
                    socket.disconnect();
                    return;
                }
                setTimeout(checkTimeOut, timeOut);
            };
            checkTimeOut();
        });

        // handle disconnect from server
        socket.on(IncomingSocketEvent.Disconnect, () => {
            socket.broadcast.emit(OutgoingSocketEvent.Message, `${client.name} has left`);
            logger.log({ level: "info", message: `User ${client.name} disconnected` });
        });
    });

    const stopServer = (reason: string) => {
        logger.error({ level: "error", message: `Server stopped because of ${reason}` });
        io.close();
        clients = [];
        process.exit(0);
    }
    process.on("SIGINT", () => stopServer("SIGINT"));
    process.on("SIGTERM", () => stopServer("SIGTERM"));

    logger.log({ level: "info", message: `Server ready. Listening to ${port}` });
    io.listen(port);
}
