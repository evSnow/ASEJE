function activate(context){
    var thisProvider={
        resolveWebviewView:function(thisWebview, thisWebviewContext, thisToken){
            thisWebviewView.webview.options={enableScripts:true}
            thisWebviewView.webview.html=this.getWebview();
        }
    };
    context.subscriptions.push(
        vscode.commands.registerWebviewViewProvider("aseje.sidebar", thisProvider)
    );
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}

getWebview(); {
       return`
            <!DOCTYPE html>
            <html>
            <body>
                <h1>Hello from Side Panel!</h1>
                <button onclick="sendMessage()">Send Message</button>
                <script>
                    const vscode = acquireVsCodeApi();
                    function sendMessage() {
                        vscode.postMessage({
                            command: 'showMessage',
                            text: 'Hello from Webview!'
                        });
                    }
                </script>
            </body>
            </html>
        `;
};