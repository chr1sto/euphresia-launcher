import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { GameAccountService, GameAccountViewModel } from './services/generated.services';
import { map } from 'rxjs/operators';
import { IniService } from './services/ini.service';
import { SelectAccountService } from './services/select-account.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  //patch
  statusMessage : string;
  totalFileCount : number = 0;
  processedFileCount : number = 0;
  widthInPixel: number = 381;
  partWidthLeft: number = 0;
  partWidthRight: number = 0;
  leftWidthStyle: string = "rect(0,0px,51px,0)";
  rightWidthStyle: string = "rect(0,0px,51px,0)";
  patchInProcess: boolean = false;
  patchAvailable: boolean = false;
  startButtonText: string = "Check for Updates";
  checkedForUpdates: boolean = false;
  upToDate: boolean = false;

  //
  runningClients : any[] = [];

  constructor(public electronService: ElectronService, 
    private ref: ChangeDetectorRef,
    public configService : IniService,
    public selectAccService : SelectAccountService) { 

      this.selectAccService.updateGameAccounts();
    }

  ngOnInit() {
    this.updateBarWidth();

    this.electronService.ipcRenderer.on('status-update',(event,data) => {
      this.statusMessage = data;
      this.ref.detectChanges();
    });

    this.electronService.ipcRenderer.on('file-count',(event,data) => {
      this.totalFileCount = data;
    });

    this.electronService.ipcRenderer.on('update-progress',(event,data) => {
      this.processedFileCount = data;    
      this.partWidthLeft = Math.min(this.processedFileCount / this.totalFileCount * this.widthInPixel * 2,this.widthInPixel);     
      this.partWidthRight = Math.max((this.processedFileCount / this.totalFileCount * this.widthInPixel * 2) - this.widthInPixel,0);
      console.log(this.partWidthLeft,'::',this.partWidthRight);
      this.updateBarWidth();
      if(this.processedFileCount == this.totalFileCount) 
      {
        setTimeout(() => {
          this.startButtonText = "Start Game";
          this.statusMessage = 'Finished';
          this.patchInProcess = false;
          this.upToDate = true;
          this.ref.detectChanges();
        },40);
      }    
      this.ref.detectChanges();  
    });

    this.electronService.ipcRenderer.on('patch-available',(event,data) =>
    {
      this.statusMessage = data;
      this.patchAvailable = true;
      this.startButtonText = "Update";
      this.upToDate = false;
      this.ref.detectChanges();
    })

    this.electronService.ipcRenderer.on('up-to-date',(event,data) => {
      this.startButtonText = "Start Game";
      this.statusMessage = 'Up to Date!';
      this.patchInProcess = false;
      this.upToDate = true;
      this.partWidthLeft = this.widthInPixel;
      this.partWidthRight = this.widthInPixel;
      this.updateBarWidth();
      this.ref.detectChanges();
    })

    this.electronService.ipcRenderer.on('update-client-list',(event,data) => {
      this.runningClients = data;
    })

    this.patch();
    this.ref.detectChanges();

    
    setInterval(() => {
      this.patch();
    },300000);
    
  }

  updateBarWidth()
  {
    document.getElementById('part-left').style.clip = 'rect(0,'+Math.floor(this.partWidthLeft)+'px,51px,0)';
    document.getElementById('part-right').style.clip = 'rect(0,'+Math.floor(this.partWidthRight)+'px,51px,0)';
    this.ref.detectChanges();
  }

  patch()
  {
    var handler = setTimeout(() =>{
      this.checkForUpdate();
      /*
      if(this.configService.autoUpdate && this.runningClients.length == 0)
      {
        this.startPatchProcess();
      }
      */
    },2000)
    this.ref.detectChanges();
  }

  startPatchProcess()
  {
    if(!this.patchInProcess)
    {
      this.patchInProcess = true;
      this.electronService.ipcRenderer.send('start-download-process','test');
      this.patchAvailable = false;
      this.ref.detectChanges();
    }
  }

  checkForUpdate()
  {
    if(!this.patchInProcess)
    {
      this.electronService.ipcRenderer.send('check-for-updates');
      this.checkedForUpdates = true;
    }
  }

  startGame()
  {
    this.selectAccService.open()    
  }

  getStartButtonClass()
  {
    //game color wenn: Account ausgewählt, uptodate
    //game grey: wenn kein Account ausgwählt
    //patch color wenn nicht uptodate und patch available
    //patch grey wenn patch in progress

    if(this.upToDate)
    {
      if(this.selectAccService.selectedAccountId)
      {
        return 'button-start-color';
      }
      else
      {
        return 'button-start-grey';
      }
    }
    else
    {
      if(this.patchInProcess)
      {
        return 'button-patch-grey';
      }
      else
      {
        if(this.patchAvailable)
        {
          return 'button-patch-color'
        }
        else
        {
          return 'button-patch-grey';
        }
      }
    }
  }

  gameButtonClick()
  {    
    if(this.upToDate)
    {
      if(this.selectAccService.selectedAccountId)
      {
        this.startGame();        
      }
      else
      {
        //MODALSERVICE
      }
    }
    else
    {
      if(this.patchInProcess)
      {
        
      }
      else
      {
        if(this.patchAvailable)
        {
          if(!this.patchInProcess)
          {
            this.startPatchProcess();
          }
        }
        else
        {
          //MODALSERVICE
        }
      }
    }
  }
}
