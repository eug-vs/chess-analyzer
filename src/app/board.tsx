"use client";
import Chessground from "@react-chess/chessground";
import "./chessground.css";
import { useIntersectionObserver, usePrevious } from "@uidotdev/usehooks";
import { useSelector } from "@xstate/store/react";
import { fenToUniqueKey, store } from "./store";
import { extractSideToMove } from "./utils";
import { Key } from "@lichess-org/chessground/types";

type Props = Omit<
  NonNullable<React.ComponentProps<typeof Chessground>["config"]>,
  "lastMove"
> & {
  fen: string;
  lastMoveLan?: string;
  arrowLans?: string[];
};
const sigmoid = (x: number) => 1 / (1 + Math.exp(-x / 200));

function EvalBar({ fen, orientation }: Pick<Props, "fen" | "orientation">) {
  const engineEval = useSelector(
    store,
    (state) => state.context.graph.get(fenToUniqueKey(fen))?.eval?.score,
  );
  const sideToMove = extractSideToMove(fen);
  const sign = sideToMove === orientation ? -1 : 1;

  return (
    <div className="relative w-[3%] shrink-0">
      <div
        className="z-10 h-full w-full absolute left-0"
        style={{ background: orientation }}
      ></div>
      <div
        style={{
          height: `${50 * (1 + sign * (sigmoid(engineEval || 0.0) * 2 - 1))}%`,
          background: orientation,
        }}
        className="z-20 h-[50%] w-full absolute left-0 invert transition-[height] duration-300"
      ></div>
    </div>
  );
}

function lanToKeys(lan: string): [Key, Key] {
  return [lan.slice(0, 2) as Key, lan.slice(2, 4) as Key];
}

export default function Board({
  fen,
  viewOnly = true,
  coordinates = false,
  lastMoveLan,
  arrowLans = [],
  ...props
}: Props) {
  const [ref, entry] = useIntersectionObserver({
    threshold: 0,
    root: null,
    rootMargin: "500px",
  });
  const value = entry?.isIntersecting;
  const previousValue = usePrevious(value);

  return (
    <figure className="size-full flex items-stretch justify-between" ref={ref}>
      <EvalBar fen={fen} orientation={props.orientation} />
      <div className="flex-1 aspect-square">
        {(value || previousValue) && (
          <Chessground
            contained
            config={{
              fen,
              coordinates,
              viewOnly,
              lastMove: lastMoveLan ? lanToKeys(lastMoveLan) : undefined,
              drawable: {
                visible: true,
                autoShapes: arrowLans?.map((lan) => ({
                  orig: lanToKeys(lan)[0],
                  dest: lanToKeys(lan)[1],
                  brush: "main",
                })),
                brushes: {
                  main: {
                    key: "a",
                    opacity: 0.5,
                    color: "red",
                    lineWidth: 10,
                  },
                },
              },
              ...props,
            }}
          />
        )}
      </div>
    </figure>
  );
}
