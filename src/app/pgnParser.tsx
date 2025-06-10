"use client";

import { parsePgns } from "@/workers/pgnparse";
import { fetchLichessPgns } from "./actions";
import { Button } from "@/components/ui/button";
import { CloudDownloadIcon } from "lucide-react";

export default function PGNParser() {
  return (
    <Button
      onClick={async () => {
        const pgns = await fetchLichessPgns();
        parsePgns(pgns);
      }}
    >
      <CloudDownloadIcon />
      Parse PGN
    </Button>
  );
}
