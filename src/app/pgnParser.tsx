"use client";

import { parsePgns } from "@/workers/pgnparse";
import { fetchLichessPgns } from "./actions";

export default function PGNParser() {
  return (
    <button
      className="bg-red-50 p-4"
      onClick={async () => {
        const pgns = await fetchLichessPgns();
        parsePgns(pgns);
      }}
    >
      Parse PGN
    </button>
  );
}
