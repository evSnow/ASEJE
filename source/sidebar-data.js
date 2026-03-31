const sidebarItems = [
  {
    id: "escape-chars",
    title: "Python Escape Characters",
    description: "Quick reference for common Python escape sequences",
    category: "reference",
    action: "showReference",
    keywords: ["python", "escape", "characters", "strings"]
  },
  /*
  {
    id: "debugging",
    title: "VS Code Debugging",
    description: "Basic debugging commands and tips",
    category: "debug",
    action: "openDebugHelp",
    keywords: ["debug", "vscode", "breakpoints", "troubleshooting"]
  },
  */
  {
    id: "beginner-mode",
    title: "Beginner Mode",
    description: "Enable beginner-friendly explanations and guidance",
    category: "feature",
    action: "toggleBeginnerMode",
    keywords: ["beginner", "mode", "help", "guidance"]
  },
  {
    id: "starter-project",
    title: "Create Starter Project",
    description: "Generate a starter project template",
    category: "tool",
    action: "createStarterProject",
    keywords: ["starter", "project", "template", "setup"]
  },
  {
    title: "Walkthrough",
    description: "Open extension walkthrough and main page",
    action: "showWalkthrough",
    keywords: ["walkthrough", "guide", "start"]
  },
  {
    title: "Open audio player",
    description: "Play notification sound after hitting a breakpoint",
    action: "playSound",
    keywords: ["sound", "audio", "player"]
  }
  /*
  {
    id: "media-tools",
    title: "MP4 Media Tools",
    description: "Upload and validate MP4 files securely in the sidebar",
    category: "media",
    action: "openMediaTools",
    keywords: ["mp4", "media", "video", "upload"]
  },
  {
    id: "help-center",
    title: "Help Center",
    description: "View FAQ and recent sidebar activity",
    category: "support",
    action: "openHelpCenter",
    keywords: ["help", "faq", "support", "activity"]
  }
    */
];

module.exports = sidebarItems;
