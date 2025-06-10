import { store } from "@/app/store";
import {
  Context,
  Effect,
  Layer,
  Logger,
  LogLevel,
  ManagedRuntime,
  pipe,
  Pool,
  Stream,
} from "effect";

export interface EngineRequest {
  fen: string;
  depth: number;
}
export interface EngineEvaluation {
  score: number;
  depth: number;
  bestmove: string;
}

class StockfishPool extends Context.Tag("StockfishPool")<
  StockfishPool,
  Pool.Pool<Worker>
>() {}

const pool = Pool.makeWithTTL({
  min: 0,
  max: navigator.hardwareConcurrency - 1,
  timeToLive: "30 seconds",
  concurrency: 1,
  acquire: Effect.acquireRelease(
    Effect.sync(
      () => new Worker(new URL("/stockfish.wasm.js", location.origin)),
    ).pipe(Effect.tap((worker) => Effect.log("Spawned new worker", worker))),
    (worker) =>
      Effect.sync(() => worker.terminate()).pipe(
        Effect.tap((worker) => Effect.log("Terminating worker", worker)),
      ),
  ),
});

const stockfishLayer = Layer.scoped(StockfishPool, pool);

const StockfishRuntime = ManagedRuntime.make(stockfishLayer);

export async function analyzePositions(fens: string[], depth = 20) {
  const analyzePosition = (fen: string, depth: number) =>
    StockfishPool.pipe(
      Effect.flatMap((pool) => pool.get),
      Effect.ensuring(Effect.logDebug("analyzePosition finalizer")),
      Effect.flatMap((stockfish) =>
        pipe(
          Effect.sync(() => {
            stockfish.postMessage(`ucinewgame`);
            stockfish.postMessage(`position fen ${fen}`);
            stockfish.postMessage(`go depth ${depth}`);
          }),
          Effect.flatMap(() => {
            return Stream.fromEventListener(stockfish, "message").pipe(
              Stream.filter((event) => event instanceof MessageEvent),
              Stream.map((event) => event.data),
              Stream.filter((data) => typeof data === "string"),
              Stream.tap(Effect.logDebug),
              Stream.tapError(Effect.logError),
              Stream.takeUntil((result) => result.startsWith(`bestmove`)),
              Stream.filter((result) => result.startsWith("info depth")),
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
              Stream.runForEach((engineResult) =>
                Effect.sync(() => {
                  store.send({
                    type: "addEngineEval",
                    fen,
                    eval: engineResult,
                  });
                }),
              ),
            );
          }),
          Effect.withLogSpan("stockfish"),
        ),
      ),
      Effect.scoped,
      Effect.withLogSpan(`analyzePosition`),
    );

  return StockfishRuntime.runPromise(
    pipe(
      Effect.forEach(fens, (fen) => analyzePosition(fen, depth), {
        concurrency: "unbounded",
      }),
      Effect.provide(Logger.pretty),
      Effect.tapError(Effect.logError),
      Logger.withMinimumLogLevel(LogLevel.Debug),
    ),
  );
}
