import {assert, expect} from 'chai';
import sinon from 'sinon';
import TestAuth from '../lib/testauth.js';

describe('TestAuth', () => {
  describe('constructor', () => {
    it('should create an instance.', () => {
      assert(new TestAuth() instanceof TestAuth);
    });
  });
  
  describe('getOAuthAccessToken', () => {
    it('should return a dummy OAuth-like token.', () => {
      const ta = new TestAuth();
      const callback = sinon.spy(function(err, access, refresh, results) {
        assert.equal(err, null);
        assert.equal(access, 'testauth-access-token-123');
        assert.equal(refresh, undefined);
      });
      ta.getOAuthAccessToken('testauth-code-123', {}, callback);
      assert.equal(callback.callCount, 1);
    });
    
    it('should reject malformed authentication codes', () => {
      const ta = new TestAuth();
      const callback = sinon.spy(function(err, access, refresh, results) {
        assert.equal(err.statusCode, 401);
        assert.equal(access, undefined);
        assert.equal(refresh, undefined);
      });
      ta.getOAuthAccessToken('invalid-code-000', {}, callback);
      assert.equal(callback.callCount, 1);
    });
  });
  
  describe('get', () => {
    it('should return a dummy profile.', () => {
      const ta = new TestAuth();
      const callback = sinon.spy(function(err, data, response) {
        assert.equal(err, null);
        const profile = JSON.parse(data);
        assert.equal(profile.ident, 'testauth:321');
        assert.equal(profile.name,  'Test User 321');
        assert.equal(profile.email, 'testuser321@example.com');
        assert.equal(profile.image, 'default.png');
      });
      ta.get(undefined, 'testauth-access-token-321', callback);
      assert.equal(callback.callCount, 1);
    });
    
    it('should reject malformed access tokens.', () => {
      const ta = new TestAuth();
      const callback = sinon.spy(function(err, data, response) {
        assert.equal(err.statusCode, 401);
        assert.equal(data, undefined);
      });
      ta.get(undefined, 'invalid-access-token-000', callback);
      assert.equal(callback.callCount, 1);
    });
  });
});
