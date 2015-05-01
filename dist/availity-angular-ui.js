/**
 * availity-angular v0.6.6 -- May-01
 * Copyright 2015 Availity, LLC 
 */

// Source: /lib/ui/index.js


(function(root) {

  'use strict';

  var availity = root.availity || {};

  availity.MODULE_UI = 'availity.ui';
  availity.ui = angular.module(availity.MODULE_UI, ['ng', 'ngSanitize']);

  availity.ui.constant('AV_UI', {
    NG_OPTIONS: /^\s*([\s\S]+?)(?:\s+as\s+([\s\S]+?))?(?:\s+group\s+by\s+([\s\S]+?))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?$/
  });

  if(typeof module !== 'undefined' && module.exports) {
    module.exports = availity;
  }


})(window);

// Source: /lib/ui/templates/template.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.factory('avTemplateCache', function($q, $templateCache, $http) {
    return {

      get: function(options) {

        var valid = !options.template || !options.templateUrl;

        if(!valid) {
          throw new Error("Either options.template or options.templateUrl must be defined for avTemplateCache");
        }

        return options.template ? $q.when(options.template) :
          $http.get(options.templateUrl, {cache: $templateCache})
            .then(function(result) {
              return result.data;
            });
      }
    };
  });

})(window);

// Source: /lib/ui/modal/modal.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_MODAL', {

    OPTIONS: {
      scope: null,
      templateUrl: null,
      template: null,
      id: null,
      container: null,

      // Bootstrap defaults
      keyboard: true,
      backdrop: true,
      show: false,
      remote: false
    },

    EVENTS: {
      SHOW: 'show.av.modal',
      SHOWN: 'shown.av.modal',
      HIDE: 'hide.av.modal',
      HIDDEN: 'hidden.av.modal'
    },

    BS_EVENTS:  {
      SHOW: 'show.bs.modal',
      SHOWN: 'shown.bs.modal',
      HIDE: 'hide.bs.modal',
      HIDDEN: 'hidden.bs.modal'
    },

    TEMPLATES: {
      MODAL: 'ui/modal/modal-tpl.html'
    }
  });

  var ModalFactory = function($rootScope, $timeout, $compile, AV_MODAL, avTemplateCache) {

    var Modal = function(options) {

      var self = this;

      this.options = angular.extend({}, AV_MODAL.OPTIONS, {scope: $rootScope.$new()}, options);

      avTemplateCache.get(options).then(function(template){
        self.options.template = template;
        self.create();
      });

    };

    var proto = Modal.prototype;

    proto.create = function() {

      var self = this;

      var scope = this.options.scope;
      this.$element = angular.element(this.options.template);

      this.createId();
      this.scope();

      $compile(this.$element)(scope);
      $timeout(function() {
        self.init();
      }, 0, true);

      // Append to container or <body>
      this.options.container ? this.$element.appendTo(this.options.container) : this.$element.appendTo('body');

    };

    proto.scope = function() {

      var self = this;
      var scope = this.options.scope;

      scope.modalShow = function() {
        self.show();
      };

      scope.modalToggle = function() {
        self.toggle();
      };

      scope.modalHide = function() {
        self.hide();
      };

    };

    proto.init = function() {

      // Initialize Bootstrap jQuery plugin
      this.$element.modal({
        'backdrop': this.options.backdrop,
        'keyboard': this.options.keyboard,
        'show': this.options.show,
        'remote': this.options.remote
      });

      this.listeners();
    };

    proto.listeners = function() {

      var self = this;
      var scope = this.options.scope;
      var $element = this.$element;

      $element.on(AV_MODAL.BS_EVENTS.SHOW, function(event) {
        scope.$emit(AV_MODAL.EVENTS.SHOW, event, self);
      });

      $element.on(AV_MODAL.BS_EVENTS.SHOWN, function(event) {

        if(angular.isFunction(self.options.onShown)) {
          self.options.onShown();
        }

        scope.$emit(AV_MODAL.EVENTS.SHOWN, event, self);
      });

      $element.on(AV_MODAL.BS_EVENTS.HIDE, function(event) {
        scope.$emit(AV_MODAL.EVENTS.HIDE, event, self);
      });

      $element.on(AV_MODAL.BS_EVENTS.HIDDEN, function(event) {

        if(angular.isFunction(self.options.onHidden)) {
          self.options.onHidden.call(this);
        }

        scope.$emit(AV_MODAL.EVENTS.HIDDEN, event, self);

        $timeout(function() {
          self.destroy();
        }, 0, true);

      });

      // Garbage collection
      scope.$on('$destroy', function() {
        self.destroy();
      });
    };

    proto.show = function() {
      this.$element.modal('show');
    };

    proto.hide = function() {
      this.$element.modal('hide');
    };

    proto.toggle = function() {
      this.$element.data('modal').toggle();
    };

    proto.destroy =function() {
      this.$element.remove();
    };

    proto.createId = function() {
      // Create a unique id for the modal if not present or passed in via options
      var id = this.$element.attr('id');
      if(!id) {
        // Get id from options or create a unique id
        id = this.options.id ? this.options.id : availity.uuid('av-modal-id');
        this.$element.attr('id', id);
      }
    };

    return Modal;
  };


  availity.ui.factory('AvModal', ModalFactory);

  availity.ui.directive('avModal', function(AV_MODAL) {
    return {
      restrict: 'A',
      replace: true,
      transclude: true,
      scope: {},
      templateUrl: AV_MODAL.TEMPLATES.MODAL
    };
  });

})(window);

