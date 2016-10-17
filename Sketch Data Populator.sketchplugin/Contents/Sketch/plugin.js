var __globals = this;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var t = require('typical');

/**
@module array-back
@example
var arrayify = require("array-back")
*/
module.exports = arrayify;

/**
Takes any input and guarantees an array back.

- converts array-like objects (e.g. `arguments`) to a real array
- converts `undefined` to an empty array
- converts any another other, singular value (including `null`) into an array containing that value
- ignores input which is already an array

@param {*} - the input value to convert to an array
@returns {Array}
@alias module:array-back
@example
> a.arrayify(undefined)
[]

> a.arrayify(null)
[ null ]

> a.arrayify(0)
[ 0 ]

> a.arrayify([ 1, 2 ])
[ 1, 2 ]

> function f(){ return a.arrayify(arguments); }
> f(1,2,3)
[ 1, 2, 3 ]
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

},{"typical":148}],2:[function(require,module,exports){
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
              expandedArgs.push(matches[1], matches[2]);
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
},{"./option":6,"_process":146,"array-back":1,"find-replace":97}],3:[function(require,module,exports){
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
      var value = item;
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

},{"./argv":2,"./definitions":5,"./option":6,"array-back":1,"typical":148}],4:[function(require,module,exports){
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

},{"typical":148}],5:[function(require,module,exports){
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

},{"./definition":4,"./option":6,"array-back":1,"typical":148}],6:[function(require,module,exports){
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

  optEquals: new Arg(/^(--\S+)=(.*)/)
};

module.exports = option;

},{}],7:[function(require,module,exports){
'use strict';

var detect = require('feature-detect-es6');

if (detect.all('class', 'arrowFunction', 'newArrayFeatures')) {
  module.exports = require('./lib/command-line-args');
} else {
  require('core-js/es6/array');
  module.exports = require('./es5/command-line-args');
}

},{"./es5/command-line-args":3,"./lib/command-line-args":9,"core-js/es6/array":13,"feature-detect-es6":96}],8:[function(require,module,exports){
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
     * expand --option=name style args
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
              expandedArgs.push(matches[1], matches[2]);
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
},{"./option":12,"_process":146,"array-back":1,"find-replace":97}],9:[function(require,module,exports){
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
      var value = item;
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

},{"./argv":8,"./definitions":11,"./option":12,"array-back":1,"typical":148}],10:[function(require,module,exports){
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

},{"typical":148}],11:[function(require,module,exports){
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

},{"./definition":10,"./option":12,"array-back":1,"typical":148}],12:[function(require,module,exports){
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

  optEquals: new Arg(/^(--\S+)=(.*)/)
};

module.exports = option;

},{}],13:[function(require,module,exports){
'use strict';

require('../modules/es6.string.iterator');
require('../modules/es6.array.is-array');
require('../modules/es6.array.from');
require('../modules/es6.array.of');
require('../modules/es6.array.join');
require('../modules/es6.array.slice');
require('../modules/es6.array.sort');
require('../modules/es6.array.for-each');
require('../modules/es6.array.map');
require('../modules/es6.array.filter');
require('../modules/es6.array.some');
require('../modules/es6.array.every');
require('../modules/es6.array.reduce');
require('../modules/es6.array.reduce-right');
require('../modules/es6.array.index-of');
require('../modules/es6.array.last-index-of');
require('../modules/es6.array.copy-within');
require('../modules/es6.array.fill');
require('../modules/es6.array.find');
require('../modules/es6.array.find-index');
require('../modules/es6.array.species');
require('../modules/es6.array.iterator');
module.exports = require('../modules/_core').Array;

},{"../modules/_core":26,"../modules/es6.array.copy-within":74,"../modules/es6.array.every":75,"../modules/es6.array.fill":76,"../modules/es6.array.filter":77,"../modules/es6.array.find":79,"../modules/es6.array.find-index":78,"../modules/es6.array.for-each":80,"../modules/es6.array.from":81,"../modules/es6.array.index-of":82,"../modules/es6.array.is-array":83,"../modules/es6.array.iterator":84,"../modules/es6.array.join":85,"../modules/es6.array.last-index-of":86,"../modules/es6.array.map":87,"../modules/es6.array.of":88,"../modules/es6.array.reduce":90,"../modules/es6.array.reduce-right":89,"../modules/es6.array.slice":91,"../modules/es6.array.some":92,"../modules/es6.array.sort":93,"../modules/es6.array.species":94,"../modules/es6.string.iterator":95}],14:[function(require,module,exports){
'use strict';

module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

},{}],15:[function(require,module,exports){
'use strict';

// 22.1.3.31 Array.prototype[@@unscopables]
var UNSCOPABLES = require('./_wks')('unscopables'),
    ArrayProto = Array.prototype;
if (ArrayProto[UNSCOPABLES] == undefined) require('./_hide')(ArrayProto, UNSCOPABLES, {});
module.exports = function (key) {
  ArrayProto[UNSCOPABLES][key] = true;
};

},{"./_hide":37,"./_wks":72}],16:[function(require,module,exports){
'use strict';

var isObject = require('./_is-object');
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

},{"./_is-object":43}],17:[function(require,module,exports){
// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
'use strict';

var toObject = require('./_to-object'),
    toIndex = require('./_to-index'),
    toLength = require('./_to-length');

module.exports = [].copyWithin || function copyWithin(target /*= 0*/, start /*= 0, end = @length*/) {
  var O = toObject(this),
      len = toLength(O.length),
      to = toIndex(target, len),
      from = toIndex(start, len),
      end = arguments.length > 2 ? arguments[2] : undefined,
      count = Math.min((end === undefined ? len : toIndex(end, len)) - from, len - to),
      inc = 1;
  if (from < to && to < from + count) {
    inc = -1;
    from += count - 1;
    to += count - 1;
  }
  while (count-- > 0) {
    if (from in O) O[to] = O[from];else delete O[to];
    to += inc;
    from += inc;
  }return O;
};

},{"./_to-index":65,"./_to-length":68,"./_to-object":69}],18:[function(require,module,exports){
// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
'use strict';

var toObject = require('./_to-object'),
    toIndex = require('./_to-index'),
    toLength = require('./_to-length');
module.exports = function fill(value /*, start = 0, end = @length */) {
  var O = toObject(this),
      length = toLength(O.length),
      aLen = arguments.length,
      index = toIndex(aLen > 1 ? arguments[1] : undefined, length),
      end = aLen > 2 ? arguments[2] : undefined,
      endPos = end === undefined ? length : toIndex(end, length);
  while (endPos > index) {
    O[index++] = value;
  }return O;
};

},{"./_to-index":65,"./_to-length":68,"./_to-object":69}],19:[function(require,module,exports){
'use strict';

// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject'),
    toLength = require('./_to-length'),
    toIndex = require('./_to-index');
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this),
        length = toLength(O.length),
        index = toIndex(fromIndex, length),
        value;
    // Array#includes uses SameValueZero equality algorithm
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      if (value != value) return true;
      // Array#toIndex ignores holes, Array#includes - not
    } else for (; length > index; index++) {
      if (IS_INCLUDES || index in O) {
        if (O[index] === el) return IS_INCLUDES || index || 0;
      }
    }return !IS_INCLUDES && -1;
  };
};

},{"./_to-index":65,"./_to-iobject":67,"./_to-length":68}],20:[function(require,module,exports){
'use strict';

// 0 -> Array#forEach
// 1 -> Array#map
// 2 -> Array#filter
// 3 -> Array#some
// 4 -> Array#every
// 5 -> Array#find
// 6 -> Array#findIndex
var ctx = require('./_ctx'),
    IObject = require('./_iobject'),
    toObject = require('./_to-object'),
    toLength = require('./_to-length'),
    asc = require('./_array-species-create');
module.exports = function (TYPE, $create) {
  var IS_MAP = TYPE == 1,
      IS_FILTER = TYPE == 2,
      IS_SOME = TYPE == 3,
      IS_EVERY = TYPE == 4,
      IS_FIND_INDEX = TYPE == 6,
      NO_HOLES = TYPE == 5 || IS_FIND_INDEX,
      create = $create || asc;
  return function ($this, callbackfn, that) {
    var O = toObject($this),
        self = IObject(O),
        f = ctx(callbackfn, that, 3),
        length = toLength(self.length),
        index = 0,
        result = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined,
        val,
        res;
    for (; length > index; index++) {
      if (NO_HOLES || index in self) {
        val = self[index];
        res = f(val, index, O);
        if (TYPE) {
          if (IS_MAP) result[index] = res; // map
          else if (res) switch (TYPE) {
              case 3:
                return true; // some
              case 5:
                return val; // find
              case 6:
                return index; // findIndex
              case 2:
                result.push(val); // filter
            } else if (IS_EVERY) return false; // every
        }
      }
    }return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : result;
  };
};

},{"./_array-species-create":23,"./_ctx":28,"./_iobject":40,"./_to-length":68,"./_to-object":69}],21:[function(require,module,exports){
'use strict';

var aFunction = require('./_a-function'),
    toObject = require('./_to-object'),
    IObject = require('./_iobject'),
    toLength = require('./_to-length');

module.exports = function (that, callbackfn, aLen, memo, isRight) {
  aFunction(callbackfn);
  var O = toObject(that),
      self = IObject(O),
      length = toLength(O.length),
      index = isRight ? length - 1 : 0,
      i = isRight ? -1 : 1;
  if (aLen < 2) for (;;) {
    if (index in self) {
      memo = self[index];
      index += i;
      break;
    }
    index += i;
    if (isRight ? index < 0 : length <= index) {
      throw TypeError('Reduce of empty array with no initial value');
    }
  }
  for (; isRight ? index >= 0 : length > index; index += i) {
    if (index in self) {
      memo = callbackfn(memo, self[index], index, O);
    }
  }return memo;
};

},{"./_a-function":14,"./_iobject":40,"./_to-length":68,"./_to-object":69}],22:[function(require,module,exports){
'use strict';

var isObject = require('./_is-object'),
    isArray = require('./_is-array'),
    SPECIES = require('./_wks')('species');

module.exports = function (original) {
  var C;
  if (isArray(original)) {
    C = original.constructor;
    // cross-realm fallback
    if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
    if (isObject(C)) {
      C = C[SPECIES];
      if (C === null) C = undefined;
    }
  }return C === undefined ? Array : C;
};

},{"./_is-array":42,"./_is-object":43,"./_wks":72}],23:[function(require,module,exports){
'use strict';

// 9.4.2.3 ArraySpeciesCreate(originalArray, length)
var speciesConstructor = require('./_array-species-constructor');

module.exports = function (original, length) {
  return new (speciesConstructor(original))(length);
};

},{"./_array-species-constructor":22}],24:[function(require,module,exports){
'use strict';

// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./_cof'),
    TAG = require('./_wks')('toStringTag')
// ES3 wrong here
,
    ARG = cof(function () {
  return arguments;
}()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function tryGet(it, key) {
  try {
    return it[key];
  } catch (e) {/* empty */}
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
  // @@toStringTag case
  : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
  // builtinTag case
  : ARG ? cof(O)
  // ES3 arguments fallback
  : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

},{"./_cof":25,"./_wks":72}],25:[function(require,module,exports){
"use strict";

var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],26:[function(require,module,exports){
'use strict';

var core = module.exports = { version: '2.4.0' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

},{}],27:[function(require,module,exports){
'use strict';

var $defineProperty = require('./_object-dp'),
    createDesc = require('./_property-desc');

module.exports = function (object, index, value) {
  if (index in object) $defineProperty.f(object, index, createDesc(0, value));else object[index] = value;
};

},{"./_object-dp":52,"./_property-desc":57}],28:[function(require,module,exports){
'use strict';

// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1:
      return function (a) {
        return fn.call(that, a);
      };
    case 2:
      return function (a, b) {
        return fn.call(that, a, b);
      };
    case 3:
      return function (a, b, c) {
        return fn.call(that, a, b, c);
      };
  }
  return function () /* ...args */{
    return fn.apply(that, arguments);
  };
};

},{"./_a-function":14}],29:[function(require,module,exports){
"use strict";

// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

},{}],30:[function(require,module,exports){
'use strict';

// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function () {
  return Object.defineProperty({}, 'a', { get: function get() {
      return 7;
    } }).a != 7;
});

},{"./_fails":34}],31:[function(require,module,exports){
'use strict';

var isObject = require('./_is-object'),
    document = require('./_global').document
// in old IE typeof document.createElement is 'object'
,
    is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};

},{"./_global":35,"./_is-object":43}],32:[function(require,module,exports){
'use strict';

// IE 8- don't enum bug keys
module.exports = 'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'.split(',');

},{}],33:[function(require,module,exports){
'use strict';

var global = require('./_global'),
    core = require('./_core'),
    hide = require('./_hide'),
    redefine = require('./_redefine'),
    ctx = require('./_ctx'),
    PROTOTYPE = 'prototype';

var $export = function $export(type, name, source) {
  var IS_FORCED = type & $export.F,
      IS_GLOBAL = type & $export.G,
      IS_STATIC = type & $export.S,
      IS_PROTO = type & $export.P,
      IS_BIND = type & $export.B,
      target = IS_GLOBAL ? global : IS_STATIC ? global[name] || (global[name] = {}) : (global[name] || {})[PROTOTYPE],
      exports = IS_GLOBAL ? core : core[name] || (core[name] = {}),
      expProto = exports[PROTOTYPE] || (exports[PROTOTYPE] = {}),
      key,
      own,
      out,
      exp;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    // export native or passed
    out = (own ? target : source)[key];
    // bind timers to global for call from export context
    exp = IS_BIND && own ? ctx(out, global) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // extend global
    if (target) redefine(target, key, out, type & $export.U);
    // export
    if (exports[key] != out) hide(exports, key, exp);
    if (IS_PROTO && expProto[key] != out) expProto[key] = out;
  }
};
global.core = core;
// type bitmap
$export.F = 1; // forced
$export.G = 2; // global
$export.S = 4; // static
$export.P = 8; // proto
$export.B = 16; // bind
$export.W = 32; // wrap
$export.U = 64; // safe
$export.R = 128; // real proto method for `library` 
module.exports = $export;

},{"./_core":26,"./_ctx":28,"./_global":35,"./_hide":37,"./_redefine":58}],34:[function(require,module,exports){
"use strict";

module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],35:[function(require,module,exports){
'use strict';

// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

},{}],36:[function(require,module,exports){
"use strict";

var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],37:[function(require,module,exports){
'use strict';

var dP = require('./_object-dp'),
    createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"./_descriptors":30,"./_object-dp":52,"./_property-desc":57}],38:[function(require,module,exports){
'use strict';

module.exports = require('./_global').document && document.documentElement;

},{"./_global":35}],39:[function(require,module,exports){
'use strict';

module.exports = !require('./_descriptors') && !require('./_fails')(function () {
  return Object.defineProperty(require('./_dom-create')('div'), 'a', { get: function get() {
      return 7;
    } }).a != 7;
});

},{"./_descriptors":30,"./_dom-create":31,"./_fails":34}],40:[function(require,module,exports){
'use strict';

// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};

},{"./_cof":25}],41:[function(require,module,exports){
'use strict';

// check on default Array iterator
var Iterators = require('./_iterators'),
    ITERATOR = require('./_wks')('iterator'),
    ArrayProto = Array.prototype;

module.exports = function (it) {
  return it !== undefined && (Iterators.Array === it || ArrayProto[ITERATOR] === it);
};

},{"./_iterators":49,"./_wks":72}],42:[function(require,module,exports){
'use strict';

// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};

},{"./_cof":25}],43:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

module.exports = function (it) {
  return (typeof it === 'undefined' ? 'undefined' : _typeof(it)) === 'object' ? it !== null : typeof it === 'function';
};

},{}],44:[function(require,module,exports){
'use strict';

// call something on iterator step with safe closing on error
var anObject = require('./_an-object');
module.exports = function (iterator, fn, value, entries) {
  try {
    return entries ? fn(anObject(value)[0], value[1]) : fn(value);
    // 7.4.6 IteratorClose(iterator, completion)
  } catch (e) {
    var ret = iterator['return'];
    if (ret !== undefined) anObject(ret.call(iterator));
    throw e;
  }
};

},{"./_an-object":16}],45:[function(require,module,exports){
'use strict';

var create = require('./_object-create'),
    descriptor = require('./_property-desc'),
    setToStringTag = require('./_set-to-string-tag'),
    IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function () {
  return this;
});

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};

},{"./_hide":37,"./_object-create":51,"./_property-desc":57,"./_set-to-string-tag":60,"./_wks":72}],46:[function(require,module,exports){
'use strict';

var LIBRARY = require('./_library'),
    $export = require('./_export'),
    redefine = require('./_redefine'),
    hide = require('./_hide'),
    has = require('./_has'),
    Iterators = require('./_iterators'),
    $iterCreate = require('./_iter-create'),
    setToStringTag = require('./_set-to-string-tag'),
    getPrototypeOf = require('./_object-gpo'),
    ITERATOR = require('./_wks')('iterator'),
    BUGGY = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
,
    FF_ITERATOR = '@@iterator',
    KEYS = 'keys',
    VALUES = 'values';

var returnThis = function returnThis() {
  return this;
};

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function getMethod(kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS:
        return function keys() {
          return new Constructor(this, kind);
        };
      case VALUES:
        return function values() {
          return new Constructor(this, kind);
        };
    }return function entries() {
      return new Constructor(this, kind);
    };
  };
  var TAG = NAME + ' Iterator',
      DEF_VALUES = DEFAULT == VALUES,
      VALUES_BUG = false,
      proto = Base.prototype,
      $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT],
      $default = $native || getMethod(DEFAULT),
      $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined,
      $anyNative = NAME == 'Array' ? proto.entries || $native : $native,
      methods,
      key,
      IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() {
      return $native.call(this);
    };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

},{"./_export":33,"./_has":36,"./_hide":37,"./_iter-create":45,"./_iterators":49,"./_library":50,"./_object-gpo":54,"./_redefine":58,"./_set-to-string-tag":60,"./_wks":72}],47:[function(require,module,exports){
'use strict';

var ITERATOR = require('./_wks')('iterator'),
    SAFE_CLOSING = false;

try {
  var riter = [7][ITERATOR]();
  riter['return'] = function () {
    SAFE_CLOSING = true;
  };
  Array.from(riter, function () {
    throw 2;
  });
} catch (e) {/* empty */}

module.exports = function (exec, skipClosing) {
  if (!skipClosing && !SAFE_CLOSING) return false;
  var safe = false;
  try {
    var arr = [7],
        iter = arr[ITERATOR]();
    iter.next = function () {
      return { done: safe = true };
    };
    arr[ITERATOR] = function () {
      return iter;
    };
    exec(arr);
  } catch (e) {/* empty */}
  return safe;
};

},{"./_wks":72}],48:[function(require,module,exports){
"use strict";

module.exports = function (done, value) {
  return { value: value, done: !!done };
};

},{}],49:[function(require,module,exports){
"use strict";

module.exports = {};

},{}],50:[function(require,module,exports){
"use strict";

module.exports = false;

},{}],51:[function(require,module,exports){
'use strict';

// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = require('./_an-object'),
    dPs = require('./_object-dps'),
    enumBugKeys = require('./_enum-bug-keys'),
    IE_PROTO = require('./_shared-key')('IE_PROTO'),
    Empty = function Empty() {/* empty */},
    PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var _createDict = function createDict() {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe'),
      i = enumBugKeys.length,
      lt = '<',
      gt = '>',
      iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  _createDict = iframeDocument.F;
  while (i--) {
    delete _createDict[PROTOTYPE][enumBugKeys[i]];
  }return _createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = _createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"./_an-object":16,"./_dom-create":31,"./_enum-bug-keys":32,"./_html":38,"./_object-dps":53,"./_shared-key":61}],52:[function(require,module,exports){
'use strict';

var anObject = require('./_an-object'),
    IE8_DOM_DEFINE = require('./_ie8-dom-define'),
    toPrimitive = require('./_to-primitive'),
    dP = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) {/* empty */}
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"./_an-object":16,"./_descriptors":30,"./_ie8-dom-define":39,"./_to-primitive":70}],53:[function(require,module,exports){
'use strict';

var dP = require('./_object-dp'),
    anObject = require('./_an-object'),
    getKeys = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties),
      length = keys.length,
      i = 0,
      P;
  while (length > i) {
    dP.f(O, P = keys[i++], Properties[P]);
  }return O;
};

},{"./_an-object":16,"./_descriptors":30,"./_object-dp":52,"./_object-keys":56}],54:[function(require,module,exports){
'use strict';

// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = require('./_has'),
    toObject = require('./_to-object'),
    IE_PROTO = require('./_shared-key')('IE_PROTO'),
    ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  }return O instanceof Object ? ObjectProto : null;
};

},{"./_has":36,"./_shared-key":61,"./_to-object":69}],55:[function(require,module,exports){
'use strict';

var has = require('./_has'),
    toIObject = require('./_to-iobject'),
    arrayIndexOf = require('./_array-includes')(false),
    IE_PROTO = require('./_shared-key')('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object),
      i = 0,
      result = [],
      key;
  for (key in O) {
    if (key != IE_PROTO) has(O, key) && result.push(key);
  } // Don't enum bug & hidden keys
  while (names.length > i) {
    if (has(O, key = names[i++])) {
      ~arrayIndexOf(result, key) || result.push(key);
    }
  }return result;
};

},{"./_array-includes":19,"./_has":36,"./_shared-key":61,"./_to-iobject":67}],56:[function(require,module,exports){
'use strict';

// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = require('./_object-keys-internal'),
    enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};

},{"./_enum-bug-keys":32,"./_object-keys-internal":55}],57:[function(require,module,exports){
"use strict";

module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],58:[function(require,module,exports){
'use strict';

var global = require('./_global'),
    hide = require('./_hide'),
    has = require('./_has'),
    SRC = require('./_uid')('src'),
    TO_STRING = 'toString',
    $toString = Function[TO_STRING],
    TPL = ('' + $toString).split(TO_STRING);

require('./_core').inspectSource = function (it) {
  return $toString.call(it);
};

(module.exports = function (O, key, val, safe) {
  var isFunction = typeof val == 'function';
  if (isFunction) has(val, 'name') || hide(val, 'name', key);
  if (O[key] === val) return;
  if (isFunction) has(val, SRC) || hide(val, SRC, O[key] ? '' + O[key] : TPL.join(String(key)));
  if (O === global) {
    O[key] = val;
  } else {
    if (!safe) {
      delete O[key];
      hide(O, key, val);
    } else {
      if (O[key]) O[key] = val;else hide(O, key, val);
    }
  }
  // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
})(Function.prototype, TO_STRING, function toString() {
  return typeof this == 'function' && this[SRC] || $toString.call(this);
});

},{"./_core":26,"./_global":35,"./_has":36,"./_hide":37,"./_uid":71}],59:[function(require,module,exports){
'use strict';

var global = require('./_global'),
    dP = require('./_object-dp'),
    DESCRIPTORS = require('./_descriptors'),
    SPECIES = require('./_wks')('species');

module.exports = function (KEY) {
  var C = global[KEY];
  if (DESCRIPTORS && C && !C[SPECIES]) dP.f(C, SPECIES, {
    configurable: true,
    get: function get() {
      return this;
    }
  });
};

},{"./_descriptors":30,"./_global":35,"./_object-dp":52,"./_wks":72}],60:[function(require,module,exports){
'use strict';

var def = require('./_object-dp').f,
    has = require('./_has'),
    TAG = require('./_wks')('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

},{"./_has":36,"./_object-dp":52,"./_wks":72}],61:[function(require,module,exports){
'use strict';

var shared = require('./_shared')('keys'),
    uid = require('./_uid');
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"./_shared":62,"./_uid":71}],62:[function(require,module,exports){
'use strict';

var global = require('./_global'),
    SHARED = '__core-js_shared__',
    store = global[SHARED] || (global[SHARED] = {});
module.exports = function (key) {
  return store[key] || (store[key] = {});
};

},{"./_global":35}],63:[function(require,module,exports){
'use strict';

var fails = require('./_fails');

module.exports = function (method, arg) {
  return !!method && fails(function () {
    arg ? method.call(null, function () {}, 1) : method.call(null);
  });
};

},{"./_fails":34}],64:[function(require,module,exports){
'use strict';

var toInteger = require('./_to-integer'),
    defined = require('./_defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function (TO_STRING) {
  return function (that, pos) {
    var s = String(defined(that)),
        i = toInteger(pos),
        l = s.length,
        a,
        b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff ? TO_STRING ? s.charAt(i) : a : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

},{"./_defined":29,"./_to-integer":66}],65:[function(require,module,exports){
'use strict';

var toInteger = require('./_to-integer'),
    max = Math.max,
    min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

},{"./_to-integer":66}],66:[function(require,module,exports){
"use strict";

// 7.1.4 ToInteger
var ceil = Math.ceil,
    floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

},{}],67:[function(require,module,exports){
'use strict';

// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject'),
    defined = require('./_defined');
module.exports = function (it) {
  return IObject(defined(it));
};

},{"./_defined":29,"./_iobject":40}],68:[function(require,module,exports){
'use strict';

// 7.1.15 ToLength
var toInteger = require('./_to-integer'),
    min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"./_to-integer":66}],69:[function(require,module,exports){
'use strict';

// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function (it) {
  return Object(defined(it));
};

},{"./_defined":29}],70:[function(require,module,exports){
'use strict';

// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"./_is-object":43}],71:[function(require,module,exports){
'use strict';

var id = 0,
    px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

},{}],72:[function(require,module,exports){
'use strict';

var store = require('./_shared')('wks'),
    uid = require('./_uid'),
    _Symbol = require('./_global').Symbol,
    USE_SYMBOL = typeof _Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] = USE_SYMBOL && _Symbol[name] || (USE_SYMBOL ? _Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

},{"./_global":35,"./_shared":62,"./_uid":71}],73:[function(require,module,exports){
'use strict';

var classof = require('./_classof'),
    ITERATOR = require('./_wks')('iterator'),
    Iterators = require('./_iterators');
module.exports = require('./_core').getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
};

},{"./_classof":24,"./_core":26,"./_iterators":49,"./_wks":72}],74:[function(require,module,exports){
'use strict';

// 22.1.3.3 Array.prototype.copyWithin(target, start, end = this.length)
var $export = require('./_export');

$export($export.P, 'Array', { copyWithin: require('./_array-copy-within') });

require('./_add-to-unscopables')('copyWithin');

},{"./_add-to-unscopables":15,"./_array-copy-within":17,"./_export":33}],75:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    $every = require('./_array-methods')(4);

$export($export.P + $export.F * !require('./_strict-method')([].every, true), 'Array', {
  // 22.1.3.5 / 15.4.4.16 Array.prototype.every(callbackfn [, thisArg])
  every: function every(callbackfn /* , thisArg */) {
    return $every(this, callbackfn, arguments[1]);
  }
});

},{"./_array-methods":20,"./_export":33,"./_strict-method":63}],76:[function(require,module,exports){
'use strict';

// 22.1.3.6 Array.prototype.fill(value, start = 0, end = this.length)
var $export = require('./_export');

$export($export.P, 'Array', { fill: require('./_array-fill') });

require('./_add-to-unscopables')('fill');

},{"./_add-to-unscopables":15,"./_array-fill":18,"./_export":33}],77:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    $filter = require('./_array-methods')(2);

