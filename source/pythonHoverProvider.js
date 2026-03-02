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

      const md = new vscode.MarkdownString();

      //diagnostics
      if (atPos.length > 0) {
        md.appendMarkdown(`### Issue detected\n\n`);

        for (const d of atPos.slice(0, 3)) {
          const severity =
            d.severity === vscode.DiagnosticSeverity.Error ? "Error" :
            d.severity === vscode.DiagnosticSeverity.Warning ? "Warning" :
            d.severity === vscode.DiagnosticSeverity.Information ? "Information" :
            "Hint";

          md.appendMarkdown(`**${severity}:** ${escapeMd(String(d.message))}\n\n`);
        }

        md.appendMarkdown(`---\n\n`);
      }

      const range = document.getWordRangeAtPosition(position);
      if (!range && atPos.length === 0) return null;

      const word = range ? document.getText(range) : "";

      //python keyword explanation
      if (word && pythonDocs[word]) {
        md.appendMarkdown(`### Python keyword: \`${escapeInlineCode(word)}\`\n\n`);
        md.appendMarkdown(`${pythonDocs[word]}\n\n`);
        md.appendMarkdown(`---\n\n`);
      } else if (word) {
        md.appendMarkdown(`**Symbol:** \`${escapeInlineCode(word)}\`\n\n`);
      }

      //beginner explanation of the line
      const explanation = explainLine(document, position);
      if (explanation) {
        md.appendMarkdown(`### What this line does\n\n`);
        md.appendMarkdown(explanation.map(x => `- ${x}`).join("\n"));
        md.appendMarkdown(`\n\n---\n\n`);
      }

      md.appendMarkdown(`Hover help is active for Python.`);
      md.isTrusted = false;

      if (range) return new vscode.Hover(md, range);
      return new vscode.Hover(md, atPos[0].range);
    },
  });

  context.subscriptions.push(provider);
}

function explainLine(document, position) {
  const line = document.lineAt(position.line).text;
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) return null;

  //for i in range(n)
  let m = trimmed.match(/^for\s+([A-Za-z_]\w*)\s+in\s+range\(\s*([0-9]+)\s*\)\s*:\s*$/);
  if (m) {
    const varName = m[1];
    const n = parseInt(m[2], 10);
    const end = n - 1;

    return [
      "This is a for loop that repeats a block of code.",
      `It runs ${n} times.`,
      `The variable \`${varName}\` takes values from 0 through ${end}.`
    ];
  }

  //for x in iterable
  m = trimmed.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+)\s*:\s*$/);
  if (m) {
    const varName = m[1];
    const iterable = m[2].trim();

    return [
      "This is a for loop that iterates over each item in a collection.",
      `During each iteration, \`${varName}\` becomes the next item from \`${iterable}\`.`
    ];
  }

  //while condition
  m = trimmed.match(/^while\s+(.+)\s*:\s*$/);
  if (m) {
    const condition = m[1].trim();

    return [
      "This is a while loop.",
      `The loop continues as long as the condition \`${condition}\` remains true.`,
      "If the condition never becomes false, the loop will continue indefinitely."
    ];
  }

  //if condition
  m = trimmed.match(/^if\s+(.+)\s*:\s*$/);
  if (m) {
    const condition = m[1].trim();

    return [
      "This is a conditional statement.",
      `If the condition \`${condition}\` evaluates to true, the indented block below will execute.`
    ];
  }

  //function definition
  m = trimmed.match(/^def\s+([A-Za-z_]\w*)\s*\((.*)\)\s*:\s*$/);
  if (m) {
    const name = m[1];
    const args = m[2].trim();

    return [
      "This defines a function.",
      `Function name: \`${name}\`.`,
      `Parameters: ${args || "none"}.`,
      "The indented block below contains the function’s code."
    ];
  }

  //return
  m = trimmed.match(/^return(?:\s+(.+))?\s*$/);
  if (m) {
    const expr = (m[1] || "").trim();

    return [
      "This statement exits the current function.",
      expr
        ? `It returns the value \`${expr}\` to the caller.`
        : "It returns without providing a value (defaults to None)."
    ];
  }

  //simple assignment
  m = trimmed.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
  if (m && !trimmed.includes("==") && !trimmed.includes("!=") && !trimmed.includes(">=") && !trimmed.includes("<=")) {
    const left = m[1];
    const right = m[2].trim();

    return [
      "This assigns a value to a variable.",
      `The variable \`${left}\` now stores the result of \`${right}\`.`
    ];
  }

  return null;
}

function escapeMd(text) {
  return text.replace(/[\\`*_{}[\]()#+\-.!]/g, "\\$&");
}

function escapeInlineCode(text) {
  return String(text).replace(/`/g, "\\`");
}

module.exports = { registerPythonHoverProvider };