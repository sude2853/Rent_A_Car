import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpService } from '@shared/lib/services/http';
import { firstValueFrom } from 'rxjs';

@Component({
  imports: [RouterLink, FormsModule],
  templateUrl: './register.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Register {
  readonly #http = inject(HttpService);
  readonly #router = inject(Router);

  readonly model = signal({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    phoneNumber1: '',
    phoneNumber2: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
  });

  readonly loading = signal(false);
  readonly showPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  readonly formError = signal('');
  readonly userNameChecking = signal(false);
  readonly userNameAvailable = signal<boolean | null>(null);

  passwordStrength() {
    const password = this.model().password;
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-ZÇĞİÖŞÜ]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-zÇĞİÖŞÜçğıöşü0-9]/.test(password)) score++;
    return score;
  }

  passwordStrengthText() {
    const score = this.passwordStrength();
    if (score >= 4) return 'Güçlü';
    if (score >= 3) return 'İyi';
    if (score >= 2) return 'Orta';
    return 'Zayıf';
  }

  hasTurkishCharacterInEmail() {
    return /[çğıöşüÇĞİÖŞÜ]/.test(this.model().email);
  }

  resetUserNameCheck() {
    this.userNameAvailable.set(null);
  }

  async checkUserName() {
    const userName = this.model().userName.trim();
    this.userNameAvailable.set(null);
    if (!userName) return false;

    this.userNameChecking.set(true);
    try {
      const res = await firstValueFrom(this.#http.getResource<boolean>(`/rent/auth/check-user-name/${encodeURIComponent(userName)}`));
      const available = res.data === true;
      this.userNameAvailable.set(available);
      return available;
    } catch {
      this.userNameAvailable.set(null);
      return false;
    } finally {
      this.userNameChecking.set(false);
    }
  }

  canSubmit() {
    return !this.loading()
      && !this.userNameChecking()
      && this.userNameAvailable() !== false
      && this.passwordStrength() >= 2
      && !this.hasTurkishCharacterInEmail()
      && this.model().password === this.model().confirmPassword;
  }

  async register(form: NgForm) {
    this.formError.set('');

    if (!form.valid || !this.model().agreeTerms) return;

    if (this.hasTurkishCharacterInEmail()) {
      this.formError.set('E-posta adresinde Türkçe karakter kullanılamaz.');
      return;
    }

    if (this.passwordStrength() < 2) {
      this.formError.set('Zayıf şifre kabul edilmez. En az orta güçte bir şifre kullanın.');
      return;
    }

    if (this.model().password !== this.model().confirmPassword) {
      this.formError.set('Şifreler aynı olmalıdır.');
      return;
    }

    const isUserNameAvailable = await this.checkUserName();
    if (!isUserNameAvailable) {
      this.formError.set('Bu kullanıcı adı daha önce alınmış. Lütfen farklı bir kullanıcı adı seçin.');
      return;
    }

    this.loading.set(true);
    this.#http.post<string>('/rent/auth/register', this.model(), () => {
      alert('Kayıt başarılı! Giriş yapabilirsiniz.');
      this.#router.navigateByUrl('/login');
      this.loading.set(false);
    }, () => this.loading.set(false));
  }
}
