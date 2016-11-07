import {OAuth2} from 'oauth';

class Provider {
  constructor(config) {
    if (!config) { throw new Error('Missing config'); }
    Object.assign(this, config);
    if (!this.oauth) {
      const clientId     = this.clientId     || this.id;
      const clientSecret = this.clientSecret || this.secret;
      const OAuth        = this.OAuth || OAuth2;
      this.oauth = new OAuth(clientId, clientSecret, this.baseSite,
              this.authorizePath, this.accessTokenPath, this.customHeaders);
    }
    if (!this.profileUrl) {
      this.profileUrl = this.profileBase + this.fields;
    }
  }
  
  fetch(query) {
    const code = query.authorizationCode  || query.authCode ||
                 query.auth || query.code || query.authcode;
    const redirect_uri = query.redirect_uri || query.redirectUri;
    const params = Object.assign({ redirect_uri }, this.params);
    const provider = this;
    return new Promise(function(resolve, reject) {
      function callback(err, access, refresh, results) {
        if (err) { return reject(err); }
        const url = provider.profileUrl;
        provider.oauth.get(url, access, function(err, body, res) {
          if (err) { return reject(err); }
          const data = JSON.parse(body);
          if (provider.emailUrl && !data.email) {
            provider.oauth.get(provider.emailUrl, access, function(err, body, res) {
              if (err) { return reject(err); }
              data.emails = JSON.parse(body);
              resolve(provider.process(data));
            });
          } else {
            const profile = provider.process(data);
            resolve(profile);
          }
        });
      };
      provider.oauth.getOAuthAccessToken(code, params, callback);
    });
  }
}

export default Provider;
