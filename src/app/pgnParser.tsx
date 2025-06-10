"use client";

import { parsePgns } from "@/orchestrator";

async function fetchLichessPgns(
  playerName = "eug_vs",
  since = new Date("2025-06-01"),
  perfType = ["blitz", "bullet"],
) {
  const TRUE = "true";
  const FALSE = "false";
  const searchParams = new URLSearchParams({
    rated: TRUE,
    tags: TRUE,
    clocks: TRUE,
    evals: TRUE,
    opening: FALSE,
    literate: FALSE,
    since: Number(since).toString(),
    perfType: encodeURI(perfType.join(",")),
  });
  const res = await fetch(
    `https://lichess.org/games/export/${playerName}?${searchParams.toString()}`,
    {
      next: {
        revalidate: 0,
      },
    },
  );
  const text = await res.text();
  return text.trim().split("\n\n\n");
}

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
