import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import Grid from '../../components/grid/grid';
import { FlexiGridFilterDataModel, FlexiGridModule } from 'flexi-grid';
import { BreadcrumbModel } from '../../services/breadcrumb';
import { Common } from '../../services/common';
import { NgClass } from '@angular/common';
import { NgxMaskPipe } from 'ngx-mask';
import { RouterLink } from '@angular/router';

@Component({
  imports: [
    Grid,
    FlexiGridModule,
    NgClass,
    NgxMaskPipe,
    RouterLink
  ],
  templateUrl: './reservations.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Reservations {
  readonly bredcrumbs = signal<BreadcrumbModel[]>([
    {
      title: 'Rezervasyonlar',
      icon: 'bi-calendar-check',
      url: '/reservations',
      isActive: true
    }
  ]);
  readonly statusFilterData = signal<FlexiGridFilterDataModel[]>([
    {
      name: 'Bekliyor',
      value: 'Bekliyor'
    },
    {
      name: 'Teslim Edildi',
      value: 'Teslim Edildi'
    },
    {
      name: 'Teslim Al\u0131nd\u0131',
      value: 'Teslim Al\u0131nd\u0131'
    },
    {
      name: '\u0130ptal Edildi',
      value: '\u0130ptal Edildi'
    }
  ])

  readonly #common = inject(Common);

  checkPermission(permission: string) {
    return this.#common.checkPermission(permission);
  }

  getStatusClass(status: string) {
    switch (status) {
      case 'Bekliyor': return 'flexi-grid-card-warning'
      case 'Teslim Edildi': return 'flexi-grid-card-info'
      case 'Tamamland\u0131':
      case 'Teslim Al\u0131nd\u0131': return 'flexi-grid-card-success'
      case '\u0130ptal Edildi': return 'flexi-grid-card-danger'
      default: return '';
    }
  }
}

