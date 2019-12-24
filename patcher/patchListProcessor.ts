import { PatchEntry } from "./models";
import { LiteEvent } from "./liteEvent";
import * as fs from 'fs-extra'

import * as nx from 'nexline';
import * as url from 'url';
import * as pth from 'path';


class PatchlistProcessor
{
    TotalFileSize : number = 0;

    constructor(private path : string, private clientPath : string, private baseUrl : string)
    {

    }

    public async Run()
    {
        var files : Array<PatchEntry> = [];
        const fd = fs.createReadStream(this.path);

        const nl = nx({
            input: fd,
            autoCloseFile: true
        })

        var folder = '';

        while(true)
        {
            const line = await nl.next();
            if(line === null) break;
            
            if(line[0] === 'v')
            {
            //handle patcher update.
            }
            else if(line[0] == 'd')
            {
            folder = line.substring(2)
            }
            else if(line[0] == 'f')
            {
                var cols = line.split(' ');
                var date = new Date(parseInt(cols[1]));
                var size = parseInt(cols[2]);
                cols.splice(0,3);
                var file : string = cols.join(' ');
                var fileNotFound = false;
                var exSize;
                var exDate;
                try
                {
                    var path = pth.join(this.clientPath,folder.trim(),file.trim());
                    if(fs.existsSync(path))
                    {
                    var fileInfo = fs.statSync(path);
                    exSize = fileInfo.size;
                    exDate = fileInfo.mtime;            
                    }
                    else
                    {
                    fileNotFound = true;
                    }
                }
                catch(ex)
                {
                    //console.log('File not found!');
                    fileNotFound = true;
                }

                if(fileNotFound || exSize != size || exDate < date )
                {
                    this.TotalFileSize += size;
                    var u = new URL(folder.trim() + '/' + file.trim() + '.gz', this.baseUrl)
                    var p = pth.join(this.clientPath,folder.trim(),file.trim());
                    files.push(new PatchEntry(p,size,u));
                }
            }
        } 
        return files;     
    }
}

export { PatchlistProcessor }