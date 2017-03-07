const isProduction = process.env.NODE_ENV === 'production';

const express = require('express')
const app = express();
const _ = require('underscore');
const config = require('./app_config');

const auth = require('./lib/googleapis/auth');
const drive = require('./lib/googleapis/drive');
const logger = require('./lib/logger');
const ical = require('./lib/ical');
const path = require('path');
const fs = require('fs-extra');
const MemoryFileSystem = require('memory-fs');
const mfs = new MemoryFileSystem();
const exec = require('child_process').exec;

const port = 8000;
const moment = require('moment');

let cacheDir = path.join(process.cwd(), 'cache');
fs.ensureDirSync(cacheDir);
const listPath = path.join(cacheDir, 'list.json');
const list = fs.existsSync(listPath) ? fs.readJsonSync(listPath) : [];
let syncedList = list;

// cors
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get('/oauth2callback', function (req, res) {
  res.send(`${req.query.code}`)
});

const filePaths = [];

const getFile = (id, ext) => {
  const fileName = id + '.' + ext;
  const filePath = '/photo/' + fileName;
  const url = `http://localhost:${port}/file/${fileName}`;
  // 이미 존재하면 스킵
  if (mfs.existsSync(filePath)) {
    return Promise.resolve(url);
  }

  return drive.getFile(id).then(obj => {
    mfs.mkdirpSync('/photo');
    mfs.writeFileSync(filePath, obj.buffer);

    filePaths.push(filePath);
    while (filePaths.length > 10) { // 2개만 유지
      mfs.unlinkSync(filePaths.shift());
    }
    return Promise.resolve(url);
  }, err => {
    logger(err);
    return Promise.reject();
  });
};

app.get('/photo', function (req, res, next) {
  const list = _.filter(syncedList, item => {
    // 핸폰으로 찍은거 제외. 메타데이터 없는거 제외.
    return item.hasThumbnail && item.imageMediaMetadata && item.imageMediaMetadata.cameraMake && item.imageMediaMetadata.cameraMake !== 'Apple'
  });
  const ret = {};
  const from = req.query.from;
  const idx = (from) ? _.findIndex(list, item => item.id === from) : 0;
  if (!list.length) {
    res.send(null);
    return;
  }

  ret.current = list[idx];
  if (list.length > idx + 1) {
    ret.next = list[idx + 1];
  }

  Promise.all([
    getFile(ret.current.id, ret.current.fileExtension),
    ret.next ? getFile(ret.next.id, ret.next.fileExtension) : Promise.resolve(null) // 다음거 미리 받음.
  ]).then(objs => {
    const current = _.first(objs);
    const next = _.last(objs);

    ret.current.path = current;
    if (ret.next) {
      ret.next.path = next;
    }

    res.json(ret);
  }, err => {
    logger(err);
    res.json(null);
  });
});

app.get('/file/:id', function (req, res, next) {
  const path = '/photo/' + req.params.id;
  const buffer = mfs.readFileSync(path);
  res.set('Content-Type', express.static.mime.lookup(path));
  res.send(buffer);
});

app.get('/schedule', function (req, res, next) {
  ical.fetch(config.ical, moment().startOf('day'), moment().startOf('day').add(1, 'month')).then((data) => {
    res.json({
      events: _.sortBy(data, event => moment(event.start).toDate())
    });
  }, (err) => {
    logger(err);
  });
});

if (isProduction) {
  app.use('/', express.static('./dist'));
}

app.listen(port, function (err) {
  if (err) {
    console.log(err)
    return
  }
});

const oauth2Client = auth.init();
auth.authorize(oauth2Client, (auth) => {
  logger('authorized.');
  drive.watch(auth, list, config.drive.watchInterval);
  drive.event.on('modified', () => {
    logger('modified.');
    drive.listPhotos().then((list) => {
      logger(`${list.length} files synced.`);
      fs.outputJsonSync(listPath, list);
      syncedList = list;
      drive.event.emit('synced');
    }, (error) => {
      logger(error);
    });
  });
  drive.event.on('synced', () => {
    logger('synced.');
  });

  if (isProduction) { // rpi
    drive.event.once('synced', () => {
      exec(`chromium-browser --noerrdialogs --incognito --kiosk http://localhost:${port}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`exec error: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
      });
    });
  }
});
