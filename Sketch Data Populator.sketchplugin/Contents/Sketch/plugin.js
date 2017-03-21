var __globals = this;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var t = require('typical');

/**
 * @module array-back
 * @example
 * var arrayify = require("array-back")
 */
module.exports = arrayify;

/**
 * Takes any input and guarantees an array back.
 *
 * - converts array-like objects (e.g. `arguments`) to a real array
 * - converts `undefined` to an empty array
 * - converts any another other, singular value (including `null`) into an array containing that value
 * - ignores input which is already an array
 *
 * @param {*} - the input value to convert to an array
 * @returns {Array}
 * @alias module:array-back
 * @example
 * > a.arrayify(undefined)
 * []
 *
 * > a.arrayify(null)
 * [ null ]
 *
 * > a.arrayify(0)
 * [ 0 ]
 *
 * > a.arrayify([ 1, 2 ])
 * [ 1, 2 ]
 *
 * > function f(){ return a.arrayify(arguments); }
 * > f(1,2,3)
 * [ 1, 2, 3 ]
 */
function arrayify(input) {
  if (input === undefined) {
    return [];
  } else if (t.isArrayLike(input)) {
    return Array.prototype.slice.call(input);
  } else {
    return Array.isArray(input) ? input : [input];
  }
}

},{"typical":69}],2:[function(require,module,exports){
(function (process){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var arrayify = require('array-back');
var option = require('./option');
var findReplace = require('find-replace');

var Argv = function () {
  function Argv(argv) {
    _classCallCheck(this, Argv);

    if (argv) {
      argv = arrayify(argv);
    } else {
      argv = process.argv.slice(0);
      argv.splice(0, 2);
    }

    this.list = argv;
  }

  _createClass(Argv, [{
    key: 'clear',
    value: function clear() {
      this.list.length = 0;
    }
  }, {
    key: 'expandOptionEqualsNotation',
    value: function expandOptionEqualsNotation() {
      var _this = this;

      var optEquals = option.optEquals;
      if (this.list.some(optEquals.test.bind(optEquals))) {
        (function () {
          var expandedArgs = [];
          _this.list.forEach(function (arg) {
            var matches = arg.match(optEquals.re);
            if (matches) {
              expandedArgs.push(matches[1], option.VALUE_MARKER + matches[2]);
            } else {
              expandedArgs.push(arg);
            }
          });
          _this.clear();
          _this.list = expandedArgs;
        })();
      }
    }
  }, {
    key: 'expandGetoptNotation',
    value: function expandGetoptNotation() {
      var combinedArg = option.combined;
      var hasGetopt = this.list.some(combinedArg.test.bind(combinedArg));
      if (hasGetopt) {
        findReplace(this.list, combinedArg.re, function (arg) {
          arg = arg.slice(1);
          return arg.split('').map(function (letter) {
            return '-' + letter;
          });
        });
      }
    }
  }, {
    key: 'validate',
    value: function validate(definitions) {
      var invalidOption = void 0;

      var optionWithoutDefinition = this.list.filter(function (arg) {
        return option.isOption(arg);
      }).some(function (arg) {
        if (definitions.get(arg) === undefined) {
          invalidOption = arg;
          return true;
        }
      });
      if (optionWithoutDefinition) {
        halt('UNKNOWN_OPTION', 'Unknown option: ' + invalidOption);
      }
    }
  }]);

  return Argv;
}();

function halt(name, message) {
  var err = new Error(message);
  err.name = name;
  throw err;
}

module.exports = Argv;

}).call(this,require('_process'))
},{"./option":6,"_process":67,"array-back":1,"find-replace":14}],3:[function(require,module,exports){
'use strict';

var arrayify = require('array-back');
var Definitions = require('./definitions');
var option = require('./option');
var t = require('typical');
var Argv = require('./argv');

module.exports = commandLineArgs;

function commandLineArgs(definitions, argv) {
  definitions = new Definitions(definitions);
  argv = new Argv(argv);
  argv.expandOptionEqualsNotation();
  argv.expandGetoptNotation();
  argv.validate(definitions);

  var output = definitions.createOutput();
  var def = void 0;

  argv.list.forEach(function (item) {
    if (option.isOption(item)) {
      def = definitions.get(item);
      if (!t.isDefined(output[def.name])) outputSet(output, def.name, def.getInitialValue());
      if (def.isBoolean()) {
        outputSet(output, def.name, true);
        def = null;
      }
    } else {
      var reBeginsWithValueMarker = new RegExp('^' + option.VALUE_MARKER);
      var value = reBeginsWithValueMarker.test(item) ? item.replace(reBeginsWithValueMarker, '') : item;
      if (!def) {
        def = definitions.getDefault();
        if (!def) return;
        if (!t.isDefined(output[def.name])) outputSet(output, def.name, def.getInitialValue());
      }

      var outputValue = def.type ? def.type(value) : value;
      outputSet(output, def.name, outputValue);

      if (!def.multiple) def = null;
    }
  });

  for (var key in output) {
    var value = output[key];
    if (Array.isArray(value) && value._initial) delete value._initial;
  }

  if (definitions.isGrouped()) {
    return groupOutput(definitions, output);
  } else {
    return output;
  }
}

function outputSet(output, property, value) {
  if (output[property] && output[property]._initial) {
    output[property] = [];
    delete output[property]._initial;
  }
  if (Array.isArray(output[property])) {
    output[property].push(value);
  } else {
    output[property] = value;
  }
}

function groupOutput(definitions, output) {
  var grouped = {
    _all: output
  };

  definitions.whereGrouped().forEach(function (def) {
    arrayify(def.group).forEach(function (groupName) {
      grouped[groupName] = grouped[groupName] || {};
      if (t.isDefined(output[def.name])) {
        grouped[groupName][def.name] = output[def.name];
      }
    });
  });

  definitions.whereNotGrouped().forEach(function (def) {
    if (t.isDefined(output[def.name])) {
      if (!grouped._none) grouped._none = {};
      grouped._none[def.name] = output[def.name];
    }
  });
  return grouped;
}

},{"./argv":2,"./definitions":5,"./option":6,"array-back":1,"typical":69}],4:[function(require,module,exports){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var t = require('typical');

var OptionDefinition = function () {
  function OptionDefinition(definition) {
    _classCallCheck(this, OptionDefinition);

    this.name = definition.name;

    this.type = definition.type;

    this.alias = definition.alias;

    this.multiple = definition.multiple;

    this.defaultOption = definition.defaultOption;

    this.defaultValue = definition.defaultValue;

    this.group = definition.group;

    for (var prop in definition) {
      if (!this[prop]) this[prop] = definition[prop];
    }
  }

  _createClass(OptionDefinition, [{
    key: 'getInitialValue',
    value: function getInitialValue() {
      if (this.multiple) {
        return [];
      } else if (this.isBoolean() || !this.type) {
        return true;
      } else {
        return null;
      }
    }
  }, {
    key: 'isBoolean',
    value: function isBoolean() {
      if (this.type) {
        return this.type === Boolean || t.isFunction(this.type) && this.type.name === 'Boolean';
      } else {
        return false;
      }
    }
  }]);

  return OptionDefinition;
}();

module.exports = OptionDefinition;

},{"typical":69}],5:[function(require,module,exports){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var arrayify = require('array-back');
var option = require('./option');
var Definition = require('./definition');
var t = require('typical');

var Definitions = function () {
  function Definitions(definitions) {
    var _this = this;

    _classCallCheck(this, Definitions);

    this.list = [];
    arrayify(definitions).forEach(function (def) {
      return _this.list.push(new Definition(def));
    });
    this.validate();
  }

  _createClass(Definitions, [{
    key: 'validate',
    value: function validate(argv) {
      var someHaveNoName = this.list.some(function (def) {
        return !def.name;
      });
      if (someHaveNoName) {
        halt('NAME_MISSING', 'Invalid option definitions: the `name` property is required on each definition');
      }

      var someDontHaveFunctionType = this.list.some(function (def) {
        return def.type && typeof def.type !== 'function';
      });
      if (someDontHaveFunctionType) {
        halt('INVALID_TYPE', 'Invalid option definitions: the `type` property must be a setter fuction (default: `Boolean`)');
      }

      var invalidOption = void 0;

      var numericAlias = this.list.some(function (def) {
        invalidOption = def;
        return t.isDefined(def.alias) && t.isNumber(def.alias);
      });
      if (numericAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: to avoid ambiguity an alias cannot be numeric [--' + invalidOption.name + ' alias is -' + invalidOption.alias + ']');
      }

      var multiCharacterAlias = this.list.some(function (def) {
        invalidOption = def;
        return t.isDefined(def.alias) && def.alias.length !== 1;
      });
      if (multiCharacterAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: an alias must be a single character');
      }

      var hypenAlias = this.list.some(function (def) {
        invalidOption = def;
        return def.alias === '-';
      });
      if (hypenAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: an alias cannot be "-"');
      }

      var duplicateName = hasDuplicates(this.list.map(function (def) {
        return def.name;
      }));
      if (duplicateName) {
        halt('DUPLICATE_NAME', 'Two or more option definitions have the same name');
      }

      var duplicateAlias = hasDuplicates(this.list.map(function (def) {
        return def.alias;
      }));
      if (duplicateAlias) {
        halt('DUPLICATE_ALIAS', 'Two or more option definitions have the same alias');
      }

      var duplicateDefaultOption = hasDuplicates(this.list.map(function (def) {
        return def.defaultOption;
      }));
      if (duplicateDefaultOption) {
        halt('DUPLICATE_DEFAULT_OPTION', 'Only one option definition can be the defaultOption');
      }
    }
  }, {
    key: 'createOutput',
    value: function createOutput() {
      var output = {};
      this.list.forEach(function (def) {
        if (t.isDefined(def.defaultValue)) output[def.name] = def.defaultValue;
        if (Array.isArray(output[def.name])) {
          output[def.name]._initial = true;
        }
      });
      return output;
    }
  }, {
    key: 'get',
    value: function get(arg) {
      return option.short.test(arg) ? this.list.find(function (def) {
        return def.alias === option.short.name(arg);
      }) : this.list.find(function (def) {
        return def.name === option.long.name(arg);
      });
    }
  }, {
    key: 'getDefault',
    value: function getDefault() {
      return this.list.find(function (def) {
        return def.defaultOption === true;
      });
    }
  }, {
    key: 'isGrouped',
    value: function isGrouped() {
      return this.list.some(function (def) {
        return def.group;
      });
    }
  }, {
    key: 'whereGrouped',
    value: function whereGrouped() {
      return this.list.filter(containsValidGroup);
    }
  }, {
    key: 'whereNotGrouped',
    value: function whereNotGrouped() {
      return this.list.filter(function (def) {
        return !containsValidGroup(def);
      });
    }
  }]);

  return Definitions;
}();

function halt(name, message) {
  var err = new Error(message);
  err.name = name;
  throw err;
}

function containsValidGroup(def) {
  return arrayify(def.group).some(function (group) {
    return group;
  });
}

function hasDuplicates(array) {
  var items = {};
  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    if (items[value]) {
      return true;
    } else {
      if (t.isDefined(value)) items[value] = true;
    }
  }
}

module.exports = Definitions;

},{"./definition":4,"./option":6,"array-back":1,"typical":69}],6:[function(require,module,exports){
'use strict';

var _createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
    }
  }return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

var Arg = function () {
  function Arg(re) {
    _classCallCheck(this, Arg);

    this.re = re;
  }

  _createClass(Arg, [{
    key: 'name',
    value: function name(arg) {
      return arg.match(this.re)[1];
    }
  }, {
    key: 'test',
    value: function test(arg) {
      return this.re.test(arg);
    }
  }]);

  return Arg;
}();

var option = {
  short: new Arg(/^-([^\d-])$/),
  long: new Arg(/^--(\S+)/),
  combined: new Arg(/^-([^\d-]{2,})$/),
  isOption: function isOption(arg) {
    return this.short.test(arg) || this.long.test(arg);
  },

  optEquals: new Arg(/^(--\S+?)=(.*)/),
  VALUE_MARKER: '552f3a31-14cd-4ced-bd67-656a659e9efb' };

module.exports = option;

},{}],7:[function(require,module,exports){
'use strict';

var detect = require('feature-detect-es6');

if (detect.all('class', 'arrowFunction')) {
  module.exports = require('./src/lib/command-line-args');
} else {
  module.exports = require('./es5/lib/command-line-args');
}

/* for node 0.12 */
if (!Array.prototype.find) {
  Object.defineProperty(Array.prototype, 'find', {
    value: function value(predicate) {
      'use strict';

      if (this == null) {
        throw new TypeError('Array.prototype.find called on null or undefined');
      }
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }
      var list = Object(this);
      var length = list.length >>> 0;
      var thisArg = arguments[1];
      var value;

      for (var i = 0; i < length; i++) {
        value = list[i];
        if (predicate.call(thisArg, value, i, list)) {
          return value;
        }
      }
      return undefined;
    }
  });
}

},{"./es5/lib/command-line-args":3,"./src/lib/command-line-args":9,"feature-detect-es6":13}],8:[function(require,module,exports){
(function (process){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var arrayify = require('array-back');
var option = require('./option');
var findReplace = require('find-replace');

/**
 * Handles parsing different argv notations
 *
 * @module argv
 * @private
 */

var Argv = function () {
  function Argv(argv) {
    _classCallCheck(this, Argv);

    if (argv) {
      argv = arrayify(argv);
    } else {
      /* if no argv supplied, assume we are parsing process.argv */
      argv = process.argv.slice(0);
      argv.splice(0, 2);
    }

    this.list = argv;
  }

  _createClass(Argv, [{
    key: 'clear',
    value: function clear() {
      this.list.length = 0;
    }

    /**
     * expand --option=value style args. The value is clearly marked to indicate it is definitely a value (which would otherwise be unclear if the value is `--value`, which would be parsed as an option). The special marker is removed in parsing phase.
     */

  }, {
    key: 'expandOptionEqualsNotation',
    value: function expandOptionEqualsNotation() {
      var _this = this;

      var optEquals = option.optEquals;
      if (this.list.some(optEquals.test.bind(optEquals))) {
        (function () {
          var expandedArgs = [];
          _this.list.forEach(function (arg) {
            var matches = arg.match(optEquals.re);
            if (matches) {
              expandedArgs.push(matches[1], option.VALUE_MARKER + matches[2]);
            } else {
              expandedArgs.push(arg);
            }
          });
          _this.clear();
          _this.list = expandedArgs;
        })();
      }
    }

    /**
     * expand getopt-style combined options
     */

  }, {
    key: 'expandGetoptNotation',
    value: function expandGetoptNotation() {
      var combinedArg = option.combined;
      var hasGetopt = this.list.some(combinedArg.test.bind(combinedArg));
      if (hasGetopt) {
        findReplace(this.list, combinedArg.re, function (arg) {
          arg = arg.slice(1);
          return arg.split('').map(function (letter) {
            return '-' + letter;
          });
        });
      }
    }

    /**
     * Inspect the user-supplied options for validation issues.
     * @throws `UNKNOWN_OPTION`
     */

  }, {
    key: 'validate',
    value: function validate(definitions) {
      var invalidOption = void 0;

      var optionWithoutDefinition = this.list.filter(function (arg) {
        return option.isOption(arg);
      }).some(function (arg) {
        if (definitions.get(arg) === undefined) {
          invalidOption = arg;
          return true;
        }
      });
      if (optionWithoutDefinition) {
        halt('UNKNOWN_OPTION', 'Unknown option: ' + invalidOption);
      }
    }
  }]);

  return Argv;
}();

function halt(name, message) {
  var err = new Error(message);
  err.name = name;
  throw err;
}

module.exports = Argv;

}).call(this,require('_process'))
},{"./option":12,"_process":67,"array-back":1,"find-replace":14}],9:[function(require,module,exports){
'use strict';

var arrayify = require('array-back');
var Definitions = require('./definitions');
var option = require('./option');
var t = require('typical');
var Argv = require('./argv');

/**
 * @module command-line-args
 */
module.exports = commandLineArgs;

/**
 * Returns an object containing all options set on the command line. By default it parses the global  [`process.argv`](https://nodejs.org/api/process.html#process_process_argv) array.
 *
 * @param {module:definition[]} - An array of [OptionDefinition](#exp_module_definition--OptionDefinition) objects
 * @param [argv] {string[]} - An array of strings, which if passed will be parsed instead  of `process.argv`.
 * @returns {object}
 * @throws `UNKNOWN_OPTION` if the user sets an option without a definition
 * @throws `NAME_MISSING` if an option definition is missing the required `name` property
 * @throws `INVALID_TYPE` if an option definition has a `type` value that's not a function
 * @throws `INVALID_ALIAS` if an alias is numeric, a hyphen or a length other than 1
 * @throws `DUPLICATE_NAME` if an option definition name was used more than once
 * @throws `DUPLICATE_ALIAS` if an option definition alias was used more than once
 * @throws `DUPLICATE_DEFAULT_OPTION` if more than one option definition has `defaultOption: true`
 * @alias module:command-line-args
 * @example
 * ```js
 * const commandLineArgs = require('command-line-args')
 * const options = commandLineArgs([
 *   { name: 'file' },
 *   { name: 'verbose' },
 *   { name: 'depth'}
 * ])
 * ```
 */
function commandLineArgs(definitions, argv) {
  definitions = new Definitions(definitions);
  argv = new Argv(argv);
  argv.expandOptionEqualsNotation();
  argv.expandGetoptNotation();
  argv.validate(definitions);

  /* create output initialised with default values */
  var output = definitions.createOutput();
  var def = void 0;

  /* walk argv building the output */
  argv.list.forEach(function (item) {
    if (option.isOption(item)) {
      def = definitions.get(item);
      if (!t.isDefined(output[def.name])) outputSet(output, def.name, def.getInitialValue());
      if (def.isBoolean()) {
        outputSet(output, def.name, true);
        def = null;
      }
    } else {
      /* if the value marker is present at the beginning, strip it */
      var reBeginsWithValueMarker = new RegExp('^' + option.VALUE_MARKER);
      var value = reBeginsWithValueMarker.test(item) ? item.replace(reBeginsWithValueMarker, '') : item;
      if (!def) {
        def = definitions.getDefault();
        if (!def) return;
        if (!t.isDefined(output[def.name])) outputSet(output, def.name, def.getInitialValue());
      }

      var outputValue = def.type ? def.type(value) : value;
      outputSet(output, def.name, outputValue);

      if (!def.multiple) def = null;
    }
  });

  /* clear _initial flags */
  for (var key in output) {
    var value = output[key];
    if (Array.isArray(value) && value._initial) delete value._initial;
  }

  /* group the output values */
  if (definitions.isGrouped()) {
    return groupOutput(definitions, output);
  } else {
    return output;
  }
}

function outputSet(output, property, value) {
  if (output[property] && output[property]._initial) {
    output[property] = [];
    delete output[property]._initial;
  }
  if (Array.isArray(output[property])) {
    output[property].push(value);
  } else {
    output[property] = value;
  }
}

function groupOutput(definitions, output) {
  var grouped = {
    _all: output
  };

  definitions.whereGrouped().forEach(function (def) {
    arrayify(def.group).forEach(function (groupName) {
      grouped[groupName] = grouped[groupName] || {};
      if (t.isDefined(output[def.name])) {
        grouped[groupName][def.name] = output[def.name];
      }
    });
  });

  definitions.whereNotGrouped().forEach(function (def) {
    if (t.isDefined(output[def.name])) {
      if (!grouped._none) grouped._none = {};
      grouped._none[def.name] = output[def.name];
    }
  });
  return grouped;
}

},{"./argv":8,"./definitions":11,"./option":12,"array-back":1,"typical":69}],10:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var t = require('typical');

/**
 * @module definition
 */

/**
 * Describes a command-line option. Additionally, you can add `description` and `typeLabel` propeties and make use of [command-line-usage](https://github.com/75lb/command-line-usage).
 * @alias module:definition
 * @typicalname option
 */

var OptionDefinition = function () {
  function OptionDefinition(definition) {
    _classCallCheck(this, OptionDefinition);

    /**
    * The only required definition property is `name`, so the simplest working example is
    * ```js
    * [
    *   { name: "file" },
    *   { name: "verbose" },
    *   { name: "depth"}
    * ]
    * ```
    *
    * In this case, the value of each option will be either a Boolean or string.
    *
    * | #   | Command line args | .parse() output |
    * | --- | -------------------- | ------------ |
    * | 1   | `--file` | `{ file: true }` |
    * | 2   | `--file lib.js --verbose` | `{ file: "lib.js", verbose: true }` |
    * | 3   | `--verbose very` | `{ verbose: "very" }` |
    * | 4   | `--depth 2` | `{ depth: "2" }` |
    *
    * Unicode option names and aliases are valid, for example:
    * ```js
    * [
    *   { name: 'один' },
    *   { name: '两' },
    *   { name: 'три', alias: 'т' }
    * ]
    * ```
    * @type {string}
    */
    this.name = definition.name;

    /**
    * The `type` value is a setter function (you receive the output from this), enabling you to be specific about the type and value received.
    *
    * You can use a class, if you like:
    *
    * ```js
    * const fs = require('fs')
    *
    * function FileDetails(filename){
    *   if (!(this instanceof FileDetails)) return new FileDetails(filename)
    *   this.filename = filename
    *   this.exists = fs.existsSync(filename)
    * }
    *
    * const cli = commandLineArgs([
    *   { name: 'file', type: FileDetails },
    *   { name: 'depth', type: Number }
    * ])
    * ```
    *
    * | #   | Command line args| .parse() output |
    * | --- | ----------------- | ------------ |
    * | 1   | `--file asdf.txt` | `{ file: { filename: 'asdf.txt', exists: false } }` |
    *
    * The `--depth` option expects a `Number`. If no value was set, you will receive `null`.
    *
    * | #   | Command line args | .parse() output |
    * | --- | ----------------- | ------------ |
    * | 2   | `--depth` | `{ depth: null }` |
    * | 3   | `--depth 2` | `{ depth: 2 }` |
    *
    * @type {function}
    */
    this.type = definition.type;

    /**
    * getopt-style short option names. Can be any single character (unicode included) except a digit or hypen.
    *
    * ```js
    * [
    *   { name: "hot", alias: "h", type: Boolean },
    *   { name: "discount", alias: "d", type: Boolean },
    *   { name: "courses", alias: "c" , type: Number }
    * ]
    * ```
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   | `-hcd` | `{ hot: true, courses: null, discount: true }` |
    * | 2   | `-hdc 3` | `{ hot: true, discount: true, courses: 3 }` |
    *
    * @type {string}
    */
    this.alias = definition.alias;

    /**
    * Set this flag if the option takes a list of values. You will receive an array of values, each passed through the `type` function (if specified).
    *
    * ```js
    * [
    *   { name: "files", type: String, multiple: true }
    * ]
    * ```
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   | `--files one.js two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 2   | `--files one.js --files two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 3   | `--files *` | `{ files: [ 'one.js', 'two.js' ] }` |
    *
    * @type {boolean}
    */
    this.multiple = definition.multiple;

    /**
    * Any unclaimed command-line args will be set on this option. This flag is typically set on the most commonly-used option to make for more concise usage (i.e. `$ myapp *.js` instead of `$ myapp --files *.js`).
    *
    * ```js
    * [
    *   { name: "files", type: String, multiple: true, defaultOption: true }
    * ]
    * ```
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   | `--files one.js two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 2   | `one.js two.js` | `{ files: [ 'one.js', 'two.js' ] }` |
    * | 3   | `*` | `{ files: [ 'one.js', 'two.js' ] }` |
    *
    * @type {boolean}
    */
    this.defaultOption = definition.defaultOption;

    /**
    * An initial value for the option.
    *
    * ```js
    * [
    *   { name: "files", type: String, multiple: true, defaultValue: [ "one.js" ] },
    *   { name: "max", type: Number, defaultValue: 3 }
    * ]
    * ```
    *
    * | #   | Command line | .parse() output |
    * | --- | ------------ | ------------ |
    * | 1   |  | `{ files: [ 'one.js' ], max: 3 }` |
    * | 2   | `--files two.js` | `{ files: [ 'two.js' ], max: 3 }` |
    * | 3   | `--max 4` | `{ files: [ 'one.js' ], max: 4 }` |
    *
    * @type {*}
    */
    this.defaultValue = definition.defaultValue;

    /**
    * When your app has a large amount of options it makes sense to organise them in groups.
    *
    * There are two automatic groups: `_all` (contains all options) and `_none` (contains options without a `group` specified in their definition).
    *
    * ```js
    * [
    *   { name: "verbose", group: "standard" },
    *   { name: "help", group: [ "standard", "main" ] },
    *   { name: "compress", group: [ "server", "main" ] },
    *   { name: "static", group: "server" },
    *   { name: "debug" }
    * ]
    * ```
    *
    *<table>
    *  <tr>
    *    <th>#</th><th>Command Line</th><th>.parse() output</th>
    *  </tr>
    *  <tr>
    *    <td>1</td><td><code>--verbose</code></td><td><pre><code>
    *{
    *  _all: { verbose: true },
    *  standard: { verbose: true }
    *}
    *</code></pre></td>
    *  </tr>
    *  <tr>
    *    <td>2</td><td><code>--debug</code></td><td><pre><code>
    *{
    *  _all: { debug: true },
    *  _none: { debug: true }
    *}
    *</code></pre></td>
    *  </tr>
    *  <tr>
    *    <td>3</td><td><code>--verbose --debug --compress</code></td><td><pre><code>
    *{
    *  _all: {
    *    verbose: true,
    *    debug: true,
    *    compress: true
    *  },
    *  standard: { verbose: true },
    *  server: { compress: true },
    *  main: { compress: true },
    *  _none: { debug: true }
    *}
    *</code></pre></td>
    *  </tr>
    *  <tr>
    *    <td>4</td><td><code>--compress</code></td><td><pre><code>
    *{
    *  _all: { compress: true },
    *  server: { compress: true },
    *  main: { compress: true }
    *}
    *</code></pre></td>
    *  </tr>
    *</table>
    *
    * @type {string|string[]}
    */
    this.group = definition.group;

    /* pick up any remaining properties */
    for (var prop in definition) {
      if (!this[prop]) this[prop] = definition[prop];
    }
  }

  _createClass(OptionDefinition, [{
    key: 'getInitialValue',
    value: function getInitialValue() {
      if (this.multiple) {
        return [];
      } else if (this.isBoolean() || !this.type) {
        return true;
      } else {
        return null;
      }
    }
  }, {
    key: 'isBoolean',
    value: function isBoolean() {
      if (this.type) {
        return this.type === Boolean || t.isFunction(this.type) && this.type.name === 'Boolean';
      } else {
        return false;
      }
    }
  }]);

  return OptionDefinition;
}();

