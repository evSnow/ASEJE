/**
 * steps.js
 * ---------------------------------------------------------
 * Provides the logic for displaying the first lesson inside
 * a VS Code WebView. This includes:
 *  - Registering the 'aseje.stepOne' command
 *  - Loading lesson HTML
 *  - Applying user font-size configuration
 *  - Handling messages sent from the WebView UI
 *
 * This supports the beginner walkthrough feature of ASEJE.
 * ---------------------------------------------------------
 */

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');

/**
 * Registers the command that opens the "first lesson" WebView panel.
 *
 * @param {vscode.ExtensionContext} context - Extension context that stores subscriptions and global paths.
 */
function stepsOne(context) {

    // Register a VS Code command that launches the lesson panel
    const stepOneDisposable = vscode.commands.registerCommand('aseje.stepOne', () => {

        // Create a WebView panel shown to the user
        const panel = vscode.window.createWebviewPanel(
            'stepOne',               // Internal view type ID
            'First Lesson',          // Title of the tab
            vscode.ViewColumn.One,   // Show in editor column 1
            {
                enableScripts: true,              // Allow JS inside WebView
                retainContextWhenHidden: true     // Keep state when switching tabs
            }
        );

        // Path to the HTML file containing lesson content
        const htmlPath = path.join(context.extensionPath, 'view', 'firstLesson.html');

        // Read the HTML file contents
        let html = fs.readFileSync(htmlPath, 'utf8');

        // Retrieve VS Code font-size setting for ASEJE lesson display
        const config = vscode.workspace.getConfiguration();
        let fontSize = config.get('aseje.fontSize') || 14;

        console.log("Font size loaded:", fontSize);

        // Replace a px value in the HTML with the user's configured size
        html = html.replace(/(\d+)px/, `${fontSize}px`);

        // Assign processed HTML to WebView
        panel.webview.html = html;

        /**
         * Handle messages sent from the WebView UI.
         * Example: When clicking the "Go back to homepage" button.
         */
        panel.webview.onDidReceiveMessage(async (message) => {
            console.log("Message received:", message.command);

            if (message.command === 'go_Home') {
                vscode.commands.executeCommand('aseje.showWalkthrough');
            }
        });
    });

    // Store command in context subscription list
    context.subscriptions.push(stepOneDisposable);
}

// Export function for activation in extension.js
module.exports = {
    stepsOne
};
