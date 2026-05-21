import { DatePipe, Location } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, linkedSignal, resource, signal, viewChild, ViewEncapsulation } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import Loading from 'apps/admin/src/components/loading/loading';
import { FormModel, initialForm } from '@shared/lib/models/form.model';
import { Result } from '@shared/lib/models/result.model';
import { NgxMaskPipe } from 'ngx-mask';
import { FlexiGridModule } from "flexi-grid";
import { HttpService } from '@shared/lib/services/http';
import { FlexiToastService } from 'flexi-toast';

@Component({
  imports: [
    Loading,
    DatePipe,
    NgxMaskPipe,
    FormsModule,
    RouterLink,
    FlexiGridModule
  ],
  templateUrl: './form.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class Form {
  readonly reservationId = signal<string>("");
  readonly type = signal<string>("");
  readonly result = httpResource<Result<FormModel>>(() => `/rent/reservation-form/${this.reservationId()}/${this.type()}`);
  readonly data = linkedSignal(() => this.result.value()?.data ?? { ...initialForm });
  readonly loading = linkedSignal(() => this.result.isLoading());
  readonly pageTitle = computed(() => this.type() === 'pickup' ? 'ARAÇ TESLİM ETME FORMU' : 'ARAÇ TESLİM ALMA FORMU');
  readonly btnName = computed(() => this.type() === 'pickup' ? 'Teslim Etmeyi Tamamla' : 'Teslim Almayı Tamamla');
  readonly images = signal<any[]>([]);
  readonly customerApproval = signal<boolean>(false);
  readonly signatureSigned = signal<boolean>(false);
  readonly selectedDamagePoint = signal<{ x: number; y: number } | null>(null);
  readonly editingDamageIndex = signal<number | null>(null);
  readonly showButton = computed(() => {
    if(this.type() === 'pickup' && this.data().reservationStatus === 'Bekliyor') return true;
    if(this.type() === 'delivery' && this.data().reservationStatus === 'Teslim Edildi') return true;
    return false;
  })
  readonly requiresCustomerSignature = computed(() => this.showButton() && (this.type() === 'pickup' || this.type() === 'delivery'));
  readonly damage = signal<{
    level: string;
    description: string;
  }>({ level: 'Küçük Çizik', description: '' })

  readonly supplies = signal<{ "icon": string; "name": string }[]>([
    { icon: 'bi bi-circle', name: 'Stepne Lastik' },
    { icon: 'bi bi-tools', name: 'Kriko' },
    { icon: 'bi bi-triangle', name: 'Reflektör Üçgen' },
    { icon: 'bi bi-heart-pulse', name: 'İlk Yardım Çantası' },
    { icon: 'bi bi-fire', name: 'Yangın Söndürücü' },
    { icon: 'bi bi-outlet', name: 'Takviye Kablosu' },
    { icon: 'bi bi-file-earmark-text', name: 'Araç Evrakları' },
    { icon: 'bi bi-key', name: 'Yedek Anahtar' },
    { icon: 'bi bi-book', name: 'Kullanım Kılavuzu' },
    { icon: 'bi bi-phone', name: 'Telefon Şarj Aleti' }
  ]);

  readonly fileInput = viewChild<ElementRef<HTMLInputElement>>("fileInput");
  readonly signatureCanvas = viewChild<ElementRef<HTMLCanvasElement>>("signatureCanvas");

  #isSigning = false;
  #signatureReady = false;

  readonly #activated = inject(ActivatedRoute);
  readonly #http = inject(HttpService);
  readonly #toast = inject(FlexiToastService);
  readonly #location = inject(Location);

  constructor() {
    this.#activated.params.subscribe(res => {
      this.reservationId.set(res['reservationId']);
      this.type.set(res['type']);
    });
  }

  initSignatureCanvas() {
    const canvas = this.signatureCanvas()?.nativeElement;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));

    const context = canvas.getContext('2d');
    if (!context) return;

    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, rect.width, rect.height);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.lineWidth = 2.5;
    context.strokeStyle = '#0f2537';
    this.#signatureReady = true;
  }

  startSignature(event: PointerEvent) {
    this.initSignatureCanvasIfNeeded();
    const context = this.signatureContext();
    const point = this.signaturePoint(event);
    if (!context || !point) return;

    this.#isSigning = true;
    (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.arc(point.x, point.y, 1.25, 0, Math.PI * 2);
    context.fillStyle = '#0f2537';
    context.fill();
    context.beginPath();
    context.moveTo(point.x, point.y);
    this.signatureSigned.set(true);
    event.preventDefault();
  }

  drawSignature(event: PointerEvent) {
    if (!this.#isSigning) return;

    const context = this.signatureContext();
    const point = this.signaturePoint(event);
    if (!context || !point) return;

    context.lineTo(point.x, point.y);
    context.stroke();
    this.signatureSigned.set(true);
    event.preventDefault();
  }

  endSignature(event?: PointerEvent) {
    this.#isSigning = false;
    if (event?.target instanceof HTMLElement) {
      event.target.releasePointerCapture?.(event.pointerId);
    }
    event?.preventDefault();
  }

  clearSignature() {
    this.initSignatureCanvas();
    this.signatureSigned.set(false);
  }

  signatureContext() {
    const canvas = this.signatureCanvas()?.nativeElement;
    return canvas?.getContext('2d') ?? null;
  }

  signaturePoint(event: PointerEvent) {
    const canvas = this.signatureCanvas()?.nativeElement;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  initSignatureCanvasIfNeeded() {
    if (this.#signatureReady) return;
    this.initSignatureCanvas();
  }

  signatureFile() {
    const canvas = this.signatureCanvas()?.nativeElement;
    if (!canvas || !this.signatureSigned()) return Promise.resolve<File | null>(null);

    return new Promise<File | null>(resolve => {
      canvas.toBlob(blob => {
        if (!blob) {
          resolve(null);
          return;
        }

        resolve(new File([blob], 'musteri-imzasi.png', { type: 'image/png' }));
      }, 'image/png');
    });
  }

  isHaveSupplies(name: string) {
    return this.data().supplies.some(i => i == name);
  }

  toggleSupply(name: string) {
    if(!this.showButton()) return;
    const supplies = [...this.data().supplies];
    const index = supplies.findIndex(i => i == name);
    if (index === -1) {
      supplies.push(name);
    } else {
      supplies.splice(index, 1);
    }

    this.data.update(prev => ({ ...prev, supplies: [...supplies] }));
  }

  deleteImageUrl(index: number) {
    const images = [...this.data().imageUrls];
    images.splice(index, 1);
    this.data.update(prev => ({ ...prev, imageUrls: [...images] }));
  }

  deleteFiles(index: number) {
    const files = [...this.data().files];
    files.splice(index, 1);
    const images = [...this.images()];
    images.splice(index, 1);
    this.images.set([...images]);
    this.data.update(prev => ({ ...prev, files: [...files] }));
  }

  openFileInput() {
    this.fileInput()!.nativeElement.click();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.data.update(prev => ({ ...prev, files: [...prev.files ?? [], file] }))
      const reader = new FileReader();
      reader.onload = () => {
        this.images.update(prev => [...prev, reader.result as string]); // Base64 olarak diziye ekleniyor
      };
      reader.readAsDataURL(file);
    }
  }

  addDamage() {
    const point = this.selectedDamagePoint();
    const damages = [...this.data().damages];
    const damage = {
      level: this.damage().level,
      description: this.damageDescriptionWithPoint(this.damage().description, point)
    };
    const editingIndex = this.editingDamageIndex();
    if (editingIndex === null) {
      damages.push(damage);
    } else {
      damages[editingIndex] = damage;
    }
    this.damage.set({ level: 'Küçük Çizik', description: '' });
    this.selectedDamagePoint.set(null);
    this.editingDamageIndex.set(null);
    this.data.update(prev => ({ ...prev, damages: [...damages] }));
  }

  removeDamage(index: number) {
    const damages = [...this.data().damages];
    damages.splice(index, 1);
    if (this.editingDamageIndex() === index) {
      this.cancelDamageEdit();
    }
    this.data.update(prev => ({ ...prev, damages: [...damages] }));
  }

  editDamage(index: number) {
    if (!this.showButton()) return;

    const damage = this.data().damages[index];
    if (!damage) return;

    this.editingDamageIndex.set(index);
    this.damage.set({
      level: damage.level,
      description: this.damageText(damage.description)
    });
    this.selectedDamagePoint.set(this.damagePoint(damage.description));
  }

  cancelDamageEdit() {
    this.editingDamageIndex.set(null);
    this.damage.set({ level: 'KÃ¼Ã§Ã¼k Ã‡izik', description: '' });
    this.selectedDamagePoint.set(null);
  }

  setDamageClass(level: string) {
    switch (level) {
      case 'Küçük Çizik': return 'minor-damage'
      case 'Büyük Hasar': return 'major-damage'
      case 'Kritik Hasar': return 'critical-damage'
      default: return '';
    }
  }

  setDamageLevel(level: string) {
    this.damage.update(prev => ({ ...prev, level }));
  }

  setDamageDescription(description: string) {
    this.damage.update(prev => ({ ...prev, description }));
  }

  setDamagePoint(event: MouseEvent) {
    if (!this.showButton()) return;

    const container = event.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    this.selectedDamagePoint.set({
      x: Math.max(0, Math.min(100, Number(x.toFixed(2)))),
      y: Math.max(0, Math.min(100, Number(y.toFixed(2))))
    });
  }

  damageDescriptionWithPoint(description: string, point: { x: number; y: number } | null) {
    const text = this.damageText(description).trim();
    if (!point) return text;
    return `[x=${point.x};y=${point.y}] ${text}`.trim();
  }

  damagePoint(description: string) {
    const match = String(description ?? '').match(/^\[x=([\d.]+);y=([\d.]+)\]\s*/);
    if (!match) return null;

    return {
      x: Number(match[1]),
      y: Number(match[2])
    };
  }

  damageText(description: string) {
    return String(description ?? '').replace(/^\[x=[\d.]+;y=[\d.]+\]\s*/, '');
  }

  damageDisplay(damage: { level: string; description: string }) {
    const text = this.damageText(damage.description);
    return text ? `${damage.level}: ${text}` : damage.level;
  }

  damagePointClass(level: string) {
    if (level.includes('Kritik')) return 'dent';
    if (level.includes('Hasar')) return 'major';
    return 'minor';
  }

  async save() {
    const totalImage = this.data().files?.length ?? 0;
    if (totalImage === 0) {
      this.#toast.showToast("Hata", "Resim eklemediniz", "error");
      return;
    }

    if (this.data().kilometer < 0) {
      this.#toast.showToast("Hata", "Araç KM 0 dan küçük olamaz", "error");
      return;
    }

    if(!this.customerApproval() && this.requiresCustomerSignature()){
      this.#toast.showToast("Hata", "Formu onaylamalısınız", "error");
      return;
    }

    if(!this.signatureSigned() && this.requiresCustomerSignature()){
      this.#toast.showToast("Hata", "Musteri imzasi alinmalidir", "error");
      return;
    }

    const formData = new FormData();
    formData.append("ReservationId", this.data().reservationId);
    formData.append("Type", this.type());
    formData.append("Kilometer", this.data().kilometer.toString());
    this.data().files.forEach(val => {
      formData.append("Files", val, val.name);
    });
    const signatureFile = await this.signatureFile();
    if (signatureFile) {
      formData.append("Files", signatureFile, signatureFile.name);
    }
    this.data().supplies.forEach(val => {
      formData.append("Supplies", val);
    });
    this.data().damages.forEach((val, index) => {
      formData.append(`Damages[${index}].level`, val.level);
      formData.append(`Damages[${index}].description`, val.description);
    });
    formData.append("Note", this.data().note);

    this.loading.set(true);
    this.#http.put<string>(`/rent/reservation-form`, formData, res => {
      this.#location.back();
      this.#toast.showToast("Başarılı", res, "info");
      this.loading.set(false);
    }, () => this.loading.set(false));
  }
}
