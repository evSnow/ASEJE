// The module 'vscode' contains the VS Code extensibility API.
// Import the module and reference it with the alias `vscode` below so we can
// access commands, debug APIs, window helpers, etc.
const vscode = require('vscode');

const { registerTextSetting } = require('./source/TextSetting');
const { registerUIHelperCommands, showGuidedWalkthrough } = require('./source/UIHelper');
const { TemplateLibrary } = require('./source/TemplateLibrary');
const { toggleUI } = require('./source/UISimple');
const { stepsOne } = require('./source/steps');
const { registerPythonHoverProvider } = require('./source/pythonHoverProvider');

const path = require('path');
const fs = require('fs');
// Variable to track the current mode state (kept here for possible future use).
// let isBeginnerMode = false;
const { registerDebugSuite } = require('./source/DebugSuite');
/**
 * Entry point for the ASEJE extension.
 *
 * VS Code calls this function once when the extension is activated.
 * Responsibilities:
 *  - Show the guided onboarding walkthrough for new users
 *  - Register all commands (template creation, hello world, etc.)
 *  - Set up beginner-friendly UI helpers
 *  - Register the custom debug adapter factory for our debugger
 *
 * @param {vscode.ExtensionContext} context - Global extension context provided by VS Code.
 */
function activate(context) {
    // Show our guided walkthrough so beginners learn how to use the extension.
    showGuidedWalkthrough(context);

    console.log('Congratulations, your extension "aseje" is now active!');
    // Example of how we could track beginner mode with a context key:
    // vscode.commands.executeCommand('setContext', 'aseje.isBeginnerMode', isBeginnerMode);

    // Single shared instance of the TemplateLibrary that can create starter projects.
    const templateLibrary = new TemplateLibrary();

    // Register settings and helper commands that depend on the extension context.
    registerTextSetting(context);
    registerUIHelperCommands(context);

    // Initialize or toggle UI elements that make the editor more beginner-friendly
    // (for example, showing additional hints in the sidebar).
    toggleUI(context);

    // Register the first lesson / set of steps for our learning flow.
    stepsOne(context);

    registerDebugSuite(context);
    /**
     * Command: aseje.createStarterProject
     *
     * Creates a new starter project using the templates from TemplateLibrary.
     * This gives new programmers a ready-to-use workspace with example code.
     */

    registerPythonHoverProvider(context);


    const templateDisposable = vscode.commands.registerCommand(
        'aseje.createStarterProject',
        () => {
            templateLibrary.createStarterProject();
        }
    );

    /**
     * Command: aseje.helloWorld
     *
     * Simple command used as a sanity check to confirm that the extension has
     * been activated and commands are successfully registered.
     */
    const helloWorldDisposable = vscode.commands.registerCommand(
        'aseje.helloWorld',
        () => {
            vscode.window.showInformationMessage('Hello World from ASEJE!');
        }
    );

    console.log('before');

    /**
     * Debug adapter factory for the custom Python debugger.
     *
     * For every debug session of type "python_D", VS Code calls
     * createDebugAdapterDescriptor. We respond by returning a DebugAdapterExecutable
     * that runs `pyDebuggerStart.js` in a separate Node process.
     *
     * @type {vscode.DebugAdapterDescriptorFactory}
     */
    const factory = {
        /**
         * Create and return a debug adapter descriptor.
         *
         * @param {vscode.DebugSession} _session - The debug session requesting an adapter.
         * @returns {vscode.DebugAdapterExecutable} Executable used as the debug adapter.
         */
        createDebugAdapterDescriptor(_session) {
            console.log('QQQQQ');

            // Build the full path to our debug adapter entry file.
            const adapterPath = path.join(__dirname, 'debugger', 'pyDebuggerStart.js');

            // Log whether the adapter file exists for easier troubleshooting.
            console.log(fs.existsSync(adapterPath));

            // Launch a Node process running the Python debugger adapter.
            const executable = new vscode.DebugAdapterExecutable('node', [adapterPath]);

            console.log(executable.command, executable.args);

            return executable;
        }
    };

    console.log('After');

    // Register the debug adapter factory for our custom debug type "python_D".
    context.subscriptions.push(
        vscode.debug.registerDebugAdapterDescriptorFactory('python_D', factory)
    );

    // NOTE:
    // `toggleModeDisposable` is expected to be created elsewhere (for example in
    // UISimple or another helper module) and made available here. It should
    // represent the command or listener used to switch between beginner mode and
    // normal mode. We still push it into subscriptions so VS Code disposes it
    // when the extension is deactivated.
    context.subscriptions.push(
        toggleModeDisposable,
        templateDisposable,
        helloWorldDisposable
    );

    // Log any time a debug session starts. This is helpful for understanding
    // when our debug adapter is being used and for debugging issues.
    vscode.debug.onDidStartDebugSession(session => {
        console.log('DEBUG SESSION STARTED:', session.type);
    });
}

/**
 * Called when the extension is deactivated.
 *
 * Currently, there is no explicit cleanup logic because all disposables that
 * were pushed into `context.subscriptions` are automatically disposed by VS Code.
 * Add any additional cleanup here if you allocate resources outside that list.
 */
function deactivate() {}

module.exports = {
    activate,
    deactivate
};
