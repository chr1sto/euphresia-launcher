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
}

export class AppState
{
    State : CurrentState;
    HasErrors : boolean;
    ErrorMessages : string[];
    Progress : CurrentProgress;
}