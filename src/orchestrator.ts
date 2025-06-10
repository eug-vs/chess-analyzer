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

export async function analyzePosition(fen: string, depth = 20) {
  const worker = new Worker("/stockfish.wasm.js");

  return new Promise<void>((resolve, reject) => {
    worker.addEventListener("message", (message: MessageEvent<string>) => {
      console.log(message.data);
      if (message.data.startsWith(`info depth ${depth}`)) resolve();

      const match = message.data.match(/score cp (-?\d+)/)?.[1];
      if (match) {
        store.send({ type: "addEval", eval: Number(match), fen });
      }
    });

    worker.addEventListener("error", reject);
    worker.addEventListener("messageerror", reject);

    worker.postMessage(`position fen ${fen}`);
    worker.postMessage(`go depth ${depth}`);
  }).finally(() => worker.terminate());
}
