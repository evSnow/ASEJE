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

getWebview() {
       return`
            <!DOCTYPE html>
            <html>
            <body>
                <h1>Side Panel</h1>
            </body>
            </html>
        `;
};