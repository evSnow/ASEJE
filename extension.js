// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { registerTextSetting} = require('./source/TextSetting');
const {registerUIHelperCommands} = require('./source/UIHelper')
const { TemplateLibrary } = require('./source/TemplateLibrary');

// Variable to track the current mode state
let isBeginnerMode = false;

/**
 * Toggles the ASEJE Beginner Mode by setting the 'aseje.isBeginnerMode' context key.
 */
function toggleBeginnerMode() {
    isBeginnerMode = !isBeginnerMode;

    vscode.commands.executeCommand(
        'setContext',
        'aseje.isBeginnerMode',
        isBeginnerMode
    );

    const message = isBeginnerMode
        ? '✅ ASEJE Beginner Mode: ON. The VS Code UI has been simplified.'
        : '❌ ASEJE Beginner Mode: OFF. Full VS Code UI restored.';

    vscode.window.showInformationMessage(message);

    if (isBeginnerMode) {
        vscode.commands.executeCommand('workbench.action.toggleSidebarVisibility');
    }
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Congratulations, your extension "aseje" is now active!');
	vscode.commands.executeCommand('setContext', 'aseje.isBeginnerMode', isBeginnerMode);
	
	const templateLibrary = new TemplateLibrary();


	registerTextSetting(context);
	registerUIHelperCommands(context);


	const toggleModeDisposable = vscode.commands.registerCommand('aseje.toggleBeginnerMode', () => {
        toggleBeginnerMode();
    });
	
	const templateDisposable = vscode.commands.registerCommand('aseje.createStarterProject', () => {
        templateLibrary.createStarterProject();
    });

	const helloWorldDisposable = vscode.commands.registerCommand('aseje.helloWorld', function () {
		vscode.window.showInformationMessage('Hello World from ASEJE!');
	});

context.subscriptions.push(
        toggleModeDisposable, 
        templateDisposable,
        helloWorldDisposable
	);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