$export($export.P + $export.F * !require('./_strict-method')([].filter, true), 'Array', {
  // 22.1.3.7 / 15.4.4.20 Array.prototype.filter(callbackfn [, thisArg])
  filter: function filter(callbackfn /* , thisArg */) {
    return $filter(this, callbackfn, arguments[1]);
  }
});

},{"./_array-methods":20,"./_export":33,"./_strict-method":63}],78:[function(require,module,exports){
'use strict';
// 22.1.3.9 Array.prototype.findIndex(predicate, thisArg = undefined)

var $export = require('./_export'),
    $find = require('./_array-methods')(6),
    KEY = 'findIndex',
    forced = true;
// Shouldn't skip holes
if (KEY in []) Array(1)[KEY](function () {
  forced = false;
});
$export($export.P + $export.F * forced, 'Array', {
  findIndex: function findIndex(callbackfn /*, that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
require('./_add-to-unscopables')(KEY);

},{"./_add-to-unscopables":15,"./_array-methods":20,"./_export":33}],79:[function(require,module,exports){
'use strict';
// 22.1.3.8 Array.prototype.find(predicate, thisArg = undefined)

var $export = require('./_export'),
    $find = require('./_array-methods')(5),
    KEY = 'find',
    forced = true;
// Shouldn't skip holes
if (KEY in []) Array(1)[KEY](function () {
  forced = false;
});
$export($export.P + $export.F * forced, 'Array', {
  find: function find(callbackfn /*, that = undefined */) {
    return $find(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
  }
});
require('./_add-to-unscopables')(KEY);

},{"./_add-to-unscopables":15,"./_array-methods":20,"./_export":33}],80:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    $forEach = require('./_array-methods')(0),
    STRICT = require('./_strict-method')([].forEach, true);

$export($export.P + $export.F * !STRICT, 'Array', {
  // 22.1.3.10 / 15.4.4.18 Array.prototype.forEach(callbackfn [, thisArg])
  forEach: function forEach(callbackfn /* , thisArg */) {
    return $forEach(this, callbackfn, arguments[1]);
  }
});

},{"./_array-methods":20,"./_export":33,"./_strict-method":63}],81:[function(require,module,exports){
'use strict';

var ctx = require('./_ctx'),
    $export = require('./_export'),
    toObject = require('./_to-object'),
    call = require('./_iter-call'),
    isArrayIter = require('./_is-array-iter'),
    toLength = require('./_to-length'),
    createProperty = require('./_create-property'),
    getIterFn = require('./core.get-iterator-method');

$export($export.S + $export.F * !require('./_iter-detect')(function (iter) {
  Array.from(iter);
}), 'Array', {
  // 22.1.2.1 Array.from(arrayLike, mapfn = undefined, thisArg = undefined)
  from: function from(arrayLike /*, mapfn = undefined, thisArg = undefined*/) {
    var O = toObject(arrayLike),
        C = typeof this == 'function' ? this : Array,
        aLen = arguments.length,
        mapfn = aLen > 1 ? arguments[1] : undefined,
        mapping = mapfn !== undefined,
        index = 0,
        iterFn = getIterFn(O),
        length,
        result,
        step,
        iterator;
    if (mapping) mapfn = ctx(mapfn, aLen > 2 ? arguments[2] : undefined, 2);
    // if object isn't iterable or it's array with default iterator - use simple case
    if (iterFn != undefined && !(C == Array && isArrayIter(iterFn))) {
      for (iterator = iterFn.call(O), result = new C(); !(step = iterator.next()).done; index++) {
        createProperty(result, index, mapping ? call(iterator, mapfn, [step.value, index], true) : step.value);
      }
    } else {
      length = toLength(O.length);
      for (result = new C(length); length > index; index++) {
        createProperty(result, index, mapping ? mapfn(O[index], index) : O[index]);
      }
    }
    result.length = index;
    return result;
  }
});

},{"./_create-property":27,"./_ctx":28,"./_export":33,"./_is-array-iter":41,"./_iter-call":44,"./_iter-detect":47,"./_to-length":68,"./_to-object":69,"./core.get-iterator-method":73}],82:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    $indexOf = require('./_array-includes')(false),
    $native = [].indexOf,
    NEGATIVE_ZERO = !!$native && 1 / [1].indexOf(1, -0) < 0;

