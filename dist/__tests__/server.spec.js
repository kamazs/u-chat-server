"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("../server");
describe("server", () => {
    it("should send welcome message to client", () => {
        const client = { send: jest.fn() };
        server_1.welcome(client);
        expect(client.send).toHaveBeenCalledWith("Welcome to chat!");
    });
});
//# sourceMappingURL=server.spec.js.map