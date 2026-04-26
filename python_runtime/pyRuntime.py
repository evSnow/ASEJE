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
        self.frame_list = {}
        
    def user_line(self, frame):
        filename = os.path.abspath(frame.f_code.co_filename)
        line = frame.f_lineno #current line
        self.curFrame=frame
        currentStack = self.stack_creation(frame)
        
        # Stop on first line to test if work and send a response
        currentStack = self.stack_creation(frame)

        print(json.dumps({
            "event": "stopped",
            "reason": "breakpoint",
            "line": line,
            "stack": currentStack
        }), flush=True)

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
                    if frame.f_back is None:
                        self.should_stop = False
                        self.set_continue()
                    else:
                        self.should_stop = True
                        self.set_return(frame)
                    return
                
                elif command == "setBreakpoints":
                    file_path = os.path.abspath(choice["file"])
                    lines = [int(x) for x in choice.get("lines", [])]   #get the lines or empty break[pint] to put in lines
                    self.breakpoints_loc[file_path] = lines   #used for commenting what happend and why it stop
                    
            
                    for bp_line in lines:
                        self.set_break(file_path, bp_line)
                
                elif command == "variables":  #Here will be a check of local variabl and global and display it
                    scope=choice.get("scope")
                    frame_id = choice.get("frameId")
                    request_id = choice.get("requestId")
                    self.sendVariable(scope,request_id,frame_id)

                elif command == "evaluate":  #
                    expression = choice.get("expression")
                    frame_id = choice.get("frameId")
                    request_id = choice.get("requestId")
                    self.evaluate_expression(expression, frame_id, request_id)
                    

                elif command == "stackTrace":
                    request_id = choice.get("requestId")
                    stack_data = self.stack_creation(frame)
                    
                    print(json.dumps({
                        "event": "stackTrace",
                        "requestId": request_id,
                        "stackFrames": stack_data
                    }), flush=True)
            except Exception as e:
                # If there is an error in code then output below
                print(json.dumps({"event": "error", "message": str(e)}), flush=True)
    def sendVariable(self, scope,request_id,frame_id):
        frame = self.frame_list.get(frame_id)
        if frame is None:
            vars = {}
        elif scope == "locals":
            vars = frame.f_locals or {}
        elif scope == "globals":
            vars =frame.f_globals or {}
        else:
            vars={}
        real_var=[]
        ignore_names = {"self", "dbg", "target", "__name__", "__file__", "bdb", "sys", "os", "json"}  #remove excess word
        for n, value in vars.items():
            if n in ignore_names or n.startswith("__"): #skip is name is in ignore or has usless __ but will evalurate later
                continue
            else:
                try:
                    real_var.append({  #apend the variable to var including local
                        "name": n,
                        "value": repr(value),
                        "type": type(value).__name__,
                        "variablesReference": 0
                    })
                except Exception:
                    real_var.append({  # not a normal variable like open file will add more detail later but for now unkown 
                        "name": n,
                        "value": "<unavailable>",
                        "type": "unknown",
                        "variablesReference": 0
                    })

        print(json.dumps({
            "event": "variables",
            "requestId": request_id,
            "variables": real_var
        }), flush=True)

    def stack_creation(self, frame):
        data = []
        stack, _ = self.get_stack(frame, None)
        self.frame_list={}

        for i in range(len(stack)):
            frame, lineno = stack[i]
            file_name = getattr(frame.f_code, "co_filename", None)
            
            if os.path.abspath(file_name) == os.path.abspath(__file__):
                continue
            data.append({
                "id": int(i),
                "name": str(frame.f_code.co_name),
                "file": str(file_name),
                "line": int(lineno),
                "column":1
            })
            self.frame_list[i] = frame
        return data

    def evaluate_expression(self, expression, frame_id, request_id):
        frame = self.frame_list.get(frame_id)
        if frame is None:
            result = "no frame"
        else:
            try:
                result = eval(expression, frame.f_globals, frame.f_locals) #calculate data
            except NameError:
                result = "<not defined>"
        print(json.dumps({ 
            "event": "evaluate",
            "requestId": request_id,
            "result": repr(result),
            "variablesReference": 0
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

    dbg.set_break(target, 1)  

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