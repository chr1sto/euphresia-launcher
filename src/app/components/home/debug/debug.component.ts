import { InteropService } from "../../../services/interop.service";
import { Component } from "@angular/core";


@Component({
  selector: 'debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.scss']
})
export class DebugComponent implements DebugComponent {
  constructor( public interopService : InteropService) { 
    }

  ngOnInit() {
    
  }
}
