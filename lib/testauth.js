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
      const results = {access_token: access, expires: 100000000};
      callback(err, access, refresh, results);
    }
  }
  
  get(url, token, callback) {
    if ('testauth-access-token-' !== token.slice(0,22)) {
      callback({statusCode: 401, data: 'Invalid access token: ' + token});
    } else {
      const id = token.slice(22);
      const profile = {
        name:  'Test User ' + id,
        email: 'testuser'   + id + '@example.com',
        ident: 'testauth:'  + id,
        image: 'default.png',
      }
      const data = JSON.stringify(profile);
      const response = {};
      callback(null, data, response);
    }
  }
}

export default TestAuth;
