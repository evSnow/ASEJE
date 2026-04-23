const vscode = require('vscode');
const fs = require('fs');
const path = require('path');


function showDebuggingTipsCommands(context) {

  const showDebuggingTipsDisposable = vscode.commands.registerCommand('aseje.showDebuggingTips', () => {
    showDebuggingTips(context);
  });

  context.subscriptions.push(showDebuggingTipsDisposable);
}

function showDebuggingTips(context) {
  const panel = vscode.window.createWebviewPanel(
    'asejeshowDebuggingTips',
    'Show Debugging Tips',
    vscode.ViewColumn.One,
    { enableScripts: true,
      retainContextWhenHidden: true  
     }
  );
  //let fontSize = (config.get('aseje.fontSize') || 14);
  const htmlPath = path.join(context.extensionPath, 'view', 'debuggingTips.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  //html = html.replace(/\$\{\s*fontSize\s*\}/g, fontSize.toString() + 'px');
  const config = vscode.workspace.getConfiguration();
  let fontSize = (config.get('aseje.fontSize') || 14);  
  console.log(fontSize)
  html=html.replace(/(\d+)px/,`${fontSize}px`);
  console.log(html)
  panel.webview.html = html;
}


function showPythonTipsCommands(context) {

  const showPythonTipsDisposable = vscode.commands.registerCommand('aseje.pyTips', () => {
    showPythonTips(context);
  });

  context.subscriptions.push(showPythonTipsDisposable);
}

function showPythonTips(context) {
  const panel = vscode.window.createWebviewPanel(
    'asejeshowDebuggingTips',
    'Show python Tips',
    vscode.ViewColumn.One,
    { enableScripts: true,
      retainContextWhenHidden: true  
     }
  );
  //let fontSize = (config.get('aseje.fontSize') || 14);
  const htmlPath = path.join(context.extensionPath, 'view', 'pythonTips.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  //html = html.replace(/\$\{\s*fontSize\s*\}/g, fontSize.toString() + 'px');
  const config = vscode.workspace.getConfiguration();
  let fontSize = (config.get('aseje.fontSize') || 14);  
  console.log(fontSize)
  html=html.replace(/(\d+)px/,`${fontSize}px`);
  console.log(html)
  panel.webview.html = html;
}

function showVsShortcutsTipsCommands(context) {

  const showVsShortcutsTipsDisposable = vscode.commands.registerCommand('aseje.vscodeShort', () => {
    showVsShortcutsTips(context);
  });

  context.subscriptions.push(showVsShortcutsTipsDisposable);
}

function showVsShortcutsTips(context) {
  const panel = vscode.window.createWebviewPanel(
    'asejeshowDebuggingTips',
    'Show VScode Shortcuts Tips',
    vscode.ViewColumn.One,
    { enableScripts: true,
      retainContextWhenHidden: true  
     }
  );
  //let fontSize = (config.get('aseje.fontSize') || 14);
  const htmlPath = path.join(context.extensionPath, 'view', 'vscodeShortcuts.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  //html = html.replace(/\$\{\s*fontSize\s*\}/g, fontSize.toString() + 'px');
  const config = vscode.workspace.getConfiguration();
  let fontSize = (config.get('aseje.fontSize') || 14);  
  console.log(fontSize)
  html=html.replace(/(\d+)px/,`${fontSize}px`);
  console.log(html)
  panel.webview.html = html;
}




function showQuickGuideCommands(context) { //Fix html later

  const showQuickGuideDisposable = vscode.commands.registerCommand('aseje.vscodeQuickGuide', () => {
    showQuickGuide(context);
  });

  context.subscriptions.push(showQuickGuideDisposable);
}

function showQuickGuide(context) {
  const panel = vscode.window.createWebviewPanel(
    'asejeshowDebuggingTips',
    'Show VScode Quick Guide',
    vscode.ViewColumn.One,
    { enableScripts: true,
      retainContextWhenHidden: true  
     }
  );
  //let fontSize = (config.get('aseje.fontSize') || 14);
  const htmlPath = path.join(context.extensionPath, 'view', 'vscodeQuickGuide.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  //html = html.replace(/\$\{\s*fontSize\s*\}/g, fontSize.toString() + 'px');
  const config = vscode.workspace.getConfiguration();
  let fontSize = (config.get('aseje.fontSize') || 14);  
  console.log(fontSize)
  html=html.replace(/(\d+)px/,`${fontSize}px`);
  console.log(html)
  panel.webview.html = html;
}

module.exports = {
  showDebuggingTipsCommands,
  showDebuggingTips,
  showPythonTips,
  showPythonTipsCommands,
  showVsShortcutsTipsCommands,
  showQuickGuideCommands
};