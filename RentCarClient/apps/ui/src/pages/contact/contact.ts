import { ChangeDetectionStrategy, Component, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  imports: [FormsModule, RouterLink],
  templateUrl: './contact.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Contact {
  readonly sent = signal(false);

  sendMessage() {
    this.sent.set(true);
  }
}
