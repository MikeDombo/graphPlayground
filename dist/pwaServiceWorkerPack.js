/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/pwaServiceWorker.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/pwaServiceWorker.js":
/*!*********************************!*\
  !*** ./src/pwaServiceWorker.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("let dataCacheName = 'graphs-v1';\n\nlet filesToCache = [\n\t'index.html',\n\t'bundle.js',\n];\n\nself.addEventListener('install', function (event) {\n\tevent.waitUntil(\n\t\tcaches.open(dataCacheName).then(function (cache) {\n\t\t\treturn cache.addAll(filesToCache);\n\t\t})\n\t);\n});\n\n// Get files from network first (cache if not cached already), then the cache\nself.addEventListener('fetch', function (event) {\n\tevent.respondWith(\n\t\tfetch(event.request)\n\t\t\t.then(response => {\n\t\t\t\treturn caches.open(dataCacheName).then(cache => {\n\t\t\t\t\tlet newResp = response.clone();\n\t\t\t\t\t// Check if the response is for a real URL, not base64 encoded data\n\t\t\t\t\tif(!newResp.url.includes(\"data:\")){\n\t\t\t\t\t\tcache.put(event.request, newResp);\n\t\t\t\t\t}\n\t\t\t\t\treturn response;\n\t\t\t\t});\n\t\t\t})\n\t\t\t.catch(() => {\n\t\t\t\treturn caches.match(event.request);\n\t\t\t})\n\t);\n});\n\n\n//# sourceURL=webpack:///./src/pwaServiceWorker.js?");

/***/ })

/******/ });