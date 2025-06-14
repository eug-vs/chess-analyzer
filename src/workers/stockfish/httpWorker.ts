import { Sink, pipe, Effect, Stream, Layer, Pool } from "effect";
import { EngineUCIWorker, EnginePool } from "./enginePool";

/**
 * A worker that talks to an HTTP server that wraps UCI protocol into a simple SSE endpoint
 * Run such server locally via `start-worker` script
 */
class StockfishHTTPWorker extends EventSource implements EngineUCIWorker {
  stdin: Sink.Sink<void, string>;
  stdout: Stream.Stream<string>;
  constructor(public url: string) {
    super(url);

    this.stdout = pipe(
      Stream.fromEventListener(this, "message"),
      Stream.filter((event) => event instanceof MessageEvent),
      Stream.map((event) => event.data),
      Stream.filter((data) => typeof data === "string"),
    );

    this.stdin = Sink.forEach((input: string) =>
      Effect.promise((signal) =>
        fetch(url, {
          method: "POST",
          body: input,
          signal,
        }),
      ),
    );
  }
  terminate() {
    this.close();
  }
}

export const httpWorkersLayer = Layer.scoped(
  EnginePool,
  Pool.makeWithTTL({
    min: 0,
    max: navigator.hardwareConcurrency - 1,
    timeToLive: "5 seconds",
    concurrency: 1,
    acquire: Effect.acquireRelease(
      Effect.sync(
        () =>
          new StockfishHTTPWorker(
            `http://localhost:6969/${Math.random()}`,
          ) as EngineUCIWorker,
      ).pipe(Effect.tap(() => Effect.log(`Spawned new worker`))),
      (worker) =>
        Effect.sync(() => worker.terminate()).pipe(
          Effect.tap((worker) => Effect.log("Terminating worker", worker)),
        ),
    ),
  }),
);
