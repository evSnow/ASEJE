const vscode = require("vscode");

const pythonDocs = {
  "print": "Displays the specified message to the screen or other standard output device.",
  "input": "Allows the user to enter data. Returns the input as a string.",
  "len": "Returns the number of items (length) in an object like a string, list, or dictionary.",
  "open": "Opens a file and returns a corresponding file object.",
  "int": "Converts a value into an integer number.",
  "str": "Converts a value into a string.",
  "if": "A conditional statement that runs a block of code if the condition is true.",
  "while": "A loop that continues as long as a specified condition is true."
};


function registerPythonHoverProvider(context) {
  const provider = vscode.languages.registerHoverProvider("python", {
    provideHover(document, position) {
      const diagnostics = vscode.languages.getDiagnostics(document.uri);
      const atPos = diagnostics.filter(d => d.range.contains(position));

      if (atPos.length > 0) {
        const md = new vscode.MarkdownString();
        md.appendMarkdown(`Issue detected\n\n`);

        for (const d of atPos.slice(0, 3)) {
          const severity =
            d.severity === vscode.DiagnosticSeverity.Error ? "Error" :
            d.severity === vscode.DiagnosticSeverity.Warning ? "Warning" :
            d.severity === vscode.DiagnosticSeverity.Information ? "Info" :
            "Hint";

          md.appendMarkdown(`**${severity}:** ${escapeMd(String(d.message))}\n\n`);
        }

        return new vscode.Hover(md, atPos[0].range);
      }

      const range = document.getWordRangeAtPosition(position);
      if (!range) return null;

      const word = document.getText(range);
      const md = new vscode.MarkdownString();

      if (pythonDocs[word]) {
      md.appendMarkdown(`### Python: \`${word}\`\n---\n`);
      md.appendMarkdown(`${pythonDocs[word]}\n\n`);
      } else {
      md.appendMarkdown(`**Symbol:** \`${escapeInlineCode(word)}\`\n\n`);
      }
      md.appendMarkdown(`Hover help is active for Python.\n`);
      md.isTrusted = true;

      return new vscode.Hover(md, range);
    },
  });

  context.subscriptions.push(provider);
}

function escapeMd(text) {
  return text.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
}

function escapeInlineCode(text) {
  return text.replace(/`/g, "\\`");
}

module.exports = { registerPythonHoverProvider };