// Source: /lib/ui/navbar/navbar.js

(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_NAVBAR', {

    OPTIONS: {},

    TEMPLATES: {
      NAVBAR: 'ui/navbar/navbar-tpl.html'
    }
  });

  availity.ui.directive('avNavbar', function(AV_NAVBAR, avSession) {
    return {
      restrict: 'A',
      replace: true,
      scope: {},
      templateUrl: AV_NAVBAR.TEMPLATES.NAVBAR,
      controller: function($scope) {
        avSession.getUser().then(function(user) {
          $scope.currentUser = user;
        });
      }
    };
  });

})(window);

// Source: /lib/ui/validation/form.js
/**
 * 1. All fields should be pristine on first load
 * 2. If field is modified an invalid the field should be marked with an error
 *
 */
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.controller('avValFormController', function() {

    this.ngForm  = null;
    this.rulesKey = null;

    // Object that stores the unique id (key) and violation count (value) of all the form fields
    //
    // EX:
    //
    // {
    //  avVal001: 0
    //  avVal002: 2
    //  avVal003: 1
    // }
    this.violations = {};

    this.init = function(form) {
      this.ngForm = form;
    };

    /**
     * Records id of the form field and number of violations
     * @param  {[type]} id    [description]
     * @param  {[type]} count [description]
     * @return {[type]}       [description]
     */
    this.record = function(id, count) {
      this.violations[id] = count;

      var violocationCount = _.reduce(this.violations, function(sum, num) {
        return sum + num;
      }, 0);

      this.ngForm.$setValidity('av', violocationCount === 0);
    };

    this.unrecord = function(id) {
      if(id && this.violations[id]) {
        delete this.violations[id];
      }
    };

    this.$setSubmitted = function() {
      //$animate.addClass(element, SUBMITTED_CLASS);
      this.ngForm.$submitted = true;
      // parentForm.$setSubmitted();
    };

    this.setRulesKey = function(key) {
      this.rulesKey = key;
    };

  });

  // form.$error = {};
  // form.$$success = {};
  // form.$pending = undefined;
  // form.$name = $interpolate(attrs.name || attrs.ngForm || '')($scope);
  // form.$dirty = false;
  // form.$pristine = true;
  // form.$valid = true;
  // form.$invalid = false;
  // form.$submitted = false;

  availity.ui.directive('avValForm', function($log, $timeout, $parse, AV_VAL, avValAdapter, $rootScope) {
    return {
      restrict: 'A',
      priority: 10,
      require: ['form', 'avValForm', '?ngSubmit'],
      controller: 'avValFormController',
      compile: function() {
        return {
          pre: function(scope, iEl, iAttrs, controllers) {

            var ruleFn = $parse(iAttrs.avValForm);
            var rulesKey = ruleFn(scope);
            rulesKey = rulesKey || iAttrs.avValForm; // interpolated rule from scope || fixed string

            if(!rulesKey) {
              $log.error('avValForm requires a rules key in order to run the proper validation rules.');
              return;
            }

            scope.$watch(ruleFn, function(_rulesKey, _oldRulesKey){
              if(_rulesKey) {
                avForm.setRulesKey(_rulesKey);

                if(_rulesKey !== _oldRulesKey) {
                  $timeout(function() {
                    $log.info('avValForm revalidate');
                    $rootScope.$broadcast(AV_VAL.EVENTS.REVALIDATE);
                  });
                }

              }

            });

            var ngForm = controllers[0];
            var avForm = controllers[1];
            avForm.init(ngForm);
            avForm.setRulesKey(rulesKey);


          },
          post: function(scope, iEl, iAttrs, controllers) {

            iEl.attr('novalidate', 'novalidate');  // prevent HTML5 validation from kicking in

            // Disable ng-submit or ng-click handlers and store the function to call for submitting
            var fn;
            if(iAttrs.ngSubmit) {
              // Disable ng-submit event
              iEl.off('submit');
              fn = $parse(iAttrs.ngSubmit, /* expensiveChecks */ true);
            }else if(iAttrs.ngClick) {
              // Disable ng-click event
              iEl.off('click');
              fn = $parse(iAttrs.ngClick, /* expensiveChecks */ true);
            }

            var ngForm = controllers[0];
            var avForm = controllers[1];
            iEl.bind('submit', function(event) {

              scope.$broadcast(AV_VAL.EVENTS.SUBMITTED);
              avForm.$setSubmitted();

              if(ngForm.$invalid) {

                scope.$broadcast(AV_VAL.EVENTS.FAILED);

                $log.info('avValForm invalid.  preventing default submit action');

                event.preventDefault();
                event.stopImmediatePropagation();
                scope.$broadcast(event);

                avValAdapter.scroll(iEl);
                return;
              }

              ngForm.$setPristine();

              if(!fn) {
                return;
              }

              var callback = function() {
                fn(scope, {$event:event});
              };

              scope.$apply(callback);

            });

          }
        };
      }
    };
  });


})(window);

