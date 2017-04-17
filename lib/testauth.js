// This module acts like OAuth2.

class TestAuth {
  
  getOAuthAccessToken(code, params, callback) {
    if ('testauth-code-' !== code.slice(0,14)) {
      callback({statusCode: 401, data: 'Invalid authentication code: ' + code});
    } else {
      const id = code.slice(14);
      const err = null;
      const access = 'testauth-access-token-' + id;
      const refresh = undefined;
      const results = {
        access_token: access,
        expires: Math.floor(Date.now()/1000) + 100000000,
      };
      callback(err, access, refresh, results);
    }
  }
  
  get(url, token, callback) {
    if ('testauth-access-token-' !== token.slice(0,22)) {
      callback({statusCode: 401, data: 'Invalid access token: ' + token});
    } else {
      const pieces = token.split('-');
      const id = pieces[3];
      let image = null;
      if ((pieces.length > 5) && (pieces[4] == "image")) {
        image = pieces[5];
      }
      const profile = {
        name:  'Test User ' + id,
        email: 'testuser'   + id + '@example.com',
        ident: 'testauth:'  + id,
        image,
      }
      const data = JSON.stringify(profile);
      const response = {};
      callback(null, data, response);
    }
  }
}

export default TestAuth;
