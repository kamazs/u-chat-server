"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function welcome(client) {
    client.socket.send("Welcome to chat!");
}
exports.welcome = welcome;
//# sourceMappingURL=welcome.js.map