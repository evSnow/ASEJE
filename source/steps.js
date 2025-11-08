const vscode = require('vscode');
const fs = require('fs');
const path = require('path');



function stepsOne(context) {
const stepOneDisposable = vscode.commands.registerCommand('aseje.stepOne', () => {
  const panel = vscode.window.createWebviewPanel(
    'step one',
    'first lesson',
    vscode.ViewColumn.One,
    { enableScripts: true,
      retainContextWhenHidden: true  
     }
  );

  const htmlPath = path.join(context.extensionPath, 'view', 'firstLesson.html');

  let html = fs.readFileSync(htmlPath, 'utf8');
  const config = vscode.workspace.getConfiguration();
  let fontSize = (config.get('aseje.fontSize') || 14);  
  console.log(fontSize)
  html=html.replace(/(\d+)px/,`${fontSize}px`);
  console.log(html)
  panel.webview.html = html;
    panel.webview.onDidReceiveMessage(async (message) => {
    console.log(message.command)
    if (message.command === 'go_Home') {
        vscode.commands.executeCommand('aseje.showWalkthrough');
    }
  });
});
context.subscriptions.push(stepOneDisposable);
}

module.exports = {
stepsOne
}