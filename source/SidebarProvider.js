const vscode = require('vscode');

class SidebarProvider {
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
  }

  resolveWebviewView(webviewView) {
    this._view = webviewView;

    webviewView.webview.options = { enableScripts: true };

    const nonce = getNonce();

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

  <input type="text" id="search" placeholder="Search\u2026" />
  <ul id="results"></ul>

  <script nonce="${nonce}">
    (function () {
      const vscodeApi = acquireVsCodeApi();

      const items = [
        { label: "Walkthrough",     cmd: "aseje.showWalkthrough" },
        { label: "Beginner Mode",   cmd: "aseje.toggleBeginnerMode" },
        { label: "Starter Project", cmd: "aseje.createStarterProject" },
        { label: "Reference",     cmd: "aseje.reference" }
      ];

      const searchEl  = document.getElementById("search");
      const resultsEl = document.getElementById("results");

      function render(filter) {
        const query = (filter || "").toLowerCase();
        const matched = items.filter(i => i.label.toLowerCase().includes(query));

        resultsEl.innerHTML = "";

        if (matched.length === 0) {
          const li = document.createElement("li");
          li.className = "no-results";
          li.textContent = "No results found.";
          resultsEl.appendChild(li);
          return;
        }

        matched.forEach(item => {
          const li = document.createElement("li");
          li.textContent = item.label;
          li.addEventListener("click", () => {
            if (item.cmd) {
              vscodeApi.postMessage({ command: "runCommand", value: item.cmd });
            }
          });
          resultsEl.appendChild(li);
        });
      }

      searchEl.addEventListener("input", () => render(searchEl.value));

      // Show all items on initial load.
      render("");
    })();
  </script>
</body>
</html>`;

    // Listen for messages sent from the webview script.
    webviewView.webview.onDidReceiveMessage(message => {
      if (message.command === 'runCommand' && message.value) {
        vscode.commands.executeCommand(message.value);
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
