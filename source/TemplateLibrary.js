const vscode = require('vscode');


class TemplateLibrary {
    constructor() {
        // Initialization can go here
    }

    async createStarterProject() {
        // The file content for a simple Python template
        const pythonTemplateContent = 
`# Starter Project: Hello World

# This program prints a greeting.
print("Hello, new coder! Welcome to Project I-20.")`;

        try {
            // Create a new untitled document with the starter content
            const doc = await vscode.workspace.openTextDocument({
                language: 'python', // Sets syntax highlighting
                content: pythonTemplateContent
            });
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);

            vscode.window.showInformationMessage(`Starter Project created. Ready to run!`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to create starter project: ${error.message}`);
        }
    }
}

module.exports = {
    TemplateLibrary
}