$export($export.P + $export.F * (NEGATIVE_ZERO || !require('./_strict-method')($native)), 'Array', {
  // 22.1.3.11 / 15.4.4.14 Array.prototype.indexOf(searchElement [, fromIndex])
  indexOf: function indexOf(searchElement /*, fromIndex = 0 */) {
    return NEGATIVE_ZERO
    // convert -0 to +0
    ? $native.apply(this, arguments) || 0 : $indexOf(this, searchElement, arguments[1]);
  }
});

},{"./_array-includes":19,"./_export":33,"./_strict-method":63}],83:[function(require,module,exports){
'use strict';

// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
var $export = require('./_export');

$export($export.S, 'Array', { isArray: require('./_is-array') });

},{"./_export":33,"./_is-array":42}],84:[function(require,module,exports){
'use strict';

var addToUnscopables = require('./_add-to-unscopables'),
    step = require('./_iter-step'),
    Iterators = require('./_iterators'),
    toIObject = require('./_to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./_iter-define')(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0; // next index
  this._k = kind; // kind
  // 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t,
      kind = this._k,
      index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

},{"./_add-to-unscopables":15,"./_iter-define":46,"./_iter-step":48,"./_iterators":49,"./_to-iobject":67}],85:[function(require,module,exports){
'use strict';
// 22.1.3.13 Array.prototype.join(separator)

var $export = require('./_export'),
    toIObject = require('./_to-iobject'),
    arrayJoin = [].join;

// fallback for not array-like strings
$export($export.P + $export.F * (require('./_iobject') != Object || !require('./_strict-method')(arrayJoin)), 'Array', {
  join: function join(separator) {
    return arrayJoin.call(toIObject(this), separator === undefined ? ',' : separator);
  }
});

},{"./_export":33,"./_iobject":40,"./_strict-method":63,"./_to-iobject":67}],86:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    toIObject = require('./_to-iobject'),
    toInteger = require('./_to-integer'),
    toLength = require('./_to-length'),
    $native = [].lastIndexOf,
    NEGATIVE_ZERO = !!$native && 1 / [1].lastIndexOf(1, -0) < 0;

$export($export.P + $export.F * (NEGATIVE_ZERO || !require('./_strict-method')($native)), 'Array', {
  // 22.1.3.14 / 15.4.4.15 Array.prototype.lastIndexOf(searchElement [, fromIndex])
  lastIndexOf: function lastIndexOf(searchElement /*, fromIndex = @[*-1] */) {
    // convert -0 to +0
    if (NEGATIVE_ZERO) return $native.apply(this, arguments) || 0;
    var O = toIObject(this),
        length = toLength(O.length),
        index = length - 1;
    if (arguments.length > 1) index = Math.min(index, toInteger(arguments[1]));
    if (index < 0) index = length + index;
    for (; index >= 0; index--) {
      if (index in O) if (O[index] === searchElement) return index || 0;
    }return -1;
  }
});

},{"./_export":33,"./_strict-method":63,"./_to-integer":66,"./_to-iobject":67,"./_to-length":68}],87:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    $map = require('./_array-methods')(1);

