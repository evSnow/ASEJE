const vscode = require('vscode');
const fs = require('fs');
const path = require('path');



function stepsOne(context) {
const stepOneDisposable = vscode.commands.registerCommand('aseje.stepOne', () => {
  const panel = vscode.window.createWebviewPanel(
    'step one',
    'first lesson',
    vscode.ViewColumn.One,
    { enableScripts: true }
  );

  const htmlPath = path.join(context.extensionPath, 'view', 'firstLesson.html');
  const html = fs.readFileSync(htmlPath, 'utf8');

  panel.webview.html = html;
});
context.subscriptions.push(stepOneDisposable);
}

module.exports = {
stepsOne
}