import { app, BrowserWindow, screen, ipcMain, ipcRenderer, protocol, session} from 'electron';
import { download } from 'electron-dl'
import * as path from 'path';
import * as url from 'url';
import * as request from 'request';
import * as fs from 'fs';
import * as zlib from 'zlib';
import * as readline from 'readline'
import * as child_process from 'child_process'
import { autoUpdater } from "electron-updater"
import * as electronLog from 'electron-log'
import * as progress from 'request-progress'

export enum CurrentState
{
    UNKNOWN,
    CHECKING_FOR_UPDATE,
    UPDATE_AVAILABLE,
    UP_TO_DATE,
    UPDATING
}

export class CurrentProgress
{
    TotalCount : number;
    ProcessedCount : number;
    TotalSize : number;
    ProcessedSize : number;
    DownloadSpeed : number;
    CurrentFile : string;
}

export class AppState
{
    State : CurrentState;
    HasErrors : boolean;
    ErrorMessages : string[];
    Progress : CurrentProgress;
}

export enum CommandType
{
    INIT,
    CHECK_FOR_UPDATES,
    START_PATCH,
    STOP_PATCH,
    START_GAME,
    SET_TOKEN,
    SET_SELECTED_ACCOUNT,
    OPEN_WEB
}

export class AppCommand
{
    Type : CommandType;
    Params : any[];

    constructor(type : CommandType, params : any[])
    {
        this.Type = type;
        this.Params = params;
    }
}

export class PatchEntry
{
  Dir : string;
  Size : number;

  constructor(dir: string, size : number)
  {
    this.Dir = dir;
    this.Size = size;
  }
}

let win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

electronLog.transports.file.level = "debug";
autoUpdater.logger = electronLog;

let configEntries : any = null;

const serverRoot = 'https://patch.euphresia-flyff.com/';
const localClientPath = 'F:\\Games\\Euphresia FlyFF - Beta\\'//path.resolve(path.dirname(app.getPath('exe')),'..\\Client\\') + '\\';
const tempExecPath = path.join(path.resolve(localClientPath),'binary\\Euphresia.exe');
const appdata = path.join(process.env.LOCALAPPDATA,'Euphresia\\Flyff\\');
const iniPath = path.join(appdata,'Euphresia.ini');
const patchConfigPath = path.join(appdata,'EuphresiaLauncher.ini');

var progressReportLast = new Date();

var selectedAccountId = null;
var token : string = null;

var fileList : Array<PatchEntry>;

var runningClients : any[] = [];

var APP_STATE : AppState;
APP_STATE = new AppState();
APP_STATE.Progress = new CurrentProgress();
APP_STATE.State = CurrentState.UNKNOWN;
APP_STATE.Progress.ProcessedCount = 0;
APP_STATE.Progress.ProcessedSize = 0;

var sender : any;
var initialized : boolean = false;

