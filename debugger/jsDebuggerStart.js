//const vscode = require('vscode');
const {LoggingDebugSession, InitializedEvent,StoppedEvent, TerminatedEvent,DebugSession} = require('@vscode/debugadapter');
const fs = require('fs');
const path = require('path');
const Logs = path.join(__dirname, '..', 'logs');    //the log section is to do console.log but in a file because the normal form do not work
if (!fs.existsSync(Logs)) {
    fs.mkdirSync(Logs, { recursive: true });
}
const starterLog = path.join(Logs,'starter.log');

function log(msg) {
    fs.appendFileSync((starterLog), msg + '\n');
}

class jsDebugSe extends DebugSession {
    initializeRequest(response, args) {
        //log("initialize Request");   // use to see console log because normal dont work
        response.body = { supportsConfigurationDoneRequest: true };
        this.sendResponse(response);
    }

    launchRequest(response, args) {
        //log("Launch Request"); // use to see console log because normal dont work
        this.sendResponse(response);
        this.sendEvent(new InitializedEvent());
    }
}
DebugSession.run(jsDebugSe);


    /* ignore for now future use
    constructor(){
        console.log("hello world");
        super("js-debugInfo.txt");
        this.setDebuggerLineStartAt1(true);
        this.setDebuggerColumnsStartAt1(true);
        this.breakpoints = [];
        this.interpreter = null;
    }
    InitializeRequest(response, args){
        console.log(test)
        this.sendEvent(new vscode.DebugAdapter.StoppedEvent('breakpoint', 1));
        this.sendResponse(response);
        this.sendEvent(new InitializedEvent());

        setTimeout(() =>{
            this.sendEvent(new TerminatedEvent());
            console.log("hello world")
        })


    }
    launchRequest(response){
        console.log('IT works');
        this.sendResponse(response);
        this.sendEvent(new TerminatedEvent());
    }
}
    */
/*
    launchRequest(response, args){
  
		logger.setup(args.trace ? Logger.LogLevel.Verbose : Logger.LogLevel.Stop, false);

		await this._configurationDone.wait(1000);

		await this._runtime.start(args.program, !!args.stopOnEntry, !args.noDebug);

		if (args.compileError) {
			this.sendErrorResponse(response, {
				id: 1001,
				format: `compile error: some fake error.`,
				showUser: args.compileError === 'show' ? true : (args.compileError === 'hide' ? false : undefined)
			});
		} else {
			this.sendResponse(response);
		}
	}
    
}

*/


module.exports = jsDebugSe;