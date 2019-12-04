import { Injectable } from "@angular/core";
import { ElectronService } from "../providers/electron.service";
import { GenericService, PlayerLogService } from "./generated.services";
import { InteropService } from "./interop.service";

@Injectable({providedIn: 'root'})
export class ModalService
{
    private modal = null;
    public messages : string[] = [];

    constructor(private electronService : ElectronService, public playerLogService : PlayerLogService, public interopService : InteropService)
    {
        this.electronService.ipcRenderer.on('errorMessage',(event,args) => {
            playerLogService.logPlayer(
                {
                    state: this.interopService.State,
                    error: args
                }
            ).subscribe();
            this.addMessage(args);
        })
    }

    addMessage(message : string)
    {
        if(this.modal)
        {
            if(!this.modal.opened)
            {
                this.modal.open();
            }

            this.messages.push(message);
            this.modal.notifyChanges();
        }
    }

    setRef(modal: any)
    {
        this.modal = modal;
    }

    close()
    {
        this.modal.close();
        this.modal = null;
    }

    resetMessages()
    {
        this.messages = [];
    }
}