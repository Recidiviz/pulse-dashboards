import { buildServer } from "~sentencing-server/server";

const host = process.env["HOST"] ?? "localhost";
const port = process.env["PORT"] ? Number(process.env["PORT"]) : 3002;

const server = buildServer();

// Start listening.
server.listen({ port, host }, (err) => {
  if (err) {
    server.log.error(err);
    process.exit(1);
  } else {
    console.log(`[ ready ] http://${host}:${port}`);
  }
});
