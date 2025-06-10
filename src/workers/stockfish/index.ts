import { store } from "@/app/store";
import { BrowserWorker } from "@effect/platform-browser";
import * as EffectWorker from "@effect/platform/Worker";
import {
  Context,
  Effect,
  Layer,
  Logger,
  LogLevel,
  ManagedRuntime,
  pipe,
  Stream,
} from "effect";

export interface EngineRequest {
  fen: String;
  depth: number;
}
export interface EngineEvaluation {
  score: number;
  depth: number;
  bestmove: string;
}

class StockfishPool extends Context.Tag("StockfishPool")<
  StockfishPool,
  EffectWorker.WorkerPool<EngineRequest, EngineEvaluation>
>() {}

const stockfishLayer = Layer.scoped(
  StockfishPool,
  pipe(
    EffectWorker.makePool<EngineRequest, EngineEvaluation, never>({
      minSize: 0,
      maxSize: 4,
      timeToLive: "1 minutes",
    }),
    Effect.provide(
      BrowserWorker.layer(
        () => new Worker(new URL("./stockfish.ts", import.meta.url)),
      ),
    ),
    Logger.withMinimumLogLevel(LogLevel.Debug),
    Effect.provide(Logger.pretty),
  ),
);

const StockfishRuntime = ManagedRuntime.make(stockfishLayer);

export async function analyzePositions(fens: string[], depth = 20) {
  return StockfishRuntime.runPromise(
    pipe(
      StockfishPool,
      Effect.flatMap((pool) =>
        Effect.forEach(
          fens,
          (fen) =>
            pool
              .execute({
                fen,
                depth,
              })
              .pipe(
                Stream.runForEach((engineEval) =>
                  Effect.sync(() =>
                    store.send({
                      type: "addEngineEval",
                      fen,
                      eval: engineEval,
                    }),
                  ),
                ),
              ),
          {
            concurrency: "unbounded",
          },
        ),
      ),
      Effect.tapError(Effect.logError),
    ),
  );
}
