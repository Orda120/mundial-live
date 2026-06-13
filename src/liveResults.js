export function applyManualOverrides({
  previousResults,
  nextResults,
  liveMeta,
  now,
}) {
  const nextMeta = { ...(liveMeta || {}) };
  const previousGroup = previousResults?.g || {};
  const nextGroup = nextResults?.g || {};
  const fixtureIds = new Set([
    ...Object.keys(previousGroup),
    ...Object.keys(nextGroup),
  ]);

  for (const fixtureId of fixtureIds) {
    if ((previousGroup[fixtureId] || null) === (nextGroup[fixtureId] || null)) continue;
    nextMeta[fixtureId] = {
      source: "manual",
      status: "manual",
      manualOverride: true,
      updatedAt: now,
    };
  }

  return nextMeta;
}

export function clearManualOverride(liveMeta, fixtureId, now) {
  return {
    ...(liveMeta || {}),
    [fixtureId]: {
      ...((liveMeta || {})[fixtureId] || {}),
      source: "automatic",
      status: "scheduled",
      manualOverride: false,
      updatedAt: now,
    },
  };
}