// Source: /lib/ui/validation/field.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.controller('AvValFieldController', function($element, avValAdapter, avVal, $log, $timeout, $scope) {

    this.ngModel = null;
    this.rule = null;
    this.avValForm = null;

    var self = this;

    this.createId = function() {
      this.ngModel.avId = availity.uuid('avVal');
    };

    this.setNgModel = function(ngModel) {
      this.ngModel = ngModel;
    };

    this.setRule = function(rule) {
      this.rule = rule;
    };

    this.avValForm = function(avValForm) {
      this.avValForm = avValForm;
    };

    this.updateModel = function(results) {
      var self = this;
      var validationKeys = [];

      this.ngModel.avResults = results;

      // set state for each violation
      angular.forEach(results.violations, function (result) {
        var key = 'av-' + result.contraintName;
        validationKeys.push(key);
        self.ngModel.$setValidity(key, result.valid);
      });

      // set overall state for validation state
      this.ngModel.$setValidity('av', this.ngModel.avResults.isValid);

      // store violations
      this.ngModel.avViolations = this.ngModel.avResults.violations;

      // record the id and violation count in the av-form controller.  this determines if the form is
      // valid if sum of violations for all form inputs === zero
      this.avValForm.record(this.ngModel.avId, this.ngModel.avResults.violations.length);

      // remove violation keys that are no longer falsy
      angular.forEach(this.ngModel.$error, function(value, key) {

        if(_.indexOf(validationKeys, key) === -1 && key.lastIndexOf('av-', 0) === 0) {
          self.ngModel.$setValidity(key, true);
        }
      });
    };

    this.updateView = function() {
      if(this.ngModel.$dirty) {
        avValAdapter.element($element, this.ngModel, this.ngModel.avResults.isValid);
        avValAdapter.message($element, this.ngModel);
      }
    };

    this.validate = function(value) {

      $log.info('validating value [' + value + ']');

      var rulesKey = self.avValForm.rulesKey;
      var results = avVal.validate(rulesKey, $element, value, self.rule);

      // validate function is called within the context of angular so fn.call
      self.updateModel.call(self, results);
      self.updateView.call(self);

      return value;
    };

    this.debounce = function(avValDebounce) {
      var self = this;

      $element.unbind('input');

      var debounce;
      $element.bind('input', function() {
        $timeout.cancel(debounce);
        debounce = $timeout( function() {
          $scope.$apply(function() {
            self.ngModel.$setViewValue($element.val());
          });
        }, avValDebounce);
      });
    };

  });

  availity.ui.directive('avValField', function($log, $timeout, avVal, avValAdapter, AV_VAL) {
    return {
      restrict: 'A',
      controller: 'AvValFieldController',
      require: ['^avValForm', '?ngModel', 'avValField'],
      scope: {
        avValDebounce: '@?',
        avValOn: '@?'
      },
      link: function(scope, element, attrs, controllers) {

        var avValDebounce = parseInt(scope.avValDebounce || AV_VAL.DEBOUNCE, 10);
        avValDebounce = _.isNumber(avValDebounce) ? avValDebounce : AV_VAL.DEBOUNCE;

        var avValOn = scope.avValOn || null;

        var rule = attrs.avValField; // not always string?
        var avValForm = controllers[0];
        var ngModel = controllers[1];
        var avValField = controllers[2];

        if(!ngModel && !rule) {
          $log.error('avValField requires ngModel and a validation rule to run.');
          return;
        }

        avValField.setNgModel(ngModel);
        avValField.avValForm(avValForm);
        avValField.setRule(rule);
        avValField.createId();

        var debounceAllowed = (element.is("input") && !(attrs.type === 'radio' || attrs.type === 'checkbox'));

        if(debounceAllowed) {
          avValField.debounce(avValDebounce);
        }

        if(avValOn === 'blur') {
          element.on('blur', function () {
            ngModel.$setViewValue(ngModel.$modelValue);
          });
        }

        // (view to model)
        ngModel.$parsers.push(avValField.validate);

        // (model to view) - potentially allow other formatter to run first
        ngModel.$formatters.unshift(avValField.validate);

        scope.$on(AV_VAL.EVENTS.REVALIDATE, function() {
          avValField.validate(ngModel.$viewValue);
        });

        scope.$on(AV_VAL.EVENTS.SUBMITTED, function() {
          ngModel.$dirty = true;
          avValField.validate(ngModel.$viewValue);
        });

        scope.$on('$destroy', function () {
          avValForm.unrecord(ngModel.avId);
        });

      }
    };
  });


})(window);

