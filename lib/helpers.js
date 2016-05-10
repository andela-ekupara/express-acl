(function() {
  'use strict';

  require('colors');

  var fs = require('fs'),
    assert = require('assert'),
    log = require('npmlog'),
    yaml = require('js-yaml'),
    _ = require('lodash');

  var error = {
    warning: 'Policy not set, All traffic will be denied'.yellow,
    required: 'group, permissions, resources,'.red
  };

  /**
   * Ensure that rules has the core properties
   * @param {[JSON]} rules
   • @return {[JSON]}
  */
  var checkProperties = function(rules) {
    var permissions;

    _.each(rules, function(el) {
      if ((typeof el.group === 'string') && (_.isArray(el.permissions))) {
        permissions = el.permissions;

        _.each(permissions, function(policy) {
          assert(policy.resource, true);
          assert(policy.methods, true);
          assert(policy.action, true);
        });
      } else {
        /* istanbul ignore next */
        return log.error('REQUIRED:', error.required);
      }
    });
    return rules;
  };

  /**
   * [Checks the validity of the rules]
   * @param  {[JSON]} rules
   * @return {[JSON]}
   */
  var validate = function(rules) {
    if (!_.isArray(rules)) {
      /* istanbul ignore next */
      throw new Error('TypeError: Expected Array but got ' + typeof rules);
    }
    if (rules.length === 0) {
      return error.warning;
    }
    return checkProperties(rules);
  };

  module.exports = {
    error: error,

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
    },

    /**
     * Get the rules from the specified file path
     * @param {[String]} path
     * @param {[String]} encoding
     * @param {[Boolean]} isYaml
     * @return {[JSON]}
     */
    getRules: function(path, encoding, isYaml) {
      var rules, buffer;

      try {
        buffer = fs.readFileSync(path, {
          encoding: encoding
        });

        rules = (isYaml) ? yaml.safeLoad(buffer) : JSON.parse(buffer);
      } catch (e) {
        /* istanbul ignore next */
        throw Error(e);
      }
      return validate(rules);
    },

    /**
     * [Gets the group from the array
     * of rules based on the role of the user]
     * @param  {[Array]} rule
     * @param  {[String]} role
     * @return {[Object]}
     */
    getGroup: function(res, rules, role) {
      var group = _.find(rules, { group: role });

      if (group) {
        return group;
      }
      res.status(404).send({
        message: 'group not found'
      });
    },

    /**
     * [Gets the methods from the selected group]
     * @param  {[Object]} group
     * @param  {[String]} resource
     * @return {[Array/String]} Returns an array of methods
     * or a string incase a glob is used;
     */
    getPolicy: function(group, resource) {
      var policy = _.find(group.permissions, {
        resource: resource
      });

      if (policy) {
        return {
          methods: policy.methods,
          action: policy.action
        };
      }
      return policy;
    },

    getRole: function(res, decoded, session) {
      if (decoded && decoded.role) {
        return decoded.role;
      }
      if (session && session.role) {
        return session.role;
      }
      log.warn('MISSING',
        'Role not defined. All traffic will be blocked'.yellow);

      return res.status(404).send({
        message: 'role not found'
      });
    },

    resource: function(next, url, baseUrl) {
      var base = (baseUrl) ? baseUrl.match(/([A-Z])\w+/gi) : null;
      var lengthOfTheBaseUrl = (base) ? base.length : 0;
      var arr = url.match(/([A-Z])\w+/gi);

      if (arr) {
        arr = arr.splice(lengthOfTheBaseUrl);
        return arr[0];
      }
      return next();
    }
  };
  return;
})();
