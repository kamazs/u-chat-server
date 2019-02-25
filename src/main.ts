import { startServer } from "./server";

startServer({
    port: 3000,
    // 5 min to time out
    timeOut: 300000,
});
