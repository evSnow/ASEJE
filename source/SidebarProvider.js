const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const sidebarItems = require('./sidebar-data');
class SidebarProvider {
  constructor(extensionUri, context) {
    this.extensionUri = extensionUri;
    this._onHoverToggle = null; // Storage for the callback
    this.context = context;
  }

  setHoverToggleCallback(callback) {
      this._onHoverToggle = callback;
    }


  resolveWebviewView(webviewView) {
    this._view = webviewView;

    webviewView.webview.options = { enableScripts: true };

    const nonce = getNonce();
    const itemsJson = JSON.stringify(sidebarItems);
    const savedNotes = this.context.globalState.get('aseje.notes', '');
    const hoverEnabled = this.context.globalState.get('aseje.hoverEnabled', false);



    webviewView.webview.html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none';
                 style-src 'unsafe-inline';
                 script-src 'nonce-${nonce}';" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ASEJE Sidebar</title>
  <style>
    body {
      font-family: var(--vscode-font-family, sans-serif);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-foreground);
      background: var(--vscode-sideBar-background);
      padding: 12px;
      margin: 0;
    }
    h2 {
      margin: 0 0 4px;
      font-size: 1.15em;
      font-weight: 600;
    }
    h3 {
      margin: 16px 0 8px;
      font-size: 1em;
      font-weight: 600;
    }
    .desc {
      margin: 0 0 12px;
      opacity: 0.75;
      font-size: 0.92em;
    }
    #search {
      box-sizing: border-box;
      width: 100%;
      padding: 6px 8px;
      margin-bottom: 8px;
      border: 1px solid var(--vscode-input-border, #3c3c3c);
      border-radius: 4px;
      background: var(--vscode-input-background, #1e1e1e);
      color: var(--vscode-input-foreground, #ccc);
      font-size: 0.92em;
      outline: none;
    }
    #search:focus {
      border-color: var(--vscode-focusBorder, #007acc);
    }
    #search::placeholder,
    #notes::placeholder {
      color: var(--vscode-input-placeholderForeground, #888);
    }

    #results {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    #results li {
      padding: 6px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.92em;
    }
    #results li:hover {
      background: var(--vscode-list-hoverBackground, #2a2d2e);
    }
    .no-results {
      opacity: 0.5;
      font-style: italic;
      padding: 6px 8px;
      font-size: 0.92em;
    }
    #notes {
      box-sizing: border-box;
      width: 100%;
      min-height: 140px;
      resize: vertical;
      padding: 8px;
      border: 1px solid var(--vscode-input-border, #3c3c3c);
      border-radius: 4px;
      background: var(--vscode-input-background, #1e1e1e);
      color: var(--vscode-input-foreground, #ccc);
      font-size: 0.92em;
      outline: none;
    }

    .button-row {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    button {
      padding: 6px 10px;
      border: 1px solid var(--vscode-button-border, transparent);
      border-radius: 4px;
      background: var(--vscode-button-background, #0e639c);
      color: var(--vscode-button-foreground, white);
      cursor: pointer;
      font-size: 0.9em;
    }

    button:hover {
      background: var(--vscode-button-hoverBackground, #1177bb);
    }

    .secondary {
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, white);
    }

    .secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground, #45494e);
    }

    .status {
      margin-top: 6px;
      font-size: 0.85em;
      opacity: 0.8;
      min-height: 1.2em;
    }
  </style>
</head>
<body>
  <h2>ASEJE Sidebar</h2>
  <p class="desc">Beginner-friendly tools and quick actions.</p>

<label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">
    <input type="checkbox" id="hoverToggle" ${hoverEnabled ? 'checked' : ''}/>
    <span style="margin-left: 8px;">Enable Hover Hints</span>
  </label>
  <hr/>



  <input type="text" id="search" placeholder="Search\u2026" />
  <ul id="results"></ul>

  <h3>Notes</h3>
  <textarea id="notes" placeholder="Write notes here...">${escapeHtml(savedNotes)}</textarea>
  <div class="button-row">
    <button id="saveNotesBtn">Save Notes</button>
    <button id="clearNotesBtn" class="secondary">Clear Notes</button>
    <button id="openNotesButton" class="secondary">Open Notes</button>
  </div>
  <div id="noteStatus" class="status"></div>

  <script nonce="${nonce}">
    (function () {
      const vscodeApi = acquireVsCodeApi();
      const items = ${itemsJson};
      
      
      const hoverToggle = document.getElementById("hoverToggle");
      const saveNotesBtn = document.getElementById("saveNotesBtn");
      const clearNotesBtn = document.getElementById("clearNotesBtn");
      const notesEl = document.getElementById("notes");
      const noteStatus = document.getElementById("noteStatus");

      const openNotesButton = document.getElementById("openNotesButton");

      openNotesButton.addEventListener("click", () => {
        vscodeApi.postMessage({
          command: "openNotes"
        });
      });

      hoverToggle.addEventListener("change", (e) => {
        vscodeApi.postMessage({ 
          command: "toggleHover", 
          value: e.target.checked 
        });
      });

      saveNotesBtn.addEventListener("click", () => {
        vscodeApi.postMessage({
          command: "saveNotes",
          value: notesEl.value
        });
      });

      clearNotesBtn.addEventListener("click", () => {
        notesEl.value = "";
        vscodeApi.postMessage({
          command: "clearNotes"
        });
      });

      window.addEventListener("message", event => {
        const message = event.data;

        if (message.command === "notesSaved") {
          noteStatus.textContent = "Notes saved.";
          setTimeout(() => {
            noteStatus.textContent = "";
          }, 2000);
        }

        if (message.command === "notesCleared") {
          noteStatus.textContent = "Notes cleared.";
          setTimeout(() => {
            noteStatus.textContent = "";
          }, 2000);
        }
      });


      const searchElement  = document.getElementById("search");
      const resultsElement = document.getElementById("results");

      function render(filter) {
        const query = (filter || "").toLowerCase();
        
        const matched = items.filter(i => {
          const text = (
            (i.title || "") + " " +
            (i.description || "") + " " +
            (i.keywords || []).join(" ")
          ).toLowerCase();
          return text.includes(query);
        });
        resultsElement.innerHTML = "";

        if (matched.length === 0) {
          const list = document.createElement("li");
          list.textContent = "No results found for search terms";
          resultsElement.append(list);
          return;
        }

        matched.forEach(item => {
          const list = document.createElement("li");

          const title = document.createElement("div");
          title.textContent = item.title;

          const desc = document.createElement("div");
          desc.textContent = item.description;

          list.append(title,desc);

          list.addEventListener("click", () => {
            console.log("running");
              vscodeApi.postMessage({ command: "runCommand", value: item.action });
          });
          resultsElement.append(list);
        });
      }

      searchElement.addEventListener("input", () => render(searchElement.value));

      // Show all items on initial load.
      render("");
    })();
  </script>
</body>
</html>`;


const actionList = {
  showReference: "aseje.reference",
  toggleBeginnerMode: "aseje.toggleBeginnerMode",
  createStarterProject: "aseje.createStarterProject",
  showWalkthrough: "aseje.showWalkthrough",
  playSound: "audio.playSound",
  Debug_Tips: "aseje.showDebuggingTips",
  Python_Tips: "aseje.pyTips",
  VS_Shortcuts: "aseje.vscodeShort",
  TextSetting: "aseje.textSetting"
};
    // Listen for messages sent from the webview script.
    webviewView.webview.onDidReceiveMessage(async (message) => {
      if (message.command === 'runCommand' && message.value) {
        const command = actionList[message.value] || message.value;
        vscode.commands.executeCommand(command);
      }


  else if (message.command === 'toggleHover') {
      await this.context.globalState.update('aseje.hoverEnabled', message.value);
        if (this._onHoverToggle) {
          this._onHoverToggle(message.value);
        }
      }
  else if (message.command === 'saveNotes') {

        await this.context.globalState.update('aseje.notes', message.value || '');

        const filePath = path.join(this.context.globalStorageUri.fsPath, 'notes.md');
        fs.mkdirSync(this.context.globalStorageUri.fsPath, { recursive: true });
        fs.writeFileSync(filePath, message.value, 'utf8');


        webviewView.webview.postMessage({
          command: 'notesSaved'
        });

      } 
  else if (message.command === 'clearNotes') {
        await this.context.globalState.update('aseje.notes', '');

        webviewView.webview.postMessage({
          command: 'notesCleared'
        });
      }
  else if (message.command === 'openNotes') {
    const filePath = path.join(this.context.globalStorageUri.fsPath, 'notes.md');

    const uri = vscode.Uri.file(filePath);
    const doc = await vscode.workspace.openTextDocument(uri);

    vscode.window.showTextDocument(doc);
  }    
    });
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getNonce() {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

module.exports = { SidebarProvider };
