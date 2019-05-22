import { Injectable } from "@angular/core";
import { ElectronService } from "../providers/electron.service";

@Injectable({providedIn: 'root'})
export class ModalService
{
    private modal = null;
    public messages : string[] = [];

    constructor(private electronService : ElectronService)
    {
        this.electronService.ipcRenderer.on('errorMessage',(event,args) => {
            console.log(args);
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