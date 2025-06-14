import { Sink, pipe, Effect, Stream, Layer, Pool } from "effect";
import { EngineUCIWorker, EnginePool } from "./enginePool";

class StockfishWebWorker extends Worker implements EngineUCIWorker {
  stdin: Sink.Sink<void, string>;
  stdout: Stream.Stream<string>;
  constructor() {
    super(new URL("/stockfish.wasm.js", location.origin));

    this.stdout = pipe(
      Stream.fromEventListener(this, "message"),
      Stream.filter((event) => event instanceof MessageEvent),
      Stream.map((event) => event.data),
      Stream.filter((data) => typeof data === "string"),
    );

    this.stdin = Sink.forEach((input: string) =>
      Effect.all([
        Effect.log(input),
        Effect.sync(() => this.postMessage(input)),
      ]),
    );
  }
}

export const webWorkersLayer = Layer.scoped(
  EnginePool,
  Pool.makeWithTTL({
    min: 0,
    max: navigator.hardwareConcurrency - 1,
    timeToLive: "5 seconds",
    concurrency: 1,
    acquire: Effect.acquireRelease(
      Effect.sync(() => new StockfishWebWorker() as EngineUCIWorker).pipe(
        Effect.tap((worker) => Effect.log("Spawned new worker", worker)),
      ),
      (worker) =>
        Effect.sync(() => worker.terminate()).pipe(
          Effect.tap((worker) => Effect.log("Terminating worker", worker)),
        ),
    ),
  }),
);
