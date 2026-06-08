export function userIdForRecord(currentUser) {
  return currentUser?.id || "workspace-setup";
}

export function actorNameForActivity(currentUser) {
  return currentUser?.name || "Workspace setup";
}
