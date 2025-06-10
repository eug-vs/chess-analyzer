import Link from "next/link";
import Board from "./board";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

interface Props extends React.ComponentProps<typeof Board> {
  children?: React.ReactNode;
  linkToFen?: string;
}

export function encodeFen(fen: string) {
  return fen.replaceAll(" ", "_");
}
export function decodeFen(fen: string) {
  return fen.replaceAll("_", " ");
}

export default function PositionLink({ children, linkToFen, ...props }: Props) {
  return (
    <Link href={`/position/${encodeFen(linkToFen || props.fen)}`}>
      <Card className="pt-1 gap-2 transition hover:-translate-y-1 hover:shadow-lg">
        <CardContent className="p-2">
          <Board {...props} />
        </CardContent>
        <CardFooter className="grid gap-1">{children}</CardFooter>
      </Card>
    </Link>
  );
}