module.exports = OptionDefinition;

},{"typical":69}],11:[function(require,module,exports){
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var arrayify = require('array-back');
var option = require('./option');
var Definition = require('./definition');
var t = require('typical');

/**
 * @module definitions
 * @private
 */

/**
 * @alias module:definitions
 */

var Definitions = function () {
  function Definitions(definitions) {
    var _this = this;

    _classCallCheck(this, Definitions);

    this.list = [];
    arrayify(definitions).forEach(function (def) {
      return _this.list.push(new Definition(def));
    });
    this.validate();
  }

  /**
   * validate option definitions
   * @returns {string}
   */


  _createClass(Definitions, [{
    key: 'validate',
    value: function validate(argv) {
      var someHaveNoName = this.list.some(function (def) {
        return !def.name;
      });
      if (someHaveNoName) {
        halt('NAME_MISSING', 'Invalid option definitions: the `name` property is required on each definition');
      }

      var someDontHaveFunctionType = this.list.some(function (def) {
        return def.type && typeof def.type !== 'function';
      });
      if (someDontHaveFunctionType) {
        halt('INVALID_TYPE', 'Invalid option definitions: the `type` property must be a setter fuction (default: `Boolean`)');
      }

      var invalidOption = void 0;

      var numericAlias = this.list.some(function (def) {
        invalidOption = def;
        return t.isDefined(def.alias) && t.isNumber(def.alias);
      });
      if (numericAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: to avoid ambiguity an alias cannot be numeric [--' + invalidOption.name + ' alias is -' + invalidOption.alias + ']');
      }

      var multiCharacterAlias = this.list.some(function (def) {
        invalidOption = def;
        return t.isDefined(def.alias) && def.alias.length !== 1;
      });
      if (multiCharacterAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: an alias must be a single character');
      }

      var hypenAlias = this.list.some(function (def) {
        invalidOption = def;
        return def.alias === '-';
      });
      if (hypenAlias) {
        halt('INVALID_ALIAS', 'Invalid option definition: an alias cannot be "-"');
      }

      var duplicateName = hasDuplicates(this.list.map(function (def) {
        return def.name;
      }));
      if (duplicateName) {
        halt('DUPLICATE_NAME', 'Two or more option definitions have the same name');
      }

      var duplicateAlias = hasDuplicates(this.list.map(function (def) {
        return def.alias;
      }));
      if (duplicateAlias) {
        halt('DUPLICATE_ALIAS', 'Two or more option definitions have the same alias');
      }

      var duplicateDefaultOption = hasDuplicates(this.list.map(function (def) {
        return def.defaultOption;
      }));
      if (duplicateDefaultOption) {
        halt('DUPLICATE_DEFAULT_OPTION', 'Only one option definition can be the defaultOption');
      }
    }

    /**
     * Initialise .parse() output object.
     * @returns {object}
     */

  }, {
    key: 'createOutput',
    value: function createOutput() {
      var output = {};
      this.list.forEach(function (def) {
        if (t.isDefined(def.defaultValue)) output[def.name] = def.defaultValue;
        if (Array.isArray(output[def.name])) {
          output[def.name]._initial = true;
        }
      });
      return output;
    }

    /**
     * @param {string}
     * @returns {Definition}
     */

  }, {
    key: 'get',
    value: function get(arg) {
      return option.short.test(arg) ? this.list.find(function (def) {
        return def.alias === option.short.name(arg);
      }) : this.list.find(function (def) {
        return def.name === option.long.name(arg);
      });
    }
  }, {
    key: 'getDefault',
    value: function getDefault() {
      return this.list.find(function (def) {
        return def.defaultOption === true;
      });
    }
  }, {
    key: 'isGrouped',
    value: function isGrouped() {
      return this.list.some(function (def) {
        return def.group;
      });
    }
  }, {
    key: 'whereGrouped',
    value: function whereGrouped() {
      return this.list.filter(containsValidGroup);
    }
  }, {
    key: 'whereNotGrouped',
    value: function whereNotGrouped() {
      return this.list.filter(function (def) {
        return !containsValidGroup(def);
      });
    }
  }]);

  return Definitions;
}();

function halt(name, message) {
  var err = new Error(message);
  err.name = name;
  throw err;
}

function containsValidGroup(def) {
  return arrayify(def.group).some(function (group) {
    return group;
  });
}

function hasDuplicates(array) {
  var items = {};
  for (var i = 0; i < array.length; i++) {
    var value = array[i];
    if (items[value]) {
      return true;
    } else {
      if (t.isDefined(value)) items[value] = true;
    }
  }
}

module.exports = Definitions;

},{"./definition":10,"./option":12,"array-back":1,"typical":69}],12:[function(require,module,exports){
'use strict';

/**
 * A module for testing for and extracting names from options (e.g. `--one`, `-o`)
 *
 * @module option
 * @private
 */

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Arg = function () {
  function Arg(re) {
    _classCallCheck(this, Arg);

    this.re = re;
  }

  _createClass(Arg, [{
    key: 'name',
    value: function name(arg) {
      return arg.match(this.re)[1];
    }
  }, {
    key: 'test',
    value: function test(arg) {
      return this.re.test(arg);
    }
  }]);

  return Arg;
}();

var option = {
  short: new Arg(/^-([^\d-])$/),
  long: new Arg(/^--(\S+)/),
  combined: new Arg(/^-([^\d-]{2,})$/),
  isOption: function isOption(arg) {
    return this.short.test(arg) || this.long.test(arg);
  },

  optEquals: new Arg(/^(--\S+?)=(.*)/),
  VALUE_MARKER: '552f3a31-14cd-4ced-bd67-656a659e9efb' // must be unique
};

module.exports = option;

},{}],13:[function(require,module,exports){
'use strict';

var arrayify = require('array-back');

/**
 * Detect which ES2015 features are available.
 *
 * @module feature-detect-es6
 * @typicalname detect
 * @example
 * var detect = require('feature-detect-es6')
 *
 * if (detect.all('class', 'spread', 'let', 'arrowFunction')){
 *   // safe to run ES6 code natively..
 * } else {
 *   // run your transpiled ES5..
 * }
 */

/**
 * Returns true if the `class` statement is available.
 *
 * @returns {boolean}
 */
exports.class = function () {
  return evaluates('class Something {}');
};

/**
 * Returns true if the arrow functions available.
 *
 * @returns {boolean}
 */
exports.arrowFunction = function () {
  return evaluates('var f = x => 1');
};

/**
 * Returns true if the `let` statement is available.
 *
 * @returns {boolean}
 */
exports.let = function () {
  return evaluates('let a = 1');
};

/**
 * Returns true if the `const` statement is available.
 *
 * @returns {boolean}
 */
exports.const = function () {
  return evaluates('const a = 1');
};

/**
 * Returns true if the [new Array features](http://exploringjs.com/es6/ch_arrays.html) are available (exluding `Array.prototype.values` which has zero support anywhere).
 *
 * @returns {boolean}
 */
exports.newArrayFeatures = function () {
  return typeof Array.prototype.find !== 'undefined' && typeof Array.prototype.findIndex !== 'undefined' && typeof Array.from !== 'undefined' && typeof Array.of !== 'undefined' && typeof Array.prototype.entries !== 'undefined' && typeof Array.prototype.keys !== 'undefined' && typeof Array.prototype.copyWithin !== 'undefined' && typeof Array.prototype.fill !== 'undefined';
};

/**
 * Returns true if `Map`, `WeakMap`, `Set` and `WeakSet` are available.
 *
 * @returns {boolean}
 */
exports.collections = function () {
  return typeof Map !== 'undefined' && typeof WeakMap !== 'undefined' && typeof Set !== 'undefined' && typeof WeakSet !== 'undefined';
};

/**
 * Returns true if generators are available.
 *
 * @returns {boolean}
 */
exports.generators = function () {
  return evaluates('function* test() {}');
};

/**
 * Returns true if `Promise` is available.
 *
 * @returns {boolean}
 */
exports.promises = function () {
  return typeof Promise !== 'undefined';
};

/**
 * Returns true if template strings are available.
 *
 * @returns {boolean}
 */
exports.templateStrings = function () {
  return evaluates('var a = `a`');
};

/**
 * Returns true if `Symbol` is available.
 *
 * @returns {boolean}
 */
exports.symbols = function () {
  return typeof Symbol !== 'undefined';
};

/**
 * Returns true if destructuring is available.
 *
 * @returns {boolean}
 */
exports.destructuring = function () {
  return evaluates("var { first: f, last: l } = { first: 'Jane', last: 'Doe' }");
};

/**
 * Returns true if the spread operator (`...`) is available.
 *
 * @returns {boolean}
 */
exports.spread = function () {
  return evaluates('Math.max(...[ 5, 10 ])');
};

/**
 * Returns true if default parameter values are available.
 *
 * @returns {boolean}
 */
exports.defaultParamValues = function () {
  return evaluates('function test (one = 1) {}');
};

function evaluates(statement) {
  try {
    eval(statement);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Returns true if *all* specified features are detected.
 *
 * @returns {boolean}
 * @param [...feature] {string} - the features to detect.
 * @example
 * var result = detect.all('class', 'spread', 'let', 'arrowFunction')
 */
exports.all = function () {
  return arrayify(arguments).every(function (testName) {
    var method = exports[testName];
    if (method && typeof method === 'function') {
      return method();
    } else {
      throw new Error('no detection available by this name: ' + testName);
    }
  });
};

},{"array-back":1}],14:[function(require,module,exports){
'use strict';

var arrayify = require('array-back');
var testValue = require('test-value');

/**
 * Find and either replace or remove items from an array.
 *
 * @module find-replace
 * @example
 * > findReplace = require('find-replace')
 *
 * > findReplace([ 1, 2, 3], 2, 'two')
 * [ 1, 'two', 3 ]
 *
 * > findReplace([ 1, 2, 3], 2, [ 'two', 'zwei' ])
 * [ 1, [ 'two', 'zwei' ], 3 ]
 *
 * > findReplace([ 1, 2, 3], 2, 'two', 'zwei')
 * [ 1, 'two', 'zwei', 3 ]
 *
 * > findReplace([ 1, 2, 3], 2) // no replacement, so remove
 * [ 1, 3 ]
 */
module.exports = findReplace;

/**
 * @param {array} - the input array
 * @param {valueTest} - a [test-value](https://github.com/75lb/test-value) query to match the value you're looking for
 * @param [replaceWith] {...any} - If specified, found values will be replaced with these values, else  removed.
 * @returns {array}
 * @alias module:find-replace
 */
function findReplace(array, valueTest) {
  var found = [];
  var replaceWiths = arrayify(arguments);
  replaceWiths.splice(0, 2);

  arrayify(array).forEach(function (value, index) {
    var expanded = [];
    replaceWiths.forEach(function (replaceWith) {
      if (typeof replaceWith === 'function') {
        expanded = expanded.concat(replaceWith(value));
      } else {
        expanded.push(replaceWith);
      }
    });

    if (testValue(value, valueTest)) {
      found.push({
        index: index,
        replaceWithValue: expanded
      });
    }
  });

  found.reverse().forEach(function (item) {
    var spliceArgs = [item.index, 1].concat(item.replaceWithValue);
    array.splice.apply(array, spliceArgs);
  });

  return array;
}

},{"array-back":1,"test-value":68}],15:[function(require,module,exports){
'use strict';

var hashClear = require('./_hashClear'),
    hashDelete = require('./_hashDelete'),
    hashGet = require('./_hashGet'),
    hashHas = require('./_hashHas'),
    hashSet = require('./_hashSet');

/**
 * Creates a hash object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function Hash(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `Hash`.
Hash.prototype.clear = hashClear;
Hash.prototype['delete'] = hashDelete;
Hash.prototype.get = hashGet;
Hash.prototype.has = hashHas;
Hash.prototype.set = hashSet;

module.exports = Hash;

},{"./_hashClear":33,"./_hashDelete":34,"./_hashGet":35,"./_hashHas":36,"./_hashSet":37}],16:[function(require,module,exports){
'use strict';

var listCacheClear = require('./_listCacheClear'),
    listCacheDelete = require('./_listCacheDelete'),
    listCacheGet = require('./_listCacheGet'),
    listCacheHas = require('./_listCacheHas'),
    listCacheSet = require('./_listCacheSet');

/**
 * Creates an list cache object.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function ListCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `ListCache`.
ListCache.prototype.clear = listCacheClear;
ListCache.prototype['delete'] = listCacheDelete;
ListCache.prototype.get = listCacheGet;
ListCache.prototype.has = listCacheHas;
ListCache.prototype.set = listCacheSet;

module.exports = ListCache;

},{"./_listCacheClear":41,"./_listCacheDelete":42,"./_listCacheGet":43,"./_listCacheHas":44,"./_listCacheSet":45}],17:[function(require,module,exports){
'use strict';

var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;

},{"./_getNative":30,"./_root":54}],18:[function(require,module,exports){
'use strict';

var mapCacheClear = require('./_mapCacheClear'),
    mapCacheDelete = require('./_mapCacheDelete'),
    mapCacheGet = require('./_mapCacheGet'),
    mapCacheHas = require('./_mapCacheHas'),
    mapCacheSet = require('./_mapCacheSet');

/**
 * Creates a map cache object to store key-value pairs.
 *
 * @private
 * @constructor
 * @param {Array} [entries] The key-value pairs to cache.
 */
function MapCache(entries) {
    var index = -1,
        length = entries == null ? 0 : entries.length;

    this.clear();
    while (++index < length) {
        var entry = entries[index];
        this.set(entry[0], entry[1]);
    }
}

// Add methods to `MapCache`.
MapCache.prototype.clear = mapCacheClear;
MapCache.prototype['delete'] = mapCacheDelete;
MapCache.prototype.get = mapCacheGet;
MapCache.prototype.has = mapCacheHas;
MapCache.prototype.set = mapCacheSet;

module.exports = MapCache;

},{"./_mapCacheClear":46,"./_mapCacheDelete":47,"./_mapCacheGet":48,"./_mapCacheHas":49,"./_mapCacheSet":50}],19:[function(require,module,exports){
'use strict';

var root = require('./_root');

/** Built-in value references. */
var _Symbol = root.Symbol;

module.exports = _Symbol;

},{"./_root":54}],20:[function(require,module,exports){
"use strict";

/**
 * A specialized version of `_.map` for arrays without support for iteratee
 * shorthands.
 *
 * @private
 * @param {Array} [array] The array to iterate over.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the new mapped array.
 */
function arrayMap(array, iteratee) {
  var index = -1,
      length = array == null ? 0 : array.length,
      result = Array(length);

  while (++index < length) {
    result[index] = iteratee(array[index], index, array);
  }
  return result;
}

module.exports = arrayMap;

},{}],21:[function(require,module,exports){
'use strict';

var eq = require('./eq');

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to inspect.
 * @param {*} key The key to search for.
 * @returns {number} Returns the index of the matched value, else `-1`.
 */
function assocIndexOf(array, key) {
  var length = array.length;
  while (length--) {
    if (eq(array[length][0], key)) {
      return length;
    }
  }
  return -1;
}

module.exports = assocIndexOf;

},{"./eq":58}],22:[function(require,module,exports){
'use strict';

var castPath = require('./_castPath'),
    toKey = require('./_toKey');

/**
 * The base implementation of `_.get` without support for default values.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @returns {*} Returns the resolved value.
 */
function baseGet(object, path) {
  path = castPath(path, object);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return index && index == length ? object : undefined;
}

module.exports = baseGet;

},{"./_castPath":26,"./_toKey":56}],23:[function(require,module,exports){
'use strict';

var _Symbol = require('./_Symbol'),
    getRawTag = require('./_getRawTag'),
    objectToString = require('./_objectToString');

/** `Object#toString` result references. */
var nullTag = '[object Null]',
    undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
    if (value == null) {
        return value === undefined ? undefinedTag : nullTag;
    }
    return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}

module.exports = baseGetTag;

},{"./_Symbol":19,"./_getRawTag":31,"./_objectToString":53}],24:[function(require,module,exports){
'use strict';

var isFunction = require('./isFunction'),
    isMasked = require('./_isMasked'),
    isObject = require('./isObject'),
    toSource = require('./_toSource');

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype,
    objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' + funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject(value) || isMasked(value)) {
    return false;
  }
  var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = baseIsNative;

},{"./_isMasked":40,"./_toSource":57,"./isFunction":61,"./isObject":62}],25:[function(require,module,exports){
'use strict';

var _Symbol = require('./_Symbol'),
    arrayMap = require('./_arrayMap'),
    isArray = require('./isArray'),
    isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/** Used to convert symbols to primitives and strings. */
var symbolProto = _Symbol ? _Symbol.prototype : undefined,
    symbolToString = symbolProto ? symbolProto.toString : undefined;

/**
 * The base implementation of `_.toString` which doesn't convert nullish
 * values to empty strings.
 *
 * @private
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
 */
function baseToString(value) {
  // Exit early for strings to avoid a performance hit in some environments.
  if (typeof value == 'string') {
    return value;
  }
  if (isArray(value)) {
    // Recursively convert values (susceptible to call stack limits).
    return arrayMap(value, baseToString) + '';
  }
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = value + '';
  return result == '0' && 1 / value == -INFINITY ? '-0' : result;
}

module.exports = baseToString;

},{"./_Symbol":19,"./_arrayMap":20,"./isArray":60,"./isSymbol":64}],26:[function(require,module,exports){
'use strict';

var isArray = require('./isArray'),
    isKey = require('./_isKey'),
    stringToPath = require('./_stringToPath'),
    toString = require('./toString');

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @param {Object} [object] The object to query keys on.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value, object) {
  if (isArray(value)) {
    return value;
  }
  return isKey(value, object) ? [value] : stringToPath(toString(value));
}

module.exports = castPath;

},{"./_isKey":38,"./_stringToPath":55,"./isArray":60,"./toString":66}],27:[function(require,module,exports){
'use strict';

var root = require('./_root');

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

module.exports = coreJsData;

},{"./_root":54}],28:[function(require,module,exports){
(function (global){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/** Detect free variable `global` from Node.js. */
var freeGlobal = (typeof global === 'undefined' ? 'undefined' : _typeof(global)) == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],29:[function(require,module,exports){
'use strict';

var isKeyable = require('./_isKeyable');

/**
 * Gets the data for `map`.
 *
 * @private
 * @param {Object} map The map to query.
 * @param {string} key The reference key.
 * @returns {*} Returns the map data.
 */
function getMapData(map, key) {
  var data = map.__data__;
  return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
}

module.exports = getMapData;

},{"./_isKeyable":39}],30:[function(require,module,exports){
'use strict';

var baseIsNative = require('./_baseIsNative'),
    getValue = require('./_getValue');

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = getValue(object, key);
  return baseIsNative(value) ? value : undefined;
}

module.exports = getNative;

},{"./_baseIsNative":24,"./_getValue":32}],31:[function(require,module,exports){
'use strict';

var _Symbol = require('./_Symbol');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag),
      tag = value[symToStringTag];

  try {
    value[symToStringTag] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag] = tag;
    } else {
      delete value[symToStringTag];
    }
  }
  return result;
}

module.exports = getRawTag;

},{"./_Symbol":19}],32:[function(require,module,exports){
"use strict";

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

module.exports = getValue;

},{}],33:[function(require,module,exports){
'use strict';

var nativeCreate = require('./_nativeCreate');

/**
 * Removes all key-value entries from the hash.
 *
 * @private
 * @name clear
 * @memberOf Hash
 */
function hashClear() {
  this.__data__ = nativeCreate ? nativeCreate(null) : {};
  this.size = 0;
}

module.exports = hashClear;

},{"./_nativeCreate":52}],34:[function(require,module,exports){
"use strict";

/**
 * Removes `key` and its value from the hash.
 *
 * @private
 * @name delete
 * @memberOf Hash
 * @param {Object} hash The hash to modify.
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function hashDelete(key) {
  var result = this.has(key) && delete this.__data__[key];
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = hashDelete;

},{}],35:[function(require,module,exports){
'use strict';

var nativeCreate = require('./_nativeCreate');

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Gets the hash value for `key`.
 *
 * @private
 * @name get
 * @memberOf Hash
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function hashGet(key) {
  var data = this.__data__;
  if (nativeCreate) {
    var result = data[key];
    return result === HASH_UNDEFINED ? undefined : result;
  }
  return hasOwnProperty.call(data, key) ? data[key] : undefined;
}

module.exports = hashGet;

},{"./_nativeCreate":52}],36:[function(require,module,exports){
'use strict';

var nativeCreate = require('./_nativeCreate');

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Checks if a hash value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf Hash
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function hashHas(key) {
  var data = this.__data__;
  return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
}

module.exports = hashHas;

},{"./_nativeCreate":52}],37:[function(require,module,exports){
'use strict';

var nativeCreate = require('./_nativeCreate');

/** Used to stand-in for `undefined` hash values. */
var HASH_UNDEFINED = '__lodash_hash_undefined__';

/**
 * Sets the hash `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf Hash
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the hash instance.
 */
function hashSet(key, value) {
  var data = this.__data__;
  this.size += this.has(key) ? 0 : 1;
  data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
  return this;
}

module.exports = hashSet;

},{"./_nativeCreate":52}],38:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var isArray = require('./isArray'),
    isSymbol = require('./isSymbol');

