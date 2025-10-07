const vscode = require('vscode');

function registerTextEditor(context){
    const disposable = vscode.commands.registerCommand('aseje.textChange', () => {
        vscode.window.showInformationMessage('Hello from !');
    });

    context.subscriptions.push(disposable);
}

module.exports = {
    registerTextEditor
} 