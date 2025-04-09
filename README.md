# StocksBar 
A minimal Electron application to watch stocks on bar

[中文版(Chinese)](README_zh.md)

## preview
![image](https://github.com/emtry/StocksBar/raw/master/images/preview.gif)

## Requirements

### Running

- macOS 10.11+
- Windows 7+  (deprecated)

### Building

- Node.js v16.14.2 or newer
- yarn v1.22.18 or newer
- electron v18.3.7

```
git clone https://github.com/emtry/StocksBar.git
cd StocksBar
npm install -g yarn cross-env
yarn install

# run
yarn start

# pack
yarn dist
```
## Download

From [here](https://github.com/emtry/StocksBar/releases/)

## Features

- ✅Add China A-shares support (E.g. sh000300)
- ✅Add fund support (E.g. of001410)
- ✅Add US stocks support (E.g. gb_tsla)
- ✅Add HK stocks support (E.g. hk01810)

## Thanks
- [Electron](https://github.com/electron/electron)

## License

The project is released under the terms of the  [GPLv3](https://www.gnu.org/licenses/gpl-3.0.txt) .
