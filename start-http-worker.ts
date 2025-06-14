import { spawn } from "child_process";
import { createServer } from "http";
import { Writable } from "stream";

const workers = new Map<string, Writable>();

const port = process.env.PORT ? Number(process.env.PORT) : 6969;
const cmd = process.argv[2] || "stockfish";

/**
 * Wraps an engine command (or actually *any* command)
 * into a simple HTTP server that pipes:
 *  - STDOUT -> EventSource-compatible stream (SSE)
 *  - Request body -> STDIN
 *
 * The request URL determines session ID
 * Closing SSE connection will terminate the session
 *
 * WARN: GET here is NOT idempotent (creates process on-the-fly)
 * Because EventSource can't send POST request,
 * and doing it via plain fetch is not very ergonomic
 */
const server = createServer(async (req, res) => {
  const id = req.url!;
  if (req.method === "GET") {
    console.log(`Spawn worker ${id}`);
    const ps = spawn(cmd);
    workers.set(id, ps.stdin);

    res.writeHead(200, "OK", {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    ps.stdout.on("data", (chunk: Uint8Array) => {
      chunk
        .toString()
        .trim()
        .split("\n")
        .forEach((line) => {
          res.write(`data: ${line}\n\n`);
        });
    });

    ps.on("exit", (code) => {
      console.log(`Worker ${id} exited with code ${code}`);
      res.end();
    });

    req.on("close", () => {
      console.log(`Terminate worker ${id}`);
      ps.kill();
    });
  } else if (req.method === "POST") {
    const stdin = workers.get(id);
    if (!stdin) throw new Error(`No such worker ${id}`);
    req.on("data", (chunk) => stdin.write(chunk));
    req.on("end", () => stdin.write("\nucinewgame\n"));
    req.on("end", () => res.end());
  }
});

server.listen(port);
console.log(`Server started at port ${port} for CMD: ${cmd}`);
