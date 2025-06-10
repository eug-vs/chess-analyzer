import * as BrowserRunner from "@effect/platform-browser/BrowserWorkerRunner";
import * as Runner from "@effect/platform/WorkerRunner";
import { Effect, Layer, Logger, LogLevel, pipe, Stream } from "effect";
import { BrowserRuntime } from "@effect/platform-browser";
import { EngineEvaluation, EngineRequest } from ".";

// We actually spawn a child worker.
// We could do it directly but I *really* like pool model
const worker = new Worker(new URL("/stockfish.wasm.js", location.origin));

const StockfishLive = Runner.layer<
  EngineRequest,
  never,
  never,
  EngineEvaluation
>((request) => {
  worker.postMessage(`position fen ${request.fen}`);
  worker.postMessage(`go depth ${request.depth}`);

  return Stream.fromEventListener(worker, "message").pipe(
    Stream.filter((event) => event instanceof MessageEvent),
    Stream.map((event) => event.data),
    Stream.filter((data) => typeof data === "string"),
    Stream.tap(Effect.logDebug),
    Stream.tapError(Effect.logError),
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
    Stream.takeUntil((result) => result.depth === request.depth),
  );
}).pipe(Layer.provide(BrowserRunner.layer));

BrowserRuntime.runMain(
  pipe(
    Runner.launch(StockfishLive),
    Logger.withMinimumLogLevel(LogLevel.Debug),
    Effect.withLogSpan("stockfish"),
  ),
);
