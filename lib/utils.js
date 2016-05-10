(function() {
  'use strict';
  var _ = require('lodash');
  module.exports = {

    whenGlobAndActionAllow: function(res, next, method, methods) {
      /*
       * Allow traffic to all  resources
       * 1. Check for methods
       * 2. If its a string and a glob '*'
       * 3. Allow traffic on all methods
       * 4. If methods are defined
       * 5. Allow traffic on the defined methods and deny the rest
       *
       * If the method is a glob '*' grant access
       */
      if (_.isString(methods)) {
        switch (methods) {
          case '*':
            return next();
            /* istanbul ignore next */
          default:
            throw new Error('DefinationError: Unrecognised glob, use "*"');
        }
      }


      /**
       * [if Its an array of  methods]
       * 1. check if the method is defined
       * 2. If defined Allow traffic else deny access
       */

      if (_.isArray(methods)) {
        var index = methods.indexOf(method);

        switch (index) {
          case -1:
            return res
              .status(403)
              .send({
                status: 403,
                success: false,
                error: 'ACCESS DENIED'
              });
          default:
            return next();

        }
      }
    },

    whenGlobAndActionDeny: function(res, next, method, methods) {
      /*
       * Allow traffic to all  resources
       * 1. Check for methods
       * 2. If its a string and a glob '*'
       * 3. Allow traffic on all methods
       * 4. If methods are defined
       * 5. Allow traffic on the defined methods and deny the rest
       */
      if (_.isString(methods)) {
        switch (methods) {
          case '*':
            return res
              .status(403)
              .send({
                status: 403,
                success: false,
                error: 'ACCESS DENIED'
              });
            /* istanbul ignore next */
          default:
            throw new Error('DefinationError: Unrecognised glob, use "*"');
        }
      }

      if (_.isArray(methods)) {
        var index = methods.indexOf(method);

        switch (index) {
          case -1:
            return next();
          default:
            return res
              .status(403)
              .send({
                status: 403,
                success: false,
                error: 'ACCESS DENIED'
              });
        }
      }
    },

    whenGlobAndMethodString: function(res, next, action, methods) {
      switch (methods) {
        case '*':
          switch (action) {
            case 'deny':
              return res
                .status(403)
                .send({
                  status: 403,
                  success: false,
                  error: 'ACCESS DENIED'
                });
            default:
              return next();
          }
          /* istanbul ignore next */
          return;
          /* istanbul ignore next */
        default:
          throw new Error('DefinationError: Unrecognised glob. use "*"');
      }
    }
  };
})();