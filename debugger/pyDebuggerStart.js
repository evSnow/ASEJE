// Import the VS Code debug adapter protocol helpers and base classes.
// LoggingDebugSession: base class that logs all protocol traffic
// InitializedEvent, StoppedEvent, TerminatedEvent: events we send back to VS Code
// Thread, StackFrame, Source, Breakpoint: objects used to describe debug state.
const {
    LoggingDebugSession,
    InitializedEvent,
    StoppedEvent,
    TerminatedEvent,
    DebugSession,
    Handles,
    OutputEvent,
    Thread,
    StackFrame,
    Source,
    Scope,
    Breakpoint
} = require('@vscode/debugadapter');

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Directory where we store debugger logs.
const Logs = path.join(__dirname, '..', 'logs');

// Ensure the logs directory exists.
if (!fs.existsSync(Logs)) {
    fs.mkdirSync(Logs, { recursive: true });
}

// Main log file for this debug adapter.
const starterLog = path.join(Logs, 'starter.log');

/**
 * Append a message to the starter log.
 * Used throughout the debug adapter for simple file-based logging.
 *
 * @param {string} msg - Message to write to the log file.
 */
function log(msg) {
    fs.appendFileSync(starterLog, msg + '\n');
}

/**
 * Custom debug session implementation for Python.
 *
 * This class acts as the "server" side of the debug adapter protocol.
 * It communicates with VS Code on one side and with a Python helper
 * process (pyRuntime.py) on the other side.
 *
 * Responsibilities:
 *  - Handle initialization and launch requests from VS Code
 *  - Forward stepping / continue / breakpoint commands to Python
 *  - Translate events from the Python runtime into DAP events
 *  - Maintain basic state such as current file and line
 */
class pyDebugSe extends LoggingDebugSession {
    constructor() {
        // Log all DAP traffic into py_1.log
        super('py_1.log');

        // Handle to the spawned Python runtime process.
        this.py_program = null;

        // In-memory breakpoint storage, keyed by file path.
        this.breakpoints = {};

        // Fixed thread id since we only support a single-threaded program.
        this.THREAD_ID = 1;

        // Track current execution line and file for stack traces.
        this.currentLine = 1;
        this.currentFile = '';

        // Placeholder for future stack frame support.
        this.stackFrames = [];

        this.requestSeq = 0;
        this.pendingResponses = new Map();  //scope
        log('Constructor initialized');
    }

    /**
     * Handle the "initialize" request from VS Code.
     *
     * This is the first request the client sends; it is used to declare which
     * capabilities the debug adapter supports.
     */
    initializeRequest(response, args) {
        log('Initialize Request');

        // Advertise which features are supported by this debug adapter.
        response.body = response.body || {};
        response.body.supportsConfigurationDoneRequest = true;
        response.body.supportsStepBack = false;
        response.body.supportsStepInTargetsRequest = false;

        this.sendResponse(response);

        // Notify VS Code that the adapter is ready to receive configuration and launch.
        this.sendEvent(new InitializedEvent());
        log('Initialized event sent');
    }

    /**
     * Called after configuration (e.g., breakpoints) has finished.
     */
    configurationDoneRequest(response, args) {
        log('Configuration done');
        this.sendResponse(response);
    }