/** Used to match property names within property paths. */
var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
    reIsPlainProp = /^\w*$/;

/**
 * Checks if `value` is a property name and not a property path.
 *
 * @private
 * @param {*} value The value to check.
 * @param {Object} [object] The object to query keys on.
 * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
 */
function isKey(value, object) {
  if (isArray(value)) {
    return false;
  }
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol(value)) {
    return true;
  }
  return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
}

module.exports = isKey;

},{"./isArray":60,"./isSymbol":64}],39:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Checks if `value` is suitable for use as unique object key.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
 */
function isKeyable(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
}

module.exports = isKeyable;

},{}],40:[function(require,module,exports){
'use strict';

var coreJsData = require('./_coreJsData');

/** Used to detect methods masquerading as native. */
var maskSrcKey = function () {
  var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
  return uid ? 'Symbol(src)_1.' + uid : '';
}();

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && maskSrcKey in func;
}

module.exports = isMasked;

},{"./_coreJsData":27}],41:[function(require,module,exports){
"use strict";

/**
 * Removes all key-value entries from the list cache.
 *
 * @private
 * @name clear
 * @memberOf ListCache
 */
function listCacheClear() {
  this.__data__ = [];
  this.size = 0;
}

module.exports = listCacheClear;

},{}],42:[function(require,module,exports){
'use strict';

var assocIndexOf = require('./_assocIndexOf');

/** Used for built-in method references. */
var arrayProto = Array.prototype;

/** Built-in value references. */
var splice = arrayProto.splice;

/**
 * Removes `key` and its value from the list cache.
 *
 * @private
 * @name delete
 * @memberOf ListCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function listCacheDelete(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    return false;
  }
  var lastIndex = data.length - 1;
  if (index == lastIndex) {
    data.pop();
  } else {
    splice.call(data, index, 1);
  }
  --this.size;
  return true;
}

module.exports = listCacheDelete;

},{"./_assocIndexOf":21}],43:[function(require,module,exports){
'use strict';

var assocIndexOf = require('./_assocIndexOf');

/**
 * Gets the list cache value for `key`.
 *
 * @private
 * @name get
 * @memberOf ListCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function listCacheGet(key) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  return index < 0 ? undefined : data[index][1];
}

module.exports = listCacheGet;

},{"./_assocIndexOf":21}],44:[function(require,module,exports){
'use strict';

var assocIndexOf = require('./_assocIndexOf');

/**
 * Checks if a list cache value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf ListCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function listCacheHas(key) {
  return assocIndexOf(this.__data__, key) > -1;
}

module.exports = listCacheHas;

},{"./_assocIndexOf":21}],45:[function(require,module,exports){
'use strict';

var assocIndexOf = require('./_assocIndexOf');

/**
 * Sets the list cache `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf ListCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the list cache instance.
 */
function listCacheSet(key, value) {
  var data = this.__data__,
      index = assocIndexOf(data, key);

  if (index < 0) {
    ++this.size;
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

module.exports = listCacheSet;

},{"./_assocIndexOf":21}],46:[function(require,module,exports){
'use strict';

var Hash = require('./_Hash'),
    ListCache = require('./_ListCache'),
    Map = require('./_Map');

/**
 * Removes all key-value entries from the map.
 *
 * @private
 * @name clear
 * @memberOf MapCache
 */
function mapCacheClear() {
  this.size = 0;
  this.__data__ = {
    'hash': new Hash(),
    'map': new (Map || ListCache)(),
    'string': new Hash()
  };
}

module.exports = mapCacheClear;

},{"./_Hash":15,"./_ListCache":16,"./_Map":17}],47:[function(require,module,exports){
'use strict';

var getMapData = require('./_getMapData');

/**
 * Removes `key` and its value from the map.
 *
 * @private
 * @name delete
 * @memberOf MapCache
 * @param {string} key The key of the value to remove.
 * @returns {boolean} Returns `true` if the entry was removed, else `false`.
 */
function mapCacheDelete(key) {
  var result = getMapData(this, key)['delete'](key);
  this.size -= result ? 1 : 0;
  return result;
}

module.exports = mapCacheDelete;

},{"./_getMapData":29}],48:[function(require,module,exports){
'use strict';

var getMapData = require('./_getMapData');

/**
 * Gets the map value for `key`.
 *
 * @private
 * @name get
 * @memberOf MapCache
 * @param {string} key The key of the value to get.
 * @returns {*} Returns the entry value.
 */
function mapCacheGet(key) {
  return getMapData(this, key).get(key);
}

module.exports = mapCacheGet;

},{"./_getMapData":29}],49:[function(require,module,exports){
'use strict';

var getMapData = require('./_getMapData');

/**
 * Checks if a map value for `key` exists.
 *
 * @private
 * @name has
 * @memberOf MapCache
 * @param {string} key The key of the entry to check.
 * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
 */
function mapCacheHas(key) {
  return getMapData(this, key).has(key);
}

module.exports = mapCacheHas;

},{"./_getMapData":29}],50:[function(require,module,exports){
'use strict';

var getMapData = require('./_getMapData');

/**
 * Sets the map `key` to `value`.
 *
 * @private
 * @name set
 * @memberOf MapCache
 * @param {string} key The key of the value to set.
 * @param {*} value The value to set.
 * @returns {Object} Returns the map cache instance.
 */
function mapCacheSet(key, value) {
  var data = getMapData(this, key),
      size = data.size;

  data.set(key, value);
  this.size += data.size == size ? 0 : 1;
  return this;
}

module.exports = mapCacheSet;

},{"./_getMapData":29}],51:[function(require,module,exports){
'use strict';

var memoize = require('./memoize');

/** Used as the maximum memoize cache size. */
var MAX_MEMOIZE_SIZE = 500;

/**
 * A specialized version of `_.memoize` which clears the memoized function's
 * cache when it exceeds `MAX_MEMOIZE_SIZE`.
 *
 * @private
 * @param {Function} func The function to have its output memoized.
 * @returns {Function} Returns the new memoized function.
 */
function memoizeCapped(func) {
  var result = memoize(func, function (key) {
    if (cache.size === MAX_MEMOIZE_SIZE) {
      cache.clear();
    }
    return key;
  });

  var cache = result.cache;
  return result;
}

module.exports = memoizeCapped;

},{"./memoize":65}],52:[function(require,module,exports){
'use strict';

var getNative = require('./_getNative');

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

module.exports = nativeCreate;

},{"./_getNative":30}],53:[function(require,module,exports){
"use strict";

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString.call(value);
}

module.exports = objectToString;

},{}],54:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var freeGlobal = require('./_freeGlobal');

/** Detect free variable `self`. */
var freeSelf = (typeof self === 'undefined' ? 'undefined' : _typeof(self)) == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;

},{"./_freeGlobal":28}],55:[function(require,module,exports){
'use strict';

var memoizeCapped = require('./_memoizeCapped');

/** Used to match property names within property paths. */
var reLeadingDot = /^\./,
    rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

/** Used to match backslashes in property paths. */
var reEscapeChar = /\\(\\)?/g;

/**
 * Converts `string` to a property path array.
 *
 * @private
 * @param {string} string The string to convert.
 * @returns {Array} Returns the property path array.
 */
var stringToPath = memoizeCapped(function (string) {
  var result = [];
  if (reLeadingDot.test(string)) {
    result.push('');
  }
  string.replace(rePropName, function (match, number, quote, string) {
    result.push(quote ? string.replace(reEscapeChar, '$1') : number || match);
  });
  return result;
});

module.exports = stringToPath;

},{"./_memoizeCapped":51}],56:[function(require,module,exports){
'use strict';

var isSymbol = require('./isSymbol');

/** Used as references for various `Number` constants. */
var INFINITY = 1 / 0;

/**
 * Converts `value` to a string key if it's not a string or symbol.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {string|symbol} Returns the key.
 */
function toKey(value) {
  if (typeof value == 'string' || isSymbol(value)) {
    return value;
  }
  var result = value + '';
  return result == '0' && 1 / value == -INFINITY ? '-0' : result;
}

module.exports = toKey;

},{"./isSymbol":64}],57:[function(require,module,exports){
'use strict';

/** Used for built-in method references. */
var funcProto = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString.call(func);
    } catch (e) {}
    try {
      return func + '';
    } catch (e) {}
  }
  return '';
}

module.exports = toSource;

},{}],58:[function(require,module,exports){
"use strict";

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || value !== value && other !== other;
}

module.exports = eq;

},{}],59:[function(require,module,exports){
'use strict';

var baseGet = require('./_baseGet');

/**
 * Gets the value at `path` of `object`. If the resolved value is
 * `undefined`, the `defaultValue` is returned in its place.
 *
 * @static
 * @memberOf _
 * @since 3.7.0
 * @category Object
 * @param {Object} object The object to query.
 * @param {Array|string} path The path of the property to get.
 * @param {*} [defaultValue] The value returned for `undefined` resolved values.
 * @returns {*} Returns the resolved value.
 * @example
 *
 * var object = { 'a': [{ 'b': { 'c': 3 } }] };
 *
 * _.get(object, 'a[0].b.c');
 * // => 3
 *
 * _.get(object, ['a', '0', 'b', 'c']);
 * // => 3
 *
 * _.get(object, 'a.b.c', 'default');
 * // => 'default'
 */
function get(object, path, defaultValue) {
  var result = object == null ? undefined : baseGet(object, path);
  return result === undefined ? defaultValue : result;
}

module.exports = get;

},{"./_baseGet":22}],60:[function(require,module,exports){
"use strict";

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray = Array.isArray;

module.exports = isArray;

},{}],61:[function(require,module,exports){
'use strict';

var baseGetTag = require('./_baseGetTag'),
    isObject = require('./isObject');

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]',
    funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]',
    proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
    if (!isObject(value)) {
        return false;
    }
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed arrays and other constructors.
    var tag = baseGetTag(value);
    return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

module.exports = isFunction;

},{"./_baseGetTag":23,"./isObject":62}],62:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
  return value != null && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],63:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
}

module.exports = isObjectLike;

},{}],64:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var baseGetTag = require('./_baseGetTag'),
    isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
    return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'symbol' || isObjectLike(value) && baseGetTag(value) == symbolTag;
}

module.exports = isSymbol;

},{"./_baseGetTag":23,"./isObjectLike":63}],65:[function(require,module,exports){
'use strict';

var MapCache = require('./_MapCache');

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/**
 * Creates a function that memoizes the result of `func`. If `resolver` is
 * provided, it determines the cache key for storing the result based on the
 * arguments provided to the memoized function. By default, the first argument
 * provided to the memoized function is used as the map cache key. The `func`
 * is invoked with the `this` binding of the memoized function.
 *
 * **Note:** The cache is exposed as the `cache` property on the memoized
 * function. Its creation may be customized by replacing the `_.memoize.Cache`
 * constructor with one whose instances implement the
 * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `clear`, `delete`, `get`, `has`, and `set`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to have its output memoized.
 * @param {Function} [resolver] The function to resolve the cache key.
 * @returns {Function} Returns the new memoized function.
 * @example
 *
 * var object = { 'a': 1, 'b': 2 };
 * var other = { 'c': 3, 'd': 4 };
 *
 * var values = _.memoize(_.values);
 * values(object);
 * // => [1, 2]
 *
 * values(other);
 * // => [3, 4]
 *
 * object.a = 2;
 * values(object);
 * // => [1, 2]
 *
 * // Modify the result cache.
 * values.cache.set(object, ['a', 'b']);
 * values(object);
 * // => ['a', 'b']
 *
 * // Replace `_.memoize.Cache`.
 * _.memoize.Cache = WeakMap;
 */
function memoize(func, resolver) {
  if (typeof func != 'function' || resolver != null && typeof resolver != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  var memoized = function memoized() {
    var args = arguments,
        key = resolver ? resolver.apply(this, args) : args[0],
        cache = memoized.cache;

    if (cache.has(key)) {
      return cache.get(key);
    }
    var result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache)();
  return memoized;
}

// Expose `MapCache`.
memoize.Cache = MapCache;

module.exports = memoize;

},{"./_MapCache":18}],66:[function(require,module,exports){
'use strict';

var baseToString = require('./_baseToString');

/**
 * Converts `value` to a string. An empty string is returned for `null`
 * and `undefined` values. The sign of `-0` is preserved.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 * @example
 *
 * _.toString(null);
 * // => ''
 *
 * _.toString(-0);
 * // => '-0'
 *
 * _.toString([1, 2, 3]);
 * // => '1,2,3'
 */
function toString(value) {
  return value == null ? '' : baseToString(value);
}

module.exports = toString;

},{"./_baseToString":25}],67:[function(require,module,exports){
'use strict';

// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout() {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
})();
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch (e) {
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }
}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e) {
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }
}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while (len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () {
    return '/';
};
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function () {
    return 0;
};

},{}],68:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var arrayify = require('array-back');
var t = require('typical');

/**
 * @module test-value
 * @example
 * var testValue = require('test-value')
 */
module.exports = testValue;

/**
 * @alias module:test-value
 * @param {any} - a value to test
 * @param {any} - the test query
 * @param [options] {object}
 * @param [options.strict] {boolean} - Treat an object like a value not a query. 
 * @returns {boolean}
 */
function testValue(value, test, options) {
  options = options || {};
  if (test !== Object.prototype && t.isPlainObject(test) && t.isObject(value) && !options.strict) {
    return Object.keys(test).every(function (prop) {
      var queryValue = test[prop];

      /* get flags */
      var isNegated = false;
      var isContains = false;

      if (prop.charAt(0) === '!') {
        isNegated = true;
      } else if (prop.charAt(0) === '+') {
        isContains = true;
      }

      /* strip flag char */
      prop = isNegated || isContains ? prop.slice(1) : prop;
      var objectValue = value[prop];

      if (isContains) {
        queryValue = arrayify(queryValue);
        objectValue = arrayify(objectValue);
      }

      var result = testValue(objectValue, queryValue, options);
      return isNegated ? !result : result;
    });
  } else if (test !== Array.prototype && Array.isArray(test)) {
    var tests = test;
    if (value === Array.prototype || !Array.isArray(value)) value = [value];
    return value.some(function (val) {
      return tests.some(function (test) {
        return testValue(val, test, options);
      });
    });

    /*
    regexes queries will always return `false` for `null`, `undefined`, `NaN`.
    This is to prevent a query like `/.+/` matching the string `undefined`.
    */
  } else if (test instanceof RegExp) {
    if (['boolean', 'string', 'number'].indexOf(typeof value === 'undefined' ? 'undefined' : _typeof(value)) === -1) {
      return false;
    } else {
      return test.test(value);
    }
  } else if (test !== Function.prototype && typeof test === 'function') {
    return test(value);
  } else {
    return test === value;
  }
}

/**
 * Returns a callback suitable for use by `Array` methods like `some`, `filter`, `find` etc.
 * @param {any} - the test query
 * @returns {function}
 */
testValue.where = function (test) {
  return function (value) {
    return testValue(value, test);
  };
};

},{"array-back":1,"typical":69}],69:[function(require,module,exports){
'use strict';

/**
 * For type-checking Javascript values.
 * @module typical
 * @typicalname t
 * @example
 * const t = require('typical')
 */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.isNumber = isNumber;
exports.isString = isString;
exports.isBoolean = isBoolean;
exports.isPlainObject = isPlainObject;
exports.isArrayLike = isArrayLike;
exports.isObject = isObject;
exports.isDefined = isDefined;
exports.isFunction = isFunction;
exports.isClass = isClass;
exports.isPrimitive = isPrimitive;
exports.isPromise = isPromise;
exports.isIterable = isIterable;

/**
 * Returns true if input is a number
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 * @example
 * > t.isNumber(0)
 * true
 * > t.isNumber(1)
 * true
 * > t.isNumber(1.1)
 * true
 * > t.isNumber(0xff)
 * true
 * > t.isNumber(0644)
 * true
 * > t.isNumber(6.2e5)
 * true
 * > t.isNumber(NaN)
 * false
 * > t.isNumber(Infinity)
 * false
 */
function isNumber(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

/**
 * A plain object is a simple object literal, it is not an instance of a class. Returns true if the input `typeof` is `object` and directly decends from `Object`.
 *
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 * @example
 * > t.isPlainObject({ clive: 'hater' })
 * true
 * > t.isPlainObject(new Date())
 * false
 * > t.isPlainObject([ 0, 1 ])
 * false
 * > t.isPlainObject(1)
 * false
 * > t.isPlainObject(/test/)
 * false
 */
function isPlainObject(input) {
  return input !== null && (typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object' && input.constructor === Object;
}

/**
 * An array-like value has all the properties of an array, but is not an array instance. Examples in the `arguments` object. Returns true if the input value is an object, not null and has a `length` property with a numeric value.
 *
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 * @example
 * function sum(x, y){
 *     console.log(t.isArrayLike(arguments))
 *     // prints `true`
 * }
 */
function isArrayLike(input) {
  return isObject(input) && typeof input.length === 'number';
}

/**
 * returns true if the typeof input is `'object'`, but not null!
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isObject(input) {
  return (typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object' && input !== null;
}

/**
 * Returns true if the input value is defined
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isDefined(input) {
  return typeof input !== 'undefined';
}

/**
 * Returns true if the input value is a string
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isString(input) {
  return typeof input === 'string';
}

/**
 * Returns true if the input value is a boolean
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isBoolean(input) {
  return typeof input === 'boolean';
}

/**
 * Returns true if the input value is a function
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isFunction(input) {
  return typeof input === 'function';
}

/**
 * Returns true if the input value is an es2015 `class`.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isClass(input) {
  if (isFunction(input)) {
    return (/^class /.test(Function.prototype.toString.call(input))
    );
  } else {
    return false;
  }
}

/**
 * Returns true if the input is a string, number, symbol, boolean, null or undefined value.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isPrimitive(input) {
  if (input === null) return true;
  switch (typeof input === 'undefined' ? 'undefined' : _typeof(input)) {
    case "string":
    case "number":
    case "symbol":
    case "undefined":
    case "boolean":
      return true;
    default:
      return false;
  }
}

/**
 * Returns true if the input is a string, number, symbol, boolean, null or undefined value.
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isPromise(input) {
  if (input) {
    var isPromise = isDefined(Promise) && input instanceof Promise;
    var isThenable = input.then && typeof input.then === 'function';
    return isPromise || isThenable ? true : false;
  } else {
    return false;
  }
}

/**
 * Returns true if the input is an iterable (`Map`, `Set`, `Array` etc.).
 * @param {*} - the input to test
 * @returns {boolean}
 * @static
 */
function isIterable(input) {
  if (input === null || !isDefined(input)) {
    return false;
  } else {
    return typeof input[Symbol.iterator] === 'function';
  }
}

},{}],70:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../context');

var _context2 = _interopRequireDefault(_context);

var _layers = require('../library/layers');

var Layers = _interopRequireWildcard(_layers);

var _populator = require('../library/populator');

var Populator = _interopRequireWildcard(_populator);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = function (context) {
  (0, _context2.default)(context);

  //get selected layers
  var selectedLayers = Layers.getSelectedLayers();
  if (!selectedLayers.length) {
    return (0, _context2.default)().document.showMessage('Please select the text layers you would like to restore.');
  }

  //clear layers
  selectedLayers.forEach(function (layer) {
    Populator.clearLayer(layer);
  });

  //reload inspector to update displayed data
  context.document.reloadInspector();
}; /**
    * Clear Layers
    *
    * Clears the selected layers of any populated data and removes any metadata.
    */

},{"../context":77,"../library/layers":94,"../library/populator":97}],71:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.clearLayers = exports.revealPresets = exports.populateAgain = exports.populateTable = exports.populateWithJSON = exports.populateWithPreset = undefined;

var _populateWithPreset = require('./populateWithPreset.js');

var _populateWithPreset2 = _interopRequireDefault(_populateWithPreset);

var _populateWithJSON = require('./populateWithJSON.js');

var _populateWithJSON2 = _interopRequireDefault(_populateWithJSON);

var _populateTable = require('./populateTable.js');

var _populateTable2 = _interopRequireDefault(_populateTable);

var _populateAgain = require('./populateAgain.js');

var _populateAgain2 = _interopRequireDefault(_populateAgain);

var _revealPresets = require('./revealPresets.js');

var _revealPresets2 = _interopRequireDefault(_revealPresets);

var _clearLayers = require('./clearLayers.js');

var _clearLayers2 = _interopRequireDefault(_clearLayers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.populateWithPreset = _populateWithPreset2.default;
exports.populateWithJSON = _populateWithJSON2.default;
exports.populateTable = _populateTable2.default;
exports.populateAgain = _populateAgain2.default;
exports.revealPresets = _revealPresets2.default;
exports.clearLayers = _clearLayers2.default;

},{"./clearLayers.js":70,"./populateAgain.js":72,"./populateTable.js":73,"./populateWithJSON.js":74,"./populateWithPreset.js":75,"./revealPresets.js":76}],72:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../context');

var _context2 = _interopRequireDefault(_context);

var _populator = require('../library/populator');

var Populator = _interopRequireWildcard(_populator);

var _options = require('../library/options');

var OPTIONS = _interopRequireWildcard(_options);

var _populateWithPreset = require('./populateWithPreset');

var _populateWithPreset2 = _interopRequireDefault(_populateWithPreset);

var _populateWithJSON = require('./populateWithJSON');

var _populateWithJSON2 = _interopRequireDefault(_populateWithJSON);

var _populateTable = require('./populateTable');

var _populateTable2 = _interopRequireDefault(_populateTable);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Populate Again
 *
 * Populates the selected layers using the same settings as last time.
 */

exports.default = function (context) {
  (0, _context2.default)(context);

  //get options
  var options = (0, OPTIONS.default)();

  //check if there is a data path set
  if (options[OPTIONS.LAST_DATA_PATH]) {

    //get type of last populate command
    switch (String(options[OPTIONS.LAST_POPULATE_TYPE])) {

      //populate with preset
      case Populator.POPULATE_TYPE.PRESET:
        (0, _populateWithPreset2.default)(context, true);
        break;

      //populate with JSON
      case Populator.POPULATE_TYPE.JSON:
        (0, _populateWithJSON2.default)(context, true);
        break;

      //populate table
      case Populator.POPULATE_TYPE.TABLE:
        (0, _populateTable2.default)(context, true);
        break;
    }
  }
};

},{"../context":77,"../library/options":95,"../library/populator":97,"./populateTable":73,"./populateWithJSON":74,"./populateWithPreset":75}],73:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../context');

var _context2 = _interopRequireDefault(_context);

var _data = require('../library/data');

var Data = _interopRequireWildcard(_data);

var _gui = require('../library/gui');

var Gui = _interopRequireWildcard(_gui);

var _layers = require('../library/layers');

var Layers = _interopRequireWildcard(_layers);

var _populator = require('../library/populator');

var Populator = _interopRequireWildcard(_populator);

var _options = require('../library/options');

var OPTIONS = _interopRequireWildcard(_options);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Populate Table
 *
 * Populates the selected table layer group with a TSV file.
 */

