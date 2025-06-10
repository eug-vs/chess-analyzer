import { Effect, pipe, Stream } from "effect";
import { BrowserRuntime, BrowserWorker } from "@effect/platform-browser";
import { makePool } from "@effect/platform/Worker";
import { store, StoreEvent } from "./app/store";

export function parsePgns(pgns: string[]) {
  return BrowserRuntime.runMain(
    pipe(
      makePool<string, StoreEvent, never>({
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
