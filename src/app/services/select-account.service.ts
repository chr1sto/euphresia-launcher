import { Injectable } from "@angular/core";
import { GameAccountViewModel, GameAccountService } from "./generated.services";
import { map } from "rxjs/operators";

@Injectable({providedIn: "root"})
export class SelectAccountService
{
    selectedAccount : string = null;
    selectedAccountId : string = null;
    gameAccounts : Array<GameAccountViewModel> = new Array<GameAccountViewModel>();
    errorMessages: string[];
    hasErrors: boolean;
    success: boolean;
    private modal = null;
    constructor(public gameAccountService : GameAccountService){

    }

    public selectAccount(name,acciD)
    {
        this.selectedAccount = name;
        this.selectedAccountId = acciD;
    }

    public updateGameAccounts()
    {
      this.gameAccountService.gameAccountGet().pipe(
        map(
          result => {
            this.gameAccounts = result.data;
            if(this.gameAccounts && !this.selectedAccount)
            {
              if(this.gameAccounts.length > 0)
              {
                this.selectedAccount = this.gameAccounts[0].alias;
                this.selectedAccountId = this.gameAccounts[0].account;
              }
            }
          },
          error => {
  
          }
        )
      ).subscribe();
    }

    public createAccount(alias : string)
    {
        var model = new GameAccountViewModel();
        model.alias = alias;
        //workaround;
        model.id = "00000000-0000-0000-0000-000000000000";
        this.gameAccountService.gameAccountPost(model).pipe(
          map(
            result => {
              if(result.errors)
              {
                this.success = false;
                this.hasErrors = true;
                this.errorMessages = result.errors;
              }
              else
              {
                this.success = true;
                this.hasErrors = false;
                this.errorMessages = null;
                setTimeout(() => {
                  this.updateGameAccounts();
                },)
              }
            },
            error => {
              console.log(error);
            }
          )
        ).subscribe();
    }

    public editAccount(model: GameAccountViewModel)
    {
      this.gameAccountService.gameAccountPatch(model).pipe(
        map(
          result => {
            console.log(result);
            if(result.errors)
            {
              this.success = false;
              this.hasErrors = true;
              this.errorMessages = result.errors;
              console.log(result.errors)
            }
            else
            {
              this.success = true;
              this.hasErrors = false;
              this.errorMessages = null;
              setTimeout(() => {
                this.updateGameAccounts();
              },)
            }
          },
          error => {
            console.log(error);
          }
        )
      ).subscribe();
    }

    setRef(modal: any)
    {
        this.modal = modal;
    }

    close()
    {
        this.modal.close();
        this.modal = null;
    }

    public open()
    {
      if(this.modal)
      {
          if(!this.modal.opened)
          {
              this.modal.open();
          }
      }
    }
}