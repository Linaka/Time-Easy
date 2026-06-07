import { currency } from "../../domain/formatters.js";
import { validatePlainFields } from "../../domain/formUtils.js";
import { memberName } from "../../domain/projectUtils.js";
import { userIdForRecord } from "./recordIdentity.js";

export function createRequestCommands({
  addActivity,
  currentUser,
  setExpenses,
  setKioskSessions,
  setStatusMessage,
  setTimeOffRequests,
  teamMembers
}) {
  function addExpense(expenseDraft) {
    const validationError = validatePlainFields([expenseDraft.merchant, expenseDraft.note]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextExpense = {
      id: `expense-${Date.now()}`,
      status: "Pending",
      submittedBy: userIdForRecord(currentUser),
      ...expenseDraft,
      amount: Number(expenseDraft.amount) || 0
    };
    setExpenses((currentExpenses) => [nextExpense, ...currentExpenses]);
    addActivity("Expenses", `Submitted ${currency(nextExpense.amount)} expense for ${nextExpense.merchant}`);
    setStatusMessage(`Expense for ${nextExpense.merchant} submitted.`);
    return true;
  }

  function updateExpenseStatus(expenseId, nextStatus) {
    setExpenses((currentExpenses) =>
      currentExpenses.map((expense) =>
        expense.id === expenseId ? { ...expense, status: nextStatus } : expense
      )
    );
    addActivity("Approvals", `Expense ${nextStatus.toLowerCase()}`);
    setStatusMessage(`Expense ${nextStatus.toLowerCase()}.`);
  }

  function addTimeOffRequest(requestDraft) {
    const validationError = validatePlainFields([requestDraft.note]);
    if (validationError) {
      setStatusMessage(validationError);
      return false;
    }

    const nextRequest = {
      id: `timeoff-${Date.now()}`,
      status: "Pending",
      ...requestDraft,
      days: Number(requestDraft.days) || 1
    };
    setTimeOffRequests((currentRequests) => [nextRequest, ...currentRequests]);
    addActivity("Time Off", `${memberName(nextRequest.memberId, teamMembers)} requested time off`);
    setStatusMessage("Time off request submitted.");
    return true;
  }

  function updateTimeOffStatus(requestId, nextStatus) {
    setTimeOffRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? { ...request, status: nextStatus } : request
      )
    );
    addActivity("Approvals", `Time off request ${nextStatus.toLowerCase()}`);
    setStatusMessage(`Time off request ${nextStatus.toLowerCase()}.`);
  }

  function clockInKiosk(sessionDraft) {
    const nextSession = {
      id: `kiosk-${Date.now()}`,
      status: "Active",
      startedAt: new Date().toISOString(),
      endedAt: null,
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      ...sessionDraft
    };
    setKioskSessions((currentSessions) => [nextSession, ...currentSessions]);
    addActivity("Kiosks", `${memberName(nextSession.memberId, teamMembers)} clocked in`);
    setStatusMessage(`${memberName(nextSession.memberId, teamMembers)} clocked in.`);
  }

  function clockOutKiosk(sessionId) {
    setKioskSessions((currentSessions) =>
      currentSessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              status: "Completed",
              endedAt: new Date().toISOString()
            }
          : session
      )
    );
    addActivity("Kiosks", "Kiosk session clocked out");
    setStatusMessage("Kiosk session clocked out.");
  }

  return {
    addExpense,
    addTimeOffRequest,
    clockInKiosk,
    clockOutKiosk,
    updateExpenseStatus,
    updateTimeOffStatus
  };
}