// Source: /lib/ui/popover/popover.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_POPOVER', {
    NAME: 'bs.popover'
  });

  availity.ui.controller('AvPopoverController', function($element, $scope, AV_POPOVER) {

    this.listeners = function() {

      var self = this;

      angular.forEach(['show', 'shown', 'hide', 'hidden'], function(name) {
        $element.on(name + '.bs.popover', function(ev) {
          $scope.$emit('av:popover:' + name, ev);
        });
      });

      $scope.$on('destroy', function() {
        self.destroy();
      });
    };

    this.plugin = function() {
      return $element.data(AV_POPOVER.NAME);
    };

    this.show = function() {
      $element.popover('show');
    };

    this.hide = function() {
      $element.popover('hide');
    };

    this.toggle= function() {
      $element.popover('toggle');
    };

    this.destroy = function() {
      $element.popover('destroy');
    };
  });

  availity.ui.directive('avPopover', function() {
    return {
      restrict: 'A',
      controller: 'AvPopoverController',
      link: function(scope, element) {

        var options = {};

        scope.$evalAsync(function() {
          element.popover(angular.extend({}, options, {
            html: true
          }));
        });

      }
    };
  });

})(window);

// Source: /lib/ui/validation/messages.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.controller('avValContainerController', function($scope, $timeout) {

    $scope.messages = {
      message: null
    };

    this.message = function(ngModel) {

      var message = null;
      if(ngModel.avResults.violations.length && ngModel.avResults.violations[0].message) {
        message = ngModel.avResults.violations[0].message;
      }else {
        message = null;
      }

      // $timeout is needed to update the UI from $broadcast events
      $timeout(function() {
        $scope.messages.message = message;
      });

    };

  });

  availity.ui.directive('avValContainer', function() {
    return {
      restrict: 'A',
      controller: 'avValContainerController',
      template: '<p class="help-block" data-ng-bind-html="messages.message"></p>',
      replace: true,
      scope: {},
      link: function() {}
    };
  });


})(window);

// Source: /lib/ui/validation/adapter-bootstrap.js
(function(root) {
  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_BOOTSTRAP_ADAPTER', {
    CLASSES: {
      SUCCESS: 'has-success',
      WARNING: 'has-warning',
      ERROR: 'has-error',
      FEEDBACK: 'has-feedback',
      HELP: 'help-block',
      NAVBAR: 'navbar-fixed-top'
    },
    CONTROLLER: '$avValContainerController'
  });

  availity.ui.factory('avValBootstrapAdapter', function(AV_BOOTSTRAP_ADAPTER, $timeout) {

    return {

      element: function(element, ngModel) {
        var el = element[0];
        if(ngModel.$valid) {
          angular.element(el.parentNode).removeClass(AV_BOOTSTRAP_ADAPTER.CLASSES.ERROR);
        }else{
          angular.element(el.parentNode).addClass(AV_BOOTSTRAP_ADAPTER.CLASSES.ERROR);
        }
      },

      message: function(element, ngModel) {

        var selector = [
          '.',
          AV_BOOTSTRAP_ADAPTER.CLASSES.HELP
        ].join('');

        var messageTarget = $(element).siblings(selector);

        if(messageTarget.length === 0) {
          return;
        }

        var el = messageTarget[0]; // just target first sibling
        var $el = angular.element(el);
        var avValModel = $el.data(AV_BOOTSTRAP_ADAPTER.CONTROLLER); // get the av val message controller
        if(avValModel) {
          avValModel.message(ngModel);
        }
      },

      scroll: function(form) {

        // Bootstrap fixed navbars causes bad scroll-to offsets so find them all
        var navbarSelector = [
          '.',
          AV_BOOTSTRAP_ADAPTER.CLASSES.NAVBAR
        ].join('');

        // Add up all the heights to find the true offset
        var offset = 0;
        $(navbarSelector).each(function() {
          offset += $(this).outerHeight();
        });

        var selector = [
          '.',
          AV_BOOTSTRAP_ADAPTER.CLASSES.ERROR,
          ':first'
        ].join('');

        var $target = $(form).find(selector);
        $timeout(function(){
          // scroll to offset top of first error minus the offset of the navbars
          $('body, html').animate({scrollTop: $target.offset().top - offset}, 'fast');
        });
      }
    };
  });


})(window);

