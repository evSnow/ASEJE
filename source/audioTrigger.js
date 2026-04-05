const path = require('path');
const vscode = require('vscode');

const AUDIO_VIEW_TYPE = 'aseje.audioService';
const DEFAULT_VOLUME = 0.45;
const FALLBACK_EVENTS = ['start', 'breakpoint', 'exception', 'terminate', 'change'];

function normalizeAudioConfig() {
    const config = vscode.workspace.getConfiguration('aseje.audio');
    const rawEvents = config.get('events', FALLBACK_EVENTS);
    const events = Array.isArray(rawEvents)
        ? rawEvents.filter(value => typeof value === 'string' && value.trim().length > 0)
        : FALLBACK_EVENTS;

    return {
        enabled: config.get('enabled', true) !== false,
        events: events.length ? events : FALLBACK_EVENTS,
        volume: clampVolume(config.get('volume', DEFAULT_VOLUME)),
        source: config.get('source', 'media/beep.wav')
    };
}
    function clampVolume(value) {
    const numericValue = Number(value);
    if (Number.isNaN(numericValue)) {
        return DEFAULT_VOLUME;
    }

    return Math.max(0, Math.min(1, numericValue));
}


function getEventLabel(eventName) {
    const eventLabels = {
        start: 'Debug session started',
        breakpoint: 'Breakpoint hit',
        exception: 'Exception raised',
        step: 'Execution paused',
        pause: 'Execution paused',
        terminate: 'Debug session ended',
        preview: 'Preview sound',
        change: 'change sound',
    };

    return eventLabels[eventName] || 'ASEJE notification';
}

class AudioNotifier {
    constructor(context) {
        this.context = context;
        this.panel = null;
        this.lastPlayedAt = 0;
        this.rateLimitMs = 350;
    }

    register() {
        const previewCommand = vscode.commands.registerCommand('audio.playSound', async () => {
            await this.play('preview', { force: true });
            vscode.window.showInformationMessage('ASEJE audio preview played.');
        });

    const pickSoundCommand = vscode.commands.registerCommand('audio.pickSound', async () => {
        const result = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: {
                Audio: ['wav', 'WAV', 'mp3', 'MP3', 'ogg', 'OGG', 'mp4', 'MP4']
            },
            openLabel: 'Select Sound File'
        });

        if (!result || result.length === 0) return;

        const filepath = result[0].fsPath;

        await vscode.workspace
            .getConfiguration('aseje.audio')
            .update('source', filepath, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage('ASEJE sound updated.');

        await this.play('change', { force: true }); // ✅ play sound immediately
    });
        const debugStart = vscode.debug.onDidStartDebugSession(async () => {
            let a=null;
        });

        const debugEnd = vscode.debug.onDidTerminateDebugSession(async () => {
            await this.play('terminate');
        });

        const debugCustom = vscode.debug.registerDebugAdapterTrackerFactory('*', {
            createDebugAdapterTracker: () => ({
                onDidSendMessage: async (message) => {
                    if (message.type !== 'event') return;

                    if (message.event === 'stopped') {
                        const reason = message.body?.reason || 'pause';
                        if (reason === 'breakpoint') {
                            await this.play('breakpoint');
                        } else if (reason === 'exception') {
                            await this.play('exception');
                        } else {
                            await this.play('step');
                        }
                    } else if (message.event === 'terminated') {
                        await this.play('terminate');
                    }
                }
            })
        });

