// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { registerTextSetting } = require('./source/TextSetting');
const {registerUIHelperCommands} = require('./source/UIHelper');
const {showGuidedWalkthrough} = require('./source/UIHelper');
const { TemplateLibrary } = require('./source/TemplateLibrary');
const { toggleUI } = require('./source/UISimple');
//const { introPage } = require('./source/introWalkthrough');
// Variable to track the current mode state
//let isBeginnerMode = false;


/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    showGuidedWalkthrough(context);
	console.log('Congratulations, your extension "aseje" is now active!');
	vscode.commands.executeCommand('setContext', 'aseje.isBeginnerMode', isBeginnerMode);
	
	const templateLibrary = new TemplateLibrary();


	registerTextSetting(context);
	registerUIHelperCommands(context);
    toggleUI(context);

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
