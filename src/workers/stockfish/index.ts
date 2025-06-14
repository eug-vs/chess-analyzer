import { fenToUniqueKey, store } from "@/app/store";
import { Effect, Logger, LogLevel, ManagedRuntime, pipe, Stream } from "effect";
import { webWorkersLayer } from "./webWorker";
import { httpWorkersLayer } from "./httpWorker";
import { EnginePool } from "./enginePool";

export interface EngineRequest {
  fen: string;
  depth: number;
}
export interface EngineEvaluation {
  score: number;
  depth: number;
  bestmove: string;
}

const USE_HTTP_WORKERS = false;

const engineRuntime = ManagedRuntime.make(
  USE_HTTP_WORKERS ? httpWorkersLayer : webWorkersLayer,
);

export async function analyzePositions(fens: string[], depth = 20) {
  const analyzePosition = (fen: string, depth: number) =>
    EnginePool.pipe(
      Effect.flatMap((pool) => pool.get),
      Effect.flatMap((engine) =>
        pipe(
          Stream.make(`ucinewgame`, `position fen ${fen}`, `go depth ${depth}`),
          Stream.run(engine.stdin),
          Effect.flatMap(() =>
            Effect.acquireUseRelease(
              Effect.sync(() =>
                store.send({
                  type: "toggleAnalysisStatus",
                  fen,
                  inProgress: true,
                }),
              ),
              () =>
                engine.stdout.pipe(
                  Stream.tap(Effect.logDebug),
                  Stream.tapError(Effect.logError),
                  Stream.takeUntil((result) => result.startsWith("bestmove")),
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
                ),
              () =>
                Effect.sync(() =>
                  store.send({
                    type: "toggleAnalysisStatus",
                    fen,
                    inProgress: false,
                  }),
                ),
            ),
          ),
          Effect.withLogSpan("stockfish"),
        ),
      ),
      Effect.scoped,
      Effect.withLogSpan(`analyzePosition`),
    );

  return engineRuntime.runPromise(
    pipe(
      Effect.forEach(
        fens,
        (fen) =>
          analyzePosition(fen, depth).pipe(
            Effect.when(
              () =>
                (store
                  .select((state) => state.graph.get(fenToUniqueKey(fen)))
                  .get()?.eval?.depth || 0) < depth,
            ),
          ),
        {
          concurrency: "unbounded",
        },
      ),
      Effect.provide(Logger.pretty),
      Effect.tapError(Effect.logError),
      Logger.withMinimumLogLevel(LogLevel.Debug),
    ),
  );
}
