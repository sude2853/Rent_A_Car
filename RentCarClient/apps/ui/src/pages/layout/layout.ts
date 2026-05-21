import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink],
  templateUrl: './layout.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Layout {
  readonly #router = inject(Router);

  isLoggedIn() {
    return !!localStorage.getItem('response');
  }

  logout() {
    localStorage.removeItem('response');
    this.#router.navigateByUrl('/login');
  }
}
