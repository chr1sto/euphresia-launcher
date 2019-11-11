import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { GameAccountService, GameAccountViewModel } from './services/generated.services';
import { map } from 'rxjs/operators';
import { IniService } from './services/ini.service';
import { SelectAccountService } from './services/select-account.service';
import { InteropService } from './services/interop.service';
import { CommandType } from './models/app-commands';
import { CurrentState } from './models/app-state';

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
  percentProgress : number = 0;

  totalFileSize : number = 0;
  progressFileSize : number = 0;
  speed : number = 0;

  totalFileSizeFormatted : string = "0 B";
  progressFileSizeFormatted : string = "0 B";
  speedFormatted : string = "0 B";

  //
  runningClients : any[] = [];

  constructor(public interopService :InteropService, 
    private ref: ChangeDetectorRef,
    public configService : IniService,
    public selectAccService : SelectAccountService) { 

      this.selectAccService.updateGameAccounts();
    }
  ngOnInit() {
    this.updateBarWidth();
    this.interopService.OnUpdate.subscribe(() => {
      switch(this.interopService.State.State)
      {
        case CurrentState.UPDATING:
            this.partWidthLeft = Math.min(this.interopService.State.Progress.ProcessedCount / this.interopService.State.Progress.TotalCount * this.widthInPixel * 2,this.widthInPixel);     
            this.partWidthRight = Math.max((this.interopService.State.Progress.ProcessedCount / this.interopService.State.Progress.TotalCount * this.widthInPixel * 2) - this.widthInPixel,0);
            this.percentProgress = this.interopService.State.Progress.ProcessedSize / this.interopService.State.Progress.TotalSize * 100
            this.statusMessage = "Updating...";
          break;
        case CurrentState.UP_TO_DATE:
            this.partWidthLeft = this.widthInPixel;
            this.partWidthRight = this.widthInPixel;
            this.percentProgress = 100;
            this.statusMessage = "Game is up to date!";
          break;
        default:
            this.partWidthLeft = 0;
            this.partWidthRight = 0;
            this.percentProgress = 0;
            this.statusMessage = "Checking for Updates...";
          break;
      }

      if(this.interopService.State.State == 2) this.statusMessage = "Update available!";

      this.updateBarWidth();

      this.ref.detectChanges();
    })
    this.patch();
    this.ref.detectChanges();

    
    setInterval(() => {
      this.patch();
    },300000);
    
  }


  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
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
      this.interopService.SendCommand(CommandType.START_PATCH);     
      this.patchAvailable = false;
      this.ref.detectChanges();
    }
  }

  checkForUpdate()
  {
    if(!this.patchInProcess)
    {
      this.interopService.SendCommand(CommandType.CHECK_FOR_UPDATES);
      this.checkedForUpdates = true;
    }
  }

  startGame()
  {
    this.selectAccService.open()    
  }

  getStartButtonClass()
  {
    if(this.interopService.State)
    {
      switch(+this.interopService.State.State)
      {
        case CurrentState.UP_TO_DATE:
          return 'button-start-color';
        case CurrentState.UPDATING:
          return 'button-patch-grey';
        case CurrentState.UPDATE_AVAILABLE:
          return 'button-patch-color';
        default:
          return 'button-patch-grey';
      }   
    }
    else
    {
      return 'button-patch-grey';
    }
  }

  gameButtonClick()
  {    

    switch(+this.interopService.State.State)
    {
      case CurrentState.UP_TO_DATE:
        this.startGame();
        break;
      case CurrentState.UPDATE_AVAILABLE:
        this.startPatchProcess();
        break;
    }  
  }
}
