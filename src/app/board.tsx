"use client";
import Chessground from "@react-chess/chessground";
import "./chessground.css";
import { useIntersectionObserver, usePrevious } from "@uidotdev/usehooks";

type Props = NonNullable<React.ComponentProps<typeof Chessground>["config"]> & {
  fen: string;
};

export default function Board({
  fen,
  viewOnly = true,
  coordinates = false,
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
    <figure className="size-full" ref={ref}>
      {(value || previousValue) && (
        <Chessground
          contained
          config={{
            fen,
            coordinates,
            viewOnly,
            ...props,
          }}
        />
      )}
    </figure>
  );
}
