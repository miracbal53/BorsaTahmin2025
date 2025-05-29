# BorsaTahmin2025

**BorsaTahmin2025**, kullanıcıların borsa, kripto ve forex piyasalarını takip edebileceği, yapay zeka destekli tahminler alabileceği ve özel abonelik planlarıyla finansal analizlere erişebileceği kapsamlı bir platformdur. Bu proje, hem kullanıcılar hem de adminler için farklı işlevler sunarak finansal dünyayı daha erişilebilir hale getirir.

---

## Özellikler

### 1. **Kullanıcı Yönetimi**
- **Kayıt Olma ve Giriş Yapma**: Kullanıcılar platforma kayıt olabilir ve giriş yapabilir.
- **Profil Yönetimi**: Kullanıcılar profil bilgilerini düzenleyebilir.
- **Yetkilendirme**: Kullanıcılar ve adminler için farklı erişim seviyeleri.

### 2. **Abonelik Planları**
- Kullanıcılar, borsa, kripto ve forex piyasalarına yönelik farklı abonelik planları seçebilir.
- **Plan Özellikleri**:
  - **Borsa Istanbul**: BIST piyasası analizleri, gerçek zamanlı veriler ve hisse takibi.
  - **Kripto**: Kripto piyasası analizleri, gerçek zamanlı veriler ve teknik göstergeler.
  - **Forex**: Forex piyasası analizleri, yapay zeka destekli analizler ve VIP destek.

### 3. **Yapay Zeka Destekli Tahminler**
- Kullanıcılar, seçtikleri piyasa için yapay zeka destekli tahminlere erişebilir.
- Tahminler, geçmiş verilere ve teknik analizlere dayalıdır.

### 4. **Admin Paneli**
- **Kullanıcı Yönetimi**: Adminler, kullanıcıların bilgilerini düzenleyebilir ve rollerini değiştirebilir.
- **Abonelik Talepleri**: Kullanıcıların abonelik taleplerini onaylayabilir veya reddedebilir.
- **Tahmin Yönetimi**: Adminler, yapay zeka tahminlerini güncelleyebilir.
- **Mesaj Yönetimi**: Kullanıcıların gönderdiği mesajları görüntüleyebilir ve yanıtlayabilir.

### 5. **Bildirimler**
- Kullanıcılar, abonelik talepleri ve diğer önemli olaylar hakkında bildirim alır.

### 6. **Responsive Tasarım**
- Platform, mobil ve masaüstü cihazlarla uyumludur.

---

## Kullanıcı Rolleri ve İşlevler

### **Kullanıcı**
- Abonelik planlarını görüntüleyebilir ve satın alabilir.
- Yapay zeka tahminlerine erişebilir.
- Profil bilgilerini düzenleyebilir.
- Bildirim alabilir.

### **Admin**
- Kullanıcıları ve abonelik taleplerini yönetebilir.
- Tahminleri güncelleyebilir.
- Kullanıcı mesajlarını görüntüleyebilir ve yanıtlayabilir.


## Kullanılan Teknolojiler

### Backend
- **Python**: Projenin backend kısmı için kullanılan ana programlama dili.
- **Flask**: Web framework olarak kullanıldı. RESTful API'ler oluşturmak için kullanıldı.
- **SQLAlchemy**: Veritabanı işlemleri için ORM (Object Relational Mapper) olarak kullanıldı.
- **PostgreSQL**: Veritabanı yönetim sistemi olarak kullanıldı.
- **Flask-Migrate**: Veritabanı migration işlemleri için kullanıldı.
- **Flask-JWT-Extended**: Kullanıcı kimlik doğrulama ve yetkilendirme işlemleri için JWT (JSON Web Token) desteği sağladı.

### Frontend
- **React**: Kullanıcı arayüzü geliştirmek için kullanılan JavaScript kütüphanesi.
- **React Router**: Sayfa yönlendirme işlemleri için kullanıldı.
- **Bootstrap**: Kullanıcı arayüzü tasarımı için kullanılan CSS framework.
- **Sass**: CSS'in daha güçlü bir sürümü olan Sass, stilleri daha modüler ve okunabilir hale getirmek için kullanıldı.

### Diğer
- **JWT (JSON Web Token)**: Kullanıcı oturumlarını yönetmek ve yetkilendirme işlemleri için kullanıldı.
- **Yapay Zeka (AI)**: Piyasa tahminleri için yapay zeka algoritmaları kullanıldı.
- **Yahoo Finance API**: Borsa verilerini almak için kullanıldı.
- **Binance API**: Kripto para verilerini almak için kullanıldı.

---

## Çalışma Mantığı

1. **Kullanıcı Yönetimi**:
   - Kullanıcılar platforma kayıt olabilir ve giriş yapabilir.
   - Giriş yapan kullanıcılar, JWT token ile kimlik doğrulama işlemi yapar.
   - Kullanıcı rolleri (örneğin, `admin` ve `user`) token üzerinden belirlenir ve erişim yetkileri buna göre düzenlenir.

2. **Abonelik Planları**:
   - Kullanıcılar, borsa, kripto ve forex piyasalarına yönelik abonelik planlarını seçebilir.
   - Abonelik talepleri admin onayına gönderilir.
   - Admin, talepleri onaylayabilir veya reddedebilir.

3. **Yapay Zeka Destekli Tahminler**:
   - Borsa ve kripto piyasalarına yönelik tahminler, geçmiş verilere ve teknik analizlere dayalı olarak yapay zeka algoritmaları ile oluşturulur.
   - Kullanıcılar, seçtikleri abonelik planına göre bu tahminlere erişebilir.

4. **Admin Paneli**:
   - Adminler, kullanıcıları ve abonelik taleplerini yönetebilir.
   - Adminler, yapay zeka tahminlerini güncelleyebilir ve kullanıcı mesajlarını yanıtlayabilir.

5. **Bildirimler**:
   - Kullanıcılar, abonelik talepleri ve diğer önemli olaylar hakkında bildirim alır.

6. **Veri Toplama ve İşleme**:
   - **Yahoo Finance API** ve **Binance API** kullanılarak borsa ve kripto para verileri toplanır.
   - Toplanan veriler temizlenir ve PostgreSQL veritabanına kaydedilir.

7. **Responsive Tasarım**:
   - Platform, mobil ve masaüstü cihazlarla uyumlu olacak şekilde tasarlanmıştır.
