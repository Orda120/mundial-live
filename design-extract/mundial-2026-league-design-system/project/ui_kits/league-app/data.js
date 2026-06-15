// Demo data for the Mundial 2026 League UI kit. Fake but realistic.
// Loaded as a plain script; attaches LEAGUE to window.

window.LEAGUE = (function () {
  const players = [
    { id: "p0", name: "דניאל", idx: 0 },
    { id: "p1", name: "מאיה", idx: 1 },
    { id: "p2", name: "יוסי", idx: 2 },
    { id: "p3", name: "נועה", idx: 3 },
  ];

  // leaderboard rows (sorted desc by total)
  const rows = [
    { p: players[2], draft: 11, matches: 6, bracket: 7.5, total: 24.5 },
    { p: players[0], draft: 9, matches: 8, bracket: 6, total: 23 },
    { p: players[1], draft: 8, matches: 5, bracket: 5.5, total: 18.5 },
    { p: players[3], draft: 7, matches: 4, bracket: 4, total: 15 },
  ];

  // a few group fixtures for the bets screen (group A)
  const groupA = {
    key: "A",
    fixtures: [
      { id: "A-0", t1: "MEX", t2: "KOR", result: "2-1", bet: "1" },
      { id: "A-1", t1: "CZE", t2: "RSA", result: "1-1", bet: "X" },
      { id: "A-2", t1: "MEX", t2: "CZE", result: null, bet: "1" },
      { id: "A-3", t1: "RSA", t2: "KOR", result: null, bet: null },
      { id: "A-4", t1: "MEX", t2: "RSA", result: null, bet: null },
      { id: "A-5", t1: "KOR", t2: "CZE", result: null, bet: "2" },
    ],
  };

  // draft pools — who owns which teams (subset for display)
  const draft = {
    order: ["p2", "p0", "p1", "p3"],
    current: "p0",
    pool: ["BRA", "ARG", "FRA", "ESP", "GER", "POR", "NED", "ENG", "BEL", "CRO", "URU", "JPN"],
    owned: {
      p2: ["BRA", "POR"],
      p0: ["ARG", "NED"],
      p1: ["FRA", "ENG"],
      p3: ["ESP", "GER"],
    },
  };

  return { name: "ליגת החברים", players, rows, groupA, draft };
})();
