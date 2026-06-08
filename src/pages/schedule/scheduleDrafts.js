export function createScheduleEditDraft(item) {
  return {
    memberId: item.memberId,
    projectId: item.projectId,
    dateKey: item.dateKey,
    start: item.start,
    end: item.end,
    location: item.location || ""
  };
}
