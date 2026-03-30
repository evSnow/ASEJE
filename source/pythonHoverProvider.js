const vscode = require("vscode");

let isHoverEnabled = false; // Defaulted to off

const pythonDocs = {
  "print": "Displays the specified message to the screen or other standard output device.",
  "input": "Allows the user to enter data. Returns the input as a string.",
  "len": "Returns the number of items (length) in an object like a string, list, or dictionary.",
  "open": "Opens a file and returns a corresponding file object.",
  "int": "Converts a value into an integer number.",
  "str": "Converts a value into a string.",
  "if": "A conditional statement that runs a block of code if the condition is true.",
  "while": "A loop that continues as long as a specified condition is true.",
  "for": "A loop that repeats a block of code for each item in a sequence or range.",
  "return": "Ends a function and sends a value back to the caller.",
  "import": "Loads a module so its code can be used in the current file."
};

function setHoverStatus(status) {
  isHoverEnabled = status;
}

function registerPythonHoverProvider(context) {
  const provider = vscode.languages.registerHoverProvider("python", {
    provideHover(document, position) {
      if (!isHoverEnabled) return null;

      const diagnostics = vscode.languages.getDiagnostics(document.uri);
      const atPos = diagnostics.filter(d => d.range.contains(position));

      const md = new vscode.MarkdownString();
      const range = document.getWordRangeAtPosition(position);

      if (!range && atPos.length === 0) return null;

      const word = range ? document.getText(range) : "";

      if (atPos.length > 0) {
        md.appendMarkdown(`### Issue detected\n\n`);

        for (const d of atPos.slice(0, 3)) {
          const severity =
            d.severity === vscode.DiagnosticSeverity.Error ? "Error" :
            d.severity === vscode.DiagnosticSeverity.Warning ? "Warning" :
            d.severity === vscode.DiagnosticSeverity.Information ? "Information" :
            "Hint";

          const message = String(d.message);

          md.appendMarkdown(`**${severity}:** ${escapeMd(message)}\n\n`);

          const beginnerDiagnostic = explainDiagnostic(message);
          if (beginnerDiagnostic) {
            md.appendMarkdown(`${beginnerDiagnostic}\n\n`);
          }
        }

        md.appendMarkdown(`---\n\n`);
      }

      const explanation = explainLine(document, position);
      if (explanation) {
        md.appendMarkdown(`### What this line does\n\n`);
        md.appendMarkdown(explanation.map(item => `- ${item}`).join("\n"));
        md.appendMarkdown(`\n\n`);
      }

      if (word && pythonDocs[word]) {
        if (explanation || atPos.length > 0) {
          md.appendMarkdown(`---\n\n`);
        }

        md.appendMarkdown(`### Python keyword: \`${escapeInlineCode(word)}\`\n\n`);
        md.appendMarkdown(`${pythonDocs[word]}\n\n`);
      } else if (!explanation && word) {
        if (atPos.length > 0) {
          md.appendMarkdown(`**Symbol:** \`${escapeInlineCode(word)}\`\n\n`);
        }
      }

      md.isTrusted = false;

      if (range) return new vscode.Hover(md, range);
      return new vscode.Hover(md, atPos[0].range);
    },
  });

  context.subscriptions.push(provider);
}

function explainDiagnostic(message) {
  const lower = message.toLowerCase();

  if (lower.includes("not defined") || lower.includes("undefined")) {
    return "This usually means the code is trying to use a variable or name before it has been created or assigned a value.";
  }

  if (lower.includes("expected ':'") || lower.includes("expected colon")) {
    return "Python expected a colon at the end of this statement. Statements like if, for, while, def, and else usually end with a colon.";
  }

  if (lower.includes("unexpected indent")) {
    return "This line is indented more than Python expects. Check the spaces or tabs at the beginning of the line.";
  }

  if (lower.includes("unindent does not match")) {
    return "The indentation on this line does not match the surrounding block. Python uses indentation to decide which lines belong together.";
  }

  if (lower.includes("syntaxerror")) {
    return "There is a syntax problem on this line. Check punctuation, parentheses, colons, and indentation.";
  }

  if (lower.includes("cannot be assigned to")) {
    return "Python does not allow a value to be assigned in this way. Check that the left side of the equals sign is a valid variable name.";
  }

  return null;
}