// Source: /lib/ui/validation/adapter.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_VAL_ADAPTER', {
    DEFAULT: 'avValBootstrapAdapter'
  });

  availity.ui.provider('avValAdapter', function() {

    var that = this;

    this.setAdapter = function(adapter) {
      this.adapter = adapter;
    };

    this.$get = function(AV_VAL_ADAPTER, $injector) {

      var Adapter = function() {
        var adapterName = that.adapter || AV_VAL_ADAPTER.DEFAULT;
        this.adapter = $injector.get(adapterName);
      };

      var proto = Adapter.prototype;

      proto.element = function(element, ngModel) {
        this.adapter.element(element, ngModel);
      };

      proto.message = function(element, ngModel) {
        this.adapter.message(element, ngModel);
      },

      proto.scroll = function(form) {
        this.adapter.scroll(form);
      };

      return new Adapter();
    };
  });

})(window);

// Source: /lib/ui/dropdown/dropdown.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_DROPDOWN', {
    OPTIONS: [
      'width',
      'minimumInputLength',
      'maximumInputLength',
      'minimumResultsForSearch',
      'maximumSelectionSize',
      'placeholderOption',
      'separator',
      'allowClear',
      'multiple',
      'closeOnSelect',
      'openOnEnter',
      'id', /* Function used to get the id from the choice object or a string representing the key under which the id is stored. `id(object)`*/
      'matcher', /* Used to determine whether or not the search term matches an option when a built-in query function is used. The built in query function is used when Select2 is attached to a select, or the local or tags helpers are used. `matcher(term, text, option)`*/
      'sortResults',
      'formatSelection', /* Function used to render the current selection. `formatSelection(object, container)` */
      'formatResult',
      'formatResultCssClass',
      'formatNoMatches', /* String containing 'No matches' message, or Function used to render the message */
      'formatSearching', /* Function used to render a result that the user can select. `formatResult(object, container, query)` */
      'formatAjaxError',
      'formatInputTooShort',
      'formatInputTooLong',
      'formatSelectionTooBig',
      'formatLoadMore',
      'createSearchChoice',
      'createSearchChoicePosition',
      'initSelection',
      'tokenizer',
      'tokenSeparators',
      'query',
      'ajax',
      'data',
      'tags',
      'containerCss',
      'containerCssClass',
      'dropdownCss',
      'dropdownCssClass',
      'dropdownAutoWidth',
      'adaptContainerCssClass',
      'adaptDropdownCssClass',
      'escapeMarkup',
      'selectOnBlur',
      'loadMorePadding',
      'nextSearchTerm'
    ]
  });


  availity.ui.controller('AvDropdownController', function($element, $attrs, AV_UI, AV_DROPDOWN, $log, $scope, $timeout, $parse) {

    var self = this;

    this.options = [];
    this.match = null;
    this.ngModel = null;

    this.init = function() {

      _.forEach($attrs, function(value, key) {
        if(_.contains(AV_DROPDOWN.OPTIONS, key.replace('data-', ''))){
          self.options[key] = $scope.$eval(value);
        }
      });

      self.multiple = angular.isDefined($attrs.multiple);

      self.options.closeOnResize = self.options.closeOnResize  || true;

    };

    this.setNgModel = function(ngModel) {
      this.ngModel = ngModel;
    };

    this.getSelected = function(model) {
      var items = this.collection($scope);

      var index = _.findIndex(items, function(item) {
        return angular.equals(item, model);
      });

      return index;

    };

    this.setValue = function() {

      var viewValue = self.ngModel.$viewValue;
      var selected = null;

      if(viewValue) {
        selected = this.getSelected(viewValue);
      }

      // var apply = scope.$evalAsync || $timeout;
      $timeout(function() {
        $element
          .select2('val',  (selected === null || selected === 'undefined') ? '' : selected); // null === '' for Select2
      });
    };

    this.setValues = function() {
      var viewValue = self.ngModel.$viewValue;

      if(!angular.isArray(viewValue)) {
        viewValue = [];
      }

      // var apply = scope.$evalAsync || $timeout;
      $timeout(function() {
        $element
          .select2('val', viewValue);
      });
    };

    this.ngOptions = function() {

      this.match = $attrs.ngOptions.match(AV_UI.NG_OPTIONS);
      if(!this.match) {
        throw new Error("Invalid ngOptions for avDropdown");
      }

      // AV_UI.NG_OPTIONS regex will parse into arrays like below:
      //
      // 0: "state.name for state in states"
      // 1: "state.name"
      // 2: undefined
      // 3: undefined
      // 4: "state"
      // 5: undefined
      // 6: undefined
      // 7: "states"
      // 8: undefined
      //
      // 0: "state.id as state.name for state in states"
      // 1: "state.id"
      // 2: "state.name"
      // 3: undefined
      // 4: "state"
      // 5: undefined
      // 6: undefined
      // 7: "states"
      // 8: undefined
      //
      // 0: "state.name for state in states track by state.id"
      // 1: "state.name"
      // 2: undefined
      // 3: undefined
      // 4: "state"
      // 5: undefined
      // 6: undefined
      // 7: "states"
      // 8: "state.id"
      //
      // 0: "person.fullName as (person.lastName + ', ' + person.firstName) for person in feeScheduleModel.persons"
      // 1: "person.fullName"
      // 2: "(person.lastName + ', ' + person.firstName)"
      // 3: undefined
      // 4: "person"
      // 5: undefined
      // 6: undefined
      // 7: "feeScheduleModel.persons"
      // 8: undefined

      this.displayFn = $parse(this.match[2] || this.match[1]); // this is the function to retrieve the text to show as
      this.collection = $parse(this.match[7]);
      this.valueName = this.match[4] || this.match[6];
      this.valueFn = $parse(this.match[2] ? this.match[1] : this.valueName);
      this.keyName = this.match[5];

      $scope.$watchCollection(this.collection, function(newVal, oldVal) {

        if(angular.equals(newVal, oldVal)) {
          return;
        }

        self.setValue();

      }, true);
    };

  });

  availity.ui.directive('avDropdown', function($timeout, $log, $window) {
    return {
      restrict: 'A',
      require: ['ngModel', 'avDropdown'],
      controller: 'AvDropdownController',
      link: function(scope, element, attrs, controllers) {

        var ngModel = controllers[0];
        var avDropdown = controllers[1];

        avDropdown.setNgModel(ngModel);
        avDropdown.init();

        if(attrs.ngOptions) {
          avDropdown.ngOptions();
        }

        ngModel.$parsers.push(function(value) {
          var parent = element.prev();
          parent
            .toggleClass('ng-invalid', !ngModel.$valid)
            .toggleClass('ng-valid', ngModel.$valid)
            .toggleClass('ng-invalid-required', !ngModel.$valid)
            .toggleClass('ng-valid-required', ngModel.$valid)
            .toggleClass('ng-dirty', ngModel.$dirty)
            .toggleClass('ng-pristine', ngModel.$pristine);
          return value;
        });

        element.on('change', function(e) {
          $log.info(e);
        });

        // https://github.com/t0m/select2-bootstrap-css/issues/37#issuecomment-42714589
        element.on("select2-open", function () {

          // look for .has-success, .has-warning, .has-error
          // (really look for .has-* … which is good enough for the demo page, but obviously might interfere with other CSS-classes starting with "has-")
          if(element.parents('[class*="has-"]').length) {

            // get all CSS-classes from the element where we found "has-*" and collect them in an array
            var classNames = $(this).parents('[class*="has-"]')[0].className.split(/\s+/);

            // go through the class names, find "has-"
            for(var i = 0; i < classNames.length; ++i) {
              if(classNames[i].match("has-")) {
                $('#select2-drop').addClass(classNames[i]);
              }
            }
          }
        });

        var _$render = ngModel.$render;
        ngModel.$render = function() {
          _$render();

          if(avDropdown.multiple) {
            avDropdown.setValues();
          }else {
            avDropdown.setValue();
          }

        };

        var win = angular.element($window);

        win.bind('resize', function() {
          element.select2('close');
        });

        win.bind('scroll', function() {
          element.select2('close');
        });

        attrs.$observe('disabled', function (value) {
          element.select2('enable', !value);
        });

        attrs.$observe('readonly', function (value) {
          element.select2('readonly', !!value);
        });

        scope.$on('destroy', function() {
          element.select2('destroy');
        });

        $timeout(function() {
          element.select2(avDropdown.options);
        });
      }
    };
  });

})(window);