$export($export.P + $export.F * !require('./_strict-method')([].map, true), 'Array', {
  // 22.1.3.15 / 15.4.4.19 Array.prototype.map(callbackfn [, thisArg])
  map: function map(callbackfn /* , thisArg */) {
    return $map(this, callbackfn, arguments[1]);
  }
});

},{"./_array-methods":20,"./_export":33,"./_strict-method":63}],88:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    createProperty = require('./_create-property');

// WebKit Array.of isn't generic
$export($export.S + $export.F * require('./_fails')(function () {
  function F() {}
  return !(Array.of.call(F) instanceof F);
}), 'Array', {
  // 22.1.2.3 Array.of( ...items)
  of: function of() /* ...args */{
    var index = 0,
        aLen = arguments.length,
        result = new (typeof this == 'function' ? this : Array)(aLen);
    while (aLen > index) {
      createProperty(result, index, arguments[index++]);
    }result.length = aLen;
    return result;
  }
});

},{"./_create-property":27,"./_export":33,"./_fails":34}],89:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    $reduce = require('./_array-reduce');

$export($export.P + $export.F * !require('./_strict-method')([].reduceRight, true), 'Array', {
  // 22.1.3.19 / 15.4.4.22 Array.prototype.reduceRight(callbackfn [, initialValue])
  reduceRight: function reduceRight(callbackfn /* , initialValue */) {
    return $reduce(this, callbackfn, arguments.length, arguments[1], true);
  }
});

},{"./_array-reduce":21,"./_export":33,"./_strict-method":63}],90:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    $reduce = require('./_array-reduce');

