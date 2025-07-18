import { stringify, parse } from "superjson";
import { createStoreWithProducer, EventFromStore } from "@xstate/store";
import { produce, enableMapSet } from "immer";
import _ from "lodash";
import { useSelector } from "@xstate/store/react";
import { EngineEvaluation } from "@/workers/stockfish";

enableMapSet();

export type Side = "white" | "black";

export interface Move {
  lan: string;
  gameIds: string[];
  to: Position;
  // from: Position;
  side: Side;
}

export interface Position {
  fen: string;
  gameIds: string[];
  moves: Move[];
  eval?: EngineEvaluation;
  analysisInProgress: boolean;
}

export interface Game {
  gameId: string;
  result: 1 | 0 | -1;
  side: Side;
  opponent: string;
  date: Date;
}
type Context = {
  graph: Map<string, Position>;
  games: Map<string, Game>;
};

const STORE_KEY = "store";

const initialSnapshot =
  typeof window !== "undefined" && localStorage.getItem(STORE_KEY);

export function fenToUniqueKey(fen: string) {
  return fen.split(" ").slice(0, -2).join(" ");
}

export const store = createStoreWithProducer(produce, {
  context: initialSnapshot
    ? (parse(initialSnapshot) as Context)
    : {
        graph: new Map<string, Position>(),
        games: new Map<string, Game>(),
      },
  on: {
    addGame(context, event: { game: Game }) {
      context.games.set(event.game.gameId, event.game);
    },
    addEngineEval(context, event: { fen: string; eval: EngineEvaluation }) {
      const position = context.graph.get(fenToUniqueKey(event.fen));
      if (position && event.eval.depth >= (position.eval?.depth || 0))
        position.eval = event.eval;
    },
    addMove(
      context,
      event: {
        fromFen: string;
        lan: string;
        toFen: string;
        gameId: string;
        side: Side;
      },
    ) {
      const [from, to] = [event.fromFen, event.toFen].map((fen) => {
        const key = fenToUniqueKey(fen);
        const node = context.graph.get(key) ?? {
          fen,
          gameIds: [],
          moves: [],
          analysisInProgress: false,
        };
        if (!node.gameIds.includes(event.gameId))
          node.gameIds.push(event.gameId);
        context.graph.set(key, node);
        return node;
      });

      let existingMove = from.moves.find((m) => m.lan === event.lan);
      if (!existingMove) {
        existingMove = {
          lan: event.lan,
          side: event.side,
          gameIds: [],
          to,
        };
        from.moves.push(existingMove);
      }
      if (!existingMove.gameIds.includes(event.gameId)) {
        existingMove.gameIds.push(event.gameId);
      }
    },
    toggleAnalysisStatus(context, event: { fen: string; inProgress: boolean }) {
      const position = context.graph.get(fenToUniqueKey(event.fen));
      if (position) position.analysisInProgress = event.inProgress;
    },
  },
});

export type StoreEvent = EventFromStore<typeof store>;

const saveSnapshot = _.throttle(
  (value) => localStorage.setItem(STORE_KEY, stringify(value)),
  1000,
);

store.subscribe((snapshot) => {
  saveSnapshot(snapshot.context);
});

export function usePosition(fen: string) {
  return useSelector(store, (state) =>
    state.context.graph.get(fenToUniqueKey(fen)),
  );
}
