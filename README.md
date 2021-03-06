# express-acl
[![Build Status](https://travis-ci.org/andela-thomas/express-acl.svg?branch=master)](https://travis-ci.org/andela-thomas/express-acl)
[![Coverage Status](https://coveralls.io/repos/github/andela-thomas/express-acl/badge.svg?branch=develop)](https://coveralls.io/github/andela-thomas/express-acl?branch=develop)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/6cba987b85b84f11bb5ab0340388a556)](https://www.codacy.com/app/thomas-nyambati/express-acl)

Express Access Control Lists (express-acl) enable you to manage the requests made to your express server. It makes use of ACL rules to protect your sever from unauthorized access. ACLs defines which user groups are granted access and the type of access they have against a specified resource. When a request is received against a resource, `express-acl` checks the corresponding ACL policy to verify if the requester has the necessary access permissions.

##### What is ACL rules
ACL is a set of rules that tell `express-acl` how to handle the requests made to your server against a specific resource. Think of them like road signs or traffic lights that control how your traffic flows in your app. ACL rules are defined in JSON or yaml syntax.

**Example**
``` json
[{
  "group": "user",
  "permissions": [{
    "resource": "users",
    "methods": [
      "POST",
      "GET",
      "PUT"
    ],
    "action": "allow"
  }]
}]

```
YAML syntax

```yaml

- group: user
  permissions:
    - resource: users
      methods:
        - GET
        - POST
        - DELETE
      action: allow

```

The contents of this file will be discussed in the usage section


## Installation

You can download `express-acl` from NPM
```bash

  $ npm install express-acl

```

then in your project require express-acl

``` js

  var acl =  require('express-acl');

```

 or GitHub

 ```
  $ git clone https://github.com/andela-thomas/express-acl.git

  ```
copy the lib folder to your project and then require `nacl.js`

``` js

  var acl =  require('./lib/nacl');

```

# Usage

Express acl uses the configuration approach to define access levels.


1. #### Configuration `nacl.json`
    First step is to create a file called `nacl.json` and place this in the root folder. This is the file where we will define the roles that can access our application, and the policies that restrict or give access to certain resources. Take a look at the example below.

    ```json
  
    [{
      "group": "admin",
      "permissions": [{
        "resource": "*",
        "methods": "*"
      }],
      "action": "allow"
      }, {
      "group": "user",
      "permissions": [{
        "resource": "users",
        "methods": [
          "POST",
          "GET",
          "PUT"
        ],
        "action": "deny"
      }]
    }]
  ```

  In the example above we have defined an ACL with two policies with two roles,  `user` and `admin`. A valid ACL should be an Array of objects(policies). The properties of the policies are explained below.

    Property | Type | Description
    --- | --- | ---
    **group** | `string` | This property defines the access group to which a user can belong to  e.g `user`, `guest`, `admin`, `trainer`. This may vary depending with the architecture of you application.
    **permissions** | `Array` | This property contains an array of objects that define the resources exposed to a group and the methods allowed/denied
    **resource** | `string` | This is the resource that we are either giving access to. e.g `blogs` for route `/api/blogs`, `users` for route `/api/users`. You can also specify a glob `*` for all resource/routes in your application(recommended for admin users only)
    **methods** | `string or Array` | This are http methods that a user is allowed or denied from executing. `["POST", "GET", "PUT"]`. use glob `*` if you want to include all http methods.
    **action** | `string` | This property tell express-acl what action to perform on the permission given. Using the above example, the user policy specifies a deny action, meaning all traffic on route `/api/users` for methods `GET, PUT, POST` are denied, but the rest allowed. And for the admin, all traffic for all resource is allowed.

  #### How to write ACL rules
  ACLs define the way requests will be handled by express acl, therefore its important to ensure that they are well designed to maximise efficiency. For more details follow this [link](https://github.com/andela-thomas/express-acl/wiki/How-to-write-effective-ACL-rules)

2. #### Authentication
express-acl depends on the role of each authenticated user to pick the corresponding ACL policy for each defined user groups. Therefore, You should always place the acl middleware after the authenticate middleware. Example using jsonwebtoken middleware

  ``` js
  // jsonwebtoken powered middleware
  ROUTER.use(function(req, res, next) {
    var token = req.headers['x-access-token'];
    if (token) {
      jwt.verify(token, key, function(err, decoded) {
        if (err) {
          return res.send(err);
        } else {
          req.decoded = decoded;
          next();
        }
      });
    }
  });

  // express-acl middleware depends on the the role
  // the role can either be in req.decoded (jsonwebtoken)or req.session
  // (express-session)

  ROUTER.use(acl.authorize);
  ```

# API
There are two API methods for express-acl.

**config[type: function, params: filename<string>,path<string>, yml<boolean>, encoding, baseUrl]**
  
This methods loads the configuration json file. When this method it looks for `nacl.json` the root folder if path is not specified.
**filename**: Name of the ACL rule file e.g nacl.json
**path**: Location of the ACL rule file
**yml**: when set to true means use yaml parser else JSON parser
**baseUrl**: The base url of your API e.g /developer/v1

```js
  var acl = require('express-acl');

  // path not specified
  // looks for config.json in the root folder
  // if your backend routes have base url prefix e.g  /api/<resource>,  v1/<resource> ,
  // developer/v1/<resource>
  // specify it in the config property baserUrl {baseurl: 'api'} ,
  // {baseurl: 'v1'}, {baseurl: 'developer/v1'} respectively
  // else you can specify {baseurl: '/'} or ignore it entirely


  acl.config({
    baseUrl:'api'
  });

  // path specified
  // looks for ac.json in the config folder

  acl.config({
    filename:'acl.json',
    path:'config'
  });

  // When specifying path you can also rename the json file e.g
  // The above file can be acl.json or nacl.json or any_file_name.json

  ```

  **authorize [type: middleware]**

  This is the middleware that manages your application requests based on the role and acl rules.

  ```js
  app.get(acl.authorize);

  ```
  **unless[type:function, params: function or object]**

  By default any route that has no defined policy against it is blocked, this means you can not access this route untill you specify a policy. This method enables you to exclude unprotected routes. This method uses express-unless package to achive this functionality. For more details on its usage follow this link [express-unless](https://github.com/jfromaniello/express-unless/blob/master/README.md)
  ```js
  //assuming we want to hide /auth/google from express acl

  app.use(acl.authorize.unless({path:['/auth/google']});

  ```
  Anytime that this route is visited, unless method will exlude it from being passed though our middleware.
  **N/B** You don't have to install `express-unless` it has already been included into the project.

# Example
Install express-acl

```
npm install express-acl
```

Create `nacl.json` in your root folder
```json
  [{
    "group": "user",
    "permissions": [{
      "resource": "users",
      "methods": [
        "POST",
        "GET",
        "PUT"
      ],
    "action": "allow"
    }]
  }]
  
```

Require express-acl in your project router file.
```js
  var acl = require('express-acl');
```

Call the config method
```js
  acl.config({
    //specify your own baseUrl
    baseUrl:'/'
  });
```

Add the acl middleware
```js
  app.get(acl.authorize);
```

For more details check the examples folder.[examples](https://github.com/andela-thomas/express-acl/tree/master/examples)

# Contributions
Pull requests are welcome. If you are adding a new feature or fixing an as-yet-untested use case, please consider writing unit tests to cover your change(s). For more information visit the contributions [page](https://github.com/andela-thomas/express-acl/wiki/contributions)
