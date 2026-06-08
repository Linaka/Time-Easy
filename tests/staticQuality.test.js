import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const rootDir = new URL("..", import.meta.url).pathname;

function read(pathname) {
  return readFileSync(join(rootDir, pathname), "utf8");
}

function listSourceFiles(directory = "src") {
  return readdirSync(join(rootDir, directory)).flatMap((name) => {
    const pathname = join(directory, name);
    const absolutePath = join(rootDir, pathname);
    return statSync(absolutePath).isDirectory() ? listSourceFiles(pathname) : [pathname];
  });
}

test("static hosting headers define a restrictive browser security policy", () => {
  const headers = read("public/_headers");

  assert.match(headers, /Content-Security-Policy: default-src 'self'/);
  assert.match(headers, /object-src 'none'/);
  assert.match(headers, /frame-ancestors 'none'/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /Permissions-Policy:/);
});

test("desktop shell defines a restrictive Tauri security policy", () => {
  const tauriConfig = JSON.parse(read("src-tauri/tauri.conf.json"));
  const capabilities = JSON.parse(read("src-tauri/capabilities/default.json"));
  const permissions = capabilities.permissions;

  assert.match(tauriConfig.app.security.csp, /default-src 'self'/);
  assert.match(tauriConfig.app.security.csp, /object-src 'none'/);
  assert.match(tauriConfig.app.security.csp, /connect-src 'self' ipc: http:\/\/ipc\.localhost/);
  assert.equal(tauriConfig.app.security.freezePrototype, true);
  assert.ok(permissions.includes("fs:allow-stat"));
  assert.ok(permissions.includes("fs:allow-read-text-file"));
  assert.ok(permissions.includes("fs:allow-write-text-file"));

  const fsScope = permissions.find((permission) => permission.identifier === "fs:scope");
  assert.ok(fsScope);
  assert.deepEqual(fsScope.allow, ["$DESKTOP/**/*", "$DOCUMENT/**/*", "$DOWNLOAD/**/*"]);
  assert.ok(fsScope.deny.includes("$APPDATA/**/*"));
  assert.ok(fsScope.deny.includes("$CONFIG/**/*"));
});

test("accessibility affordances are present in the app shell", () => {
  const appLayout = read("src/components/templates/AppLayout.jsx");
  const sidebar = read("src/components/organisms/Sidebar.jsx");
  const topBar = read("src/components/organisms/TopBar.jsx");
  const css = read("src/index.css");

  assert.match(appLayout, /href="#main-content"/);
  assert.match(appLayout, /role="status"/);
  assert.match(appLayout, /document\.title/);
  assert.match(sidebar, /aria-current/);
  assert.match(topBar, /aria-label/);
  assert.match(css, /\.focus-ring/);
  assert.match(css, /prefers-reduced-motion/);
});

test("app shell delegates feature views through a section registry", () => {
  const app = read("src/App.jsx");
  const appLayout = read("src/components/templates/AppLayout.jsx");
  const pageProps = read("src/pages/pagePropsBySection.js");
  const sections = read("src/domain/sections.js");

  assert.ok(app.split("\n").length <= 130);
  assert.match(app, /getSectionDefinition\(activeSection\)/);
  assert.match(app, /PageComponents\[activeSectionDefinition\?\.componentName\]/);
  assert.match(app, /pagePropsBySection\[activeSection\]/);
  assert.match(app, /<ActivePage \{\.\.\.activePageProps\} \/>/);
  assert.match(app, /navigation=\{navigation\}/);
  assert.match(app, /workspace=\{workspace\}/);
  assert.match(app, /quickClock=\{quickClock\}/);
  assert.match(app, /guidance=\{guidance\}/);
  assert.match(appLayout, /export function AppLayout\(\{\n  children,\n  guidance,\n  metrics,\n  navigation,\n  quickClock,\n  statusMessage,\n  workspace\n\}\)/);
  assert.equal(appLayout.includes("onGuidanceBack"), false);
  assert.equal(app.includes("SECTION_COMPONENTS"), false);
  assert.equal(app.includes("commonProps"), false);
  assert.match(sections, /export const SECTION_DEFINITIONS/);
  assert.match(sections, /componentName: "TimeTrackerPage"/);
  assert.match(sections, /permission: PERMISSIONS\.TRACK_TIME/);
  assert.match(sections, /chrome: \{ quickClock: true \}/);
  assert.match(pageProps, /export function buildPagePropsBySection/);
  assert.match(pageProps, /"Time Tracker"/);
  assert.match(pageProps, /onStartStop: timeTracking\.handleStartStop/);
  assert.match(pageProps, /Approvals:/);
});

