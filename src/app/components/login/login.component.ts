import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '../../services/auth.service';
import { Router } from '@angular/router';

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

  constructor(private authenticationService : AuthenticationService, private router : Router) { }

  ngOnInit() {
  }

  login()
  {
        this.authenticationService.login(this.email,this.password,true).subscribe(
            result => {
                this.success = true;
                this.hasErrors = false;
                setTimeout(() => {
                    this.router.navigate(['']);
                },1000)
            },
            error => {
                this.hasErrors = true;
                this.success = false;
                this.errorText = error
                console.log(error);
            }
        )
  }

}
