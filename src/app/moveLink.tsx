import { Key } from "@lichess-org/chessground/types";
import PositionLink from "./positionLink";
import { fenToUniqueKey, Move, store } from "./store";
import { useSelector } from "@xstate/store/react";

interface Props {
  move: Move;
}

function lanToKeys(lan: string): [Key, Key] {
  return [lan.slice(0, 2) as Key, lan.slice(2, 4) as Key];
}

export default function MoveLink({ move }: Props) {
  const graph = useSelector(store, (state) => state.context.graph);
  const from = graph
    .values()
    .find((pos) =>
      pos.moves.some((m) => m.lan === move.lan && m.to.fen === move.to.fen),
    );
  const to = graph.get(fenToUniqueKey(move.to.fen));
  return (
    <PositionLink
      key={move.lan}
      fen={move.to.fen}
      orientation={move.side}
      lastMove={lanToKeys(move.lan)}
    >
      <div className="font-bold text-lg">
        {move.lan} ({move.gameIds.length} games)
      </div>
      <div className="font-bold text-lg">Eval: {to?.eval?.score}</div>
      <div className="font-bold text-lg">
        Swing: {-(to?.eval?.score! + from?.eval?.score!)}
      </div>
    </PositionLink>
  );
}
