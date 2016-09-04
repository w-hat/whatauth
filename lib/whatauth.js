import Provider from './provider.js';
import TestAuth from './testauth.js';

export default class WhatAuth {
  
  // Merge the given config with defaults and initialize the providers.
  constructor(config) {
    const all = Object.assign({}, defaults.all, config && config.all);
    this.providers = {};
    for (let key in config) {
      if (key === 'all') { continue; }
      const providerConfig = Object.assign({}, all, defaults[key], config[key]);
      this.providers[key] = new Provider(providerConfig);
    }
  }
  
  // Find the appropriate OAuth provider and use it.
  fetch(query) {
    if (!query) { throw new Error('Missing query.'); }
    const provider = this.providers[query.provider] ||
                     this.providers[query.provider.split('-')[0]];
    if (!provider) { throw new Error('Unknown provider: ' + query.provider); }
    return provider.fetch(query);
  }
}

const defaults = {
  all: {
    imageSize: 200,
    baseSite: '',
    process(data) { return data; },
  },
  testauth: {
    OAuth: TestAuth,
  },
  facebook: {
    baseSite: "https://graph.facebook.com",
    fields: "name,email",
    profileBase: "https://graph.facebook.com/v2.5/me?fields=",
    process(data) {
      return {
        ident: "facebook:" + data.id,
        name:  data.name,
        image: "https://graph.facebook.com/" + data.id + "/picture" +
                   "?width=" + this.imageSize + "&height=" + this.imageSize,
        email: data.email,
        data,
      };
    },
  },
  google: {
    accessTokenPath: "https://www.googleapis.com/oauth2/v4/token",
    //accessTokenPath: "https://accounts.google.com/o/oauth2/token",
    params: {grant_type: "authorization_code"},
    profileUrl: "https://www.googleapis.com/plus/v1/people/me",
    process(data) {
      let email = null;
      try {
        email = data.emails[0].value;
      } catch (e) { null; }
      let image = null;
      try {
        image = data.image.url.split('?')[0] + '?sz=' + this.imageSize;
      } catch (e) { null; }
      return {
        ident: 'google:' + data.id,
        name:  data.displayName,
        image,
        email,
        data, 
      };
    }
  },
  github: {
    baseSite: "https://github.com/login",
    //accessTokenPath: "https://github.com/login/oauth/access_token",
    profileUrl: "https://api.github.com/user",
    emailUrl: "https://api.github.com/user/emails",
    process(data) {
      let email = data.email;
      if (!email) {
        for (let obj of data.emails) {
          if (obj.primary) { email = obj.email; break; }
        }
      }
      return {
        ident: 'github:' + data.id,
        name:  data.name || data.login,
        image: data.avatar_url,
        email,
        data,
      }
    },
  }
  // TODO Bitbucket
  // TODO StackOverflow
  // TODO Odnoklassniki
}

