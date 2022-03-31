# StocksBar 
A minimal Electron application to watch stocks on bar

股票代码和基金代码取自[新浪财经](https://finance.sina.com.cn)


## 预览
![image](https://github.com/emtry/StocksBar/raw/master/images/preview.gif)
![image](https://github.com/emtry/StocksBar/raw/master/images/preview_win.png)

## 环境

### 运行环境

- macOS 10.11+
- Windows 7+ （停止维护）

### 搭建搭建

- Node.js v16.14.2
- yarn v1.22.18
- electron v17.3.1

```
git clone https://github.com/emtry/StocksBar.git
cd StocksBar
npm install -g yarn cross-env
yarn install

# 运行
yarn start

# 打包
yarn dist
```

## 下载

From [here](https://github.com/emtry/StocksBar/releases/)

## 功能

- ✅支持保存设置
- ✅支持 Windows
- ✅支持基金 (例如 of001410)
- 添加自动更新

## 感谢
- [Electron](https://github.com/electron/electron)

## License

The project is released under the terms of the  [GPLv3](https://www.gnu.org/licenses/gpl-3.0.txt) .