function explainLine(document, position) {
  const line = document.lineAt(position.line).text;
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) return null;

  const rangeExplanation = explainRangeLoop(trimmed);
  if (rangeExplanation) return rangeExplanation;

  let m;

  m = trimmed.match(/^for\s+([A-Za-z_]\w*)\s+in\s+(.+)\s*:\s*$/);
  if (m) {
    const varName = m[1];
    const iterable = m[2].trim();

    return [
      "This is a for loop that repeats once for each item in a sequence or collection.",
      `During each repetition, \`${varName}\` becomes the next item from \`${iterable}\`.`
    ];
  }

  m = trimmed.match(/^while\s+(.+)\s*:\s*$/);
  if (m) {
    const condition = m[1].trim();

    return [
      "This is a while loop.",
      `The loop continues as long as the condition \`${condition}\` remains true.`,
      "If the condition never becomes false, the loop will keep running."
    ];
  }

  m = trimmed.match(/^if\s+(.+)\s*:\s*$/);
  if (m) {
    const condition = m[1].trim();

    return [
      "This is an if statement.",
      `If the condition \`${condition}\` is true, Python runs the indented block below it.`
    ];
  }

  m = trimmed.match(/^elif\s+(.+)\s*:\s*$/);
  if (m) {
    const condition = m[1].trim();

    return [
      "This is an elif statement.",
      `Python checks \`${condition}\` only if the earlier if or elif conditions were false.`
    ];
  }

  if (/^else\s*:\s*$/.test(trimmed)) {
    return [
      "This is an else statement.",
      "Python runs this block only when the earlier if or elif conditions were false."
    ];
  }

  m = trimmed.match(/^def\s+([A-Za-z_]\w*)\s*\((.*)\)\s*:\s*$/);
  if (m) {
    const name = m[1];
    const args = m[2].trim();

    return [
      "This defines a function.",
      `The function name is \`${name}\`.`,
      `Its parameters are ${args ? `\`${args}\`` : "`none`"}.`,
      "The indented block below contains the function body."
    ];
  }

  m = trimmed.match(/^return(?:\s+(.+))?\s*$/);
  if (m) {
    const expr = (m[1] || "").trim();

    return [
      "This return statement ends the current function.",
      expr
        ? `It sends the value \`${expr}\` back to the place where the function was called.`
        : "It ends the function without returning a specific value."
    ];
  }

  m = trimmed.match(/^import\s+(.+)\s*$/);
  if (m) {
    return [
      "This imports a module.",
      `It makes \`${m[1].trim()}\` available for use in this file.`
    ];
  }

  m = trimmed.match(/^from\s+(.+)\s+import\s+(.+)\s*$/);
  if (m) {
    return [
      "This imports specific items from a module.",
      `It imports \`${m[2].trim()}\` from \`${m[1].trim()}\`.`
    ];
  }

  m = trimmed.match(/^([A-Za-z_]\w*)\s*\+=\s*(.+)$/);
  if (m) {
    const left = m[1];
    const right = m[2].trim();

    return [
      "This updates a variable by adding a new value to its current value.",
      `It works like \`${left} = ${left} + ${right}\`.`
    ];
  }

  m = trimmed.match(/^([A-Za-z_]\w*)\s*\-=\s*(.+)$/);
  if (m) {
    const left = m[1];
    const right = m[2].trim();

    return [
      "This updates a variable by subtracting a value from its current value.",
      `It works like \`${left} = ${left} - ${right}\`.`
    ];
  }

  m = trimmed.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
  if (
    m &&
    !trimmed.includes("==") &&
    !trimmed.includes("!=") &&
    !trimmed.includes(">=") &&
    !trimmed.includes("<=")
  ) {
    const left = m[1];
    const right = m[2].trim();

    return [
      "This assigns a value to a variable.",
      `The variable \`${left}\` stores the result of \`${right}\`.`
    ];
  }

  return null;
}

function explainRangeLoop(trimmed) {
  let m;

  m = trimmed.match(/^for\s+([A-Za-z_]\w*)\s+in\s+range\(\s*([0-9]+)\s*\)\s*:\s*$/);
  if (m) {
    const varName = m[1];
    const stop = parseInt(m[2], 10);

    return [
      "This is a for loop that uses range() to generate numbers.",
      `The loop runs ${stop} times.`,
      `The variable \`${varName}\` takes the values 0 through ${stop - 1}.`
    ];
  }

  m = trimmed.match(/^for\s+([A-Za-z_]\w*)\s+in\s+range\(\s*([0-9]+)\s*,\s*([0-9]+)\s*\)\s*:\s*$/);
  if (m) {
    const varName = m[1];
    const start = parseInt(m[2], 10);
    const stop = parseInt(m[3], 10);

    return [
      "This is a for loop that uses range() to generate numbers.",
      `The variable \`${varName}\` starts at ${start} and stops before ${stop}.`,
      `It takes the values ${start} through ${stop - 1}.`
    ];
  }

  m = trimmed.match(/^for\s+([A-Za-z_]\w*)\s+in\s+range\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)\s*:\s*$/);
  if (m) {
    const varName = m[1];
    const start = parseInt(m[2], 10);
    const stop = parseInt(m[3], 10);
    const step = parseInt(m[4], 10);

    return [
      "This is a for loop that uses range() to generate numbers.",
      `The variable \`${varName}\` starts at ${start}, increases by ${step}, and stops before ${stop}.`
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

module.exports = { registerPythonHoverProvider, setHoverStatus };