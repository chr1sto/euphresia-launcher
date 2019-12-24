"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var CurrentState;
(function (CurrentState) {
    CurrentState[CurrentState["UNKNOWN"] = 0] = "UNKNOWN";
    CurrentState[CurrentState["CHECKING_FOR_UPDATE"] = 1] = "CHECKING_FOR_UPDATE";
    CurrentState[CurrentState["UPDATE_AVAILABLE"] = 2] = "UPDATE_AVAILABLE";
    CurrentState[CurrentState["UP_TO_DATE"] = 3] = "UP_TO_DATE";
    CurrentState[CurrentState["UPDATING"] = 4] = "UPDATING";
})(CurrentState || (CurrentState = {}));
exports.CurrentState = CurrentState;
var CurrentProgress = /** @class */ (function () {
    function CurrentProgress() {
    }
    return CurrentProgress;
}());
exports.CurrentProgress = CurrentProgress;
var AppOs = /** @class */ (function () {
    function AppOs() {
    }
    return AppOs;
}());
exports.AppOs = AppOs;
var AppState = /** @class */ (function () {
    function AppState() {
    }
    return AppState;
}());
exports.AppState = AppState;
var CommandType;
(function (CommandType) {
    CommandType[CommandType["INIT"] = 0] = "INIT";
    CommandType[CommandType["CHECK_FOR_UPDATES"] = 1] = "CHECK_FOR_UPDATES";
    CommandType[CommandType["START_PATCH"] = 2] = "START_PATCH";
    CommandType[CommandType["STOP_PATCH"] = 3] = "STOP_PATCH";
    CommandType[CommandType["START_GAME"] = 4] = "START_GAME";
    CommandType[CommandType["SET_TOKEN"] = 5] = "SET_TOKEN";
    CommandType[CommandType["SET_SELECTED_ACCOUNT"] = 6] = "SET_SELECTED_ACCOUNT";
    CommandType[CommandType["OPEN_WEB"] = 7] = "OPEN_WEB";
    CommandType[CommandType["SET_ENVIRONMENT"] = 8] = "SET_ENVIRONMENT";
})(CommandType || (CommandType = {}));
exports.CommandType = CommandType;
var AppCommand = /** @class */ (function () {
    function AppCommand(type, params) {
        this.Type = type;
        this.Params = params;
    }
    return AppCommand;
}());
exports.AppCommand = AppCommand;
var PatchEntry = /** @class */ (function () {
    function PatchEntry(dir, size, url) {
        this.Dir = dir;
        this.Size = size;
        this.Url = url;
    }
    return PatchEntry;
}());
exports.PatchEntry = PatchEntry;
var EuphresiaEnvironment = /** @class */ (function () {
    function EuphresiaEnvironment() {
    }
    return EuphresiaEnvironment;
}());
exports.EuphresiaEnvironment = EuphresiaEnvironment;
var ProgressEntry = /** @class */ (function () {
    function ProgressEntry(speed, progressedSize) {
        this.Speed = speed;
        this.ProgressedSize = progressedSize;
    }
    return ProgressEntry;
}());
exports.ProgressEntry = ProgressEntry;
//# sourceMappingURL=models.js.map