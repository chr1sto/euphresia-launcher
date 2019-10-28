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


let win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

electronLog.transports.file.level = "debug";
autoUpdater.logger = electronLog;

let configEntries : any = null;

const serverRoot = 'https://patch.euphresia-flyff.com/';
const localClientPath = path.dirname(app.getPath('exe')) + '\\client\\'//'E:\\Flyff\\Euphresia FlyFF - Beta\\'//;
const tempExecPath = path.join(path.resolve(localClientPath),'binary\\Euphresia.exe');
const appdata = path.join(process.env.LOCALAPPDATA,'Euphresia\\Flyff\\');
const iniPath = path.join(appdata,'Euphresia.ini');
const patchConfigPath = path.join(appdata,'EuphresiaLauncher.ini');

var progressReportLast = new Date();

var selectedAccountId = null;
var token : string = null;

var fileList : Array<string>;

var runningClients : any[] = [];

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
  ipcMain.on('check-for-updates',(event,arg) => {    
    downloadGzipFileTo(
      serverRoot + 'list.txt.gz',
      appdata + 'list.txt',
      () => {
        event.sender.send('status-update','Checking for updates...');
        processPatchList(appdata + 'list.txt',() => {
          if(fileList.length > 0)
          {
            event.sender.send('patch-available','New Patch avalaible!');
            event.sender.send('total-file-size',totalFileSize);
          }
          else{
            event.sender.send('up-to-date','Up to date!');
          }
        },
        (error) => console.log('err' + error))
      },
      () => console.log('error'),
      (progress,speed) => true)
  });

  ipcMain.on('start-download-process',(event, arg) => {
    fileSizeProgress = 0;
    var currentFile : number = 0;
    event.sender.send('status-update','Retrieving Patchlist...');
    downloadGzipFileTo(
      serverRoot + 'list.txt.gz',
      appdata + 'list.txt',
      () => 
      {
        event.sender.send('status-update','Processing Patchlist...');
        processPatchList(appdata + 'list.txt',() => {
          if(fileList.length == 0)
          {
            event.sender.send('up-to-date','Up to date!');
          }
          else
          {
            event.sender.send('file-count',fileList.length);
            event.sender.send('total-file-size',totalFileSize);
            event.sender.send('status-update','Applying Patches...');
            downloadFiles(
              (i) => event.sender.send('update-progress',++currentFile),
              () => console.log('fin'),//event.sender.send('status-update','Finished'),
              () => {
                ++currentFile;
                if(currentFile == fileList.length || currentFile % 10)
                  event.sender.send('update-progress',currentFile);
                event.sender.send('status-update','ERROR');
              },
              (progress,speed) => {
                fileSizeProgress += progress;
                if(true || (new Date().getSeconds() - progressReportLast.getSeconds()) > 1)
                {
                  event.sender.send('progress-size',{progress: fileSizeProgress,speed: speed});
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
  })

  ipcMain.on('start-game',(event,arg) => {
    if(arg)
    {
      var id = arg.replace('-','');
      var params = ['127.0.0.1',id,currToken];
      console.log(params.join('\n'));
      var process : child_process.ChildProcess = child_process.spawn(tempExecPath,params,{detached: true, stdio:['ignore','ignore','ignore'],cwd: localClientPath});//.unref();
      runningClients.push({ account: id, process: process });
      event.sender.send('update-client-list',runningClients);
      process.on('close',(code,signal) => {
        for(let i = 0; i < runningClients.length; i++)
        {
          if(runningClients[i].id == id)
          {
            runningClients.splice(i,1);
          }
        }
        event.sender.send('update-client-list',runningClients);
      })
    }
  })

  ipcMain.on('token',(event,arg) => {
    currToken = arg;
    const filter = { urls: ["http://*/*", "https://*/*"] };
    session.defaultSession.webRequest.onBeforeSendHeaders(filter,setToken)
  })

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


  ipcMain.on('select-account',(event,args) => {
    selectedAccountId = args;
  })

  ipcMain.on('open-web',(event,args) => {
    child_process.execSync('start ' + args);
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
  let url1 = serverRoot + file.replace('\\','/') + '.gz';
  let error = false;
  downloadGzipFileTo(url1,localClientPath + file,() => 
  { 
    updateFileCount(1)
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

  fileList = new Array<string>();

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
      var file = cols[3];
      var size = parseInt(cols[2]);
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
        fileList.push(folder + '\\' + file);
      }
    }
  })

  rl.on('close',(sum) => {
    onFinished();
  })
}

var fileSizeProgress : number = 0;

const downloadGzipFileTo = (path1,saveAs,onSuccess,onError,onProgress) =>
{
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

    ws.on('finish',() => onSuccess());
  
    const zunlib = zlib.createGunzip();

    var headers = {
      'Accept-Encoding': 'gzip'
    };

    progress(request(path1,{
      headers: headers,
      method: 'GET'
    })).on('progress', (state) => {
      onProgress(state.size.transferred,state.speed);
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
    onError(ex);
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