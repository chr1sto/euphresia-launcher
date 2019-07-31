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
    this.profileUnfolded = !this.profileUnfolded;
    if(this.profileUnfolded)
    {
      setTimeout(() => document.getElementById('profile').addEventListener('mouseleave',(e) => {      
        if(this.profileUnfolded)
        {
          let x = 18;
          let y = 71;
          let w = 134;
          let h = 186;
          if(e.x < x || e.x > (x + w) || e.y < y || e.y > (y + h))
          {
            this.toggleProfile();
          }
        }
      }));
    }
  }

  toggleSelectAcc()
  {
    this.selectAccUnfolded = !this.selectAccUnfolded;
    if(this.selectAccUnfolded)
    {
      setTimeout(() => document.getElementById('select-acc').addEventListener('mouseleave',(e) => {      
        if(this.selectAccUnfolded)
        {
          let x = 332;
          let y = 67;
          let w = 136;
          let h = 186;
          if(e.x < x || e.x > (x + w) || e.y < y || e.y > (y + h))
          {
            this.toggleSelectAcc();
          }
        }
      }));
    }
  }

  selectAccount(item: any)
  {
    this.selectAccService.selectAccount(item.alias,item.account);
    this.electronService.ipcRenderer.send('select-account',this.selectAccService.selectedAccountId);
    //TODO: SEND TO IPCRENDERER
  }

  toggleOptions()
  {
    if(!this.configService.iniLoaded)
    {
      this.configService.getConfig();
    }
    this.optionsUnfolded = !this.optionsUnfolded;
    if(this.optionsUnfolded)
    {
      setTimeout(() => document.getElementById('options').addEventListener('mouseleave',(e) => {      
        if(this.optionsUnfolded)
        {
          let x = 709;
          let y = 63;
          let w = 263;
          let h = 194;
          if(e.x < x || e.x > (x + w) || e.y < y || e.y > (y + h))
          {
            this.toggleOptions();
          }
        }
      }));
    }
    else
    {
      if(this.changed)
      {
        this.configService.saveConfig();
        this.changed = false;
      }
    }
  }

  changed : boolean = false;
  configChanged()
  {
    this.changed = true;
  }

  openWeb()
  {
    this.electronService.ipcRenderer.send('open-web','http://euphresia-flyff.com/')
  }

  openDiscord()
  {
    this.electronService.ipcRenderer.send('open-web','https://discord.gg/DbGu67S')
  }
}
