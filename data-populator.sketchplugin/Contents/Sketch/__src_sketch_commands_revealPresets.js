var globalThis=this,global=this;function __skpm_run(e,t){globalThis.context=t;try{var n=function(e){var t={};function n(r){if(t[r])return t[r].exports;var o=t[r]={i:r,l:!1,exports:{}};return e[r].call(o.exports,o,o.exports,n),o.l=!0,o.exports}return n.m=e,n.c=t,n.d=function(e,t,r){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:r})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var r=Object.create(null);if(n.r(r),Object.defineProperty(r,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)n.d(r,o,function(t){return e[t]}.bind(null,o));return r},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=13)}([function(e,t){e.exports=require("sketch")},function(e,t,n){"use strict";(function(e){var r,o,a,i,s,l,u=n(6),c="20748e915398f2569e92f47b1ecc2126",d=["development"];function f(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:{};console.log("Tracking",t,n),r?d.includes(o)?console.log("Device ID ignored",o):e("https://api.amplitude.com/2/httpapi",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({api_key:c,events:[{device_id:o,ip:"$remote",event_type:t,user_properties:{hostName:a,hostVersion:i,hostOS:s,pluginVersion:l},event_properties:n}]})}):console.log("Tracking disabled")}var p=n.n(u)()(f,500);t.a={configure:function(e){console.log("configuring analytics"),console.log(e),r=e.trackingEnabled,o=e.deviceId,a=e.hostName,i=e.hostVersion,s=e.hostOS,l=e.pluginVersion},setEnabled:function(e){console.log("Tracking set to ",e?"enabled":"disabled"),r=e},track:f,trackDebounced:p}}).call(this,n(10))},function(e,t,n){(function(e){var r;!function(o){var a=t,i=(e&&e.exports,"object"==typeof global&&global);i.global!==i&&i.window;var s=function(e){this.message=e};(s.prototype=new Error).name="InvalidCharacterError";var l=function(e){throw new s(e)},u="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",c=/[\t\n\f\r ]/g,d={encode:function(e){e=String(e),/[^\0-\xFF]/.test(e)&&l("The string to be encoded contains characters outside of the Latin1 range.");for(var t,n,r,o,a=e.length%3,i="",s=-1,c=e.length-a;++s<c;)t=e.charCodeAt(s)<<16,n=e.charCodeAt(++s)<<8,r=e.charCodeAt(++s),i+=u.charAt((o=t+n+r)>>18&63)+u.charAt(o>>12&63)+u.charAt(o>>6&63)+u.charAt(63&o);return 2==a?(t=e.charCodeAt(s)<<8,n=e.charCodeAt(++s),i+=u.charAt((o=t+n)>>10)+u.charAt(o>>4&63)+u.charAt(o<<2&63)+"="):1==a&&(o=e.charCodeAt(s),i+=u.charAt(o>>2)+u.charAt(o<<4&63)+"=="),i},decode:function(e){var t=(e=String(e).replace(c,"")).length;t%4==0&&(t=(e=e.replace(/==?$/,"")).length),(t%4==1||/[^+a-zA-Z0-9/]/.test(e))&&l("Invalid character: the string to be decoded is not correctly encoded.");for(var n,r,o=0,a="",i=-1;++i<t;)r=u.indexOf(e.charAt(i)),n=o%4?64*n+r:r,o++%4&&(a+=String.fromCharCode(255&n>>(-2*o&6)));return a},version:"0.1.0"};void 0===(r=function(){return d}.call(t,n,t,e))||(e.exports=r)}()}).call(this,n(9)(e))},function(e,t,n){!function(e){var t,n,r,o=String.fromCharCode;function a(e){for(var t,n,r=[],o=0,a=e.length;o<a;)(t=e.charCodeAt(o++))>=55296&&t<=56319&&o<a?56320==(64512&(n=e.charCodeAt(o++)))?r.push(((1023&t)<<10)+(1023&n)+65536):(r.push(t),o--):r.push(t);return r}function i(e){if(e>=55296&&e<=57343)throw Error("Lone surrogate U+"+e.toString(16).toUpperCase()+" is not a scalar value")}function s(e,t){return o(e>>t&63|128)}function l(e){if(0==(4294967168&e))return o(e);var t="";return 0==(4294965248&e)?t=o(e>>6&31|192):0==(4294901760&e)?(i(e),t=o(e>>12&15|224),t+=s(e,6)):0==(4292870144&e)&&(t=o(e>>18&7|240),t+=s(e,12),t+=s(e,6)),t+=o(63&e|128)}function u(){if(r>=n)throw Error("Invalid byte index");var e=255&t[r];if(r++,128==(192&e))return 63&e;throw Error("Invalid continuation byte")}function c(){var e,o;if(r>n)throw Error("Invalid byte index");if(r==n)return!1;if(e=255&t[r],r++,0==(128&e))return e;if(192==(224&e)){if((o=(31&e)<<6|u())>=128)return o;throw Error("Invalid continuation byte")}if(224==(240&e)){if((o=(15&e)<<12|u()<<6|u())>=2048)return i(o),o;throw Error("Invalid continuation byte")}if(240==(248&e)&&(o=(7&e)<<18|u()<<12|u()<<6|u())>=65536&&o<=1114111)return o;throw Error("Invalid UTF-8 detected")}e.version="3.0.0",e.encode=function(e){for(var t=a(e),n=t.length,r=-1,o="";++r<n;)o+=l(t[r]);return o},e.decode=function(e){t=a(e),n=t.length,r=0;for(var i,s=[];!1!==(i=c());)s.push(i);return function(e){for(var t,n=e.length,r=-1,a="";++r<n;)(t=e[r])>65535&&(a+=o((t-=65536)>>>10&1023|55296),t=56320|1023&t),a+=o(t);return a}(s)}}(t)},function(e,t){function n(t){return"function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?e.exports=n=function(e){return typeof e}:e.exports=n=function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},n(t)}e.exports=n},function(e,t,n){var r=n(7),o=n(8);e.exports=function(e,t,n){var a=t&&n||0;"string"==typeof e&&(t="binary"===e?new Array(16):null,e=null);var i=(e=e||{}).random||(e.rng||r)();if(i[6]=15&i[6]|64,i[8]=63&i[8]|128,t)for(var s=0;s<16;++s)t[a+s]=i[s];return t||o(i)}},function(e,t){function n(e,t,n){var r,o,a,i,s;function l(){var u=Date.now()-i;u<t&&u>=0?r=setTimeout(l,t-u):(r=null,n||(s=e.apply(a,o),a=o=null))}null==t&&(t=100);var u=function(){a=this,o=arguments,i=Date.now();var u=n&&!r;return r||(r=setTimeout(l,t)),u&&(s=e.apply(a,o),a=o=null),s};return u.clear=function(){r&&(clearTimeout(r),r=null)},u.flush=function(){r&&(s=e.apply(a,o),a=o=null,clearTimeout(r),r=null)},u}n.debounce=n,e.exports=n},function(e,t){var n="undefined"!=typeof crypto&&crypto.getRandomValues&&crypto.getRandomValues.bind(crypto)||"undefined"!=typeof msCrypto&&"function"==typeof window.msCrypto.getRandomValues&&msCrypto.getRandomValues.bind(msCrypto);if(n){var r=new Uint8Array(16);e.exports=function(){return n(r),r}}else{var o=new Array(16);e.exports=function(){for(var e,t=0;t<16;t++)0==(3&t)&&(e=4294967296*Math.random()),o[t]=e>>>((3&t)<<3)&255;return o}}},function(e,t){for(var n=[],r=0;r<256;++r)n[r]=(r+256).toString(16).substr(1);e.exports=function(e,t){var r=t||0,o=n;return[o[e[r++]],o[e[r++]],o[e[r++]],o[e[r++]],"-",o[e[r++]],o[e[r++]],"-",o[e[r++]],o[e[r++]],"-",o[e[r++]],o[e[r++]],"-",o[e[r++]],o[e[r++]],o[e[r++]],o[e[r++]],o[e[r++]],o[e[r++]]].join("")}},function(e,t){e.exports=function(e){return e.webpackPolyfill||(e.deprecate=function(){},e.paths=[],e.children||(e.children=[]),Object.defineProperty(e,"loaded",{enumerable:!0,get:function(){return e.l}}),Object.defineProperty(e,"id",{enumerable:!0,get:function(){return e.i}}),e.webpackPolyfill=1),e}},function(e,t,n){(function(t){var r;try{r=n(12).Buffer}catch(o){}e.exports=function(e,n){if("object"!=typeof e||e.isKindOfClass&&e.isKindOfClass(NSString)||(e=(n=e).url),n=n||{},!e)return t.reject("Missing URL");var a;try{a=coscript.createFiber()}catch(o){coscript.shouldKeepAround=!0}return new t((function(o,i){var s=NSURL.alloc().initWithString(e),l=NSMutableURLRequest.requestWithURL(s);if(l.setHTTPMethod(n.method||"GET"),Object.keys(n.headers||{}).forEach((function(e){l.setValue_forHTTPHeaderField(n.headers[e],e)})),n.body){var u;if("string"==typeof n.body)u=NSString.alloc().initWithString(n.body).dataUsingEncoding(NSUTF8StringEncoding);else if(r&&r.isBuffer(n.body))u=n.body.toNSData();else if(n.body.isKindOfClass&&1==n.body.isKindOfClass(NSData))u=n.body;else if(n.body._isFormData){var c=n.body._boundary;(u=n.body._data).appendData(NSString.alloc().initWithString("--"+c+"--\r\n").dataUsingEncoding(NSUTF8StringEncoding)),l.setValue_forHTTPHeaderField("multipart/form-data; boundary="+c,"Content-Type")}else{u=NSJSONSerialization.dataWithJSONObject_options_error(n.body,NSJSONWritingPrettyPrinted,void 0),l.setValue_forHTTPHeaderField(""+u.length(),"Content-Length")}l.setHTTPBody(u)}if(n.cache)switch(n.cache){case"reload":case"no-cache":case"no-store":l.setCachePolicy(1);case"force-cache":l.setCachePolicy(2);case"only-if-cached":l.setCachePolicy(3)}n.credentials||l.setHTTPShouldHandleCookies(!1);var d=!1,f=NSURLSession.sharedSession().dataTaskWithRequest_completionHandler(l,__mocha__.createBlock_function('v32@?0@"NSData"8@"NSURLResponse"16@"NSError"24',(function(e,n,s){return a?a.cleanup():coscript.shouldKeepAround=!1,s?(d=!0,i(s)):o(function e(n,o){for(var a,i=[],s=[],l={},u=0;u<n.allHeaderFields().allKeys().length;u++){var c=n.allHeaderFields().allKeys()[u].toLowerCase(),d=String(n.allHeaderFields()[c]);i.push(c),s.push([c,d]),a=l[c],l[c]=a?a+","+d:d}return{ok:1==(n.statusCode()/200|0),status:Number(n.statusCode()),statusText:String(NSHTTPURLResponse.localizedStringForStatusCode(n.statusCode())),useFinalURL:!0,url:String(n.URL().absoluteString()),clone:e.bind(this,n,o),text:function(){return new t((function(e,t){const n=String(NSString.alloc().initWithData_encoding(o,NSASCIIStringEncoding));n?e(n):t(new Error("Couldn't parse body"))}))},json:function(){return new t((function(e,t){var n=String(NSString.alloc().initWithData_encoding(o,NSUTF8StringEncoding));n?e(JSON.parse(n)):t(new Error("Could not parse JSON because it is not valid UTF-8 data."))}))},blob:function(){return t.resolve(o)},arrayBuffer:function(){return t.resolve(r.from(o))},headers:{keys:function(){return i},entries:function(){return s},get:function(e){return l[e.toLowerCase()]},has:function(e){return e.toLowerCase()in l}}}}(n,e))})));f.resume(),a&&a.onCleanup((function(){d||f.cancel()}))}))}}).call(this,n(11))},function(e,t){function n(){}function r(e){if(!(this instanceof r))throw new TypeError("Promises must be constructed via new");if("function"!=typeof e)throw new TypeError("not a function");this._state=0,this._handled=!1,this._value=void 0,this._deferreds=[],u(e,this)}function o(e,t){for(;3===e._state;)e=e._value;0!==e._state?(e._handled=!0,r._immediateFn((function(){var n=1===e._state?t.onFulfilled:t.onRejected;if(null!==n){var r;try{r=n(e._value)}catch(o){return void i(t.promise,o)}a(t.promise,r)}else(1===e._state?a:i)(t.promise,e._value)}))):e._deferreds.push(t)}function a(e,t){try{if(t===e)throw new TypeError("A promise cannot be resolved with itself.");if(t&&("object"==typeof t||"function"==typeof t)){var n=t.then;if(t instanceof r)return e._state=3,e._value=t,void s(e);if("function"==typeof n)return void u(n.bind(t),e)}e._state=1,e._value=t,s(e)}catch(o){i(e,o)}}function i(e,t){e._state=2,e._value=t,s(e)}function s(e){2===e._state&&0===e._deferreds.length&&r._immediateFn((function(){e._handled||r._unhandledRejectionFn(e._value,e)}));for(var t=0,n=e._deferreds.length;t<n;t++)o(e,e._deferreds[t]);e._deferreds=null}function l(e,t,n){this.onFulfilled="function"==typeof e?e:null,this.onRejected="function"==typeof t?t:null,this.promise=n}function u(e,t){var n=!1;try{e((function(e){n?r._multipleResolvesFn("resolve",t,e):(n=!0,a(t,e))}),(function(e){n?r._multipleResolvesFn("reject",t,e):(n=!0,i(t,e))}))}catch(o){if(n)return void r._multipleResolvesFn("reject",t,o);n=!0,i(t,o)}}r.prototype.catch=function(e){return this.then(null,e)},r.prototype.then=function(e,t){var r=new this.constructor(n);return o(this,new l(e,t,r)),r},r.prototype.finally=function(e){var t=this.constructor;return this.then((function(n){return t.resolve(e()).then((function(){return n}))}),(function(n){return t.resolve(e()).then((function(){return t.reject(n)}))}))},r.all=function(e){return new r((function(t,n){if(!Array.isArray(e))return n(new TypeError("Promise.all accepts an array"));var r=Array.prototype.slice.call(e);if(0===r.length)return t([]);var o=r.length;function a(e,i){try{if(i&&("object"==typeof i||"function"==typeof i)){var s=i.then;if("function"==typeof s)return void s.call(i,(function(t){a(e,t)}),n)}r[e]=i,0==--o&&t(r)}catch(l){n(l)}}for(var i=0;i<r.length;i++)a(i,r[i])}))},r.resolve=function(e){return e&&"object"==typeof e&&e.constructor===r?e:new r((function(t){t(e)}))},r.reject=function(e){return new r((function(t,n){n(e)}))},r.race=function(e){return new r((function(t,n){if(!Array.isArray(e))return n(new TypeError("Promise.race accepts an array"));for(var o=0,a=e.length;o<a;o++)r.resolve(e[o]).then(t,n)}))},r._immediateFn=setImmediate,r._unhandledRejectionFn=function(e,t){"undefined"!=typeof process&&process.listenerCount&&(process.listenerCount("unhandledRejection")||process.listenerCount("uncaughtException"))?(process.emit("unhandledRejection",e,t),process.emit("uncaughtException",e,"unhandledRejection")):"undefined"!=typeof console&&console&&console.warn("Possible Unhandled Promise Rejection:",e)},r._multipleResolvesFn=function(e,t,n){"undefined"!=typeof process&&process.emit&&process.emit("multipleResolves",e,t,n)},e.exports=r},function(e,t){e.exports=require("buffer")},function(e,t,n){"use strict";n.r(t);var r=null,o=function(e){return e&&(r=e),r},a=n(0),i=n.n(a),s=(n(4),n(5)),l=n.n(s);n(2),n(3);function u(){var e=i.a.Settings.globalSettingForKey("DataPopulator_deviceId");return e||(e=l()(),i.a.Settings.setGlobalSettingForKey("DataPopulator_deviceId",e)),{trackingEnabled:!0,deviceId:e,hostName:"sketch",hostVersion:String(i.a.Settings.version.sketch),hostOS:"mac",pluginVersion:String(process.env.plugin.version())}}var c=["randomizeData","trimText","insertEllipsis","defaultSubstitute","createGrid","rowsCount","rowsMargin","columnsCount","columnsMargin","populateType","selectedPreset","JSONPath","URL","headers","headersVisible","presetsLibraryPath","dataPath"];function d(){var e=function(e){e&&c.forEach((function(t){e.hasOwnProperty(t)&&i.a.Settings.setSettingForKey(t,JSON.stringify(e[t]))}));var t={};return c.map((function(e){var n=i.a.Settings.settingForKey(e);if(n)try{n=JSON.parse(n),t[e]=n}catch(r){}})),t}().presetsLibraryPath;return e||(e=o().scriptPath.stringByAppendingPathComponent("/../../../Presets/").stringByStandardizingPath()),e}var f={en:{dataPopulatorTitle:"Data Populator",dataPopulatorDescription:"A plugin to populate your design mockups with meaningful data. Goodbye Lorem Ipsum. Hello JSON.",dataPopulatorURL:"http://datapopulator.com",populateWithPresetTitle:"Populate with Preset",populateWithPresetDescription:"Please select the preset you'd like to populate your design with and configure the options.",preset:"Preset",noPresetsFound:"No presets found.",connectionFailed:"Connection failed",unableToDownloadPresets:"Unable to download the default presets at 'https://www.datapopulator.com/demodata/' provided by precious design studio.",noJSONFilesInPresetsFolder:"There are no JSON files in the presets folder to populate with.",noPresetsFolder:"No presets folder",createPresetsFolder:"Please create a folder named 'presets' in {data}.",invalidPreset:"Invalid preset",selectedPresetInvalid:"The preset you selected is invalid.",unableToLoadSelectedPreset:"Unable to load the selected preset.",unableToLoadLastUsedPreset:"Unable to load the last used preset.",populateWithJSONTitle:"Populate with JSON",populateWithJSONDescription:"Please select the JSON file you'd like to populate your design with and configure the options.",JSONFile:"JSON File",browse:"Browse",noFileSelected:"No file selected",selectJSONFile:"Please select a JSON file to populate with.",invalidJSONFile:"Invalid JSON file",selectedJSONFileInvalid:"The selected JSON file is invalid.",unableToLoadJSONFile:"Unable to load the selected JSON file.",populateFromURLTitle:"Populate from URL",populateFromURLDescription:"Please enter the URL of the API from which you'd like to fetch live data to populate your design with and configure the options.",URL:"URL",URLPlaceholder:"Must start with https://",noURLEntered:"No URL entered",enterURL:"Please enter the URL of the API from which you'd like to fetch data to populate with.",invalidURL:"Invalid URL",URLEnteredInvalid:"The URL you entered is invalid.",unableToLoadJSONAtURL:"Unable to load the JSON at the specified URL.",unableToLoadJSONAtLastUsedURL:"Unable to load the JSON at the last used URL.",headers:"Headers",add:"Add",name:"Name",value:"Value",remove:"Remove",load:"Load",populateAgainTitle:"Populate Again",populateAgainDescription:"Re-populate the selected layers with the last used data.",populateAgainNoActiveConfiguration:"No active configuration",dataPath:"Data Path",dataPathPlaceholder:"Root Level",dataPathHelpText:"The JSON key used as the starting point for populating. The key with the most objects is automatically detected.",dataOptions:"Data Options",randomizeDataOrder:"Randomize data order",trimText:"Trim overflowing text (area text layers)",insertEllipsis:"Insert ellipsis after trimmed text",defaultSubstitute:"Default Substitute",defaultSubstituteHelpText:"The substitute text used if you append a '?' to your placeholder i.e. {placeholder?}. Can be customized per placeholder as well: {placeholder?custom substitute}.",defaultSubstitutePlaceholder:"e.g. No Data",layoutOptions:"Layout Options",createGrid:"Create grid",rows:"Rows",columns:"Columns",margin:"Margin",reload:"Reload",cancel:"Cancel",OK:"OK",populate:"Populate",noLayersSelected:"No layers selected",selectLayersToPopulate:"Please select the layers to populate.",populatingFailed:"Populating failed",noMatchingKeys:"The selected layers' placeholders did not match any keys in the JSON data.",unableToPreviewJSON:"Unable to preview JSON",loadingData:"Loading data...",clickedCancelButton:"Clicked cancel button",closedDialogWithESCKey:"Closed dialog with ESC key",lastUsedDataTitle:"Last Used Data",lastUsedDataDescription:"Your last used command, JSON, data path, data options and default substitute are shown below.",command:"Command",loadingFailed:"Loading failed",noLastUsedData:"No last used data",firstTimeUsingDataPopulator:"As this is your first time using the Data Populator plugin, please use one of the other commands such as 'Populate with Preset' or 'Populate from URL'.",clearLayersTitle:"Clear Layers",clearLayersDescription:"Clear populated data from the selected layers.",selectLayersToClear:"Please select the layers to clear.",revealPresetsTitle:"Reveal Presets Library",revealPresetsLibraryDescription:"Open the folder storing your presets library.",setPresetsLibraryTitle:"Set Presets Library",setPresetsLibraryDescription:"Choose the folder containing your preset library.",presetsLibraryNotFound:"Presets library was not found. Please set it via 'Set Presets Library'",needHelpTitle:"Need Help?",needHelpDescription:"Find useful tips & tricks and ask for help."}},p=n(1);t.default=function(e){o(e),p.a.configure(u());var t=d(),n=NSURL.fileURLWithPath(t);NSFileManager.defaultManager().fileExistsAtPath(n.path())?(NSWorkspace.sharedWorkspace().openURL(n),p.a.track("revealPresets")):(o().document.showMessage(function(e){for(var t=f.en[e],n=0,r=arguments.length,o=new Array(r>1?r-1:0),a=1;a<r;a++)o[a-1]=arguments[a];for(;t.indexOf("{data}")>-1;)t=t.replace("{data}",o[n]),n++;return t}("presetsLibraryNotFound")),p.a.track("revealPresetsError",{reason:"noPresetsLibrary"}))}}]);if("default"===e&&"function"==typeof n)n(t);else{if("function"!=typeof n[e])throw new Error('Missing export named "'+e+'". Your command should contain something like `export function " + key +"() {}`.');n[e](t)}}catch(r){if("undefined"==typeof process||!process.listenerCount||!process.listenerCount("uncaughtException"))throw r;process.emit("uncaughtException",r,"uncaughtException")}}globalThis.onRun=__skpm_run.bind(this,"default");