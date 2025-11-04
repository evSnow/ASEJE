// source/UIHelper.js
const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Registers walkthrough and help panel commands
 */
function registerUIHelperCommands(context) {
  // Existing walkthrough command
  const walkthroughDisposable = vscode.commands.registerCommand('aseje.showWalkthrough', () => {
    showGuidedWalkthrough(context);
  });

  context.subscriptions.push(walkthroughDisposable);
}

function showGuidedWalkthrough(context) {
  const panel = vscode.window.createWebviewPanel(
    'asejeWalkthrough',
    'Welcome to ASEJE',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  const htmlPath = path.join(context.extensionPath, 'view', 'walkthrough.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  panel.webview.html = html;

  // Handle button clicks from HTML
  panel.webview.onDidReceiveMessage(async (message) => {
    if (message.command === 'createProject') {
      vscode.commands.executeCommand('aseje.createStarterProject');
    }
    if (message.command === 'openTextSettings') {
      vscode.commands.executeCommand('aseje.textSetting');
    }
  });
}

module.exports = {
  registerUIHelperCommands,
  showGuidedWalkthrough,
};