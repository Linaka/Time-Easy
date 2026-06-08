import { useEffect, useMemo } from "react";
import {
  firstAccessibleSection,
  getAccessRole,
  resolveCurrentUser
} from "../domain/auth.js";
import { STORAGE_PREFIX } from "../domain/appConfig.js";
import { trackClientEvent } from "../services/clientLogger.js";
import { usePersistentState } from "./usePersistentState.js";

export function useIdentitySelection({
  activeSection,
  setActiveSection,
  setActiveUtility,
  setStatusMessage,
  teamMembers,
  workspaceSettings
}) {
  const [selectedUserId, setSelectedUserId] = usePersistentState(`${STORAGE_PREFIX}.currentUserId`, "");
  const selectedUser = useMemo(
    () => teamMembers.find((member) => member.id === selectedUserId) || null,
    [selectedUserId, teamMembers]
  );
  const currentUser = useMemo(
    () => resolveCurrentUser(teamMembers, selectedUserId),
    [selectedUserId, teamMembers]
  );

  useEffect(() => {
    if (!selectedUserId || selectedUser) {
      return;
    }

    setSelectedUserId("");
    setActiveUtility(null);
    setStatusMessage("Choose a profile to continue.");
  }, [selectedUser, selectedUserId, setActiveUtility, setSelectedUserId, setStatusMessage]);

  function selectCurrentUser(memberId) {
    const nextUser = teamMembers.find((member) => member.id === memberId);
    if (!nextUser) {
      setStatusMessage("Choose a valid team member.");
      return false;
    }

    setSelectedUserId(nextUser.id);
    setActiveUtility(null);
    setStatusMessage(`${nextUser.name} selected.`);
    trackClientEvent("identity_select", { accessRole: getAccessRole(nextUser) });

    const nextSection = firstAccessibleSection(nextUser, activeSection, workspaceSettings);
    if (nextSection !== activeSection) {
      setActiveSection(nextSection);
    }

    return true;
  }

  function clearCurrentUserSelection() {
    setSelectedUserId("");
    setActiveUtility(null);
    setStatusMessage("Choose a profile to continue.");
    trackClientEvent("identity_switch", {});
  }

  return {
    currentUser,
    identity: {
      onSelectUser: selectCurrentUser,
      onSwitchUser: clearCurrentUserSelection,
      requiresSelection: !selectedUser,
      selectedUserId,
      teamMembers
    },
    setSelectedUserId
  };
}
