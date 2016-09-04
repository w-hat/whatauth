import {assert, expect} from 'chai';
import {OAuth2} from 'oauth';
import sinon from 'sinon';
import Provider from '../lib/provider.js';

describe('Provider', () => {
  describe('constructor', () => {
    it('should create an instance.', () => {
      assert(new Provider({}) instanceof Provider);
    });
    
    it('should create an OAuth object if not provided.', () => {
      const provider = new Provider({
        id: 'oauth-id',
        secret: 'shhhh',
        baseSite: 'https://oauth.example.com/',
        profileUrl: 'https://oauth.example.com/me',
      });
      assert(provider.oauth instanceof OAuth2);
      assert.equal(provider.imageSize, undefined);
      assert.equal(provider.oauth._clientId, 'oauth-id');
      assert.equal(provider.oauth._clientSecret, 'shhhh');
      assert.equal(provider.oauth._baseSite, 'https://oauth.example.com/');
      assert.equal(provider.profileUrl, 'https://oauth.example.com/me');
    });
  });
  
  describe('fetch', () => {
    it('should fetch a profile', (done) => {
      const query = {
        authorizationCode: 'aUtHCoDe',
        provider: 'example-oauth2',
        redirectUri: 'http://localhost/auth/callback',
      };
      
      // This is a mock OAuth2 object.
      const oauth = {
        getOAuthAccessToken: sinon.spy(function(code, params, callback) {
          assert.equal(code, query.authorizationCode);
          assert.deepEqual(params, {redirect_uri: query.redirectUri});
          const access_token = 'oauth2_access_token';
          callback(null, access_token, undefined, {access_token, expires: '1000000'});
        }),
        get: sinon.spy(function(url, access_token, callback) {
          assert.equal(url, 'https://oauth.example.com/me');
          assert.equal(access_token, 'oauth2_access_token');
          const body = `{"name": "Example User", "email": "user@example.com", "id":"id456"}`;
          callback(null, body);
        }),
      };
      
      const provider = new Provider({
        oauth,
        profileUrl: 'https://oauth.example.com/me',
        process(data) {
          data.ident = 'example:' + data.id;
          return data;
        }
      });
      const profilePromise = provider.fetch(query);
      assert(profilePromise instanceof Promise);
      profilePromise.then((profile) => {
        try {
          assert.equal(oauth.getOAuthAccessToken.callCount, 1);
          assert.equal(oauth.get.callCount, 1);
          
          assert.equal(profile.ident, 'example:id456');
          assert.equal(profile.name,  'Example User');
          assert.equal(profile.email, 'user@example.com');
          done();
        } catch (e) {
          done(e);
        }
      }, done);
    });
  });
});
