import { PipeTransform, Pipe } from "@angular/core";

@Pipe({name: 'fileSize'})
export class FileSizePipe implements PipeTransform
{
    transform(value: any) {
        if (value === 0) return '0 Bytes';

        const k = 1024;
        const dm = 2
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    
        const i = Math.floor(Math.log(value) / Math.log(k));
    
        return parseFloat((value / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
    
}