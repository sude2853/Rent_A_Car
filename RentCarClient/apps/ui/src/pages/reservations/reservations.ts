import { ChangeDetectionStrategy, Component, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpService } from '@shared/lib/services/http';

type ReservationExtra = {
  extraName: string;
  price: number;
};

type ReservationVehicle = {
  brand: string;
  model: string;
  modelYear: number;
  imageUrl: string;
  plate: string;
  categoryName: string;
  seatCount: number;
};

type ReservationCustomer = {
  fullName: string;
  identityNumber: string;
  phoneNumber: string;
  email: string;
  fullAddress: string;
};

type ReservationPickUp = {
  name: string;
  fullAddress: string;
  phoneNumber: string;
};

type ReservationPayment = {
  cartNumber?: string;
  cartNumberLast4Digits?: string;
  cardNumberLast4Digits?: string;
  owner?: string;
};

type ReservationDamage = {
  level: string;
  description: string;
};

type ReservationFormSummary = {
  kilometer: number;
  supplies: string[];
  imageUrls: string[];
  damages: ReservationDamage[];
  note: string;
};

type ReservationModel = {
  id: string;
  reservationNumber: string;
  customer: ReservationCustomer;
  pickUp?: ReservationPickUp;
  pickUpDate: string;
  pickUpTime: string;
  deliveryDate: string;
  deliveryTime: string;
  vehicleDailyPrice: number;
  vehicle: ReservationVehicle;
  protectionPackageName: string;
  protectionPackagePrice: number;
  reservationExtras: ReservationExtra[];
  total: number;
  totalDay: number;
  status: string;
  paymentInformation?: ReservationPayment;
  pickUpForm?: ReservationFormSummary;
  deliveryForm?: ReservationFormSummary;
  createdAt: string;
};

@Component({
  imports: [CommonModule, RouterLink],
  templateUrl: './reservations.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Reservations {
  readonly #http = inject(HttpService);

  readonly reservations = signal<ReservationModel[]>([]);
  readonly loading = signal(false);
  readonly message = signal('');

  constructor() {
    this.loadReservations();
  }

  loadReservations() {
    if (!localStorage.getItem('response')) {
      this.message.set('Rezervasyonlarınızı görmek için önce giriş yapmalısınız.');
      return;
    }

    this.loading.set(true);
    this.message.set('');

    this.#http.getResource<ReservationModel[]>('/rent/reservations/my').subscribe({
      next: (res) => {
        this.reservations.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.message.set('Rezervasyon bilgileriniz yüklenemedi. Lütfen tekrar deneyin.');
        this.loading.set(false);
      }
    });
  }

  imageUrl(reservation: ReservationModel) {
    const image = reservation.vehicle?.imageUrl;
    if (!image) return 'https://localhost:7207/images/renault-megane-sedan.jpg';
    if (image.startsWith('http')) return image;
    if (image.startsWith('/images/')) return `https://localhost:7207${image}`;
    if (image.startsWith('images/')) return `https://localhost:7207/${image}`;
    return `https://localhost:7207/images/${image.replace(/^\//, '')}`;
  }

  formImageUrl(image: string) {
    if (!image) return '';
    if (image.startsWith('http')) return image;
    if (image.startsWith('/forms/')) return `https://localhost:7207${image}`;
    if (image.startsWith('forms/')) return `https://localhost:7207/${image}`;
    return `https://localhost:7207/forms/${image.replace(/^\//, '')}`;
  }

  customerSignature(reservation: ReservationModel) {
    return reservation.pickUpForm?.imageUrls?.find(image => image.toLocaleLowerCase('tr-TR').includes('musteri-imzasi')) ?? '';
  }

  vehicleFormImages(reservation: ReservationModel) {
    return reservation.pickUpForm?.imageUrls?.filter(image => !image.toLocaleLowerCase('tr-TR').includes('musteri-imzasi')) ?? [];
  }

  hasPickUpDocument(reservation: ReservationModel) {
    const form = reservation.pickUpForm;
    return !!form && !!this.customerSignature(reservation) && (
      Number(form.kilometer ?? 0) > 0 ||
      (form.supplies?.length ?? 0) > 0 ||
      (form.imageUrls?.length ?? 0) > 0 ||
      (form.damages?.length ?? 0) > 0 ||
      !!String(form.note ?? '').trim()
    );
  }

  damageText(description: string) {
    return String(description ?? '').replace(/^\[x=[\d.]+;y=[\d.]+\]\s*/, '');
  }

  formatPrice(value: number) {
    return `\u20ba${Number(value ?? 0).toLocaleString('tr-TR')}`;
  }

  formatDate(value: string) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('tr-TR');
  }

  formatTime(value: string) {
    return String(value ?? '').slice(0, 5);
  }

  cardLast4(reservation: ReservationModel) {
    return reservation.paymentInformation?.cartNumber
      ?? reservation.paymentInformation?.cartNumberLast4Digits
      ?? reservation.paymentInformation?.cardNumberLast4Digits
      ?? '----';
  }

  previousReservations() {
    return this.reservations().slice(1);
  }

  maskIdentity(value: string) {
    const text = String(value ?? '');
    if (!text) return '-';
    if (text.length <= 4) return text;
    return `${text.slice(0, 2)}${'*'.repeat(Math.max(3, text.length - 6))}${text.slice(-4)}`;
  }

  statusText(status: string) {
    const normalized = String(status ?? '').toLowerCase();
    if (normalized === 'pending') return 'Beklemede';
    if (normalized === 'delivered') return 'Teslim Edildi';
    if (normalized === 'completed') return 'Teslim Al\u0131nd\u0131';
    if (normalized === 'cancelled') return 'İptal Edildi';
    return status || 'Beklemede';
  }
}




