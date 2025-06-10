import { Effect, pipe, Stream } from "effect";
import { BrowserRuntime, BrowserWorker } from "@effect/platform-browser";
import * as EffectWorker from "@effect/platform/Worker";
import { store, StoreEvent } from "./app/store";

export function parsePgns(pgns: string[]) {
  return BrowserRuntime.runMain(
    pipe(
      EffectWorker.makePool<string, StoreEvent, never>({
        size: 8,
      }),
      Effect.flatMap((pool) =>
        Effect.forEach(
          pgns,
          (pgn) =>
            pool
              .execute(pgn)
              .pipe(
                Stream.runForEach((event) =>
                  Effect.sync(() => store.send(event)),
                ),
              ),
          {
            concurrency: "unbounded",
          },
        ),
      ),
      Effect.scoped,
      Effect.provide(
        BrowserWorker.layer(
          () => new Worker(new URL("./worker.ts", import.meta.url)),
        ),
      ),
    ),
  );
}

export interface EngineRequest {
  fen: String;
  depth: number;
}
export interface EngineEvaluation {
  score: number;
  depth: number;
  bestmove: string;
}

export async function analyzePositions(fens: string[], depth = 20) {
  return BrowserRuntime.runMain(
    pipe(
      EffectWorker.makePool<EngineRequest, EngineEvaluation, never>({
        size: 8,
      }),
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
      Effect.tap(Effect.log),
      Effect.scoped,
      Effect.provide(
        BrowserWorker.layer(
          () => new Worker(new URL("./stockfish.ts", import.meta.url)),
        ),
      ),
    ),
  );
}
