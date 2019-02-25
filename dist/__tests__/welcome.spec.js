"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const welcome_1 = require("../welcome");
describe("server", () => {
    it("should send welcome message to client", () => {
        const client = { send: jest.fn() };
        welcome_1.welcome(client);
        expect(client.send).toHaveBeenCalledWith("Welcome to chat!");
    });
});
//# sourceMappingURL=welcome.spec.js.map