function createWindow() {

  const electronScreen = screen;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 1024,
    height: 576,
    resizable: false,
    webPreferences: {
      nodeIntegration: true
    },
    frame: false,
    transparent: true,
    icon: path.join(__dirname,'dist\\assets\\logo.png')
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`)
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(url.format({
      pathname: path.join(__dirname, 'dist/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  }

  if (serve) {
    win.webContents.openDevTools();
  }

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

  mkDirByPathSync(appdata);
  ipcMain.on('command',(event,cmd : AppCommand) => {
    console.log(cmd)
    switch(+cmd.Type)
    {
      case CommandType.INIT:
        sender = event.sender;
        if(!initialized)
        {
          setInterval(updateAppState,1000);
          initialized = true;
        }
        break;
      case CommandType.CHECK_FOR_UPDATES:
        checkForAvailablePatches();
        break;
      case CommandType.START_PATCH:
        startDownloadProcess();
        break;
      case CommandType.STOP_PATCH:
        //TODO
        break;
      case CommandType.START_GAME:
        startGame(cmd.Params[0]);
        break;
      case CommandType.SET_TOKEN:
        processSetToken(cmd.Params[0]);
        break;
      case CommandType.SET_SELECTED_ACCOUNT:
        selectedAccountId = cmd.Params[0];
        break;
      case CommandType.OPEN_WEB:
        child_process.execSync('start ' + cmd.Params[0]);
      default:
        break;
    }
  })


  //TODO How to implement this?
  ipcMain.on('config-get',(event,arg) =>{
    console.log('????')
      if(!configEntries)
      {
        console.log('in');
        loadIni(() => {
          event.sender.send('config',configEntries);
        });
      }
      else
      {
        event.sender.send('config',configEntries);
      }
  })

  ipcMain.on('config-post',(event,args) => {
    configEntries = args;
    console.log(args)
    writeIni();
  })

  process.on('uncaughtException',(error) => {
    if(error.message.includes('ECONNRESET'))
    {
      notifyError('Unable to connect to patch Server.\n This is either due to a bad connection to our services or to many people patching at the same time.\n Try restarting the Launcher in a few Minutes.')
    }
    else
    {
      notifyError('UNCAUGHT EXCEPTION\nContact the Euphresia Staff if this error persists!\n\n' + error.message)
    }
  })
}

/*************************************************
 * Check for Updates
 *************************************************/

const checkForAvailablePatches = () =>
{      
    downloadGzipFileTo(
      serverRoot + 'list.txt.gz',
      appdata + 'list.txt',
      0,
      () => {
        APP_STATE.State = CurrentState.CHECKING_FOR_UPDATE;
        processPatchList(appdata + 'list.txt',() => {
          if(fileList.length > 0)
          {
            APP_STATE.State = CurrentState.UPDATE_AVAILABLE;
            ///TODO?
            APP_STATE.Progress.TotalSize = totalFileSize;
          }
          else{
            APP_STATE.State = CurrentState.UP_TO_DATE;
          }
        },
        (error) => console.log('err' + error))
      },
      () => console.log('error'),
      (progress,speed) => true)
}

/*************************************************
 * Start Download
 *************************************************/

const startDownloadProcess = () =>
{
  APP_STATE.Progress.ProcessedSize = 0;
    var currentFile : number = 0;
    //event.sender.send('status-update','Retrieving Patchlist...');
    downloadGzipFileTo(
      serverRoot + 'list.txt.gz',
      appdata + 'list.txt',
      0,
      () => 
      {
        //event.sender.send('status-update','Processing Patchlist...');
        processPatchList(appdata + 'list.txt',() => {
          if(fileList.length == 0)
          {
            APP_STATE.State = CurrentState.UP_TO_DATE;
          }
          else
          {
            APP_STATE.Progress.TotalCount = fileList.length;
            APP_STATE.Progress.TotalSize = totalFileSize;
            APP_STATE.State = CurrentState.UPDATING;
            //event.sender.send('update-progress',++currentFile)
            downloadFiles(
              (i, size) => {
                APP_STATE.Progress.ProcessedCount += 1;
                APP_STATE.Progress.ProcessedSize += size;
                if(APP_STATE.Progress.ProcessedCount >= fileList.length)
                {
                  APP_STATE.State = APP_STATE.State = CurrentState.UP_TO_DATE;
                }
              },
              (size) => 
              {
                
              },//event.sender.send('status-update','Finished'),
              () => {
                //APP_STATE.Progress.ProcessedCount += 1;
                /*
                if(currentFile == fileList.length || currentFile % 10)
                  event.sender.send('update-progress',currentFile);
                event.sender.send('status-update','ERROR');
                */
              },
              (progress,speed) => {
                if(true || (new Date().getSeconds() - progressReportLast.getSeconds()) > 1)
                {
                  if(speed && speed > 0)
                  {
                    APP_STATE.Progress.DownloadSpeed = speed;
                  }
                  APP_STATE.Progress.ProcessedSize += progress;                
                  progressReportLast = new Date();
                  console.log("PROGRESS: ",progress);
                }                
              })
            }
        },(error) => console.log(error))
      },
      () => console.log('error'),
      (progress,speed) => {
        true;
      });
}

/*************************************************
 * Set Token
 *************************************************/

const processSetToken = (token) =>
{
  currToken = token;
  const filter = { urls: ["http://*/*", "https://*/*"] };
  session.defaultSession.webRequest.onBeforeSendHeaders(filter,setToken)
}

/*************************************************
 * StartGame
 *************************************************/

const startGame = (id) => 
{
  if(id)
    {
      id = id.replace('-','');
      var params = ['127.0.0.1',id,currToken];
      console.log(params.join('\n'));
      var process : child_process.ChildProcess = child_process.spawn(tempExecPath,params,{detached: true, stdio:['ignore','ignore','ignore'],cwd: localClientPath});//.unref();
      runningClients.push({ account: id, process: process });
      //TODO
      //event.sender.send('update-client-list',runningClients);
      process.on('close',(code,signal) => {
        for(let i = 0; i < runningClients.length; i++)
        {
          if(runningClients[i].id == id)
          {
            runningClients.splice(i,1);
          }
        }
        ///TODO?
        //event.sender.send('update-client-list',runningClients);
      })
    }
}

/*************************************************
 * Update App State
 *************************************************/

const updateAppState = () => {
  //console.log(APP_STATE);
  sender.send('state',APP_STATE);
}

const notifyError = (message) => win.webContents.send('errorMessage',message);

let currToken;
const setToken = (details,callback) =>
{
    if(currToken)
    {
      details.requestHeaders['Authorization'] = `Bearer ${currToken}`;
    }
    callback({ cancel: false, requestHeaders: details.requestHeaders });
}

const loadIni = (callback) => {
  //LOAD NEUZ options
  fs.exists(iniPath, (exists) => {
    console.log(exists);
    if(exists)
    {
      var inp = fs.createReadStream(iniPath);

      inp.on('error',() => notifyError('Error while accessing ' + iniPath + '.\n'))

      var rl = readline.createInterface({
        input : inp,
        output: process.stdout,
        terminal: false
      });
    
      let entries : any[] = [];
    
      rl.on('line', (line) => {
        var params : string[] = line.split(' ');
        if(params.length > 0)
        {
          switch(params[0].toUpperCase())
          {
            case 'RESOLUTION': 
                entries.push({key: 'resolution',value: params[1] + 'x' + params[2]})
              break;
            case '//':
              break;
            default:
                var name = params.shift();
                entries.push({key: name, value: params.join(' ')})
              break;
          }
        }
      })

      rl.on('close',() => {
        configEntries = entries;
        loadLauncherConfig(callback);
      })
    }
    else
    {
      let entries : any[] = [
        {
          key:'resolution',
          value:'1024x768'
        },
        {
          key: 'fullscreen',
          value: '0'
        },
        {
          key: 'interversion',
          value: '0'
        },
        {
          key: 'fovincrease',
          value: '0'
        },
        {
          key: 'anisotrophy',
          value: '0'
        },
        {
          key: 'ntask',
          value: '0'
        },
        {
          key: 'multisample',
          value: '0'
        }
      ];
      configEntries = entries;
      loadLauncherConfig(callback);
    }
  })

  
}

const loadLauncherConfig = (callback) =>
{
  //load launcher options
  fs.exists(patchConfigPath,(exists) => {
    if(exists)
    {
      let count = 0;

      var inp = fs.createReadStream(patchConfigPath);

      inp.on('error',() => notifyError('Error while accessing ' + patchConfigPath + '.\n'))

      var rl = readline.createInterface({
        input : inp,
        output: process.stdout,
        terminal: false
      });

      rl.on('line',(line) => {
        var params : string[] = line.split(' ');
        if(params.length > 1)
        {
          var name = params.shift();
          configEntries.push({key: name, value: params.join(' ')})
          count++;
        }
      }) 

      rl.on('close',() => {
        if(count == 0)
        {
          configEntries.push({key: 'autoupdate', value: '1'});
          callback();
        }
      })
    }
    else
    {
      configEntries.push({key: 'autoupdate', value: '1'});
      callback();
    }
  })
}

const writeIni = () => {
  let iniContent : string = "// Options\r\n";
  let launcherIniContent : string = "";
  for(let i = 0; i < configEntries.length; i++)
  {
    var obj = configEntries[i];
    switch(obj.key.toUpperCase())
    {
      case 'RESOLUTION':
        iniContent += "resolution " + obj.value.replace('x',' ') + '\r\n';
        break;
      case 'AUTOUPDATE':
        launcherIniContent += "autoupdate " + obj.value + '\r\n';
        break;
      default:
        iniContent += obj.key + ' ' + obj.value + '\r\n';
        break;
    }
  }

  console.log(iniContent);

  fs.writeFile(iniPath,iniContent,(err) => {
    if(err)
      notifyError('Error while updating ' + iniPath + '.\n\n' + err);
  });

  fs.writeFile(patchConfigPath,launcherIniContent,(err) => {
    if(err) 
    notifyError('Error while updating ' + patchConfigPath + '.\n\n' + err)
  });
}

const downloadFiles = (updateFileCount,onSuccess, onError, onProgress) =>
{
  console.log(fileList);
  let index = 0;
  try
  {
    dlSingle(index,updateFileCount,onSuccess,onProgress);
  }
  catch
  {
    onError();
  }

  onSuccess();
}

const dlSingle = (index,updateFileCount,onSuccess,onProgress) =>
{
  let file = fileList[index];
  let url1 = serverRoot + file.Dir.replace('\\','/') + '.gz';
  let error = false;
  downloadGzipFileTo(url1,localClientPath + file.Dir, file.Size,() => 
  { 
    updateFileCount(1,file.Size)
    if(index+1 < fileList.length && !error)
      dlSingle(index+1,updateFileCount,onSuccess,onProgress);
    else
      onSuccess();
  },
  (err) => 
  { 
    notifyError(err)
    updateFileCount();
    error = true;
  },
  onProgress);
}

var totalFileSize = 0;

const processPatchList = (path,onFinished,onError) => {
  totalFileSize = 0;
  var rl = readline.createInterface({
    input : fs.createReadStream(path),
    output: process.stdout,
    terminal: false
  })

  fileList = new Array<PatchEntry>();

  let folder = '';

  rl.on('line',(line : string) => {
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
      var file = cols.join(' ');
      var fileNotFound = false;
      var exSize;
      var exDate;

      try
      {
        var path = localClientPath + folder + '\\' + file
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
        console.log('File not found!');
        fileNotFound = true;
      }

      if(fileNotFound || exSize != size || exDate < date )
      {
        totalFileSize += size;
        //enqueue Files
        fileList.push(new PatchEntry(folder + '\\' + file,size));
      }
    }
  })

  rl.on('close',(sum) => {
    onFinished();
  })
}

var fileSizeProgress : number = 0;

const downloadGzipFileTo = (path1,saveAs,size,onSuccess,onError,onProgress) =>
{
  APP_STATE.Progress.CurrentFile = saveAs;
  console.log(path1,saveAs);
  try
  {
    if(!fs.existsSync(path.dirname(saveAs)))
    {
      fs.mkdirSync(path.dirname(saveAs));
    }
  
    const ws = fs.createWriteStream(saveAs)
  
    ws.on('error',() => {
      return onError('Unable to save file ' + saveAs + '.\n Make sure that your launcher is in the same Directory as your Game Client!');
    })

    ws.on('finish',() => onSuccess(size));
  
    const zunlib = zlib.createGunzip();

    var headers = {
      'Accept-Encoding': 'gzip'
    };

    progress(request(path1,{
      headers: headers,
      method: 'GET'
    })).on('progress', (state) => {
      onProgress(0,state.speed);
    }).on('error', (error) => {
      return onError('Unable to retrieve file from' + path1 + '.\n\n' + error);
    }).on('end', () => {
      console.log(path1);
    })
    .pipe(zunlib)
    .pipe(ws);
  
  }
  catch(ex)
  {
    onError(JSON.stringify(ex));
  }

}

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', async () => {

    setTimeout(() => {
        createWindow();
        console.log(app.getVersion());
      });
    });

  app.on('ready', function()  {
    autoUpdater.checkForUpdatesAndNotify();
    console.log(autoUpdater.getFeedURL());
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}

function mkDirByPathSync(targetDir, { isRelativeToScript = false } = {}) {
  const sep = path.sep;
  const initDir = path.isAbsolute(targetDir) ? sep : '';
  const baseDir = isRelativeToScript ? __dirname : '.';

  return targetDir.split(sep).reduce((parentDir, childDir) => {
    const curDir = path.resolve(baseDir, parentDir, childDir);
    try {
      fs.mkdirSync(curDir);
    } catch (err) {
      if (err.code === 'EEXIST') { // curDir already exists!
        return curDir;
      }

      // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
      if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
        throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
      }

      const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1;
      if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
        throw err; // Throw if it's just the last created dir.
      }
    }

    return curDir;
  }, initDir);
}