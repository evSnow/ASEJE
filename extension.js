// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const { registerTextSetting } = require('./source/TextSetting');
const {registerUIHelperCommands} = require('./source/UIHelper');
const {showGuidedWalkthrough} = require('./source/UIHelper');
const { TemplateLibrary } = require('./source/TemplateLibrary');
const { toggleUI } = require('./source/UISimple');
const {stepsOne} = require('./source/steps');
const path = require('path');
//const { introPage } = require('./source/introWalkthrough');
// Variable to track the current mode state
//let isBeginnerMode = false;
/*
class jsDebugAdapterFactory {
    createDebugAdapterDescriptor(_session) {
	   const adapterPath = path.join(__dirname,'debugger', 'jsDebuggerStart.js');
		console.log(adapterPath);
       return new vscode.DebugAdapterExecutable('node', [adapterPath]);
    }
}
*/

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    showGuidedWalkthrough(context);
	console.log('Congratulations, your extension "aseje" is now active!');
	//vscode.commands.executeCommand('setContext', 'aseje.isBeginnerMode', isBeginnerMode);
	
	const templateLibrary = new TemplateLibrary();


	registerTextSetting(context);
	registerUIHelperCommands(context);
    toggleUI(context);
	stepsOne(context);
	
	registerDebugSuite(context);

	
	const templateDisposable = vscode.commands.registerCommand('aseje.createStarterProject', () => {
        templateLibrary.createStarterProject();
    });

	const helloWorldDisposable = vscode.commands.registerCommand('aseje.helloWorld', function () {
		vscode.window.showInformationMessage('Hello World from ASEJE!');
	});
console.log("before")

const factory={ 
	createDebugAdapterDescriptor(_session) {
	   console.log("QQQQQ");
	   const adapterPath = path.join(__dirname, 'jsDebuggerStart.js');
		console.log(fs.existsSync(adapterPath));
       let a= new vscode.DebugAdapterExecutable('node', [adapterPath]);
	   console.log(a.command, a.args);
	   return a
}
};
console.log("After");
context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory("mo", factory));

context.subscriptions.push(
        toggleModeDisposable, 
        templateDisposable,
        helloWorldDisposable
	);
    vscode.debug.onDidStartDebugSession(session => {
        console.log("DEBUG SESSION STARTED:", session.type);
    });

}

function deactivate() {}

module.exports = {
	activate,
	deactivate
};