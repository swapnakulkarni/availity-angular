(function(root) {

  'use strict';

  var availity = root.availity;

  availity.core.value('avValConfig', {
    classes: {
      valid: 'ng-valid',
      invalid: 'ng-invalid',
      dirty: 'ng-dirty',
      pristine: 'ng-pristine',
      touched: 'ng-touched',
      untouched: 'ng-untouched',
      submitted: 'ng-submitted'
    },
    validators: [
      'avValPattern',
      'avValSize',
      'avValRequired',
      'avValDateRange',
      'avValDate'
    ]
  });

  availity.core.constant('AV_VAL', {
    EVENTS: {
      REVALIDATE: 'av:val:revalidate',
      SUBMITTED: 'av:val:submitted',
      FAILED: 'av:val:failed',
      RESET: 'av:val:reset'
    },
    DEBOUNCE: 500,
    DATE_FORMAT: {
      SIMPLE: 'MM/DD/YYYY'
    },
    PATTERNS: {
      ALPHA_ONLY: /[^A-Za-z]+/g,
      NUMERIC_ONLY: /[^0-9]+/g
    }
  });

  availity.core.provider('avVal', function() {

    var that = this;

    this.rules = {};

    this.addRules = function(rules) {
      this.rules = angular.extend(this.rules, rules);
    };

    this.$get = function($injector, $rootScope, $http, $log, avValConfig, AV_VAL) {

      var AvValidation = function() {
        this.rules = that.rules;
        this.validators = [];
        this.initValidators();
      };

      var proto = AvValidation.prototype;

      proto.initValidators = function() {
        var self = this;

        angular.forEach(avValConfig.validators, function(name) {
          var validator = $injector.get(name);
          self.validators[validator.name] = validator;
        });
      };

      proto.clearAll = function() {
        // this.validators.splice(0, this.validators.length);
        // this.rules = {};
      };

      proto.addRules = function(rules) {
        this.rules = angular.extend(this.rules, rules);
        $rootScope.$broadcast(AV_VAL.EVENTS.REVALIDATE);
      };

      proto.validate = function(key, element, value, ruleName) {

        var self = this;

        var rules = this.rules[key];
        if(!rules) {
          $log.error('Failed to get rules key [' + key + '].  Forms must be tagged with a rules set name for validation to work.');
          return;
        }
        var contraints = rules[ruleName];
        if(!contraints) {
          $log.info('Rule named [' + ruleName + '] could not be found in the current schema.');
          contraints = [];
        }

        var el = element[0];
        var results  = [];
        var violations = [];
        var _valid = true;

        angular.forEach(contraints, function(rule, contraintName) {

          if(!rule) {
            // when extended rule sets, a user can pass nulls to cancel out a rule so if
            // one doesn't exist just continue
            return;
          }

          var validator = self.validators[contraintName];

          if(angular.isUndefined(validator)) {
            $log.warn('No validator defined for `' + name + '`');
            return;
          }

          var valid = validator.validate(value, rule);

          var validationResult = {
            valid: valid,
            ruleName: ruleName,
            contraintName: contraintName,
            value: value,
            message: rule.message,
            field: el.name || el.id
          };

          // $log.info(validationResult);

          var result = angular.extend({}, rule, validationResult);

          results.push(result);
          if(!valid) {
            violations.push(validationResult);
          }
          _valid = _valid && valid;
        });

        return {
          isValid: _valid,
          all: results, // all the constraint results
          violations: violations
        };

      };

      return new AvValidation();
    };

  });
})(window);
