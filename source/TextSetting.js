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
                if (isNaN(newSize) || newSize <= 0) {
                    vscode.window.showErrorMessage('Font size is invalid plese pick a number greater then 0.');
                    return;
                }
                if(newSize == fontSize){
                  return;
                }
                const config = vscode.workspace.getConfiguration();
                try{ 
                await config.update('editor.fontSize', newSize, vscode.ConfigurationTarget.Global);
                await config.update('aseje.fontSize', newSize, vscode.ConfigurationTarget.Global);
                fontSize=newSize;
                console.log(fontSize.toString() + 'px')
                let res= await panel.webview.postMessage({ command: 'updateFontSize', value: newSize });
                console.log(res);
                console.log(html);
                vscode.window.showInformationMessage(`Suecess in setting Font size  to ${newSize}px`);
                } catch (err) {
                    vscode.window.showErrorMessage('Failed to update font size in editor and aseje: ${err.message}');
                }
                
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
            if (message.command === 'go_Home') {
                  vscode.commands.executeCommand('aseje.showWalkthrough');
            }
          return;
        });
    });

    context.subscriptions.push(disposable);

}

module.exports = {
    registerTextSetting
} 