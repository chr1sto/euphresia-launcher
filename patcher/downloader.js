"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var liteEvent_1 = require("./liteEvent");
var models_1 = require("./models");
var request = require("request-promise");
var async = require("async");
var fs = require("fs-extra");
var Downloader = /** @class */ (function () {
    function Downloader(requestLimit) {
        this.requestLimit = requestLimit;
        this.onStatusUpdate = new liteEvent_1.LiteEvent();
        this.onProgress = new liteEvent_1.LiteEvent();
        this.currentFileSize = 0;
        this.totalFileSize = 0;
        this.speeds = {};
    }
    Object.defineProperty(Downloader.prototype, "StatusUpdate", {
        get: function () { return this.onStatusUpdate.expose(); },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Downloader.prototype, "Progress", {
        get: function () { return this.onProgress.expose(); },
        enumerable: true,
        configurable: true
    });
    Downloader.prototype.start = function (files) {
        var _this = this;
        files.forEach(function (x) { return _this.totalFileSize += x.Size; });
        var id = setInterval(function () {
            var g = 0;
            var s = 0;
            Object.entries(_this.speeds).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                if (value.Speed > 0) {
                    g += value.Speed;
                }
                s += value.ProgressedSize;
            });
            _this.onProgress.trigger(new models_1.ProgressEntry(g, s));
        }, 1000);
        async.eachLimit(files, this.requestLimit, function (file, callback) { return __awaiter(_this, void 0, void 0, function () {
            var ex_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.DownloadSingleFile(file).then(function () {
                                callback();
                            }).catch(function () { return callback(); })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        ex_1 = _a.sent();
                        this.onStatusUpdate.trigger(JSON.stringify(ex_1));
                        callback();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); }, function (error) {
            clearInterval(id);
            if (error) {
                _this.onStatusUpdate.trigger(JSON.stringify(error));
            }
            else {
                _this.onStatusUpdate.trigger(null);
            }
        });
    };
    Downloader.prototype.DownloadSingleFile = function (file, failedCount) {
        if (failedCount === void 0) { failedCount = 0; }
        return __awaiter(this, void 0, void 0, function () {
            var headers, receivedBytes, start, res, ex_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        headers = {
                            'Accept-Encoding': 'gzip'
                        };
                        receivedBytes = 0;
                        start = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, request.get(file.Url, {
                                gzip: true,
                                resolveWithFullResponse: true,
                                encoding: null,
                                headers: headers
                            }).on('data', function (chunk) {
                                receivedBytes += chunk.length;
                                var elapsed = (Date.now() - start) / 1000;
                                if (elapsed >= 1) {
                                    _this.speeds[file.Dir] = new models_1.ProgressEntry(receivedBytes / elapsed, receivedBytes);
                                }
                            }).on('end', function () {
                                _this.speeds[file.Dir] = new models_1.ProgressEntry(0, file.Size);
                            })];
                    case 2:
                        res = _a.sent();
                        return [4 /*yield*/, fs.writeFile(file.Dir, res.body, 'binary')];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        ex_2 = _a.sent();
                        this.speeds[file.Dir] = new models_1.ProgressEntry(0, 0);
                        this.onStatusUpdate.trigger(JSON.stringify(ex_2));
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return Downloader;
}());
exports.Downloader = Downloader;
//# sourceMappingURL=downloader.js.map