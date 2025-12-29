export interface CvBankCandidate {
    id?: string; // Mapped from candidates.id
    dosya_id: string; // or number, assuming string from context "dosya_id" usually unique
    tam_isim: string;
    yas: number;
    dogum_tarihi: string; // "YYYY-MM-DD"
    cinsiyet: string;
    uyruk: string;
    engel_durumu: string;
    askerlik_durumu: string;
    surucu_belgesi: string;
    adres_il: string;
    adres_ilce: string;
    adres_tam: string;
    telefon: string;
    email: string;
    egitim_durumu: string;
    universiteler: string; // Text search
    bolumler: string;
    ogrenim_turu: string;
    mezuniyet_yili: string; // or number
    not_ortalamasi: string;
    egitim_dilleri: string;
    is_deneyimleri: string; // Text search friendly
    toplam_deneyim_yili: string; // e.g. "5 Yıl" or number
    calisma_durumu: string;
    yetenekler: string; // JSON string or text list
    sertifikalar: string;
    sertifika_kaynaklari: string;
    sertifika_tarihi: string;
    katildigi_seminerler: string;
    projeler: string;
    diller: string;
    bilgisayar_becerileri: string;
    tercih_edilen_sektor: string;
    tercih_edilen_pozisyon: string;
    ozet_bilgi: string;
    ozgecmis_guncelleme_tarihi: string;
    cv_kaynak: string;
    drive_linki: string;
    guncellenme_zamani: string;

    // Optional joined data from recent updates
    resume_experience?: any[];
    resume_education?: any[];
    resume_skill?: any[];
    resume_language?: any[];

    // Mapped fields
    disability_category?: string;
}

export interface DisabledReport {
    dosya_id: string;
    ad_soyad: string;
    tc_no: string;
    dogum_tarihi: string;
    verilis_tarihi: string;
    engelilik_orani: string; // e.g. "40" or "%40"
    engel_icerigi: string;
    gecerlilik: string;
    drive_linki: string;
}
