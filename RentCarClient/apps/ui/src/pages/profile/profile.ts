import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpService } from '@shared/lib/services/http';

type CustomerProfile = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  identityNumber: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  drivingLicenseIssuanceDate: string;
  fullAddress: string;
  isActive?: boolean;
};

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

type ReservationModel = {
  id: string;
  reservationNumber: string;
  pickUpDate: string;
  deliveryDate: string;
  vehicleDailyPrice: number;
  vehicle: ReservationVehicle;
  protectionPackageName: string;
  protectionPackagePrice: number;
  reservationExtras: ReservationExtra[];
  total: number;
  totalDay: number;
  status: string;
};

type ProfileTab = 'profile' | 'history';

@Component({
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './profile.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Profile {
  readonly #http = inject(HttpService);

  readonly activeTab = signal<ProfileTab>('profile');
  readonly customer = signal<CustomerProfile | null>(null);
  readonly editModel = signal<CustomerProfile | null>(null);
  readonly reservations = signal<ReservationModel[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly message = signal('');
  readonly formMessage = signal('');
  readonly formSuccess = signal('');
  readonly avatarImage = signal('');
  readonly avatarMessage = signal('');
  readonly historySearch = signal('');
  readonly historyStatus = signal('all');

  readonly fullName = computed(() => this.customer()?.fullName || this.tokenClaim('fullName') || 'RentCar Kullanıcısı');
  readonly email = computed(() => this.customer()?.email || this.tokenClaim('email') || '-');
  readonly totalDays = computed(() => this.reservations().reduce((sum, item) => sum + Number(item.totalDay ?? 0), 0));
  readonly totalSpent = computed(() => this.reservations().reduce((sum, item) => sum + Number(item.total ?? 0), 0));
  readonly loyaltyPoints = computed(() => Math.round(this.totalSpent() / 100));
  readonly filteredReservations = computed(() => {
    const search = this.historySearch().trim().toLocaleLowerCase('tr-TR');
    const status = this.historyStatus();

    return this.reservations().filter((reservation) => {
      const vehicleName = `${reservation.vehicle?.brand ?? ''} ${reservation.vehicle?.model ?? ''}`.toLocaleLowerCase('tr-TR');
      const number = String(reservation.reservationNumber ?? '').toLocaleLowerCase('tr-TR');
      const matchesSearch = !search || vehicleName.includes(search) || number.includes(search);
      const matchesStatus = status === 'all' || String(reservation.status ?? '').toLowerCase() === status;
      return matchesSearch && matchesStatus;
    });
  });

  constructor() {
    this.loadProfile();
  }

  loadProfile() {
    if (!localStorage.getItem('response')) {
      this.message.set('Profil bilgilerinizi görmek için önce giriş yapmalısınız.');
      return;
    }

    this.loading.set(true);
    this.message.set('');

    this.#http.getResource<CustomerProfile>('/rent/customers/my').subscribe({
      next: (res) => {
        const profile = res.data ?? null;
        this.customer.set(profile);
        this.editModel.set(profile ? { ...profile } : null);
        this.loadAvatar(profile);
        this.loadReservations();
      },
      error: () => {
        this.message.set('Profil bilgileriniz yüklenemedi. Lütfen tekrar giriş yapıp deneyin.');
        this.loading.set(false);
      }
    });
  }

  loadReservations() {
    this.#http.getResource<ReservationModel[]>('/rent/reservations/my').subscribe({
      next: (res) => {
        this.reservations.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.reservations.set([]);
        this.loading.set(false);
      }
    });
  }

  setTab(tab: ProfileTab) {
    this.activeTab.set(tab);
    this.formMessage.set('');
    this.formSuccess.set('');
  }

  startEdit() {
    const profile = this.customer();
    if (!profile) return;

    this.editModel.set({ ...profile });
    this.editing.set(true);
    this.formMessage.set('');
    this.formSuccess.set('');
  }

  cancelEdit() {
    const profile = this.customer();
    this.editModel.set(profile ? { ...profile } : null);
    this.editing.set(false);
    this.formMessage.set('');
    this.formSuccess.set('');
  }

  updateField(field: keyof CustomerProfile, value: string) {
    this.editModel.update((model) => model ? { ...model, [field]: value } : model);
    this.formMessage.set('');
    this.formSuccess.set('');
  }

  saveProfile() {
    const model = this.editModel();
    if (!model || this.saving()) return;

    const error = this.validateProfile(model);
    if (error) {
      this.formMessage.set(error);
      this.formSuccess.set('');
      return;
    }

    this.saving.set(true);
    this.formMessage.set('');
    this.formSuccess.set('');

    const body = {
      id: model.id,
      firstName: model.firstName.trim(),
      lastName: model.lastName.trim(),
      identityNumber: model.identityNumber.trim(),
      dateOfBirth: model.dateOfBirth,
      phoneNumber: model.phoneNumber.trim(),
      email: model.email.trim(),
      drivingLicenseIssuanceDate: model.drivingLicenseIssuanceDate,
      fullAddress: model.fullAddress.trim(),
      isActive: model.isActive ?? true
    };

    this.#http.put<string>('/rent/customers', body, () => {
      const updated = {
        ...model,
        ...body,
        fullName: `${body.firstName} ${body.lastName}`
      };
      this.customer.set(updated);
      this.editModel.set({ ...updated });
      this.editing.set(false);
      this.saving.set(false);
      this.formSuccess.set('Profil bilgileriniz başarıyla güncellendi.');
    }, () => {
      this.saving.set(false);
      this.formMessage.set('Profil bilgileriniz güncellenemedi. Lütfen bilgileri kontrol edip tekrar deneyin.');
    });
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.avatarMessage.set('Lütfen sadece görsel dosyası seçin.');
      return;
    }

    if (file.size > 1024 * 1024) {
      this.avatarMessage.set('Profil fotoğrafı en fazla 1 MB olmalıdır.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      this.avatarImage.set(dataUrl);
      localStorage.setItem(this.avatarStorageKey(), dataUrl);
      this.avatarMessage.set('Profil fotoğrafınız kaydedildi.');
    };
    reader.onerror = () => this.avatarMessage.set('Fotoğraf okunamadı. Lütfen farklı bir görsel deneyin.');
    reader.readAsDataURL(file);
  }

  removeAvatar() {
    localStorage.removeItem(this.avatarStorageKey());
    this.avatarImage.set('');
    this.avatarMessage.set('Profil fotoğrafı kaldırıldı.');
  }

  updateSearch(value: string) {
    this.historySearch.set(value);
  }

  updateStatus(value: string) {
    this.historyStatus.set(value);
  }

  imageUrl(reservation: ReservationModel) {
    const image = reservation.vehicle?.imageUrl;
    if (!image) return 'https://localhost:7207/images/renault-megane-sedan.jpg';
    if (image.startsWith('http')) return image;
    if (image.startsWith('/images/')) return `https://localhost:7207${image}`;
    if (image.startsWith('images/')) return `https://localhost:7207/${image}`;
    return `https://localhost:7207/images/${image.replace(/^\//, '')}`;
  }

  formatPrice(value: number) {
    return `\u20ba${Number(value ?? 0).toLocaleString('tr-TR')}`;
  }

  formatDate(value: string) {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('tr-TR');
  }

  maskIdentity(value: string) {
    const text = String(value ?? '');
    if (!text) return '-';
    if (this.editing()) return text;
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

  statusClass(status: string) {
    const normalized = String(status ?? '').toLowerCase();
    if (normalized === 'completed' || normalized === 'delivered') return 'success';
    if (normalized === 'cancelled') return 'danger';
    return 'active';
  }

  private loadAvatar(profile: CustomerProfile | null) {
    if (!profile) return;
    this.avatarImage.set(localStorage.getItem(this.avatarStorageKey(profile)) ?? '');
  }

  private avatarStorageKey(profile = this.customer()) {
    const id = profile?.id || this.tokenClaim('email') || 'guest';
    return `rentcar-profile-avatar-${id}`;
  }

  private validateProfile(model: CustomerProfile) {
    const requiredFields = [
      model.firstName,
      model.lastName,
      model.identityNumber,
      model.dateOfBirth,
      model.phoneNumber,
      model.email,
      model.drivingLicenseIssuanceDate,
      model.fullAddress
    ];

    if (requiredFields.some((field) => !String(field ?? '').trim())) {
      return 'Lütfen zorunlu alanların tamamını doldurun.';
    }

    if (!/^\d{11}$/.test(model.identityNumber.trim())) {
      return 'T.C. kimlik numarası 11 haneli olmalıdır.';
    }

    if (/[çğıöşüÇĞİÖŞÜ]/.test(model.email) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(model.email.trim())) {
      return 'Geçerli ve Türkçe karakter içermeyen bir e-posta adresi girin.';
    }

    if (model.phoneNumber.replace(/\D/g, '').length < 10) {
      return 'Telefon numarası en az 10 haneli olmalıdır.';
    }

    const birthYear = new Date(model.dateOfBirth).getFullYear();
    const licenseYear = new Date(model.drivingLicenseIssuanceDate).getFullYear();
    if (Number.isFinite(birthYear) && Number.isFinite(licenseYear) && licenseYear < birthYear + 18) {
      return 'Ehliyet alış tarihi doğum tarihinize göre en az 18 yaş sonrası olmalıdır.';
    }

    return '';
  }

  private tokenClaim(key: string) {
    const token = localStorage.getItem('response');
    if (!token) return '';

    try {
      const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
      return payload[key] ?? '';
    } catch {
      return '';
    }
  }
}




