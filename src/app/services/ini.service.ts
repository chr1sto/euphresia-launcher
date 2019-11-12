import { Injectable } from "@angular/core";
import { ElectronService } from "../providers/electron.service";

@Injectable()
export class IniService
{
    config : any[];
    public fullscreen : boolean = false;
    public resolution : string = "1024x786";
    public interface : boolean = false;  
    public autoUpdate : boolean = true;
    public iniLoaded : boolean = false;
    public fovInCrase : boolean = false;
    public anisotrophy : string = "0";
    public ntask : string = '0';
    public multisample : boolean = false;

    constructor(private electronService : ElectronService)
    {
        this.electronService.ipcRenderer.on('config',(event,args) => 
        {
            this.config = args;
            if(this.config)
            {
                for(let i = 0; i < this.config.length; i++)
                {
                    var obj = this.config[i];
                    var key : string = obj.key;
                    switch(key.toUpperCase())
                    {
                        case 'RESOLUTION':
                        this.resolution = obj.value;
                        break;
                        case 'INTERVERSION':
                        this.interface = obj.value;
                        break;
                        case 'FULLSCREEN':
                        this.fullscreen = obj.value == '1' ? true : false;
                        break;
                        case 'AUTOUPDATE':
                        this.autoUpdate = obj.value == '1' ? true : false;
                        break;
                        case 'FOVINCRASE':
                        this.fovInCrase = obj.value == '1' ? true : false;
                        break;
                        case 'ANISOTROPHY':
                        this.anisotrophy = obj.value;
                        break;
                        case 'NTASK':
                        this.ntask = obj.value;
                        break;
                        case 'MULTISAMPLE':
                        this.multisample = obj.value == '1' ? true : false;
                        break;
                        default:
                        break; 
                    }
                }
                this.iniLoaded = true;
            }
            else
            {
                this.config = new Array<any>();
                this.config.push({key: 'RESOLUTION', value: this.resolution});
                this.config.push({key: 'INTERVERSION', value: null});
                this.config.push({key: 'FULLSCREEN', value: null});
                this.config.push({key: 'AUTOUPDATE', value: null});
                this.config.push({key: 'FOVINCRASE', value: null});
                this.config.push({key: 'ANISOTROPHY', value: null});
                this.config.push({key: 'NTASK', value: null});
                this.config.push({key: 'MULTISAMPLE', value: null});
            }
        })
    }

    getConfig()
    {
        this.electronService.ipcRenderer.send('config-get','');
    }

    saveConfig()
    {
        for(let i = 0; i < this.config.length; i++)
        {
            var obj = this.config[i];
            var key : string = obj.key;
            switch(key.toUpperCase())
            {
                case 'RESOLUTION':
                obj.value = this.resolution;
                break;
                case 'INTERVERSION':
                obj.value = this.interface;
                break;
                case 'FULLSCREEN':
                obj.value = this.fullscreen ? '1' : '0';
                break;
                case 'AUTOUPDATE':
                obj.value = this.autoUpdate ? '1' : '0';
                console.log('AUTOUPDATE',this.autoUpdate)
                break;
                case 'FOVINCRASE':
                obj.value = this.fovInCrase ? '1' : '0';
                console.log('FOVINCRASE',this.fovInCrase)
                break;
                case 'ANISOTROPHY':
                obj.value = this.anisotrophy;
                console.log('ANISOTROPHY',this.anisotrophy)
                break;
                case 'NTASK':
                obj.value = this.ntask;
                console.log('NTASK',this.ntask)
                break;
                case 'MULTISAMPLE':
                obj.value = this.multisample ? '1' : '0';
                console.log('MULTISAMPLE',this.multisample)
                break;
                default:
                break; 
            }
        }
        this.electronService.ipcRenderer.send('config-post',this.config);
    }
}