$export($export.P + $export.F * !require('./_strict-method')([].reduce, true), 'Array', {
  // 22.1.3.18 / 15.4.4.21 Array.prototype.reduce(callbackfn [, initialValue])
  reduce: function reduce(callbackfn /* , initialValue */) {
    return $reduce(this, callbackfn, arguments.length, arguments[1], false);
  }
});

},{"./_array-reduce":21,"./_export":33,"./_strict-method":63}],91:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    html = require('./_html'),
    cof = require('./_cof'),
    toIndex = require('./_to-index'),
    toLength = require('./_to-length'),
    arraySlice = [].slice;

// fallback for not array-like ES3 strings and DOM objects
$export($export.P + $export.F * require('./_fails')(function () {
  if (html) arraySlice.call(html);
}), 'Array', {
  slice: function slice(begin, end) {
    var len = toLength(this.length),
        klass = cof(this);
    end = end === undefined ? len : end;
    if (klass == 'Array') return arraySlice.call(this, begin, end);
    var start = toIndex(begin, len),
        upTo = toIndex(end, len),
        size = toLength(upTo - start),
        cloned = Array(size),
        i = 0;
    for (; i < size; i++) {
      cloned[i] = klass == 'String' ? this.charAt(start + i) : this[start + i];
    }return cloned;
  }
});

},{"./_cof":25,"./_export":33,"./_fails":34,"./_html":38,"./_to-index":65,"./_to-length":68}],92:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    $some = require('./_array-methods')(3);

