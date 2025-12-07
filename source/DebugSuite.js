const vscode = require('vscode');

// Key used to store custom breakpoint data globally
const BREAKPOINT_DATA_KEY = 'aseje.breakpointData';
let heatmapDecorationType = null;

let accessibleBreakpointGutterDecoration = null;
let context;

/**
 * Loads persisted breakpoint data from global state.
 * @returns {Object} An object mapping file paths to line data.
 */
function loadBreakpointData() {
    return context.globalState.get(BREAKPOINT_DATA_KEY, {});
}

/**
 * Saves the current breakpoint data back to global state.
 * @param {Object} data - The updated breakpoint data.
 */
function saveBreakpointData(data) {
    context.globalState.update(BREAKPOINT_DATA_KEY, data);
}

/**
 * --- Feature: Breakpoint Notes ---
 * Command triggered via context menu to attach a note to a breakpoint.
 */

function getAccessibleBreakpointGutterDecoration() {
    if (!accessibleBreakpointGutterDecoration) {
    accessibleBreakpointGutterDecoration = vscode.window.createTextEditorDecorationType({
        isWholeLine: false,
        gutterIcon: {
            dark: new vscode.ThemeIcon('triangle-right', new vscode.ThemeColor('terminal.ansiCyan')),
light: new vscode.ThemeIcon('triangle-right', new vscode.ThemeColor('terminal.ansiBlue')) 
            },
            // Size adjustment for the icon
            gutterIconSize: '70%',
overviewRulerLane: vscode.OverviewRulerLane.Full
        });
    }
    return accessibleBreakpointGutterDecoration;
}

/**
 * Applies the custom accessible breakpoint icon to a specific line.
 * @param {vscode.TextEditor} editor 
 * @param {number} lineNum - 0-based line index.
 */
function applyCustomBreakpointIcon(editor, lineNum) {
    const range = new vscode.Range(lineNum, 0, lineNum, 0);
    const decorationType = getAccessibleBreakpointGutterDecoration();

editor.setDecorations(decorationType, []);
    
    // Apply the new accessible icon
    editor.setDecorations(decorationType, [range]);
}

/**
 * Removes the custom accessible breakpoint icon from a specific line.
 * @param {vscode.TextEditor} editor 
 * @param {number} lineNum - 0-based line index.
 */
function removeCustomBreakpointIcon(editor) {
    const decorationType = getAccessibleBreakpointGutterDecoration();
    editor.setDecorations(decorationType, []);
}

async function addBreakpointNote() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Get the line number where the user right-clicked
    const lineNum = editor.selection.active.line;
    const filePath = editor.document.uri.fsPath;

    const note = await vscode.window.showInputBox({
        prompt: `Enter a note for the breakpoint on line ${lineNum + 1}:`,
        placeHolder: 'e.g., Check variable "i" before loop ends.'
    });

    if (note === undefined) return; // User cancelled

    const data = loadBreakpointData();
    data[filePath] = data[filePath] || {};
    data[filePath][lineNum] = data[filePath][lineNum] || { count: 0 };
    // If the user clears the note, remove the line data entirely
    if (note.trim() === '') {
        delete data[filePath][lineNum];
        vscode.window.showInformationMessage(`Note removed for line ${lineNum + 1}.`);
    } else {
        data[filePath][lineNum].note = note;

    vscode.window.showInformationMessage(`Note saved for breakpoint on line ${lineNum + 1}.`);
    applyCustomBreakpointIcon(editor, lineNum); 
    }
    
    saveBreakpointData(data);


    applyAsejeDecorations();
}

/**
 * --- Feature: Breakpoint Auto Comments ---
 * Inserts a comment above the current line, marking it as an ASEJE breakpoint.
 */

function insertAutoComment() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const lineNum = editor.selection.active.line;

    // Insert comment one line above the current selection
    editor.edit(editBuilder => {
        editBuilder.insert(new vscode.Position(lineNum, 0), `// 🚧 ASEJE Breakpoint added for analysis.\n`);
    });
    applyCustomBreakpointIcon(editor, lineNum);
}


