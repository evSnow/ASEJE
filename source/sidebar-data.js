const sidebarItems = [
  {
    id: "escape-chars",
    title: "Python Escape Characters",
    description: "Quick reference for common Python escape sequences",
    category: "reference",
    action: "showReference",
    keywords: ["python", "escape", "characters", "strings"]
  },
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
  },
    {
    id: "Debug_Tips",
    title: "Debug Tips Page",
    description: "Tips for using the debugger",
    category: "tool",
    action: "Debug_Tips",
    keywords: ["debugger"]
  },
  {
    id: "Python_Tips",
    title: "Python Tips Page",
    description: "Tips for using python",
    category: "tool",
    action: "Python_Tips",
    keywords: ["python"]
  },
    {
    id: "VS_Shortcuts",
    title: "Vscode Shortcuts Page",
    description: "Shortcuts for using vscode",
    category: "tool",
    action: "VS_Shortcuts",
    keywords: ["vscode"]
  },
      {
    id: "TextSetting",
    title: "TextSetting",
    description: "Important text setting",
    category: "tool",
    action: "TextSetting",
    keywords: ["Setting"]
  },

];

module.exports = sidebarItems;
