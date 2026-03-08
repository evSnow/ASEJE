const vscode = require('vscode');
const fs = require('fs');
const path = require('path');


function registerReferenceCommands(context) {

  const referenceDisposable = vscode.commands.registerCommand('aseje.reference', () => {
    showReference(context);
  });

  context.subscriptions.push(referenceDisposable);
}

function showReference(context) {
  const panel = vscode.window.createWebviewPanel(
    'asejeReference',
    'Python Escape Sequence Characters',
    vscode.ViewColumn.One,
    { enableScripts: true,
      retainContextWhenHidden: true  
     }
  );
  //let fontSize = (config.get('aseje.fontSize') || 14);
  const htmlPath = path.join(context.extensionPath, 'view', 'reference.html');
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
  registerReferenceCommands,
  showReference,
};