    /**
     * Handle the "launch" request.
     *
     * This starts the Python runtime process (pyRuntime.py) and passes it
     * the target user program. The debug adapter then listens to stdout
     * from the Python process and converts JSON messages into DAP events.
     */
    async launchRequest(response, args) {
        log('Launch Request started');

        // Absolute path to the user's Python program.
        let program = path.resolve(args.program);

        // Path to our Python runtime helper script.
        let programPath = path.join(__dirname, '..', 'python_runtime', 'pyRuntime.py');

        // Basic validation on paths.
        if (!fs.existsSync(programPath)) {
            log('Runtime does not worked because bad pathing ' + programPath);
            return;
        }

        if (!fs.existsSync(program)) {
            log('Target program not because bad pathing: ' + program);
            return;
        }

        this.currentFile = program;
        log('Program:' + program);
        log('Runtime:' + programPath);

        // Spawn Python process that will coordinate debugging.
        this.py_program = spawn('python3', [programPath, program]);

        // If the process fails to start at all.
        this.py_program.on('error', err => {
            log('Runtime failed: ' + err);
            this.sendEvent(new TerminatedEvent());
        });

        // When the Python runtime ends normally or with an error code.
        this.py_program.on('exit', code => {
            log('Runtime ended:' + code);
            this.sendEvent(new TerminatedEvent());
        });

        // Buffer for assembling complete JSON lines from stdout.
        let buff = '';

        // Handle messages coming from the Python runtime.
        this.py_program.stdout.on('data', info => {
            buff += info.toString();

            // Split by newline; last element may be incomplete, keep it in buff.
            let lines = buff.split('\n');
            buff = lines.pop();

            lines.forEach(data => {
                if (!data.trim()) return;

                log('Received: ' + data);

                try {
                    // Python runtime sends JSON describing events and state.
                    const current = JSON.parse(data);
                    log("hffi");
                    if (current.event === 'stopped') {
                        this.currentLine = current.line;
                        let reason = current.reason || 'step';
                        log('line:' + this.currentLine + ' reason: ' + reason);
                        this.sendEvent(new StoppedEvent(reason, this.THREAD_ID));
                    } else if (current.event === 'breakpoint') {
                        this.currentLine = current.line;
                        log('Breakpoint hit: ' + this.currentLine);
                        this.sendEvent(new StoppedEvent('breakpoint', this.THREAD_ID));
                    } else if (current.event === 'terminated') {
                        log('Program terminated');
                        this.sendEvent(new TerminatedEvent());
                    } else if (current.event === 'variables') { // get variable
                        log("heaallo");
                        const resolve = this.pendingResponses.get(current.requestId);  // store waiting promises to get value form pyruntime
                        if (resolve) {
                            resolve(current.variables);
                            this.pendingResponses.delete(current.requestId);  // delete waiting promisies when completed
                        }
                        else{
                            log('error');
                        }
                    } else {
                        // If it's some other JSON event we don't handle yet,
                        // forward it as output so the user can still see it.
                        this.sendEvent(new OutputEvent(data + '\n', 'stdout'));
                    }
                } catch (error) {
                    // If stdout line is not valid JSON, treat it as normal output.
                    log('Error in launch request: ' + error + ' Data is:' + data);
                    this.sendEvent(new OutputEvent(data + '\n', 'stdout'));
                }
            });
        });

        log('Launch request completed');
        this.sendResponse(response);
    }

    /**
     * Handle "setBreakpoints" from VS Code.
     *
     * We store the breakpoints for the given file locally and also send them
     * to the Python runtime so it knows where to pause execution.
     */
    setBreakPointsRequest(response, args) {
        let filePath = path.resolve(args.source.path);
        let lines = args.lines || [];
        log('Breakpoint at ' + lines);

        if (!fs.existsSync(filePath)) {
            log('file path does not exist for ' + filePath);
            response.body = { breakpoints: [] };
            this.sendResponse(response);
            return;
        }

        // Store breakpoints for this file.
        this.breakpoints[filePath] = lines;

        // Forward breakpoints to the Python runtime.
        if (this.py_program && this.py_program.stdin.writable) {
            const loc = JSON.stringify({
                command: 'setBreakpoints',
                file: filePath,
                lines: lines
            }) + '\n';

            log('Sending to Python: ' + loc.trim());
            this.py_program.stdin.write(loc);
        } else {
            log('Breakpoint not ready to be implmeted');
        }

        // Report all breakpoints as verified back to VS Code.
        const breakpoints = lines.map(line => {
            return new Breakpoint(true, line);
        });

        response.body = { breakpoints: breakpoints };
        this.sendResponse(response);
    }

