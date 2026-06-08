import { getSectionSubtitle } from "./sections.js";

export function sectionSubtitle(section) {
  return getSectionSubtitle(section);
}

export function utilitySubtitle(activeUtility) {
  const subtitles = {
    Settings: "Workspace preferences and shortcuts.",
    Notifications: "Pending work that needs attention.",
    Help: "Quick guidance for common workflows.",
    Profile: "Current user and employment grade."
  };
  return subtitles[activeUtility] || "";
}
