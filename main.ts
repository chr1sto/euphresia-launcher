import { app, BrowserWindow, screen, ipcMain, ipcRenderer } from 'electron';
import { download } from 'electron-dl'
import * as path from 'path';
import * as url from 'url';
import * as request from 'request';
import * as fs from 'fs';
import * as zlib from 'zlib';
import * as readline from 'readline'

let win, serve;
const args = process.argv.slice(1);
serve = args.some(val => val === '--serve');

const serverRoot = 'https://localhost:44345/static/'
const localClientPath = 'C:\\temp\\'

var fileList : Array<string>;

function createWindow() {

  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: 900,
    height: 650,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
    },
    frame: false,
    transparent: true,
    icon: './logo.png'
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

  ipcMain.on('check-for-updates',(event,arg) => {
    downloadGzipFileTo(
      serverRoot + 'list.txt.gz',
      localClientPath + 'list.txt',
      () => {
        event.sender.send('status-update','Checking for updates...');
        processPatchList(localClientPath + 'list.txt',() => {
          if(fileList.length > 0)
          {
            event.sender.send('patch-available','New Patch avalaible!')
          }
        },
        (error) => console.log(error))
      },
      () => console.log('error'))
  });

  ipcMain.on('start-download-process',(event, arg) => {
    var currentFile : number = 0;
    event.sender.send('status-update','Retrieving Patchlist...');
    downloadGzipFileTo(
      serverRoot + 'list.txt.gz',
      localClientPath + 'list.txt',
      () => 
      {
        event.sender.send('status-update','Processing Patchlist...');
        processPatchList(localClientPath + 'list.txt',() => {
          event.sender.send('file-count',fileList.length)
          event.sender.send('status-update','Applying Patches...');
          downloadFiles(
            (i) => event.sender.send('update-progress',++currentFile),
            () => console.log('fin'),//event.sender.send('status-update','Finished'),
            () => {
              ++currentFile;
              if(currentFile == fileList.length || currentFile % 10)
                event.sender.send('update-progress',currentFile);
              event.sender.send('status-update','ERROR');
            })
        },(error) => console.log(error))
      },
      () => console.log('error'));
  })

}

const downloadFiles = (updateFileCount,onSuccess, onError) =>
{
  for(let file of fileList)
  {
    var url = serverRoot + file.replace('\\','/') + '.gz';
    try
    {
      downloadGzipFileTo(url,localClientPath + file,() => { updateFileCount(1)},() => 
      { 
        console.log('Unable to download file ' + file);
        updateFileCount();
      });
    }
    catch
    {
      onError();
    }
  }

  onSuccess();
}

const processPatchList = (path,onFinished,onError) => {
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
        //enqueue Files
        fileList.push(folder + '\\' + file);
      }
    }
  })

  rl.on('close',(sum) => {
    console.log(fileList);
    onFinished();
  })
}

const downloadGzipFileTo = (path,saveAs,onSuccess,onError) =>
{
  const ws = fs.createWriteStream(saveAs)

  const req = request.get(path);
  const unz = zlib.createGunzip();


  var headers = {
      'Accept-Encoding': 'gzip'
  };
  try
  {
    request({url: path, 'headers': headers, method: 'GET'})
    .pipe(unz) // unzip
    .pipe(ws);

    ws.on('finish',() => onSuccess());
    unz.on('error',(err) => onError(err));
  }
  catch
  {
    onError();
  }  
}

try {

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', async () => {
    setTimeout(createWindow);
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