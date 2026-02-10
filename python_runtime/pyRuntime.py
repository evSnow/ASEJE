import bdb  #debugger class
import sys  #system function
import json #modify json
import os   #interact with operation 

class PyRuntime(bdb.Bdb):
    def __init__(self, target_file):
        super().__init__()
        self.target_file = os.path.abspath(target_file)    # path for target
        self.breakpoints_loc = {}
        self.first_stop = True 
        self.should_stop = False  
        self.curFrame = None
        
    def user_line(self, frame):
        filename=self.target_file
        line = frame.f_lineno #current line
        self.curFrame=frame
        
        
        # Stop on first line to test if work and send a response
        if self.first_stop:
            self.first_stop = False
            #print('hi')
            ev={"event": "stopped", "reason": "entry", "line": 1}
            print(json.dumps(ev), flush=True)
            #print('ters')
            self.wait_for_command(frame)
            return
        
        # function stop at breakpoint hit and send a response
        if line in self.breakpoints_loc.get(filename, []):
            print(json.dumps({"event": "stopped", "reason": "breakpoint", "line": line}), flush=True)
            self.wait_for_command(frame)
            return
        if self.should_stop:
            self.should_stop = False
            print(json.dumps({"event": "stopped", "reason": "step", "line": line}), flush=True)
            self.wait_for_command(frame)
    
    def wait_for_command(self, frame):
        while True:
            line = sys.stdin.readline()   #wait for newline
            if not line:
                self.set_quit()
                return
            
            try:
                choice = json.loads(line.strip()) #strip the white and then load into choice
                #print (choice)
                command = choice.get("command")
                
                if command == "continue":
                    self.should_stop = False
                    self.set_continue()    #contrinue untill breakpoint
                    return
                
                elif command == "step_over":
                    self.should_stop = True
                    self.set_next(frame)
                    return
                
                elif command == "step_in":
                    self.should_stop = True
                    self.set_step()
                    return
                
                elif command == "step_out":
                    self.should_stop = True
                    self.set_return(frame)
                    return
                
                elif command == "setBreakpoints":
                    file_path = os.path.abspath(choice["file"])
                    lines = [int(x) for x in choice.get("lines", [])]   #get the lines or empty break[pint] to put in lines
                    self.breakpoints_loc[file_path] = lines   #used for commenting what happend and why it stop
                    
                    self.clear_all_breaks()  #clear previous breakpoint and nextline set new one
                    for bp_line in lines:
                        self.set_break(file_path, bp_line)
                
                elif command == "variables":  #Here will be a check of local variabl and global and display it
                    scope=choice.get("scope")
                    request_id = choice.get("requestId")
                    self.sendVariable(scope,request_id)

                elif command == "evaluate":  #
                    pass

                elif command == "stackTrace":
                    pass
            except Exception as e:
                # If there is an error in code then output below
                print(json.dumps({"event": "error", "message": str(e)}), flush=True)
    def sendVariable(self, scope,request_id):
        if scope == "locals":
            if self.curFrame is None:
               vars = {}
            else:
                vars = self.curFrame.f_locals
        elif scope == "globals":
            if self.curFrame is None:
               vars = {}
            else:
                vars = self.curFrame.f_globals
        else:
            var={}
        real_var=[]
        ignore_names = {"self", "dbg", "target", "__name__", "__file__", "bdb", "sys", "os", "json"}  #remove excess word
        for n, value in vars.items():
            if n in ignore_names or n.startswith("__"): #skip is name is in ignore or has usless __ but will evalurate later
                continue
            else:
                try:
                    real_var.append({  #apend the variable to var including local
                        "name": str(n),
                        "value": repr(value),
                        "type": type(value).__name__,
                        "variablesReference": 0
                    })
                except Exception:
                    real_var.append({  # not a normal variable like open file will add more detail later but for now unkown 
                        "name": str(n),
                        "value": "<unavailable>",
                        "type": "unknown",
                        "variablesReference": 0
                    })

        print(json.dumps({
            "event": "variables",
            "requestId": request_id,
            "variables": real_var
        }), flush=True)
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"event": "error", "message": "No target file entered"}), flush=True)  # check if target exist if not send to dap
        sys.exit(1)
    #print(sys.argv)
    target = sys.argv[1]
    
    if not os.path.exists(target):
        print(json.dumps({"event": "error", "message": f"File not found: {target}"}), flush=True)  #check if file path if not send to dap
        sys.exit(1)
    #print('before run')
    dbg = PyRuntime(target)  # creat class to store the file 
    dbg.set_trace()  #turn one the line by line
    
    try:
        with open(target) as f:
            code = compile(f.read(), target, 'exec')
            exec(code, {'__name__': '__main__', '__file__': target})
    except bdb.BdbQuit:
        pass   #end normaly
    except SystemExit:
        pass   #end normaly
    except Exception as e:
        print(json.dumps({"event": "error", "message": f"Runtime error: {str(e)}"}), flush=True)
    
    print(json.dumps({"event": "terminated"}), flush=True)