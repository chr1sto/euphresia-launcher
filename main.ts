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
import * as os from 'os'
import * as checkDiskSpace from 'check-disk-space';
import { EuphresiaEnvironment, AppState, PatchEntry, CurrentProgress, CurrentState, AppOs, CommandType, AppCommand, ProgressEntry } from './patcher/models';
import { Downloader, } from './patcher/downloader';
import { PatchlistProcessor } from './patcher/patchListProcessor';
const async = require('async');



var mEnvironments : { [id: string] : EuphresiaEnvironment; } = {}
/*
mEnvironments["LIVE"] = { PatchRoot: 'http://patch.euphresia-flyff.com/', ClientPath: path.resolve(path.dirname(app.getPath('exe')),'..\\Client\\') + '\\' }
mEnvironments["PBE"] = { PatchRoot: 'http://pbe.euphresia-flyff.com/', ClientPath: path.resolve(path.dirname(app.getPath('exe')),'..\\Client_PBE\\') + '\\' }
*/

mEnvironments["LIVE"] = { PatchRoot: 'http://patch.euphresia-flyff.com/', ClientPath: 'C:\\Program Files\\Euphresia Flyff\\Client\\' }
mEnvironments["PBE"] = { PatchRoot: 'http://pbe.euphresia-flyff.com/', ClientPath: 'C:\\Program Files\\Euphresia Flyff\\Client_PBE\\'  }

var currentEnvironment = mEnvironments["LIVE"];

let win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

electronLog.transports.file.level = "debug";
autoUpdater.logger = electronLog;

let configEntries : any = null;

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

var currentOs = new AppOs();
currentOs.Type = os.type();
currentOs.Release = os.release();
currentOs.Platform = os.platform();

APP_STATE.Os = currentOs;

var sender : any;
var initialized : boolean = false;

