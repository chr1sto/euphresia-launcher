import { Component } from '@angular/core';
import { ElectronService } from './providers/electron.service';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { AuthenticationService } from './services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(public electronService: ElectronService,
    private translate: TranslateService,
    private authenticationService: AuthenticationService,
    private router: Router) {

    translate.setDefaultLang('en');
    console.log('AppConfig', AppConfig);

    if (electronService.isElectron()) {
      console.log('Mode electron');
      console.log('Electron ipcRenderer', electronService.ipcRenderer);
      console.log('NodeJS childProcess', electronService.childProcess);
    } else {
      console.log('Mode web');
    }
    
    console.log(this.authenticationService.isLoggedIn)
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
    this.toggleNav();
    this.router.navigate(['login']);
  }

  flag : boolean = true;
  toggleNav()
  {
    document.getElementById("nav").style.visibility = this.flag ? "visible" : "hidden";
    this.flag = !this.flag;
  }
}
