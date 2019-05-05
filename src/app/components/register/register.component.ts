import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AccountService, RegisterViewModel } from '../../services/generated.services';

@Component({
    selector: 'register',
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.scss']
  })
export class RegisterComponent {
    constructor(private accountService : AccountService, private router : Router)
    {

    }

    password : string;
    confirmedPassword : string;
    email: string;
    secretQuestion: string;
    secretAnswer: string;

    errorMessages : Array<string>;
    hasErrors : boolean = false;
    success : boolean = false;

    resolved(event : any)
    {
      console.log(event);
    }

    submit()
    {
      var model = new RegisterViewModel();
      model.confirmPassword = this.confirmedPassword;
      model.password = this.password;
      model.email = this.email;

      this.accountService.register(model).subscribe(
        result => 
          {
              this.hasErrors = false;
              this.errorMessages = null;
              this.success = true;
              setTimeout(() =>
              {
                this.router.navigate(['login'])
              }
              ,1000)
          },
          error => 
          {
            this.hasErrors = true;
            this.errorMessages = error.errors;
            this.success = false;
          }
      );

    }
}
