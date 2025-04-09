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
  price: '',
  per: '',
  marketStatus: ''
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
          detail: 'Version 1.2.7',
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
    store.set('symbol', "gb_tsla");
  }

  waitUntil()
    .interval(2000)
    .times(Infinity)
    .condition(function() {
      // 获取当前symbol
      const symbol = store.get('symbol');
      
      // 检查是否为港股（以hk开头）
      if (symbol.startsWith('hk')) {
        var url = 'http://hq.sinajs.cn/list=' + symbol;
        request({
          url: url,
          encoding: null,
          headers: {
            "Referer": "http://finance.sina.com.cn",
          }
        }, (err, res, body) => {
          if (err || body == null) {
            setErrorState();
          } else {
            try {
              // 将GBK编码的响应转换为utf8字符串
              var str = iconv.decode(body, 'GBK');
              
              // 解析返回的字符串，格式为: var hq_str_hk01810="XIAOMI-W,小米集团－Ｗ,49.400,..."
              var matches = str.match(/"([^"]+)"/);
              if (matches && matches[1]) {
                var fields = matches[1].split(',');
                
                // 提取相关字段
                var stockName = fields[1];     // 股票名称，如"小米集团－Ｗ"
                var price = parseFloat(fields[6]).toFixed(2); // 当前价格，如46.500，格式化为2位小数
                var changeValue = fields[7];   // 涨跌额，如-2.700
                var changePercent = parseFloat(fields[8]).toFixed(2); // 涨跌幅，如-5.488，格式化为2位小数
                
                // 显示在任务栏上
                tray.setTitle(changePercent + "% " + price);
                
                // 存储股票信息
                global.sharedObject.name = stockName;
                global.sharedObject.price = price;
                global.sharedObject.per = changePercent;
              } else {
                setErrorState();
              }
            } catch (e) {
              setErrorState();
            }
          }
          return (false);
        });
      }
      // 检查是否为美股（以gb_开头）
      else if (symbol.startsWith('gb_')) {
        var url = 'http://hq.sinajs.cn/list=' + symbol;
        request({
          url: url,
          encoding: null,
          headers: {
            "Referer": "http://finance.sina.com.cn",
          }
        }, (err, res, body) => {
          if (err || body == null) {
            setErrorState();
          } else {
            try {
              // 将GBK编码的响应转换为utf8字符串
              var str = iconv.decode(body, 'GBK');
              console.log('收到美股数据:', str);
              
              // 解析返回的字符串，格式为: var hq_str_gb_tsla="特斯拉,259.1600,-1.67,..."
              var matches = str.match(/"([^"]+)"/);
              if (matches && matches[1]) {
                var fields = matches[1].split(',');
                
                // 提取相关字段
                var stockName = fields[0];                     // 股票名称
                var openPrice = parseFloat(fields[1]);         // 开盘价格
                var openChangePercent = parseFloat(fields[2]); // 开盘时的涨跌幅
                var currentPrice = parseFloat(fields[21]);     // 当前价格
                var lastClosePrice = parseFloat(fields[fields.length-1]); // 最后收盘价
                
                console.log('数据字段检查:', {
                  openPrice,
                  openChangePercent,
                  currentPrice,
                  lastClosePrice,
                });
                
                // 自动判断当前时间与市场状态
                const getEstTime = () => {
                  // 创建当前UTC时间
                  const now = new Date();
                  
                  // 创建纽约时间对象（自动处理夏令时）
                  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
                  
                  // 获取小时和分钟
                  const estHours = nyTime.getHours();
                  const estMinutes = nyTime.getMinutes();
                  const weekDay = nyTime.getDay(); // 0是周日，6是周六
                  
                  // 返回需要的信息
                  return {
                    hours: estHours,
                    minutes: estMinutes,
                    decimalTime: estHours + estMinutes/60,
                    isWeekend: weekDay === 0 || weekDay === 6
                  };
                };
                
                // 获取当前美东时间
                const estTime = getEstTime();
                
                // 判断市场状态
                let marketStatus = "";
                let isMarketActive = false;
                
                // 周末市场关闭
                if (estTime.isWeekend) {
                  marketStatus = "(休市)";
                  isMarketActive = false;
                }
                // 常规交易时段: 9:30 AM - 4:00 PM
                else if (estTime.decimalTime >= 9.5 && estTime.decimalTime < 16) {
                  marketStatus = "";  // 常规交易无需特殊标记
                  isMarketActive = true;
                }
                // 盘前交易: 4:00 AM - 9:30 AM
                else if (estTime.decimalTime >= 4 && estTime.decimalTime < 9.5) {
                  marketStatus = "(盘前)";
                  isMarketActive = true;
                }
                // 盘后交易: 4:00 PM - 8:00 PM
                else if (estTime.decimalTime >= 16 && estTime.decimalTime < 20) {
                  marketStatus = "(盘后)";
                  isMarketActive = true;
                }
                // 夜盘/隔夜交易: 8:00 PM - 4:00 AM
                else {
                  marketStatus = "(夜盘)";
                  isMarketActive = false;  // 大多数券商不提供此时段交易，因此标记为非活跃
                }
                
                var price, changePercent;
                
                // 判断是否为盘中或盘前状态，这里使用前面计算的时间和市场状态
                if (marketStatus === "") {
                  price = openPrice.toFixed(2);
                  changePercent = openChangePercent.toFixed(2);
                } else if (marketStatus === "(盘前)") {
                  price = currentPrice.toFixed(2);
                  changePercent = ((currentPrice / lastClosePrice) - 1) * 100;
                  changePercent = changePercent.toFixed(2); // 保留两位小数
                } else if (marketStatus === "(盘后)") {
                  price = currentPrice.toFixed(2);
                  changePercent = ((currentPrice / lastClosePrice) - 1) * 100;
                  changePercent = changePercent.toFixed(2); // 保留两位小数
                } else if (marketStatus === "(夜盘)") {
                  price = currentPrice.toFixed(2);
                  changePercent = ((currentPrice / lastClosePrice) - 1) * 100;
                  changePercent = changePercent.toFixed(2);
                } else {
                  price = currentPrice.toFixed(2);
                  changePercent = ((currentPrice / lastClosePrice) - 1) * 100;
                  changePercent = changePercent.toFixed(2);
                }
                
                tray.setTitle(changePercent + "% " + price);
                
                // 存储股票信息
                global.sharedObject.name = stockName;
                global.sharedObject.price = price;
                global.sharedObject.per = changePercent;
                global.sharedObject.marketStatus = marketStatus; // 存储市场状态
                
                console.log('解析美股数据成功:', {
                  name: stockName,
                  price: price,
                  changePercent: changePercent,
                  marketStatus: marketStatus
                });
              } else {
                setErrorState();
              }
            } catch (e) {
              setErrorState();
            }
          }
          return (false);
        });
      } else if (symbol.indexOf("of") != -1) {
        var url = 'http://fundgz.1234567.com.cn/js/' + symbol.split("f")[1] + '.js?rt=1463558676006'
        request({
          url: url,
          encoding: null
        }, (err, res, body) => {
          // console.log(body)
          if (err || body == null) {
            tray.setTitle("%")
            global.sharedObject.per = ''
            global.sharedObject.name = 'ERROR!'
            global.sharedObject.price = ''
          } else {
            var str = iconv.decode(body, 'utf8')
            try {
              var art = str.split("{")
              if (art.length > 1) {
                var ar = art[1].split("}")
                if (ar.length > 0) {
                  try {
                    var arr = JSON.parse("{" + ar[0] + "}")
                    if (arr && arr.gszzl && arr.name && arr.gsz) {
                      var fundPercent = parseFloat(arr.gszzl).toFixed(2);
                      var fundPrice = parseFloat(arr.gsz).toFixed(2);
                      
                      tray.setTitle(fundPercent + "%");
                      global.sharedObject.name = arr.name;
                      global.sharedObject.price = fundPrice;
                      global.sharedObject.per = fundPercent;
                    } else {
                      setErrorState()
                    }
                  } catch (e) {
                    setErrorState()
                  }
                } else {
                  setErrorState()
                }
              } else {
                setErrorState()
              }
            } catch (e) {
              setErrorState()
            }
          }
          return (false);
        })
      } else {
        var url = 'http://hq.sinajs.cn/list=s_' + symbol
        request({
          url: url,
          encoding: null,
          headers: {
            "Referer": "http://finance.sina.com.cn",
        }
        }, (err, res, body) => {
          // console.log(body)
          if (err || body == null) {
            setErrorState()
          } else {
            var str = iconv.decode(body, 'GBK')
            var ar = str.split("\"")
            var arr = ar[1] ? ar[1].split(",") : []

            if (arr.length > 3 && arr[1]) {
              // 解析价格和百分比
              var aPrice = parseFloat(arr[1]).toFixed(2);
              var aPercent = parseFloat(arr[3]).toFixed(2);
              
              tray.setTitle(aPercent + "% " + aPrice);
              global.sharedObject.name = arr[0];
              global.sharedObject.price = aPrice;
              global.sharedObject.per = aPercent;
            } else {
              setErrorState()
            }
          }
          return (false);
        })
      }
    })
    .done(function(result) {
      // do stuff
    });

  if (process.platform === 'win32') {
    let win2 = new BrowserWindow({
      width: 72,
      height: 33,
      x: 1300,
      y: 20,
      resizable: false,
      maximizable: false,
      fullscreen: false,
      fullscreenable: false,
      setSkipTaskbar: false,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true,
        contextIsolation: false
      }
    })
    win2.loadURL(`file://${__dirname}/win2.html`);
    win2.once('ready-to-show', () => {
      win2.show()
    })
  }

  let win = new BrowserWindow({
    width: 520,
    height: 200,
    resizable: false,
    maximizable: false,
    fullscreen: false,
    fullscreenable: false,
    show: false,
    icon: `${__dirname}/images/icon32.ico`,
    title: 'Setting',
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false
    }
  })
  win.on('close', function(event) {
    win.hide();
    event.preventDefault();
  })
  win.on('closed', function() {
    win = null;
  });
  require("@electron/remote/main").initialize();
  require("@electron/remote/main").enable(win.webContents);
  win.loadURL(`file://${__dirname}/Setting.html`);
  //win.webContents.openDevTools();
})

function setErrorState() {
  tray.setTitle("%")
  global.sharedObject.per = ''
  global.sharedObject.name = 'ERROR!'
  global.sharedObject.price = ''
}