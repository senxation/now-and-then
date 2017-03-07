const EventEmitter = require('events');

const _ = require('underscore');
const google = require('googleapis');
const logger = require('../logger')
const MemoryStream = require('memory-stream');

const eventEmitter = new EventEmitter();

let drive = google.drive('v3');
let oauth2Client = null;
let isPending = false;

const getList = (from) => {
  logger('getList', from || 'from beginning.');
  const options = {
    pageSize: 1000,
    q: 'mimeType contains "image/"', // or mimeType contains "video/"',
    spaces: 'photos',
    orderBy: 'createdTime asc',
    fields: 'nextPageToken, kind, files(contentHints/thumbnail,hasThumbnail,id,createdTime,modifiedTime,imageMediaMetadata,kind,mimeType,name,fileExtension,ownedByMe,properties,size,thumbnailLink,thumbnailVersion,videoMediaMetadata,webContentLink)'
  };

  if (from) {
    options.pageToken = from;
  }

  const promise = new Promise((resolve, reject) => {
    drive.files.list(options, function(err, response) {
      if (err) {
        logger('The API returned an error: ' + err);
        return;
      }

      if (response.files.length === 0) {
        reject('No files found.');
      } else {
        resolve(response);
      }
    });
  });

  return promise;
}

const getFile = (id) => {
  const promise = new Promise((resolve, reject) => {
    var ws = new MemoryStream();

    logger('getFile', id);

    ws.on('finish', function() {
      logger('getFile done.');
      resolve({
        filename: id,
        buffer: ws.get()
      });
    });

    drive.files.get({
      fileId: id,
      alt: 'media'
    }).on('end', function() {
    }).on('error', function(err) {
      logger('Error during download', err);
    }).pipe(ws);
  });

  return promise;
}

const listPhotos = () => {
  const list = [];

  const _getList = (nextPageToken) => {
    let promise = new Promise((resolve, reject) => {
      return getList(nextPageToken).then((response) => {
        if (response.files.length) {
          response.files.forEach((file) => {
            list.push(file);
          });
          if (response.nextPageToken) {
            resolve(response.nextPageToken);
          } else {
            resolve();
          }
        }
      }, (err) => {
        console.log('error', err)
      });
    });

    return promise.then((nextPageToken) => {
      if (nextPageToken) {
        return _getList(nextPageToken);
      } else {
        isPending = false;
        return list;
      }
    }, (err) => {
      console.log('error', err)
    });
  };

  return _getList();
}

const watchModified = (list) => {
  const promise = new Promise((resolve, reject) => {
    drive.files.list({
      pageSize: 1000,
      q: 'mimeType contains "image/"', // or mimeType contains "video/"',
      spaces: 'photos',
      orderBy: 'createdTime desc',
      fields: 'nextPageToken, kind, files(contentHints/thumbnail,hasThumbnail,id,createdTime,modifiedTime,imageMediaMetadata,kind,mimeType,name,fileExtension,ownedByMe,properties,size,thumbnailLink,thumbnailVersion,videoMediaMetadata,webContentLink)'
    }, function(err, response) {
      if (err) {
        reject('The API returned an error: ' + err)
        return;
      }

      const file = _.first(response.files);
      if (!file) {
        return resolve('no files.');
      }

      if (list.length && _.last(list).id === file.id) {
        return resolve('not modified.');
      }

      resolve({
        id: file.id
      });
    });
  });

  return promise;
}

module.exports = {
  watch: (auth, list, interval = 1000 * 60 * 10) => {
    oauth2Client = auth;
    drive = google.drive({
      auth: oauth2Client,
      version: 'v3'
    });

    const watch = () => {
      if (isPending) {
        return;
      }

      isPending = true;
      watchModified(list).then((result) => {
        if (result && result.id) {
          eventEmitter.emit('modified');
          return;
        }
        eventEmitter.emit('synced');
        isPending = false;
      }, (err) => {
        logger('error', err)
      });
    }
    watch();
    setInterval(watch, interval);
  },
  event: eventEmitter,
  listPhotos: listPhotos,
  getFile: getFile
};