$export($export.P + $export.F * !require('./_strict-method')([].some, true), 'Array', {
  // 22.1.3.23 / 15.4.4.17 Array.prototype.some(callbackfn [, thisArg])
  some: function some(callbackfn /* , thisArg */) {
    return $some(this, callbackfn, arguments[1]);
  }
});

},{"./_array-methods":20,"./_export":33,"./_strict-method":63}],93:[function(require,module,exports){
'use strict';

var $export = require('./_export'),
    aFunction = require('./_a-function'),
    toObject = require('./_to-object'),
    fails = require('./_fails'),
    $sort = [].sort,
    test = [1, 2, 3];

$export($export.P + $export.F * (fails(function () {
  // IE8-
  test.sort(undefined);
}) || !fails(function () {
  // V8 bug
  test.sort(null);
  // Old WebKit
}) || !require('./_strict-method')($sort)), 'Array', {
  // 22.1.3.25 Array.prototype.sort(comparefn)
  sort: function sort(comparefn) {
    return comparefn === undefined ? $sort.call(toObject(this)) : $sort.call(toObject(this), aFunction(comparefn));
  }
});

},{"./_a-function":14,"./_export":33,"./_fails":34,"./_strict-method":63,"./_to-object":69}],94:[function(require,module,exports){
'use strict';

require('./_set-species')('Array');

},{"./_set-species":59}],95:[function(require,module,exports){
'use strict';

var $at = require('./_string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./_iter-define')(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0; // next index
  // 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t,
      index = this._i,
      point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});

},{"./_iter-define":46,"./_string-at":64}],96:[function(require,module,exports){
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

},{"array-back":1}],97:[function(require,module,exports){
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

},{"array-back":1,"test-value":147}],98:[function(require,module,exports){
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
        length = entries ? entries.length : 0;

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

},{"./_hashClear":113,"./_hashDelete":114,"./_hashGet":115,"./_hashHas":116,"./_hashSet":117}],99:[function(require,module,exports){
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
        length = entries ? entries.length : 0;

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

},{"./_listCacheClear":122,"./_listCacheDelete":123,"./_listCacheGet":124,"./_listCacheHas":125,"./_listCacheSet":126}],100:[function(require,module,exports){
'use strict';

var getNative = require('./_getNative'),
    root = require('./_root');

/* Built-in method references that are verified to be native. */
var Map = getNative(root, 'Map');

module.exports = Map;

},{"./_getNative":111,"./_root":133}],101:[function(require,module,exports){
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
        length = entries ? entries.length : 0;

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

},{"./_mapCacheClear":127,"./_mapCacheDelete":128,"./_mapCacheGet":129,"./_mapCacheHas":130,"./_mapCacheSet":131}],102:[function(require,module,exports){
'use strict';

var root = require('./_root');

/** Built-in value references. */
var _Symbol = root.Symbol;

module.exports = _Symbol;

},{"./_root":133}],103:[function(require,module,exports){
'use strict';

var eq = require('./eq');

/**
 * Gets the index at which the `key` is found in `array` of key-value pairs.
 *
 * @private
 * @param {Array} array The array to search.
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

},{"./eq":137}],104:[function(require,module,exports){
'use strict';

var castPath = require('./_castPath'),
    isKey = require('./_isKey'),
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
  path = isKey(path, object) ? [path] : castPath(path);

  var index = 0,
      length = path.length;

  while (object != null && index < length) {
    object = object[toKey(path[index++])];
  }
  return index && index == length ? object : undefined;
}

module.exports = baseGet;

},{"./_castPath":107,"./_isKey":119,"./_toKey":135}],105:[function(require,module,exports){
'use strict';

var isFunction = require('./isFunction'),
    isHostObject = require('./_isHostObject'),
    isMasked = require('./_isMasked'),
    isObject = require('./isObject'),
    toSource = require('./_toSource');

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/6.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = Function.prototype.toString;

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
  var pattern = isFunction(value) || isHostObject(value) ? reIsNative : reIsHostCtor;
  return pattern.test(toSource(value));
}

module.exports = baseIsNative;

},{"./_isHostObject":118,"./_isMasked":121,"./_toSource":136,"./isFunction":140,"./isObject":141}],106:[function(require,module,exports){
'use strict';

var _Symbol = require('./_Symbol'),
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
  if (isSymbol(value)) {
    return symbolToString ? symbolToString.call(value) : '';
  }
  var result = value + '';
  return result == '0' && 1 / value == -INFINITY ? '-0' : result;
}

module.exports = baseToString;

},{"./_Symbol":102,"./isSymbol":143}],107:[function(require,module,exports){
'use strict';

var isArray = require('./isArray'),
    stringToPath = require('./_stringToPath');

/**
 * Casts `value` to a path array if it's not one.
 *
 * @private
 * @param {*} value The value to inspect.
 * @returns {Array} Returns the cast property path array.
 */
function castPath(value) {
  return isArray(value) ? value : stringToPath(value);
}

module.exports = castPath;

},{"./_stringToPath":134,"./isArray":139}],108:[function(require,module,exports){
'use strict';

var root = require('./_root');

/** Used to detect overreaching core-js shims. */
var coreJsData = root['__core-js_shared__'];

module.exports = coreJsData;

},{"./_root":133}],109:[function(require,module,exports){
(function (global){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/** Detect free variable `global` from Node.js. */
var freeGlobal = (typeof global === 'undefined' ? 'undefined' : _typeof(global)) == 'object' && global && global.Object === Object && global;

module.exports = freeGlobal;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],110:[function(require,module,exports){
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

},{"./_isKeyable":120}],111:[function(require,module,exports){
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

},{"./_baseIsNative":105,"./_getValue":112}],112:[function(require,module,exports){
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

},{}],113:[function(require,module,exports){
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
}

module.exports = hashClear;

},{"./_nativeCreate":132}],114:[function(require,module,exports){
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
  return this.has(key) && delete this.__data__[key];
}

module.exports = hashDelete;

},{}],115:[function(require,module,exports){
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

},{"./_nativeCreate":132}],116:[function(require,module,exports){
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

},{"./_nativeCreate":132}],117:[function(require,module,exports){
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
  data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
  return this;
}

module.exports = hashSet;

},{"./_nativeCreate":132}],118:[function(require,module,exports){
'use strict';

/**
 * Checks if `value` is a host object in IE < 9.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a host object, else `false`.
 */
function isHostObject(value) {
  // Many host objects are `Object` objects that can coerce to strings
  // despite having improperly defined `toString` methods.
  var result = false;
  if (value != null && typeof value.toString != 'function') {
    try {
      result = !!(value + '');
    } catch (e) {}
  }
  return result;
}

module.exports = isHostObject;

},{}],119:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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

},{"./isArray":139,"./isSymbol":143}],120:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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

},{}],121:[function(require,module,exports){
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

},{"./_coreJsData":108}],122:[function(require,module,exports){
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
}

module.exports = listCacheClear;

},{}],123:[function(require,module,exports){
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
  return true;
}

module.exports = listCacheDelete;

},{"./_assocIndexOf":103}],124:[function(require,module,exports){
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

},{"./_assocIndexOf":103}],125:[function(require,module,exports){
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

},{"./_assocIndexOf":103}],126:[function(require,module,exports){
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
    data.push([key, value]);
  } else {
    data[index][1] = value;
  }
  return this;
}

