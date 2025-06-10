import { store } from "@/app/store";
import { Chess } from "chess.js";
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

function checkMoveValidity(fen: string, lan: string) {
  return Effect.try(() => {
    const board = new Chess(fen);
    board.move(lan);
  }).pipe(
    Effect.catchAll((e) =>
      Effect.logError(
        `Could not apply best move ${lan} for fen ${fen}, ${e.message}`,
      ),
    ),
  );
}

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
            let lastSeenDepth = 0;
            return Stream.fromEventListener(stockfish, "message").pipe(
              Stream.filter((event) => event instanceof MessageEvent),
              Stream.map((event) => event.data),
              Stream.filter((data) => typeof data === "string"),
              Stream.tap(Effect.logDebug),
              Stream.tapError(Effect.logError),
              // Make sure messages are coming in the correct order
              // This is actually preventing some very nasty bug
              // that I don't even fully comprehend
              Stream.dropUntil((uciResponse) =>
                uciResponse.startsWith(`info depth ${lastSeenDepth + 1}`),
              ),
              Stream.tap(() => Effect.sync(() => lastSeenDepth++)),
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
              Stream.tap((data) => checkMoveValidity(fen, data.bestmove)),
              Stream.takeUntil((result) => result.depth === depth),
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
