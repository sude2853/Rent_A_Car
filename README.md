# Rent A Car Otomasyon Sistemi

Bu proje, araç kiralama süreçlerinin dijital ortamda yönetilmesini sağlamak amacıyla geliştirilmiş kapsamlı bir Rent A Car otomasyon sistemidir. Proje; müşteri kayıt ve giriş işlemleri, araç listeleme, rezervasyon oluşturma, ödeme simülasyonu, kullanıcı profili, kiralama geçmişi ve admin paneli üzerinden yönetim işlemlerini tek bir sistem altında toplamaktadır.

## Projenin Amacı

Rent A Car işletmelerinde araç, müşteri, rezervasyon, şube ve teslim süreçlerinin manuel olarak yürütülmesi zaman kaybına ve veri takibinde hatalara neden olabilmektedir. Bu proje ile amaçlanan; araç kiralama sürecini daha düzenli, izlenebilir, güvenilir ve kullanıcı dostu bir yapıya dönüştürmektir.

Sistem, hem son kullanıcıların web arayüzü üzerinden araç kiralayabilmesini hem de yöneticilerin admin paneli üzerinden operasyonel verileri yönetebilmesini sağlayacak şekilde tasarlanmıştır.

## Kapsam

Proje iki temel arayüzden oluşmaktadır:

- Kullanıcı paneli: Müşterilerin kayıt olabildiği, giriş yapabildiği, araçları inceleyebildiği, rezervasyon oluşturabildiği ve profil bilgilerini yönetebildiği alandır.
- Admin paneli: Yöneticilerin araç, müşteri, kullanıcı, rol, şube, kategori, rezervasyon, güvence paketi ve ekstra hizmetleri yönetebildiği alandır.

## Temel Özellikler

- Kullanıcı kayıt ve giriş sistemi
- E-posta ve kullanıcı adı kontrolü
- Şifre güvenlik denetimi
- Araç listeleme ve filtreleme
- Araç detay görüntüleme
- Rezervasyon oluşturma
- Ödeme simülasyonu
- Profil bilgilerini güncelleme
- Kiralama geçmişi görüntüleme
- Admin dashboard ekranı
- Araç, müşteri, şube, rol, kategori ve rezervasyon yönetimi
- Teslim formu ve müşteri imzası işlemleri
- Hasar tespiti ve kayıt yönetimi
- Türkçe karakter ve kullanıcı arayüzü düzenlemeleri

## Kullanılan Teknolojiler

### Backend

- .NET 9
- ASP.NET Core Web API
- Entity Framework Core
- Clean Architecture
- Domain Driven Design yaklaşımı
- CQRS yapısı
- JWT tabanlı kimlik doğrulama
- OData desteği
- SQL Server LocalDB

### Frontend

- Angular
- TypeScript
- HTML
- CSS
- Bootstrap ikonları
- Responsive kullanıcı arayüzü

## Mimari Yapı

Proje, katmanlı mimari prensipleri doğrultusunda geliştirilmiştir. Backend tarafında domain, application, infrastructure ve web API katmanları ayrıştırılmıştır. Bu yapı sayesinde iş kuralları, veri erişimi ve API uç noktaları daha düzenli ve sürdürülebilir hale getirilmiştir.

Frontend tarafında kullanıcı arayüzü ve admin paneli ayrı uygulamalar olarak yapılandırılmıştır. Böylece müşteri işlemleri ile yönetim işlemleri birbirinden ayrılmış, daha anlaşılır bir kullanım deneyimi sağlanmıştır.

## Veritabanı Yapısı

Sistemde araçlar, kullanıcılar, müşteriler, rezervasyonlar, şubeler, roller, kategoriler, güvence paketleri, ekstra hizmetler ve teslim formları gibi temel varlıklar veritabanı üzerinde saklanmaktadır. Rezervasyon ve teslim süreçlerinde kullanıcı, araç ve ödeme bilgileri ilişkisel olarak yönetilmektedir.

## Projenin Katkısı

Bu çalışma, gerçek bir araç kiralama işletmesinin ihtiyaç duyabileceği temel süreçleri yazılım ortamına aktarmayı hedeflemektedir. Proje sayesinde kullanıcı deneyimi, veri bütünlüğü, işlem takibi ve yönetimsel kontrol açısından daha düzenli bir yapı oluşturulmuştur.

Bitirme projesi kapsamında geliştirilen bu sistem, web tabanlı kurumsal uygulama geliştirme, veritabanı yönetimi, kullanıcı arayüzü tasarımı ve backend mimarisi konularında uygulamalı bir çalışma niteliğindedir.

## Kurulum ve Çalıştırma

Projeyi çalıştırmadan önce gerekli bağımlılıkların yüklenmesi gerekir.

### Backend

```bash
cd RentCarServer
dotnet restore
dotnet build
```

Backend API çalıştırmak için:

```bash
dotnet run --project src/RentCarServer.WebAPI/RentCarServer.WebAPI.csproj
```

### Frontend

```bash
cd RentCarClient
npm install
```

Kullanıcı arayüzünü çalıştırmak için:

```bash
npx nx serve ui --port 4200
```

Admin panelini çalıştırmak için:

```bash
npx nx serve admin --port 4300
```

## Proje Durumu

Proje; kullanıcı arayüzü, admin paneli, rezervasyon akışı, ödeme simülasyonu, profil yönetimi ve temel yönetim panelleriyle birlikte çalışır durumdadır. Geliştirme sürecinde kullanıcı deneyimi, Türkçe dil uyumluluğu ve veritabanı bağlantılı yönetim işlemleri üzerinde iyileştirmeler yapılmıştır.

## Not

Bu proje eğitim sürecinde elde edilen temel yapı üzerine geliştirilmiş, bitirme projesi gereksinimlerine uygun olacak şekilde genişletilmiş ve özelleştirilmiştir.
