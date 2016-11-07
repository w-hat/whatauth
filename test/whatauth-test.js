import {assert, expect} from 'chai';
import {OAuth2} from 'oauth';
import sinon from 'sinon';
import WhatAuth from '../lib/whatauth.js';

describe('WhatAuth', () => {
  describe('constructor', () => {
    it('should create an instance.', () => {
      assert(new WhatAuth() instanceof WhatAuth);
    });
    
    it('should override defaults.', () => {
      const wa = new WhatAuth({
        all: {imageSize: 300},
        facebook: {imageSize: 400},
        google: {},
      });
      assert.equal(wa.providers.facebook.imageSize, 400);
      assert.equal(wa.providers.google.imageSize, 300);
    });
    
    it('should create an OAuth object if not provided.', () => {
      const wa = new WhatAuth({
        google: {id:  'google-id', secret: 'google-secret'},
      });
      assert(wa.providers.google.oauth instanceof OAuth2);
      assert.equal(wa.providers.google.imageSize, 200);
      assert.equal(wa.providers.google.oauth._clientId, 'google-id');
      assert.equal(wa.providers.google.oauth._clientSecret, 'google-secret');
    });
  });
  
  describe('fetch', () => {
    
    it('should fetch a profile from TestAuth.', (done) => {
      const query = {
        authorizationCode: 'testauth-code-137',
        provider: 'testauth',
      };
      const wa = new WhatAuth({testauth: true});
      const profilePromise = wa.fetch(query);
      assert(profilePromise instanceof Promise);
      profilePromise.then((profile) => {
        try {
          assert.equal(profile.name,  'Test User 137');
          assert.equal(profile.email, 'testuser137@example.com');
          assert.equal(profile.ident, 'testauth:137');
          assert.equal(profile.image, 'default.png');
          done();
        } catch (e) {
          done(e);
        }
      }, done);
    });
  
    it('should fetch a profile from Facebook.', (done) => {
      const query = {
        authorizationCode: 'fAceBoOk_aUtHCodE',
        provider: 'facebook',
        redirectUri: 'http://localhost/auth/facebook/callback',
      };
      
      const oauth = {
        getOAuthAccessToken: sinon.spy(function(code, params, callback) {
          assert.equal(code, query.authorizationCode);
          assert.deepEqual(params, {redirect_uri: query.redirectUri});
          const access_token = 'fb_access_token';
          callback(null, access_token, undefined, {access_token, expires: '100000000'});
        }),
        get: sinon.spy(function(url, access_token, callback) {
          assert.equal(url, 'https://graph.facebook.com/v2.5/me?fields=name,email');
          assert.equal(access_token, 'fb_access_token');
          const body = `{"name": "Facebook User", "email": "fbuser@example.com", "id":"fbid789"}`;
          callback(null, body);
        }),
      };
      
      const wa = new WhatAuth({ facebook: { oauth } });
      const profilePromise = wa.fetch(query);
      assert(profilePromise instanceof Promise);
      profilePromise.then((profile) => {
        try {
          assert.equal(oauth.getOAuthAccessToken.callCount, 1);
          assert.equal(oauth.get.callCount, 1);
          assert.equal(profile.ident, 'facebook:fbid789');
          assert.equal(profile.name,  'Facebook User');
          assert.equal(profile.email, 'fbuser@example.com');
          assert.equal(profile.image, 'https://graph.facebook.com/fbid789/picture?width=200&height=200');
          done();
        } catch (e) {
          done(e);
        }
      }, done);
    });
    
    it('should fetch a profile from Google.', (done) => {
      const query = {
        authorizationCode: '4/gOogLe_aUtHCodE',
        provider: 'google-oauth2',
        redirectUri: 'http://localhost/auth/google/callback',
      };
      
      const oauth = {
        getOAuthAccessToken: sinon.spy(function(code, params, callback) {
          assert.equal(code, query.authorizationCode);
          assert.equal(params.redirect_uri, query.redirectUri);
          assert.equal(params.grant_type, 'authorization_code');
          const access_token = 'goog_access_token';
          callback(null, access_token, undefined, {access_token, expires: '3600',
                  token_type: 'Bearer', id_token: 'verylong'});
        }),
        get: sinon.spy(function(url, access_token, callback) {
          assert.equal(url, 'https://www.googleapis.com/plus/v1/people/me');
          assert.equal(access_token, 'goog_access_token');
          const body = `{"displayName":"Google User","emails":[{"value":
                  "googuser@example.com","type":"account"}],"id":"gid987",
                  "image":{"url":"some-img.jpg?sz=50","isDefault":true}}`;
          callback(null, body);
        }),
      };
      
      const wa = new WhatAuth({ google: { oauth } });
      wa.fetch(query).then((profile) => {
        try {
          assert.equal(oauth.getOAuthAccessToken.callCount, 1);
          assert.equal(oauth.get.callCount, 1);
          assert.equal(profile.ident, 'google:gid987');
          assert.equal(profile.name,  'Google User');
          assert.equal(profile.email, 'googuser@example.com');
          assert.equal(profile.image, 'some-img.jpg?sz=200');
          assert.equal(profile.data.image.url, 'some-img.jpg?sz=50');
          done();
        } catch (e) {
          done(e);
        }
      }, done);
    });
    
    it('should fetch a profile from Github.', (done) => {
      const query = {
        authorizationCode: 'giThUB_aUtHCodE',
        provider: 'github-oauth2',
        redirectUri: 'http://localhost/auth/github/callback',
      };
      
      const oauth = {
        getOAuthAccessToken: sinon.spy(function(code, params, callback) {
          assert.equal(code, query.authorizationCode);
          assert.equal(params.redirect_uri, query.redirectUri);
          const access_token = 'github_access_token';
          callback(null, access_token, undefined, {access_token, scope: '',
                  token_type: 'bearer'});
        }),
        get: sinon.spy(function(url, access_token, callback) {
          assert.equal(access_token, 'github_access_token');
          let body;
          if (url === 'https://api.github.com/user') {
            body = `{"name":"Github User","email":null,"id":"ghid234",
                    "avatar_url":"https://avatars.githubusercontent.com/u/ghid234?v=3"}`;
          } else if (url === 'https://api.github.com/user/emails') {
            body = `[{"email":"githubuser@example.com","primary":true,"verified":true}]`;
          } else {
            assert.equal('wrong', 'github url');
          }
          callback(null, body);
        }),
      };
      
      const wa = new WhatAuth({ github: { oauth } });
      wa.fetch(query).then((profile) => {
        try {
          assert.equal(oauth.getOAuthAccessToken.callCount, 1);
          assert.equal(oauth.get.callCount, 2);
          
          assert.equal(profile.ident, 'github:ghid234');
          assert.equal(profile.name,  'Github User');
          assert.equal(profile.email, 'githubuser@example.com');
          assert.equal(profile.image, 'https://avatars.githubusercontent.com/u/ghid234?v=3&s=200');
          // https://avatars.githubusercontent.com/u/21134804?s=400
          done();
        } catch (e) {
          done(e);
        }
      }, done);
    });
    
    it('should fetch a profile from Bitbucket.');
    
    it('should fetch a profile from StackOverflow.');
    
    it('should fetch a profile from Odnoklassniki.');
    
  });
  
});
