import { Injectable } from "@angular/core";
import { CanActivate } from "@angular/router/src/utils/preactivation";
import { AuthenticationService } from "../services/auth.service";
import { Router } from "@angular/router";

@Injectable()
export class AuthGuardService implements CanActivate
{
    path;
    route;
    constructor(private _auth: AuthenticationService, private _router: Router)
    {
        
    }

    canActivate() : boolean
    {
        if(this._auth.isAuthenticated()) return true;
        this._router.navigate(['login']);
        return false;
    }
}