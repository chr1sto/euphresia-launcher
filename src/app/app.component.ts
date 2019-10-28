import { Component, OnInit } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { AuthenticationService } from './services/auth.service';
import { Router } from '@angular/router';
import { GameAccountService, GameAccountViewModel } from './services/generated.services';
import { map } from 'rxjs/operators';
import { IniService } from './services/ini.service';
import { SelectAccountService } from './services/select-account.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  success: boolean;
  hasErrors: boolean;
  errorMessages: string[];
  ngOnInit(): void {
      this.selectAccService.updateGameAccounts();

      if(!this.configService.iniLoaded)
      {
        this.configService.getConfig();
      }
    }

  //profile
  profileUnfolded : boolean = false;

  //options
  optionsUnfolded : boolean = false;

  //selectAcc
  selectAccUnfolded : boolean = false;
  accountAlias : string = null;

  constructor(public electronService: ElectronService,
    private translate: TranslateService,
    public authenticationService: AuthenticationService,
    private router: Router,
    private gameAccService : GameAccountService,
    public configService : IniService,
    public selectAccService : SelectAccountService) {

    translate.setDefaultLang('en');
    console.log('AppConfig', AppConfig);

    if (electronService.isElectron()) {
      console.log('Mode electron');
      console.log('Electron ipcRenderer', electronService.ipcRenderer);
      console.log('NodeJS childProcess', electronService.childProcess);
    } else {
      console.log('Mode web');
    }    
  }

  close()
  {    
    this.electronService.remote.getCurrentWindow().close();    
  }

  minimize()
  {
    this.electronService.remote.getCurrentWindow().minimize();
  }

  logout()
  {
    this.authenticationService.logout();
    //this.toggleNav();
    this.router.navigate(['login']);
  }

  flag : boolean = true;
  toggleNav()
  {
    document.getElementById("nav").style.visibility = this.flag ? "visible" : "hidden";
    this.flag = !this.flag;
  }

  openSettings()
  {
    
  }

  toggleProfile()
  {
    this.clickCount = 0;
    const outsideClickListener = event => {
      this.clickCount += 1
      var x = event.clientX;
      var y = event.clientY;
      if (this.clickCount > 1 && this.profileUnfolded && (x < 18 || x > 152 || y < 98 || y > 248))
      { // or use: event.target.closest(selector) === null
        this.profileUnfolded = false;
        removeClickListener()
      }
  }

    const removeClickListener = () => {
        document.removeEventListener('click', outsideClickListener)
    }

    document.addEventListener('click', outsideClickListener)
    this.profileUnfolded = !this.profileUnfolded;
  }

  /*
  selectAccount(item: any)
  {
    this.selectAccService.selectAccount(item.alias,item.account);
    this.electronService.ipcRenderer.send('select-account',this.selectAccService.selectedAccountId);
    //TODO: SEND TO IPCRENDERER
  }
  */

  openWeb()
  {
    this.electronService.ipcRenderer.send('open-web','http://euphresia-flyff.com/')
  }

  openDiscord()
  {
    this.electronService.ipcRenderer.send('open-web','https://discord.gg/DbGu67S')
  }

  clickCount: number = 0;
}