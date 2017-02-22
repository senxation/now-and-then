var fs = require('fs');
var readline = require('readline');
var googleAuth = require('google-auth-library');
var opn = require('opn');

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/now-and-then.json
var SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/drive.photos.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/';
var TOKEN_PATH = TOKEN_DIR + 'now-and-then.json';

function getOAuth2Client(credentials) {
  var clientSecret = credentials.installed.client_secret;
  var clientId = credentials.installed.client_id;
  var redirectUrl = credentials.installed.redirect_uris[0];
  var auth = new googleAuth();
  return new auth.OAuth2(clientId, clientSecret, redirectUrl);
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

module.exports = {
  init: () => {
    // Load client secrets from a local file.
    const content = fs.readFileSync('client_secret.json')
    return getOAuth2Client({
      installed: JSON.parse(content).installed
    });
  },
  authorize: (oauth2Client, callback) => {
    const hasToken = fs.existsSync(TOKEN_PATH);
    if (hasToken) {
      const token = fs.readFileSync(TOKEN_PATH);
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    } else {
      var authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
      });
      opn(authUrl); // open browser to get new token.

      var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      rl.question('Enter the code from that page here: ', function(code) {
        rl.close();
        oauth2Client.getToken(code, function(err, token) {
          if (err) {
            console.log('Error while trying to retrieve access token', err);
            return;
          }
          oauth2Client.setCredentials(token);
          storeToken(token);
          callback(oauth2Client);
        });
      });
    }
  }
};
