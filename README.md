# WhatAuth

WhatAuth is a simple backend authentication helper.

```
npm install --save whatauth
```

## Usage

Using WhatAuth is a two step process:
 1. Configure your OAuth2 providers.
 2. Fetch user profiles from those providers.

WhatAuth comes with default OAuth2 settings for Facebook, Google, and Github.
You, obviously, still need to provide your app's `clientID` and `clientSecret`.

```js
var WhatAuth = require('whatauth');

var wa = new WhatAuth({
  github: {
    id:     GITHUB_CLIENT_ID,
    secret: GITHUB_CLIENT_SECRET,
  },
});
```

Then fetch a user's profile with a query object.  The query object should
contain a `provider`, an `authorizationCode`, and a `redirectUri`.
This query object may come from a frontend library such as
[ember-what-session](https://github.com/w-hat/ember-what-session) or
[torii](https://github.com/Vestorly/torii).

```js
wa.fetch(query).then(function(profile) {
  // Use the profile object to find and modify an existing account in your
  // database or create a new account.
});
```

The `fetch` function returns a Promise, which can be used with ES6
`async`/`await`.

```js
let profile = await wa.fetch(query);
```

WhatAuth convention is to provide a profile with the following five keys.
This can be changed by overriding the `process` function in the provider's
configuration.

```js
{
  ident: 'provider:123',
  name:  'Example User',
  email: 'user@example.com',
  image: 'profile-picture.jpg',
  data:  rawDataFromTheProvider
}
```

## Test Helper

WhatAuth provides a fake OAuth provider called TestAuth:

```js
var wa = new WhatAuth({ testauth: true });

var query = {
  provider: 'testauth',
  authCode: 'testauth-code-777',
  redirectUri: 'http://localhost:3000'
}

wa.fetch(query).then(function(profile) {
  // The profile object includes a dummy name, ident, email, and image.
});
```

## Custom OAuth2 Provider

You can add your own OAuth2 providers in the configuration.
A custom OAuth2 configuration might look something like:

```js
config.auth = {
  custom: {
    accessTokenPath: "https://www.example.com/oauth2/v1/token",
    profileUrl:      "https://www.example.com/oauth2/v1/me",
    process: function(data) {
      return {
        ident: 'example:' + data.id,
        name:  data.username,
        email: data.email,
        image: data.image,
        data:  data
      };
    }
  }
}
```

See the source code in `./lib/whatauth.js` for examples of configuring
providers.

Note that WhatAuth is still under development and may change significantly.