exports.default = function (context, populateAgain) {
  (0, _context2.default)(context);

  //get selected table layer group
  var selectedLayers = Layers.getSelectedLayers();
  if (!selectedLayers.length) {
    return (0, _context2.default)().document.showMessage('Please select the table layer group you would like to populate.');
  } else if (selectedLayers.length > 1) {
    return (0, _context2.default)().document.showMessage('Please select only one table layer group.');
  }
  var tableLayerGroup = selectedLayers[0];

  //get options and data path
  var options = (0, OPTIONS.default)();
  var dataPath = void 0;
  if (populateAgain) {

    //get stored data path
    dataPath = options[OPTIONS.LAST_DATA_PATH];
    if (!dataPath) return;
  } else {

    //ask for TSV file path, passing the last location if available
    dataPath = Data.askForTableTSV(options[OPTIONS.LAST_TSV_PATH]);
    if (!dataPath) return;

    //show dialog
    options = Gui.showPopulatorDialog(Populator.POPULATE_TYPE.TABLE);

    //terminate if cancelled
    if (!options) return;
  }

  //load tsv table data
  var tableData = Data.loadTableTSV(dataPath);
  if (!tableData) return;
  tableData = Data.flattenTable(tableData);

  //get tsv dir to use as the root dir
  var tsvDir = NSString.stringWithString(dataPath).stringByDeletingLastPathComponent();

  //set path options
  options[OPTIONS.LAST_DATA_PATH] = dataPath;
  options[OPTIONS.LAST_TSV_PATH] = dataPath;
  options.rootDir = tsvDir;

  //save type of populate command
  options[OPTIONS.LAST_POPULATE_TYPE] = Populator.POPULATE_TYPE.TABLE;

  //save options
  (0, OPTIONS.default)(options);

  //populate selected layers
  Populator.populateTable(tableLayerGroup, tableData, options);

  //restore selected layers
  Layers.selectLayers([tableLayerGroup]);
};

},{"../context":77,"../library/data":87,"../library/gui":93,"../library/layers":94,"../library/options":95,"../library/populator":97}],74:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../context');

var _context2 = _interopRequireDefault(_context);

var _data = require('../library/data');

var Data = _interopRequireWildcard(_data);

var _gui = require('../library/gui');

var Gui = _interopRequireWildcard(_gui);

var _layers = require('../library/layers');

var Layers = _interopRequireWildcard(_layers);

var _populator = require('../library/populator');

var Populator = _interopRequireWildcard(_populator);

var _options = require('../library/options');

var OPTIONS = _interopRequireWildcard(_options);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Populate with JSON
 *
 * Populates the selected layers with a JSON file.
 */

exports.default = function (context, populateAgain) {
  (0, _context2.default)(context);

  //get selected layers
  var selectedLayers = Layers.getSelectedLayers();
  if (!selectedLayers.length) {
    return (0, _context2.default)().document.showMessage('Please select the layers you would like to populate.');
  }

  //get options and data path
  var options = (0, OPTIONS.default)();
  var dataPath = void 0;
  if (populateAgain) {

    //get stored data path
    dataPath = options[OPTIONS.LAST_DATA_PATH];
    if (!dataPath) return;
  } else {

    //ask for JSON file path, passing the last location if available
    dataPath = Data.askForJSON(options[OPTIONS.LAST_JSON_PATH]);
    if (!dataPath) return;

    //show dialog
    options = Gui.showPopulatorDialog(Populator.POPULATE_TYPE.JSON);

    //terminate if cancelled
    if (!options) return;

    //create grid
    if (options[OPTIONS.CREATE_GRID]) {
      selectedLayers = Layers.createGrid(selectedLayers, {
        rowsCount: options[OPTIONS.ROWS_COUNT],
        rowsMargin: options[OPTIONS.ROWS_MARGIN],
        columnsCount: options[OPTIONS.COLUMNS_COUNT],
        columnsMargin: options[OPTIONS.COLUMNS_MARGIN]
      });

      //make sure that grid creation was successful
      //could have failed if zero rows were requested for example
      if (!selectedLayers) return;
    }
  }

  //load json data
  var jsonData = Data.loadJSONData(dataPath);
  if (!jsonData) return;

  //get root dir used when populating local images
  var jsonDir = NSString.stringWithString(dataPath).stringByDeletingLastPathComponent();

  //set path options
  options[OPTIONS.LAST_DATA_PATH] = dataPath;
  options[OPTIONS.LAST_JSON_PATH] = dataPath;
  options.rootDir = jsonDir;

  //save type of populate command
  options[OPTIONS.LAST_POPULATE_TYPE] = Populator.POPULATE_TYPE.JSON;

  //save options
  (0, OPTIONS.default)(options);

  //populate selected layers
  Populator.populateLayers(selectedLayers, jsonData, options);

  //restore selected layers
  Layers.selectLayers(selectedLayers);
};

},{"../context":77,"../library/data":87,"../library/gui":93,"../library/layers":94,"../library/options":95,"../library/populator":97}],75:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../context');

var _context2 = _interopRequireDefault(_context);

var _data = require('../library/data');

var Data = _interopRequireWildcard(_data);

var _gui = require('../library/gui');

var Gui = _interopRequireWildcard(_gui);

var _layers = require('../library/layers');

var Layers = _interopRequireWildcard(_layers);

var _populator = require('../library/populator');

var Populator = _interopRequireWildcard(_populator);

var _options = require('../library/options');

var OPTIONS = _interopRequireWildcard(_options);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Populate with Preset
 *
 * Populates the selected layers with a preset.
 */

exports.default = function (context, populateAgain) {
  (0, _context2.default)(context);

  //get selected layers
  var selectedLayers = Layers.getSelectedLayers();
  if (!selectedLayers.length) {
    return (0, _context2.default)().document.showMessage('Please select the layers you would like to populate.');
  }

  //load presets
  var presets = Data.loadPresets();
  if (!presets.length) {
    return (0, _context2.default)().document.showMessage('There are no presets.');
  }

  //get options and data path
  var options = (0, OPTIONS.default)();
  var dataPath = void 0;
  if (populateAgain) {

    //get stored data path
    dataPath = options[OPTIONS.LAST_DATA_PATH];
    if (!dataPath) return;
  } else {

    //show dialog
    options = Gui.showPopulatorDialog(Populator.POPULATE_TYPE.PRESET, {
      presets: presets
    });

    //terminate if cancelled
    if (!options) return;

    //get preset data path
    dataPath = presets[options.selectedPresetIndex].path;

    //create grid
    if (options[OPTIONS.CREATE_GRID]) {
      selectedLayers = Layers.createGrid(selectedLayers, {
        rowsCount: options[OPTIONS.ROWS_COUNT],
        rowsMargin: options[OPTIONS.ROWS_MARGIN],
        columnsCount: options[OPTIONS.COLUMNS_COUNT],
        columnsMargin: options[OPTIONS.COLUMNS_MARGIN]
      });

      //make sure that grid creation was successful
      //could have failed if zero rows were requested for example
      if (!selectedLayers) return;
    }
  }

  //load preset data
  var presetData = Data.loadJSONData(dataPath);
  if (!presetData) return;

  //get root dir used when populating local images
  var presetDir = NSString.stringWithString(dataPath).stringByDeletingLastPathComponent();

  //set path options
  options[OPTIONS.LAST_DATA_PATH] = dataPath;
  options.rootDir = presetDir;

  //save type of populate command
  options[OPTIONS.LAST_POPULATE_TYPE] = Populator.POPULATE_TYPE.PRESET;

  //save options
  (0, OPTIONS.default)(options);

  //populate selected layers
  Populator.populateLayers(selectedLayers, presetData, options);

  //restore selected layers
  Layers.selectLayers(selectedLayers);
};

},{"../context":77,"../library/data":87,"../library/gui":93,"../library/layers":94,"../library/options":95,"../library/populator":97}],76:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _context = require('../context');

var _context2 = _interopRequireDefault(_context);

var _data = require('../library/data');

var Data = _interopRequireWildcard(_data);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Reveal Presets
 *
 * Opens the presets folder.
 */

exports.default = function (context) {
  (0, _context2.default)(context);

  //get presets dir
  var presetDir = Data.getPresetsDir();

  //open dir
  var url = NSURL.fileURLWithPath(presetDir);
  NSWorkspace.sharedWorkspace().openURL(url);
};

},{"../context":77,"../library/data":87}],77:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (newContext) {

  //set new context
  if (newContext) {
    context = newContext;
  }

  return context;
};

/**
 * Context
 *
 * Provides a convenient way to set and get the current command context.
 */

//store context
var context = null;

//set and get context via the same function

},{}],78:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Delete action
 */

var name = exports.name = 'delete';
var alias = exports.alias = 'd';

/**
 * Deletes the layer if the condition is true.
 *
 * @param {boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {
  if (!condition) return;

  //remove layer from parent
  layer.removeFromParent();
}

},{}],79:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Hide action
 */

var name = exports.name = 'hide';
var alias = exports.alias = 'h';

/**
 * Hides the layer if the condition is true or shows it otherwise.
 *
 * @param {boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {
  layer.setIsVisible(!condition);
}

},{}],80:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.performActions = performActions;
exports.extractActions = extractActions;
exports.parseAction = parseAction;
exports.resolveAction = resolveAction;
exports.performAction = performAction;

var _context = require('../../context');

var _context2 = _interopRequireDefault(_context);

var _placeholders = require('../placeholders');

var Placeholders = _interopRequireWildcard(_placeholders);

var _show = require('./show');

var ShowAction = _interopRequireWildcard(_show);

var _hide = require('./hide');

var HideAction = _interopRequireWildcard(_hide);

var _lock = require('./lock');

var LockAction = _interopRequireWildcard(_lock);

var _unlock = require('./unlock');

var UnlockAction = _interopRequireWildcard(_unlock);

var _delete = require('./delete');

var DeleteAction = _interopRequireWildcard(_delete);

var _plugin = require('./plugin');

var PluginAction = _interopRequireWildcard(_plugin);

var _swapSymbol = require('./swapSymbol');

var SwapSymbolAction = _interopRequireWildcard(_swapSymbol);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var actions = [ShowAction, HideAction, LockAction, UnlockAction, DeleteAction, PluginAction, SwapSymbolAction];

/**
 * Perform all actions on a layer.
 *
 * @param {MSLayer} layer
 * @param {Object} data
 */


/**
 * Load action functions
 */
/**
 * Actions library
 *
 * Provides functionality to extract, parse and execute actions.
 */

function performActions(layer, data) {

  //process conditional actions on the layer
  var actions = extractActions(layer.name());

  //perform actions
  actions.forEach(function (action) {
    performAction(action, layer, data);
  });
}

/**
 * Extracts actions from the layer name, e.g. ... #show({firstName}.length > 3)
 *
 * @param {string} string
 * @returns {Array}
 */
function extractActions(string) {

  //get individual actions
  var actionStrings = string.match(/#\w*\[([^\]]+)]/g) || [];

  //parse actions
  var extractedActions = actionStrings.map(function (actionString) {
    return parseAction(actionString);
  });

  return extractedActions;
}

/**
 * Parses the action string, #run({firstName}.length > 3, fnToRun)
 *
 * @param {string} actionString
 * @returns {Object}
 *
 * returned action: {
 *   string: {string},
 *   command: {string},
 *   condition: {
 *     string: {string},
 *     placeholders: [{
 *         string: {string},
 *         keypath: {string},
 *         filters: {Array},
 *         substitute: {string},
 *         placeholders: {Array}
 *       }]
 *   },
 *   params: [{
 *     string: {string},
 *     placeholders: {Array as for condition},
 *   }]
 * }
 */
function parseAction(actionString) {

  //keep full action string
  //used later on when executing actions
  var fullActionString = actionString;

  //get command
  var command = actionString.match(/#(\w+)/g)[0];

  //remove command from string
  actionString = actionString.substring(command.length + 1, actionString.length - 1);

  //remove # from command string
  command = command.substring(1);

  //split action string into components
  var actionComponents = actionString.split(/(?![^(]*\)),/g);

  //get condition string
  var conditionString = actionComponents[0];

  //extract placeholders in condition
  var conditionPlaceholders = Placeholders.extractPlaceholders(conditionString);

  //get params
  actionComponents.shift();
  var params = actionComponents.map(function (paramString) {

    //get placeholders in param
    var paramPlaceholders = Placeholders.extractPlaceholders(paramString);

    //return complete param object with placeholders
    return {
      string: paramString.trim(),
      placeholders: paramPlaceholders
    };
  });

  //prepare action
  var action = {
    string: fullActionString,
    command: command,
    condition: {
      string: conditionString,
      placeholders: conditionPlaceholders
    },
    params: params
  };

  return action;
}

/**
 * Resolves the placeholders in the action with the supplied data.
 *
 * @param action {Object}
 * @param data {Object}
 */
function resolveAction(action, data) {

  //copy action object
  action = Object.assign({}, action);

  //create populated condition string
  var populatedConditionString = action.condition.string;
  action.condition.placeholders.forEach(function (placeholder) {

    //populate placeholder found in the condition string
    var populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, 'null');

    //replace original placeholder string
    populatedConditionString = populatedConditionString.replace(placeholder.string, populatedPlaceholder);
  });
  action.condition = populatedConditionString;

  //populate params
  var populatedParams = action.params.map(function (param) {

    //create populated param string
    var populatedParamString = param.string;
    param.placeholders.forEach(function (placeholder) {

      //populate placeholder found in the param string
      var populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, 'null');

      //replace original placeholder string
      populatedParamString = populatedParamString.replace(placeholder.string, populatedPlaceholder);
    });

    return populatedParamString;
  });
  action.params = populatedParams;

  //evaluate condition
  var condition = void 0;
  try {

    //evaluate condition
    condition = new Function('return ' + populatedConditionString)();
  } catch (e) {

    //show error that action could not be evaluated
    (0, _context2.default)().document.showMessage('Conditional action \'' + action.string + '\' could not be evaluated.');
  }
  action.condition = condition;

  return action;
}

/**
 * Performs the supplied action with the data and layer as input.
 *
 * @param {Object} action
 * @param {MSLayer} layer
 * @param {Object} data
 */
function performAction(action, layer, data) {

  //find action function for the specified action
  var actionFunction = void 0;
  for (var i = 0; i < actions.length; i++) {
    if (actions[i].name == action.command || actions[i].alias == action.command) {
      actionFunction = actions[i].perform;
    }
  }

  //continue only if action found
  if (!actionFunction) {
    return (0, _context2.default)().document.showMessage('Conditional action \'' + action.command + '\' on layer \'' + layer.name() + '\' does not exist.');
  }

  //create populated condition string
  var populatedConditionString = action.condition.string;
  action.condition.placeholders.forEach(function (placeholder) {

    //populate placeholder found in the condition string
    var populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, 'null');

    //replace original placeholder string
    populatedConditionString = populatedConditionString.replace(placeholder.string, populatedPlaceholder);
  });

  //populate params
  var populatedParams = action.params.map(function (param) {

    //create populated param string
    var populatedParamString = param.string;
    param.placeholders.forEach(function (placeholder) {

      //populate placeholder found in the param string
      var populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, 'null');

      //replace original placeholder string
      populatedParamString = populatedParamString.replace(placeholder.string, populatedPlaceholder);
    });

    return populatedParamString;
  });

  //get layer name without action string
  //used within error messages
  var layerName = layer.name().replace(action.string, '').trim();
  if (!layerName.length) layerName = layer.name();

  //evaluate condition
  var condition = void 0;
  try {

    //evaluate condition
    condition = new Function('return ' + populatedConditionString)();
  } catch (e) {

    //show error that action could not be evaluated
    (0, _context2.default)().document.showMessage('Conditional action on layer \'' + layerName + '\' could not be evaluated.');
  }

  //perform action
  try {
    actionFunction(condition, layer, populatedParams);
  } catch (e) {

    //show error that action could not be performed
    (0, _context2.default)().document.showMessage('Conditional action on layer \'' + layerName + '\' could not be performed.');
  }
}

},{"../../context":77,"../placeholders":96,"./delete":78,"./hide":79,"./lock":81,"./plugin":82,"./show":83,"./swapSymbol":84,"./unlock":85}],81:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Lock action
 */

var name = exports.name = 'lock';
var alias = exports.alias = 'l';

/**
 * Locks the layer if the condition is true or unlocks it otherwise.
 *
 * @param {boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {
  layer.setIsLocked(condition);
}

},{}],82:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.alias = exports.name = undefined;
exports.perform = perform;

var _utils = require('../utils');

var Utils = _interopRequireWildcard(_utils);

var _layers = require('../layers');

var Layers = _interopRequireWildcard(_layers);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Plugin action
 */

var name = exports.name = 'plugin';
var alias = exports.alias = 'p';

/**
 * Runs the specified plugin command.
 *
 * @param {boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {

  //only run if the condition is true
  if (!condition) return;

  //get plugin manager
  var pluginManager = NSApp.delegate().pluginManager();

  //get all plugin bundles
  var pluginBundles = pluginManager.plugins();

  //build plugin tree
  var plugins = {};
  Utils.convertToJSArray(pluginBundles.allKeys()).forEach(function (bundleIdentifier) {

    //get bundle
    var bundle = pluginBundles.objectForKey(bundleIdentifier);

    //get plugin commands
    var pluginCommands = bundle.commands();

    //build command object
    var commands = {};
    Utils.convertToJSArray(pluginCommands.allKeys()).forEach(function (commandIdentifier) {

      //get command
      var command = pluginCommands.objectForKey(commandIdentifier);

      //add command
      commands[command.name()] = command;
    });

    //add plugin with commands
    plugins[bundle.name()] = commands;
  });

  //get plugin command path
  var commandPath = params[0].split('>').map(function (component) {
    return component.trim();
  });

  //remove command path from params
  params.shift();

  //get command to perform
  var command = plugins[commandPath[0]][commandPath[1]];

  //store current layer selection
  var originalSelection = Layers.getSelectedLayers();

  //select only the passed layer
  Layers.selectLayers([layer]);

  //add params
  setCommandParamsToMetadata(layer, params);

  //run the command
  NSApp.delegate().runPluginCommand(command);

  //remove params
  removeCommandParamsFromMetadata(layer);

  //restore original selection
  Layers.selectLayers(originalSelection);
}

/**
 * Adds the provided params to the metadata of the layer. This way, the other
 * plugin can read those params.
 *
 * @param {MSLayer} layer
 * @param {Array} params
 */
function setCommandParamsToMetadata(layer, params) {

  //get layer user info
  var userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo());

  //set params
  userInfo.setValue_forKey(params, 'datapopulator');

  //set new user info
  layer.setUserInfo(userInfo);
}

/**
 * Removes command params from the layer metadata.
 *
 * @param {MSLayer} layer
 */
function removeCommandParamsFromMetadata(layer) {

  //get layer user info
  var userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo());

  //remove params
  userInfo.removeObjectForKey('datapopulator');

  //set new user info
  layer.setUserInfo(userInfo);
}

},{"../layers":94,"../utils":98}],83:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Show action
 */

var name = exports.name = 'show';
var alias = exports.alias = 's';

/**
 * Shows the layer if the condition is true or hides it otherwise.
 *
 * @param {boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {
  layer.setIsVisible(condition);
}

},{}],84:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Swap symbol action
 */

var name = exports.name = 'swapSymbol';
var alias = exports.alias = 'ss';

/**
 * Dummy function. Actual swapping is performed in Populator.
 *
 * @param {boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {}

},{}],85:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.perform = perform;
/**
 * Unlock action
 */

var name = exports.name = 'unlock';
var alias = exports.alias = 'u';

/**
 * Unlocks the layer if the condition is true or locks it otherwise.
 *
 * @param {boolean} condition
 * @param {MSLayer} layer
 * @param {Array} params
 */
function perform(condition, layer, params) {
  layer.setIsLocked(!condition);
}

},{}],86:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractArgs = extractArgs;
exports.parseArgs = parseArgs;

var _commandLineArgs = require('command-line-args');

var _commandLineArgs2 = _interopRequireDefault(_commandLineArgs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Extracts standard CLI-style arguments from a string. First removes placeholders
 * from the string.
 *
 * @param {string} string
 * @param {Array} definitions
 */
function extractArgs(string, definitions) {

  //remove placeholders from string
  string = string.replace(/(?![^(]*\)){([^}]+)}/g, '');

  //parse args in the remaining string
  return parseArgs(string, definitions);
}

/**
 * Parses any args found in the provided string using the given definitions.
 *
 * @param {string} string
 * @param {Array} definitions - object containing the possible option definitions to look for
 *
 * definitions: [{
 *   name: {string}, - the full name of the arg, used as arg name in extracted args
 *   alias: {string} - the short name of the arg, e.g. l, v, etc
 * }]
 */
/**
 * Args library
 *
 * Provides functionality to extract and parse args.
 */

function parseArgs(string, definitions) {

  //parse args using the provided definitions
  return (0, _commandLineArgs2.default)(definitions, string.split(/\s+/g));
}

},{"command-line-args":7}],87:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.askForJSON = askForJSON;
exports.askForTableTSV = askForTableTSV;
exports.readFileAsText = readFileAsText;
exports.getPresetsDir = getPresetsDir;
exports.loadPresets = loadPresets;
exports.getImageFromRemoteURL = getImageFromRemoteURL;
exports.getImageFromLocalURL = getImageFromLocalURL;
exports.getImageData = getImageData;
exports.loadJSONData = loadJSONData;
exports.loadTableTSV = loadTableTSV;
exports.flattenTable = flattenTable;

var _context = require("../context");

var _context2 = _interopRequireDefault(_context);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Prompts user to select the JSON file and returns the path of the file.
 *
 * @param {string} path - Path to set for the file browser.
 * @returns {string}
 */
function askForJSON(path) {

  //create panel
  var panel = NSOpenPanel.openPanel();

  //set panel properties
  panel.setTitle("Select JSON");
  panel.setMessage("Please select the JSON file you'd like to use.");
  panel.setPrompt("Select");
  panel.setCanCreateDirectories(false);
  panel.setCanChooseFiles(true);
  panel.setCanChooseDirectories(false);
  panel.setAllowsMultipleSelection(false);
  panel.setShowsHiddenFiles(false);
  panel.setExtensionHidden(false);

  //set initial panel path
  if (path) {
    panel.setDirectoryURL(NSURL.fileURLWithPath(path));
  } else {
    panel.setDirectoryURL(NSURL.fileURLWithPath('/Users/' + NSUserName()));
  }

  //show panel
  var pressedButton = panel.runModal();
  if (pressedButton == NSOKButton) {
    return panel.URL().path();
  }
}

/**
 * Prompts user to select the TSV file and returns the path of the file.
 *
 * @param {string} path - Path to set for the file browser.
 * @returns {string}
 */
/**
 * Data library
 *
 * Provides access to data import and processing functionality.
 */

function askForTableTSV(path) {

  //create panel
  var panel = NSOpenPanel.openPanel();

  //set panel properties
  panel.setTitle("Select TSV");
  panel.setMessage("Please select the TSV file you'd like to use to populate the table.");
  panel.setPrompt("Select");
  panel.setCanCreateDirectories(false);
  panel.setCanChooseFiles(true);
  panel.setCanChooseDirectories(false);
  panel.setAllowsMultipleSelection(false);
  panel.setShowsHiddenFiles(false);
  panel.setExtensionHidden(false);

  //set initial panel path
  if (path) {
    panel.setDirectoryURL(NSURL.fileURLWithPath(path));
  } else {
    panel.setDirectoryURL(NSURL.fileURLWithPath('/Users/' + NSUserName()));
  }

  //show panel
  var pressedButton = panel.runModal();
  if (pressedButton == NSOKButton) {
    return panel.URL().path();
  }
}

/**
 * Reads the contexts of a text based file at the provided path.
 *
 * @param {string} path
 * @returns {string}
 */
function readFileAsText(path) {
  return NSString.stringWithContentsOfFile_encoding_error(path, NSUTF8StringEncoding, false);
}

/**
 * Returns the path to the presets dir.
 *
 * @returns {string}
 */
function getPresetsDir() {

  //get script path
  var scriptPath = (0, _context2.default)().scriptPath;

  //get presets dir path
  var presetsDirPath = scriptPath.stringByAppendingPathComponent('/../../../Presets/');
  presetsDirPath = presetsDirPath.stringByStandardizingPath();

  return presetsDirPath;
}

/**
 * Loads all presets inside the presets dir.
 *
 * @returns {Array}
 */
