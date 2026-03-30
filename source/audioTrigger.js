const vscode = require('vscode');

let audioPanel = null;

function playSound(context){
        audioPanel = vscode.window.createWebviewPanel(
            'audio', 'Audio',
            {viewColumn: vscode.ViewColumn.Two, preserveFocus: true },
            { enableScripts: true}
        )
        console.log("test")

    audioPanel.webview.html = `
        <h3>Click the button to play sound</h3>
        <button onclick="playBeep()">Play Beep</button>
        <script>
        async function playBeep() {
            const customContext = new AudioContext();
            if (customContext.state === 'suspended') {
                await customContext.resume();
            }

            const customOscillator = customContext.createOscillator();
            const customGain = customContext.createGain();
            customOscillator.connect(customGain);
            customGain.connect(customContext.destination);
            customOscillator.frequency.value = 1000; // beep frequency
            customGain.gain.setValueAtTime(1, customContext.currentTime);
            customOscillator.start();
            customOscillator.stop(customContext.currentTime + 1); // 1 second 

        }
        </script>
    `;
}

module.exports = {
    playSound
};