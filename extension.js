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

  registerPythonHoverProvider(context);

  /**
   * ✅ Sidebar Webview Provider registration (THIS IS THE MISSING PIECE)
   * This will mount HTML into the view id: aseje.sidebarView (from package.json)
   */
  const sidebarProvider = new ASEJESidebarProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('aseje.sidebarView', sidebarProvider, {
      webviewOptions: { retainContextWhenHidden: true }
    })
  );

  /**
   * Command: aseje.createStarterProject
   *
   * Creates a new starter project using the templates from TemplateLibrary.
   * This gives new programmers a ready-to-use workspace with example code.
   */
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

  // IMPORTANT:
  // If toggleModeDisposable is not defined anywhere, it will crash activation.
  // We'll only push it if it exists.
  try {
    if (typeof toggleModeDisposable !== 'undefined' && toggleModeDisposable) {
      context.subscriptions.push(toggleModeDisposable);
    }
  } catch (e) {
    // ignore if not defined
  }

  context.subscriptions.push(
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
 * Sidebar provider that renders HTML inside the Explorer view.
 */
class ASEJESidebarProvider {
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
  }

  resolveWebviewView(webviewView) {
    webviewView.webview.options = { enableScripts: true };

    const nonce = getNonce();

    webviewView.webview.html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 style-src 'unsafe-inline';
                 script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ASEJE Sidebar</title>
</head>
<body style="font-family: sans-serif; padding: 10px;">
  <h2>ASEJE Sidebar Loaded ✅</h2>
  <p>This means the sidebar webview is mounted correctly.</p>

  <button id="btn">Test Button</button>
  <p id="out"></p>

  <script nonce="${nonce}">
    const out = document.getElementById("out");
    document.getElementById("btn").addEventListener("click", () => {
      out.textContent = "Button works ✅";
    });
  </script>
</body>
</html>`;
  }
}

function getNonce() {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let text = "";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

/**
 * Called when the extension is deactivated.
 */
function deactivate() {}

module.exports = {
  activate,
  deactivate
};
