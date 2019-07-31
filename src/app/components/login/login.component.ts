import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ElectronService } from '../../providers/electron.service';
import { SelectAccountService } from '../../services/select-account.service';

@Component({
  selector: 'login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    email: string;
    password: string;

    success : boolean = false;
    hasErrors : boolean = false;
    errorText : string = "";

  constructor(private authenticationService : AuthenticationService,private selectAccountService : SelectAccountService, private router : Router) { }

  ngOnInit() {
  }

  login()
  {
        this.authenticationService.login(this.email,this.password,true).subscribe(
            () => {
                if(this.authenticationService.isLoggedIn)
                {
                    this.success = true;
                    this.hasErrors = false;
                    this.errorText = "";
                    this.selectAccountService.updateGameAccounts();
                    this.router.navigate(['']);
                }
                else
                {
                    this.hasErrors = this.authenticationService.hasErrors;
                    this.errorText = this.authenticationService.errorMessages.join('\n');
                    this.success = false;
                }
            }
        )
       
  }
}