module.exports = listCacheSet;

},{"./_assocIndexOf":103}],127:[function(require,module,exports){
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
  this.__data__ = {
    'hash': new Hash(),
    'map': new (Map || ListCache)(),
    'string': new Hash()
  };
}

module.exports = mapCacheClear;

},{"./_Hash":98,"./_ListCache":99,"./_Map":100}],128:[function(require,module,exports){
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
  return getMapData(this, key)['delete'](key);
}

module.exports = mapCacheDelete;

},{"./_getMapData":110}],129:[function(require,module,exports){
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

},{"./_getMapData":110}],130:[function(require,module,exports){
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

},{"./_getMapData":110}],131:[function(require,module,exports){
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
  getMapData(this, key).set(key, value);
  return this;
}

module.exports = mapCacheSet;

},{"./_getMapData":110}],132:[function(require,module,exports){
'use strict';

var getNative = require('./_getNative');

/* Built-in method references that are verified to be native. */
var nativeCreate = getNative(Object, 'create');

module.exports = nativeCreate;

},{"./_getNative":111}],133:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var freeGlobal = require('./_freeGlobal');

/** Detect free variable `self`. */
var freeSelf = (typeof self === 'undefined' ? 'undefined' : _typeof(self)) == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = freeGlobal || freeSelf || Function('return this')();

module.exports = root;

},{"./_freeGlobal":109}],134:[function(require,module,exports){
'use strict';

var memoize = require('./memoize'),
    toString = require('./toString');

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
var stringToPath = memoize(function (string) {
  string = toString(string);

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

},{"./memoize":144,"./toString":145}],135:[function(require,module,exports){
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

},{"./isSymbol":143}],136:[function(require,module,exports){
'use strict';

/** Used to resolve the decompiled source of functions. */
var funcToString = Function.prototype.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to process.
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

},{}],137:[function(require,module,exports){
"use strict";

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/6.0/#sec-samevaluezero)
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

},{}],138:[function(require,module,exports){
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

},{"./_baseGet":104}],139:[function(require,module,exports){
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

},{}],140:[function(require,module,exports){
'use strict';

var isObject = require('./isObject');

/** `Object#toString` result references. */
var funcTag = '[object Function]',
    genTag = '[object GeneratorFunction]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

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
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 8 which returns 'object' for typed array and weak map constructors,
  // and PhantomJS 1.9 which returns 'function' for `NodeList` instances.
  var tag = isObject(value) ? objectToString.call(value) : '';
  return tag == funcTag || tag == genTag;
}

module.exports = isFunction;

},{"./isObject":141}],141:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/6.0/#sec-ecmascript-language-types)
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
  return !!value && (type == 'object' || type == 'function');
}

module.exports = isObject;

},{}],142:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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
  return !!value && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
}

module.exports = isObjectLike;

},{}],143:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var isObjectLike = require('./isObjectLike');

/** `Object#toString` result references. */
var symbolTag = '[object Symbol]';

/** Used for built-in method references. */
var objectProto = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/6.0/#sec-object.prototype.tostring)
 * of values.
 */
var objectToString = objectProto.toString;

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
  return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'symbol' || isObjectLike(value) && objectToString.call(value) == symbolTag;
}

module.exports = isSymbol;

},{"./isObjectLike":142}],144:[function(require,module,exports){
'use strict';

var MapCache = require('./_MapCache');

/** Used as the `TypeError` message for "Functions" methods. */
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
 * [`Map`](http://ecma-international.org/ecma-262/6.0/#sec-properties-of-the-map-prototype-object)
 * method interface of `delete`, `get`, `has`, and `set`.
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
  if (typeof func != 'function' || resolver && typeof resolver != 'function') {
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
    memoized.cache = cache.set(key, result);
    return result;
  };
  memoized.cache = new (memoize.Cache || MapCache)();
  return memoized;
}

// Assign cache to `_.memoize`.
memoize.Cache = MapCache;

module.exports = memoize;

},{"./_MapCache":101}],145:[function(require,module,exports){
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
 * @param {*} value The value to process.
 * @returns {string} Returns the string.
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

},{"./_baseToString":106}],146:[function(require,module,exports){
'use strict';

// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
    try {
        cachedSetTimeout = setTimeout;
    } catch (e) {
        cachedSetTimeout = function cachedSetTimeout() {
            throw new Error('setTimeout is not defined');
        };
    }
    try {
        cachedClearTimeout = clearTimeout;
    } catch (e) {
        cachedClearTimeout = function cachedClearTimeout() {
            throw new Error('clearTimeout is not defined');
        };
    }
})();
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
    var timeout = cachedSetTimeout.call(null, cleanUpNextTick);
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
    cachedClearTimeout.call(null, timeout);
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
        cachedSetTimeout.call(null, drainQueue, 0);
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

},{}],147:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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
 * @returns {boolean}
 */
