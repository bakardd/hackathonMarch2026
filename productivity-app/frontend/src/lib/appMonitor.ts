export const APP_OPTIONS = [
  "Visual Studio Code",
  "Google Chrome",
  "Terminal",
  "Figma",
  "Safari",
  "Cursor",
  "Xcode",
  "Notion",
  "Slack",
  "Discord",
  "Arc",
  "Firefox",
  "Brave Browser",
  "Google Meet",
  "Zoom",
  "Microsoft Teams",
  "Postman",
  "Spotify",
  "Obsidian",
  "Finder",
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
  slack: "Slack",
  discord: "Discord",
  arc: "Arc",
  firefox: "Firefox",
  brave: "Brave Browser",
  "brave browser": "Brave Browser",
  "google meet": "Google Meet",
  zoom: "Zoom",
  "microsoft teams": "Microsoft Teams",
  postman: "Postman",
  spotify: "Spotify",
  obsidian: "Obsidian",
  finder: "Finder",
  electron: "Electron",
};

function normalizeKey(value: string) {
  return value.trim().toLowerCase();
}

export function canonicalizeAppName(appName: string) {
  const normalized = normalizeKey(appName);
  const matchedOption = APP_OPTIONS.find((option) => normalizeKey(option) === normalized);
  return APP_ALIASES[normalized] ?? matchedOption ?? appName.trim();
}

export function appMatchesSelection(detectedAppName: string, allowedAppName: string) {
  return normalizeKey(canonicalizeAppName(detectedAppName)) === normalizeKey(canonicalizeAppName(allowedAppName));
}
