import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpService } from '@shared/lib/services/http';

@Component({
  imports: [
    RouterLink,
    FormsModule
  ],
  templateUrl: './login.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Login {
  readonly #http = inject(HttpService);
  readonly #router = inject(Router);

  readonly model = signal({
    emailOrUserName: '',
    password: ''
  });
  readonly showPassword = signal(false);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  login(form: NgForm) {
    this.errorMessage.set('');
    if (!form.valid) {
      this.errorMessage.set('Lütfen e-posta/kullanıcı adı ve şifre alanlarını doldurun.');
      return;
    }

    this.loading.set(true);
    this.#http.post<{ token: string | null, tfaCode: string | null }>('/rent/auth/login', this.model(), (res) => {
      if (res.token) {
        localStorage.setItem('response', res.token);
        this.#router.navigateByUrl('/');
      } else {
        this.errorMessage.set('Giriş yapılamadı. Lütfen bilgilerinizi kontrol edin.');
      }
      this.loading.set(false);
    }, () => {
      this.errorMessage.set('Kullanıcı adı ya da şifre hatalı.');
      this.loading.set(false);
    });
  }

  updateEmailOrUserName(value: string) {
    this.model.update(model => ({ ...model, emailOrUserName: value }));
  }

  updatePassword(value: string) {
    this.model.update(model => ({ ...model, password: value }));
  }
}
