import { isTauri } from "@tauri-apps/api/core";
import { Menu } from "@tauri-apps/api/menu";
import { confirm, message, open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export function isDesktopRuntime() {
  try {
    return isTauri();
  } catch {
    return false;
  }
}

export async function setupDesktopMenu(handlers) {
  if (!isDesktopRuntime()) {
    return () => {};
  }

  const runHandler = (handlerName) => {
    void handlers[handlerName]?.();
  };

  const menu = await Menu.new({
    items: [
      {
        text: "Creative Operations",
        items: [
          {
            item: {
              About: {
                name: "Creative Operations",
                version: "0.1.0"
              }
            }
          },
          { item: "Separator" },
          { item: "Hide" },
          { item: "HideOthers" },
          { item: "ShowAll" },
          { item: "Separator" },
          { item: "Quit" }
        ]
      },
      {
        text: "File",
        items: [
          {
            id: "import-workspace-backup",
            text: "Import Workspace Backup...",
            accelerator: "CmdOrCtrl+O",
            action: () => runHandler("onImportWorkspaceBackup")
          },
          {
            id: "export-workspace-backup",
            text: "Export Workspace Backup...",
            accelerator: "CmdOrCtrl+Shift+B",
            action: () => runHandler("onExportWorkspaceBackup")
          },
          { item: "Separator" },
          {
            id: "import-timesheet-csv",
            text: "Import Timesheet CSV...",
            accelerator: "CmdOrCtrl+Shift+O",
            action: () => runHandler("onImportTimesheetCsv")
          },
          {
            id: "export-report-csv",
            text: "Export Report CSV...",
            accelerator: "CmdOrCtrl+E",
            action: () => runHandler("onExportReportCsv")
          },
          { item: "Separator" },
          { item: "CloseWindow" }
        ]
      },
      {
        text: "Edit",
        items: [
          { item: "Undo" },
          { item: "Redo" },
          { item: "Separator" },
          { item: "Cut" },
          { item: "Copy" },
          { item: "Paste" },
          { item: "SelectAll" }
        ]
      },
      {
        text: "Window",
        items: [
          { item: "Minimize" },
          { item: "Fullscreen" },
          { item: "BringAllToFront" }
        ]
      }
    ]
  });

  await menu.setAsAppMenu();
  return () => {};
}

export async function openTextFile({ title, filters }) {
  if (!isDesktopRuntime()) {
    return null;
  }

  const path = await open({
    title,
    filters,
    multiple: false,
    directory: false
  });

  if (!path || Array.isArray(path)) {
    return null;
  }

  return {
    path,
    text: await readTextFile(path)
  };
}

export async function saveTextFile({ title, defaultPath, filters, text }) {
  if (!isDesktopRuntime()) {
    return null;
  }

  const path = await save({
    title,
    defaultPath,
    filters,
    canCreateDirectories: true
  });

  if (!path) {
    return null;
  }

  await writeTextFile(path, text);
  return path;
}

export async function confirmDesktopAction(prompt, options = {}) {
  if (!isDesktopRuntime()) {
    return true;
  }

  return confirm(prompt, {
    title: "Creative Operations",
    kind: "warning",
    ...options
  });
}

export async function showDesktopMessage(prompt, options = {}) {
  if (!isDesktopRuntime()) {
    return false;
  }

  return message(prompt, {
    title: "Creative Operations",
    kind: "info",
    ...options
  });
}

export function downloadTextFile({ filename, mimeType, text }) {
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