/**
 * --- Feature: Breakpoint Counter & Heatmap ---
 * Applies visual decorations based on hit count.
 */

function applyAsejeDecorations() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    // Clean up previous decorations
    if (heatmapDecorationType) {
        editor.setDecorations(heatmapDecorationType, []);
    }

    removeCustomBreakpointIcon(editor);

    const data = loadBreakpointData();
    const fileData = data[editor.document.uri.fsPath];
    if (!fileData) return;

    const heatmapDecorations = [];
    const maxHits = Math.max(...Object.values(fileData).map(item => item.count));
    const hitThreshold = maxHits > 0 ? maxHits / 3 : 1; // Used to determine heatmap level

if (!heatmapDecorationType) {
        heatmapDecorationType = vscode.window.createTextEditorDecorationType({
            isWholeLine: true,
            overviewRulerLane: vscode.OverviewRulerLane.Left,
        });
    }

    // 2. Map the data to the decorations
    for (const [line, item] of Object.entries(fileData)) {
        const lineNum = parseInt(line);

        if (item.count > 0 || item.note) {
            let backgroundColor = 'transparent'; // Default to transparent

        if (item.count >= hitThreshold * 2) {
            backgroundColor = 'rgba(255, 99, 71, 0.4)'; // High Heat (Tomato Red)
        } else if (item.count >= hitThreshold) {
            backgroundColor = 'rgba(255, 165, 0, 0.3)'; // Medium Heat (Orange)
        } else if (item.count > 0) {
            backgroundColor = 'rgba(144, 238, 144, 0.2)'; // Low Heat (Light Green)
        } else {
            continue; // Skip lines with zero hits
        }

        heatmapDecorations.push({
            range: editor.document.lineAt(lineNum).range,
            renderOptions: {
                backgroundColor: backgroundColor,
                // Override the gutter icon temporarily to reflect heat (optional)
            }
        });
        
        // You'd also update the counter text here if you wanted it visible on the line.
    applyCustomBreakpointIcon(editor, lineNum);

        } else {
            // If data exists but has no count and no note, delete it for cleanup
            delete fileData[line];
        }

    }

    editor.setDecorations(heatmapDecorationType, heatmapDecorations);

    // Save the cleaned up data
    saveBreakpointData(data);
}


/**
 * --- Feature: Breakpoint Counter Update on Hit ---
 * Listens for the debugger to stop (hit a breakpoint) and increments the counter.
 */
function registerDebugEvents() {
    // Listens for a change in the debug state (e.g., when the program hits a breakpoint)
    vscode.debug.onDidChangeBreakpoints(e => {
       
        applyAsejeDecorations(); 
    });

    // Simple way to ensure decorations are updated when switching tabs
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            applyAsejeDecorations();
        }
    });

    // A simpler tracking model for the final sprint is manual:
    const incrementDisposable = vscode.commands.registerCommand('aseje.incrementBreakpointHit', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;
        
        const lineNum = editor.selection.active.line;
        const filePath = editor.document.uri.fsPath;
        
        const data = loadBreakpointData();
        data[filePath] = data[filePath] || {};
        data[filePath][lineNum] = data[filePath][lineNum] || { count: 0 };
        data[filePath][lineNum].count++;
        saveBreakpointData(data);
        
        vscode.window.showInformationMessage(`Breakpoint on line ${lineNum + 1} hit count: ${data[filePath][lineNum].count}`);
        applyAsejeDecorations();
    });
    context.subscriptions.push(incrementDisposable);
}

/**
 * Registers all commands and initializes the Debugging Suite.
 * @param {vscode.ExtensionContext} extContext
 */
function registerDebugSuite(extContext) {
    context = extContext; // Store context globally
    
    // Register the custom note and comment commands
    context.subscriptions.push(
        vscode.commands.registerCommand('aseje.addBreakpointNote', addBreakpointNote),
        vscode.commands.registerCommand('aseje.insertAutoComment', insertAutoComment)
    );

    // Initialize all event listeners (for heatmap/counter tracking)
    registerDebugEvents();
    
    // Initial run to load any existing decorations
    applyAsejeDecorations();
}

module.exports = {
    registerDebugSuite
};