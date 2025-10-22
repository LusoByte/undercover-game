export function calculateRequiredRoles(playerCount: number) {
  let undercover = 1;
  const mrwhite = 1;
  if (playerCount >= 8) undercover = 2;
  if (playerCount >= 12) undercover = 3;
  const civilian = playerCount - undercover - mrwhite;
  return { civilian, undercover, mrwhite };
}