        const configWatcher = vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('aseje.audio')) {
                this.ensurePanel();
                this.syncConfig();
            }
        });

        this.context.subscriptions.push(
            previewCommand,
            debugStart,
            debugEnd,
            debugCustom,
            configWatcher,
            pickSoundCommand,
            { dispose: () => this.dispose() }
        );
    }

    ensurePanel() {
        if (this.panel) {
            return this.panel;
        }

        this.panel = vscode.window.createWebviewPanel(
            AUDIO_VIEW_TYPE,
            'ASEJE Audio Service',
            { viewColumn: vscode.ViewColumn.Three, preserveFocus: true },
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(this.context.extensionPath, 'media')),
                    vscode.Uri.file(path.dirname(normalizeAudioConfig().source))
                ]
            }
        );

        this.panel.onDidDispose(() => {
            this.panel = null;
        });

        this.panel.webview.html = this.getWebviewHtml(this.panel.webview);
        this.syncConfig();
        return this.panel;
    }

    async play(eventName, options = {}) {
        const settings = normalizeAudioConfig();
        if (!settings.enabled && !options.force) {
            return;
        }

        if (!settings.events.includes(eventName) && !options.force) {
            return;
        }

        const now = Date.now();
        if (!options.force && now - this.lastPlayedAt < this.rateLimitMs) {
            return;
        }

        this.lastPlayedAt = now;
        const panel = this.ensurePanel();
        await panel.webview.postMessage({
            type: 'play',
            event: eventName,
            label: getEventLabel(eventName),
            volume: settings.volume,
            source: this.getSoundUri(panel.webview, settings.source)
        });
    }

    async syncConfig() {
        if (!this.panel) {
            return;
        }

        const settings = normalizeAudioConfig();
        await this.panel.webview.postMessage({
            type: 'config',
            enabled: settings.enabled,
            volume: settings.volume,
            source: this.getSoundUri(this.panel.webview, settings.source)
        });
    }

    getSoundUri(webview, sourceSetting) {
        let diskPath;

        if (path.isAbsolute(sourceSetting)) {
            diskPath = vscode.Uri.file(sourceSetting);
        } else {
            diskPath = vscode.Uri.file(
                path.join(this.context.extensionPath, sourceSetting)
            );
        }
        return webview.asWebviewUri(diskPath).toString();
    }

    getWebviewHtml(webview) {
        const soundUri = this.getSoundUri(webview, normalizeAudioConfig().source);

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ASEJE Audio Service</title>
    <style>
        body {
            font-family: sans-serif;
            padding: 16px;
            color: #1d2733;
            background: #f4f8fb;
        }
        .status {
            display: inline-block;
            padding: 6px 10px;
            border-radius: 999px;
            background: #d6ebff;
            font-size: 12px;
            margin-bottom: 12px;
        }
        h3 {
            margin: 0 0 8px;
        }
        p {
            margin: 0;
            line-height: 1.4;
        }
        code {
            background: rgba(0, 0, 0, 0.06);
            padding: 2px 4px;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="status" id="status">Idle</div>
    <h3>ASEJE Audio Notifications</h3>
    <p>This hidden helper panel plays a packaged sound when configured ASEJE debug events occur. Use <code>Play Sound</code> to preview it.</p>
    <audio id="player" preload="auto" src="${soundUri}"></audio>
    <script>
        const player = document.getElementById('player');
        const status = document.getElementById('status');
        let enabled = true;
        let queuedEvent = null;

        async function playNotification(message) {
            if (!enabled && !message.force) {
                return;
            }

            if (message.source) {
                player.src = message.source;
            }

            player.volume = typeof message.volume === 'number' ? message.volume : 0.45;

            try {
                player.currentTime = 0;
                await player.play();
                
                status.textContent = message.label || 'Playing';
            } catch (error) {
                queuedEvent = message;
                status.textContent = 'Waiting for audio permission';
            }
        }

        window.addEventListener('click', async () => {
            if (!queuedEvent) {
                return;
            }

            const retry = queuedEvent;
            queuedEvent = null;
            await playNotification({ ...retry, force: true });
        });

        window.addEventListener('message', async event => {
            const message = event.data;
            if (message.type === 'config') {
                enabled = message.enabled !== false;
                player.volume = typeof message.volume === 'number' ? message.volume : 0.45;
                if (message.source) {
                    player.src = message.source;
                }
                status.textContent = enabled ? 'Ready' : 'Disabled';
                return;
            }

            if (message.type === 'play') {
                await playNotification(message);
            }
        });
    </script>
</body>
</html>`;
    }

    dispose() {
        if (this.panel) {
            this.panel.dispose();
            this.panel = null;
        }
    }
}

function registerAudioNotifier(context) {
    const notifier = new AudioNotifier(context);
    notifier.register();
    return notifier;
}

module.exports = {
    registerAudioNotifier,
    normalizeAudioConfig,
    clampVolume
};