const vscode = require('vscode');
const path = require('path');

const sidebarItems = require('./sidebar-data');
class SidebarProvider {
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
    this._onHoverToggle = null; // Storage for the callback
  }

setHoverToggleCallback(callback) {
    this._onHoverToggle = callback;
  }


  resolveWebviewView(webviewView) {
    this._view = webviewView;

    webviewView.webview.options = { enableScripts: true };

    const nonce = getNonce();
    const itemsJson = JSON.stringify(sidebarItems);


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
    #search::placeholder {
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
  </style>
</head>
<body>
  <h2>ASEJE Sidebar</h2>
  <p class="desc">Beginner-friendly tools and quick actions.</p>

<label style="display: flex; align-items: center; margin-bottom: 12px; cursor: pointer;">
    <input type="checkbox" id="hoverToggle" /> 
    <span style="margin-left: 8px;">Enable Hover Hints</span>
  </label>
  <hr/>



  <input type="text" id="search" placeholder="Search\u2026" />
  <ul id="results"></ul>

  <script nonce="${nonce}">
    (function () {
      const vscodeApi = acquireVsCodeApi();
      const items = ${itemsJson};
      
      
      const hoverToggle = document.getElementById("hoverToggle");
      hoverToggle.addEventListener("change", (e) => {
        vscodeApi.postMessage({ 
          command: "toggleHover", 
          value: e.target.checked 
        });
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
  openDebugHelp: "aseje.showDebugHelp",
  toggleBeginnerMode: "aseje.toggleBeginnerMode",
  createStarterProject: "aseje.createStarterProject",
  openMediaTools: "aseje.openMediaTools",
  openHelpCenter: "aseje.openHelpCenter",
  showWalkthrough: "aseje.showWalkthrough",
  playSound: "audio.playSound"
};
    // Listen for messages sent from the webview script.
    webviewView.webview.onDidReceiveMessage(message => {
      if (message.command === 'runCommand' && message.value) {
        const comman = actionList[message.value] || message.value;
        vscode.commands.executeCommand(comman);
      }


  else if (message.command === 'toggleHover') {
        if (this._onHoverToggle) {
          this._onHoverToggle(message.value);
        }
      }

    });
  }
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
