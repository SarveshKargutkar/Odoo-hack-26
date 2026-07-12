import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  form: FormGroup;
  loading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    if (this.auth.isLoggedIn) this.router.navigate(['/']);
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  submit(): void {
    if (this.form.invalid || this.loading) return;
    this.loading = true;
    const { email, password } = this.form.value;

    this.auth.login(email, password).subscribe({
      next: () => {
        this.toast.success(`Welcome back, ${this.auth.currentUser?.name}!`);
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Invalid email or password');
        this.loading = false;
      }
    });
  }

  fillDemo(role: string): void {
    const creds: Record<string, { email: string; password: string }> = {
      fleet:    { email: 'fleet@transitops.com',    password: 'password123' },
      dispatch: { email: 'dispatch@transitops.com', password: 'password123' },
      safety:   { email: 'safety@transitops.com',   password: 'password123' },
      finance:  { email: 'finance@transitops.com',  password: 'password123' },
    };
    if (creds[role]) this.form.patchValue(creds[role]);
  }
}
