
const fs = require('fs');
const path = require('path');
const {
  DebugSession,
  InitializedEvent,
  StoppedEvent,
  TerminatedEvent,
  OutputEvent,
  Thread,
  StackFrame,
  Scope,
  Source
} = require('@vscode/debugadapter');

const LOG_DIR = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = path.join(LOG_DIR, 'starter.log');
function log(msg) { fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`); }

class JsDebugSe extends DebugSession {
  constructor() {
    super();
    this._threadId = 1;
    this._programPath = '';
    this._lines = [];
    this._line = 1;
    this._running = false;
    this._stopOnEntry = true;

    this._breaks = new Map();

    this._variablesRefCounter = 1;
    this._variableHandles = new Map([[this._variablesRefCounter, 'locals']]);
  }

  initializeRequest(response) {
    response.body = {
      supportsConfigurationDoneRequest: true,
      supportsEvaluateForHovers: true,
      supportsSetVariable: false,
      supportsStepBack: false,
      supportsTerminateRequest: true
    };
    this.sendResponse(response);
    this.sendEvent(new InitializedEvent());
  }

  configurationDoneRequest(response) {
    this.sendResponse(response);
  }

  launchRequest(response, args) {
    try {
      this._programPath = path.resolve(args.program);
      this._stopOnEntry = !!args.stopOnEntry;

      const text = fs.readFileSync(this._programPath, 'utf8');
      this._lines = text.split(/\r?\n/);
      this._line = 1;

      this.sendResponse(response);
      log(`Loaded program: ${this._programPath} (${this._lines.length} lines)`);

      if (this._stopOnEntry) {
        this.sendEvent(new StoppedEvent('entry', this._threadId));
      } else {
        this._continueRun();
      }
    } catch (err) {
      this.sendErrorResponse(response, { id: 1, format: `Failed to launch: ${err.message}` });
    }
  }

  terminateRequest(response) {
    this._running = false;
    this.sendResponse(response);
    this.sendEvent(new TerminatedEvent());
  }

  threadsRequest(response) {
    response.body = { threads: [new Thread(this._threadId, 'main')] };
    this.sendResponse(response);
  }

  stackTraceRequest(response, args) {
    const start = this._clamp(this._line, 1, this._lines.length);
    const sf = new StackFrame(
      1,
      'main',
      new Source(path.basename(this._programPath), this._programPath),
      start,
      1
    );
    response.body = { stackFrames: [sf], totalFrames: 1 };
    this.sendResponse(response);
  }

  scopesRequest(response) {
    const scopes = [new Scope('Locals', this._variablesRefCounter, false)];
    response.body = { scopes };
    this.sendResponse(response);
  }

  variablesRequest(response, args) {
    const ref = args.variablesReference;
    if (!this._variableHandles.has(ref)) {
      response.body = { variables: [] };
      return this.sendResponse(response);
    }

    const currentText = this._lines[this._clamp(this._line, 1, this._lines.length) - 1] ?? '';
    const vars = [
      { name: 'file', value: String(this._programPath), variablesReference: 0 },
      { name: 'line', value: String(this._line), variablesReference: 0 },
      { name: 'text', value: JSON.stringify(currentText), variablesReference: 0 },
      { name: 'time', value: new Date().toLocaleTimeString(), variablesReference: 0 }
    ];
    response.body = { variables: vars };
    this.sendResponse(response);
  }

  setBreakPointsRequest(response, args) {
    const file = path.resolve(args.source.path);
    const requested = (args.lines ?? []).map(n => this._clamp(n, 1, Number.MAX_SAFE_INTEGER));
    const set = new Set(requested);
    this._breaks.set(file, set);

    const bps = requested.map(n => ({
      verified: n >= 1 && n <= (file === this._programPath ? this._lines.length : Number.MAX_SAFE_INTEGER),
      line: n
    }));
    response.body = { breakpoints: bps };
    this.sendResponse(response);
  }

  continueRequest(response) {
    this.sendResponse(response);
    this._continueRun();
  }

  nextRequest(response) {
    this.sendResponse(response);
    this._stepOnce();
  }

  pauseRequest(response) {
    this._running = false;
    this.sendResponse(response);
    this.sendEvent(new StoppedEvent('pause', this._threadId));
  }

  evaluateRequest(response, args) {
    const expr = (args.expression || '').trim();
    const currentText = this._lines[this._clamp(this._line, 1, this._lines.length) - 1] ?? '';

    let value;
    switch (expr) {
      case 'line': value = String(this._line); break;
      case 'text': value = currentText; break;
      case 'time': value = new Date().toISOString(); break;
      default:
        if (expr === 'len(text)') value = String(currentText.length);
        else value = `Unsupported expression: ${expr}`;
    }
    response.body = { result: String(value), variablesReference: 0 };
    this.sendResponse(response);
  }

  _continueRun() {
    if (this._running) return;
    this._running = true;

    const tick = () => {
      if (!this._running) return;
      if (this._line > this._lines.length) {
        this._running = false;
        this.sendEvent(new OutputEvent('Program completed.\n'));
        return this.sendEvent(new TerminatedEvent());
      }

      const set = this._breaks.get(this._programPath);
      if (set && set.has(this._line)) {
        this._running = false;
        this.sendEvent(new StoppedEvent('breakpoint', this._threadId));
        return;
      }

      const text = this._lines[this._line - 1] ?? '';
      this.sendEvent(new OutputEvent(`line ${this._line}: ${text}\n`));
      this._line++;

      setTimeout(tick, 60);
    };

    setTimeout(tick, 0);
  }

  _stepOnce() {
    if (this._line > this._lines.length) {
      this.sendEvent(new TerminatedEvent());
      return;
    }
    const text = this._lines[this._line - 1] ?? '';
    this.sendEvent(new OutputEvent(`step ${this._line}: ${text}\n`));
    this._line++;
    this.sendEvent(new StoppedEvent('step', this._threadId));
  }

  _clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }
}

DebugSession.run(JsDebugSe);
module.exports = JsDebugSe;