# İş Günlüğü (PWA)

Kişisel kullanım için iş kayıtları: hızlı giriş, liste, haftalık özet paylaşımı.

## Bilgisayarda çalıştırma (iPhone önizlemeli)

```bash
npm run dev
```

Tarayıcıda açın: **http://localhost:3000**

Geniş ekranda (Windows) uygulama **iPhone çerçevesi** içinde görünür. Gerçek iPhone’da veya dar pencerede tam ekran açılır.

### Chrome’da ek önizleme

1. F12 → cihaz simgesi (Toggle device toolbar)
2. Cihaz: iPhone 14 Pro veya 15 Pro
3. Sayfayı yenileyin

## iPhone’a ekleme

1. Siteyi yayınlayın (ör. GitHub Pages) veya aynı Wi‑Fi’de bilgisayar IP’si: `http://192.168.x.x:3000`
2. Safari → Paylaş → **Ana Ekrana Ekle**

Veriler yalnızca telefonunuzda (localStorage) saklanır.

## Sekmeler

- **Kayıt** — tarih/saat, Customer Name, PO (pick), DO (drop off), not
- **Liste** — bugün / bu hafta / tümü
- **Hafta** — özet metin, kopyala veya paylaş
