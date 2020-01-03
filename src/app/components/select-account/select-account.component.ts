import { Component, OnInit, ChangeDetectorRef, Input, OnDestroy, ElementRef } from '@angular/core';
import { GameAccountService, GameAccountViewModel } from '../../services/generated.services';
import { map } from 'rxjs/operators';
import { SelectAccountService } from '../../services/select-account.service';
import { ElectronService } from '../../providers/electron.service';
import { InteropService } from '../../services/interop.service';
import { CommandType } from '../../../../patcher/models';

@Component({
  selector: 'select-account',
  templateUrl: './select-account.component.html',
  styleUrls: ['./select-account.component.scss']
})
export class SelectAccountComponent implements OnInit, OnDestroy {

  element : any;
  public opened : boolean = false;
  public editMode : boolean = false;
  public editId : string = null;
  public editAlias : string = null;
  public editAccount : string = null;

  public createMode : boolean = false;
  public createAlias : string = null;

  constructor(
    public selectAccService : SelectAccountService,
    public el : ElementRef,
    public interopService : InteropService) { 
      this.selectAccService.updateGameAccounts();
      this.element = el.nativeElement;
    }

  ngOnInit() {
    this.selectAccService.setRef(this);
  }

  ngOnDestroy(): void 
  {
      this.selectAccService.close();
      this.element.remove();
  }

  open()
  {
      this.selectAccService.updateGameAccounts();
      this.element.style.display = 'block';
      document.body.classList.add('modal-open');
      this.opened = true;
  }

  close()
  {
      this.element.style.display = 'none';
      document.body.classList.remove('modal-open');
      this.opened = false;
  }


  edit(id : string, account : string, alias : string)
  {
    this.editMode = true;
    this.editId = id;
    this.editAccount = account;
    this.editAlias = alias
  }

  save()
  {

    var model = new GameAccountViewModel();
    model.id = this.editId;
    model.alias = this.editAlias;
    model.account = this.editAccount;
    this.selectAccService.editAccount(model);

    this.editMode = false;
    this.editId = null;
    this.editAccount = null;
    this.editAlias = null;
  }

  openCreateMode()
  {
    this.createMode = true;
  }

  createNewAccount()
  {
    if(this.createAlias != null && this.createAlias != '')
    {
      this.selectAccService.createAccount(this.createAlias);
      this.createMode = false;
      this.createAlias = null; 
    }
  }

  cancelCreate()
  {
    this.createMode = false;
    this.createAlias = null;
  }

  startGame()
  {
    this.interopService.SendCommand(CommandType.START_GAME,this.selectAccService.selectedAccountId);
  }
}
