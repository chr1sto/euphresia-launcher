import { Injectable } from '@angular/core';
import { UserInfo } from '../models/user-info';
import { AccountService, LoginViewModel, RegisterViewModel } from './generated.services';
import { HttpClient } from '@angular/common/http';
import { JwtHelperService } from '@auth0/angular-jwt';
import { map } from 'rxjs/operators';
import { ElectronService } from '../providers/electron.service';
import { InteropService } from './interop.service';
import { CommandType } from '../../../patcher/models';

@Injectable()
export class AuthenticationService
{
    userInfo : UserInfo;
    errorMessages : string[];
    hasErrors : boolean;

    constructor(private _http: HttpClient, private _accountService: AccountService,private _interopService: InteropService) {
        if(this.isAuthenticated())
        {
            this.isLoggedIn = true;
            this.userInfo = this.getUserInfo();
            var token = localStorage.getItem('token');
            this._interopService.SendCommand(CommandType.SET_TOKEN,token);
        }
    }

    public isLoggedIn = false;

    public login(mail: string, pass: string, rememberMe: boolean)
    {
        const loginDto : LoginViewModel = new LoginViewModel();
        loginDto.email = mail;
        loginDto.password = pass;
        loginDto.rememberMe = rememberMe;
        return this._accountService.login(loginDto).pipe(
            map(
                result => 
                {
                    if(result.success)
                    {
                        localStorage.setItem('token',result.data);
                        this.userInfo = this.getUserInfo();
                        this.isLoggedIn = true;
                        this.hasErrors = false;
                        this.errorMessages = null;
                        this._interopService.SendCommand(CommandType.SET_TOKEN,result.data);
                    }
                    else
                    {
                        this.hasErrors = true;
                        this.errorMessages = result.errors;
                        this.isLoggedIn = false;
                    }
                }
            )
        )
    }

    public getUserInfo() : UserInfo
    {
        const token = localStorage.getItem('token');
        if(token)
        {
            const jwt = new JwtHelperService();
            const decoded = jwt.decodeToken(token);
            const userInfo = new UserInfo();
            userInfo.Id = decoded.nameid;
            userInfo.email = decoded.email;
            userInfo.userName = decoded.unique_name;
            userInfo.roles = decoded.role;
            return userInfo;
        }
        return null;
    }

    public register(dto: RegisterViewModel)
    {
        return this._accountService.register(dto);
    }

    public isAuthenticated() : boolean
    {
        const token = localStorage.getItem('token');
        if(token)
        {
            const jwt = new JwtHelperService();
            return !jwt.isTokenExpired(token);
        }
        this.logout();
        return false;
    }

    public isAdmin()
    {
        return this.isAuthenticated() && this.userInfo && ((this.userInfo.roles.indexOf('Administrator') >= 0) || (this.userInfo.roles.indexOf('Developer') >= 0) || (this.userInfo.roles.indexOf('Gamemaster') >= 0));
    }

    public logout()
    {
        localStorage.removeItem('token');
        this.isLoggedIn = false;
        this.userInfo = null;
        this._interopService.SendCommand(CommandType.SET_TOKEN,null);
    }
}