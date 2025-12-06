const {LoggingDebugSession, InitializedEvent, StoppedEvent, TerminatedEvent, 
        DebugSession, Handles, OutputEvent, Thread, StackFrame, Source, Scope, Breakpoint} = require('@vscode/debugadapter');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const Logs = path.join(__dirname,'..', 'logs');

if (!fs.existsSync(Logs)) {
    fs.mkdirSync(Logs, { recursive: true });
}
const starterLog = path.join(Logs,'starter.log');

function log(msg) {
    fs.appendFileSync(starterLog, msg + '\n');
}

class pyDebugSe extends LoggingDebugSession {  
    constructor(){ 
        super("py_1.log");
        this.py_program = null;
        this.breakpoints = {};
        //this.variableHandles = new Handles();
        this.THREAD_ID = 1; 
        this.currentLine = 1;
        this.currentFile = '';
        this.stackFrames = [];
        log("Constructor initialized");
    }

    initializeRequest(response, args) {
        log("Initialize Request");
        
        //below used to set setting
        response.body = response.body || {};
        response.body.supportsConfigurationDoneRequest = true;
        response.body.supportsStepBack = false;
        response.body.supportsStepInTargetsRequest = false;
        
        this.sendResponse(response);
        this.sendEvent(new InitializedEvent());
        log("Initialized event sent");
    }

    configurationDoneRequest(response, args) {
        log("Configuration done");
        this.sendResponse(response);
    }

    async launchRequest(response, args) {
        log("Launch Request started");
        
        let program = path.resolve(args.program);
        let programPath = path.join(__dirname, "..", "python_runtime", "pyRuntime.py");
        
        if(!fs.existsSync(programPath)) {
            log("Runtime does not worked because bad pathing " + programPath);
            return;
        }
        
        if(!fs.existsSync(program)) {
            log("Target program not because bad pathing: " + program);
            return;
        }
        
        this.currentFile = program;
        log("Program:" + program);
        log("Runtime:" + programPath);
        
        // Spawn Python process
        this.py_program = spawn("python3", [programPath, program]);
        
        this.py_program.on("error", err => {
            log("Runtime failed: " + err);
            this.sendEvent(new TerminatedEvent());
        });
        
        this.py_program.on("exit", code => {
            log("Runtime ended:" + code);
            this.sendEvent(new TerminatedEvent());
        });
        
        let buff = "";
        
        this.py_program.stdout.on("data", info => {
            buff += info.toString();
            let lines = buff.split("\n");
            buff = lines.pop(); // Keep incomplete line for next chunk and remove it from lines

            lines.forEach(data => {
                if (!data.trim()) return;
                
                log("Received: " + data);

                try {
                    const current = JSON.parse(data);
                    
                    if (current.event === "stopped") {
                        this.currentLine = current.line; 
                        let reason = current.reason || "step";
                        log("line:"+this.currentLine+ " reason: "+reason);
                        this.sendEvent(new StoppedEvent(reason, this.THREAD_ID));
                    }
                    else if (current.event === "breakpoint") {
                        this.currentLine = current.line;
                        log("Breakpoint hit: "+ this.currentLine);
                        this.sendEvent(new StoppedEvent("breakpoint", this.THREAD_ID));
                    }
                    else if (current.event === "terminated") {
                        log("Program terminated");
                        this.sendEvent(new TerminatedEvent());
                    }
                    else {
                        // Regular output
                        this.sendEvent(new OutputEvent(data + '\n', 'stdout'));
                    }

                } catch (error) {
                    log("Error in parshing json code: " + error + " Data is:" + data);
                    // Not JSON, treat as regular output
                    this.sendEvent(new OutputEvent(data + '\n', 'stdout'));
                }
            });
        });
        log("Launch request completed");
        this.sendResponse(response);
    }

    setBreakPointsRequest(response, args) {
        let filePath = path.resolve(args.source.path);
        let lines = args.lines || [];
        log("Breakpoint at " + lines);
        
        if(!fs.existsSync(filePath)) {
            log("file path does not exist for " + filePath);
            response.body = { breakpoints: [] };
            this.sendResponse(response);
            return;
        }
        
        // Store breakpoints
        this.breakpoints[filePath] = lines;
        
        // Send to Python runtime
        if(this.py_program && this.py_program.stdin.writable) {
            const loc = JSON.stringify({
                command: "setBreakpoints",
                file: filePath,
                lines: lines
            }) + "\n";
            
            log("Sending to Python: " + loc.trim());
            this.py_program.stdin.write(loc);
        } else {
            log("Breakpoint not ready to be implmeted");
        }
        
        // Return verified breakpoints to VS Code
        const breakpoints = lines.map(line => {
            return new Breakpoint(true, line);
        });
        
        response.body = { breakpoints: breakpoints };
        this.sendResponse(response);
    }

    threadsRequest(response) {
        log("Threads request");
        response.body = {
            threads: [new Thread(this.THREAD_ID, "Main Thread")]
        };
        this.sendResponse(response);
    }

    stackTraceRequest(response, args) {  //used to show location
        log("Stack trace request");
        
        const frames = [
            new StackFrame(
                0, //top
                `line ${this.currentLine}`, //line name where stop
                new Source(path.basename(this.currentFile), this.currentFile),  //file that stoped
                this.currentLine,  // line number
                0   // begining of line
            )
        ];
        
        response.body = {
            stackFrames: frames,
            totalFrames: 1
        };
        this.sendResponse(response);
    }
    // the step through value
    continueRequest(response) {   
        log("Continue request");
        if(this.py_program && this.py_program.stdin.writable) {
            this.py_program.stdin.write(JSON.stringify({command: "continue"}) + "\n");
        }
        this.sendResponse(response);
    }

    nextRequest(response) {
        log("Next (step over) request");
        this.py_program.stdin.write(JSON.stringify({command: "step_over"}) + "\n");
        this.sendResponse(response);
    }

    stepInRequest(response) {
        log("Step in request");
        this.py_program.stdin.write(JSON.stringify({command: "step_in"}) + "\n");    
        this.sendResponse(response);
    }

    stepOutRequest(response) {
        log("Step out request");
        this.py_program.stdin.write(JSON.stringify({command: "step_out"}) + "\n");
        this.sendResponse(response);
    }

    disconnectRequest(response, args) {
        log("Disconnect request");
        if(this.py_program) {
            this.py_program.kill();
        }
        this.sendResponse(response);
    }
}

DebugSession.run(pyDebugSe);