function testValue(value, test) {
  if (t.isPlainObject(test) && t.isObject(value)) {
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

      var result = testValue(objectValue, queryValue);
      return isNegated ? !result : result;
    });
  } else if (Array.isArray(test)) {
    var tests = test;
    if (!Array.isArray(value)) value = [value];
    return value.some(function (val) {
      return tests.some(function (test) {
        return testValue(val, test);
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
  } else if (typeof test === 'function') {
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

},{"array-back":1,"typical":148}],148:[function(require,module,exports){
'use strict';

/**
 * For type-checking Javascript values.
 * @module typical
 * @typicalname t
 * @example
 * const t = require('typical')
 */

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

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

},{}],149:[function(require,module,exports){
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
}; /**
    * Clear Layers
    *
    * Clears the selected layers of any populated data and removes any metadata.
    */

},{"../context":156,"../library/layers":171,"../library/populator":174}],150:[function(require,module,exports){
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

},{"./clearLayers.js":149,"./populateAgain.js":151,"./populateTable.js":152,"./populateWithJSON.js":153,"./populateWithPreset.js":154,"./revealPresets.js":155}],151:[function(require,module,exports){
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

},{"../context":156,"../library/options":172,"../library/populator":174,"./populateTable":152,"./populateWithJSON":153,"./populateWithPreset":154}],152:[function(require,module,exports){
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

},{"../context":156,"../library/data":165,"../library/gui":170,"../library/layers":171,"../library/options":172,"../library/populator":174}],153:[function(require,module,exports){
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

},{"../context":156,"../library/data":165,"../library/gui":170,"../library/layers":171,"../library/options":172,"../library/populator":174}],154:[function(require,module,exports){
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

},{"../context":156,"../library/data":165,"../library/gui":170,"../library/layers":171,"../library/options":172,"../library/populator":174}],155:[function(require,module,exports){
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

},{"../context":156,"../library/data":165}],156:[function(require,module,exports){
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

},{}],157:[function(require,module,exports){
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

},{}],158:[function(require,module,exports){
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

},{}],159:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.performActions = performActions;
exports.extractActions = extractActions;
exports.parseAction = parseAction;
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

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Load action functions
 */
/**
 * Actions library
 *
 * Provides functionality to extract, parse and execute actions.
 */

var actions = [ShowAction, HideAction, LockAction, UnlockAction, DeleteAction, PluginAction];

/**
 * Perform all actions on a layer.
 *
 * @param {MSLayer} layer
 * @param {Object} data
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

},{"../../context":156,"../placeholders":173,"./delete":157,"./hide":158,"./lock":160,"./plugin":161,"./show":162,"./unlock":163}],160:[function(require,module,exports){
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

},{}],161:[function(require,module,exports){
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

},{"../layers":171,"../utils":175}],162:[function(require,module,exports){
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

},{}],163:[function(require,module,exports){
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

},{}],164:[function(require,module,exports){
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

},{"command-line-args":7}],165:[function(require,module,exports){
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

},{"../context":156}],166:[function(require,module,exports){
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

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var filters = [JoinFilter, MaxFilter, UppercaseFilter];

/**
 * Extracts filters from the placeholder string, e.g. firstName, lastName | & •
 *
 * @param {string} string
 * @returns {Array}
 */
/**
 * Filters library
 *
 * Provides functionality extract, parse and apply filters.
 */

/**
 * Load filter functions
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
  var command = filterString.split(/(\s*\S+)/g)[1];

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

},{"./join":167,"./max":168,"./uppercase":169}],167:[function(require,module,exports){
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

},{}],168:[function(require,module,exports){
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

},{}],169:[function(require,module,exports){
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

},{}],170:[function(require,module,exports){
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
  var alert = createAlert(alertTitle[type], alertDesc[type], 'icon_new.png');

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

},{"../context":156,"./options":172,"./populator":174}],171:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ANY = exports.SYMBOL_MASTER = exports.SYMBOL = exports.BITMAP = exports.SHAPE = exports.TEXT = exports.GROUP = exports.ARTBOARD = exports.PAGE = undefined;
exports.findLayersInLayer = findLayersInLayer;
exports.findLayerInLayer = findLayerInLayer;
exports.findPageWithName = findPageWithName;
exports.refreshTextLayer = refreshTextLayer;
exports.getSelectedLayers = getSelectedLayers;
exports.selectLayers = selectLayers;
exports.addPage = addPage;
exports.removePage = removePage;
exports.isSymbolInstance = isSymbolInstance;
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

},{"../context":156,"./utils":175}],172:[function(require,module,exports){
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

},{"./utils":175}],173:[function(require,module,exports){
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

  return populated;
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

},{"./filters":166,"lodash/get":138}],174:[function(require,module,exports){
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

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Populate types:
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
/**
 * Populator library
 *
 * Provides functionality to populate layers.
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
  var lastRandomIndex = 0;

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
 *
 * opt: {
 *   rootDir: {string},
 *   trimText: {boolean},
 *   insertEllipsis: {boolean},
 *   defaultSubstitute: {string}
 * }
 */
function populateSymbolLayer(layer, data, opt) {

  //get existing overrides
  var existingOverrides = layer.overrides();
  if (existingOverrides) {
    existingOverrides = layer.overrides().objectForKey(NSNumber.numberWithInt(0));
  } else {
    existingOverrides = NSDictionary.alloc().init();
  }

  //create mutable overrides
  var overrides = NSMutableDictionary.dictionaryWithDictionary(existingOverrides);

  //get master for symbol instance
  var symbolMaster = layer.symbolMaster();

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

    //get overrides from nested symbol
    var nestedOverrides = populateSymbolLayer(symbolLayer, data, opt);
    overrides.setValue_forKey(nestedOverrides, symbolLayer.objectID());
  });

  //set new overrides
  layer.setOverrides(NSDictionary.dictionaryWithObject_forKey(overrides, NSNumber.numberWithInt(0)));

  //return overrides
  return overrides;
}

/**
 * Clears the symbol layer.
 *
 * @param {MSSymbolInstance} layer
 */
function clearSymbolLayer(layer) {

  //remove overrides
  layer.setOverrides(null);

  //remove metadata
  removeLayerMetadata(layer);
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
  fill.setPatternFillType(1);

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

},{"../context":156,"./actions":159,"./args":164,"./data":165,"./layers":171,"./placeholders":173,"./utils":175}],175:[function(require,module,exports){
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

},{}],176:[function(require,module,exports){
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
  version: '2.0.0',
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
      run: commands.populateWithPreset
    },
    populateWithJSON: {
      name: 'Populate with JSON',
      shortcut: '',
      run: commands.populateWithJSON
    },
    populateTable: {
      name: 'Populate Table',
      shortcut: '',
      run: commands.populateTable
    },
    populateAgain: {
      name: 'Populate Again',
      shortcut: 'cmd shift x',
      run: commands.populateAgain
    },
    revealPresets: {
      name: 'Reveal Presets',
      shortcut: '',
      run: commands.revealPresets
    },
    clearLayers: {
      name: 'Clear Layers',
      shortcut: '',
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
    "version": "2.0.0",
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
            "shortcut": ""
        },
        {
            "identifier": "populateWithJSON",
            "handler": "___populateWithJson_run_handler_",
            "script": "plugin.js",
            "name": "Populate with JSON",
            "shortcut": ""
        },
        {
            "identifier": "populateTable",
            "handler": "___populateTable_run_handler_",
            "script": "plugin.js",
            "name": "Populate Table",
            "shortcut": ""
        },
        {
            "identifier": "populateAgain",
            "handler": "___populateAgain_run_handler_",
            "script": "plugin.js",
            "name": "Populate Again",
            "shortcut": "cmd shift x"
        },
        {
            "identifier": "revealPresets",
            "handler": "___revealPresets_run_handler_",
            "script": "plugin.js",
            "name": "Reveal Presets",
            "shortcut": ""
        },
        {
            "identifier": "clearLayers",
            "handler": "___clearLayers_run_handler_",
            "script": "plugin.js",
            "name": "Clear Layers",
            "shortcut": ""
        }
    ],
    "disableCocoaScriptPreprocessor": true
}__$end_of_manifest_
*/

},{"./commands":150}]},{},[176]);