function loadPresets() {

  //get presets path
  var presetsPath = getPresetsDir();

  //create file enumerator for presetsPath
  var url = NSURL.fileURLWithPath(presetsPath);
  var enumerator = NSFileManager.defaultManager().enumeratorAtURL_includingPropertiesForKeys_options_errorHandler(url, [NSURLIsDirectoryKey, NSURLNameKey, NSURLPathKey], NSDirectoryEnumerationSkipsHiddenFiles, null);

  var presets = [];
  var fileUrl = void 0;
  while (fileUrl = enumerator.nextObject()) {

    //make sure that file is JSON
    if (fileUrl.pathExtension().isEqualToString('json')) {

      //make sure it's a file
      var isDir = MOPointer.alloc().init();
      fileUrl.getResourceValue_forKey_error(isDir, NSURLIsDirectoryKey, null);
      if (!Number(isDir.value())) {

        //get relative path for preset
        var presetPath = fileUrl.path();
        var presetDisplayPath = presetPath.stringByReplacingOccurrencesOfString_withString(presetsPath + '/', '');

        //create preset structure
        var preset = {
          name: String(presetDisplayPath.stringByDeletingPathExtension()),
          path: String(fileUrl.path())
        };

        //add item
        presets.push(preset);
      }
    }
  }

  return presets;
}

/**
 * Downloads the image from the specified remote URL and creates an NSImage instance.
 *
 * @param {string} urlString
 * @returns {NSImage}
 */
function getImageFromRemoteURL(urlString) {

  //get data from url
  var url = NSURL.URLWithString(urlString);
  var data = url.resourceDataUsingCache(false);
  if (!data) return;

  //create image from data
  var image = NSImage.alloc().initWithData(data);
  return image;
}

/**
 * Loads the image from the specified local URL and creates an NSImage instance.
 *
 * @param {string} urlString
 * @returns {NSImage}
 */
function getImageFromLocalURL(urlString) {

  //read image content from file
  var fileManager = NSFileManager.defaultManager();
  if (fileManager.fileExistsAtPath(urlString)) {
    return NSImage.alloc().initWithContentsOfFile(urlString);
  }
}

/**
 * Creates an MSImageData instance from NSImage.
 *
 * @param {NSImage} image
 * @returns {MSImageData}
 */
function getImageData(image) {
  if (!image) return;

  //create image data with image
  return MSImageData.alloc().initWithImage_convertColorSpace(image, false);
}

/**
 * Loads the JSON file at the specified path and parses and returns its content.
 *
 * @param {string} path
 * @returns {Object/Array}
 */
function loadJSONData(path) {

  //load contents
  var contents = readFileAsText(path);

  //get data from JSON
  var data = void 0;
  try {
    data = JSON.parse(contents);
  } catch (e) {
    (0, _context2.default)().document.showMessage("There was an error parsing data. Please make sure it's valid.");
    return;
  }

  return data;
}

/**
 * Loads a TSV file and parses its contents into a format that resembles a table.
 *
 * @param {string} path
 * @returns {Object}
 *
 * Example table object:
 * {
 *   "rows":[
 *     {
 *       "title":"TEAM 1",
 *       "rows":[
 *         {
 *           "title":"Peter",
 *           "rows":[ TODO: this should be columns, not rows
 *             {
 *               "title":"QUARTER 1",
 *               "columns":[
 *                 {
 *                   "title":"January",
 *                   "content":{
 *                     "value":"$10,000.00"
 *                   }
 *                 },
 *                 {
 *                   "title":"February",
 *                   "content":{
 *                     "value":"$10,266.00"
 *                   }
 *                 },
 *                 {
 *                   "title":"March",
 *                   "content":{
 *                     "value":"$5,666.00"
 *                   }
 *                 }
 *               ]
 *             }
 *           ]
 *         },
 *         {
 *           "title":"Paul",
 *           "rows":[
 *             {
 *               "title":"QUARTER 1",
 *               "columns":[
 *                 {
 *                   "title":"January",
 *                   "content":{
 *                     "value":"$6,683.00",
 *                     "additional":"30.00%"
 *                   }
 *                 },
 *                 {
 *                   "title":"February",
 *                   "content":{
 *                     "value":"$8,779.00",
 *                     "additional":"34.00%"
 *                   }
 *                 },
 *                 {
 *                   "title":"March",
 *                   "content":{
 *                     "value":"$7,889.00",
 *                     "additional":"55.00%"
 *                   }
 *                 }
 *               ]
 *             }
 *           ]
 *         },
 *         {
 *           "title":"Mary",
 *           "rows":[
 *             {
 *               "title":"QUARTER 1",
 *               "columns":[
 *                 {
 *                   "title":"January",
 *                   "content":{
 *                     "label":"Revenue",
 *                     "value":"$12,334.00",
 *                     "additional":"30.00%"
 *                   }
 *                 },
 *                 {
 *                   "title":"February",
 *                   "content":{
 *                     "label":"Revenue",
 *                     "value":"$8,999.00",
 *                     "additional":"30.00%"
 *                   }
 *                 },
 *                 {
 *                   "title":"March",
 *                   "content":{
 *                     "label":"Revenue",
 *                     "value":"$11,334.00",
 *                     "additional":"30.00%"
 *                   }
 *                 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
function loadTableTSV(path) {

  //load contents
  var data = readFileAsText(path);

  //create 2d table array from tsv
  var table = [];

  //split into rows
  var rowsData = data.split(/\n/g);
  rowsData.forEach(function (rowData) {

    //prepare row
    var row = [];

    //split into columns
    var columnsData = rowData.split(/\t/g);
    columnsData.forEach(function (columnData) {
      columnData = columnData.replace('\r', '').trim();

      //add column to row
      row.push(columnData);
    });

    //add row to table
    table.push(row);
  });

  //find x and y indexes of table data start
  var dataX = 0;
  var dataY = 0;
  while (!table[0][dataX].length) {
    dataX++;
  }
  while (!table[dataY][0].length) {
    dataY++;
  }

  //get data width and height
  var dataWidth = table[0].length - dataX;
  var dataHeight = table.length - dataY;

  //fill missing vertical table group values
  for (var i = 0; i < dataX - 1; i++) {
    var lastPresentValue = null;
    for (var j = dataY; j < dataY + dataHeight; j++) {
      if (table[j][i].length) {
        lastPresentValue = table[j][i];
      } else {
        table[j][i] = lastPresentValue;
      }
    }
  }

  //fill missing horizontal table group values
  for (var _i = 0; _i < dataY; _i++) {
    var _lastPresentValue = null;
    for (var _j = dataX; _j < dataX + dataWidth; _j++) {
      if (table[_i][_j].length) {
        _lastPresentValue = table[_i][_j];
      } else {
        table[_i][_j] = _lastPresentValue;
      }
    }
  }

  //create grouped table of horizontal entries
  var groupedTable = {
    rows: []
  };
  for (var _i2 = dataY; _i2 < dataY + dataHeight; _i2++) {
    for (var _j2 = dataX; _j2 < dataX + dataWidth; _j2++) {

      //get data for table cell
      var _data = table[_i2][_j2];

      //get data key
      //data keys are always to the left of the data
      var dataKey = table[_i2][dataX - 1];

      //find path to data
      var _path = [];
      for (var p = 0; p < dataX - 1; p++) {
        _path.push({
          title: table[_i2][p],
          type: 'row'
        });
      }
      for (var _p = 0; _p < dataY; _p++) {
        _path.push({
          title: table[_p][_j2],
          type: 'column'
        });
      }

      //create path structure
      var parent = groupedTable.rows;
      for (var _p2 = 0; _p2 < _path.length; _p2++) {

        //find existing child in parent with same title
        var existingChild = null;
        for (var q = 0; q < parent.length; q++) {
          if (parent[q].title == _path[_p2].title) {
            existingChild = parent[q];
            break;
          }
        }

        //select next parent
        if (existingChild) {
          parent = existingChild[_path[_p2].type + 's'];
          if (!parent) parent = existingChild.content;
        } else {

          //prepare new child that will become next parent
          var newChild = {
            title: _path[_p2].title
          };

          //if it's the last path component, the content is an object
          if (_p2 == _path.length - 1) {
            newChild.content = {};
            parent.push(newChild);
            parent = newChild.content;
          } else {
            newChild[_path[_p2].type + 's'] = [];
            parent.push(newChild);
            parent = newChild[_path[_p2].type + 's'];
          }
        }
      }

      //add value for key to parent
      parent[dataKey] = _data;
    }
  }

  return groupedTable;
}

/**
 * Flattens the previously parsed TSV table to make populating possible.
 *
 * @param {Object} data
 * @returns {Object}
 *
 * Example flattened table:
 *
 * {
 *   "rowGroups":[
 *     {
 *       "title":"TEAM 1",
 *       "groups":[
 *         {
 *           "title":"Peter"
 *         },
 *         {
 *           "title":"Paul"
 *         },
 *         {
 *           "title":"Mary"
 *         }
 *       ]
 *     }
 *   ],
 *   "columnGroups":[
 *     {
 *       "title":"QUARTER 1",
 *       "groups":[
 *         {
 *           "title":"January"
 *         },
 *         {
 *           "title":"February"
 *         },
 *         {
 *           "title":"March"
 *         }
 *       ]
 *     }
 *   ],
 *   "cells":[
 *     [
 *       {
 *         "value":"$10,000.00"
 *       },
 *       {
 *         "value":"$10,266.00"
 *       },
 *       {
 *         "value":"$5,666.00"
 *       }
 *     ],
 *     [
 *       {
 *         "value":"$6,683.00",
 *         "additional":"30.00%"
 *       },
 *       {
 *         "value":"$8,779.00",
 *         "additional":"34.00%"
 *       },
 *       {
 *         "value":"$7,889.00",
 *         "additional":"55.00%"
 *       }
 *     ],
 *     [
 *       {
 *         "label":"Revenue",
 *         "value":"$12,334.00",
 *         "additional":"30.00%"
 *       },
 *       {
 *         "label":"Revenue",
 *         "value":"$8,999.00",
 *         "additional":"30.00%"
 *       },
 *       {
 *         "label":"Revenue",
 *         "value":"$11,334.00",
 *         "additional":"30.00%"
 *       }
 *     ]
 *   ]
 * }
 */
function flattenTable(data) {

  //get row groups
  var rowGroups = [];
  for (var i = 0; i < data.rows.length; i++) {
    rowGroups = rowGroups.concat(getRowGroups(data.rows[i]));
  }

  //get column groups
  var columnGroups = getColumnGroups(getRootColumns(data.rows[0]));

  //get cells
  var cells = getCells(data);

  //split cells into rows
  var columnCount = getColumnCount(columnGroups);
  var rowCells = [];
  var currentRow = void 0;
  for (var _i3 = 0; _i3 < cells.length; _i3++) {
    if (_i3 % columnCount == 0) {
      currentRow = [];
      rowCells.push(currentRow);
    }
    currentRow.push(cells[_i3]);
  }

  return {
    rowGroups: rowGroups,
    columnGroups: columnGroups,
    cells: rowCells
  };

  function getColumnCount(columnGroups) {

    var count = 0;

    for (var _i4 = 0; _i4 < columnGroups.length; _i4++) {
      var group = columnGroups[_i4];
      if (group.groups) {
        count += getColumnCount(group.groups);
      } else {
        count++;
      }
    }

    return count;
  }

  function getCells(data, parent) {
    if (!parent) parent = data;

    var cells = [];

    if (data.rows && data.rows.length) {
      for (var _i5 = 0; _i5 < data.rows.length; _i5++) {
        var row = data.rows[_i5];
        cells = cells.concat(getCells(row, data));
      }
    } else if (data.columns && data.columns.length) {
      for (var _i6 = 0; _i6 < data.columns.length; _i6++) {
        var column = data.columns[_i6];
        cells = cells.concat(getCells(column, data));
      }
    } else if (data.content) {

      //extract cells here
      cells.push(data.content);
    }

    return cells;
  }

  function getRowGroups(data) {
    var groups = [];
    if (data.rows && data.rows.length) {
      var group = {
        title: data.title
      };
      groups.push(group);
      var subGroups = [];
      for (var _i7 = 0; _i7 < data.rows.length; _i7++) {
        subGroups = subGroups.concat(getRowGroups(data.rows[_i7]));
      }
      if (subGroups.length) group.groups = subGroups;
    }
    return groups;
  }

  function getRootColumns(data) {

    //drill down the rows
    var parent = data;
    while (data.rows) {
      parent = data;
      data = data.rows[0];
    }

    return parent.rows;
  }

  function getColumnGroups(data) {
    var groups = [];

    //process all root columns
    for (var x = 0; x < data.length; x++) {
      var column = data[x];

      //create group
      var group = {
        title: column.title
      };
      groups.push(group);

      //process sub columns
      if (column.columns && column.columns.length) {
        var subGroups = getColumnGroups(column.columns);
        if (subGroups.length) group.groups = subGroups;
      }
    }

    return groups;
  }
}

},{"../context":77}],88:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractFilters = extractFilters;
exports.parseFilter = parseFilter;
exports.removeFiltersString = removeFiltersString;
exports.applyFilter = applyFilter;

var _join = require('./join');

var JoinFilter = _interopRequireWildcard(_join);

var _max = require('./max');

var MaxFilter = _interopRequireWildcard(_max);

var _uppercase = require('./uppercase');

var UppercaseFilter = _interopRequireWildcard(_uppercase);

var _lowercase = require('./lowercase');

var LowercaseFilter = _interopRequireWildcard(_lowercase);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

/**
 * Filters library
 *
 * Provides functionality extract, parse and apply filters.
 */

/**
 * Load filter functions
 */
var filters = [JoinFilter, MaxFilter, UppercaseFilter, LowercaseFilter];

/**
 * Extracts filters from the placeholder string, e.g. firstName, lastName | & •
 *
 * @param {string} string
 * @returns {Array}
 */
function extractFilters(string) {

  //prepare filters array
  var extractedFilters = [];

  //get filters string, e.g. & • | upper
  //remove bracketed nested placeholders first, then split on first pipe
  var filtersString = string.replace(/\((.*)\)/g, '').split(/\|(.+)?/g)[1];
  if (filtersString && filtersString.length) {

    //get individual filters
    var filterStrings = filtersString.split(/\|/g);

    //parse filters
    extractedFilters = filterStrings.map(function (filterString) {
      return parseFilter(filterString);
    });
  }

  return extractedFilters;
}

/**
 * Parses the filter string, e.g. & •
 *
 * @param {string} filterString
 * @returns {Object}
 *
 * returned filter: {
 *   command: {string},
 *   param: {string}
 * }
 */
function parseFilter(filterString) {

  //get command
  var command = null;
  for (var i = 0; i < filters.length; i++) {
    if (filterString.startsWith(filters[i].name)) {
      command = filters[i].name;
      break;
    } else if (filterString.startsWith(filters[i].alias)) {
      command = filters[i].alias;
      break;
    }
  }

  //get param by removing the command from the string
  var param = filterString.substring(command.length);

  //create filter
  var filter = {
    command: command.trim()
  };

  //add param to filter
  if (param.length && param.trim().length) filter.param = param;

  return filter;
}

/**
 * Removes the filters part of a placeholder content string.
 *
 * @param {string} string
 * @returns {string}
 */
function removeFiltersString(string) {

  //get filters string, e.g. & • | upper
  //remove bracketed nested placeholders first, then split on first pipe
  var filtersString = string.replace(/\((.*)\)/g, '').split(/\|(.+)?/g)[1];

  //remove filters string from string
  return string.replace('|' + filtersString, '');
}

/**
 * Applies the supplied filter to the input to produce an output.
 *
 * @param {Object} filter
 * @param {Array/string} input
 */
function applyFilter(filter, input) {

  //find apply function for the specified filter
  var applyFunction = void 0;
  for (var i = 0; i < filters.length; i++) {
    if (filters[i].name == filter.command || filters[i].alias == filter.command) {
      applyFunction = filters[i].apply;
    }
  }

  //return input back as the apply function doesn't exist
  if (!applyFunction) return input;

  //apply filter to input, passing in the param
  return applyFunction(input, filter.param);
}

},{"./join":89,"./lowercase":90,"./max":91,"./uppercase":92}],89:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
/**
 * Join filter
 */

var name = exports.name = 'join';
var alias = exports.alias = '&';

/**
 * Joins an array of strings.
 *
 * @param {Array} inputStrings
 * @param {string} param
 * @returns {string}
 */
function apply(inputStrings, param) {

  log(inputStrings);
  log(param);

  //make sure that input strings is an array
  if (!(inputStrings instanceof Array)) return inputStrings;

  //get delimiter
  var delimiter = param;

  //filter out empty strings
  inputStrings = inputStrings.filter(function (inputString) {
    return inputString && inputString.length;
  });

  //join strings using delimiter
  return inputStrings.join(delimiter);
}

},{}],90:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
/**
 * Lowercase filter
 */

var name = exports.name = 'lower';
var alias = exports.alias = '';

/**
 * Converts the input string to lowercase.
 *
 * @param {string} string
 * @param {string} param
 * @returns {string}
 */
function apply(string, param) {
  return String(string).toLowerCase();
}

},{}],91:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
/**
 * Max length filter
 */

var name = exports.name = 'max';
var alias = exports.alias = '';

/**
 * Trims the input string to a max number of characters.
 *
 * @param {string} string
 * @param {string} param
 * @returns {string}
 */
function apply(string, param) {
  if (!string) return;

  //get max number of characters
  var maxCharacters = Number(param.trim());

  //trim string to max characters
  return string.substring(0, maxCharacters);
}

},{}],92:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.apply = apply;
/**
 * Uppercase filter
 */

var name = exports.name = 'upper';
var alias = exports.alias = '';

/**
 * Converts the input string to uppercase.
 *
 * @param {string} string
 * @param {string} param
 * @returns {string}
 */
function apply(string, param) {
  return String(string).toUpperCase();
}

},{}],93:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; /**
                                                                                                                                                                                                                                                                   * Gui library
                                                                                                                                                                                                                                                                   *
                                                                                                                                                                                                                                                                   * Provides functionality to create various user interface components.
                                                                                                                                                                                                                                                                   */

exports.showPopulatorDialog = showPopulatorDialog;
exports.createAlert = createAlert;
exports.createDataOptionsView = createDataOptionsView;
exports.createLayoutOptionsView = createLayoutOptionsView;
exports.createLabel = createLabel;
exports.createCheckbox = createCheckbox;
exports.createSelect = createSelect;

var _context = require('../context');

var _context2 = _interopRequireDefault(_context);

var _populator = require('./populator');

var Populator = _interopRequireWildcard(_populator);

var _options = require('./options');

var OPTIONS = _interopRequireWildcard(_options);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Creates and shows the complete dialog used when running populate commands and
 * returns the configuration selected by the user. It can be configured for all
 * types of populate commands.
 *
 * @param presets
 * @returns {Object}
 */
function showPopulatorDialog(type, opt) {

  //define titles
  var alertTitle = {
    json: 'Populate with JSON',
    preset: 'Populate with Preset',
    table: 'Populate Table'
  };

  //define descriptions
  var alertDesc = {
    json: "Please configure the options below.",
    preset: "Please select the Preset you'd like to use to populate your design and configure the options.",
    table: "Please configure the options below."
  };

  //create alert for type
  var alert = createAlert(alertTitle[type], alertDesc[type], 'icon.png');

  //get saved options
  var options = (0, OPTIONS.default)();

  //add preset options
  var presetList = void 0;
  if (type == Populator.POPULATE_TYPE.PRESET) {
    (function () {

      //get preset names array
      var presetNames = [];
      opt.presets.forEach(function (preset) {
        presetNames.push(preset.name);
      });

      //create list view
      var listView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 50));
      alert.addAccessoryView(listView);

      //create preset list title
      var presetListTitle = createLabel('Select Preset', 12, true, NSMakeRect(0, 30, 300, 20));
      listView.addSubview(presetListTitle);

      //create preset list
      presetList = createSelect(presetNames, 0, NSMakeRect(0, 0, 300, 25));
      listView.addSubview(presetList);

      //select last selected preset
      var lastSelectedPresetIndex = options[OPTIONS.SELECTED_PRESET_INDEX];
      if (lastSelectedPresetIndex && lastSelectedPresetIndex < presetNames.length) {
        presetList.selectItemAtIndex(lastSelectedPresetIndex);
      }

      //add space
      var spacerView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 5));
      alert.addAccessoryView(spacerView);
    })();
  }

  //create data options view (disable randomize if populating table)
  var dataOptionsView = createDataOptionsView({
    noRandomize: type == Populator.POPULATE_TYPE.TABLE
  });
  alert.addAccessoryView(dataOptionsView.view);

  //add grid layout options
  var layoutOptionsView = void 0;
  if (type != Populator.POPULATE_TYPE.TABLE) {

    //add space
    var spacerView2 = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 5));
    alert.addAccessoryView(spacerView2);

    //create layout options view
    layoutOptionsView = createLayoutOptionsView();
    alert.addAccessoryView(layoutOptionsView.view);

    //set rows text field as first responder
    var alertWindow = alert.alert().window();
    alertWindow.setInitialFirstResponder(layoutOptionsView.rowsCountTextField);
    alertWindow.setAutorecalculatesKeyViewLoop(true);
  }

  //add bottom buttons
  alert.addButtonWithTitle('Populate');
  alert.addButtonWithTitle('Cancel');

  //show alert
  var responseCode = alert.runModal();
  if (responseCode == '1000') {

    //get preset options
    if (presetList) {

      //get selected preset
      var selectedPresetIndex = presetList.indexOfSelectedItem();

      //add options to result
      options[OPTIONS.SELECTED_PRESET_INDEX] = selectedPresetIndex;
    }

    //get data options
    if (dataOptionsView) {

      //get randomize checkbox state
      var randomizeCheckbox = dataOptionsView.randomizeCheckbox;
      var randomizeData = Number(randomizeCheckbox.state());

      //get trim checkbox state
      var trimCheckbox = dataOptionsView.trimCheckbox;
      var trimText = Number(trimCheckbox.state());

      //get ellipsis checkbox state
      var ellipsisCheckbox = dataOptionsView.ellipsisCheckbox;
      var insertEllipsis = Number(ellipsisCheckbox.state());

      //get default substitute
      var substituteTextField = dataOptionsView.substituteTextField;
      var defaultSubstitute = String(substituteTextField.stringValue());

      //add options to result
      options[OPTIONS.RANDOMIZE_DATA] = randomizeData;
      options[OPTIONS.TRIM_TEXT] = trimText;
      options[OPTIONS.INSERT_ELLIPSIS] = insertEllipsis;
      options[OPTIONS.DEFAULT_SUBSTITUTE] = defaultSubstitute;
    }

    //get layout options
    if (layoutOptionsView) {

      //get create grid checkbox state
      var createGridCheckbox = layoutOptionsView.createGridCheckbox;
      var isCreateGrid = Number(createGridCheckbox.state());

      //get grid config
      var rowsCountTextField = layoutOptionsView.rowsCountTextField;
      var rowsCount = Number(rowsCountTextField.stringValue().split(/[.,]/g)[0]);
      var rowsMarginTextField = layoutOptionsView.rowsMarginTextField;
      var rowsMargin = Number(rowsMarginTextField.stringValue().replace(/,/g, '.'));
      var columnsCountTextField = layoutOptionsView.columnsCountTextField;
      var columnsCount = Number(columnsCountTextField.stringValue().split(/[.,]/g)[0]);
      var columnsMarginTextField = layoutOptionsView.columnsMarginTextField;
      var columnsMargin = Number(columnsMarginTextField.stringValue().replace(/,/g, '.'));

      //add options to result
      options[OPTIONS.CREATE_GRID] = isCreateGrid;
      options[OPTIONS.ROWS_COUNT] = rowsCount;
      options[OPTIONS.ROWS_MARGIN] = rowsMargin;
      options[OPTIONS.COLUMNS_COUNT] = columnsCount;
      options[OPTIONS.COLUMNS_MARGIN] = columnsMargin;
    }

    //return configured options
    return options;
  }
}

/**
 * Creates a new alert with a title, message and icon.
 *
 * @param {string} title
 * @param {string} message
 * @param {string} iconFileName
 * @returns {COSAlertWindow}
 */
