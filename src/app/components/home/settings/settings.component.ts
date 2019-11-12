import { Component, OnInit, ChangeDetectorRef, Input } from '@angular/core';
import { map } from 'rxjs/operators';
import { IniService } from '../../../services/ini.service';

@Component({
  selector: 'settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  constructor( public configService : IniService) { 
    }

  ngOnInit() {
    this.configService.getConfig();
  }

  configChanged()
  {
    this.configService.saveConfig();
  }
}
