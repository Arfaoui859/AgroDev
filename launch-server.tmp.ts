import { createServer } from "./server/index";
const app = createServer();
const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log("agrogrowth api listening on", port));
