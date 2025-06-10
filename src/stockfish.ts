import * as BrowserRunner from "@effect/platform-browser/BrowserWorkerRunner";
import * as Runner from "@effect/platform/WorkerRunner";
import { Effect, Layer, Stream } from "effect";
import { EngineEvaluation, EngineRequest } from "./orchestrator";

const worker = new Worker(new URL("/stockfish.wasm.js", location.origin));

const StockfishLive = Runner.layer<
  EngineRequest,
  never,
  never,
  EngineEvaluation
>((request) => {
  worker.postMessage(`position fen ${request.fen}`);
  worker.postMessage(`go depth ${request.depth}`);

  const stream = Stream.fromEventListener(worker, "message").pipe(
    Stream.filter((event) => event instanceof MessageEvent),
    Stream.map((event) => event.data),
    Stream.filter((data) => typeof data === "string"),
    Stream.filter((uciResponse) => uciResponse.startsWith(`info depth`)),
    Stream.map((uciResponse) => {
      const parts = uciResponse.split(" ");
      const bestmove = parts[parts.indexOf("pv") + 1];
      const score = Number(parts[parts.indexOf("cp") + 1]);
      const depth = Number(parts[parts.indexOf("depth") + 1]);
      return {
        score,
        depth,
        bestmove,
      };
    }),
  );

  return stream;
}).pipe(Layer.provide(BrowserRunner.layer));

Effect.runFork(Runner.launch(StockfishLive));
