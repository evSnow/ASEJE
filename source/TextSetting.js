const vscode = require('vscode');

 function registerTextSetting(context){
    const disposable = vscode.commands.registerCommand('aseje.textSetting', () => {
        const config = vscode.workspace.getConfiguration();
        const fontSize = config.get('aseje.fontSize') || 14;
        console.log(fontSize)
        //const font = config.get('aseje.fontType') || 'Consolas, \'Courier New\', monospace';
        const panel = vscode.window.createWebviewPanel(
            'textSetting',
            'text setting',
            vscode.ViewColumn.One,
            {enableScripts: true}
        )
        panel.webview.html = getWebviewContent(fontSize);

        panel.webview.onDidReceiveMessage(async (message) =>{
            if (message.command === 'fontSizeChange') {
                const newSize = Number(message.value);
                if (isNaN(newSize) || newSize <= 6 || newSize >= 72) {
                    vscode.window.showErrorMessage('Font size is invalid plese pick a  size (6 – 72).');
                    return;
                }
                const config = vscode.workspace.getConfiguration();
                try{ 
                await config.update('editor.fontSize', newSize, vscode.ConfigurationTarget.Global);
                await config.update('aseje.fontSize', newSize, vscode.ConfigurationTarget.Global);
                } catch (err) {
                    vscode.window.showErrorMessage(`Failed to update font size in editor and aseje: ${err.message}`);
                }
                
                panel.webview.html = getWebviewContent(newSize);
                vscode.window.showInformationMessage(`Suecess in setting Font size  to ${newSize}px`);
            }
          return;
        });
    });

    context.subscriptions.push(disposable);

}

function getWebviewContent(fontSize) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>text change</title>
    <style>
      body {
        font-size: ${fontSize}px;
        font-family: monospace;
        padding: 20px;
        }
    </style>
</head>
<body>
    <h1>Font Size: ${fontSize}px</h1>
    <input type="number" id="sizeInput" min="5" max="50"/>
    <button onclick="changeSize()">Change Font Size</button>

    <script>
      const vscode = acquireVsCodeApi();
      function changeSize() {
        const value = document.getElementById('sizeInput').value;
        vscode.postMessage({ command: 'fontSizeChange', value: value });
      }
    </script>   
</body>
</html>`;
}

module.exports = {
    registerTextSetting
} 