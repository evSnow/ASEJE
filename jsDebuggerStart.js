

//const vscode = require('vscode');
const {LoggingDebugSession, InitializedEvent,StoppedEvent, TerminatedEvent,DebugSession, Handles, OutputEvent} = require('@vscode/debugadapter');
const fs = require('fs');
const path = require('path');
const Logs = path.join(__dirname, 'logs');    //the log section is to do console.log but in a file because the normal form do not work
const inspector = require("inspector");
const { spawn } = require('child_process');
//const CDP = require('chrome-remote-interface');
if (!fs.existsSync(Logs)) {
    fs.mkdirSync(Logs, { recursive: true });
}
const starterLog = path.join(Logs,'starter.log');


function log(msg) {
    fs.appendFileSync((starterLog), msg + '\n');
}


class jsDebugSe extends LoggingDebugSession {  
        constructor(code, breakpoints = []){
        super("js_1.log");
        this.debugPort = process.env.DEBUG_PORT  || 9485;
        this.JS_filesLoc=[]
        this.breakpoints = {}
        this.variables = new Handles();
        this.THREAD_ID = 1;  


    }
    initializeRequest(response, args) {
        log("initialize Request");   // use to see console log because normal dont work
        response.body = { supportsConfigurationDoneRequest: true};
        this.sendEvent(new InitializedEvent());
        this.sendResponse(response);
    }




launchRequest(response, args) {
    log("Launch Request");


    //const debugPort = 9766 || 9455; // fallback port
    this.nodeProcess = spawn('node', [`--inspect-brk=${this.debugPort}`, args.program]);




    this.nodeProcess.stdout.on('data', data => {
        this.sendEvent(new OutputEvent(data.toString(), 'stdout'));
    });


    this.nodeProcess.stderr.on('data', data => {
        this.sendEvent(new OutputEvent(data.toString(), 'stderr'));
    });


    this.nodeProcess.on('exit', () => {
        log("done");
        this.sendEvent(new TerminatedEvent());
    });
    setTimeout(() => {
    try{
        this.session = new inspector.Session();
        this.session.connect(this.debugPort);
        this.session.post('Debugger.enable');
        this.session.post('Runtime.enable');
        } catch (err){
            log("ERROR");
        }
        this.session.addListener("Debugger.paused", (msg) => {
        this.currentCallFrames = msg.params.callFrames || [{
        callFrameId: 1,
        functionName: '<top-level>',
        location: { scriptId: '1', lineNumber: 0, columnNumber: 0 },
        url: this.JS_filesLoc
    }];
         this.sendEvent(new StoppedEvent('breakpoint', this.THREAD_ID));
        });
        this.session.on('Runtime.consoleAPICalled', msg => {
        msg.params.args.forEach(arg => {
        this.sendEvent(new OutputEvent(arg.value + '\n'));
    });
}); }, 300);
    this.sendResponse(response);
}
setBreakPointsRequest(response, args) {
    const filePath = path.resolve(args.source.path);
    const out = [];

    let pending = args.breakpoints.length;

    for (const bp of args.breakpoints) {
        const line = bp.line - 1;

        this.session.post("Debugger.setBreakpointByUrl",
            { url: filePath, lineNumber: line, columnNumber: 0 },
            (err, res) => {
                out.push({ verified: !err, line: bp.line });
                if (--pending === 0) {
                    response.body = { breakpoints: out };
                    this.sendResponse(response);
                }
            }
        );
    }
}



threadsRequest(response) {
    response.body = {
        threads: [
            { id: this.THREAD_ID, name: "Main Thread" }
        ]
    };
    this.sendResponse(response);
}


stackTraceRequest(response, args) {
    this.JS_filesLoc = path.resolve(args.program);
    const frames = this.currentCallFrames.map((f, index) => ({
        id: index + 1,
        name: f.functionName || '<anonymous>',
        source: { path: f.url || this.JS_filesLoc },
        line: (f.location.lineNumber || 0) + 1,
        column: (f.location.columnNumber || 0) +1
    }));
    response.body = { stackFrames: frames, totalFrames: frames.length };
    this.sendResponse(response);
}


// this section for movment through code
    continueRequest(response) {
        this.session.post('Debugger.resume');
        this.sendResponse(response);
    }


    nextRequest(response) {
        this.session.post('Debugger.stepOver');
        this.sendResponse(response);
    }


    stepInRequest(response) {
        this.session.post('Debugger.stepInto');
        this.sendResponse(response);
    }


    stepOutRequest(response) {
        this.session.post('Debugger.stepOut');
        this.sendResponse(response);
    }
}


DebugSession.run(jsDebugSe);

