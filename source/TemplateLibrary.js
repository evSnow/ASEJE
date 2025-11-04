const vscode = require('vscode');


class TemplateLibrary {
    constructor() {
        this.templates = [
            { 
                label: '$(python) Python Starter', 
                description: 'A basic Hello World program.',
                language: 'python',
                content: 
`# Starter Project: Hello World

# This program prints a greeting.
print("Hello, new coder!")`
            },
            { 
                label: '$(browser) HTML Starter', 
                description: 'A bare-bones HTML page structure.',
                language: 'html',
                content:
`<DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My First Webpage</title>
</head>
<body>
    <h1>Hello, ASEJE Beginner!</h1>
    <p>This is your first HTML document. Edit me!</p>
</body>
</html>`
            },

            {
                label: '$(file-code) C Starter', 
                description: 'A basic "Hello World" C program.',
                language: 'c',
                content:
`#include <stdio.h>

int main() {
    // Print a simple greeting to the console
    printf("Hello, C World from ASEJE!\n");
    return 0;
}`
            }
        ];
    }

    async createStarterProject(){
        
        const selection = await vscode.window.showQuickPick(this.templates, {
            placeHolder: 'Select a project template to get started:',
            ignoreFocusOut: true
        });

        // If the user cancels the selection, stop
        if (!selection) {
            return;
        }

        try {
            // Create a new untitled document with the starter content
            const doc = await vscode.workspace.openTextDocument({
                language: selection.language, 
                content: selection.content
            });
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);

            vscode.window.showInformationMessage(`✅ ${selection.label} created. Ready to code!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create starter project: ${error.message}`);
        }
    }
}

module.exports = {
    TemplateLibrary
}