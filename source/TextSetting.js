const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

 function registerTextSetting(context){
    const disposable = vscode.commands.registerCommand('aseje.textSetting', () => {  // create a function for storing the regigster
        const config = vscode.workspace.getConfiguration();
        let fontSize = (config.get('aseje.fontSize') || 14);
        console.log(fontSize);
        //const font = config.get('aseje.fontType') || 'Consolas, \'Courier New\', monospace';
        const panel = vscode.window.createWebviewPanel(
            'textSetting',
            'text setting',
            vscode.ViewColumn.One,
            {enableScripts: true,
             localResourceRoots: [
              vscode.Uri.file(path.join(context.extensionPath, 'view'))
             ]
            }
        );
        const onDiskPath = path.join(context.extensionPath, 'view');
        let html = fs.readFileSync(path.join(onDiskPath, 'textSetting.html'), 'utf8');
        html = html.replace(/\$\{\s*fontSize\s*\}/g, fontSize.toString() + 'px');
        console.log(html)
        panel.webview.html = html;
        
        panel.webview.onDidReceiveMessage(async (message) =>{
          console.log(message.value);
          const configW = vscode.workspace.getConfiguration('workbench');
            if (message.command === 'fontSizeChange') {
                let newSize = Number(message.value);
                if (isNaN(newSize) || newSize <= 6 || newSize >= 72) {
                    vscode.window.showErrorMessage('Font size is invalid plese pick a  size (6 – 72).');
                    return;
                }
                const config = vscode.workspace.getConfiguration();
                try{ 
                await config.update('editor.fontSize', newSize, vscode.ConfigurationTarget.Global);
                await config.update('aseje.fontSize', newSize, vscode.ConfigurationTarget.Global);
                } catch (err) {
                    vscode.window.showErrorMessage('Failed to update font size in editor and aseje: ${err.message}');
                }
                console.log(fontSize.toString() + 'px')
                html=html.replace(fontSize.toString() + 'px', newSize.toString()+'px');
                html=html.replace(fontSize.toString() + 'px', newSize.toString()+'px');
                fontSize=newSize;
                console.log(html)
                panel.webview.html = html;
                vscode.window.showInformationMessage(`Suecess in setting Font size  to ${newSize}px`);
                
            }
            if (message.command === 'changeActivityBar') {
              console.log(message.command)
              if (message.value === "default"){
                try{
                await configW.update('activityBar.location', "default" , vscode.ConfigurationTarget.Global);
                } catch (err) {
                    vscode.window.showErrorMessage(`Failed to update font size in editor and aseje: ${err.message}`);
                };
                panel.webview.postMessage({command: 'activityBarChanged', value: "default"});
                vscode.window.showInformationMessage('Suecess in setting activity bar left');
              }
              else if (message.value === "top"){
                try{
                await configW.update('activityBar.location', "top", vscode.ConfigurationTarget.Global);
                } catch (err) {
                    vscode.window.showErrorMessage(`Failed to update font size in editor and aseje: ${err.message}`);
                };
                panel.webview.postMessage({command: 'activityBarChanged', value: "top"});
                vscode.window.showInformationMessage('Suecess in setting activity bar top');
              }
              else if (message.value === "bottom"){
                try{
                await configW.update('activityBar.location', "bottom", vscode.ConfigurationTarget.Global);
                } catch (err) {
                    vscode.window.showErrorMessage(`Failed to update font size in editor and aseje: ${err.message}`);
                };
                panel.webview.postMessage({command: 'activityBarChanged', value: "bottom"});
                vscode.window.showInformationMessage('Suecess in setting activity bar bottom');
              }
              else if (message.value === "hidden"){
                try{
                await configW.update('activityBar.location', "hidden", vscode.ConfigurationTarget.Global);
                } catch (err) {
                    vscode.window.showErrorMessage(`Failed to update font size in editor and aseje: ${err.message}`);
                };
                panel.webview.postMessage({command: 'activityBarChanged', value: "hidden"});
                vscode.window.showInformationMessage('Suecess in setting activity bar to be hidden');
              }
            }
            if (message.command ==='changeSideBar'){
                console.log("hi");
                if(message.value==='left'){
                try{
                await configW.update('sideBar.location', "left", vscode.ConfigurationTarget.Global);
                } catch (err) {
                    vscode.window.showErrorMessage(`Failed to update font size in editor and aseje: ${err.message}`);
                };
                panel.webview.postMessage({command: 'activityBarChanged', value: "left"});
                vscode.window.showInformationMessage('Suecess in setting side bar left');
                }
                else if(message.value === 'right'){
                try{
                await configW.update('sideBar.location', "right", vscode.ConfigurationTarget.Global);
                } catch (err) {
                    vscode.window.showErrorMessage(`Failed to update font size in editor and aseje: ${err.message}`);
                };
                panel.webview.postMessage({command: 'activityBarChanged', value: "right"}); 
                vscode.window.showInformationMessage('Suecess in setting side bar right');                
                }
            }
          return;
        });
    });

    context.subscriptions.push(disposable);

}
/*
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
  <h2>Change Font Size</h2>
  <input id="sizeInput" type="number" placeholder="Enter font size" />
  <button id="changeButton">Change</button>

  <h2> Activity bar location </h2>

  <form id="Activity Bar locatgion">
    <label><input type="radio" id="default" name="option" value="default" checked> Default (left)</label><br>
    <label><input type="radio" id="top" name="option" value="top"> Top</label><br>
    <label><input type="radio" id="bottom" name="option" value="bottom"> Bottom</label><br>
    <label><input type="radio" id="hidden" name="option" value="hidden"> Hidden</label><br>
  </form>

  <button id="changeActivityBar" type="button">Change</button>

  <h2> side bar location </h2>
  <form id="sideBar">
    <label><input type="radio" id="left" name="optionS" value="left" checked> left</label><br>
    <label><input type="radio" id="right" name="optionS" value="right"> right </label><br>
  </form>

  <button id="changeSideBar" type="button">Change</button>

    

    <script>
      const vscode = acquireVsCodeApi();
      document.getElementById('changeButton').addEventListener('click', () => {
        const x = document.getElementById('sizeInput').value;
        vscode.postMessage({
          command: 'fontSizeChange',
          value: x
        });
      });

      document.getElementById('changeActivityBar').addEventListener('click', () => {
      const selected = document.querySelector('input[name="option"]:checked');
        const y=selected.value;
        vscode.postMessage({ 
        command: 'changeActivityBar', 
        value: y });
      });
      document.getElementById('changeSideBar').addEventListener('click', () => {
      const selected = document.querySelector('input[name="optionS"]:checked');
        const y=selected.value;
        vscode.postMessage({ 
        command: 'changeSideBar', 
        value: y });
      });
    </script>
  
</body>
</html>`;
}
*/
module.exports = {
    registerTextSetting
} 