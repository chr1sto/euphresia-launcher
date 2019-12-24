import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { map } from 'rxjs/operators';
import { IniService } from '../../../services/ini.service';
import { InteropService } from '../../../services/interop.service';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  constructor( public configService : IniService, public interopService : InteropService) { 
    }

  ngOnInit() {
    this.configService.getConfig();
  }

  configChanged()
  {
    this.configService.saveConfig();
  }
}
