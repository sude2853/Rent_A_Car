import { AfterViewInit, ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, OnInit, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { BreadcrumbService } from '../../services/breadcrumb';
import Blank from '../../components/blank/blank';
import { httpResource } from '@angular/common/http';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';
import { ODataModel } from '@shared/lib/models/odata.model';
import { ReservationModel } from '@shared/lib/models/reservation.model';
import { VehicleModel } from '@shared/lib/models/vehicle.model';
import { CustomerModel } from '@shared/lib/models/customer.model';

Chart.register(...registerables);

interface DashboardChartItem {
  date: string;
  total: number;
}

@Component({
  imports: [
    Blank
  ],
  templateUrl: './dashboard.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Dashboard implements OnInit, AfterViewInit {
  readonly reservationsResult = httpResource<ODataModel<ReservationModel>>(() => "/rent/odata/reservations?$count=true");
  readonly vehiclesResult = httpResource<ODataModel<VehicleModel>>(() => "/rent/odata/vehicles?$count=true");
  readonly customersResult = httpResource<ODataModel<CustomerModel>>(() => "/rent/odata/customers?$count=true");

  readonly reservations = computed(() => this.reservationsResult.value()?.value ?? []);
  readonly loading = computed(() =>
    this.reservationsResult.isLoading() ||
    this.vehiclesResult.isLoading() ||
    this.customersResult.isLoading());

  readonly activeReservationCount = computed(() =>
    this.reservations()
      .filter(item => item.status !== 'Tamamland\u0131' && item.status !== 'Teslim Al\u0131nd\u0131' && item.status !== '\u0130ptal Edildi')
      .length);
  readonly vehicleCount = computed(() => this.vehiclesResult.value()?.['@odata.count'] ?? this.vehiclesResult.value()?.value.length ?? 0);
  readonly customerCount = computed(() => this.customersResult.value()?.['@odata.count'] ?? this.customersResult.value()?.value.length ?? 0);
  readonly currentMonthIncome = computed(() => {
    const now = new Date();
    return this.reservations()
      .filter(item => item.status !== '\u0130ptal Edildi')
      .filter(item => {
        const createdAt = new Date(item.createdAt);
        return createdAt.getFullYear() === now.getFullYear() && createdAt.getMonth() === now.getMonth();
      })
      .reduce((sum, item) => sum + (item.total ?? 0), 0);
  });

  readonly chartCanvas1 = viewChild.required<ElementRef<HTMLCanvasElement>>('revenueChartCanvas');
  readonly chartCanvas2 = viewChild.required<ElementRef<HTMLCanvasElement>>('reservationStatusChartCanvas');

  readonly viewReady = signal(false);
  private chart1: Chart | null = null;
  private chart2: Chart | null = null;

  readonly #breadcrumb = inject(BreadcrumbService);

  constructor() {
    effect(() => {
      if (!this.viewReady() || this.reservationsResult.isLoading()) return;

      this.chart1 = this.createChart(
        this.chart1,
        this.chartCanvas1(),
        'bar',
        this.getLastSevenDaysIncome(),
        "G\u00fcnl\u00fck Kazan\u00e7 Da\u011f\u0131l\u0131m\u0131 (\u20ba)",
        "Haftal\u0131k Kazan\u00e7 Da\u011f\u0131l\u0131m\u0131"
      );

      this.chart2 = this.createChart(
        this.chart2,
        this.chartCanvas2(),
        'doughnut',
        this.getLastSevenDaysReservation(),
        "G\u00fcnl\u00fck Rezervasyon",
        "Haftal\u0131k Rezervasyon",
        ""
      );
    });
  }

  ngOnInit(): void {
    this.#breadcrumb.setDashboard();
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  formatCurrency(value: number) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(value);
  }

  private getLastSevenDaysIncome(): DashboardChartItem[] {
    return this.getLastSevenDays().map(date => {
      const total = this.reservations()
        .filter(item => item.status !== '\u0130ptal Edildi')
        .filter(item => this.isSameDate(new Date(item.createdAt), date))
        .reduce((sum, item) => sum + (item.total ?? 0), 0);

      return {
        date: this.formatDate(date),
        total
      };
    });
  }

  private getLastSevenDaysReservation(): DashboardChartItem[] {
    return this.getLastSevenDays().map(date => ({
      date: this.formatDate(date),
      total: this.reservations()
        .filter(item => item.status !== '\u0130ptal Edildi')
        .filter(item => this.isSameDate(new Date(item.createdAt), date))
        .length
    }));
  }

  private getLastSevenDays() {
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return date;
    });
  }

  private isSameDate(first: Date, second: Date) {
    return first.getFullYear() === second.getFullYear()
      && first.getMonth() === second.getMonth()
      && first.getDate() === second.getDate();
  }

  private formatDate(date: Date) {
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  createChart(
    chart: Chart | null,
    canvas: ElementRef<HTMLCanvasElement>,
    type: ChartType,
    data: DashboardChartItem[],
    label: string,
    text: string,
    symbol: string = ' \u20ba') {
    if (chart) {
      chart.destroy();
    }

    const ctx = canvas.nativeElement.getContext('2d');
    if (!ctx) return null;

    const colors = [
      'rgba(54, 162, 235, 1)',
      'rgba(255, 99, 132, 1)',
      'rgba(255, 205, 86, 1)',
      'rgba(75, 192, 192, 1)',
      'rgba(153, 102, 255, 1)',
      'rgba(255, 159, 64, 1)',
      'rgba(39, 174, 96, 1)'
    ];

    const config: ChartConfiguration = {
      type: type,
      data: {
        labels: data.map(item => item.date),
        datasets: [{
          label: label,
          data: data.map(item => item.total),
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 2,
          fill: type === 'line' ? false : true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: text
          },
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: type !== 'doughnut' ? {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function (value) {
                return value + symbol;
              }
            }
          }
        } : {}
      }
    };

    return new Chart(ctx, config);
  }
}
