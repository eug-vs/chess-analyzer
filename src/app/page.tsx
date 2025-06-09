import Link from "next/link";
import PositionLink from "./positionLink";

export default function Home() {
  return (
    <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
      Hello world
      <PositionLink fen="r1bqkbnr/pp1ppppp/2n5/2p5/3PP3/8/PPP2PPP/RNBQKBNR w KQkq - 1 3" />
    </main>
  );
}
