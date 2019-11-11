export enum CommandType
{
    INIT,
    CHECK_FOR_UPDATES,
    START_PATCH,
    STOP_PATCH,
    START_GAME,
    SET_TOKEN,
    SET_SELECTED_ACCOUNT,
    OPEN_WEB
}

export class AppCommand
{
    Type : CommandType;
    Params : any[];

    constructor(type : CommandType, params : any[])
    {
        this.Type = type;
        this.Params = params;
    }
}