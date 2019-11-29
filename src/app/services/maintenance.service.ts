import { Injectable, OnInit } from "@angular/core";
import { ServiceStatusService } from "./generated.services";
import { map } from "rxjs/operators";

@Injectable()
export class MaintenanceService implements OnInit
{
    public maintenance : boolean = false;

    ngOnInit(): void {

    }
    constructor(public statusService : ServiceStatusService)
    {
        this.updateState();
        setInterval(() => {
            this.updateState();
        },5000)
    }

    private updateState()
    {
        this.statusService.serviceStatusGet().pipe(
            map(result => {
                if(result.success)
                {
                    var data = result.data[0];
                    switch(+data.state)
                    {
                        case 4:
                            this.maintenance = true;
                            break;
                        default:
                            this.maintenance = false;
                    }
                    console.log(data.state);
                }
                else
                {
                    console.log('ERR')
                }
            })
        ).subscribe()
    }
}