function createAlert(title, message, iconFileName) {

  var alert = COSAlertWindow.new();
  alert.setMessageText(title);
  alert.setInformativeText(message);

  if (iconFileName) {

    //get icon path
    var iconUrl = (0, _context2.default)().plugin.urlForResourceNamed(iconFileName);

    //set icon
    var icon = NSImage.alloc().initByReferencingFile(iconUrl.path());
    alert.setIcon(icon);
  }

  return alert;
}

/**
 * Creates a set of views that comprise the data options view show in the alert.
 *
 * @param {Object} opt
 * @returns {Object}
 *
 * opt: {
 *   noRandomize: {boolean}
 * }
 */
function createDataOptionsView(opt) {

  //get options
  var options = _extends({}, (0, OPTIONS.default)(), opt);

  //create options view
  var optionsView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 110));

  //create options view title
  var optionsViewTitle = createLabel('Data options', 12, true, NSMakeRect(0, 90, 300, 20));
  optionsView.addSubview(optionsViewTitle);

  //create randomize checkbox
  var randomizeCheckbox = createCheckbox('Randomize data order', false, NSMakeRect(0, 65, 300, 20));
  optionsView.addSubview(randomizeCheckbox);

  //set randomize checkbox state
  randomizeCheckbox.setState(options[OPTIONS.RANDOMIZE_DATA]);

  //disable randomize checkbox if randomizing is not allowed
  if (options.noRandomize) {

    //set randomize checkbox state
    randomizeCheckbox.setState(false);
    randomizeCheckbox.setEnabled(false);
  }

  //create trim checkbox
  var trimCheckbox = createCheckbox('Trim overflowing text (fixed width text layers)', false, NSMakeRect(0, 45, 300, 20));
  optionsView.addSubview(trimCheckbox);

  //set trim checkbox state
  trimCheckbox.setState(options[OPTIONS.TRIM_TEXT]);

  //create ellipsis checkbox
  var ellipsisCheckbox = createCheckbox('Insert ellipsis after trimmed text', false, NSMakeRect(0, 25, 300, 20));
  optionsView.addSubview(ellipsisCheckbox);

  //set ellipsis checkbox state
  ellipsisCheckbox.setState(options[OPTIONS.INSERT_ELLIPSIS]);

  //create substitute label
  var substituteLabel = createLabel('Default substitute:', 12, false, NSMakeRect(0, 0, 110, 20));
  optionsView.addSubview(substituteLabel);

  //create substitute text field
  var substituteTextField = NSTextField.alloc().initWithFrame(NSMakeRect(110, 0, 120, 22));
  optionsView.addSubview(substituteTextField);

  //set substitute
  if (options[OPTIONS.DEFAULT_SUBSTITUTE]) {
    substituteTextField.setStringValue(options[OPTIONS.DEFAULT_SUBSTITUTE]);
  } else {
    substituteTextField.setStringValue('');
  }

  //return configured view
  return {
    view: optionsView,
    randomizeCheckbox: randomizeCheckbox,
    trimCheckbox: trimCheckbox,
    ellipsisCheckbox: ellipsisCheckbox,
    substituteTextField: substituteTextField
  };
}

/**
 * Creates a set of views that comprise the layout options view show in the alert.
 *
 * @returns {Object}
 */
function createLayoutOptionsView() {

  //get options
  var options = (0, OPTIONS.default)();

  //create options view
  var optionsView = NSView.alloc().initWithFrame(NSMakeRect(0, 0, 300, 104));

  //create options view title
  var optionsViewTitle = createLabel('Layout options', 12, true, NSMakeRect(0, 84, 300, 20));
  optionsView.addSubview(optionsViewTitle);

  //create create grid checkbox
  var createGridCheckbox = createCheckbox('Create grid', false, NSMakeRect(0, 59, 300, 20));
  optionsView.addSubview(createGridCheckbox);

  //set randomize checkbox state
  createGridCheckbox.setState(options[OPTIONS.CREATE_GRID]);

  //create rows count label
  var rowsCountLabel = createLabel('Rows:', 12, false, NSMakeRect(0, 27, 60, 20));
  optionsView.addSubview(rowsCountLabel);

  //create rows count text field
  var rowsCountTextField = NSTextField.alloc().initWithFrame(NSMakeRect(60, 27, 70, 22));
  optionsView.addSubview(rowsCountTextField);

  //set rows count
  if (options[OPTIONS.ROWS_COUNT]) {
    rowsCountTextField.setStringValue(options[OPTIONS.ROWS_COUNT]);
  } else {
    rowsCountTextField.setStringValue('1');
  }

  //create rows margin label
  var rowsMarginLabel = createLabel('Margin:', 12, false, NSMakeRect(142, 27, 50, 20));
  optionsView.addSubview(rowsMarginLabel);

  //create rows margin text field
  var rowsMarginTextField = NSTextField.alloc().initWithFrame(NSMakeRect(190, 27, 70, 22));
  optionsView.addSubview(rowsMarginTextField);

  //set rows margin
  if (options[OPTIONS.ROWS_MARGIN]) {
    rowsMarginTextField.setStringValue(options[OPTIONS.ROWS_MARGIN]);
  } else {
    rowsMarginTextField.setStringValue('10');
  }

  //create columns count label
  var columnsCountLabel = createLabel('Columns:', 12, false, NSMakeRect(0, 0, 60, 20));
  optionsView.addSubview(columnsCountLabel);

  //create columns count text field
  var columnsCountTextField = NSTextField.alloc().initWithFrame(NSMakeRect(60, 0, 70, 22));
  optionsView.addSubview(columnsCountTextField);

  //set columns count
  if (options[OPTIONS.COLUMNS_COUNT]) {
    columnsCountTextField.setStringValue(options[OPTIONS.COLUMNS_COUNT]);
  } else {
    columnsCountTextField.setStringValue('1');
  }

  //create columns margin label
  var columnsMarginLabel = createLabel('Margin:', 12, false, NSMakeRect(142, 0, 50, 20));
  optionsView.addSubview(columnsMarginLabel);

  //create columns margin text field
  var columnsMarginTextField = NSTextField.alloc().initWithFrame(NSMakeRect(190, 0, 70, 22));
  optionsView.addSubview(columnsMarginTextField);

  //set columns margin
  if (options[OPTIONS.COLUMNS_MARGIN]) {
    columnsMarginTextField.setStringValue(options[OPTIONS.COLUMNS_MARGIN]);
  } else {
    columnsMarginTextField.setStringValue('10');
  }

  //return configured view
  return {
    view: optionsView,
    createGridCheckbox: createGridCheckbox,
    rowsCountTextField: rowsCountTextField,
    rowsMarginTextField: rowsMarginTextField,
    columnsCountTextField: columnsCountTextField,
    columnsMarginTextField: columnsMarginTextField
  };
}

/**
 * Creates an NSTextField styled as a label.
 *
 * @param {string} text
 * @param {int} fontSize
 * @param {boolean} bold
 * @param {NSRect} frame
 * @returns {NSTextField}
 */
function createLabel(text, fontSize, bold, frame) {

  //create label
  var label = NSTextField.alloc().initWithFrame(frame);
  label.setStringValue(text);

  //set font
  if (bold) {
    label.setFont(NSFont.boldSystemFontOfSize(fontSize));
  } else {
    label.setFont(NSFont.systemFontOfSize(fontSize));
  }

  //set properties to make the text field look like a label
  label.setBezeled(false);
  label.setDrawsBackground(false);
  label.setEditable(false);
  label.setSelectable(false);

  return label;
}

/**
 * Creates an NSButton styled as a checkbox.
 *
 * @param {string} text
 * @param {boolean} checked
 * @param {NSRect} frame
 * @returns {NSButton}
 */
function createCheckbox(text, checked, frame) {

  //convert boolean to NSState
  checked = checked == false ? NSOffState : NSOnState;

  //create checkbox button
  var checkbox = NSButton.alloc().initWithFrame(frame);
  checkbox.setButtonType(NSSwitchButton);
  checkbox.setBezelStyle(0);
  checkbox.setTitle(text);
  checkbox.setState(checked);

  return checkbox;
}

/**
 * Creates an NSPopUpButton that can be used as a list select menu.
 *
 * @param {Array} items
 * @param {int} selectedIndex
 * @param {NSRect} frame
 * @returns {NSPopUpButton}
 */
function createSelect(items, selectedIndex, frame) {

  //create select
  var select = NSPopUpButton.alloc().initWithFrame_pullsDown(frame, false);

  //add items to the list
  select.addItemsWithTitles(items);
  select.selectItemAtIndex(selectedIndex);

  return select;
}

},{"../context":77,"./options":95,"./populator":97}],94:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ANY = exports.SYMBOL_MASTER = exports.SYMBOL = exports.BITMAP = exports.SHAPE = exports.TEXT = exports.GROUP = exports.ARTBOARD = exports.PAGE = undefined;
exports.findLayersInLayer = findLayersInLayer;
exports.findLayerInLayer = findLayerInLayer;
exports.findLayersInLayers = findLayersInLayers;
exports.findLayerInLayers = findLayerInLayers;
exports.findPageWithName = findPageWithName;
exports.refreshTextLayer = refreshTextLayer;
exports.getSelectedLayers = getSelectedLayers;
exports.selectLayers = selectLayers;
exports.addPage = addPage;
exports.removePage = removePage;
exports.isSymbolInstance = isSymbolInstance;
exports.isSymbolMaster = isSymbolMaster;
exports.isLayerGroup = isLayerGroup;
exports.isLayerShapeGroup = isLayerShapeGroup;
exports.isLayerBitmap = isLayerBitmap;
exports.isLayerText = isLayerText;
exports.isArtboard = isArtboard;
exports.createGrid = createGrid;

var _context = require('../context');

var _context2 = _interopRequireDefault(_context);

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Layers library
 *
 * Provides functionality to get, find, check or otherwise manipulate layers.
 */

var PAGE = exports.PAGE = 'MSPage';
var ARTBOARD = exports.ARTBOARD = 'MSArtboardGroup';
var GROUP = exports.GROUP = 'MSLayerGroup';
var TEXT = exports.TEXT = 'MSTextLayer';
var SHAPE = exports.SHAPE = 'MSShapeGroup';
var BITMAP = exports.BITMAP = 'MSBitmapLayer';
var SYMBOL = exports.SYMBOL = 'MSSymbolInstance';
var SYMBOL_MASTER = exports.SYMBOL_MASTER = 'MSSymbolMaster';
var ANY = exports.ANY = null;

/**
 * Finds layers with specified name in the root layer. The name can be set to '*'
 * and exactMatch to false, in which case all layers are returned.
 *
 * @param {string} name
 * @param {boolean} exactMatch
 * @param {string} type
 * @param {MSLayer} rootLayer
 * @param {boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {Array}
 */
function findLayersInLayer(name, exactMatch, type, rootLayer, subLayersOnly, layersToExclude) {

  //create predicate format
  var formatRules = ['(name != NULL)'];
  var args = [];

  //name
  if (name) {
    if (exactMatch) {
      formatRules.push('(name == %@)');
    } else {
      formatRules.push('(name like %@)');
    }
    args.push(name);
  }

  //type
  if (type) {
    formatRules.push('(className == %@)');
    args.push(type);
  } else {
    formatRules.push('(className == "MSLayerGroup" OR className == "MSShapeGroup" OR className == "MSArtboardGroup" OR className == "MSTextLayer")');
  }

  //layers to exclude
  if (layersToExclude) {
    formatRules.push('NOT (SELF IN %@)');
    args.push(layersToExclude);
  }

  //prepare format string
  var formatString = formatRules.join(' AND ');

  //create predicate
  var predicate = NSPredicate.predicateWithFormat_argumentArray(formatString, args);

  //get layers to filter
  var layers = void 0;
  if (subLayersOnly) {
    layers = rootLayer.layers();
  } else {
    layers = rootLayer.children();
  }

  //perform query
  var queryResult = layers.filteredArrayUsingPredicate(predicate);

  //return result as js array
  return Utils.convertToJSArray(queryResult);
}

/**
 * Finds a single layer in the root layer.
 *
 * @param {string} name
 * @param {boolean} exactMatch
 * @param {string} type
 * @param {MSLayer} rootLayer
 * @param {boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {MSLayer}
 */
function findLayerInLayer(name, exactMatch, type, rootLayer, subLayersOnly, layersToExclude) {
  var result = findLayersInLayer(name, exactMatch, type, rootLayer, subLayersOnly, layersToExclude);

  //return first layer in result
  if (result.length) return result[0];
}

/**
 * Finds a set of layer in a set of root layers.
 *
 * @param {string} name
 * @param {boolean} exactMatch
 * @param {string} type
 * @param {MSLayer} rootLayers
 * @param {boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {array}
 */
function findLayersInLayers(name, exactMatch, type, rootLayers, subLayersOnly, layersToExclude) {

  var layers = [];
  rootLayers.forEach(function (rootLayer) {
    var result = findLayersInLayer(name, exactMatch, type, rootLayer, subLayersOnly, layersToExclude);
    layers = layers.concat(result);
  });

  //return all found layers
  return layers;
}

/**
 * Finds a single layer in a set of root layers.
 *
 * @param {string} name
 * @param {boolean} exactMatch
 * @param {string} type
 * @param {MSLayer} rootLayers
 * @param {boolean} subLayersOnly
 * @param {Array} layersToExclude
 * @returns {array}
 */
function findLayerInLayers(name, exactMatch, type, rootLayers, subLayersOnly, layersToExclude) {
  var result = findLayersInLayers(name, exactMatch, type, rootLayers, subLayersOnly, layersToExclude);

  //return first layer in result
  if (result.length) return result[0];
}

/**
 * Finds a page with the specified name in the current document.
 *
 * @param {string} name
 * @param {boolean} fullMatch
 * @returns {MSPage}
 */
function findPageWithName(name, fullMatch) {

  var doc = MSDocument.currentDocument();
  var pages = jsArray(doc.pages());
  for (var i = 0; i < pages.length; i++) {
    var currentPage = pages[i];

    //if page matches name
    if (fullMatch) {
      if (currentPage.name() == name) {
        return currentPage;
      }
    } else {
      if (currentPage.name().indexOf(name) > -1) {
        return currentPage;
      }
    }
  }
}

/**
 * Refreshes text layer boundaries after setting text. This is used as Sketch
 * sometimes forgets to resize the text layer.
 *
 * @param layer
 */
function refreshTextLayer(layer) {
  layer.adjustFrameToFit();
  layer.select_byExpandingSelection(true, false);
  layer.setIsEditingText(true);
  layer.setIsEditingText(false);
  layer.select_byExpandingSelection(false, false);
}

/**
 * Returns the currently selected layers as a Javascript array.
 *
 * @returns {Array}
 */
function getSelectedLayers() {
  return Utils.convertToJSArray((0, _context2.default)().document.selectedLayers());
}

/**
 * Sets the current layer selection to the provided layers.
 *
 * @param {Array} layers
 */
function selectLayers(layers) {

  //deselect all layers
  var selectedLayers = getSelectedLayers();
  selectedLayers.forEach(function (layer) {
    layer.select_byExpandingSelection(false, false);
  });

  //select layers
  layers.forEach(function (layer) {
    layer.select_byExpandingSelection(true, true);
  });
}

/**
 * Adds a page with the specified name to the current document.
 *
 * @param {string} name
 * @returns {MSPage}
 */
function addPage(name) {

  //get doc
  var doc = (0, _context2.default)().document;

  //get current page
  var currentPage = doc.currentPage();

  //create new page
  var page = doc.addBlankPage();
  page.setName(name);

  //make current page active again
  doc.setCurrentPage(currentPage);

  return page;
}

/**
 * Removes the page with the specified name from the current document.
 *
 * @param {MSPage} page
 */
function removePage(page) {

  //get doc
  var doc = (0, _context2.default)().document;

  //get current page
  var currentPage = doc.currentPage();

  //remove page
  doc.removePage(page);

  //make current page active again
  doc.setCurrentPage(currentPage);
}

/**
 * Checks if the layer is a symbol instance.
 *
 * @param {MSLayer} layer
 * @returns {boolean}
 */
function isSymbolInstance(layer) {
  return layer.isKindOfClass(MSSymbolInstance.class());
}

/**
 * Checks if the layer is a symbol master.
 *
 * @param {MSLayer} layer
 * @returns {boolean}
 */
function isSymbolMaster(layer) {
  return layer.isKindOfClass(MSSymbolMaster.class());
}

/**
 * Checks if the layer is a layer group.
 *
 * @param {MSLayer} layer
 * @returns {boolean}
 */
function isLayerGroup(layer) {
  return layer.isKindOfClass(MSLayerGroup.class()) && !layer.isKindOfClass(MSShapeGroup.class());
}

/**
 * Checks if the layer is a shape/shape group.
 *
 * @param {MSLayer} layer
 * @returns {boolean}
 */
function isLayerShapeGroup(layer) {
  return layer.isKindOfClass(MSShapeGroup.class());
}

/**
 * Checks if the layer is a bitmap layer.
 *
 * @param {MSLayer} layer
 * @returns {boolean}
 */
function isLayerBitmap(layer) {
  return layer.isKindOfClass(MSBitmapLayer.class());
}

/**
 * Checks if the layer is a text layer.
 *
 * @param {MSLayer} layer
 * @returns {boolean}
 */
function isLayerText(layer) {
  return layer.isKindOfClass(MSTextLayer.class());
}

/**
 * Checks if the layer is an artboard.
 *
 * @param {MSLayer} layer
 * @returns {boolean}
 */
function isArtboard(layer) {
  return layer.isKindOfClass(MSArtboardGroup.class());
}

/**
 * Creates a grid from layers.
 *
 * @param selectedLayers
 * @param opt
 * @returns {Array}
 */
function createGrid(selectedLayers, opt) {

  //check rows count
  if (!opt.rowsCount || opt.rowsCount < 0) {
    (0, _context2.default)().document.showMessage('Number of grid rows must be at least 1.');
    return;
  }

  //check rows margin
  if (!opt.rowsMargin && opt.rowsMargin != 0) {
    (0, _context2.default)().document.showMessage('Grid row margin is invalid.');
    return;
  }

  //check column count
  if (!opt.columnsCount || opt.columnsCount < 0) {
    (0, _context2.default)().document.showMessage('Number of grid columns must be at least 1.');
    return;
  }

  //check columns margin
  if (!opt.columnsMargin && opt.columnsMargin != 0) {
    (0, _context2.default)().document.showMessage('Grid column margin is invalid.');
    return;
  }

  //get first layer (most top left)
  var layer = selectedLayers[0];
  var smallestX = selectedLayers[0].frame().x();
  var smallestY = selectedLayers[0].frame().y();
  for (var i = 0; i < selectedLayers.length; i++) {
    var tempLayer = selectedLayers[i];
    if (tempLayer.frame().x() < smallestX || tempLayer.frame().y() < smallestY) {
      smallestX = tempLayer.frame().x();
      smallestY = tempLayer.frame().y();
      layer = tempLayer;
    }
  }

  //arrange copies of the first layer
  var layerWidth = layer.frame().width();
  var layerHeight = layer.frame().height();
  var layerParent = layer.parentGroup();
  if (!layerParent) layerParent = layer.parentArtboard();
  if (!layerParent) layerParent = layer.parentPage();

  //remove selected layers from parent
  selectedLayers.forEach(function (tempLayer) {
    tempLayer.removeFromParent();
  });

  //keep track of original position
  var startX = layer.frame().x();
  var startY = layer.frame().y();

  //store new selected layers
  var newSelectedLayers = [];

  //create rows
  for (var _i = 0; _i < opt.rowsCount; _i++) {

    //set row y
    var y = startY + _i * (layerHeight + opt.rowsMargin);

    //create columns
    for (var j = 0; j < opt.columnsCount; j++) {

      //create layer copy
      var copy = Utils.copyLayer(layer);

      //add to parent layer
      layerParent.addLayers([copy]);

      //add to selected layers
      newSelectedLayers.push(copy);

      //set column x
      var x = startX + j * (layerWidth + opt.columnsMargin);

      //position copy
      copy.frame().setX(x);
      copy.frame().setY(y);
    }
  }

  return newSelectedLayers;
}

},{"../context":77,"./utils":98}],95:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.LAST_DATA_PATH = exports.LAST_TSV_PATH = exports.LAST_JSON_PATH = exports.SELECTED_PRESET_INDEX = exports.LAST_POPULATE_TYPE = exports.COLUMNS_MARGIN = exports.COLUMNS_COUNT = exports.ROWS_MARGIN = exports.ROWS_COUNT = exports.CREATE_GRID = exports.DEFAULT_SUBSTITUTE = exports.INSERT_ELLIPSIS = exports.TRIM_TEXT = exports.RANDOMIZE_DATA = undefined;

exports.default = function (newOptions) {

  //set new options
  if (newOptions) {
    OPTIONS.forEach(function (key) {

      //save into user defaults
      if (newOptions.hasOwnProperty(key)) {
        NSUserDefaults.standardUserDefaults().setObject_forKey(newOptions[key], 'SketchDataPopulator_' + key);
      }
    });

    //sync defaults
    NSUserDefaults.standardUserDefaults().synchronize();
  }

  //get options
  var options = {};
  OPTIONS.map(function (key) {

    //get options from user defaults
    var option = NSUserDefaults.standardUserDefaults().objectForKey('SketchDataPopulator_' + key);

    //convert to correct type and set
    if (option) {
      options[key] = Utils.parsePrimitives(String(option));
    }
  });

  return options;
};

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

//data options
var RANDOMIZE_DATA = exports.RANDOMIZE_DATA = 'randomizeData'; /**
                                                                * Options library
                                                                *
                                                                * Provides functionality to get and set user options shared across the plugin.
                                                                */

var TRIM_TEXT = exports.TRIM_TEXT = 'trimText';
var INSERT_ELLIPSIS = exports.INSERT_ELLIPSIS = 'insertEllipsis';
var DEFAULT_SUBSTITUTE = exports.DEFAULT_SUBSTITUTE = 'defaultSubstitute';

//layout options
var CREATE_GRID = exports.CREATE_GRID = 'createGrid';
var ROWS_COUNT = exports.ROWS_COUNT = 'rowsCount';
var ROWS_MARGIN = exports.ROWS_MARGIN = 'rowsMargin';
var COLUMNS_COUNT = exports.COLUMNS_COUNT = 'columnsCount';
var COLUMNS_MARGIN = exports.COLUMNS_MARGIN = 'columnsMargin';

//populator options
var LAST_POPULATE_TYPE = exports.LAST_POPULATE_TYPE = 'lastPopulateType';
var SELECTED_PRESET_INDEX = exports.SELECTED_PRESET_INDEX = 'selectedPresetIndex';

//path options
var LAST_JSON_PATH = exports.LAST_JSON_PATH = 'lastJSONPath';
var LAST_TSV_PATH = exports.LAST_TSV_PATH = 'lastTSVPath';
var LAST_DATA_PATH = exports.LAST_DATA_PATH = 'lastDataPath';

var OPTIONS = [RANDOMIZE_DATA, TRIM_TEXT, INSERT_ELLIPSIS, DEFAULT_SUBSTITUTE, CREATE_GRID, ROWS_COUNT, ROWS_MARGIN, COLUMNS_COUNT, COLUMNS_MARGIN, LAST_POPULATE_TYPE, SELECTED_PRESET_INDEX, LAST_JSON_PATH, LAST_TSV_PATH, LAST_DATA_PATH];

/**
 * Gets or sets the stored options in user defaults.
 *
 * @returns {Object}
 */

},{"./utils":98}],96:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.extractPlaceholders = extractPlaceholders;
exports.parsePlaceholder = parsePlaceholder;
exports.populatePlaceholder = populatePlaceholder;

var _get = require('lodash/get');

var _get2 = _interopRequireDefault(_get);

var _filters = require('./filters');

var Filters = _interopRequireWildcard(_filters);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Extracts placeholders from a string. Placeholders are identified by {}.
 *
 * @param {string} string
 * @returns {Array}
 */
