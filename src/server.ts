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

export function startServer({ port = 3000, timeOut = 20000 }) {
    const clients: Client[] = [];
    const io = socketIO();

    io.on(IncomingSocketEvent.Connection, socket => {
        let client = { name: "unknown", socket, lastActivity: Date.now() };

        logger.log({ level: "info", message: `Client connected: ${socket.id}` });

        socket.on(IncomingSocketEvent.Join, data => {

            try {
                const joinData = JSON.parse(data);

                client = {
                    name: joinData.name,
                    socket: socket,
                    lastActivity: Date.now(),
                }

                const existingClient = clients.find(entry => entry.name === joinData.name);
                if (existingClient) {
                    socket.emit(
                        OutgoingSocketEvent.Join,
                        JSON.stringify({ joined: false }
                        ),
                    );
                    socket.emit(
                        OutgoingSocketEvent.Message,
                        `:User with name ${client.name} already exists!`,
                    );
                    logger.log({ level: "warn", message: `User with name ${client.name} already exists!` });
                    return;
                }

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

                socket.on(IncomingSocketEvent.Message, (incomingMessage: string) => {
                    const message = `${client.name}:${incomingMessage}`;
                    socket.broadcast.emit(OutgoingSocketEvent.Message, message);
                    logger.log({ level: "verbose", message });
                    client.lastActivity = Date.now();
                });

                const checkTimeOut = () => {
                    const timeSinceLastActivity = Date.now() - client.lastActivity;
                    if (timeSinceLastActivity > timeOut) {
                        const message = `${client.name} has been disconnected due to inactivity`;
                        socket.broadcast.emit(OutgoingSocketEvent.Message, message);
                        client.socket.emit(OutgoingSocketEvent.Message, ":You have been disconnected due to inactivity!");
                        logger.log({ level: "warn", message });
                        socket.disconnect();
                        return;
                    }
                    setTimeout(checkTimeOut, timeOut);
                };
                checkTimeOut();
            } catch (error) {
                logger.log({ level: "error", message: "Unexpected format for join message!", error });
            }
        });

        socket.on(IncomingSocketEvent.Disconnect, () => {
            socket.broadcast.emit(OutgoingSocketEvent.Message, `${client.name} has left`);
            logger.log({ level: "info", message: `User ${client.name} disconnected` });
        });
    });

    const stopServer = (reason: string) => {
        logger.error({ level: "error", message: `Server stopped because of ${reason}` });
        io.close();
    }
    process.once("SIGINT", () => stopServer("SIGINT"));
    process.once("SIGTERM", () => stopServer("SIGTERM"));

    io.listen(port);
}
