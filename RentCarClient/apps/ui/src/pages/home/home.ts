import { ChangeDetectionStrategy, Component, computed, inject, signal, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '@shared/lib/services/http';
import { VehicleModel } from '@shared/lib/models/vehicle.model';

type PriceOption = {
  id: string;
  name: string;
  description: string;
  price: number;
  daily: boolean;
  recommended?: boolean;
  included?: string[];
  excluded?: string[];
};

type CustomerProfile = {
  firstName: string;
  lastName: string;
  fullName: string;
  identityNumber: string;
  dateOfBirth: string;
  phoneNumber: string;
  email: string;
  drivingLicenseIssuanceDate: string;
  fullAddress: string;
};

type RentalLocation = {
  id: string;
  name: string;
};

@Component({
  imports: [FormsModule],
  templateUrl: './home.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Home {
  readonly #http = inject(HttpService);
  readonly #router = inject(Router);

  readonly vehicles = signal<VehicleModel[]>([]);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly selectedCategory = signal('');
  readonly automaticOnly = signal(false);
  readonly driverAge = signal('30');
  readonly selectedBrand = signal('');
  readonly selectedSeatCount = signal('');
  readonly rentalLocations = signal<RentalLocation[]>([]);
  readonly selectedPickUpLocationId = signal('');
  readonly selectedVehicle = signal<VehicleModel | null>(null);
  readonly reservationMessage = signal('');
  readonly showPayment = signal(false);
  readonly paymentMessage = signal('');
  readonly paymentSuccessful = signal(false);
  readonly paymentProcessing = signal(false);
  readonly driverProfileLoading = signal(false);
  readonly driverProfileMessage = signal('');
  readonly activeReservationStep = signal(2);
  readonly selectedProtectionId = signal('11111111-1111-1111-1111-111111111111');
  readonly selectedExtraIds = signal<string[]>([]);
  readonly maxBirthDate = this.formatDate(new Date(new Date().setFullYear(new Date().getFullYear() - 18)));
  readonly minBirthDate = '1940-01-01';
  readonly currentYear = new Date().getFullYear();
  readonly payment = signal({
    cartNumber: '',
    owner: '',
    expiry: '',
    ccv: ''
  });
  readonly driverDetail = signal({
    firstName: '',
    lastName: '',
    identityNumber: '',
    birthDate: this.maxBirthDate,
    phone: '',
    email: '',
    licenseNumber: '',
    licenseYear: '',
    address: ''
  });

  readonly today = this.formatDate(new Date());
  readonly pickUpDate = signal(this.today);
  readonly pickUpTime = signal('09:00');
  readonly deliveryDate = signal(this.formatDate(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  readonly deliveryTime = signal('09:00');
  readonly timeOptions = this.createTimeOptions();
  readonly availablePickUpTimes = computed(() => {
    if (this.pickUpDate() !== this.today) return this.timeOptions;

    const minimumTime = this.nextAvailablePickUpTime();
    return this.timeOptions.filter(time => time >= minimumTime);
  });

  constructor() {
    this.loadRentalLocations();
  }

  readonly protectionPackages: PriceOption[] = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Sınırlı Güvence',
      description: 'Temel kiralama güvencesi.',
      price: 0,
      daily: true,
      included: [],
      excluded: ['Lastik Cam Far Güvencesi', 'Genişletilmiş 3. Şahıs Sorumluluk Güvencesi', 'Süper Mini Hasar Güvencesi', 'Anahtar Plaka ve Ruhsat Güvencesi', 'Yola Devam Hizmeti']
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Minimum Güvence',
      description: 'Genişletilmiş sorumluluk koruması ile daha güvenli kiralama.',
      price: 166,
      daily: true,
      included: ['Genişletilmiş 3. Şahıs Sorumluluk Güvencesi'],
      excluded: ['Lastik Cam Far Güvencesi', 'Süper Mini Hasar Güvencesi', 'Anahtar Plaka ve Ruhsat Güvencesi', 'Yola Devam Hizmeti']
    },
    {
      id: '66666666-6666-6666-6666-666666666666',
      name: 'Gold Güvence',
      description: 'Önerilen kapsamlı güvence paketi.',
      price: 472,
      daily: true,
      recommended: true,
      included: ['Lastik Cam Far Güvencesi', 'Genişletilmiş 3. Şahıs Sorumluluk Güvencesi', 'Süper Mini Hasar Güvencesi'],
      excluded: ['Anahtar Plaka ve Ruhsat Güvencesi', 'Yola Devam Hizmeti']
    },
    {
      id: '77777777-7777-7777-7777-777777777777',
      name: 'Full Güvence',
      description: 'Tüm temel güvence başlıklarını kapsayan en geniş paket.',
      price: 690,
      daily: true,
      included: ['Lastik Cam Far Güvencesi', 'Genişletilmiş 3. Şahıs Sorumluluk Güvencesi', 'Süper Mini Hasar Güvencesi', 'Anahtar Plaka ve Ruhsat Güvencesi', 'Yola Devam Hizmeti'],
      excluded: []
    }
  ];

  readonly recommendedProtectionOptions: PriceOption[] = [
    {
      id: '88888888-8888-8888-8888-888888888888',
      name: 'Mini Hasar Güvencesi',
      description: 'Ehliyet ibrazı, kiralama şartlarının kabulü ve araç teslimi sırasında ek sürücünün de ofiste bulunması gerekir.',
      price: 114,
      daily: true
    },
    {
      id: '99999999-9999-9999-9999-999999999999',
      name: 'Kış Lastiği',
      description: 'Kış lastiği stoklarla sınırlıdır ve seçilen araç için günlük olarak ücretlendirilir.',
      price: 246,
      daily: true
    }
  ];

  readonly extraOptions: PriceOption[] = [
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Genç Sürücü Paketi',
      description: 'Yaş grubunuzun araç kiralayabilmesini sağlayan ek sürücü güvence paketi.',
      price: 530,
      daily: true
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Banka Kartı ile Kiralama',
      description: 'Kredi kartı olmadan banka kartı ile kiralama işlemini destekleyen paket.',
      price: 3193,
      daily: false
    },
    {
      id: '55555555-5555-5555-5555-555555555555',
      name: 'Depozitosuz Kiralama',
      description: 'Depozito ödemeden araç kiralamak isteyen müşteriler için ek hizmet.',
      price: 1850,
      daily: false
    }
  ];

  readonly seatAdapterOptions: PriceOption[] = [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      name: 'Koltuk Adaptörü',
      description: '4 yasindan sonra, 15-36 kg arasi cocuklar icin arac koltuk yukselterek koltuklanabilir. Cocuk aracin kemerine yukseltilir yasta kurala baslar.',
      price: 290,
      daily: true
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      name: 'Çocuk Koltuğu',
      description: '4 yasina kadar, 9-18 kg arasi cocuklar icin guvenlik koltugu tarzinda arka koltuga one bakan sekilde monte edilebilir.',
      price: 290,
      daily: true
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
      name: 'Bebek Koltuğu',
      description: '1 yasina kadar, 0 kiloya kadar bebekler icin ana kucagi modelinde arka koltuga arkaya bakacak sekilde monte edilebilir.',
      price: 290,
      daily: true
    }
  ];

  readonly categories = computed(() => this.distinctValues(this.vehicles().map(vehicle => vehicle.categoryName)));
  readonly brands = computed(() => this.distinctValues(this.vehicles().map(vehicle => vehicle.brand)));
  readonly seatCounts = computed(() => this.distinctValues(this.vehicles().map(vehicle => vehicle.seatCount.toString())));
  readonly filteredVehicles = computed(() => this.vehicles().filter(vehicle =>
    (!this.selectedCategory() || vehicle.categoryName === this.selectedCategory())
    && (!this.automaticOnly() || vehicle.transmission === 'Otomatik')
    && this.isVehicleAllowedForDriverAge(vehicle)
    && (!this.selectedBrand() || vehicle.brand === this.selectedBrand())
    && (!this.selectedSeatCount() || vehicle.seatCount.toString() === this.selectedSeatCount())
  ));

  showVehicles() {
    this.normalizeSearchDates();
    this.loading.set(true);
    this.searched.set(true);

    this.#http.getResource<VehicleModel[]>('/rent/vehicles/public').subscribe({
      next: (res) => {
        this.vehicles.set(res.data ?? []);
        this.loading.set(false);
        setTimeout(() => document.getElementById('vehicles')?.scrollIntoView({ behavior: 'smooth' }), 0);
      },
      error: () => {
        this.vehicles.set([]);
        this.loading.set(false);
      }
    });
  }

  loadRentalLocations() {
    this.#http.getResource<RentalLocation[]>('/rent/branches').subscribe({
      next: (res) => {
        const locations = res.data ?? [];
        this.rentalLocations.set(locations);
        if (!this.selectedPickUpLocationId() && locations.length > 0) {
          const airport = locations.find(item => item.name.toLocaleLowerCase('tr-TR').includes('havalimanı'));
          this.selectedPickUpLocationId.set((airport ?? locations[0]).id);
        }
      },
      error: () => {
        const fallback = [
          { id: '', name: 'Isparta Süleyman Demirel Havalimanı' },
          { id: '', name: 'Isparta Merkez Şube' },
          { id: '', name: 'Isparta Otogar' },
          { id: '', name: 'Isparta Çünür Şube' },
          { id: '', name: 'Isparta Meydan AVM' },
          { id: '', name: 'Süleyman Demirel Üniversitesi' }
        ];
        this.rentalLocations.set(fallback);
      }
    });
  }

  imageUrl(vehicle: VehicleModel) {
    return vehicle.imageUrl
      ? `https://localhost:7207/images/${vehicle.imageUrl}`
      : '/favicon.ico';
  }

  selectedPickUpLocationName() {
    return this.rentalLocations().find(item => item.id === this.selectedPickUpLocationId())?.name
      ?? this.rentalLocations()[0]?.name
      ?? 'Isparta Süleyman Demirel Havalimanı';
  }

  resetFilters() {
    this.selectedCategory.set('');
    this.automaticOnly.set(false);
    this.driverAge.set('30');
    this.selectedBrand.set('');
    this.selectedSeatCount.set('');
  }

  selectVehicle(vehicle: VehicleModel) {
    this.selectedVehicle.set(vehicle);
    this.reservationMessage.set('');
    this.paymentMessage.set('');
    this.paymentSuccessful.set(false);
    this.paymentProcessing.set(false);
    this.showPayment.set(false);
    this.activeReservationStep.set(2);
    this.selectedProtectionId.set('11111111-1111-1111-1111-111111111111');
    this.selectedExtraIds.set([]);
    localStorage.setItem('selectedVehicle', JSON.stringify({
      vehicleId: vehicle.id,
      brand: vehicle.brand,
      model: vehicle.model,
      dailyPrice: vehicle.dailyPrice,
      pickUpLocationId: this.selectedPickUpLocationId() || vehicle.branchId,
      pickUpLocationName: this.selectedPickUpLocationName(),
      pickUpDate: this.pickUpDate(),
      pickUpTime: this.pickUpTime(),
      deliveryDate: this.deliveryDate(),
      deliveryTime: this.deliveryTime(),
      totalDay: this.totalDays(),
      total: this.totalPrice()
    }));
    setTimeout(() => document.getElementById('reservationSummary')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  goToReservationStep(step: number) {
    this.activeReservationStep.set(step);
    this.showPayment.set(false);
    setTimeout(() => document.getElementById('reservationSummary')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  selectProtection(id: string) {
    this.activeReservationStep.set(2);
    this.selectedProtectionId.set(id);
  }

  goBackToVehicles() {
    this.selectedVehicle.set(null);
    this.showPayment.set(false);
    this.activeReservationStep.set(2);
    setTimeout(() => document.getElementById('vehicles')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  }

  continueReservation() {
    const vehicle = this.selectedVehicle();
    if (!vehicle) return;

    if (!localStorage.getItem('response')) {
      this.#router.navigateByUrl('/login');
      return;
    }

    this.activeReservationStep.set(4);
    this.showPayment.set(false);
    this.reservationMessage.set(`${vehicle.brand} ${vehicle.model} için rezervasyon bilgileri hazırlandı. Ödeme bilgilerini girerek devam edebilirsiniz.`);
    this.fillDriverFromProfile();
    setTimeout(() => document.getElementById('driverDetailsArea')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  isLoggedIn() {
    return !!localStorage.getItem('response');
  }

  updatePayment(field: 'cartNumber' | 'owner' | 'expiry' | 'ccv', value: string) {
    this.payment.update(prev => ({ ...prev, [field]: value }));
  }

  updateCardNumber(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.match(/.{1,4}/g)?.join(' ') ?? '';
    this.payment.update(prev => ({ ...prev, cartNumber: formatted }));
  }

  updateExpiry(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    const month = digits.length >= 2
      ? Math.min(Math.max(Number(digits.slice(0, 2)), 1), 12).toString().padStart(2, '0')
      : digits;
    const formatted = digits.length > 2
      ? `${month}/${digits.slice(2)}`
      : month;

    this.payment.update(prev => ({ ...prev, expiry: formatted }));
  }

  updateCcv(value: string) {
    this.payment.update(prev => ({ ...prev, ccv: value.replace(/\D/g, '').slice(0, 3) }));
  }

  updatePickUpDate(value: string) {
    const nextPickUp = value && value >= this.today ? value : this.today;
    this.pickUpDate.set(nextPickUp);
    this.normalizePickUpTime();

    if (this.deliveryDate() <= nextPickUp) {
      this.deliveryDate.set(this.addDays(nextPickUp, 1));
    }
  }

  updatePickUpTime(value: string) {
    this.pickUpTime.set(value);
    this.normalizePickUpTime();
  }

  updateDeliveryDate(value: string) {
    const minDeliveryDate = this.addDays(this.pickUpDate(), 1);
    this.deliveryDate.set(value && value >= minDeliveryDate ? value : minDeliveryDate);
  }

  updateDriverDetail(field: 'firstName' | 'lastName' | 'identityNumber' | 'birthDate' | 'phone' | 'email' | 'licenseNumber' | 'licenseYear' | 'address', value: string | number) {
    const text = String(value ?? '');
    const formattedValue = field === 'identityNumber'
      ? text.replace(/\D/g, '').slice(0, 11)
      : field === 'phone'
        ? text.replace(/[^\d\s()+-]/g, '').slice(0, 16)
        : field === 'licenseYear'
          ? text.replace(/\D/g, '').slice(0, 4)
          : text;
    this.driverDetail.update(prev => ({ ...prev, [field]: formattedValue }));
    this.driverProfileMessage.set('');
  }

  fillDriverFromProfile() {
    if (!localStorage.getItem('response') || this.driverProfileLoading()) return;

    this.driverProfileLoading.set(true);
    this.driverProfileMessage.set('');

    this.#http.getResource<CustomerProfile>('/rent/customers/my').subscribe({
      next: (res) => {
        const profile = res.data;
        if (!profile) {
          this.driverProfileMessage.set('Profil bilgileriniz bulunamadı. Bilgileri elle doldurabilirsiniz.');
          this.driverProfileLoading.set(false);
          return;
        }

        this.driverDetail.update(prev => ({
          ...prev,
          firstName: profile.firstName ?? '',
          lastName: profile.lastName ?? '',
          identityNumber: profile.identityNumber ?? '',
          birthDate: this.toDateInputValue(profile.dateOfBirth) || prev.birthDate,
          phone: profile.phoneNumber ?? '',
          email: profile.email ?? '',
          licenseYear: this.toYear(profile.drivingLicenseIssuanceDate) || prev.licenseYear,
          address: profile.fullAddress ?? ''
        }));

        if (!this.payment().owner.trim()) {
          const owner = profile.fullName || `${profile.firstName} ${profile.lastName}`.trim();
          this.payment.update(prev => ({ ...prev, owner }));
        }

        this.driverProfileMessage.set('Profil bilgileriniz sürücü formuna aktarıldı.');
        this.driverProfileLoading.set(false);
      },
      error: () => {
        this.driverProfileMessage.set('Profil bilgileriniz alınamadı. Bilgileri elle doldurabilirsiniz.');
        this.driverProfileLoading.set(false);
      }
    });
  }

  continueToPayment() {
    const driverError = this.getDriverDetailError();
    if (driverError) {
      this.paymentSuccessful.set(false);
      this.paymentMessage.set(driverError);
      return;
    }

    this.paymentMessage.set('');
    this.showPayment.set(true);
    this.activeReservationStep.set(4);
    localStorage.setItem('driverDetail', JSON.stringify(this.driverDetail()));
    setTimeout(() => document.getElementById('paymentArea')?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  isDriverDetailValid() {
    return !this.getDriverDetailError();
  }

  getDriverDetailError() {
    const driver = this.driverDetail();
    const firstName = String(driver.firstName ?? '').trim();
    const lastName = String(driver.lastName ?? '').trim();
    const identityNumber = String(driver.identityNumber ?? '').trim();
    const birthDate = String(driver.birthDate ?? '').trim();
    const phone = String(driver.phone ?? '').trim();
    const email = String(driver.email ?? '').trim();
    const licenseNumber = String(driver.licenseNumber ?? '').trim();
    const licenseYearText = String(driver.licenseYear ?? '').trim();
    const address = String(driver.address ?? '').trim();
    const licenseYear = Number(licenseYearText);
    const earliestLicenseYear = this.earliestLicenseYear();
    const birthYear = this.driverBirthYear();
    const missingFields = [
      !firstName ? 'Ad' : '',
      !lastName ? 'Soyad' : '',
      !identityNumber ? 'TC Kimlik No' : '',
      !birthDate ? 'Dogum Tarihi' : '',
      !phone ? 'Telefon' : '',
      !email ? 'E-posta' : '',
      !licenseNumber ? 'Ehliyet No' : '',
      !licenseYearText ? 'Ehliyet Alis Yili' : '',
      !address ? 'Adres' : ''
    ].filter(Boolean);

    if (missingFields.length > 0) {
      return `Eksik alanlar: ${missingFields.join(', ')}.`;
    }

    if (!birthYear) {
      return 'Dogum tarihi okunamadi. Lutfen tarihi yeniden secin.';
    }

    if (!/^\d{11}$/.test(identityNumber)) {
      return 'TC kimlik numarasi 11 haneli olmalidir.';
    }

    if (phone.replace(/\D/g, '').length < 10) {
      return 'Telefon numarasi en az 10 haneli olmalidir.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Gecerli bir e-posta adresi girin.';
    }

    if (!/^\d{4}$/.test(licenseYearText)) {
      return 'Ehliyet alis yili 4 haneli olmalidir.';
    }

    if (licenseYear < earliestLicenseYear) {
      return `${birthYear} dogumlu bir kisi en erken ${earliestLicenseYear} yilinda ehliyet alabilir.`;
    }

    if (licenseYear > this.currentYear) {
      return `Ehliyet alis yili ${this.currentYear} yilindan ileri olamaz.`;
    }

    return '';
  }

  earliestLicenseYear() {
    const birthYear = this.driverBirthYear();
    return birthYear ? birthYear + 18 : 1970;
  }

  driverBirthYear() {
    const birthDate = String(this.driverDetail().birthDate ?? '').trim();
    if (!birthDate) return null;

    const isoMatch = birthDate.match(/^(\d{4})-\d{2}-\d{2}$/);
    if (isoMatch) return Number(isoMatch[1]);

    const localMatch = birthDate.match(/^\d{1,2}\.\d{1,2}\.(\d{4})$/);
    if (localMatch) return Number(localMatch[1]);

    const parsed = new Date(birthDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getFullYear();
  }

  private toDateInputValue(value: string) {
    if (!value) return '';
    const text = String(value).slice(0, 10);
    return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
  }

  private toYear(value: string) {
    const text = this.toDateInputValue(value);
    return text ? text.slice(0, 4) : '';
  }

  isPaymentValid() {
    const payment = this.payment();
    const expiryMonth = Number(payment.expiry.slice(0, 2));
    const expiryYear = payment.expiry.slice(3);
    return payment.cartNumber.replace(/\D/g, '').length >= 16
      && !!payment.owner.trim()
      && /^\d{2}\/\d{2}$/.test(payment.expiry)
      && expiryMonth >= 1
      && expiryMonth <= 12
      && expiryYear.length === 2
      && payment.ccv.trim().length === 3;
  }

  completePayment() {
    const vehicle = this.selectedVehicle();
    const payment = this.payment();
    const driver = this.driverDetail();
    const digits = payment.cartNumber.replace(/\D/g, '');

    if (!vehicle) return;

    if (!this.isDriverDetailValid()) {
      this.paymentSuccessful.set(false);
      this.paymentMessage.set(this.getDriverDetailError());
      this.goToReservationStep(4);
      return;
    }

    if (!this.isPaymentValid()) {
      this.paymentSuccessful.set(false);
      this.paymentMessage.set('Lütfen kart bilgilerini eksiksiz girin. Son kullanma tarihi AA/YY, CCV 3 haneli olmalıdır.');
      return;
    }

    if (digits !== '4111111111111111') {
      this.paymentSuccessful.set(false);
      this.paymentMessage.set('Ödeme reddedildi. Simülasyon için test kartı 4111 1111 1111 1111 kullanılmalıdır.');
      return;
    }

    const customerId = this.getCustomerIdFromToken();
    if (!customerId) {
      this.paymentSuccessful.set(false);
      this.paymentMessage.set('Rezervasyon oluşturmak için kullanıcı bilginiz okunamadı. Lütfen tekrar giriş yapıp deneyin.');
      return;
    }

    this.paymentProcessing.set(true);
    this.paymentMessage.set('');

    this.#http.post<string>('/rent/reservations', {
      customerId,
      pickUpLocationId: this.selectedPickUpLocationId() || vehicle.branchId,
      pickUpDate: this.pickUpDate(),
      pickUpTime: `${this.pickUpTime()}:00`,
      deliveryDate: this.deliveryDate(),
      deliveryTime: `${this.deliveryTime()}:00`,
      vehicleId: vehicle.id,
      vehicleDailyPrice: vehicle.dailyPrice,
      protectionPackageId: this.selectedProtection()?.id ?? '11111111-1111-1111-1111-111111111111',
      protectionPackagePrice: this.selectedProtectionTotal(),
      reservationExtras: this.selectedExtras().map(extra => ({
        extraId: extra.id,
        price: this.optionTotal(extra)
      })),
      note: 'Web sitesi üzerinden oluşturulan simülasyon rezervasyonu',
      creditCartInformation: {
        cartNumber: digits,
        owner: payment.owner,
        expiry: payment.expiry,
        ccv: payment.ccv
      },
      total: this.totalPrice(),
      totalDay: this.totalDays()
    }, (res) => {
      this.paymentProcessing.set(false);
      this.paymentSuccessful.set(true);
      this.paymentMessage.set(`${res}. Ödeme simülasyonu başarılı. Veritabanında kartın sadece son 4 hanesi tutulur.`);
    }, (err) => {
      this.paymentProcessing.set(false);
      this.paymentSuccessful.set(false);
      this.paymentMessage.set(this.getReservationErrorMessage(err));
    });
  }

  totalDays() {
    const pickUp = new Date(`${this.pickUpDate()}T${this.pickUpTime()}`);
    const delivery = new Date(`${this.deliveryDate()}T${this.deliveryTime()}`);
    const diff = delivery.getTime() - pickUp.getTime();
    return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
  }

  private normalizeSearchDates() {
    this.updatePickUpDate(this.pickUpDate());
    this.updateDeliveryDate(this.deliveryDate());
    if (!this.timeOptions.includes(this.deliveryTime())) {
      this.deliveryTime.set('09:00');
    }
  }

  private normalizePickUpTime() {
    const availableTimes = this.availablePickUpTimes();

    if (availableTimes.length === 0) {
      this.pickUpDate.set(this.addDays(this.today, 1));
      this.pickUpTime.set('09:00');
      return;
    }

    if (!availableTimes.includes(this.pickUpTime())) {
      this.pickUpTime.set(availableTimes[0]);
    }
  }

  private createTimeOptions() {
    const times: string[] = [];

    for (let hour = 6; hour <= 23; hour++) {
      times.push(`${String(hour).padStart(2, '0')}:00`);
      times.push(`${String(hour).padStart(2, '0')}:30`);
    }

    return times;
  }

  private nextAvailablePickUpTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 60);

    if (this.formatDate(now) > this.today) {
      return '99:99';
    }

    const roundedMinutes = now.getMinutes() <= 30 ? 30 : 60;
    if (roundedMinutes === 60) {
      now.setHours(now.getHours() + 1, 0, 0, 0);
    } else {
      now.setMinutes(30, 0, 0);
    }

    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  totalPrice() {
    return this.vehicleTotal() + this.selectedProtectionTotal() + this.extrasTotal();
  }

  vehicleTotal() {
    return (this.selectedVehicle()?.dailyPrice ?? 0) * this.totalDays();
  }

  selectedProtection() {
    return this.protectionPackages.find(item => item.id === this.selectedProtectionId()) ?? this.protectionPackages[0];
  }

  selectedProtectionTotal() {
    const protection = this.selectedProtection();
    return protection ? this.optionTotal(protection) : 0;
  }

  selectedExtras() {
    return [...this.recommendedProtectionOptions, ...this.extraOptions, ...this.seatAdapterOptions].filter(item => this.selectedExtraIds().includes(item.id));
  }

  extrasTotal() {
    return this.selectedExtras().reduce((total, item) => total + this.optionTotal(item), 0);
  }

  optionTotal(option: PriceOption) {
    return option.price * (option.daily ? this.totalDays() : 1);
  }

  toggleExtra(option: PriceOption) {
    this.activeReservationStep.set(3);
    this.selectedExtraIds.update(ids =>
      ids.includes(option.id)
        ? ids.filter(id => id !== option.id)
        : [...ids, option.id]
    );
  }

  formatPrice(price: number) {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0
    }).format(price);
  }

  private formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  addDays(dateText: string, days: number) {
    const date = new Date(`${dateText}T00:00:00`);
    date.setDate(date.getDate() + days);
    return this.formatDate(date);
  }

  private getCustomerIdFromToken() {
    const token = localStorage.getItem('response');
    if (!token) return null;

    try {
      const payloadPart = token.split('.')[1];
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');
      const payload = JSON.parse(atob(padded));

      return payload.nameid
        ?? payload.sub
        ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']
        ?? null;
    } catch {
      return null;
    }
  }

  private getReservationErrorMessage(err: any) {
    const messages = err?.error?.errorMessages;
    if (Array.isArray(messages) && messages.length > 0) {
      return messages.join(' ');
    }

    if (typeof err?.error?.detail === 'string') {
      return err.error.detail;
    }

    if (typeof err?.error?.title === 'string') {
      return err.error.title;
    }

    return 'Ödeme başarılı göründü ancak rezervasyon kaydı oluşturulamadı. Lütfen tarihleri ve araç müsaitliğini kontrol edin.';
  }

  private distinctValues(values: string[]) {
    return [...new Set(values.filter(Boolean))].sort((first, second) => first.localeCompare(second, 'tr'));
  }

  private isVehicleAllowedForDriverAge(vehicle: VehicleModel) {
    const age = Number(this.driverAge());
    const category = vehicle.categoryName;

    if (age >= 30) return true;

    if (age >= 25) {
      return category !== 'SUV Araç' && category !== 'Üstü Açık Araç';
    }

    return category === 'Binek Araç' || category === 'Minibüs Araç';
  }
}