var eEnv = 'LIVE';

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
        break;
      case CommandType.SET_ENVIRONMENT:
        setEnvironment(cmd.Params[0]);
        break;
      default:
        break;
    }
  })


  //TODO How to implement this?
  ipcMain.on('config-get',(event,arg) =>{
      if(!configEntries)
      {
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
 * Set Environment
 *************************************************/

const setEnvironment = (env : string) => {
  if(APP_STATE.State == CurrentState.UPDATING)
  {
    notifyError('You cannot change the Environment while updating!');
    return false;
  }
  
  currentEnvironment = mEnvironments[env];
  checkForAvailablePatches();
  return true;
}

/*************************************************
 * Check for Updates
 *************************************************/

const checkForAvailablePatches = () =>
{      
  APP_STATE.State = CurrentState.CHECKING_FOR_UPDATE;
  var downloader = new Downloader(6);
  var patchFilePath = path.join(path.join(process.env.LOCALAPPDATA,'Euphresia','Flyff','list.txt.gz'))
  downloader.DownloadSingleFile(new PatchEntry(patchFilePath,0,new URL('list.txt.gz',currentEnvironment.PatchRoot))).then(
    () => {
      var plp = new PatchlistProcessor(patchFilePath,currentEnvironment.ClientPath,currentEnvironment.PatchRoot);
      plp.Run().then((result) => {
        if(result.length > 0)
        {
          APP_STATE.State = CurrentState.UPDATE_AVAILABLE;
          APP_STATE.Progress.TotalSize = plp.TotalFileSize;
        }
        else
        {
          APP_STATE.State = CurrentState.UP_TO_DATE;
          APP_STATE.Progress.TotalSize = 0;
        }
      })
    }
  )
}


/*************************************************
 * Start Download
 *************************************************/
const getReadableFileSizeString = (fileSizeInBytes) => {

  var i = -1;
  var byteUnits = [' kb', ' Mb', ' Gb', ' Tb', 'Pb', 'Eb', 'Zb', 'Yb'];
  do {
      fileSizeInBytes = fileSizeInBytes / 1024;
      i++;
  } while (fileSizeInBytes > 1024);

  return Math.max(fileSizeInBytes, 0.1).toFixed(1) + byteUnits[i];
  };

const startDownloadProcess = () =>
{
  APP_STATE.State = CurrentState.CHECKING_FOR_UPDATE;
  var downloader = new Downloader(6);
  var patchFilePath = path.join(path.join(process.env.LOCALAPPDATA,'Euphresia','Flyff','list.txt.gz'))
  downloader.Progress.on(data => {
    APP_STATE.Progress.DownloadSpeed = data.Speed;
    APP_STATE.Progress.ProcessedSize = data.ProgressedSize;
  });
  downloader.StatusUpdate.on(err => {
    if(err)
    {
      notifyError(JSON.stringify(err));
    }
    else
    {
        checkForAvailablePatches();
    }
  })
  downloader.DownloadSingleFile(new PatchEntry(patchFilePath,0,new URL('list.txt.gz',currentEnvironment.PatchRoot))).then(
    () => {
      var plp = new PatchlistProcessor(patchFilePath,currentEnvironment.ClientPath,currentEnvironment.PatchRoot);
      plp.Run().then((result) => {
        if(result.length > 0)
        {
          checkDiskSpace(currentEnvironment.ClientPath).then(diskSpace => {
            if(diskSpace.free > plp.TotalFileSize)
            {
              APP_STATE.State = CurrentState.UPDATING;
              APP_STATE.Progress.ProcessedSize = 0;
              APP_STATE.Progress.TotalSize = plp.TotalFileSize;
              downloader.start(result);
            }
            else
            {
              notifyError('There is not enough space on your drive. Please make sure that you have atleast ' +  getReadableFileSizeString(plp.TotalFileSize) + ' of free space on your drive.')
            }
          })

        }
        else
        {
          APP_STATE.State = CurrentState.UP_TO_DATE;
          APP_STATE.Progress.TotalSize = 0;
          APP_STATE.Progress.ProcessedSize = 0;
        }
      })
    }
  )  
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
      var process : child_process.ChildProcess = child_process.spawn(path.join(path.resolve(currentEnvironment.ClientPath),'binary','Euphresia.exe'),params,{detached: true, stdio:['ignore','ignore','ignore'],cwd: currentEnvironment.ClientPath});//.unref();
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
        if(code != 0)
        {
          try
          {
            notifyError("["+JSON.stringify(code)+","+JSON.stringify(signal)+"]",true);
          }
          catch(ex)
          {
            notifyError(ex,true);
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

const notifyError = (message,silent = false) =>
{
  if(silent)
  {
    win.webContents.send('errorMessage_silent',message);
  }
  else
  {
    win.webContents.send('errorMessage',message);
  }
} 

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

      var flagEnv = false;
      var flagAA = false;

      rl.on('line',(line) => {
        var params : string[] = line.split(' ');
        if(params.length > 1)
        {
          var name = params.shift();
          if(name.toUpperCase() == 'ENVIRONMENT')
          {
            setEnvironment(params.join(' '));
            eEnv = params.join(' ');
            flagEnv = true;

          }
          if(name.toUpperCase() == 'AUTOUPDATE')
          {
            flagAA = true;

          }

          configEntries.push({key: name, value: params.join(' ')})
          count++;
        }
      }) 

      rl.on('close',() => {
        //if(!flagEnv) configEntries.push({key: 'environment', value: 'LIVE'});
        //if(!flagAA) configEntries.push({key: 'autoupdate', value: '1'});
        callback();
      })
    }
    else
    {
      configEntries.push({key: 'autoupdate', value: '1'});
      configEntries.push({key: 'environment', value: 'LIVE'});
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
      case 'ENVIRONMENT':
        if(!launcherIniContent.includes('environment'))
        {
          launcherIniContent += "environment " + obj.value + '\r\n';
          if(eEnv != obj.value && setEnvironment(obj.value)) {
            eEnv = obj.value;
          }

        }
        break;
      default:
        iniContent += obj.key + ' ' + obj.value + '\r\n';
        break;
    }
  }

  fs.writeFile(iniPath,iniContent,(err) => {
    if(err)
      notifyError('Error while updating ' + iniPath + '.\n\n' + err);
  });

  fs.writeFile(patchConfigPath,launcherIniContent,(err) => {
    if(err) 
    notifyError('Error while updating ' + patchConfigPath + '.\n\n' + err)
  });
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