test("schedule planner keeps interaction behavior in focused hooks", () => {
  const ganttChart = read("src/pages/schedule/GanttChart.jsx");
  const assignmentCard = read("src/pages/schedule/GanttAssignmentCard.jsx");
  const plannerHook = read("src/pages/schedule/useGanttPlanner.js");
  const pickerHook = read("src/pages/schedule/useFloatingPicker.js");

  assert.match(ganttChart, /useGanttPlanner/);
  assert.equal(/use(State|Effect|Memo|Callback|LayoutEffect)/.test(ganttChart), false);
  assert.match(assignmentCard, /useFloatingPicker/);
  assert.equal(assignmentCard.includes("useLayoutEffect"), false);
  assert.match(plannerHook, /buildGanttTimeline/);
  assert.match(plannerHook, /handleDrop/);
  assert.match(pickerHook, /useLayoutEffect/);
  assert.match(pickerHook, /getBoundingClientRect/);
});

test("styled React views use CSS Modules instead of raw class strings", () => {
  const styledFiles = [
    ...listSourceFiles("src/components"),
    ...listSourceFiles("src/pages")
  ]
    .filter((pathname) => /\.jsx$/.test(pathname))
    .filter((pathname) => read(pathname).includes("className="));

  assert.ok(styledFiles.length > 0);

  for (const pathname of styledFiles) {
    const source = read(pathname);
    assert.equal(source.includes("className=\""), false, `${pathname} should not use raw className strings`);
    assert.equal(source.includes("className='"), false, `${pathname} should not use raw className strings`);
    assert.equal(source.includes("className={`"), false, `${pathname} should not use raw className template strings`);
    assert.match(source, /import styles from "(?:\.\/|\.\.\/)[^"]+\.module\.css";/, `${pathname} should import a CSS Module`);
  }
});

test("component and page CSS Modules use BEM-shaped class names", () => {
  const cssModuleFiles = [
    ...listSourceFiles("src/components"),
    ...listSourceFiles("src/pages")
  ].filter((pathname) => /\.module\.css$/.test(pathname));
  const bemClassPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__[a-z][a-z0-9]*(?:-[a-z0-9]+)*)?(?:--[a-z][a-z0-9]*(?:-[a-z0-9]+)*)?$/;

  assert.ok(cssModuleFiles.length > 0);

  for (const pathname of cssModuleFiles) {
    const classNames = [...read(pathname).matchAll(/^\s*\.([A-Za-z0-9_-]+)/gm)].map((match) => match[1]);
    assert.ok(classNames.length > 0, `${pathname} should define component classes`);
    for (const className of classNames) {
      assert.match(className, bemClassPattern, `${pathname} class .${className} should follow BEM shape`);
    }
  }
});

test("application shell keeps onboarding workflow in a dedicated controller", () => {
  const appHook = read("src/hooks/useCreativeOperationsApp.js");
  const onboardingHook = read("src/hooks/useOnboardingController.js");
  const recordIdentity = read("src/hooks/workspaceCommands/recordIdentity.js");

  assert.ok(appHook.split("\n").length <= 340);
  assert.match(appHook, /useOnboardingController/);
  assert.match(appHook, /useWorkspaceCommands/);
  assert.equal(appHook.includes("ONBOARDING_STATUS"), false);
  assert.equal(appHook.includes("memberId: \"ava\""), false);
  assert.match(recordIdentity, /userIdForRecord\(currentUser\)/);
  assert.match(onboardingHook, /GUIDANCE_STEPS/);
  assert.match(onboardingHook, /handleStartGuidance/);
  assert.match(onboardingHook, /handleSkipGuidance/);
});

test("source does not bypass React text escaping", () => {
  const sourceText = listSourceFiles()
    .filter((pathname) => /\.(js|jsx)$/.test(pathname))
    .map((pathname) => read(pathname))
    .join("\n");

  assert.equal(sourceText.includes("dangerouslySetInnerHTML"), false);
});
