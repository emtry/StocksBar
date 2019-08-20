const electron = require('electron');
const {
  app,
  Menu,
  Tray,
  nativeImage,
  dialog,
  BrowserWindow,
} = require('electron')

const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  app.quit()
}

if (process.platform === 'darwin') {
  app.dock.hide()
}

const path = require('path');
const waitUntil = require('wait-until');
const request = require('request')
const iconv = require("iconv-lite");
const Store = require('electron-store');
const store = new Store();

global.sharedObject = {
  name: '',
  per: ''
};

let tray = null
app.on('ready', () => {
  if (process.platform === 'darwin') {
    tray = new Tray(nativeImage.createEmpty())
  } else if (process.platform === 'win32') {
    tray = new Tray(`${__dirname}/images/icon32.ico`)
  }

  Menu.setApplicationMenu(null)
  const contextMenu = Menu.buildFromTemplate([{
      label: 'Setting',
      click: function() {
        win.show()
      }
    },
    {
      label: 'About',
      click: function() {
        dialog.showMessageBox({
          type: 'info',
          icon: `${__dirname}/images/StocksBar.png`,
          title: 'About',
          message: 'StocksBar',
          detail: 'Version 1.1.2',
          buttons: ['确定']
        })
      }
    },
    {
      label: 'Quit',
      click: function() {
        app.exit();
      }
    }
  ])

  tray.setTitle("%")
  // tray.setToolTip('StocksBar')
  tray.setContextMenu(contextMenu)

  if (store.get('symbol') == null) {
    store.set('symbol', "sh000300");
  }

  waitUntil()
    .interval(2000)
    .times(Infinity)
    .condition(function() {
      var url = 'http://hq.sinajs.cn/list=s_' + store.get('symbol')
      request({
        url: url,
        encoding: null
      }, (err, res, body) => {
        // console.log(body)
        if (body != null) {
          var str = iconv.decode(body, 'GBK')
          var ar = str.split("\"")
          var arr = ar[1].split(",")
          tray.setTitle(arr[3] + "%")
          global.sharedObject.name = arr[0]
          global.sharedObject.per = arr[3]
        } else {
          tray.setTitle("%")
          global.sharedObject.per = ''
          global.sharedObject.name = 'ERROR!'
        }
        return (false);
      })
    })
    .done(function(result) {
      // do stuff
    });

  if (process.platform === 'win32') {
    let win2 = new BrowserWindow({
      width: 72,
      height: 29,
      x: 1300,
      y: 20,
      resizable: false,
      maximizable: false,
      fullscreen: false,
      fullscreenable: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true
      }
    })
    win2.loadURL(`file://${__dirname}/win2.html`);
    win2.once('ready-to-show', () => {
      win2.show()
    })
  }

  let win = new BrowserWindow({
    width: 500,
    height: 200,
    resizable: false,
    maximizable: false,
    fullscreen: false,
    fullscreenable: false,
    show: false,
    icon: `${__dirname}/images/icon32.ico`,
    title: 'Setting',
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.on('close', function(event) {
    win.hide();
    event.preventDefault();
  })
  win.on('closed', function() {
    win = null;
  });
  win.loadURL(`file://${__dirname}/Setting.html`);
  // win.webContents.openDevTools()
})
