const vscode = require('vscode');

/**
 * Registers commands and logic related to UI assistance, such as the Walkthrough.
 * This function is called from extension.js.
 * @param {vscode.ExtensionContext} context
 */
function registerUIHelperCommands(context) {
    
    const walkthroughDisposable = vscode.commands.registerCommand('aseje.showWalkthrough', () => {
        showGuidedWalkthrough();
    });
    context.subscriptions.push(walkthroughDisposable);
}

function showGuidedWalkthrough() {
    const walkthroughId = 'aseje.myFirstWalkthrough'; 
    
    vscode.commands.executeCommand('workbench.action.openWalkthrough', walkthroughId);
    vscode.window.showInformationMessage('Opening ASEJE Guided Walkthrough...');
}

module.exports = {
    registerUIHelperCommands,
    showGuidedWalkthrough
}