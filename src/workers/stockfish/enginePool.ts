import { Stream, Sink, Context, Pool } from "effect";

export interface EngineUCIWorker {
  stdout: Stream.Stream<string>;
  stdin: Sink.Sink<void, string>;
  terminate: () => void;
}

export class EnginePool extends Context.Tag("EnginePool")<
  EnginePool,
  Pool.Pool<EngineUCIWorker>
>() {}