/**
 * Placeholders library
 *
 * Provides functionality to extract, parse and populate placeholders.
 */

function extractPlaceholders(string) {

  //get placeholders
  var placeholders = [];

  //match placeholders identified by {}
  var regex = /(?![^(]*\)|[^\[]*]){([^}]+)}/g;
  var match = void 0;
  while (match = regex.exec(string)) {

    //parse placeholder
    var parsedPlaceholder = parsePlaceholder(match[0]);

    //add to placeholders array
    placeholders.push(parsedPlaceholder);
  }

  return placeholders;
}

/**
 * Parses the placeholder. The string contains the content of the placeholder
 * without being wrapped in () or {}, e.g. firstName, lastName | & •
 *
 * @param {string} placeholderString
 * @returns {Object}
 *
 * Example placeholders (shown with {}):
 *
 * - {firstName}, {name.first} - John
 * - {firstName, lastName | & • } - John • Doe
 * - {(lastName?, firstName | &, ), DOB | & born on } - Doe, John born on 14/07/1970
 * - {firstName | upper} - JOHN
 * - {firstName | upper | max 2} - JO
 * - {(firstName | upper | max 2), (lastName | max 1) | & • } - JO • D
 * - {keypath?} - The default substitute
 * - {keypath?not available} - not available
 * - {firstName?First name not available, lastName?No last name, DOB? | & - }
 * - TODO: quotation marks {firstName?"First name, not | available \" ,,", lastName?'No, \' | last name', DOB? | & - }
 *   TODO:                '{firstName?"First name, not | available \\" ,,", lastName?\'No, \\\' | last name\', DOB? | & - }'
 *
 * Example nesting:
 * - {(lastName?'', firstName | &, ), DOB | & born on }
 *   - (lastName?'', firstName | &, )
 *     - lastName?''
 *     - firstName
 *   - DOB
 *
 * returned placeholder format: [{
 *   string: {string}, - the original text of the placeholder, e.g. {name.first}
 *   keypath: {string}, - the path to the data, e.g. name.first
 *   filters: {Array}, - filters applied through the pipe character, adding in the correct order
 *   substitute: {string}, - string to use in case the placeholder resolves to an empty string
 *   placeholders: {Array} - nested placeholders with the same format as this placeholder
 * }]
 *
 * Example parsed placeholders:
 *
 * [
 *   {
 *     "string":"{firstName}",
 *     "keypath":"firstName"
 *   },
 *
 *   {
 *     "string":"{name.first}",
 *     "keypath":"name.first"
 *   },
 *
 *   {
 *     "string":"{firstName, lastName | & • }",
 *     "filters":[
 *       {
 *         "command":"&",
 *         "param":" • "
 *       }
 *     ],
 *     "placeholders":[
 *       {
 *         "string":"firstName",
 *         "keypath":"firstName"
 *       },
 *       {
 *         "string":"lastName",
 *         "keypath":"lastName"
 *       }
 *     ]
 *   },
 *   {
 *     "string":"{firstName | upper}",
 *     "filters":[
 *       {
 *         "command":"upper"
 *       }
 *     ],
 *     "keypath":"firstName"
 *   },
 *   {
 *     "string":"{firstName | upper | max 2}",
 *     "filters":[
 *       {
 *         "command":"upper"
 *       },
 *       {
 *         "command":"max",
 *         "param":" 2"
 *       }
 *     ],
 *     "keypath":"firstName"
 *   },
 *   {
 *     "string":"{(firstName | upper | max 2), (lastName | max 1) | & • }",
 *     "filters":[
 *       {
 *         "command":"&",
 *         "param":" • "
 *
 *       }
 *     ],
 *     "placeholders":[
 *       {
 *         "string":"(firstName | upper | max 2)",
 *         "filters":[
 *           {
 *             "command":"upper"
 *           },
 *           {
 *             "command":"max",
 *             "param":" 2"
 *           }
 *         ],
 *         "keypath":"firstName"
 *       },
 *       {
 *         "string":"(lastName | max 1)",
 *         "filters":[
 *           {
 *             "command":"max",
 *             "param":" 1"
 *           }
 *         ],
 *         "keypath":"lastName"
 *       }
 *     ]
 *   },
 *   {
 *     "string":"{keypath?}",
 *     "keypath":"keypath",
 *     "substitute":true
 *   },
 *   {
 *
 *     "string":"{keypath?not available}",
 *     "keypath":"keypath",
 *     "substitute":"not available"
 *   },
 *   {
 *
 *     "string":"{firstName?First name not available, lastName?No last name, DOB? | & - }",
 *     "filters":[
 *       {
 *         "command":"&",
 *         "param":" - "
 *
 *       }
 *     ],
 *     "placeholders":[
 *       {
 *         "string":"firstName?First name not available",
 *         "keypath":"firstName",
 *         "substitute":"First name not available"
 *       },
 *       {
 *         "string":"lastName?No last name",
 *         "keypath":"lastName",
 *         "substitute":"No last name"
 *       },
 *       {
 *         "string":"DOB?",
 *         "keypath":"DOB",
 *         "substitute":true
 *       }
 *     ]
 *   }
 * ]
 */
function parsePlaceholder(placeholderString) {

  //prepare placeholder
  var placeholder = {
    string: placeholderString
  };

  //get placeholder content
  var placeholderContent = placeholderString;
  if (isGroupedPlaceholder(placeholderString) || isRootPlaceholder(placeholderString)) {
    placeholderContent = placeholderContent.substr(1, placeholderContent.length - 2);
  }

  //get filters
  var filters = Filters.extractFilters(placeholderContent);
  if (filters.length) {

    //get placeholder filters
    placeholder.filters = filters;

    //remove filters string from placeholder content
    placeholderContent = Filters.removeFiltersString(placeholderContent);
  }

  //get nested placeholders
  var groupingLevel = 0;
  var nestedPlaceholders = [];
  var buffer = '';
  for (var i = 0; i < placeholderContent.length; i++) {

    //get character of content
    var char = placeholderContent[i];

    //adjust placeholder grouping level
    if (char == '(') groupingLevel++;
    if (char == ')') groupingLevel--;

    //if comma and not nested or if last character
    if (char == ',' && groupingLevel == 0 || i == placeholderContent.length - 1) {

      //add the character in case it's the last character
      if (char != ',') buffer += char;

      //trim and add placeholder
      nestedPlaceholders.push(buffer.trim());

      //reset placeholder buffer
      buffer = '';
    } else {

      //append the character to buffer
      buffer += char;
    }
  }

  //parse nested placeholders if there are more than one or the one is a grouped placeholder
  if (nestedPlaceholders.length > 1 || isGroupedPlaceholder(nestedPlaceholders[0])) {

    //set nested placeholders of the placeholder
    placeholder.placeholders = nestedPlaceholders.map(function (nestedPlaceholder) {

      //recur to parse nested placeholder
      return parsePlaceholder(nestedPlaceholder);
    });
  }

  //parse a single ungrouped placeholder, the base case for the recursive function
  else if (nestedPlaceholders[0] && nestedPlaceholders[0].length) {
      var nestedPlaceholder = nestedPlaceholders[0];

      //split into components, dividing into the keypath and substitute
      var placeholderComponents = nestedPlaceholder.split('?');

      //check if has substitute
      if (placeholderComponents.length == 2) {

        //set keypath
        placeholder.keypath = placeholderComponents[0].trim();

        //set substitute
        if (placeholderComponents[1]) {
          placeholder.substitute = placeholderComponents[1].trim();
        } else {

          //set to true to signify that a default substitute should be used
          placeholder.substitute = true;
        }
      } else {

        //set keypath to the placeholder itself since there is no substitute
        placeholder.keypath = nestedPlaceholder;
      }
    }

  return placeholder;
}

/**
 * Populates a placeholder with data, returning the populated string.
 *
 * @param {Object} placeholder
 * @param {Object} data
 * @param {string} defaultSubstitute
 * @returns {string}
 */
function populatePlaceholder(placeholder, data, defaultSubstitute) {

  //prepare populated string/array
  var populated = void 0;

  //populate nested placeholders
  if (placeholder.placeholders) {

    //populate and add to array of populated nested placeholders
    populated = placeholder.placeholders.map(function (nestedPlaceholder) {
      return populatePlaceholder(nestedPlaceholder, data, defaultSubstitute);
    });
  }

  //no nested placeholders, this is the base case
  else {

      //populate with data for keypath
      populated = (0, _get2.default)(data, placeholder.keypath);

      //check if substitute is needed
      if (!populated) {

        //true signifies to use default substitute
        if (placeholder.substitute === true) {
          populated = defaultSubstitute;
        }

        //use specified substitute
        else if (placeholder.substitute && placeholder.substitute.length) {
            populated = placeholder.substitute;
          }

          //return empty string when no substitute should be used
          else {
              populated = '';
            }
      }
    }

  //apply filters
  if (placeholder.filters) {
    placeholder.filters.forEach(function (filter) {
      populated = Filters.applyFilter(filter, populated);
    });
  }

  //make sure that populated is always a string before returning
  //it could be an array if a filter apply function was not found
  if (populated instanceof Array) {
    populated = populated.join(' ');
  }

  return String(populated);
}

/**
 * Checks if the placeholder is grouped. A placeholder is grouped if it's wrapped
 * within parentheses.
 *
 * @param {string} placeholder
 * @returns {boolean}
 */
function isGroupedPlaceholder(placeholder) {
  return placeholder && placeholder[0] == '(' && placeholder[placeholder.length - 1] == ')';
}

/**
 * Checks if the placeholder is a root placeholder. A placeholder is root if it's wrapped
 * within {}.
 *
 * @param {string} placeholder
 * @returns {boolean}
 */
function isRootPlaceholder(placeholder) {
  return placeholder && placeholder[0] == '{' && placeholder[placeholder.length - 1] == '}';
}

},{"./filters":88,"lodash/get":59}],97:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.POPULATE_TYPE = undefined;
exports.populateTable = populateTable;
exports.populateLayers = populateLayers;
exports.populateLayer = populateLayer;
exports.clearLayer = clearLayer;

var _context = require('../context');

var _context2 = _interopRequireDefault(_context);

var _utils = require('./utils');

var Utils = _interopRequireWildcard(_utils);

var _data = require('./data');

var Data = _interopRequireWildcard(_data);

var _layers = require('./layers');

var Layers = _interopRequireWildcard(_layers);

var _placeholders = require('./placeholders');

var Placeholders = _interopRequireWildcard(_placeholders);

var _args = require('./args');

var Args = _interopRequireWildcard(_args);

var _actions = require('./actions');

var Actions = _interopRequireWildcard(_actions);

var _swapSymbol = require('./actions/swapSymbol');

var SwapSymbolAction = _interopRequireWildcard(_swapSymbol);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Populate types:
 */
/**
 * Populator library
 *
 * Provides functionality to populate layers.
 */

var POPULATE_TYPE = exports.POPULATE_TYPE = {
  PRESET: 'preset',
  JSON: 'json',
  TABLE: 'table'
};

/**
 * Populates a table layer (layer group with specific structure) using the
 * provided table data.
 *
 * @param {MSLayerGroup} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {string},
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 * }
 */
function populateTable(layer, data, opt) {

  //populate row headers
  var rowsHeader = Layers.findLayerInLayer('rows', true, Layers.GROUP, layer, true, null);
  populateTableHeader(rowsHeader, data.rowGroups, opt);

  //populate column headers
  var columnsHeader = Layers.findLayerInLayer('columns', true, Layers.GROUP, layer, true, null);
  populateTableHeader(columnsHeader, data.columnGroups, opt);

  //populate cells
  var cellsContainer = Layers.findLayerInLayer('cells', true, Layers.GROUP, layer, true, null);
  var rows = Layers.findLayersInLayer('*', false, Layers.GROUP, cellsContainer, true, null);
  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var rowData = data.cells[i];
    if (!rowData) break;

    //get all cells for row
    var cells = Layers.findLayersInLayer('*', false, Layers.GROUP, row, true, null);
    for (var j = 0; j < cells.length; j++) {
      var cell = cells[j];
      var cellData = rowData[j];
      if (!cellData) break;

      //populate cell
      populateLayer(cell, cellData, {
        rootDir: opt.rootDir,
        trimText: opt.trimText,
        insertEllipsis: opt.insertEllipsis,
        defaultSubstitute: opt.defaultSubstitute
      });
    }
  }
}

/**
 * Populates table column and row headers recursively.
 *
 * @param {MSLayerGroup} header
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {string},
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 * }
 */
function populateTableHeader(header, data, opt) {

  //get groups in header
  var groups = Layers.findLayersInLayer('*', false, Layers.GROUP, header, true, null);
  for (var i = 0; i < groups.length; i++) {
    var group = groups[i];
    var groupData = data[i];
    if (!groupData) break;

    //get nested header
    var nestedHeader = Layers.findLayerInLayer('groups', true, Layers.GROUP, group, true, null);

    //find other layers to populate
    var groupContent = Layers.findLayersInLayer('*', false, Layers.ANY, group, true, [nestedHeader]);

    //populate content layers
    populateLayers(groupContent, groupData, {
      rootDir: opt.rootDir,
      randomizeData: false,
      trimText: opt.trimText,
      insertEllipsis: opt.insertEllipsis,
      defaultSubstitute: opt.defaultSubstitute
    });

    //populate nested headers
    if (nestedHeader) {
      populateTableHeader(nestedHeader, groupData.groups, opt);
    }
  }
}

/**
 * Populates an array of layers using the provided data array.
 *
 * @param {Array} layers
 * @param {Array} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {string},
 *   randomizeData: {boolean},
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 * }
 */
function populateLayers(layers, data, opt) {

  //keep track of already selected random indexes
  var randomIndexes = [];
  var lastRandomIndex = -1;

  //process each layer
  for (var i = 0; i < layers.length; i++) {
    var layer = layers[i];

    //get data row
    var dataRow = void 0;
    if (data instanceof Array) {
      if (opt.randomizeData) {

        //reset random index tracking
        if (randomIndexes.length == data.length) {
          randomIndexes = [];
        }

        //get random index
        var randomIndex = void 0;
        while (!randomIndex && randomIndex !== 0) {

          //get random in range
          var random = Utils.randomInteger(0, data.length);

          //make sure index doesn't exist in already chosen random indexes
          if (randomIndexes.indexOf(random) == -1) {

            //make sure it's not the same as the last chosen random index
            if (data.length > 1) {
              if (random != lastRandomIndex) {
                randomIndex = random;
              }
            } else {
              randomIndex = random;
            }
          }
        }

        //store selected random index
        lastRandomIndex = randomIndex;
        randomIndexes.push(randomIndex);

        //get data row for random index
        dataRow = data[randomIndex];

        //reset random index (so next iteration generates a new one)
        randomIndex = null;
      } else {
        dataRow = data[i % data.length];
      }
    } else {
      dataRow = data;
    }

    //populate layer
    populateLayer(layer, dataRow, {
      rootDir: opt.rootDir,
      trimText: opt.trimText,
      insertEllipsis: opt.insertEllipsis,
      defaultSubstitute: opt.defaultSubstitute
    });
  }
}

/**
 * Populates a layers using the provided data.
 *
 * @param {MSLayer} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {string},
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 * }
 */
function populateLayer(layer, data, opt) {

  //populate group layer
  //artboards are also layer groups
  if (Layers.isLayerGroup(layer)) {

    //populate artboard names
    var artboardLayers = Layers.findLayersInLayer('*', false, Layers.ARTBOARD, layer, false, null);
    artboardLayers.forEach(function (artboardLayer) {
      populateArtboard(artboardLayer, data, {
        defaultSubstitute: opt.defaultSubstitute
      });
      Actions.performActions(artboardLayer, data);
    });

    //populate text layers
    var textLayers = Layers.findLayersInLayer('*', false, Layers.TEXT, layer, false, null);
    textLayers.forEach(function (textLayer) {
      populateTextLayer(textLayer, data, {
        trimText: opt.trimText,
        insertEllipsis: opt.insertEllipsis,
        defaultSubstitute: opt.defaultSubstitute
      });
      Actions.performActions(textLayer, data);
    });

    //populate images
    var imageLayers = Layers.findLayersInLayer('*', false, Layers.SHAPE, layer, false, null);
    imageLayers = imageLayers.concat(Layers.findLayersInLayer('*', false, Layers.BITMAP, layer, false, null));
    imageLayers.forEach(function (imageLayer) {
      populateImageLayer(imageLayer, data, {
        rootDir: opt.rootDir
      });
      Actions.performActions(imageLayer, data);
    });

    //populate symbols
    var symbolLayers = Layers.findLayersInLayer('*', false, Layers.SYMBOL, layer, false, null);
    symbolLayers.forEach(function (symbolLayer) {
      populateSymbolLayer(symbolLayer, data, opt);
      Actions.performActions(symbolLayer, data);
    });

    //perform actions on group
    Actions.performActions(layer, data);

    //perform actions on sub-groups
    var groupLayers = Layers.findLayersInLayer('*', false, Layers.GROUP, layer, false, null);
    groupLayers.forEach(function (groupLayer) {
      Actions.performActions(groupLayer, data);
    });
  }

  //populate text layer
  else if (Layers.isLayerText(layer)) {
      populateTextLayer(layer, data, {
        trimText: opt.trimText,
        insertEllipsis: opt.insertEllipsis,
        defaultSubstitute: opt.defaultSubstitute
      });
      Actions.performActions(layer, data);
    }

    //populate image layer
    else if (Layers.isLayerShapeGroup(layer) || Layers.isLayerBitmap(layer)) {

        //populate image placeholder
        if (layer.name().indexOf('{') > -1) {
          populateImageLayer(layer, data, {
            rootDir: opt.rootDir
          });
          Actions.performActions(layer, data);
        }
      }

      //populate symbol
      else if (Layers.isSymbolInstance(layer)) {
          populateSymbolLayer(layer, data, opt);
          Actions.performActions(layer, data);
        }
}

/**
 * Restores the original layer content and clears the metadata.
 *
 * @param {MSLayer} layer
 */
function clearLayer(layer) {

  //clear group layer
  if (Layers.isLayerGroup(layer)) {

    //clear artboard names
    var artboardLayers = Layers.findLayersInLayer('*', false, Layers.ARTBOARD, layer, false, null);
    artboardLayers.forEach(function (artboardLayer) {
      clearArtboard(artboardLayer);
    });

    //clear text layers
    var textLayers = Layers.findLayersInLayer('*', false, Layers.TEXT, layer, false, null);
    textLayers.forEach(function (textLayer) {
      clearTextLayer(textLayer);
    });

    //clear images
    var imageLayers = Layers.findLayersInLayer('{*}*', false, Layers.SHAPE, layer, false, null);
    imageLayers = imageLayers.concat(Layers.findLayersInLayer('{*}*', false, Layers.BITMAP, layer, false, null));
    imageLayers.forEach(function (imageLayer) {
      clearImageLayer(imageLayer);
    });

    //clear symbols
    var symbolLayers = Layers.findLayersInLayer('*', false, Layers.SYMBOL, layer, false, null);
    symbolLayers.forEach(function (symbolLayer) {
      clearSymbolLayer(symbolLayer);
    });
  }

  //clear text layer
  else if (Layers.isLayerText(layer)) {
      clearTextLayer(layer);
    }

    //clear image layer
    else if (Layers.isLayerShapeGroup(layer) || Layers.isLayerBitmap(layer)) {

        //populate image placeholder
        if (layer.name().indexOf('{') > -1) {
          clearImageLayer(layer);
        }
      }

      //clear symbol
      else if (Layers.isSymbolInstance(layer)) {
          clearSymbolLayer(layer);
        }
}

/**
 * Removes any Data Populator data from a layer's metadata.
 *
 * @param {MSLayer} layer
 */
function removeLayerMetadata(layer) {

  //get user info
  var userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo());

  //prepare clean user info
  var cleanUserInfo = NSMutableDictionary.alloc().init();

  //get keys
  var keys = Utils.convertToJSArray(userInfo.allKeys());

  //add values other than data populator's
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key.indexOf('datapopulator') == -1) {
      cleanUserInfo.setValue_forKey(userInfo.valueForKey(key), key);
    }
  }

  //set clean user info
  layer.setUserInfo(cleanUserInfo);
}

/**
 * Populates a symbol instance layer.
 *
 * @param {MSSymbolInstance} layer
 * @param {Object} data
 * @param {Object} opt
 * @param {boolean} nested
 *
 * opt: {
 *   rootDir: {string},
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 * }
 */