// Source: /lib/ui/datepicker/datepicker.js
/**
 * Inspiration https://github.com/mgcrea/angular-strap/blob/v0.7.8/src/directives/datepicker.js
 */
(function(root) {

  'use strict';

  var availity = root.availity;

  // Options: http://bootstrap-datepicker.readthedocs.org/en/latest/options.html
  availity.ui.constant('AV_DATEPICKER', {
    CONTROLLER: '$ngModelController',
    ADD_ON_SELECTOR: '[data-toggle="datepicker"]',
    OPTIONS: [
      'autoclose',
      'beforeShowDay',
      'beforeShowMonth',
      'calendarWeeks',
      'clearBtn',
      'toggleActive',
      'container',
      'daysOfWeekDisabled',
      'datesDisabled',
      'defaultViewDate',
      'endDate',
      'forceParse',
      'format',
      'inputs',
      'keyboardNavigation',
      'language',
      'minViewMode',
      'multidate',
      'multidateSeparator',
      'orientation',
      'startDate',
      'startView',
      'todayBtn',
      'todayHighlight',
      'weekStart',
      'showOnFocus',
      'disableTouchKeyboard',
      'enableOnReadonly'
    ],
    DEFUALTS: {
      FORMAT: 'mm/dd/yyyy',
      CLOSE: true,
      TODAY: true
    }
  });

  availity.ui.controller('AvDatepickerController', function($element, $attrs, AV_DATEPICKER, $scope) {

    var self = this;
    this.options = {};

    this.setValue = function() {


      var viewValue = self.ngModel.$modelValue;
      var plugin = this.plugin();

      if(!viewValue || !plugin) {
        return;
      }

      plugin.setDate(viewValue);
    };

    this.setNgModel = function(ngModel) {
      this.ngModel = ngModel;
    };

    this.findModel = function() {

      var ngModel = null;

      var $input = $element.find('input:first').andSelf();
      if($input.length) {
        ngModel = $input.data(AV_DATEPICKER.CONTROLLER);
        this.setNgModel(ngModel);
      }

      return ngModel;
    };

    this.modelToView = function() {
      var viewValue = $.fn.datepicker.DPGlobal.formatDate(self.ngModel.$modelValue, self.options.format, 'en');
      return viewValue;
    };

    this.viewToModel = function() {


      var format = $.fn.datepicker.DPGlobal.parseFormat(self.options.format);
      var utcDate = $.fn.datepicker.DPGlobal.parseDate(self.ngModel.$viewValue, format, 'en');

      var plugin = self.plugin();

      if(!plugin) {
        return;
      }

      return plugin._utc_to_local(utcDate);
    };

    this.init = function() {

      _.forEach($attrs, function(value, key) {
        if(_.contains(AV_DATEPICKER.OPTIONS, key.replace('data-', ''))){
          self.options[key] = $scope.$eval(value);
        }
      });

      self.options.autoclose = self.options.autoclose ? self.options.autoclose : AV_DATEPICKER.DEFUALTS.CLOSE;
      self.options.todayHighlight = self.options.todayHighlight ? self.options.todayHighlight : AV_DATEPICKER.DEFUALTS.TODAY;
      self.options.format = self.options.format ? self.options.format : AV_DATEPICKER.DEFUALTS.FORMAT;

    };

    this.plugin = function() {
      return $element.data('datepicker');
    };

    this.destroy = function() {
      var plugin = this.plugin();
      if(plugin) {
        plugin.remove();
        $element.data('datepicker', null);
      }

    };

    this.hide = function() {
      var plugin = this.plugin();
      if(plugin) {
        plugin.hide();
      }
    };

  });

  availity.ui.directive('avDatepicker', function($window, $log, AV_DATEPICKER) {
    return {
      restrict: 'A',
      require: ['ngModel', 'avDatepicker'],
      controller: 'AvDatepickerController',
      link: function(scope, element, attrs, controllers) {

        var ngModel = controllers[0];
        var avDatepicker = controllers[1];

        if(!ngModel) {
          ngModel = avDatepicker.findModel();
          if(!ngModel) {
            $log.error('avDatepicker requires ngModel');
            return;
          }
        }

        avDatepicker.init();
        avDatepicker.setNgModel(ngModel);

        element.on('changeDate', function(e) {
          $log.info('avDatepicker changeDate {0}', [e]);
        });

        ngModel.$parsers.push(avDatepicker.viewToModel); // (view to model)
        ngModel.$formatters.unshift(avDatepicker.modelToView);  // (model to view)

        var _$render = ngModel.$render;
        ngModel.$render = function() {
          _$render();
          avDatepicker.setValue();
        };

        var win = angular.element($window);

        win.bind('scroll', function() {
          avDatepicker.hide();
        });

        var target = element.siblings(AV_DATEPICKER.ADD_ON_SELECTOR);
        if(target.length) {
          target.on('click.datepicker', function() {
            if (!element.prop('disabled')) { // Hack check for IE 8
              element.focus();
            }
          });
        }

        scope.$on('destroy', function() {
           avDatepicker.destroy();
           if(target.length) {
             target.off('click.datepicker');
           }
        });

        scope.$evalAsync(function() {
          element.datepicker(avDatepicker.options);
        });

      }
    };
  });

})(window);

