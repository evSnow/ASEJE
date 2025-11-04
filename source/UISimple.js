const vscode = require('vscode');
function toggleUI(context){
    const disposables = vscode.commands.registerCommand('aseje.toggleBeginnerMode', () => {
        const config = vscode.workspace.getConfiguration();
        const isHidden = config.get('workbench.statusBar.visible')=== false;
        config.update('workbench.activityBar.visible', isHidden, vscode.ConfigurationTarget.Global);
        config.update('workbench.statusBar.visible', isHidden, vscode.ConfigurationTarget.Global);
        config.update('workbench.editor.showTabs', isHidden, vscode.ConfigurationTarget.Global);
        config.update('editor.minimap.enabled', isHidden, vscode.ConfigurationTarget.Global);
        config.update('breadcrumbs.enabled', isHidden, vscode.ConfigurationTarget.Global);

        vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
        //vscode.commands.executeCommand('workbench.action.togglePanel');
        
    })

  context.subscriptions.push(disposables);
}


module.exports = {
toggleUI 
} 