enum CurrentState
{
    UNKNOWN,
    CHECKING_FOR_UPDATE,
    UPDATE_AVAILABLE,
    UP_TO_DATE,
    UPDATING
}

class CurrentProgress
{
    TotalCount : number;
    ProcessedCount : number;
    TotalSize : number;
    ProcessedSize : number;
    DownloadSpeed : number;
    CurrentFile : string;
}

class AppOs
{
  Type : string;
  Release : string;
  Platform : string;
}

class AppState
{
    State : CurrentState;
    HasErrors : boolean;
    ErrorMessages : string[];
    Progress : CurrentProgress;
    Os : AppOs;
}



enum CommandType
{
    INIT,
    CHECK_FOR_UPDATES,
    START_PATCH,
    STOP_PATCH,
    START_GAME,
    SET_TOKEN,
    SET_SELECTED_ACCOUNT,
    OPEN_WEB,
    SET_ENVIRONMENT
}

class AppCommand
{
    Type : CommandType;
    Params : any[];

    constructor(type : CommandType, params : any[])
    {
        this.Type = type;
        this.Params = params;
    }
}

class PatchEntry
{
  Dir : string;
  Url : URL;
  Size : number;

  constructor(dir: string, size : number, url : URL)
  {
    this.Dir = dir;
    this.Size = size;
    this.Url = url;
  }
}

class EuphresiaEnvironment
{
  PatchRoot : any;
  ClientPath : string;
}

class ProgressEntry
{
  Speed : number;
  ProgressedSize : number;

  constructor(speed : number, progressedSize : number)
  {
    this.Speed = speed;
    this.ProgressedSize = progressedSize;
  }
}

export { CurrentState, CurrentProgress, AppOs, AppState, CommandType, AppCommand, PatchEntry, EuphresiaEnvironment, ProgressEntry }