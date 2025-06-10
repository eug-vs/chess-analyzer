import { store, StoreEvent } from "@/app/store";
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

class ChessPool extends Context.Tag("ChessPool")<
  ChessPool,
  EffectWorker.WorkerPool<string, StoreEvent>
>() {}

const chessPoolLayer = Layer.scoped(
  ChessPool,
  pipe(
    EffectWorker.makePool<string, StoreEvent, never>({
      minSize: 0,
      maxSize: 16,
      timeToLive: "30 seconds",
    }),
    Effect.provide(
      BrowserWorker.layer(
        () => new Worker(new URL("./worker.ts", import.meta.url)),
      ),
    ),
    Logger.withMinimumLogLevel(LogLevel.Debug),
    Effect.provide(Logger.pretty),
  ),
);

const ChessRuntime = ManagedRuntime.make(chessPoolLayer);

export function parsePgns(pgns: string[]) {
  return ChessRuntime.runPromise(
    pipe(
      ChessPool,
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
    ),
  );
}
