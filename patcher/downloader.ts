import { LiteEvent } from "./liteEvent";
import { PatchEntry, ProgressEntry } from "./models";
import * as request from 'request-promise';
import * as async from 'async';
import * as fs from 'fs-extra'



class Downloader
{
    private readonly onStatusUpdate = new LiteEvent<string>();
    public get StatusUpdate() { return this.onStatusUpdate.expose(); }

    private readonly onProgress = new LiteEvent<ProgressEntry>();
    public get Progress() { return this.onProgress.expose(); }

    public currentFileSize : number = 0;
    public totalFileSize : number = 0;

    private speeds : { [id: string] : ProgressEntry} = {};

    constructor( private requestLimit : number)
    {

    }

    public start(files : Array<PatchEntry>)
    {
        files.forEach(x => this.totalFileSize+=x.Size);


        var id = setInterval(() => {
            var g = 0;
            var s = 0;
            Object.entries(this.speeds).forEach(
                ([key,value]) => {
                    if(value.Speed > 0) {
                        g+=value.Speed;
                    }
                    s += value.ProgressedSize;
                }
            );
            this.onProgress.trigger(new ProgressEntry(g,s));
        },1000)

        async.eachLimit(files,this.requestLimit,
            async (file : PatchEntry ,callback) => {
                try
                {
                    await this.DownloadSingleFile(file).then(
                        () => {
                            
                            callback();
                        }
                    ).catch(
                        () => callback()
                    );
                }
                catch(ex)
                {
                    this.onStatusUpdate.trigger(JSON.stringify(ex));
                    callback();
                }
            },
            error => {
                clearInterval(id);
                if(error)
                {
                    this.onStatusUpdate.trigger(JSON.stringify(error));
                }
                else
                {
                    this.onStatusUpdate.trigger(null);
                }

            })
    }

    public async DownloadSingleFile(file : PatchEntry,failedCount : number = 0)
    {
        var headers = {
            'Accept-Encoding': 'gzip'
          };
        
        var receivedBytes = 0;
        var start = Date.now();
        try
        {
            const res = await request.get(file.Url, {
                gzip: true,
                resolveWithFullResponse: true,
                encoding: null,
                headers: headers
            }).on('data', (chunk) => {
                receivedBytes += chunk.length;
                var elapsed = (Date.now() - start) / 1000;
                if(elapsed >= 1)
                {
                    this.speeds[file.Dir] = new ProgressEntry(receivedBytes / elapsed,receivedBytes);
                }
            }).on('end', () => {
                this.speeds[file.Dir] = new ProgressEntry(0,file.Size);
            })

            await fs.writeFile(file.Dir,res.body,'binary');
        }
        catch(ex)
        {
            this.speeds[file.Dir] = new ProgressEntry(0,0);
            this.onStatusUpdate.trigger(JSON.stringify(ex));
        }            
    }
}

export {Downloader}