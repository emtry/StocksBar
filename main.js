const {
  app,
  Menu,
  Tray,
  nativeImage,
  dialog,
  BrowserWindow
} = require('electron')
app.dock.hide()

const waitUntil = require('wait-until');
const request = require('request')

global.sharedObject = {
  symbol: 'sh000300'
};

let tray = null
app.on('ready', () => {
  tray = new Tray(nativeImage.createEmpty())
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
          icon: nativeImage.createEmpty(),
          title: 'About',
          message: 'Stocks Bar',
          detail: 'Version 1.0.0',
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
  tray.setToolTip('Stocks Bar')
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
        tray.setTitle(arr[3] + "%")
        return (false);
      })
    })
    .done(function(result) {
      // do stuff
    });


  let win = new BrowserWindow({
    width: 500,
    height: 200,
    resizable: false,
    maximizable: false,
    fullscreen: false,
    fullscreenable: false,
    show: false,
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
