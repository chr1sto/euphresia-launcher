import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';

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
  percentWidth: number = 0;
  patchInProcess: boolean = false;
  patchAvailable: boolean = false;
  startButtonText: string = "Check for Updates";
  checkedForUpdates: boolean = false;
  upToDate: boolean = false;

  //modal
  modalOpen : boolean = false;

  constructor(public electronService: ElectronService, private ref: ChangeDetectorRef) { }

  ngOnInit() {
    this.electronService.ipcRenderer.on('status-update',(event,data) => {
      this.statusMessage = data;
      this.ref.detectChanges();
    });

    this.electronService.ipcRenderer.on('file-count',(event,data) => {
      this.totalFileCount = data;
    });

    this.electronService.ipcRenderer.on('update-progress',(event,data) => {
      this.processedFileCount = data;
      this.percentWidth = (this.processedFileCount / this.totalFileCount) * 100;

      document.getElementById('progress-bar-partial-content').style.width = this.percentWidth + '%';
      document.getElementById('progress-bar-full-content').style.width = this.percentWidth + '%';
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
    });

    this.electronService.ipcRenderer.on('patch-available',(event,data) =>
    {
      this.statusMessage = data;
      this.patchAvailable = true;
      this.startButtonText = "Update";
      this.upToDate = false;
      this.ref.detectChanges();
    })

    setInterval(() => {
      this.checkForUpdate();
    },300000);
  }

  startPatchProcess()
  {
      this.patchInProcess = true;
      this.electronService.ipcRenderer.send('start-download-process','test');
      this.patchAvailable = false;
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

  }

  gameButtonClick()
  {
    console.log(this.checkedForUpdates);
    if(!this.checkedForUpdates)
    {
      this.checkForUpdate();
      this.startButtonText = "Update";
    }
    else
    {
      if(!this.patchInProcess)
      {
        if(this.upToDate)
        {
          this.startGame();
        }
        else
        {
          this.startButtonText = "Updating...";
          this.startPatchProcess();
        }
      }
    }
  }

  toggleModal()
  {
    this.modalOpen = !this.modalOpen;
  }

}
