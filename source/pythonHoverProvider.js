const vscode = require("vscode");

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

        md.isTrusted = false;
        return new vscode.Hover(md, atPos[0].range);
      }

      const range = document.getWordRangeAtPosition(position);
      if (!range) return null;

      const word = document.getText(range);
      const md = new vscode.MarkdownString();
      md.appendMarkdown(`**Symbol:** \`${escapeInlineCode(word)}\`\n\n`);
      md.appendMarkdown(`Hover help is active for Python.\n`);
      md.isTrusted = false;

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
