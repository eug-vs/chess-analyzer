import PositionLink from "./positionLink";
import { fenToUniqueKey, Move, store } from "./store";
import { useSelector } from "@xstate/store/react";

interface Props {
  move: Move;
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
      fen={move.to.fen}
      orientation={move.side}
      lastMoveLan={move.lan}
      // drawable={{
      //   visible: true,
      //   autoShapes: [
      //     {
      //       orig: from?.eval?.bestmove.slice(0, 2),
      //       dest: from?.eval?.bestmove.slice(2, 4),
      //       brush: "a",
      //     },
      //   ],
      //   brushes: {
      //     a: {
      //       key: "a",
      //       opacity: 0.5,
      //       color: "red",
      //       lineWidth: 10,
      //     },
      //   },
      // }}
    >
      <div className="font-bold text-lg">
        {move.lan} ({move.gameIds.length} games)
      </div>
      <div className="font-bold text-lg">Eval: {to?.eval?.score}</div>
      <div className="font-bold text-lg">
        CPL: {-((to?.eval?.score || 0) + (from?.eval?.score || 0))}
      </div>
    </PositionLink>
  );
}
