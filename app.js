require("dotenv").config();
const express = require("express");
const app = express();
const morgan = require("morgan");
const Sentry = require("@sentry/node");
const { PORT = 3000, SENTRY_DSN } = process.env;
const { Server } = require("socket.io");
const { createServer } = require("node:http");
const server = createServer(app);

// const io = new Server(server);
global.io = new Server(server);
app.use(Sentry.Handlers.tracingHandler());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");


const authRouter = require("./routes/auth.routes");

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});
// socket.io
io.on("connection", (socket) => {
  console.log("user Conected");
});

app.use(Sentry.Handlers.requestHandler());

// use route
app.get("/test", (req, res) => {
  res.send("succest");
});
app.use("/api/v1", authRouter);
// end use route

app.use(Sentry.Handlers.errorHandler());

server.listen(PORT, () => console.log("Listening on port", PORT));
