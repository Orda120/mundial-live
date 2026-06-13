export const GROUPS = {
  A: ["MEX", "KOR", "CZE", "RSA"], B: ["SUI", "CAN", "QAT", "BIH"], C: ["BRA", "MAR", "HAI", "SCO"],
  D: ["USA", "TUR", "AUS", "PAR"], E: ["GER", "ECU", "CIV", "CUW"], F: ["NED", "JPN", "SWE", "TUN"],
  G: ["BEL", "EGY", "IRN", "NZL"], H: ["ESP", "CPV", "KSA", "URU"], I: ["FRA", "SEN", "IRQ", "NOR"],
  J: ["ARG", "ALG", "AUT", "JOR"], K: ["POR", "COD", "UZB", "COL"], L: ["ENG", "CRO", "GHA", "PAN"],
};

export const GROUP_KEYS = Object.keys(GROUPS);
export const ALL_TEAMS = GROUP_KEYS.flatMap((group) => GROUPS[group]);
export const PAIRS = [[0, 1], [2, 3], [0, 2], [3, 1], [0, 3], [1, 2]];

export const groupFixtures = (group) =>
  PAIRS.map((pair, index) => ({
    id: `${group}-${index}`,
    g: group,
    t1: GROUPS[group][pair[0]],
    t2: GROUPS[group][pair[1]],
  }));

export const ALL_GROUP_FIXTURES = GROUP_KEYS.flatMap(groupFixtures);

export function fixtureForTeams(team1, team2) {
  return ALL_GROUP_FIXTURES.find(
    ({ t1, t2 }) =>
      (t1 === team1 && t2 === team2) ||
      (t1 === team2 && t2 === team1)
  );
}

export function fixtureIdForTeams(team1, team2) {
  const fixture = fixtureForTeams(team1, team2);
  return fixture?.id || null;
}
