export enum CurrentState
{
    UNKNOWN,
    CHECKING_FOR_UPDATE,
    UPDATE_AVAILABLE,
    UP_TO_DATE,
    UPDATING
}

export class CurrentProgress
{
    TotalCount : number;
    ProcessedCount : number;
    TotalSize : number;
    ProcessedSize : number;
    DownloadSpeed : number;
    CurrentFile : string;
}

export class AppOs
{
    Type : string;
    Release : string;
    Platform : string;
}

export class AppState
{
    State : CurrentState;
    HasErrors : boolean;
    ErrorMessages : string[];
    Progress : CurrentProgress;
    Os : AppOs;
}