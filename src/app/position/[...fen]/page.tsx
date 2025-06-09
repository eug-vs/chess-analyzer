import PositionLink, { decodeFen } from "@/app/positionLink";
import { use } from "react";

interface Props {
  params: Promise<{
    fen: string[];
  }>;
}
export default function PositionPage({ params }: Props) {
  const { fen: fenParts } = use(params);
  const fen = decodeFen(fenParts.join("/"));
  return (
    <div className="container mx-auto">
      <h1>FEN: {fen}</h1>
      <div className="flex justify-center">
        <PositionLink fen={fen} />
      </div>
    </div>
  );
}
