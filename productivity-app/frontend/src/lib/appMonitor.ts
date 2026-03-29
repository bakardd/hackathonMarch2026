export const APP_OPTIONS = [
  "Visual Studio Code",
  "Google Chrome",
  "Terminal",
  "Figma",
  "Safari",
  "Cursor",
  "Xcode",
  "Notion",
] as const;

const APP_ALIASES: Record<string, string> = {
  code: "Visual Studio Code",
  "visual studio code": "Visual Studio Code",
  chrome: "Google Chrome",
  "google chrome": "Google Chrome",
  terminal: "Terminal",
  figma: "Figma",
  safari: "Safari",
  cursor: "Cursor",
  xcode: "Xcode",
  notion: "Notion",
  electron: "Electron",
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export function canonicalizeAppName(appName: string) {
  const normalized = normalizeKey(appName);
  return APP_ALIASES[normalized] ?? appName.trim();
}

export function appMatchesSelection(detectedAppName: string, allowedAppName: string) {
  return canonicalizeAppName(detectedAppName) === canonicalizeAppName(allowedAppName);
}