function populateSymbolLayer(layer, data, opt, nested) {

  //get swap action on symbol
  var swapAction = Actions.extractActions(String(layer.name())).filter(function (swapAction) {
    return swapAction.command == SwapSymbolAction.name || swapAction.command == SwapSymbolAction.alias;
  }).map(function (swapAction) {
    return Actions.resolveAction(swapAction, data);
  }).filter(function (swapAction) {
    return swapAction.condition;
  })[0];

  //swap symbol
  if (swapAction) {

    //find symbol master with specified name
    var symbolToSwapWith = Layers.findLayerInLayers(swapAction.params[0], true, Layers.SYMBOL_MASTER, (0, _context2.default)().document.pages(), true, null);
    if (symbolToSwapWith) {

      //replace top level symbol
      if (!nested) {
        layer.changeInstanceToSymbol(symbolToSwapWith);
      }
    } else {}
  }

  var overrides = null;
  var symbolMaster = null;

  //layer might be a symbol master if populating target symbol override
  if (Layers.isSymbolMaster(layer)) {
    overrides = NSMutableDictionary.alloc().init();
    symbolMaster = layer;
  } else {

    //get existing overrides
    var existingOverrides = layer.overrides();
    if (existingOverrides) {
      existingOverrides = layer.overrides().objectForKey(NSNumber.numberWithInt(0));
    } else {
      existingOverrides = NSDictionary.alloc().init();
    }

    //create mutable overrides
    overrides = NSMutableDictionary.dictionaryWithDictionary(existingOverrides);

    //get master for symbol instance
    symbolMaster = layer.symbolMaster();
  }

  //set root overrides in option to pass down in recursive calls
  if (!nested) {
    opt.rootOverrides = overrides;
  }
  if (!opt.rootOverrides) {
    opt.rootOverrides = NSMutableDictionary.alloc().init();
  }

  //populate text layers
  var textLayers = Layers.findLayersInLayer('*', false, Layers.TEXT, symbolMaster, false, null);
  textLayers.forEach(function (textLayer) {
    populateTextLayer(textLayer, data, {
      trimText: opt.trimText,
      insertEllipsis: opt.insertEllipsis,
      defaultSubstitute: opt.defaultSubstitute,
      overrides: overrides
    });
  });

  //populate images
  var imageLayers = Layers.findLayersInLayer('{*}', false, Layers.SHAPE, symbolMaster, false, null);
  imageLayers = imageLayers.concat(Layers.findLayersInLayer('{*}', false, Layers.BITMAP, symbolMaster, false, null));
  imageLayers.forEach(function (imageLayer) {
    populateImageLayer(imageLayer, data, {
      rootDir: opt.rootDir,
      overrides: overrides
    });
  });

  //populate symbols
  var symbolLayers = Layers.findLayersInLayer('*', false, Layers.SYMBOL, symbolMaster, false, null);
  symbolLayers.forEach(function (symbolLayer) {

    //get swap action on symbol
    var swapAction = Actions.extractActions(String(symbolLayer.name())).filter(function (swapAction) {
      return swapAction.command == SwapSymbolAction.name || swapAction.command == SwapSymbolAction.alias;
    }).map(function (swapAction) {
      return Actions.resolveAction(swapAction, data);
    }).filter(function (swapAction) {
      return swapAction.condition;
    })[0];

    //find symbol master with specified name
    var symbolToSwapWith = swapAction ? Layers.findLayerInLayers(swapAction.params[0], true, Layers.SYMBOL_MASTER, (0, _context2.default)().document.pages(), true, null) : null;

    //swap nested symbol
    //swap action always takes priority
    if (symbolToSwapWith) {

      //get symbol id
      var idOfSymbolToSwapWith = symbolToSwapWith.symbolID();

      //prepare nested root overrides
      var nestedRootOverrides = opt.rootOverrides.valueForKey(symbolLayer.objectID());
      var nestedOpt = Object.assign({}, opt);
      nestedOpt.rootOverrides = nestedRootOverrides;

      //get nested overrides
      var nestedOverrides = populateSymbolLayer(symbolToSwapWith, data, nestedOpt, true);
      nestedOverrides.setValue_forKey(idOfSymbolToSwapWith, 'symbolID');
      overrides.setValue_forKey(nestedOverrides, symbolLayer.objectID());
    } else {

      //resolve nested symbol override
      if (opt.rootOverrides.valueForKey(symbolLayer.objectID()) && opt.rootOverrides.valueForKey(symbolLayer.objectID()).valueForKey('symbolID')) {

        //get overridden symbol ID
        var symbolID = String(opt.rootOverrides.valueForKey(symbolLayer.objectID()).valueForKey('symbolID'));

        //hide symbol
        if (!symbolID || !symbolID.length) {

          //get existing nested overrides
          var existingNestedOverrides = overrides.valueForKey(symbolLayer.objectID());
          if (!existingNestedOverrides) {
            existingNestedOverrides = NSDictionary.alloc().init();
          }
          var _nestedOverrides = NSMutableDictionary.dictionaryWithDictionary(existingNestedOverrides);

          //set empty symbol override
          //no need to keep populating recursively
          _nestedOverrides.setValue_forKey('', 'symbolID');
          overrides.setValue_forKey(_nestedOverrides, symbolLayer.objectID());
        } else {

          //get all symbol masters
          var symbolMasters = Layers.findLayersInLayers('*', false, Layers.SYMBOL_MASTER, (0, _context2.default)().document.pages(), true, null);
          var overriddenSymbolLayer = null;
          for (var i = 0; i < symbolMasters.length; ++i) {
            if (symbolMasters[i].symbolID() == symbolID) {
              overriddenSymbolLayer = symbolMasters[i];
              break;
            }
          }

          //prepare nested root overrides
          var _nestedRootOverrides = opt.rootOverrides.valueForKey(symbolLayer.objectID());
          var _nestedOpt = Object.assign({}, opt);
          _nestedOpt.rootOverrides = _nestedRootOverrides;

          //get nested overrides
          var _nestedOverrides2 = populateSymbolLayer(overriddenSymbolLayer, data, _nestedOpt, true);
          _nestedOverrides2.setValue_forKey(symbolID, 'symbolID');
          overrides.setValue_forKey(_nestedOverrides2, symbolLayer.objectID());
        }
      }

      //nested symbol is not overridden
      else {

          //prepare nested root overrides
          var _nestedRootOverrides2 = opt.rootOverrides.valueForKey(symbolLayer.objectID());
          var _nestedOpt2 = Object.assign({}, opt);
          _nestedOpt2.rootOverrides = _nestedRootOverrides2;

          //get nested overrides
          var _nestedOverrides3 = populateSymbolLayer(symbolLayer, data, _nestedOpt2, true);
          overrides.setValue_forKey(_nestedOverrides3, symbolLayer.objectID());
        }
    }
  });

  //set new overrides
  if (!nested) layer.setOverrides(NSDictionary.dictionaryWithObject_forKey(overrides, NSNumber.numberWithInt(0)));

  //return overrides
  return overrides;
}

/**
 * Clears the symbol layer.
 *
 * @param {MSSymbolInstance} layer
 */
function clearSymbolLayer(layer) {

  //get existing overrides
  var existingOverrides = layer.overrides();
  if (existingOverrides) {
    existingOverrides = layer.overrides().objectForKey(NSNumber.numberWithInt(0));
  } else return;

  //clear overrides except for symbol overrides
  var clearedOverrides = clearOverrides(existingOverrides);

  //remove metadata
  removeLayerMetadata(layer);

  //set cleared overrides
  layer.setOverrides(NSDictionary.dictionaryWithObject_forKey(clearedOverrides, NSNumber.numberWithInt(0)));
}

/**
 * Removes all 'content' data from overrides, keeping only symbol overrides.
 *
 * @param {NSDictionary} overrides
 * @returns {NSDictionary}
 */
function clearOverrides(overrides) {

  //create mutable overrides
  overrides = NSMutableDictionary.dictionaryWithDictionary(overrides);

  //filter dictionary
  var keys = overrides.allKeys();
  keys.forEach(function (key) {

    var value = overrides.objectForKey(key);
    if (value.isKindOfClass(NSDictionary.class())) {

      value = clearOverrides(value);
      if (value.allKeys().count() > 0) {
        overrides.setValue_forKey(value, key);
      } else {
        overrides.removeObjectForKey(key);
      }
    } else {

      if (key != 'symbolID') {
        overrides.removeObjectForKey(key);
      }
    }
  });

  return overrides;
}

/**
 * Populates a text layer.
 *
 * @param {MSTextLayer} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 *   overrides: {NSMutableDictionary}
 * }
 */
function populateTextLayer(layer, data, opt) {

  //check if layer is in symbol
  var inSymbol = !!opt.overrides;

  //get original text
  var originalText = getOriginalText(layer, inSymbol);

  //set original text
  //set even if inside symbol so that if taken out of symbol, it can be repopulated
  setOriginalText(layer, originalText);

  //extract placeholders from layer name
  var namePlaceholders = Placeholders.extractPlaceholders(layer.name());

  //extract args
  var args = Args.extractArgs(layer.name(), [{
    name: 'lines',
    alias: 'l',
    type: Number
  }]);

  //populate with placeholder in layer name
  var populatedString = void 0;
  if (namePlaceholders.length) {

    //populate first placeholder
    populatedString = Placeholders.populatePlaceholder(namePlaceholders[0], data, opt.defaultSubstitute);
  }

  //populate based on content of text layer
  else {

      //extract placeholders from original text
      var placeholders = Placeholders.extractPlaceholders(originalText);

      //create populated string, starting with the original text and gradually replacing placeholders
      populatedString = originalText;
      placeholders.forEach(function (placeholder) {

        //populate placeholder found in the original text
        var populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, opt.defaultSubstitute);

        //replace original placeholder string (e.g. {firstName}) with populated placeholder string
        populatedString = populatedString.replace(placeholder.string, populatedPlaceholder);
      });
    }

  //check if the populated string is different from original text
  //this prevents needlessly setting text and affecting text layers that don't contain placeholders
  if (populatedString == originalText) return;

  //trim text, taking into account the lines arg if available
  if (layer.textBehaviour() == 1 && opt.trimText) {
    populatedString = getTrimmedText(layer, populatedString, opt.insertEllipsis, args.lines);
  }

  //set populated string as an override for text layer within a symbol
  if (inSymbol) {

    //make text invisible by setting it to a space
    if (!populatedString.length) {
      populatedString = ' ';
    }

    //get id of text layer
    var layerId = layer.objectID();

    //add override for layer
    opt.overrides.setValue_forKey(populatedString, layerId);
  }

  //set populated string for normal text layer
  else {

      //hide text layer if populated string is empty
      if (!populatedString.length) {
        populatedString = '-';
        layer.setIsVisible(false);
      } else {
        layer.setIsVisible(true);
      }

      //get current font
      var font = layer.font();

      //set text layer text
      layer.setStringValue(populatedString);

      //set current font back
      layer.setFont(font);

      //resize text layer to fit text
      Layers.refreshTextLayer(layer);
    }
}

/**
 * Clears the text layer.
 *
 * @param {MSTextLayer} layer
 */
function clearTextLayer(layer) {

  //get original text
  var originalText = getOriginalText(layer);

  //check if there is original text stored for the layer
  if (originalText) {

    //set original text
    layer.setStringValue(originalText);

    //refresh and resize
    Layers.refreshTextLayer(layer);
  }

  //clear any data populator metadata
  removeLayerMetadata(layer);
}

/**
 * Gets the original text with placeholders for the layer.
 *
 * @param {MSTextLayer/MSArtboardGroup} layer
 * @returns {string}
 */
function getOriginalText(layer, ignoreMetadata) {

  //get data dictionary
  var dataDict = getDataDictionary(layer);

  //get text stored in layer metadata
  //LEGACY: check old 'textWithPlaceholders' key
  var text = dataDict.valueForKey('textWithPlaceholders');
  if (!text) text = dataDict.valueForKey('originalText');

  //set original text if it doesn't exist
  if (ignoreMetadata || !text || !text.length) {

    //get text from text layer
    if (Layers.isLayerText(layer)) {
      text = String(layer.stringValue());
    }

    //get name of artboard
    else if (Layers.isArtboard(layer)) {
        text = String(layer.name());
      }
  }

  return text;
}

/**
 * Sets the original text as metadata on the layer.
 *
 * @param {MSLayer} layer
 * @param {string} text
 */
function setOriginalText(layer, text) {

  //get data dictionary
  var dataDict = getDataDictionary(layer);

  //save new text as the original text in metadata
  dataDict.setValue_forKey(text, 'originalText');

  //LEGACY: remove any old values stored in the dictionary
  dataDict.removeObjectForKey('textWithPlaceholders');

  //set new data dictionary
  setDataDictionary(layer, dataDict);
}

/**
 * Retrieves the data dictionary from layer's userInfo.
 *
 * @param {MSLayer} layer
 * @returns {NSMutableDictionary}
 */
function getDataDictionary(layer) {

  //get user info
  var userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo());

  //get plugin data dictionary
  var dataDict = userInfo.valueForKey('com.precious-forever.sketch.datapopulator');

  //LEGACY: get values for old versions of data populator
  if (!dataDict) dataDict = userInfo.valueForKey('com.precious-forever.sketch.datapopulator2');
  if (!dataDict) dataDict = userInfo.valueForKey('com.precious-forever.sketch.datapopulatorBETA');

  //get mutable dictionary from dictionary
  dataDict = NSMutableDictionary.dictionaryWithDictionary(dataDict);

  return dataDict;
}

/**
 * Sets a new data dictionary in userInfo of the layer.
 *
 * @param {MSLayer} layer
 * @param {NSMutableDictionary} dataDict
 */
function setDataDictionary(layer, dataDict) {

  //get user info
  var userInfo = NSMutableDictionary.dictionaryWithDictionary(layer.userInfo());

  //LEGACY: filter out any data from old data populator versions
  var newUserInfo = NSMutableDictionary.alloc().init();
  var keys = Utils.convertToJSArray(userInfo.allKeys());
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (key.indexOf('datapopulator') == -1) {
      newUserInfo.setValue_forKey(userInfo.valueForKey(key), key);
    }
  }
  userInfo = newUserInfo;

  //set data dictionary
  userInfo.setValue_forKey(dataDict, 'com.precious-forever.sketch.datapopulator');

  //set new user info
  layer.setUserInfo(userInfo);
}

/**
 * Trims the text to fit in the specified number of lines in the text layer.
 *
 * @param {MSTextLayer} layer
 * @param {string} text
 * @param {boolean} insertEllipsis
 * @param {int} lines
 * @returns {string}
 */
function getTrimmedText(layer, text, insertEllipsis, lines) {

  //trim to one line by default
  if (!lines || lines < 1) lines = 1;

  //create a copy of the layer to prevent changing the actual layer
  layer = Utils.copyLayer(layer);

  //set text to a single character to get height of one line
  layer.setStringValue('-');

  //resize text layer to fit text
  Layers.refreshTextLayer(layer);

  //get original text layer height
  var lineHeight = layer.frame().height();

  //set actual text
  layer.setStringValue(text);

  //resize to fit and get new height
  Layers.refreshTextLayer(layer);
  var actualHeight = layer.frame().height();

  //shorten text to fit
  while (actualHeight > lineHeight * lines) {

    //trim last character
    if (insertEllipsis) {
      text = text.substring(0, text.length - 2) + '…';
    } else {
      text = text.substring(0, text.length - 1);
    }

    //set trimmed text and re-evaluate height
    layer.setStringValue(text);
    Layers.refreshTextLayer(layer);
    actualHeight = layer.frame().height();
  }

  return text;
}

/**
 * Populates an image layer.
 *
 * @param {MSShapeGroup/MSBitmapLayer} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   rootDir: {string},
 *   overrides: {NSMutableDictionary}
 * }
 */
function populateImageLayer(layer, data, opt) {

  //check if layer is in symbol
  var inSymbol = !!opt.overrides;

  //extract image placeholder from layer name
  var imagePlaceholder = Placeholders.extractPlaceholders(layer.name())[0];
  if (!imagePlaceholder) return;

  //get url by populating the placeholder
  var imageUrl = Placeholders.populatePlaceholder(imagePlaceholder, data, '');

  //get image data
  var imageData = void 0;
  if (imageUrl) {
    imageData = getImageData(imageUrl, opt.rootDir);
    if (!imageData) {
      return (0, _context2.default)().document.showMessage('Some images could not be loaded. Please check the URLs.');
    }
  }

  //get layer fill
  var fill = layer.style().fills().firstObject();
  if (!fill) {

    //create new fill
    fill = layer.style().addStylePartOfType(0);
  }

  //set fill properties
  fill.setFillType(4);
  // fill.setPatternFillType(1)

  //set image as an override for image layer within a symbol
  if (inSymbol) {

    //get id of image layer
    var layerId = layer.objectID();

    //add override for layer
    if (imageData) {
      opt.overrides.setValue_forKey(imageData, layerId);
    } else {
      opt.overrides.setValue_forKey(null, layerId);
    }
  }

  //set image for normal image layer
  else {

      //set image as fill
      if (imageData) {

        //enable fill
        fill.setIsEnabled(true);
        fill.setImage(imageData);
      } else {

        //disable fill and remove image
        fill.setIsEnabled(false);
        fill.setImage(null);
      }
    }
}

/**
 * Clears the image layer.
 *
 * @param {MSShapeGroup/MSBitmapLayer} layer
 */
function clearImageLayer(layer) {

  //TODO: how should images be cleared?

  //remove metadata
  removeLayerMetadata(layer);
}

/**
 * Gets image data from image url. Image can be remote or local.
 *
 * @param {string} imageUrl
 * @param {string} rootDir
 * @returns {MSImageData}
 */
function getImageData(imageUrl, rootDir) {

  //check if url is local or remote
  var image = void 0;
  if (/(http)[s]?:\/\//g.test(imageUrl)) {

    //download image from url
    image = Data.getImageFromRemoteURL(imageUrl);
  } else {

    //remove first slash
    if (imageUrl[0] == '/') imageUrl = imageUrl.substring(1);

    //build full image url by adding the root dir
    imageUrl = NSString.stringWithString(rootDir).stringByAppendingPathComponent(imageUrl);

    //load image from filesystem
    image = Data.getImageFromLocalURL(imageUrl);
  }

  //create image data from NSImage
  return Data.getImageData(image);
}

/**
 * Populates an artboard name.
 *
 * @param {MSArtboard} layer
 * @param {Object} data
 * @param {Object} opt
 *
 * opt: {
 *   defaultSubstitute {string}
 * }
 */
function populateArtboard(layer, data, opt) {

  //get original text
  var originalText = getOriginalText(layer);

  //set original text
  setOriginalText(layer, originalText);

  //extract placeholders from original artboard name
  var placeholders = Placeholders.extractPlaceholders(originalText);

  //create populated string, starting with the original text and gradually replacing placeholders
  var populatedString = originalText;
  placeholders.forEach(function (placeholder) {

    //populate placeholder found in the original text
    var populatedPlaceholder = Placeholders.populatePlaceholder(placeholder, data, opt.defaultSubstitute);

    //replace original placeholder string (e.g. {firstName}) with populated placeholder string
    populatedString = populatedString.replace(placeholder.string, populatedPlaceholder);
  });

  //set artboard name
  layer.setName(populatedString);
}

/**
 * Clears the artboard layer.
 *
 * @param {MSArtboardGroup} layer
 */
function clearArtboard(layer) {

  //get original text
  var originalText = getOriginalText(layer);

  //check if there is original text stored for the layer
  if (originalText) {

    //set artboard name
    layer.setName(originalText);
  }

  //clear any data populator metadata
  removeLayerMetadata(layer);
}

},{"../context":77,"./actions":80,"./actions/swapSymbol":84,"./args":86,"./data":87,"./layers":94,"./placeholders":96,"./utils":98}],98:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.convertToJSArray = convertToJSArray;
exports.copyLayer = copyLayer;
exports.randomInteger = randomInteger;
exports.mergeStringWithValues = mergeStringWithValues;
exports.parsePrimitives = parsePrimitives;
/**
 * Utils library
 *
 * Provides utility and miscellaneous functionality.
 */

/**
 * Converts the native Objective-C array to a Javascript Array.
 *
 * @param {NSArray} nativeArray
 * @returns {Array}
 */
function convertToJSArray(nativeArray) {

  if (nativeArray.class() == MSLayerArray) {
    nativeArray = nativeArray.layers();
  }
  var length = nativeArray.count();
  var jsArray = [];

  while (jsArray.length < length) {
    jsArray.push(nativeArray.objectAtIndex(jsArray.length));
  }
  return jsArray;
}

/**
 * Creates a copy of the provided layer.
 *
 * @param {MSLayer} layer
 * @returns {MSLayer}
 */
function copyLayer(layer) {

  //create duplicate
  var layerCopy = layer.duplicate();

  //remove duplicate from parent
  layerCopy.removeFromParent();

  return layerCopy;
}

/**
 * Generates a random integer between min and max inclusive.
 *
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */
function randomInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

/**
 * Substitutes the placeholders in the string using the provided values.
 *
 * @param {string} string - String with placeholders in the {placeholder} format.
 * @param {Object} values - Object with values to substitute for placeholders.
 * @returns {string} - String with placeholders substituted for values.
 */
function mergeStringWithValues(string, values) {

  //get properties in values
  var properties = Object.keys(values);

  properties.forEach(function (property) {

    //escape regex
    var sanitisedProperty = property.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
    sanitisedProperty = '{' + sanitisedProperty + '}';

    //build regex
    var exp = RegExp(sanitisedProperty, 'g');

    //replace instances of property placeholder with value
    string = string.replace(exp, values[property]);
  });

  return string;
}

/**
 * Parses the string and returns the value of the correct type.
 *
 * @param {string} value
 * @returns {*}
 */
function parsePrimitives(value) {

  if (value == '') {
    return value;
  } else if (value == 'true' || value == '1') {
    value = true;
  } else if (value == 'false' || value == '0') {
    value = false;
  } else if (value == 'null') {
    value = null;
  } else if (value == 'undefined') {
    value = undefined;
  } else if (!isNaN(value) && value != '') {
    value = parseFloat(value);
  }

  return value;
}

},{}],99:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.HKSketchFusionExtension = undefined;

var _commands = require('./commands');

var commands = _interopRequireWildcard(_commands);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var HKSketchFusionExtension = exports.HKSketchFusionExtension = {
  name: 'Sketch Data Populator',
  bundleName: 'Sketch Data Populator',
  description: 'Say goodbye to Lorem Ipsum: populate your Sketch documents with meaningful data.',
  author: 'precious design studio',
  authorEmail: 'info@precious-forever.com',
  version: '2.1.3',
  identifier: 'com.precious-forever.sketch.datapopulator2',
  compatibleVersion: '3.7',
  menu: {
    'isRoot': false,
    'items': ['populateWithPreset', 'populateWithJSON', 'populateTable', 'populateAgain', 'revealPresets', 'clearLayers']
  },
  commands: {
    populateWithPreset: {
      name: 'Populate with Preset',
      shortcut: '',
      description: 'Pick one of Data Populator\'s built in Presets',
      icon: '../Resources/populateWithPreset.png',
      run: commands.populateWithPreset
    },
    populateWithJSON: {
      name: 'Populate with JSON',
      shortcut: '',
      description: 'Pick a local JSON file',
      icon: '../Resources/populateWithJSON.png',
      run: commands.populateWithJSON
    },
    populateTable: {
      name: 'Populate Table',
      shortcut: '',
      description: 'Pick CSV file to populate a table',
      icon: '../Resources/populateTable.png',
      run: commands.populateTable
    },
    populateAgain: {
      name: 'Populate Again',
      shortcut: 'cmd shift x',
      description: 'Populate again with last used setup',
      icon: '../Resources/populateAgain.png',
      run: commands.populateAgain
    },
    revealPresets: {
      name: 'Reveal Presets',
      shortcut: '',
      description: 'Show Data Populator\'s Presets in Finder',
      icon: '../Resources/revealPresets.png',
      run: commands.revealPresets
    },
    clearLayers: {
      name: 'Clear Layers',
      shortcut: '',
      description: 'Remove all populated data from selected Layers',
      icon: '../Resources/clearLayers.png',
      run: commands.clearLayers
    }
  }
}; /**
    * Plugin
    *
    * Defines the plugin structure and metadata.
    */

__globals.___populateWithPreset_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['populateWithPreset'].run(context, params);
};

__globals.___populateWithJson_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['populateWithJSON'].run(context, params);
};

__globals.___populateTable_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['populateTable'].run(context, params);
};

__globals.___populateAgain_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['populateAgain'].run(context, params);
};

__globals.___revealPresets_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['revealPresets'].run(context, params);
};

__globals.___clearLayers_run_handler_ = function (context, params) {
  HKSketchFusionExtension.commands['clearLayers'].run(context, params);
};

/*__$begin_of_manifest_
{
    "name": "Sketch Data Populator",
    "bundleName": "Sketch Data Populator",
    "description": "Say goodbye to Lorem Ipsum: populate your Sketch documents with meaningful data.",
    "author": "precious design studio",
    "authorEmail": "info@precious-forever.com",
    "version": "2.1.3",
    "identifier": "com.precious-forever.sketch.datapopulator2",
    "compatibleVersion": "3.7",
    "menu": {
        "isRoot": false,
        "items": [
            "populateWithPreset",
            "populateWithJSON",
            "populateTable",
            "populateAgain",
            "revealPresets",
            "clearLayers"
        ]
    },
    "commands": [
        {
            "identifier": "populateWithPreset",
            "handler": "___populateWithPreset_run_handler_",
            "script": "plugin.js",
            "name": "Populate with Preset",
            "shortcut": "",
            "description": "Pick one of Data Populator's built in Presets",
            "icon": "../Resources/populateWithPreset.png"
        },
        {
            "identifier": "populateWithJSON",
            "handler": "___populateWithJson_run_handler_",
            "script": "plugin.js",
            "name": "Populate with JSON",
            "shortcut": "",
            "description": "Pick a local JSON file",
            "icon": "../Resources/populateWithJSON.png"
        },
        {
            "identifier": "populateTable",
            "handler": "___populateTable_run_handler_",
            "script": "plugin.js",
            "name": "Populate Table",
            "shortcut": "",
            "description": "Pick CSV file to populate a table",
            "icon": "../Resources/populateTable.png"
        },
        {
            "identifier": "populateAgain",
            "handler": "___populateAgain_run_handler_",
            "script": "plugin.js",
            "name": "Populate Again",
            "shortcut": "cmd shift x",
            "description": "Populate again with last used setup",
            "icon": "../Resources/populateAgain.png"
        },
        {
            "identifier": "revealPresets",
            "handler": "___revealPresets_run_handler_",
            "script": "plugin.js",
            "name": "Reveal Presets",
            "shortcut": "",
            "description": "Show Data Populator's Presets in Finder",
            "icon": "../Resources/revealPresets.png"
        },
        {
            "identifier": "clearLayers",
            "handler": "___clearLayers_run_handler_",
            "script": "plugin.js",
            "name": "Clear Layers",
            "shortcut": "",
            "description": "Remove all populated data from selected Layers",
            "icon": "../Resources/clearLayers.png"
        }
    ],
    "disableCocoaScriptPreprocessor": true
}__$end_of_manifest_
*/

},{"./commands":71}]},{},[99]);
