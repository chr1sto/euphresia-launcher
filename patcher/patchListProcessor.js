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
var models_1 = require("./models");
var fs = require("fs-extra");
var nx = require("nexline");
var pth = require("path");
var PatchlistProcessor = /** @class */ (function () {
    function PatchlistProcessor(path, clientPath, baseUrl) {
        this.path = path;
        this.clientPath = clientPath;
        this.baseUrl = baseUrl;
        this.TotalFileSize = 0;
    }
    PatchlistProcessor.prototype.Run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, fd, nl, folder, line, cols, date, size, file, fileNotFound, exSize, exDate, path, fileInfo, u, p;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        files = [];
                        fd = fs.createReadStream(this.path);
                        nl = nx({
                            input: fd,
                            autoCloseFile: true
                        });
                        folder = '';
                        _a.label = 1;
                    case 1:
                        if (!true) return [3 /*break*/, 3];
                        return [4 /*yield*/, nl.next()];
                    case 2:
                        line = _a.sent();
                        if (line === null)
                            return [3 /*break*/, 3];
                        if (line[0] === 'v') {
                            //handle patcher update.
                        }
                        else if (line[0] == 'd') {
                            folder = line.substring(2);
                        }
                        else if (line[0] == 'f') {
                            cols = line.split(' ');
                            date = new Date(parseInt(cols[1]));
                            size = parseInt(cols[2]);
                            cols.splice(0, 3);
                            file = cols.join(' ');
                            fileNotFound = false;
                            try {
                                path = pth.join(this.clientPath, folder.trim(), file.trim());
                                if (fs.existsSync(path)) {
                                    fileInfo = fs.statSync(path);
                                    exSize = fileInfo.size;
                                    exDate = fileInfo.mtime;
                                }
                                else {
                                    fileNotFound = true;
                                }
                            }
                            catch (ex) {
                                //console.log('File not found!');
                                fileNotFound = true;
                            }
                            if (fileNotFound || exSize != size || exDate < date) {
                                this.TotalFileSize += size;
                                u = new URL(folder.trim() + '/' + file.trim() + '.gz', this.baseUrl);
                                p = pth.join(this.clientPath, folder.trim(), file.trim());
                                files.push(new models_1.PatchEntry(p, size, u));
                            }
                        }
                        return [3 /*break*/, 1];
                    case 3: return [2 /*return*/, files];
                }
            });
        });
    };
    return PatchlistProcessor;
}());
exports.PatchlistProcessor = PatchlistProcessor;
//# sourceMappingURL=patchListProcessor.js.map