// Source: /lib/ui/idle/idle-notifier.js
(function(root) {

  'use strict';

  var availity = root.availity;

  availity.ui.constant('AV_UI_IDLE', {
    TEMPLATES: {
      BASE: 'ui/idle/idle-tpl.html',
      SESSION: 'ui/idle/idle-session-tpl.html',
      WARNING: 'ui/idle/idle-warning-tpl.html'
    }
  });

  availity.ui.provider('avIdleNotifier', function() {

    var sessionTemplate;
    var warningTemplate;
    var $scope;

    this.setSessionTemplate = function(template) {
      sessionTemplate = template;
    };

    this.setWarningTemplate = function(template) {
      warningTemplate = template;
    };

    this.$get = function(AV_IDLE, AV_UI_IDLE, $rootScope, AvModal, $document, $timeout) {

      var AvIdleNotifier = function() {
        this.listeners = [];
        this.modal = null;
      };

      var proto = AvIdleNotifier.prototype;

      proto.init = function() {

        $scope = $rootScope.$new(true);
        $scope.idle = {};

        this.initListeners();
      };

      proto.initListeners = function() {

        var self = this;
        var listener = null;

        // ACTIVATE
        listener = $rootScope.$on(AV_IDLE.EVENTS.ACTIVE, function() {
          self.showWarning();
        });
        this.listeners.push(listener);

        // INACTIVE
        listener = $rootScope.$on(AV_IDLE.EVENTS.INACTIVE, function() {
          self.hideWarning();
        });
        this.listeners.push(listener);

        // SESSION TIMEOUT
        listener = $rootScope.$on(AV_IDLE.EVENTS.SESSION_TIMEOUT_ACTIVE, function() {
          self.showSession();
        });
        this.listeners.push(listener);

      };

      proto.destroyListeners = function() {
        // turn off each listener => http://stackoverflow.com/a/14898795
        _.each(this.listeners, function(listener) {
          listener();
        });
      };


      proto.showWarning = function() {

        var self = this;

        if(this.modal !== null) {
          return;
        }

        $scope = $rootScope.$new(true);
        $scope.idle = {};
        $scope.idle.template = AV_UI_IDLE.TEMPLATES.WARNING;

        this.modal = new AvModal({
          show: true,
          scope: $scope,
          backdrop: 'static',
          templateUrl: AV_UI_IDLE.TEMPLATES.BASE
        });

        $document.on('click', function() {
          self.hideWarning();
          $rootScope.$broadcast(AV_IDLE.EVENTS.INACTIVE);
        });

      };

      proto.hideWarning = function() {
        this.disableBackDrop();

        if(this.modal) {
          this.modal.destroy();
        }

        this.modal = null;
      };

      proto.disableBackDrop = function() {
        $document.off('click');
      };

      proto.showSession = function() {
        var self = this;
        this.disableBackDrop();

        $timeout(function() {
          $scope.idle.template = AV_UI_IDLE.TEMPLATES.SESSION;
          $scope.idle.onSessionInactive = self.onSessionInactive;
        }, 0, true);

      };

      proto.onSessionInactive = function() {
        $rootScope.$broadcast(AV_IDLE.EVENTS.SESSION_TIMEOUT_INACTIVE);
      };

      return new AvIdleNotifier();

    };

  });

  availity.ui.run(function(avIdleNotifier) {
    avIdleNotifier.init();
  });

})(window);

//# sourceMappingURL=maps/availity-angular-ui.js.map