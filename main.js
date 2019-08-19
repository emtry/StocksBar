const electron = require('electron');
const {
  app,
  Menu,
  Tray,
  nativeImage,
  dialog,
  BrowserWindow,
} = require('electron')

if (process.platform === 'darwin') {
  app.dock.hide()
}

const path = require('path');
const waitUntil = require('wait-until');
const request = require('request')

global.sharedObject = {
  symbol: 'sh000300'
};

let tray = null
app.on('ready', () => {
  if (process.platform === 'darwin') {
    tray = new Tray(nativeImage.createEmpty())
  } else if (process.platform === 'win32') {
    tray = new Tray('images/icon32.ico')
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
          icon: 'images/StocksBar.png',
          title: 'About',
          message: 'StocksBar',
          detail: 'Version 1.0.1',
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



  waitUntil()
    .interval(2000)
    .times(Infinity)
    .condition(function() {
      var url = 'http://hq.sinajs.cn/list=s_' + global.sharedObject.symbol
      request(url, (err, res, body) => {
        // console.log(body)
        var str = String(body)
        var arr = str.split(",")
        if (arr[3] == null) {
          tray.setTitle("%")
        } else {
          tray.setTitle(arr[3] + "%")
        }
        return (false);
      })
    })
    .done(function(result) {
      // do stuff
    });


  let win = new BrowserWindow({
    width: 500,
    height: 220,
    resizable: false,
    maximizable: false,
    fullscreen: false,
    fullscreenable: false,
    show: false,
    icon:'images/icon32.ico',
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
