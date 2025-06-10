"use server";

export async function fetchLichessPgns(
  playerName = "RebeccaHarris",
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
        revalidate: 3600 * 24,
      },
    },
  );
  const text = await res.text();
  return text.trim().split("\n\n\n");
}