    scopesRequest(response, args){  // used to establish globals and local in dap
        log('fello');
        response.body = {
            scopes: [
                {name: 'Local', variablesReference: 1, expensive: false},
                {name: 'Globals', variablesReference: 2, expensive: true}
            ]
        }
        this.sendResponse(response);
    }


    async variablesRequest(response, args){  //request variable from dap
        const ref = args.variablesReference; // get if local or global 1,2
        let scope;
        log("test var"+ref); 
        if (ref === 1) {
            scope='locals';
        }

        else if (ref === 2) {
            scope='globals';
        }
        else {
            response.body = { variables: [] };
            this.sendResponse(response);
            return;
        }
        const variables = await this.getVariablesFromPython(scope); // code that wait for the promise in get variable from python
        log(variables);
        response.body = { variables};
        this.sendResponse(response);
    }
    getVariablesFromPython(scope) {
        const requestId = ++this.requestSeq; // put id in a request to not overlap
        log(`Requesting variables for scope: ${scope}, requestId: ${requestId}`);
        return new Promise((resolve,reject) => {  //put process in a promise which willrequest info from run time
            this.pendingResponses.set(requestId, resolve); //store the order to not overlap
            const message = JSON.stringify({ command: "variables", scope, requestId }) + "\n";
            const success = this.py_program.stdin.write(message); // send to runtime
            if(!success){
                this.pendingResponses.delete(requestId);
                reject(new Error("Failed to write to Python stdin"));
            }

        });
    }

    /**
     * Handle "threads" request.
     *
     * Our adapter is single-threaded, so we always return a single thread.
     */
    threadsRequest(response) {
        log('Threads request');
        response.body = {
            threads: [new Thread(this.THREAD_ID, 'Main Thread')]
        };
        this.sendResponse(response);
    }

    /**
     * Handle "stackTrace" request.
     *
     * We only track a single frame: the current file and line.
     * This still gives the user enough information to see where execution stopped.
     */
    stackTraceRequest(response, args) {
        log('Stack trace request');

        const frames = [
            new StackFrame(
                1, // frame id
                `line ${this.currentLine}`, // frame name shown in UI
                new Source(path.basename(this.currentFile), this.currentFile), // source file
                this.currentLine, // line number
                1 // column (start of line)
            )
        ];

        response.body = {
            stackFrames: frames,
            totalFrames: 1
        };
        this.sendResponse(response);
    }

    /**
     * Handle "continue" request from VS Code.
     *
     * Tells the Python runtime to resume execution until the next breakpoint or end.
     */
    continueRequest(response) {
        log('Continue request');
        if (this.py_program && this.py_program.stdin.writable) {
            this.py_program.stdin.write(
                JSON.stringify({ command: 'continue' }) + '\n'
            );
        }
        this.sendResponse(response);
    }

    /**
     * Handle "next" (step over) request.
     */
    nextRequest(response) {
        log('Next (step over) request');
        this.py_program.stdin.write(
            JSON.stringify({ command: 'step_over' }) + '\n'
        );
        this.sendResponse(response);
    }

    /**
     * Handle "stepIn" request.
     */
    stepInRequest(response) {
        log('Step in request');
        this.py_program.stdin.write(
            JSON.stringify({ command: 'step_in' }) + '\n'
        );
        this.sendResponse(response);
    }

    /**
     * Handle "stepOut" request.
     */
    stepOutRequest(response) {
        log('Step out request');
        this.py_program.stdin.write(
            JSON.stringify({ command: 'step_out' }) + '\n'
        );
        this.sendResponse(response);
    }

    /**
     * Handle "disconnect" request.
     *
     * Called when the user stops debugging. We make sure to kill the Python
     * runtime process so no stray child processes are left running.
     */
    disconnectRequest(response, args) {
        log('Disconnect request');
        if (this.py_program) {
            this.py_program.kill();
        }
        this.sendResponse(response);
    }
}

// Entry point for the debug adapter. VS Code will create an instance of
// pyDebugSe and start handling incoming debug protocol messages.
DebugSession.run(pyDebugSe);
