import { Injectable, OnInit, EventEmitter } from "@angular/core";
import { AppState } from "../models/app-state";
import { CommandType, AppCommand } from "../models/app-commands";
import { ElectronService } from "../providers/electron.service";
import { Subject, BehaviorSubject, Observable } from "rxjs";

@Injectable()
export class InteropService implements OnInit
{
    public State : AppState;
    public OnUpdate : Subject<any>;

    constructor(public electronService: ElectronService)
    {
        this.OnUpdate = new Subject<any>();
        setTimeout(() => this.SendCommand(CommandType.INIT),100);
        this.electronService.ipcRenderer.on('state',(event,arg) => this.setState(event,arg));
    }

    ngOnInit(): void {        
    }

    public SendCommand(type: CommandType, ...args : any[]) : void
    {
        var cmd = new AppCommand(type,args);
        console.log(cmd);
        this.electronService.ipcRenderer.send('command',cmd);
    }

    private setState(placeholder : any,state : AppState)
    {
        this.State = state;
        this.OnUpdate.next();
        console.log(state);
    }
}