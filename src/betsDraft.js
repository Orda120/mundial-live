const sameBets = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function syncBetsDraft(current, playerId, saved) {
  if (current.playerId !== playerId) {
    return { playerId, saved, draft: saved };
  }

  if (sameBets(current.saved, saved)) return current;

  return {
    playerId,
    saved,
    draft: sameBets(current.draft, current.saved) ? saved : current.draft,
  };
}
