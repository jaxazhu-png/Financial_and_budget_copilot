const REPORT_LABELS = {
    Executive: { en: 'Executive Report', ar: 'التقرير التنفيذي' },
    Disbursement: { en: 'Disbursement Report', ar: 'تقرير الصرف' },
    Contracts: { en: 'Contracts Report', ar: 'تقرير العقود' },
    Initiatives: { en: 'Initiatives Report', ar: 'تقرير المبادرات' },
    Services: { en: 'Services Report', ar: 'تقرير الخدمات' },
    Doors: { en: 'Budget Doors Report', ar: 'تقرير الأبواب المالية' },
    Infrastructure: { en: 'Infrastructure Report', ar: 'تقرير البنية التحتية' },
    Expropriation: { en: 'Expropriation Report', ar: 'تقرير نزع الملكية' },
};

const AMANA_MASTER = [
    { key: 'riyadh', en: 'Riyadh Amana', ar: 'أمانة منطقة الرياض', original: 2500, revised: 2800, spent: 2000, remaining: 800, x: 274, y: 190, lng: 46.6753, lat: 24.7136 },
    { key: 'eastern', en: 'Eastern Province Amana', ar: 'أمانة المنطقة الشرقية', original: 2000, revised: 2200, spent: 1900, remaining: 300, x: 398, y: 198, lng: 50.0888, lat: 26.4207 },
    { key: 'madinah', en: 'Al Madinah Amana', ar: 'أمانة منطقة المدينة المنورة', original: 2000, revised: 2026, spent: 1000, remaining: 1026, x: 180, y: 180, lng: 39.6111, lat: 24.4686 },
    { key: 'jeddah', en: 'Jeddah Governorate Amana', ar: 'أمانة محافظة جدة', original: 1900, revised: 1999, spent: 1000, remaining: 999, x: 150, y: 220, lng: 39.1925, lat: 21.5433 },
    { key: 'makkah', en: 'Makkah Capital Amana', ar: 'أمانة العاصمة المقدسة', original: 1900, revised: 1997, spent: 1000, remaining: 997, x: 175, y: 232, lng: 39.8167, lat: 21.4167 },
    { key: 'qassim', en: 'Al Qassim Amana', ar: 'أمانة منطقة القصيم', original: 1700, revised: 1715, spent: 900, remaining: 815, x: 252, y: 145, lng: 43.9750, lat: 26.3260 },
    { key: 'asir', en: 'Asir Amana', ar: 'أمانة منطقة عسير', original: 1200, revised: 1220, spent: 1200, remaining: 20, x: 184, y: 286, lng: 42.5053, lat: 18.2164 },
    { key: 'taif', en: 'Taif Governorate Amana', ar: 'أمانة محافظة الطائف', original: 600, revised: 605, spent: 400, remaining: 205, x: 194, y: 244, lng: 40.4158, lat: 21.2636 },
    { key: 'tabuk', en: 'Tabuk Amana', ar: 'أمانة منطقة تبوك', original: 600, revised: 620, spent: 400, remaining: 220, x: 120, y: 92, lng: 36.5689, lat: 28.3835 },
    { key: 'jouf', en: 'Al Jouf Amana', ar: 'أمانة منطقة الجوف', original: 550, revised: 552, spent: 300, remaining: 252, x: 235, y: 46, lng: 40.2064, lat: 29.9697 },
    { key: 'ahsa', en: 'Al Ahsa Governorate Amana', ar: 'أمانة محافظة الأحساء', original: 700, revised: 720, spent: 600, remaining: 120, x: 420, y: 225, lng: 49.5653, lat: 25.3753 },
    { key: 'northern', en: 'Northern Borders Amana', ar: 'أمانة منطقة الحدود الشمالية', original: 290, revised: 300, spent: 200, remaining: 100, x: 300, y: 42, lng: 41.0381, lat: 30.9753 },
    { key: 'baha', en: 'Al Baha Amana', ar: 'أمانة منطقة الباحة', original: 333, revised: 339, spent: 100, remaining: 239, x: 182, y: 270, lng: 41.4631, lat: 20.0125 },
    { key: 'hail', en: 'Hail Amana', ar: 'أمانة منطقة حائل', original: 100, revised: 110, spent: 50, remaining: 60, x: 230, y: 110, lng: 41.6961, lat: 27.5219 },
    { key: 'jazan', en: 'Jazan Amana', ar: 'أمانة منطقة جازان', original: 90, revised: 95, spent: 30, remaining: 65, x: 168, y: 336, lng: 42.5511, lat: 16.8894 },
    { key: 'najran', en: 'Najran Amana', ar: 'أمانة منطقة نجران', original: 39, revised: 41, spent: 22, remaining: 19, x: 282, y: 335, lng: 44.1278, lat: 17.4933 },
    { key: 'hafar', en: 'Hafar Al-Batin Amana', ar: 'أمانة محافظة حفر الباطن', original: 30, revised: 31, spent: 15, remaining: 16, x: 338, y: 90, lng: 45.9636, lat: 28.4328 },
];

const MUNICIPALITY_TEMPLATES = {
    northern: [
        { key: 'northern_arar', en: "Arar Municipality", ar: "بلدية عرعر", weight: 0.0714, dx: 12, dy: 0 },
        { key: 'northern_south_arar', en: "South Arar Municipality", ar: "بلدية جنوب عرعر", weight: 0.0714, dx: 18, dy: 9 },
        { key: 'northern_alhdwd_alshmalyh_amana', en: "Al-Hdwd Al-Shmalyh Amana", ar: "أمانة الحدود الشمالية", weight: 0.0714, dx: 17, dy: 22 },
        { key: 'northern_umm_khnsr', en: "Umm Khnsr Municipality", ar: "بلدية ام خنصر", weight: 0.0714, dx: 3, dy: 12 },
        { key: 'northern_tlah_altmyat', en: "Tlah Al-Tmyat Municipality", ar: "بلدية  طلعة التمياط", weight: 0.0714, dx: -4, dy: 19 },
        { key: 'northern_turaif', en: "Turaif Municipality", ar: "بلدية طريف", weight: 0.0714, dx: -17, dy: 22 },
        { key: 'northern_east_arar', en: "East Arar Municipality", ar: "بلدية شرق عرعر", weight: 0.0714, dx: -11, dy: 5 },
        { key: 'northern_west_arar', en: "West Arar Municipality", ar: "بلدية غرب عرعر", weight: 0.0714, dx: -20, dy: 0 },
        { key: 'northern_rafha', en: "Rafha Municipality", ar: "بلدية رفحاء", weight: 0.0714, dx: -25, dy: -12 },
        { key: 'northern_aluwayqilah', en: "Al-Uwayqilah Municipality", ar: "بلدية العويقلة", weight: 0.0714, dx: -7, dy: -9 },
        { key: 'northern_rwdh_hbas', en: "Rwdh Hbas Municipality", ar: "بلدية روضه هباس", weight: 0.0714, dx: -4, dy: -19 },
        { key: 'northern_linah', en: "Linah Municipality", ar: "بلدية لينه", weight: 0.0714, dx: 6, dy: -27 },
        { key: 'northern_shabh_nsab', en: "Shabh Nsab Municipality", ar: "بلدية شعبة نصاب", weight: 0.0714, dx: 7, dy: -9 },
        { key: 'northern_abn_shrym', en: "Abn Shrym Municipality", ar: "بلدية ابن شريم", weight: 0.0714, dx: 18, dy: -9 },
    ],
    baha: [
        { key: 'baha_albaha_sub', en: "Al-Baha Sub Municipality", ar: "بلدية الباحة الفرعية", weight: 0.0769, dx: 12, dy: 0 },
        { key: 'baha_mntqh_albaha_amana', en: "Mntqh Al-Baha Amana", ar: "أمانة منطقة الباحة", weight: 0.0769, dx: 18, dy: 9 },
        { key: 'baha_bny_hsn', en: "Bny Hsn Municipality", ar: "بلدية بني حسن", weight: 0.0769, dx: 16, dy: 23 },
        { key: 'baha_baljurashi', en: "Baljurashi Municipality", ar: "بلجرشي", weight: 0.0769, dx: 1, dy: 12 },
        { key: 'baha_alqara', en: "Al-Qara Municipality", ar: "بلدية القرى", weight: 0.0769, dx: -7, dy: 19 },
        { key: 'baha_alaqiq', en: "Al-Aqiq Municipality", ar: "بلدية العقيق", weight: 0.0769, dx: -21, dy: 19 },
        { key: 'baha_almikhwah', en: "Al-Mikhwah Municipality", ar: "بلدية المخواة", weight: 0.0769, dx: -12, dy: 3 },
        { key: 'baha_mashwqh', en: "Mashwqh Municipality", ar: "بلدية معشوقة", weight: 0.0769, dx: -19, dy: -5 },
        { key: 'baha_bny_kbyr', en: "Bny Kbyr Municipality", ar: "بني كبير", weight: 0.0769, dx: -21, dy: -19 },
        { key: 'baha_qilwah', en: "Qilwah Municipality", ar: "بلدية قلوة", weight: 0.0769, dx: -4, dy: -11 },
        { key: 'baha_almandaq', en: "Al-Mandaq Municipality", ar: "بلدية المندق", weight: 0.0769, dx: 2, dy: -20 },
        { key: 'baha_alhujrah', en: "Al-Hujrah Municipality", ar: "بلدية الحجرة", weight: 0.0769, dx: 16, dy: -23 },
        { key: 'baha_ghamd_alznad', en: "Ghamd Al-Znad Municipality", ar: "بلدية غامد الزناد", weight: 0.0769, dx: 11, dy: -6 },
    ],
    asir: [
        { key: 'asir_wadi_hshbl', en: "Wadi Hshbl Municipality", ar: "بلدية وادي هشبل", weight: 0.0244, dx: 12, dy: 0 },
        { key: 'asir_bhr_abu_skynh', en: "Bhr Abu Skynh Municipality", ar: "بحر ابو سكينة", weight: 0.0244, dx: 20, dy: 3 },
        { key: 'asir_srah_abydh', en: "Srah Abydh Municipality", ar: "بلدية سراة عبيده", weight: 0.0244, dx: 27, dy: 8 },
        { key: 'asir_alaryn_sub', en: "Al-Aryn Sub Municipality", ar: "بلدية العرين الفرعية", weight: 0.0244, dx: 11, dy: 5 },
        { key: 'asir_mntqh_asir_amana', en: "Mntqh Asir Amana", ar: "أمانة منطقة عسير", weight: 0.0244, dx: 16, dy: 12 },
        { key: 'asir_khmys_mshyt', en: "Khmys Mshyt Municipality", ar: "بلدية خميس مشيط", weight: 0.0244, dx: 20, dy: 19 },
        { key: 'asir_ahd_rfydh', en: "Ahd Rfydh Municipality", ar: "بلدية احد رفيدة", weight: 0.0244, dx: 7, dy: 10 },
        { key: 'asir_zhran_aljnwb', en: "Zhran Al-Jnwb Municipality", ar: "بلدية ظهران الجنوب", weight: 0.0244, dx: 10, dy: 18 },
        { key: 'asir_qna', en: "Qna Municipality", ar: "بلدية قنا", weight: 0.0244, dx: 9, dy: 26 },
        { key: 'asir_bisha', en: "Bisha Municipality", ar: "بلدية بيشة", weight: 0.0244, dx: 2, dy: 12 },
        { key: 'asir_bllsmr', en: "Bllsmr Municipality", ar: "بلدية بللسمر", weight: 0.0244, dx: 1, dy: 20 },
        { key: 'asir_al_majardah', en: "Al Majardah Municipality", ar: "بلدية المجاردة", weight: 0.0244, dx: -3, dy: 28 },
        { key: 'asir_al_birk', en: "Al Birk Municipality", ar: "بلدية البرك", weight: 0.0244, dx: -3, dy: 12 },
        { key: 'asir_albshar', en: "Al-Bsha\u0626r Municipality", ar: "بلدية البشائر", weight: 0.0244, dx: -8, dy: 18 },
        { key: 'asir_alhrjh', en: "Al-Hrjh Municipality", ar: "بلدية الحرجة", weight: 0.0244, dx: -15, dy: 24 },
        { key: 'asir_smkh', en: "Smkh Municipality", ar: "بلدية صمخ", weight: 0.0244, dx: -8, dy: 9 },
        { key: 'asir_tathlith', en: "Tathlith Municipality", ar: "بلدية تثليث", weight: 0.0244, dx: -15, dy: 13 },
        { key: 'asir_alsahl', en: "Al-Sahl Municipality", ar: "بلدية الساحل", weight: 0.0244, dx: -24, dy: 14 },
        { key: 'asir_alnqya', en: "Al-Nqya Municipality", ar: "بلدية النقيع", weight: 0.0244, dx: -11, dy: 4 },
        { key: 'asir_thnyh_wtbalh', en: "Thnyh Wtbalh Municipality", ar: "بلدية ثنية وتباله", weight: 0.0244, dx: -19, dy: 5 },
        { key: 'asir_fra_alshaf', en: "Fra Al-Shaf Municipality", ar: "فرع الشعف", weight: 0.0244, dx: -28, dy: 2 },
        { key: 'asir_fra_mrbh', en: "Fra Mrbh Municipality", ar: "فرع مربه", weight: 0.0244, dx: -12, dy: -1 },
        { key: 'asir_alnmas', en: "Al-Nmas Municipality", ar: "بلدية النماص", weight: 0.0244, dx: -19, dy: -5 },
        { key: 'asir_mhayl_asir', en: "Mhayl Asir Municipality", ar: "بلدية محايل عسير", weight: 0.0244, dx: -26, dy: -10 },
        { key: 'asir_fra_mdynh_sltan', en: "Fra Mdynh Sltan Municipality", ar: "فرع مدينة سلطان", weight: 0.0244, dx: -10, dy: -6 },
        { key: 'asir_treib', en: "Treib Municipality", ar: "بلدية طريب", weight: 0.0244, dx: -15, dy: -13 },
        { key: 'asir_ntaq_khdmh_mdynh_abha', en: "Ntaq Khdmh Mdynh Abha Municipality", ar: "نطاق خدمة مدينة أبها", weight: 0.0244, dx: -19, dy: -21 },
        { key: 'asir_bllhmr', en: "Bllhmr Municipality", ar: "بللحمر", weight: 0.0244, dx: -7, dy: -10 },
        { key: 'asir_alsbykhh', en: "Al-Sbykhh Municipality", ar: "بلدية الصبيخة", weight: 0.0244, dx: -8, dy: -18 },
        { key: 'asir_bny_amrw', en: "Bny Amrw Municipality", ar: "بلدية بني عمرو", weight: 0.0244, dx: -7, dy: -27 },
        { key: 'asir_alwadyyn', en: "Al-Wadyyn Municipality", ar: "بلدية الواديين", weight: 0.0244, dx: -1, dy: -12 },
        { key: 'asir_fra_tbb', en: "Fra Tbb Municipality", ar: "فرع طبب", weight: 0.0244, dx: 1, dy: -20 },
        { key: 'asir_alfrshh', en: "Al-Frshh Municipality", ar: "بلدية الفرشة", weight: 0.0244, dx: 5, dy: -27 },
        { key: 'asir_bareq', en: "Bareq Municipality", ar: "بلدية بارق", weight: 0.0244, dx: 4, dy: -11 },
        { key: 'asir_alamwah', en: "Al-Amwah Municipality", ar: "بلدية الامواه", weight: 0.0244, dx: 10, dy: -18 },
        { key: 'asir_alhazmy', en: "Al-Hazmy Municipality", ar: "بلدية الحازمي", weight: 0.0244, dx: 17, dy: -22 },
        { key: 'asir_fra_alswdh', en: "Fra Al-Swdh Municipality", ar: "فرع السوده", weight: 0.0244, dx: 9, dy: -8 },
        { key: 'asir_tnwmh', en: "Tnwmh Municipality", ar: "بلدية تنومه", weight: 0.0244, dx: 16, dy: -12 },
        { key: 'asir_bllqrn', en: "Bllqrn Municipality", ar: "بللقرن", weight: 0.0244, dx: 25, dy: -12 },
        { key: 'asir_alrbwah', en: "Al-Rbwah Municipality", ar: "بلدية الربوعة", weight: 0.0244, dx: 11, dy: -4 },
        { key: 'asir_rjal_alma', en: "Rjal Al-Ma Municipality", ar: "بلدية رجال المع", weight: 0.0244, dx: 20, dy: -3 },
    ],
    najran: [
        { key: 'najran_alhsynyh', en: "Al-Hsynyh Municipality", ar: "بلدية الحصينية", weight: 0.0909, dx: 12, dy: 0 },
        { key: 'najran_mhafzh_khbash', en: "Mhafzh Khbash Municipality", ar: "بلدية محافظة خباش", weight: 0.0909, dx: 17, dy: 11 },
        { key: 'najran_shrwrh', en: "Shrwrh Municipality", ar: "بلدية شرورة", weight: 0.0909, dx: 12, dy: 25 },
        { key: 'najran_mntqh_najran_amana', en: "Mntqh Najran Amana", ar: "أمانة منطقة نجران", weight: 0.0909, dx: -2, dy: 12 },
        { key: 'najran_bir_askr', en: "Bir Askr Municipality", ar: "بلدية بئر عسكر", weight: 0.0909, dx: -13, dy: 15 },
        { key: 'najran_hbwna', en: "Hbwna Municipality", ar: "بلدية حبونا", weight: 0.0909, dx: -27, dy: 8 },
        { key: 'najran_thar', en: "Thar Municipality", ar: "بلدية ثار", weight: 0.0909, dx: -12, dy: -3 },
        { key: 'najran_bdr_aljnwb', en: "Bdr Al-Jnwb Municipality", ar: "بلدية بدر الجنوب", weight: 0.0909, dx: -13, dy: -15 },
        { key: 'najran_sltanh', en: "Sltanh Municipality", ar: "بلدية سلطانة", weight: 0.0909, dx: -4, dy: -28 },
        { key: 'najran_alwdyah', en: "Al-Wdyah Municipality", ar: "بلدية الوديعة", weight: 0.0909, dx: 5, dy: -11 },
        { key: 'najran_ydmh', en: "Ydmh Municipality", ar: "بلدية يدمة", weight: 0.0909, dx: 17, dy: -11 },
    ],
    eastern: [
        { key: 'eastern_allhabh', en: "Al-Lhabh Municipality", ar: "بلدية اللهابة", weight: 0.0385, dx: 12, dy: 0 },
        { key: 'eastern_albyda', en: "Al-Byda Municipality", ar: "بلدية البيضاء", weight: 0.0385, dx: 19, dy: 5 },
        { key: 'eastern_west_dammam', en: "West Dammam Municipality", ar: "بلدية غرب الدمام", weight: 0.0385, dx: 25, dy: 13 },
        { key: 'eastern_center_dammam', en: "Center Dammam Municipality", ar: "بلدية وسط الدمام", weight: 0.0385, dx: 9, dy: 8 },
        { key: 'eastern_east_dammam', en: "East Dammam Municipality", ar: "بلدية شرق الدمام", weight: 0.0385, dx: 11, dy: 16 },
        { key: 'eastern_dhahran', en: "Dhahran Municipality", ar: "بلدية الظهران", weight: 0.0385, dx: 10, dy: 26 },
        { key: 'eastern_mhafzh_alkhobar', en: "Mhafzh Al-Khobar Municipality", ar: "بلدية محافظة الخبر", weight: 0.0385, dx: 1, dy: 12 },
        { key: 'eastern_almntqh_alshrqyh_amana', en: "Al-Mntqh Al-Shrqyh Amana", ar: "أمانة المنطقة الشرقية", weight: 0.0385, dx: -2, dy: 20 },
        { key: 'eastern_qatif', en: "Qatif Municipality", ar: "القطيف", weight: 0.0385, dx: -10, dy: 26 },
        { key: 'eastern_nairyah', en: "Nairyah Municipality", ar: "بلدية النعيرية", weight: 0.0385, dx: -7, dy: 10 },
        { key: 'eastern_ayn_dar', en: "Ayn Dar Municipality", ar: "بلدية عين دار", weight: 0.0385, dx: -15, dy: 13 },
        { key: 'eastern_aljubail', en: "Al-Jubail Municipality", ar: "بلدية الجبيل", weight: 0.0385, dx: -25, dy: 13 },
        { key: 'eastern_alkhafji', en: "Al-Khafji Municipality", ar: "بلدية الخفجي", weight: 0.0385, dx: -12, dy: 3 },
        { key: 'eastern_jwf_bny_hajr', en: "Jwf Bny Hajr Municipality", ar: "جوف بني هاجر", weight: 0.0385, dx: -20, dy: 0 },
        { key: 'eastern_ras_tnwrh', en: "Ras Tnwrh Municipality", ar: "بلدية رأس تنورة", weight: 0.0385, dx: -27, dy: -7 },
        { key: 'eastern_qaryat_alalya', en: "Qaryat Al-Alya Municipality", ar: "بلدية قرية العليا", weight: 0.0385, dx: -11, dy: -6 },
        { key: 'eastern_abqaiq', en: "Abqaiq Municipality", ar: "بقيق", weight: 0.0385, dx: -15, dy: -13 },
        { key: 'eastern_alrfyah', en: "Al-Rfyah Municipality", ar: "بلدية الرفيعة", weight: 0.0385, dx: -16, dy: -23 },
        { key: 'eastern_alsrar', en: "Al-Srar Municipality", ar: "بلدية الصرار", weight: 0.0385, dx: -4, dy: -11 },
        { key: 'eastern_alqlyb', en: "Al-Qlyb Municipality", ar: "بلدية القليب", weight: 0.0385, dx: -2, dy: -20 },
        { key: 'eastern_mlyjh', en: "Mlyjh Municipality", ar: "بلدية مليجة", weight: 0.0385, dx: 3, dy: -28 },
        { key: 'eastern_anak', en: "Anak Municipality", ar: "عنك", weight: 0.0385, dx: 4, dy: -11 },
        { key: 'eastern_alqdyh', en: "Al-Qdyh Municipality", ar: "بلدية القديح", weight: 0.0385, dx: 11, dy: -16 },
        { key: 'eastern_saihat', en: "Saihat Municipality", ar: "سيهات", weight: 0.0385, dx: 21, dy: -19 },
        { key: 'eastern_jzyrh_daryn_wtarwt', en: "Jzyrh Daryn Wtarwt Municipality", ar: "جزيرة دارين وتاروت", weight: 0.0385, dx: 11, dy: -6 },
        { key: 'eastern_safwa', en: "Safwa Municipality", ar: "صفوى", weight: 0.0385, dx: 19, dy: -5 },
    ],
    jazan: [
        { key: 'jazan_mntqh_jazan_amana', en: "Mntqh Jazan Amana", ar: "أمانة منطقة جازان", weight: 0.0385, dx: 12, dy: 0 },
        { key: 'jazan_sbya', en: "Sbya Municipality", ar: "بلدية صبيا", weight: 0.0385, dx: 19, dy: 5 },
        { key: 'jazan_fyfa', en: "Fyfa Municipality", ar: "بلدية فيفا", weight: 0.0385, dx: 25, dy: 13 },
        { key: 'jazan_aby_arysh', en: "Aby Arysh Municipality", ar: "بلدية أبي عريش", weight: 0.0385, dx: 9, dy: 8 },
        { key: 'jazan_ahd_almsarhh', en: "Ahd Al-Msarhh Municipality", ar: "بلدية احد المسارحة", weight: 0.0385, dx: 11, dy: 16 },
        { key: 'jazan_altwal', en: "Al-Twal Municipality", ar: "بلدية الطوال", weight: 0.0385, dx: 10, dy: 26 },
        { key: 'jazan_frsan', en: "Frsan Municipality", ar: "بلدية فرسان", weight: 0.0385, dx: 1, dy: 12 },
        { key: 'jazan_alardh', en: "Al-Ardh Municipality", ar: "بلدية العارضة", weight: 0.0385, dx: -2, dy: 20 },
        { key: 'jazan_aldrb', en: "Al-Drb Municipality", ar: "بلدية الدرب", weight: 0.0385, dx: -10, dy: 26 },
        { key: 'jazan_mhafzh_alhrth', en: "Mhafzh Al-Hrth Municipality", ar: "بلدية محافظة الحرث", weight: 0.0385, dx: -7, dy: 10 },
        { key: 'jazan_alshqyq', en: "Al-Shqyq Municipality", ar: "بلدية الشقيق", weight: 0.0385, dx: -15, dy: 13 },
        { key: 'jazan_alryth', en: "Al-Ryth Municipality", ar: "بلدية الريث", weight: 0.0385, dx: -25, dy: 13 },
        { key: 'jazan_almdaya', en: "Al-Mdaya Municipality", ar: "بلدية المضايا", weight: 0.0385, dx: -12, dy: 3 },
        { key: 'jazan_qwz_aljafrh', en: "Qwz Al-Jafrh Municipality", ar: "بلدية قوز الجعافرة", weight: 0.0385, dx: -20, dy: 0 },
        { key: 'jazan_alhqwa', en: "Al-Hqwa Municipality", ar: "بلدية الحقوا", weight: 0.0385, dx: -27, dy: -7 },
        { key: 'jazan_bysh', en: "Bysh Municipality", ar: "بلدية بيش", weight: 0.0385, dx: -11, dy: -6 },
        { key: 'jazan_wadi_jazan', en: "Wadi Jazan Municipality", ar: "بلدية وادي جازان", weight: 0.0385, dx: -15, dy: -13 },
        { key: 'jazan_aldayr_bny_malk', en: "Al-Dayr (bny Malk) Municipality", ar: "بلدية الداير (بني مالك)", weight: 0.0385, dx: -16, dy: -23 },
        { key: 'jazan_alqfl', en: "Al-Qfl Municipality", ar: "بلدية القفل", weight: 0.0385, dx: -4, dy: -11 },
        { key: 'jazan_hrwb', en: "Hrwb Municipality", ar: "بلدية هروب", weight: 0.0385, dx: -2, dy: -20 },
        { key: 'jazan_alaydaby', en: "Al-Aydaby Municipality", ar: "بلدية العيدابي", weight: 0.0385, dx: 3, dy: -28 },
        { key: 'jazan_almwsm', en: "Al-Mwsm Municipality", ar: "بلدية الموسم", weight: 0.0385, dx: 4, dy: -11 },
        { key: 'jazan_alshy', en: "Al-Shy Municipality", ar: "بلدية السهي", weight: 0.0385, dx: 11, dy: -16 },
        { key: 'jazan_alalyh', en: "Al-Alyh Municipality", ar: "بلدية العالية", weight: 0.0385, dx: 21, dy: -19 },
        { key: 'jazan_dmd', en: "Dmd Municipality", ar: "بلدية ضمد", weight: 0.0385, dx: 11, dy: -6 },
        { key: 'jazan_samth', en: "Samth Municipality", ar: "بلدية صامطة", weight: 0.0385, dx: 19, dy: -5 },
    ],
    hail: [
        { key: 'hail_mhafzh_alshnan', en: "Mhafzh Al-Shnan Municipality", ar: "بلدية محافظة الشنان", weight: 0.0476, dx: 12, dy: 0 },
        { key: 'hail_mntqh_hail_amana', en: "Mntqh Hail Amana", ar: "أمانة منطقة حائل", weight: 0.0476, dx: 19, dy: 6 },
        { key: 'hail_aljnwb', en: "Al-Jnwb Municipality", ar: "بلدية الجنوب", weight: 0.0476, dx: 23, dy: 16 },
        { key: 'hail_mhafzh_alshmly', en: "Mhafzh Al-Shmly Municipality", ar: "بلدية محافظة الشملي", weight: 0.0476, dx: 7, dy: 9 },
        { key: 'hail_alrwdh', en: "Al-Rwdh Municipality", ar: "بلدية الروضة", weight: 0.0476, dx: 7, dy: 19 },
        { key: 'hail_mwqq', en: "Mwqq Municipality", ar: "بلدية موقق", weight: 0.0476, dx: 2, dy: 28 },
        { key: 'hail_bqa', en: "Bqa Municipality", ar: "بلدية بقعاء", weight: 0.0476, dx: -3, dy: 12 },
        { key: 'hail_mhafzh_alslymy', en: "Mhafzh Al-Slymy Municipality", ar: "بلدية محافظة السليمي", weight: 0.0476, dx: -10, dy: 17 },
        { key: 'hail_smyra', en: "Smyra Municipality", ar: "بلدية سميراء", weight: 0.0476, dx: -21, dy: 19 },
        { key: 'hail_mhafzh_alhat', en: "Mhafzh Al-Ha\u0626t Municipality", ar: "بلدية محافظة الحائط", weight: 0.0476, dx: -11, dy: 5 },
        { key: 'hail_mhafzh_alghzalh', en: "Mhafzh Al-Ghzalh Municipality", ar: "بلدية محافظة الغزالة", weight: 0.0476, dx: -20, dy: 3 },
        { key: 'hail_jbh', en: "Jbh Municipality", ar: "بلدية جبة", weight: 0.0476, dx: -28, dy: -4 },
        { key: 'hail_alkhfh', en: "Al-Khfh Municipality", ar: "بلدية الكهفة", weight: 0.0476, dx: -11, dy: -5 },
        { key: 'hail_alwst', en: "Al-Wst Municipality", ar: "بلدية الوسط", weight: 0.0476, dx: -15, dy: -14 },
        { key: 'hail_trbh', en: "Trbh Municipality", ar: "بلدية تربة", weight: 0.0476, dx: -14, dy: -24 },
        { key: 'hail_fyd', en: "Fyd Municipality", ar: "بلدية فيد", weight: 0.0476, dx: -3, dy: -12 },
        { key: 'hail_alhlyfh', en: "Al-Hlyfh Municipality", ar: "بلدية الحليفة", weight: 0.0476, dx: 1, dy: -20 },
        { key: 'hail_alkhth', en: "Al-Khth Municipality", ar: "بلدية الخطة", weight: 0.0476, dx: 10, dy: -26 },
        { key: 'hail_anbwan', en: "Anbwan Municipality", ar: "بلدية انبوان", weight: 0.0476, dx: 7, dy: -9 },
        { key: 'hail_alshmal', en: "Al-Shmal Municipality", ar: "بلدية الشمال", weight: 0.0476, dx: 17, dy: -11 },
        { key: 'hail_alajfr', en: "Al-Ajfr Municipality", ar: "بلدية الاجفر", weight: 0.0476, dx: 27, dy: -8 },
    ],
    tabuk: [
        { key: 'tabuk_mntqh_tabuk_amana', en: "Mntqh Tabuk Amana", ar: "أمانة منطقة تبوك", weight: 0.0625, dx: 12, dy: 0 },
        { key: 'tabuk_hql', en: "Hql Municipality", ar: "بلدية حقل", weight: 0.0625, dx: 18, dy: 8 },
        { key: 'tabuk_mhafzh_alqlybh', en: "Mhafzh Al-Qlybh Municipality", ar: "بلدية محافظة  القليبه", weight: 0.0625, dx: 20, dy: 20 },
        { key: 'tabuk_alwjh', en: "Al-Wjh Municipality", ar: "بلدية الوجه", weight: 0.0625, dx: 5, dy: 11 },
        { key: 'tabuk_dba', en: "Dba Municipality", ar: "بلدية ضباء", weight: 0.0625, dx: 0, dy: 20 },
        { key: 'tabuk_abu_rakh', en: "Abu Rakh Municipality", ar: "بلدية أبو راكه", weight: 0.0625, dx: -11, dy: 26 },
        { key: 'tabuk_almnjwr', en: "Al-Mnjwr Municipality", ar: "بلدية المنجور", weight: 0.0625, dx: -8, dy: 8 },
        { key: 'tabuk_alshbhh', en: "Al-Shbhh Municipality", ar: "بلدية الشبحة", weight: 0.0625, dx: -18, dy: 8 },
        { key: 'tabuk_albda', en: "Al-Bda Municipality", ar: "بلدية البدع", weight: 0.0625, dx: -28, dy: 0 },
        { key: 'tabuk_tyma', en: "Tyma Municipality", ar: "بلدية تيماء", weight: 0.0625, dx: -11, dy: -5 },
        { key: 'tabuk_bir_bn_hrmas', en: "Bir Bn Hrmas Municipality", ar: "بلدية بئر بن هرماس", weight: 0.0625, dx: -14, dy: -14 },
        { key: 'tabuk_aljnwb', en: "Al-Jnwb Municipality", ar: "بلدية الجنوب", weight: 0.0625, dx: -11, dy: -26 },
        { key: 'tabuk_alshmal', en: "Al-Shmal Municipality", ar: "بلدية الشمال", weight: 0.0625, dx: 0, dy: -12 },
        { key: 'tabuk_bda', en: "Bda Municipality", ar: "بلدية بداء", weight: 0.0625, dx: 8, dy: -18 },
        { key: 'tabuk_amlj', en: "Amlj Municipality", ar: "بلدية املج", weight: 0.0625, dx: 20, dy: -20 },
        { key: 'tabuk_ashwaq', en: "Ashwaq Municipality", ar: "بلدية أشواق", weight: 0.0625, dx: 11, dy: -5 },
    ],
    riyadh: [
        { key: 'riyadh_alhariq', en: "Al-Hariq Municipality", ar: "بلدية الحريق", weight: 0.0189, dx: 12, dy: 0 },
        { key: 'riyadh_alqsb', en: "Al-Qsb Municipality", ar: "بلدية القصب", weight: 0.0189, dx: 20, dy: 2 },
        { key: 'riyadh_mntqh_riyadh_amana', en: "Mntqh Riyadh Amana", ar: "أمانة منطقة الرياض", weight: 0.0189, dx: 27, dy: 7 },
        { key: 'riyadh_dawadmi', en: "Dawadmi Municipality", ar: "بلدية الدوادمي", weight: 0.0189, dx: 11, dy: 4 },
        { key: 'riyadh_alayynh_waljbylh', en: "Al-Ayynh Waljbylh Municipality", ar: "بلدية العيينه والجبيله", weight: 0.0189, dx: 18, dy: 9 },
        { key: 'riyadh_qta_south_mdynh_riyadh', en: "Qta South Mdynh Riyadh Municipality", ar: "قطاع جنوب مدينة الرياض", weight: 0.0189, dx: 23, dy: 16 },
        { key: 'riyadh_qta_north_mdynh_riyadh', en: "Qta North Mdynh Riyadh Municipality", ar: "قطاع شمال مدينة الرياض", weight: 0.0189, dx: 9, dy: 8 },
        { key: 'riyadh_qta_west_mdynh_riyadh', en: "Qta West Mdynh Riyadh Municipality", ar: "قطاع غرب مدينة الرياض", weight: 0.0189, dx: 13, dy: 15 },
        { key: 'riyadh_qta_east_mdynh_riyadh', en: "Qta East Mdynh Riyadh Municipality", ar: "قطاع شرق مدينة الرياض", weight: 0.0189, dx: 16, dy: 23 },
        { key: 'riyadh_qta_center_mdynh_riyadh', en: "Qta Center Mdynh Riyadh Municipality", ar: "قطاع وسط مدينة الرياض", weight: 0.0189, dx: 6, dy: 11 },
        { key: 'riyadh_shaqra', en: "Shaqra Municipality", ar: "بلدية شقراء", weight: 0.0189, dx: 8, dy: 19 },
        { key: 'riyadh_bdaa_aladyan', en: "Bda\u0626a Al-Adyan Municipality", ar: "بلدية بدائع العضيان", weight: 0.0189, dx: 7, dy: 27 },
        { key: 'riyadh_afif', en: "Afif Municipality", ar: "بلدية عفيف", weight: 0.0189, dx: 2, dy: 12 },
        { key: 'riyadh_hlban', en: "Hlban Municipality", ar: "بلدية حلبان", weight: 0.0189, dx: 1, dy: 20 },
        { key: 'riyadh_albdya', en: "Al-Bdya Municipality", ar: "بلدية البديع", weight: 0.0189, dx: -2, dy: 28 },
        { key: 'riyadh_alrwydh', en: "Al-Rwydh Municipality", ar: "بلدية الرويضه", weight: 0.0189, dx: -2, dy: 12 },
        { key: 'riyadh_marat', en: "Marat Municipality", ar: "بلدية مرات", weight: 0.0189, dx: -6, dy: 19 },
        { key: 'riyadh_alaflaj', en: "Al-Aflaj Municipality", ar: "بلدية الأفلاج", weight: 0.0189, dx: -12, dy: 25 },
        { key: 'riyadh_almuzahmiyah', en: "Al-Muzahmiyah Municipality", ar: "بلدية المزاحمية", weight: 0.0189, dx: -6, dy: 10 },
        { key: 'riyadh_nfy', en: "Nfy Municipality", ar: "بلدية نفي", weight: 0.0189, dx: -13, dy: 16 },
        { key: 'riyadh_alsr', en: "Al-Sr Municipality", ar: "بلدية السر", weight: 0.0189, dx: -20, dy: 20 },
        { key: 'riyadh_arwa', en: "Arwa Municipality", ar: "بلدية عروى", weight: 0.0189, dx: -10, dy: 7 },
        { key: 'riyadh_alahmr', en: "Al-Ahmr Municipality", ar: "بلدية الأحمر", weight: 0.0189, dx: -17, dy: 10 },
        { key: 'riyadh_alartawyh', en: "Al-Artawyh Municipality", ar: "بلدية الأرطاويه", weight: 0.0189, dx: -26, dy: 11 },
        { key: 'riyadh_jlajl', en: "Jlajl Municipality", ar: "بلدية جلاجل", weight: 0.0189, dx: -11, dy: 4 },
        { key: 'riyadh_drma', en: "Drma Municipality", ar: "بلدية ضرماء", weight: 0.0189, dx: -20, dy: 4 },
        { key: 'riyadh_rawdah_sdyr', en: "Rawdah Sdyr Municipality", ar: "بلدية روضة سدير", weight: 0.0189, dx: -28, dy: 2 },
        { key: 'riyadh_aljlh_wtbrak', en: "Al-Jlh Wtbrak Municipality", ar: "بلدية الجله وتبراك", weight: 0.0189, dx: -12, dy: -1 },
        { key: 'riyadh_hwth_bny_tmym', en: "Hwth Bny Tmym Municipality", ar: "بلدية حوطة بني تميم", weight: 0.0189, dx: -20, dy: -4 },
        { key: 'riyadh_sulayyil', en: "Sulayyil Municipality", ar: "بلدية السليل", weight: 0.0189, dx: -27, dy: -8 },
        { key: 'riyadh_quwayiyah', en: "Quwayiyah Municipality", ar: "بلدية القويعية", weight: 0.0189, dx: -11, dy: -5 },
        { key: 'riyadh_zulfi', en: "Zulfi Municipality", ar: "بلدية الزلفي", weight: 0.0189, dx: -17, dy: -10 },
        { key: 'riyadh_aldlm', en: "Al-Dlm Municipality", ar: "بلدية الدلم", weight: 0.0189, dx: -22, dy: -17 },
        { key: 'riyadh_ashyqr', en: "Ashyqr Municipality", ar: "بلدية أشيقر", weight: 0.0189, dx: -9, dy: -8 },
        { key: 'riyadh_alryn', en: "Al-Ryn Municipality", ar: "بلدية الرين", weight: 0.0189, dx: -13, dy: -16 },
        { key: 'riyadh_sajr', en: "Sajr Municipality", ar: "بلدية ساجر", weight: 0.0189, dx: -15, dy: -24 },
        { key: 'riyadh_mhafzh_huraymila', en: "Mhafzh Huraymila Municipality", ar: "بلدية محافظة حريملاء", weight: 0.0189, dx: -5, dy: -11 },
        { key: 'riyadh_alhyanyh_walbrk', en: "Al-Hyanyh Walbrk Municipality", ar: "الحيانية والبرك", weight: 0.0189, dx: -6, dy: -19 },
        { key: 'riyadh_albjadyh', en: "Al-Bjadyh Municipality", ar: "بلدية البجادية", weight: 0.0189, dx: -6, dy: -27 },
        { key: 'riyadh_hwth_sdyr', en: "Hwth Sdyr Municipality", ar: "بلدية حوطة سدير", weight: 0.0189, dx: -1, dy: -12 },
        { key: 'riyadh_diriyah', en: "Diriyah Municipality", ar: "بلدية الدرعية", weight: 0.0189, dx: 1, dy: -20 },
        { key: 'riyadh_alhlwh', en: "Al-Hlwh Municipality", ar: "بلدية الحلوه", weight: 0.0189, dx: 4, dy: -28 },
        { key: 'riyadh_alkharj', en: "Al-Kharj Municipality", ar: "بلدية الخرج", weight: 0.0189, dx: 3, dy: -12 },
        { key: 'riyadh_rumah', en: "Rumah Municipality", ar: "بلدية رماح", weight: 0.0189, dx: 8, dy: -19 },
        { key: 'riyadh_alghat', en: "Al-Ghat Municipality", ar: "بلدية الغاط", weight: 0.0189, dx: 14, dy: -25 },
        { key: 'riyadh_aljmsh', en: "Al-Jmsh Municipality", ar: "بلدية الجمش", weight: 0.0189, dx: 7, dy: -10 },
        { key: 'riyadh_majmaah', en: "Majmaah Municipality", ar: "بلدية المجمعة", weight: 0.0189, dx: 13, dy: -15 },
        { key: 'riyadh_tmyr', en: "Tmyr Municipality", ar: "بلدية تمير", weight: 0.0189, dx: 21, dy: -18 },
        { key: 'riyadh_thadig', en: "Thadig Municipality", ar: "بلدية ثادق", weight: 0.0189, dx: 10, dy: -7 },
        { key: 'riyadh_wadi_aldwasr', en: "Wadi Al-Dwasr Municipality", ar: "بلدية وادي الدواسر", weight: 0.0189, dx: 18, dy: -9 },
        { key: 'riyadh_alhyathm', en: "Al-Hyathm Municipality", ar: "بلدية الهياثم", weight: 0.0189, dx: 26, dy: -10 },
        { key: 'riyadh_alhdar', en: "Al-Hdar Municipality", ar: "بلدية الهدار", weight: 0.0189, dx: 12, dy: -3 },
        { key: 'riyadh_alhsah', en: "Al-Hsah Municipality", ar: "بلدية الحصاة", weight: 0.0189, dx: 20, dy: -2 },
    ],
    madinah: [
        { key: 'madinah_qta_aljnwb', en: "Qta Al-Jnwb Municipality", ar: "قطاع الجنوب", weight: 0.0417, dx: 12, dy: 0 },
        { key: 'madinah_alslslh', en: "Al-Slslh Municipality", ar: "الصلصلة", weight: 0.0417, dx: 19, dy: 5 },
        { key: 'madinah_mntqh_almdynh_almnwrh_amana', en: "Mntqh Al-Mdynh Al-Mnwrh Amana", ar: "أمانة منطقة المدينة المنورة", weight: 0.0417, dx: 24, dy: 14 },
        { key: 'madinah_almsyjyd_walqahh', en: "Al-Msyjyd Walqahh Municipality", ar: "المسيجيد والقاحه", weight: 0.0417, dx: 8, dy: 8 },
        { key: 'madinah_thrb', en: "Thrb Municipality", ar: "ثرب", weight: 0.0417, dx: 10, dy: 17 },
        { key: 'madinah_ynba_alnkhl', en: "Ynba Al-Nkhl Municipality", ar: "ينبع النخل", weight: 0.0417, dx: 7, dy: 27 },
        { key: 'madinah_alala', en: "Al-Ala Municipality", ar: "العلا", weight: 0.0417, dx: 0, dy: 12 },
        { key: 'madinah_slylh_jhynh_walmrba', en: "Slylh Jhynh Walmrba Municipality", ar: "سليلة جهينة والمربع", weight: 0.0417, dx: -5, dy: 19 },
        { key: 'madinah_alhsw', en: "Al-Hsw Municipality", ar: "الحسو", weight: 0.0417, dx: -14, dy: 24 },
        { key: 'madinah_wadi_alfra', en: "Wadi Al-Fra Municipality", ar: "وادي الفرع", weight: 0.0417, dx: -8, dy: 8 },
        { key: 'madinah_bdr', en: "Bdr Municipality", ar: "بدر", weight: 0.0417, dx: -17, dy: 10 },
        { key: 'madinah_alashash', en: "Al-Ashash Municipality", ar: "العشاش", weight: 0.0417, dx: -27, dy: 7 },
        { key: 'madinah_alays', en: "Al-Ays Municipality", ar: "العيص", weight: 0.0417, dx: -12, dy: 0 },
        { key: 'madinah_almhd', en: "Al-Mhd Municipality", ar: "المهد", weight: 0.0417, dx: -19, dy: -5 },
        { key: 'madinah_alnkhyl', en: "Al-Nkhyl Municipality", ar: "النخيل", weight: 0.0417, dx: -24, dy: -14 },
        { key: 'madinah_khybr', en: "Khybr Municipality", ar: "خيبر", weight: 0.0417, dx: -8, dy: -8 },
        { key: 'madinah_ynba', en: "Ynba Municipality", ar: "ينبع", weight: 0.0417, dx: -10, dy: -17 },
        { key: 'madinah_alswyrqyh', en: "Al-Swyrqyh Municipality", ar: "السويرقية", weight: 0.0417, dx: -7, dy: -27 },
        { key: 'madinah_qta_almrkzyh', en: "Qta Al-Mrkzyh Municipality", ar: "قطاع المركزية", weight: 0.0417, dx: 0, dy: -12 },
        { key: 'madinah_qta_alshmal', en: "Qta Al-Shmal Municipality", ar: "قطاع الشمال", weight: 0.0417, dx: 5, dy: -19 },
        { key: 'madinah_qta_alshrq', en: "Qta Al-Shrq Municipality", ar: "قطاع الشرق", weight: 0.0417, dx: 14, dy: -24 },
        { key: 'madinah_qta_alghrb', en: "Qta Al-Ghrb Municipality", ar: "قطاع الغرب", weight: 0.0417, dx: 8, dy: -8 },
        { key: 'madinah_almlylyh', en: "Al-Mlylyh Municipality", ar: "بلدية المليليح", weight: 0.0417, dx: 17, dy: -10 },
        { key: 'madinah_alhnakyh', en: "Al-Hnakyh Municipality", ar: "الحناكيه", weight: 0.0417, dx: 27, dy: -7 },
    ],
    taif: [
        { key: 'taif_north_taif_sub', en: "North Taif Sub Municipality", ar: "بلدية شمال الطائف الفرعية", weight: 0.0625, dx: 12, dy: 0 },
        { key: 'taif_alsyl_sub', en: "Al-Syl Sub Municipality", ar: "بلدية السيل الفرعية", weight: 0.0625, dx: 18, dy: 8 },
        { key: 'taif_south_taif_sub', en: "South Taif Sub Municipality", ar: "بلدية جنوب الطائف الفرعية", weight: 0.0625, dx: 20, dy: 20 },
        { key: 'taif_qya', en: "Qya Municipality", ar: "بلدية قيا", weight: 0.0625, dx: 5, dy: 11 },
        { key: 'taif_mysan', en: "Mysan Municipality", ar: "بلدية ميسان", weight: 0.0625, dx: 0, dy: 20 },
        { key: 'taif_almwyh', en: "Al-Mwyh Municipality", ar: "بلدية الموية", weight: 0.0625, dx: -11, dy: 26 },
        { key: 'taif_mhafzh_taif_amana', en: "Mhafzh Taif Amana", ar: "أمانة محافظة الطائف", weight: 0.0625, dx: -8, dy: 8 },
        { key: 'taif_east_taif_sub', en: "East Taif Sub Municipality", ar: "بلدية شرق الطائف الفرعية", weight: 0.0625, dx: -18, dy: 8 },
        { key: 'taif_alqrya_bny_malk', en: "Al-Qrya Bny Malk Municipality", ar: "بلدية القريع بني مالك", weight: 0.0625, dx: -28, dy: 0 },
        { key: 'taif_alkhrmh', en: "Al-Khrmh Municipality", ar: "بلدية الخرمة", weight: 0.0625, dx: -11, dy: -5 },
        { key: 'taif_mhafzh_trbh', en: "Mhafzh Trbh Municipality", ar: "بلدية محافظة تربة", weight: 0.0625, dx: -14, dy: -14 },
        { key: 'taif_bny_sad', en: "Bny Sad Municipality", ar: "بلدية بني سعد", weight: 0.0625, dx: -11, dy: -26 },
        { key: 'taif_zlm', en: "Zlm Municipality", ar: "بلدية ظلم", weight: 0.0625, dx: 0, dy: -12 },
        { key: 'taif_almhany', en: "Al-Mhany Municipality", ar: "بلدية المحاني", weight: 0.0625, dx: 8, dy: -18 },
        { key: 'taif_west_taif_sub', en: "West Taif Sub Municipality", ar: "بلدية غرب الطائف الفرعية", weight: 0.0625, dx: 20, dy: -20 },
        { key: 'taif_rnyh', en: "Rnyh Municipality", ar: "بلدية رنية", weight: 0.0625, dx: 11, dy: -5 },
    ],
    jouf: [
        { key: 'jouf_north_skaka', en: "North Skaka Municipality", ar: "بلدية شمال سكاكا", weight: 0.0769, dx: 12, dy: 0 },
        { key: 'jouf_center_skaka', en: "Center Skaka Municipality", ar: "بلدية وسط سكاكا", weight: 0.0769, dx: 18, dy: 9 },
        { key: 'jouf_south_skaka_qara', en: "South Skaka - Qara Municipality", ar: "بلدية جنوب سكاكا - قارا", weight: 0.0769, dx: 16, dy: 23 },
        { key: 'jouf_alaysawyh', en: "Al-Aysawyh Municipality", ar: "بلدية العيساويه", weight: 0.0769, dx: 1, dy: 12 },
        { key: 'jouf_alnasfh', en: "Al-Nasfh Municipality", ar: "بلدية الناصفه", weight: 0.0769, dx: -7, dy: 19 },
        { key: 'jouf_swyr', en: "Swyr Municipality", ar: "بلدية صوير", weight: 0.0769, dx: -21, dy: 19 },
        { key: 'jouf_abwajrm', en: "Abwajrm Municipality", ar: "بلدية أبوعجرم", weight: 0.0769, dx: -12, dy: 3 },
        { key: 'jouf_mntqh_al_jouf_amana', en: "Mntqh Al Jouf Amana", ar: "أمانة منطقة الجوف", weight: 0.0769, dx: -19, dy: -5 },
        { key: 'jouf_modern', en: "Modern Municipality", ar: "الحديثة", weight: 0.0769, dx: -21, dy: -19 },
        { key: 'jouf_dwmh_aljndl', en: "Dwmh Al-Jndl Municipality", ar: "بلدية دومة الجندل", weight: 0.0769, dx: -4, dy: -11 },
        { key: 'jouf_tbrjl', en: "Tbrjl Municipality", ar: "بلدية طبرجل", weight: 0.0769, dx: 2, dy: -20 },
        { key: 'jouf_zlwm', en: "Zlwm Municipality", ar: "بلدية زلوم", weight: 0.0769, dx: 16, dy: -23 },
        { key: 'jouf_alqryat', en: "Al-Qryat Municipality", ar: "بلدية القريات", weight: 0.0769, dx: 11, dy: -6 },
    ],
    hafar: [
        { key: 'hafar_west_hfr_albatn', en: "West Hfr Al-Batn Municipality", ar: "بلدية غرب حفر الباطن", weight: 0.125, dx: 12, dy: 0 },
        { key: 'hafar_east_hfr_albatn', en: "East Hfr Al-Batn Municipality", ar: "بلدية شرق حفر الباطن", weight: 0.125, dx: 14, dy: 14 },
        { key: 'hafar_south_hfr_albatn', en: "South Hfr Al-Batn Municipality", ar: "بلدية جنوب حفر الباطن", weight: 0.125, dx: 0, dy: 28 },
        { key: 'hafar_aldhybyh', en: "Al-Dhybyh Municipality", ar: "بلدية الذيبيه", weight: 0.125, dx: -8, dy: 8 },
        { key: 'hafar_alsdawy', en: "Al-Sdawy Municipality", ar: "بلدية الصداوي", weight: 0.125, dx: -20, dy: 0 },
        { key: 'hafar_alqyswmh', en: "Al-Qyswmh Municipality", ar: "بلدية القيصومة", weight: 0.125, dx: -20, dy: -20 },
        { key: 'hafar_alsayrh', en: "Al-Sayrh Municipality", ar: "بلدية السعيرة", weight: 0.125, dx: 0, dy: -12 },
        { key: 'hafar_hfr_albatn_amana', en: "Hfr Al-Batn Amana", ar: "أمانة حفر الباطن", weight: 0.125, dx: 14, dy: -14 },
    ],
    makkah: [
        { key: 'makkah_alazyzyh_sub', en: "Al-Azyzyh Sub Municipality", ar: "بلدية العزيزية الفرعية", weight: 0.0625, dx: 12, dy: 0 },
        { key: 'makkah_almntqh_almrkzyh', en: "Al-Mntqh Al-Mrkzyh Municipality", ar: "المنطقة المركزية", weight: 0.0625, dx: 18, dy: 8 },
        { key: 'makkah_alhdybyh', en: "Al-Hdybyh Municipality", ar: "بلدية الحديبية", weight: 0.0625, dx: 20, dy: 20 },
        { key: 'makkah_alshaybh', en: "Al-Shaybh Municipality", ar: "بلدية الشعيبة", weight: 0.0625, dx: 5, dy: 11 },
        { key: 'makkah_bhrh_sub', en: "Bhrh Sub Municipality", ar: "بلدية بحرة الفرعية", weight: 0.0625, dx: 0, dy: 20 },
        { key: 'makkah_alamrh_sub', en: "Al-Amrh Sub Municipality", ar: "بلدية العمرة الفرعية", weight: 0.0625, dx: -11, dy: 26 },
        { key: 'makkah_alshwqyh_sub', en: "Al-Shwqyh Sub Municipality", ar: "بلدية الشوقية الفرعية", weight: 0.0625, dx: -8, dy: 8 },
        { key: 'makkah_alasmh_almqdsh_amana', en: "Al-Asmh Al-Mqdsh Amana", ar: "أمانة العاصمة المقدسة", weight: 0.0625, dx: -18, dy: 8 },
        { key: 'makkah_alatybyh_sub', en: "Al-Atybyh Sub Municipality", ar: "بلدية العتيبية الفرعية", weight: 0.0625, dx: -28, dy: 0 },
        { key: 'makkah_almabdh_sub', en: "Al-Mabdh Sub Municipality", ar: "بلدية المعابدة الفرعية", weight: 0.0625, dx: -11, dy: -5 },
        { key: 'makkah_asfan_sub', en: "Asfan Sub Municipality", ar: "بلدية عسفان الفرعية", weight: 0.0625, dx: -14, dy: -14 },
        { key: 'makkah_south_makkah', en: "South Makkah Municipality", ar: "بلدية جنوب مكة", weight: 0.0625, dx: -11, dy: -26 },
        { key: 'makkah_almshar_almqdsh', en: "Al-Mshar Al-Mqdsh Municipality", ar: "بلدية المشاعر المقدسة", weight: 0.0625, dx: 0, dy: -12 },
        { key: 'makkah_mhafzh_aljmwm', en: "Mhafzh Al-Jmwm Municipality", ar: "بلدية محافظة الجموم", weight: 0.0625, dx: 8, dy: -18 },
        { key: 'makkah_mdrkh', en: "Mdrkh Municipality", ar: "بلدية مدركة", weight: 0.0625, dx: 20, dy: -20 },
        { key: 'makkah_alshraa_sub', en: "Al-Shra\u0626a Sub Municipality", ar: "بلدية الشرائع الفرعية", weight: 0.0625, dx: 11, dy: -5 },
    ],
    jeddah: [
        { key: 'jeddah_brnamj_mshrwa_jeddah_altarykhyh_amanh_mntqh_jeddah', en: "Brnamj Mshrwa Jeddah Al-Tarykhyh - Amanh Mntqh Jeddah Municipality", ar: "برنامج مشروع جدة التاريخية  - أمانة منطقة جدة", weight: 0.0333, dx: 12, dy: 0 },
        { key: 'jeddah_center_jeddah', en: "Center Jeddah Municipality", ar: "بلدية وسط جدة", weight: 0.0333, dx: 20, dy: 4 },
        { key: 'jeddah_rabgh', en: "Rabgh Municipality", ar: "بلدية رابغ", weight: 0.0333, dx: 26, dy: 11 },
        { key: 'jeddah_alqnfdhh', en: "Al-Qnfdhh Municipality", ar: "بلدية القنفذة", weight: 0.0333, dx: 10, dy: 7 },
        { key: 'jeddah_allyth', en: "Al-Lyth Municipality", ar: "بلدية الليث", weight: 0.0333, dx: 13, dy: 15 },
        { key: 'jeddah_sbt_aljarh', en: "Sbt Al-Jarh Municipality", ar: "بلدية سبت الجارة", weight: 0.0333, dx: 14, dy: 24 },
        { key: 'jeddah_mhafzh_jeddah_amana', en: "Mhafzh Jeddah Amana", ar: "أمانة محافظة جدة", weight: 0.0333, dx: 4, dy: 11 },
        { key: 'jeddah_adm', en: "Adm Municipality", ar: "بلدية أضم", weight: 0.0333, dx: 2, dy: 20 },
        { key: 'jeddah_khlys', en: "Khlys Municipality", ar: "بلدية خليص", weight: 0.0333, dx: -3, dy: 28 },
        { key: 'jeddah_almzylf', en: "Al-Mzylf Municipality", ar: "بلدية المظيلف", weight: 0.0333, dx: -4, dy: 11 },
        { key: 'jeddah_hly', en: "Hly Municipality", ar: "بلدية حلي", weight: 0.0333, dx: -10, dy: 17 },
        { key: 'jeddah_ghmyqh', en: "Ghmyqh Municipality", ar: "بلدية غميقة", weight: 0.0333, dx: -19, dy: 21 },
        { key: 'jeddah_hjr', en: "Hjr Municipality", ar: "بلدية حجر", weight: 0.0333, dx: -10, dy: 7 },
        { key: 'jeddah_alkaml', en: "Al-Kaml Municipality", ar: "بلدية الكامل", weight: 0.0333, dx: -18, dy: 8 },
        { key: 'jeddah_alardyh_alshmalyh', en: "Al-Ardyh Al-Shmalyh Municipality", ar: "بلدية العرضية الشمالية", weight: 0.0333, dx: -27, dy: 6 },
        { key: 'jeddah_alardyh_aljnwbyh', en: "Al-Ardyh Al-Jnwbyh Municipality", ar: "بلدية العرضية الجنوبية", weight: 0.0333, dx: -12, dy: 0 },
        { key: 'jeddah_alqwz', en: "Al-Qwz Municipality", ar: "بلدية القوز", weight: 0.0333, dx: -20, dy: -4 },
        { key: 'jeddah_abhr', en: "Abhr Municipality", ar: "بلدية أبحر", weight: 0.0333, dx: -26, dy: -11 },
        { key: 'jeddah_umm_alslm', en: "Umm Al-Slm Municipality", ar: "بلدية أم السلم", weight: 0.0333, dx: -10, dy: -7 },
        { key: 'jeddah_aljamah', en: "Al-Jamah Municipality", ar: "بلدية الجامعة", weight: 0.0333, dx: -13, dy: -15 },
        { key: 'jeddah_aljnwb', en: "Al-Jnwb Municipality", ar: "بلدية الجنوب", weight: 0.0333, dx: -14, dy: -24 },
        { key: 'jeddah_alazyzyh', en: "Al-Azyzyh Municipality", ar: "بلدية العزيزية", weight: 0.0333, dx: -4, dy: -11 },
        { key: 'jeddah_almtar', en: "Al-Mtar Municipality", ar: "بلدية المطار", weight: 0.0333, dx: -2, dy: -20 },
        { key: 'jeddah_bryman', en: "Bryman Municipality", ar: "بلدية بريمان", weight: 0.0333, dx: 3, dy: -28 },
        { key: 'jeddah_thwl', en: "Thwl Municipality", ar: "بلدية ثول", weight: 0.0333, dx: 4, dy: -11 },
        { key: 'jeddah_jeddah_altarykhyh', en: "Jeddah Al-Tarykhyh Municipality", ar: "بلدية جدة التاريخية", weight: 0.0333, dx: 10, dy: -17 },
        { key: 'jeddah_jeddah_new', en: "Jeddah New Municipality", ar: "بلدية جدة الجديدة", weight: 0.0333, dx: 19, dy: -21 },
        { key: 'jeddah_dhhban', en: "Dhhban Municipality", ar: "بلدية ذهبان", weight: 0.0333, dx: 10, dy: -7 },
        { key: 'jeddah_tybh', en: "Tybh Municipality", ar: "بلدية طيبة", weight: 0.0333, dx: 18, dy: -8 },
        { key: 'jeddah_alshwaq', en: "Al-Shwaq Municipality", ar: "بلدية الشواق", weight: 0.0333, dx: 27, dy: -6 },
    ],
    ahsa: [
        { key: 'ahsa_almbrz', en: "Al-Mbrz Municipality", ar: "بلدية المبرز", weight: 0.0769, dx: 12, dy: 0 },
        { key: 'ahsa_jwatha', en: "Jwatha Municipality", ar: "بلدية جواثى", weight: 0.0769, dx: 18, dy: 9 },
        { key: 'ahsa_aljfr', en: "Al-Jfr Municipality", ar: "بلدية الجفر", weight: 0.0769, dx: 16, dy: 23 },
        { key: 'ahsa_albtha', en: "Al-Btha Municipality", ar: "بلدية البطحاء", weight: 0.0769, dx: 1, dy: 12 },
        { key: 'ahsa_mntqh_al_ahsa_amana', en: "Mntqh Al Ahsa Amana", ar: "أمانة منطقة الاحساء", weight: 0.0769, dx: -7, dy: 19 },
        { key: 'ahsa_alamran', en: "Al-Amran Municipality", ar: "بلدية العمران", weight: 0.0769, dx: -21, dy: 19 },
        { key: 'ahsa_aryarh', en: "Aryarh Municipality", ar: "عريعرة", weight: 0.0769, dx: -12, dy: 3 },
        { key: 'ahsa_alaywn', en: "Al-Aywn Municipality", ar: "بلدية العيون", weight: 0.0769, dx: -19, dy: -5 },
        { key: 'ahsa_alhfwf', en: "Al-Hfwf Municipality", ar: "بلدية الهفوف", weight: 0.0769, dx: -21, dy: -19 },
        { key: 'ahsa_alghwar', en: "Al-Ghwar Municipality", ar: "بلدية الغوار", weight: 0.0769, dx: -4, dy: -11 },
        { key: 'ahsa_slwa', en: "Slwa Municipality", ar: "بلدية سلوى", weight: 0.0769, dx: 2, dy: -20 },
        { key: 'ahsa_ybryn', en: "Ybryn Municipality", ar: "بلدية يبرين", weight: 0.0769, dx: 16, dy: -23 },
        { key: 'ahsa_alaqyr', en: "Al-Aqyr Municipality", ar: "بلدية العقير", weight: 0.0769, dx: 11, dy: -6 },
    ],
    qassim: [
        { key: 'qassim_south_buraidah', en: "South Buraidah Municipality", ar: "بلدية جنوب بريدة", weight: 0.0294, dx: 12, dy: 0 },
        { key: 'qassim_west_buraidah', en: "West Buraidah Municipality", ar: "بلدية غرب بريدة", weight: 0.0294, dx: 20, dy: 4 },
        { key: 'qassim_alqwarh', en: "Al-Qwarh Municipality", ar: "بلدية القوارة", weight: 0.0294, dx: 26, dy: 10 },
        { key: 'qassim_abanat', en: "Abanat Municipality", ar: "بلدية ابانات", weight: 0.0294, dx: 10, dy: 6 },
        { key: 'qassim_shry', en: "Shry Municipality", ar: "بلدية شري", weight: 0.0294, dx: 15, dy: 13 },
        { key: 'qassim_alamar', en: "Al-Amar Municipality", ar: "بلدية العمار", weight: 0.0294, dx: 17, dy: 22 },
        { key: 'qassim_aqlh_alsqwr', en: "Aqlh Al-Sqwr Municipality", ar: "بلدية عقلة الصقور", weight: 0.0294, dx: 5, dy: 11 },
        { key: 'qassim_al_asyah', en: "Al Asyah Municipality", ar: "بلدية الأسياح", weight: 0.0294, dx: 5, dy: 19 },
        { key: 'qassim_qbh', en: "Qbh Municipality", ar: "بلدية قبة", weight: 0.0294, dx: 3, dy: 28 },
        { key: 'qassim_unaizah', en: "Unaizah Municipality", ar: "بلدية عنيزة", weight: 0.0294, dx: -1, dy: 12 },
        { key: 'qassim_dkhnh', en: "Dkhnh Municipality", ar: "بلدية دخنة", weight: 0.0294, dx: -5, dy: 19 },
        { key: 'qassim_albsr', en: "Al-Bsr Municipality", ar: "بلدية البصر", weight: 0.0294, dx: -12, dy: 25 },
        { key: 'qassim_aldlymyh', en: "Al-Dlymyh Municipality", ar: "بلدية الدليمية", weight: 0.0294, dx: -7, dy: 10 },
        { key: 'qassim_alfwylq', en: "Al-Fwylq Municipality", ar: "بلدية الفويلق", weight: 0.0294, dx: -15, dy: 13 },
        { key: 'qassim_aywn_aljwa', en: "Aywn Al-Jwa Municipality", ar: "بلدية عيون الجواء", weight: 0.0294, dx: -24, dy: 15 },
        { key: 'qassim_al_bukayriyah', en: "Al Bukayriyah Municipality", ar: "بلدية البكيرية", weight: 0.0294, dx: -11, dy: 4 },
        { key: 'qassim_al_mithnab', en: "Al Mithnab Municipality", ar: "بلدية المذنب", weight: 0.0294, dx: -20, dy: 4 },
        { key: 'qassim_al_badaya', en: "Al Badaya Municipality", ar: "بلدية البدائع", weight: 0.0294, dx: -28, dy: 0 },
        { key: 'qassim_qsr_bn_aqyl', en: "Qsr Bn Aqyl Municipality", ar: "بلدية قصر بن عقيل", weight: 0.0294, dx: -12, dy: -2 },
        { key: 'qassim_qsyba', en: "Qsyba Municipality", ar: "بلدية قصيباء", weight: 0.0294, dx: -19, dy: -7 },
        { key: 'qassim_alzahryh', en: "Al-Zahryh Municipality", ar: "بلدية الظاهرية", weight: 0.0294, dx: -24, dy: -15 },
        { key: 'qassim_mhafzh_al_shammasiyah', en: "Mhafzh Al Shammasiyah Municipality", ar: "بلدية محافظة الشماسية", weight: 0.0294, dx: -9, dy: -8 },
        { key: 'qassim_albtyn', en: "Al-Btyn Municipality", ar: "بلدية البطين", weight: 0.0294, dx: -12, dy: -16 },
        { key: 'qassim_mhafzh_al_nabhaniyah', en: "Mhafzh Al Nabhaniyah Municipality", ar: "بلدية محافظة النبهانية", weight: 0.0294, dx: -12, dy: -25 },
        { key: 'qassim_ar_rass', en: "Ar Rass Municipality", ar: "بلدية الرس", weight: 0.0294, dx: -3, dy: -12 },
        { key: 'qassim_mhafzh_dryh', en: "Mhafzh Dryh Municipality", ar: "بلدية محافظة ضرية", weight: 0.0294, dx: -2, dy: -20 },
        { key: 'qassim_ryad_alkhbra', en: "Ryad Al-Khbra Municipality", ar: "بلدية رياض الخبراء", weight: 0.0294, dx: 3, dy: -28 },
        { key: 'qassim_alfwarh', en: "Al-Fwarh Municipality", ar: "بلدية الفوارة", weight: 0.0294, dx: 3, dy: -12 },
        { key: 'qassim_alsfra_sub', en: "Al-Sfra Sub Municipality", ar: "بلدية الصفراء الفرعية", weight: 0.0294, dx: 9, dy: -18 },
        { key: 'qassim_east_buraidah', en: "East Buraidah Municipality", ar: "بلدية شرق بريدة", weight: 0.0294, dx: 17, dy: -22 },
        { key: 'qassim_aldyrh_sub', en: "Al-Dyrh Sub Municipality", ar: "بلدية الديرة الفرعية", weight: 0.0294, dx: 9, dy: -8 },
        { key: 'qassim_north_buraidah', en: "North Buraidah Municipality", ar: "بلدية شمال بريدة", weight: 0.0294, dx: 17, dy: -11 },
        { key: 'qassim_mntqh_alqsym_amana', en: "Mntqh Al-Qsym Amana", ar: "أمانة منطقة القصيم", weight: 0.0294, dx: 26, dy: -10 },
        { key: 'qassim_alkhbra', en: "Al-Khbra Municipality", ar: "بلدية الخبراء", weight: 0.0294, dx: 12, dy: -2 },
    ],
};

function buildMunicipalityRows() {
    const rows = [];
    const options = {};

    AMANA_MASTER.forEach((amana) => {
        const templates = MUNICIPALITY_TEMPLATES[amana.key] || [
            {
                key: `${amana.key}_center`,
                en: `${amana.en} Center`,
                ar: `${amana.ar} - المركز`,
                weight: 1,
                dx: 0,
                dy: 0,
            },
        ];

        options[amana.key] = templates.map((item) => ({
            value: item.key,
            en: item.en,
            ar: item.ar,
        }));

        templates.forEach((item) => {
            const revised = Number((amana.revised * item.weight).toFixed(1));
            const spent = Number((amana.spent * item.weight).toFixed(1));
            const original = Number((amana.original * item.weight).toFixed(1));
            const remaining = Number((amana.remaining * item.weight).toFixed(1));
            rows.push({
                key: item.key,
                amanaKey: amana.key,
                en: item.en,
                ar: item.ar,
                original,
                revised,
                spent,
                remaining,
                rate: revised ? (spent / revised) * 100 : 0,
                x: amana.x + item.dx,
                y: amana.y + item.dy,
                lng: amana.lng + item.dx * 0.012,
                lat: amana.lat + item.dy * 0.012,
                supplemented: true,
            });
        });
    });

    return { rows, options };
}

const { rows: MUNICIPALITY_ROWS, options: MUNICIPALITY_OPTIONS } = buildMunicipalityRows();

export const AMANA_OPTIONS = [
    { value: 'All', en: 'All Amanas', ar: 'جميع الأمانات' },
    ...AMANA_MASTER.map((item) => ({ value: item.key, en: item.en, ar: item.ar })),
];

export { MUNICIPALITY_OPTIONS };

export const DOOR_BASE = [
    { key: 'door_1', door: '1', en: 'Door 1 - Personnel', ar: 'الباب 1 - تعويضات العاملين', budget: 1138, planned: 1034, actual: 1000 },
    { key: 'door_2', door: '2', en: 'Door 2 - Operations', ar: 'الباب 2 - التشغيل والخدمات', budget: 4993, planned: 2850, actual: 2100 },
    { key: 'door_3', door: '3', en: 'Door 3 - Capital Projects', ar: 'الباب 3 - المشاريع الرأسمالية', budget: 1533, planned: 690, actual: 530 },
    { key: 'door_4', door: '4', en: 'Door 4 - Subsidies & Expropriation', ar: 'الباب 4 - الإعانات ونزع الملكية', budget: 1484, planned: 410, actual: 324 },
];

const SERVICE_BASE = [
    { key: 'Developmental_Housing', en: 'Developmental Housing', ar: 'الإسكان التنموي', budget: 26342, free: 845, count: 149, source: 'الإسكان التنموي' },
    { key: 'Real_Estate_Development', en: 'Real Estate Development', ar: 'التطوير العقاري', budget: 24787, free: 1164, count: 75, source: 'التطوير العقاري' },
    { key: 'Parks', en: 'Parks', ar: 'الحدائق', budget: 16001, free: 376, count: 7, source: 'الحدائق' },
    { key: 'Roads', en: 'Roads', ar: 'الطرق', budget: 15530, free: 731, count: 14, source: 'الطرق' },
    { key: 'Financial_Support', en: 'Financial Support', ar: 'الدعم المالي', budget: 15524, free: 758, count: 11, source: 'الدعم المالي' },
    { key: 'Buildings_and_Facilities', en: 'Buildings and Facilities', ar: 'المباني والمرافق', budget: 11264, free: 754, count: 74, source: 'التكاليف الحرة - خدمة فرعية' },
];

export const INITIATIVE_PROJECTS_BASE = [
    { key: 'housing_program_2', en: 'Housing Program 2.0', ar: 'برنامج الإسكان التنموي 2.0', portfolioEn: 'Housing & Urban Development', portfolioAr: 'محفظة الإسكان والتطوير العمراني', door: '4', initiativeFlag: 'مبادرات', budget: 14443, actual: 14422, remaining: 21, ended: 11245, ongoing: 3177, sourceTable: 'التكاليف الحرة - Sheet1 (2)' },
    { key: 'supported_housing', en: 'Supported Housing Financial Scheme 2.0', ar: 'الدعم المالي لمستحقي الدعم السكني - مدعوم 2.0', portfolioEn: 'Housing Support', portfolioAr: 'محفظة الدعم السكني', door: '3', initiativeFlag: 'مبادرات', budget: 14247, actual: 14247, remaining: 0, ended: 0, ongoing: 14247, sourceTable: 'التكاليف الحرة - Sheet1' },
    { key: 'flood_phase_1', en: 'Flood Risk Mitigation - Phase 1', ar: 'تصريف مياه الامطار ودرء اخطار السيول المرحلة الأولى', portfolioEn: 'Water & Drainage', portfolioAr: 'محفظة المياه والصرف', door: '4', initiativeFlag: 'مبادرات', budget: 9379, actual: 9247, remaining: 132, ended: 3490, ongoing: 5757, sourceTable: 'التكاليف الحرة - Sheet1 (2)' },
    { key: 'urban_roads_phase_1', en: 'Urban Roads Development - Phase 1', ar: 'إنشاء وتطوير شبكة الطرق الحضرية المرحلة الأولى', portfolioEn: 'Roads & Mobility', portfolioAr: 'محفظة الطرق والتنقل', door: '4', initiativeFlag: 'مبادرات', budget: 6117, actual: 6034, remaining: 83, ended: 2283, ongoing: 3751, sourceTable: 'التكاليف الحرة - Sheet1 (2)' },
    { key: 'land_expropriation', en: 'Land Expropriation', ar: 'نزع الملكيات', portfolioEn: 'Land & Assets', portfolioAr: 'محفظة الأراضي والأصول', door: '4', initiativeFlag: 'غير مبادرات', budget: 5755, actual: 4856, remaining: 899, ended: 2577, ongoing: 2279, sourceTable: 'التكاليف الحرة - Sheet1 (2)' },
    { key: 'riyadh_road_safety', en: 'Riyadh Road Rehabilitation & Safety', ar: 'إعادة تأهيل وصيانة الطرق بمدينة الرياض ورفع السلامة المرورية', portfolioEn: 'Roads & Mobility', portfolioAr: 'محفظة الطرق والتنقل', door: '3', initiativeFlag: 'غير مبادرات', budget: 5423, actual: 5329, remaining: 94, ended: 1691, ongoing: 3638, sourceTable: 'التكاليف الحرة - Sheet1' },
];

const CONTRACT_STATUS_BASE = [
    { key: 'approved', en: 'Approved', ar: 'معتمد', count: 14356 },
    { key: 'cancelled', en: 'Cancelled', ar: 'ملغي', count: 2557 },
    { key: 'returned', en: 'Returned for Edit', ar: 'معاد للتعديل', count: 391 },
    { key: 'terminated', en: 'Terminated', ar: 'فسخ', count: 212 },
    { key: 'closed', en: 'Closed', ar: 'مغلق', count: 129 },
    { key: 'in_progress', en: 'Under Process', ar: 'تحت الإجراء', count: 90 },
];

const CONTRACT_TOP_PROJECTS = [
    { en: 'Housing Program 2.0', ar: 'برنامج الإسكان التنموي 2.0', amount: 27399.6 },
    { en: 'Flood Risk Mitigation', ar: 'تصريف مياه الأمطار ودرء أخطار السيول', amount: 10840.4 },
    { en: 'Urban Roads Development', ar: '"346" إنشاء وتطوير شبكة الطرق الحضرية', amount: 7460.9 },
    { en: 'Riyadh Road Safety Rehabilitation', ar: 'إعادة تأهيل وصيانة الطرق بمدينة الرياض ورفع السلامة المرورية', amount: 6567.8 },
    { en: 'Riyadh Waste Operations', ar: 'نظافة مدينة الرياض وتشغيل مرمى النفايات', amount: 5533.9 },
];

const REVENUE_SOURCE_SUPPLEMENTED = [
    { key: 'white_lands', en: 'White Lands Fees', ar: 'رسوم الأراضي البيضاء', target: 2450, netInvoiced: 2180, collected: 1895, yoy: 9.4 },
    { key: 'tobacco', en: 'Tobacco Revenue', ar: 'إيرادات التبغ', target: 1120, netInvoiced: 980, collected: 860, yoy: 13.2 },
    { key: 'accommodation', en: 'Accommodation Revenue', ar: 'إيرادات السكن', target: 1580, netInvoiced: 1490, collected: 1280, yoy: 7.5 },
    { key: 'penalties', en: 'Penalties & Fines', ar: 'الغرامات والمخالفات', target: 1380, netInvoiced: 1325, collected: 1010, yoy: 5.1 },
    { key: 'other_sources', en: 'Other Municipal Revenues', ar: 'إيرادات بلدية أخرى', target: 980, netInvoiced: 870, collected: 620, yoy: 3.8 },
];

function getRevenueAmanaSupplemented(fiscalYear) {
    const factor = fiscalYear === 'FY2025' ? 0.88 : 1.0;
    const spentFactor = fiscalYear === 'FY2025' ? 0.84 : 1.0;
    return AMANA_MASTER.map((item, index) => {
        const revised = Number((item.revised * factor).toFixed(1));
        const spent = Number((item.spent * spentFactor).toFixed(1));
        const baseSpendRate = revised ? (spent / revised) * 100 : 0;
        const targetRate = 82 + (index % 4) * 4;
        const actualRate = Math.max(62, Math.min(103, baseSpendRate * 0.72 + 28));
        const invoiceBase = Number((revised * 0.42).toFixed(1));
        const collected = Number((invoiceBase * (actualRate / 100)).toFixed(1));
        return {
            key: item.key,
            en: item.en,
            ar: item.ar,
            annualTarget: Number((revised * 0.48).toFixed(1)),
            netInvoiced: invoiceBase,
            collected,
            actualRate,
            targetRate,
            collectionGap: Number((targetRate - actualRate).toFixed(1)),
            supplemented: true,
            x: item.x,
            y: item.y,
            lng: item.lng,
            lat: item.lat,
        };
    });
}

const REVENUE_RECEIVABLES_SUPPLEMENTED = [
    { key: 'unpaid', en: 'Unpaid Receivables', ar: 'ذمم غير محصلة', amount: 1260 },
    { key: 'executable', en: 'Executable Receivables', ar: 'ذمم قابلة للتنفيذ', amount: 790 },
    { key: 'executed', en: 'Executed Collections', ar: 'ذمم تم تنفيذها', amount: 540 },
];

const SAMPLE_NOTES = [
    {
        key: 'amana_actual',
        actual: true,
        en: 'Amana budget totals are taken from the sample sheet "أمانات_ترتيب" in the April 2026 budget workbook.',
        ar: 'إجماليات الأمانات مأخوذة من ورقة "أمانات_ترتيب" في ملف منصرف الميزانية لشهر أبريل 2026.',
    },
    {
        key: 'door_actual',
        actual: true,
        en: 'Budget-door totals are aligned to Material B page 4 / page 5 sample report visuals.',
        ar: 'إجماليات الأبواب المالية متوافقة مع ما ظهر في المادة B الصفحة 4 والصفحة 5.',
    },
    {
        key: 'municipality_supplemented',
        actual: false,
        en: 'Municipality breakdowns are supplemented for demo drill-down because the sample package does not provide a clean municipality summary for every amana.',
        ar: 'تفصيل البلديات تم استكماله لأغراض العرض لأن الحزمة الحالية لا توفر ملخصاً نظيفاً لكل بلدية تحت كل أمانة.',
    },
    {
        key: 'time_supplemented',
        actual: false,
        en: 'Monthly series before April 2026 are supplemented to demonstrate trend charts while preserving the April 2026 source values.',
        ar: 'السلسلة الشهرية قبل أبريل 2026 تم استكمالها لعرض الاتجاهات مع الحفاظ على قيم أبريل 2026 المصدرية.',
    },
    {
        key: 'g06_supplemented',
        actual: false,
        en: 'Group 06 revenue rows are supplemented from Materials B pages 12, 13, 14, 16, and 18 because no fully structured revenue workbook was provided.',
        ar: 'بيانات الإيرادات الخاصة بالمجموعة 06 تم استكمالها اعتماداً على المادة B الصفحات 12 و13 و14 و16 و18 لعدم توفر ملف إيرادات منظم بالكامل.',
    },
];

const GROUP_CONFIGS = {
    g02: {
        key: 'g02',
        title: { en: 'Planning & Financial Performance', ar: 'التخطيط والأداء المالي' },
        subtitle: {
            en: 'Focuses on financial performance, regional gaps, service concentration, and initiative structure.',
            ar: 'يركز على الأداء المالي والفجوات المكانية وتركيز الخدمات وبنية المبادرات.',
        },
        allowedReportTypes: ['Executive', 'Initiatives', 'Services', 'Doors'],
        detailRows: [['doorsDetailed'], ['services', 'initiatives']],
        dashboardTableKey: 'regional',
    },
    g03: {
        key: 'g03',
        title: { en: 'Budget Execution & Disbursement Monitoring', ar: 'تنفيذ الميزانية ومراقبة الصرف' },
        subtitle: {
            en: 'Focuses on execution pace, plan variance, budget doors, and contract-linked delivery pressure.',
            ar: 'يركز على وتيرة التنفيذ والانحراف عن الخطة والأبواب المالية وضغط التنفيذ المرتبط بالعقود.',
        },
        allowedReportTypes: ['Disbursement', 'Doors', 'Services', 'Executive'],
        detailRows: [['doors', 'contracts'], ['services', 'initiatives']],
        dashboardTableKey: 'variance',
    },
    g06: {
        key: 'g06',
        title: { en: 'Revenue & Collection View', ar: 'منظور الإيرادات والتحصيل' },
        subtitle: {
            en: 'Focuses on revenue target achievement, source mix, receivable progression, and regional collection performance.',
            ar: 'يركز على تحقيق الإيرادات ومزيج المصادر وتقدم الذمم وأداء التحصيل إقليمياً.',
        },
        allowedReportTypes: ['Executive'],
        detailRows: [['revenueSources', 'collectionRate'], ['receivables', 'regionalCollection']],
        dashboardTableKey: 'revenue',
    },
};

export function formatMoney(value, lang) {
    if (value >= 1000) {
        return lang === 'ar' ? `${value.toFixed(0)} مليون ريال` : `${value.toFixed(0)} M SAR`;
    }
    return lang === 'ar' ? `${value.toFixed(0)} مليون ريال` : `${value.toFixed(0)} M SAR`;
}

export function formatPercent(value) {
    if (value === undefined || value === null || isNaN(value)) {
        return '0.0%';
    }
    return `${value.toFixed(1)}%`;
}

function getKpiStatus(value, green, yellow) {
    if (value >= green) return 'nominal';
    if (value >= yellow) return 'warning';
    return 'danger';
}

function getMapStatusByThreshold(value, green, yellow) {
    if (value >= green) return 'good';
    if (value >= yellow) return 'warning';
    return 'critical';
}

function normalizeMulti(values) {
    if (!Array.isArray(values) || values.length === 0 || values.includes('All')) {
        return ['All'];
    }
    return values;
}

function resolveAmanas(selectedAmanas) {
    const normalized = normalizeMulti(selectedAmanas);
    if (normalized.includes('All')) {
        return AMANA_MASTER.map((item) => item.key);
    }
    return normalized.map(val => {
        if (!val) return '';
        const lowerVal = val.toLowerCase();
        const found = AMANA_MASTER.find(item => 
            lowerVal.includes(item.key.toLowerCase()) || item.key.toLowerCase().includes(lowerVal)
        );
        return found ? found.key : val;
    }).filter(v => v);
}

function resolveMunicipalities(selectedMunicipalities) {
    return normalizeMulti(selectedMunicipalities);
}

function getAmanaRows(selectedAmanas, fiscalYear, lang) {
    const keys = resolveAmanas(selectedAmanas);
    const factor = fiscalYear === 'FY2025' ? 0.88 : 1.0;
    const spentFactor = fiscalYear === 'FY2025' ? 0.84 : 1.0;
    return AMANA_MASTER.filter((item) => keys.includes(item.key)).map((item) => {
        const original = Number((item.original * factor).toFixed(1));
        const revised = Number((item.revised * factor).toFixed(1));
        const spent = Number((item.spent * spentFactor).toFixed(1));
        const remaining = Number((revised - spent).toFixed(1));
        return {
            ...item,
            original,
            revised,
            spent,
            remaining,
            label: item[lang],
            rate: revised ? (spent / revised) * 100 : 0,
            adjustedRate: revised ? ((spent - revised * 0.045) / revised) * 100 : 0,
            planned: Number((revised * 0.92).toFixed(1)),
        };
    });
}

function getMunicipalityRows(selectedAmanas, selectedMunicipalities, fiscalYear, lang) {
    const amanaKeys = resolveAmanas(selectedAmanas);
    const municipalityKeys = resolveMunicipalities(selectedMunicipalities);
    const factor = fiscalYear === 'FY2025' ? 0.88 : 1.0;
    const spentFactor = fiscalYear === 'FY2025' ? 0.84 : 1.0;
    let rows = MUNICIPALITY_ROWS.filter((item) => amanaKeys.includes(item.amanaKey));
    if (!municipalityKeys.includes('All')) {
        rows = rows.filter((item) => municipalityKeys.includes(item.key));
    }
    return rows.map((item) => {
        const original = Number((item.original * factor).toFixed(1));
        const revised = Number((item.revised * factor).toFixed(1));
        const spent = Number((item.spent * spentFactor).toFixed(1));
        const remaining = Number((revised - spent).toFixed(1));
        return {
            ...item,
            original,
            revised,
            spent,
            remaining,
            label: item[lang],
            planned: Number((revised * 0.92).toFixed(1)),
        };
    });
}

function sumBudgetMetrics(rows) {
    return rows.reduce(
        (acc, row) => ({
            original: acc.original + row.original,
            revised: acc.revised + row.revised,
            spent: acc.spent + row.spent,
            remaining: acc.remaining + row.remaining,
            planned: acc.planned + (row.planned || 0),
        }),
        { original: 0, revised: 0, spent: 0, remaining: 0, planned: 0 }
    );
}

function getScopeRows(filters, lang) {
    const amanaRows = getAmanaRows(filters.selectedAmanas, filters.fiscalYear, lang);
    const municipalityRows = getMunicipalityRows(filters.selectedAmanas, filters.selectedMunicipalities, filters.fiscalYear, lang);
    const useMunicipalityRows =
        filters.analysisLevel === 'Municipality' || !resolveMunicipalities(filters.selectedMunicipalities).includes('All');
    const entityRows = useMunicipalityRows && municipalityRows.length ? municipalityRows : amanaRows;
    return { amanaRows, municipalityRows, entityRows };
}

function scaleValue(base, factor) {
    return Number((base * factor).toFixed(1));
}

function buildBudgetDoors(metrics, lang) {
    const nationalRevised = AMANA_MASTER.reduce((sum, item) => sum + item.revised, 0);
    const factor = nationalRevised ? metrics.revised / nationalRevised : 1;
    return DOOR_BASE.map((row) => {
        const budget = scaleValue(row.budget, factor);
        const planned = scaleValue(row.planned, factor);
        const actual = scaleValue(row.actual, factor);
        const remaining = Number((budget - actual).toFixed(1));
        return {
            ...row,
            label: row[lang],
            budget,
            planned,
            actual,
            remaining,
            rate: budget ? (actual / budget) * 100 : 0,
            variance: Number((actual - planned).toFixed(1)),
            sourceTable: 'عرض مجلس القطاع.pdf - p4/p5',
            supplemented: false,
        };
    });
}

function buildServices(metrics, lang) {
    const totalBudget = SERVICE_BASE.reduce((sum, row) => sum + row.budget, 0);
    const factor = totalBudget ? metrics.revised / totalBudget : 1;
    return SERVICE_BASE.map((row) => {
        const budget = scaleValue(row.budget, factor);
        const remaining = scaleValue(row.free, factor);
        const actual = Number((budget - remaining).toFixed(1));
        return {
            ...row,
            label: row[lang],
            revised: budget,
            spent: actual,
            remaining,
            rate: budget ? (actual / budget) * 100 : 0,
        };
    });
}

function buildInitiatives(metrics, lang) {
    const totalBudget = INITIATIVE_PROJECTS_BASE.reduce((sum, row) => sum + row.budget, 0);
    const factor = totalBudget ? metrics.revised / totalBudget : 1;
    return INITIATIVE_PROJECTS_BASE.map((row) => {
        const budget = scaleValue(row.budget, factor);
        const actual = scaleValue(row.actual, factor);
        const remaining = scaleValue(row.remaining, factor);
        const ended = scaleValue(row.ended, factor);
        const ongoing = scaleValue(row.ongoing, factor);
        return {
            ...row,
            label: row[lang],
            initiative: row[lang],
            portfolio: lang === 'ar' ? row.portfolioAr : row.portfolioEn,
            budgetValue: budget,
            actualValue: actual,
            remainingValue: remaining,
            endedValue: ended,
            ongoingValue: ongoing,
            budget: formatMoney(budget, lang),
            actual: formatMoney(actual, lang),
            remaining: formatMoney(remaining, lang),
            rate: formatPercent(budget ? (actual / budget) * 100 : 0),
        };
    });
}

function buildContractStatus(metrics, lang) {
    const nationalRevised = AMANA_MASTER.reduce((sum, item) => sum + item.revised, 0);
    const factor = nationalRevised ? metrics.revised / nationalRevised : 1;
    const total = CONTRACT_STATUS_BASE.reduce((sum, item) => sum + item.count, 0);
    return CONTRACT_STATUS_BASE.map((item) => {
        const count = Math.max(1, Math.round(item.count * factor));
        return {
            ...item,
            label: item[lang],
            count,
            share: total ? (item.count / total) * 100 : 0,
            sourceTable: 'تقرير العقود_أبريل 2026م 2.xlsb / ALL',
            supplemented: false,
        };
    });
}

function buildRevenueSources(metrics, lang) {
    const totalNetInvoiced = REVENUE_SOURCE_SUPPLEMENTED.reduce((sum, item) => sum + item.netInvoiced, 0);
    const factor = totalNetInvoiced ? metrics.netInvoiced / totalNetInvoiced : 1;
    const totalTarget = REVENUE_SOURCE_SUPPLEMENTED.reduce((sum, item) => sum + item.target, 0);
    return REVENUE_SOURCE_SUPPLEMENTED.map((item) => {
        const target = scaleValue(item.target, factor);
        const netInvoiced = scaleValue(item.netInvoiced, factor);
        const collected = scaleValue(item.collected, factor);
        return {
            ...item,
            label: item[lang],
            target,
            netInvoiced,
            collected,
            collectionRate: netInvoiced ? (collected / netInvoiced) * 100 : 0,
            sourceWeight: totalTarget ? (item.target / totalTarget) * 100 : 0,
            supplemented: true,
            sourceTable: 'عرض مجلس القطاع.pdf - p12/p13/p14',
        };
    });
}

function buildRevenueRegionalRows(selectedAmanas, fiscalYear, lang) {
    const keys = resolveAmanas(selectedAmanas);
    const revenueAmanaData = getRevenueAmanaSupplemented(fiscalYear);
    return revenueAmanaData.filter((item) => keys.includes(item.key)).map((item) => ({
        ...item,
        label: item[lang],
    }));
}

function buildScopeMetrics(groupContext, scopeRows, fiscalYear) {
    if (groupContext === 'g06') {
        const revenueRows = buildRevenueRegionalRows(scopeRows.amanaRows.map((row) => row.key), fiscalYear, 'en');
        const annualTarget = revenueRows.reduce((sum, row) => sum + row.annualTarget, 0);
        const netInvoiced = revenueRows.reduce((sum, row) => sum + row.netInvoiced, 0);
        const collected = revenueRows.reduce((sum, row) => sum + row.collected, 0);
        const targetRate = revenueRows.length
            ? revenueRows.reduce((sum, row) => sum + row.targetRate, 0) / revenueRows.length
            : 0;
        const actualRate = netInvoiced ? (collected / netInvoiced) * 100 : 0;
        return {
            annualTarget,
            netInvoiced,
            totalInvoiced: Number((netInvoiced * 1.11).toFixed(1)),
            collected,
            targetRate,
            actualRate,
            unpaid: Number((netInvoiced - collected).toFixed(1)),
        };
    }
    const metrics = sumBudgetMetrics(scopeRows.entityRows);
    return {
        ...metrics,
        rate: metrics.revised ? (metrics.spent / metrics.revised) * 100 : 0,
        adjustedRate: metrics.revised ? ((metrics.spent - metrics.revised * 0.045) / metrics.revised) * 100 : 0,
        budgetAdjustment: Number((metrics.revised - metrics.original).toFixed(1)),
        planVariance: Number((metrics.spent - metrics.planned).toFixed(1)),
        executionVsPlan: metrics.planned ? (metrics.spent / metrics.planned) * 100 : 0,
        budgetVsRevenue: 3420,
    };
}

function buildKpis(groupContext, metrics, lang) {
    if (groupContext === 'g06') {
        return [
            {
                key: 'annualTarget',
                name: lang === 'ar' ? 'المستهدف السنوي للإيرادات' : 'Annual Revenue Target',
                value: formatMoney(metrics.annualTarget, lang),
                status: 'neutral',
                desc: lang === 'ar' ? 'مستخرج ومكمل من مواد العينة الخاصة بالإيرادات.' : 'Derived and supplemented from the sample revenue materials.',
            },
            {
                key: 'netInvoiced',
                name: lang === 'ar' ? 'صافي الفوترة' : 'Net Invoiced',
                value: formatMoney(metrics.netInvoiced, lang),
                status: 'nominal',
                desc: lang === 'ar' ? 'قيمة الفواتير القابلة للتحصيل بعد الاستبعادات.' : 'Invoice base used for collection analysis.',
            },
            {
                key: 'collected',
                name: lang === 'ar' ? 'المبلغ المحصل' : 'Collected Amount',
                value: formatMoney(metrics.collected, lang),
                status: getKpiStatus(metrics.actualRate, 90, 75),
                desc: lang === 'ar' ? 'الإيراد المتحقق حتى الفترة المحددة.' : 'Collected revenue through the selected period.',
            },
            {
                key: 'collectionRate',
                name: lang === 'ar' ? 'نسبة التحصيل' : 'Collection Rate',
                value: formatPercent(metrics.actualRate),
                status: getKpiStatus(metrics.actualRate, 90, 75),
                desc: lang === 'ar' ? 'المتحصل مقابل صافي الفوترة.' : 'Collected amount divided by net invoiced.',
            },
            {
                key: 'targetCollectionRate',
                name: lang === 'ar' ? 'النسبة المستهدفة للتحصيل' : 'Target Collection Rate',
                value: formatPercent(metrics.targetRate),
                status: 'neutral',
                desc: lang === 'ar' ? 'مستوى التحصيل المستهدف حسب مواد العينة.' : 'Target rate reconstructed from the sample board materials.',
            },
            {
                key: 'unpaid',
                name: lang === 'ar' ? 'ذمم غير محصلة' : 'Unpaid Receivables',
                value: formatMoney(metrics.unpaid, lang),
                status: metrics.unpaid > metrics.collected ? 'warning' : 'neutral',
                desc: lang === 'ar' ? 'الجزء غير المحصل بعد ضمن الرصيد الجاري.' : 'Outstanding balance still pending collection.',
            },
        ];
    }

    if (groupContext === 'g03') {
        return [
            {
                key: 'currentBudget',
                name: lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget',
                value: formatMoney(metrics.revised, lang),
                status: 'neutral',
                desc: lang === 'ar' ? 'إجمالي الاعتماد بعد التعديل.' : 'Current approved budget after adjustments.',
            },
            {
                key: 'plannedSpend',
                name: lang === 'ar' ? 'الخطة المستهدفة للصرف' : 'Planned Spend',
                value: formatMoney(metrics.planned, lang),
                status: 'nominal',
                desc: lang === 'ar' ? 'قيمة مخططة مكملة لأغراض مقارنة التنفيذ.' : 'Supplemented plan baseline for execution comparison.',
            },
            {
                key: 'actualSpend',
                name: lang === 'ar' ? 'المنصرف الفعلي' : 'Actual Spend',
                value: formatMoney(metrics.spent, lang),
                status: getKpiStatus(metrics.rate, 70, 50),
                desc: lang === 'ar' ? 'المنصرف الفعلي ضمن النطاق المختار.' : 'Actual spend in the selected scope.',
            },
            {
                key: 'planVariance',
                name: lang === 'ar' ? 'الانحراف عن الخطة' : 'Plan Variance',
                value: formatMoney(metrics.planVariance, lang),
                status: metrics.executionVsPlan >= 90 && metrics.executionVsPlan <= 110 ? 'nominal' : 'warning',
                desc: lang === 'ar' ? 'الفرق بين الخطة المستهدفة والمنصرف الفعلي.' : 'Difference between supplemented plan and actual spend.',
            },
            {
                key: 'remaining',
                name: lang === 'ar' ? 'الرصيد المتبقي' : 'Remaining Balance',
                value: formatMoney(metrics.remaining, lang),
                status: metrics.remaining > metrics.spent ? 'warning' : 'neutral',
                desc: lang === 'ar' ? 'الرصيد المتبقي الذي قد يكوّن ضغط تنفيذ لاحق.' : 'Remaining budget that may create execution pressure.',
            },
            {
                key: 'rate',
                name: lang === 'ar' ? 'نسبة الصرف' : 'Spending Rate',
                value: formatPercent(metrics.rate),
                status: getKpiStatus(metrics.rate, 70, 50),
                desc: lang === 'ar' ? 'المنصرف الفعلي مقابل الاعتماد الحالي.' : 'Actual spend divided by current budget.',
            },
        ];
    }

    return [
        {
            key: 'original',
            name: lang === 'ar' ? 'الاعتماد الأصلي' : 'Original Budget',
            value: formatMoney(metrics.original, lang),
            status: 'neutral',
            desc: lang === 'ar' ? 'الميزانية الأساسية قبل التعديل.' : 'Original budget before adjustments.',
        },
        {
            key: 'budgetVsRevenue',
            name: lang === 'ar' ? 'الاعتماد مقابل الإيراد' : 'Budget vs Revenue',
            value: formatMoney(metrics.budgetVsRevenue, lang),
            status: 'neutral',
            desc: lang === 'ar' ? 'الاعتماد مقابل الإيراد المحقق.' : 'Approved budget against realized revenue.',
        },
        {
            key: 'currentBudget',
            name: lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget',
            value: formatMoney(metrics.revised, lang),
            status: 'nominal',
            desc: lang === 'ar' ? 'الاعتماد بعد التعديل ضمن النطاق الحالي.' : 'Current approved budget in the selected scope.',
        },
        {
            key: 'actualSpend',
            name: lang === 'ar' ? 'المنصرف الفعلي' : 'Actual Spend',
            value: formatMoney(metrics.spent, lang),
            status: getKpiStatus(metrics.rate, 75, 50),
            desc: lang === 'ar' ? 'المنصرف الفعلي في الفترة المختارة.' : 'Actual spend for the selected period.',
        },
        {
            key: 'remaining',
            name: lang === 'ar' ? 'المتبقي' : 'Remaining Balance',
            value: formatMoney(metrics.remaining, lang),
            status: metrics.remaining > metrics.spent ? 'warning' : 'neutral',
            desc: lang === 'ar' ? 'الرصيد غير المصروف من الاعتماد الحالي.' : 'Unspent balance from the current budget.',
        },
        {
            key: 'rate',
            name: lang === 'ar' ? 'نسبة الصرف' : 'Spending Rate',
            value: formatPercent(metrics.rate),
            status: getKpiStatus(metrics.rate, 75, 50),
            desc: lang === 'ar' ? 'المنصرف الفعلي مقابل الاعتماد الحالي.' : 'Actual spend divided by current budget.',
        },
        {
            key: 'adjustment',
            name: lang === 'ar' ? 'التعزيز / التخفيض' : 'Increases / Decreases',
            value: formatMoney(metrics.budgetAdjustment, lang),
            status: 'neutral',
            desc: lang === 'ar' ? 'الفرق بين الاعتماد الأصلي والحالي.' : 'Difference between current and original budget.',
        },
    ];
}

function buildScopeLabel(filters, lang) {
    const periodLookup = {
        '2026-01': { en: 'Jan 2026', ar: 'يناير 2026' },
        '2026-02': { en: 'Feb 2026', ar: 'فبراير 2026' },
        '2026-03': { en: 'Mar 2026', ar: 'مارس 2026' },
        '2026-04': { en: 'Apr 2026', ar: 'أبريل 2026' },
        '2026-Q1': { en: 'Q1 2026', ar: 'الربع الأول 2026' },
        '2026-Q2': { en: 'Q2 2026', ar: 'الربع الثاني 2026' },
        '2026-FY': { en: 'FY2026', ar: 'السنة المالية 2026' },
        '2025-09': { en: 'Sep 2025', ar: 'سبتمبر 2025' },
        '2025-10': { en: 'Oct 2025', ar: 'أكتوبر 2025' },
        '2025-11': { en: 'Nov 2025', ar: 'نوفمبر 2025' },
        '2025-12': { en: 'Dec 2025', ar: 'ديسمبر 2025' },
        '2025-Q3': { en: 'Q3 2025', ar: 'الربع الثالث 2025' },
        '2025-Q4': { en: 'Q4 2025', ar: 'الربع الرابع 2025' },
        '2025-FY': { en: 'FY2025', ar: 'السنة المالية 2025' },
    };
    const label = periodLookup[filters.specificPeriod]?.[lang] || filters.specificPeriod;
    return lang === 'ar'
        ? `${filters.analysisLevel} / ${label}`
        : `${filters.analysisLevel} / ${label}`;
}

function buildInsights(groupContext, scopeRows, metrics, lang) {
    const entities = scopeRows.entityRows;
    const top = [...entities].sort((a, b) => b.rate - a.rate)[0];
    const low = [...entities].sort((a, b) => a.rate - b.rate)[0];
    const topDoor = [...buildBudgetDoors(metrics, lang)].sort((a, b) => b.rate - a.rate)[0];
    const weakDoor = [...buildBudgetDoors(metrics, lang)].sort((a, b) => a.rate - b.rate)[0];
    const topService = [...buildServices(metrics, lang)].sort((a, b) => b.spent - a.spent)[0];
    const topInitiative = [...buildInitiatives(metrics, lang)].sort((a, b) => b.actualValue - a.actualValue)[0];
    const topRevenue = [...buildRevenueSources(lang)].sort((a, b) => b.collectionRate - a.collectionRate)[0];

    if (groupContext === 'g06') {
        return {
            brief: lang === 'ar'
                ? `التحصيل الأقوى حالياً يأتي من ${topRevenue?.label}، بينما يستحق ${low?.label || 'أضعف نطاق'} متابعة أقرب في تحقيق المستهدف الإقليمي.`
                : `${topRevenue?.label} currently shows the strongest collection performance, while ${low?.label || 'the weakest scope'} needs closer follow-up against the regional target.`,
            highlights: [
                {
                    key: 'collection',
                    title: lang === 'ar' ? 'تحصيل' : 'Collection',
                    items: [
                        lang === 'ar'
                            ? `أعلى مصدر تحصيل: ${topRevenue?.label}`
                            : `Top collection source: ${topRevenue?.label}`,
                        lang === 'ar'
                            ? `صافي الفوترة الحالي ${formatMoney(metrics.netInvoiced, lang)}`
                            : `Current net invoiced amount is ${formatMoney(metrics.netInvoiced, lang)}`,
                    ],
                },
                {
                    key: 'gap',
                    title: lang === 'ar' ? 'فجوة المستهدف' : 'Target Gap',
                    items: [
                        lang === 'ar'
                            ? `النسبة الفعلية ${formatPercent(metrics.actualRate)} مقابل المستهدف ${formatPercent(metrics.targetRate)}`
                            : `Actual rate ${formatPercent(metrics.actualRate)} versus target ${formatPercent(metrics.targetRate)}`,
                        lang === 'ar'
                            ? `الرصيد غير المحصل ${formatMoney(metrics.unpaid, lang)}`
                            : `Outstanding unpaid balance is ${formatMoney(metrics.unpaid, lang)}`,
                    ],
                },
                {
                    key: 'portfolio',
                    title: lang === 'ar' ? 'متابعة الذمم' : 'Receivables',
                    items: [
                        lang === 'ar'
                            ? 'تعتمد هذه الصفحة على بيانات إيرادات مستكملة من مواد العينة.'
                            : 'This page uses supplemented revenue rows reconstructed from the sample materials.',
                    ],
                },
            ],
        };
    }

    if (groupContext === 'g03') {
        return {
            brief: lang === 'ar'
                ? `${top?.label || 'النطاق الأعلى'} يقود التنفيذ حالياً، بينما يحتاج ${low?.label || 'النطاق الأدنى'} إلى متابعة أوضح، ويظهر ${weakDoor?.label} كأبرز مصدر ضغط في التنفيذ.`
                : `${top?.label || 'The strongest scope'} currently leads execution, ${low?.label || 'the weakest scope'} requires tighter follow-up, and ${weakDoor?.label} remains the clearest execution pressure point.`,
            highlights: [
                {
                    key: 'execution',
                    title: lang === 'ar' ? 'التنفيذ' : 'Execution',
                    items: [
                        lang === 'ar'
                            ? `أفضل جهة: ${top?.label}`
                            : `Leading scope: ${top?.label}`,
                        lang === 'ar'
                            ? `أدنى جهة: ${low?.label}`
                            : `Lowest scope: ${low?.label}`,
                    ],
                },
                {
                    key: 'variance',
                    title: lang === 'ar' ? 'الخطة مقابل الواقع' : 'Plan vs Actual',
                    items: [
                        lang === 'ar'
                            ? `الانحراف الكلي: ${formatMoney(metrics.planVariance, lang)}`
                            : `Total plan variance: ${formatMoney(metrics.planVariance, lang)}`,
                        lang === 'ar'
                            ? `نسبة التنفيذ مقابل الخطة: ${formatPercent(metrics.executionVsPlan)}`
                            : `Execution versus plan ratio: ${formatPercent(metrics.executionVsPlan)}`,
                    ],
                },
                {
                    key: 'doors',
                    title: lang === 'ar' ? 'الأبواب' : 'Budget Doors',
                    items: [
                        lang === 'ar'
                            ? `أضعف باب: ${weakDoor?.label}`
                            : `Weakest door: ${weakDoor?.label}`,
                        lang === 'ar'
                            ? `أفضل باب: ${topDoor?.label}`
                            : `Leading door: ${topDoor?.label}`,
                    ],
                },
            ],
        };
    }

    return {
        brief: lang === 'ar'
            ? `${top?.label || 'النطاق الأعلى'} هو الأفضل أداءً حالياً، بينما يحتاج ${low?.label || 'النطاق الأدنى'} إلى متابعة أقرب، وتبقى ${topService?.label} و${topInitiative?.label} أكبر تركّزين في العينة.`
            : `${top?.label || 'The leading scope'} performs best at the moment, ${low?.label || 'the weakest scope'} needs closer follow-up, and ${topService?.label} plus ${topInitiative?.label} remain the largest concentrations in the sample.`,
        highlights: [
            {
                key: 'performance',
                title: lang === 'ar' ? 'الأداء' : 'Performance',
                items: [
                    lang === 'ar' ? `أفضل جهة: ${top?.label}` : `Leading scope: ${top?.label}`,
                    lang === 'ar' ? `أضعف جهة: ${low?.label}` : `Weakest scope: ${low?.label}`,
                ],
            },
            {
                key: 'services',
                title: lang === 'ar' ? 'الخدمات' : 'Services',
                items: [
                    lang === 'ar'
                        ? `أكبر خدمة من حيث القيمة: ${topService?.label}`
                        : `Largest service by value: ${topService?.label}`,
                ],
            },
            {
                key: 'initiatives',
                title: lang === 'ar' ? 'المبادرات' : 'Initiatives',
                items: [
                    lang === 'ar'
                        ? `أكبر مبادرة / مشروع: ${topInitiative?.label}`
                        : `Largest initiative / project: ${topInitiative?.label}`,
                    lang === 'ar'
                        ? `أوضح باب منخفض الأداء: ${weakDoor?.label}`
                        : `Most underperforming door: ${weakDoor?.label}`,
                ],
            },
        ],
    };
}

function buildRegionalMap(groupContext, filters, scopeRows, metrics, lang) {
    if (groupContext === 'g06') {
        const rows = buildRevenueRegionalRows(filters.selectedAmanas, filters.fiscalYear, lang);
        console.log('DEBUG buildRegionalMap:', {
            selectedAmanas: filters.selectedAmanas,
            fiscalYear: filters.fiscalYear,
            rowsLength: rows.length,
            firstRow: rows[0]
        });
        return {
            title: lang === 'ar' ? 'الخريطة الجغرافية للتحصيل' : 'Regional Collection Map',
            subtitle: lang === 'ar'
                ? 'توضح المناطق المحددة حسب تحقيق نسبة التحصيل مقارنة بالمستهدف.'
                : 'Selected regions are colored by collection target achievement.',
            thresholdLabel: lang === 'ar' ? 'تحقيق المستهدف' : 'Target Achievement',
            legend: [
                { label: lang === 'ar' ? 'أخضر - قريب من المستهدف' : 'Green - Near target', range: '>= 95%' },
                { label: lang === 'ar' ? 'أصفر - يحتاج متابعة' : 'Yellow - Watch', range: '80% - 94%' },
                { label: lang === 'ar' ? 'أحمر - متأخر' : 'Red - Alert', range: '< 80%' },
            ],
            notes: [SAMPLE_NOTES.find((item) => item.key === 'g06_supplemented')[lang]],
            regions: rows.map((row) => {
                const achievement = row.targetRate ? (row.actualRate / row.targetRate) * 100 : 0;
                return {
                    key: row.key,
                    label: row.label,
                    lng: row.lng,
                    lat: row.lat,
                    colorMetric: achievement,
                    alertStatus: getMapStatusByThreshold(achievement, 95, 80),
                    tooltipTitle: row.label,
                    tooltipRows: [
                        { label: lang === 'ar' ? 'صافي الفوترة' : 'Net Invoiced', value: formatMoney(row.netInvoiced, lang) },
                        { label: lang === 'ar' ? 'المبلغ المحصل' : 'Collected Amount', value: formatMoney(row.collected, lang) },
                        { label: lang === 'ar' ? 'النسبة الفعلية' : 'Actual Collection Rate', value: formatPercent(row.actualRate) },
                        { label: lang === 'ar' ? 'المستهدف' : 'Target Collection Rate', value: formatPercent(row.targetRate) },
                    ],
                };
            }),
        };
    }

    const rows = scopeRows.entityRows;
    if (groupContext === 'g03') {
        const doorRows = buildBudgetDoors(metrics, lang);
        const regionRows = rows.slice(0, Math.min(rows.length, 6));
        const matrixRows = doorRows.map((door, doorIndex) => {
            const cells = regionRows.map((region, regionIndex) => {
                const regionRate = region.planned ? (region.spent / region.planned) * 100 : region.rate;
                const offset = ((doorIndex * 11 + regionIndex * 7) % 9) - 4;
                const value = Math.max(35, Math.min(96, Number(((door.rate * 0.58) + (regionRate * 0.42) + offset).toFixed(0))));
                return {
                    key: region.key,
                    label: region.label,
                    value,
                };
            });
            return {
                key: door.key,
                label: door.label,
                cells,
            };
        });
        const riskCells = [];
        matrixRows.forEach((row) => {
            row.cells.forEach((cell) => {
                if (cell.value < 50) {
                    riskCells.push(`${String(row.label || '').split(' - ')[0]}-${cell.label}`);
                }
            });
        });
        return {
            variant: 'matrix',
            title: lang === 'ar' ? 'تنفيذ الميزانية حسب الباب والمنطقة' : 'Budget Execution by Door × Region',
            legend: [
                { label: lang === 'ar' ? 'حرج' : 'Risk', range: '< 50%' },
                { label: lang === 'ar' ? 'تنبيه' : 'Watch', range: '50% - 74%' },
                { label: lang === 'ar' ? 'جيد' : 'Good', range: '75% - 89%' },
                { label: lang === 'ar' ? 'قوي' : 'Strong', range: '≥ 90%' },
            ],
            columns: regionRows.map((row) => ({ key: row.key, label: row.label })),
            rows: matrixRows,
            riskSummary: {
                count: riskCells.length,
                items: riskCells.slice(0, 6),
            },
        };
    }

    return {
        title: lang === 'ar' ? 'الخريطة الجغرافية للأداء المالي' : 'Regional Financial Performance Map',
        subtitle: lang === 'ar'
            ? 'تظهر المناطق المحددة وفق نسبة الصرف المعدلة بعد استبعاد أثر الدين المؤجل.'
            : 'Selected regions are colored by adjusted spend rate after deferred-debt adjustment.',
        thresholdLabel: lang === 'ar' ? 'نسبة الصرف المعدلة' : 'Adjusted Spend Rate',
        legend: [
            { label: lang === 'ar' ? 'أخضر - أداء قوي' : 'Green - Strong', range: '>= 75%' },
            { label: lang === 'ar' ? 'أصفر - يحتاج متابعة' : 'Yellow - Watch', range: '50% - 74%' },
            { label: lang === 'ar' ? 'أحمر - أداء منخفض' : 'Red - Alert', range: '< 50%' },
        ],
        notes: [
            SAMPLE_NOTES.find((item) => item.key === 'amana_actual')[lang],
            SAMPLE_NOTES.find((item) => item.key === 'municipality_supplemented')[lang],
        ],
        regions: rows.map((row) => ({
            key: row.key,
            amanaKey: row.amanaKey,
            label: row.label,
            lng: row.lng,
            lat: row.lat,
            colorMetric: row.adjustedRate,
            alertStatus: getMapStatusByThreshold(row.adjustedRate, 75, 50),
            tooltipTitle: row.label,
            tooltipRows: [
                { label: lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget', value: formatMoney(row.revised, lang) },
                { label: lang === 'ar' ? 'المنصرف الفعلي' : 'Actual Spend', value: formatMoney(row.spent, lang) },
                { label: lang === 'ar' ? 'النسبة المعدلة' : 'Adjusted Spend Rate', value: formatPercent(row.adjustedRate) },
                { label: lang === 'ar' ? 'المتبقي' : 'Remaining Balance', value: formatMoney(row.remaining, lang) },
            ],
        })),
    };
}

function buildTimeSeries(groupContext, filters, metrics, lang) {
    const currentPeriod = filters.fiscalYear === 'FY2026';
    const yearStr = currentPeriod ? '2026' : '2025';
    const yearNum = currentPeriod ? '2026' : '2025';

    if (groupContext === 'g06') {
        const annualTarget = metrics.annualTarget;
        const base = [
            { key: `${yearStr}-01`, en: `Jan ${yearNum}`, ar: `يناير ${yearNum}`, target: annualTarget * 0.17, actual: annualTarget * 0.13 },
            { key: `${yearStr}-02`, en: `Feb ${yearNum}`, ar: `فبراير ${yearNum}`, target: annualTarget * 0.19, actual: annualTarget * 0.15 },
            { key: `${yearStr}-03`, en: `Mar ${yearNum}`, ar: `مارس ${yearNum}`, target: annualTarget * 0.22, actual: annualTarget * 0.18 },
            { key: `${yearStr}-04`, en: `Apr ${yearNum}`, ar: `أبريل ${yearNum}`, target: annualTarget * 0.24, actual: metrics.collected },
        ];
        const quarter = [
            {
                key: `${yearStr}-Q1`,
                en: `Q1 ${yearNum}`,
                ar: `الربع الأول ${yearNum}`,
                target: base[0].target + base[1].target + base[2].target,
                actual: base[0].actual + base[1].actual + base[2].actual,
            },
            {
                key: `${yearStr}-Q2`,
                en: `Q2 ${yearNum}`,
                ar: `الربع الثاني ${yearNum}`,
                target: base[3].target,
                actual: base[3].actual,
            },
        ];
        const annual = [
            { key: `${yearStr}-FY`, en: `FY${yearNum}`, ar: `السنة المالية ${yearNum}`, target: annualTarget, actual: metrics.collected },
        ];
        const series =
            filters.periodType === 'Quarterly' ? quarter :
            filters.periodType === 'Annually' ? annual :
            base;
        return {
            title: lang === 'ar' ? 'مقارنة زمنية للتحصيل' : 'Collection Trend Over Time',
            subtitle: lang === 'ar'
                ? 'السلسلة الشهرية قبل أبريل 2026 مستكملة لأغراض العرض.'
                : 'Pre-April 2026 periods are supplemented for demo continuity.',
            primaryLabel: lang === 'ar' ? 'المستهدف / الفوترة' : 'Target / Invoiced',
            secondaryLabel: lang === 'ar' ? 'المتحصل' : 'Collected Amount',
            sourceNote: SAMPLE_NOTES.find((item) => item.key === 'g06_supplemented')[lang],
            supplemented: true,
            series: series.map((row) => ({
                label: row[lang],
                budget: Number(row.target.toFixed(1)),
                actual: Number(row.actual.toFixed(1)),
            })),
        };
    }

    const totalBudget = metrics.revised;
    const totalActual = metrics.spent;
    const actualMonthly = currentPeriod
        ? [0.17, 0.22, 0.27, 0.34]
        : [0.21, 0.24, 0.26, 0.29];
    const budgetMonthly = currentPeriod
        ? [0.18, 0.22, 0.26, 0.34]
        : [0.22, 0.24, 0.26, 0.28];
    const planMonthly = currentPeriod
        ? [0.2, 0.23, 0.26, 0.31]
        : [0.23, 0.25, 0.26, 0.26];
    const monthLabels = [
        { key: `${yearStr}-01`, en: 'Jan', ar: 'يناير' },
        { key: `${yearStr}-02`, en: 'Feb', ar: 'فبراير' },
        { key: `${yearStr}-03`, en: 'Mar', ar: 'مارس' },
        { key: `${yearStr}-04`, en: 'Apr', ar: 'أبريل' },
    ];
    const monthly = monthLabels.map((label, index) => ({
        label: `${label[lang]} ${yearNum}`,
        budget: Number((totalBudget * budgetMonthly[index]).toFixed(1)),
        planned: Number((metrics.planned * planMonthly[index]).toFixed(1)),
        actual: Number((totalActual * actualMonthly[index]).toFixed(1)),
    }));
    const quarterly = [
        {
            label: lang === 'ar' ? `الربع الأول ${yearNum}` : `Q1 ${yearNum}`,
            budget: monthly[0].budget + monthly[1].budget + monthly[2].budget,
            planned: monthly[0].planned + monthly[1].planned + monthly[2].planned,
            actual: monthly[0].actual + monthly[1].actual + monthly[2].actual,
        },
        {
            label: lang === 'ar' ? `الربع الثاني ${yearNum}` : `Q2 ${yearNum}`,
            budget: monthly[3].budget,
            planned: monthly[3].planned,
            actual: monthly[3].actual,
        },
    ];
    const annual = [
        {
            label: filters.fiscalYear,
            budget: totalBudget,
            planned: metrics.planned,
            actual: totalActual,
        },
    ];
    const series =
        filters.periodType === 'Quarterly' ? quarterly :
        filters.periodType === 'Annually' ? annual :
        monthly;
    return {
        title: groupContext === 'g03'
            ? (lang === 'ar' ? 'الخطة مقابل التنفيذ عبر الزمن' : 'Planned vs Actual Over Time')
            : (lang === 'ar' ? 'أداء الصرف' : 'Spending Performance'),
        subtitle: lang === 'ar'
            ? 'الفترات السابقة لأبريل 2026 مستكملة لأغراض العرض.'
            : 'Pre-April 2026 periods are supplemented for trend continuity.',
        primaryLabel: groupContext === 'g03'
            ? (lang === 'ar' ? 'الخطة' : 'Planned Spend')
            : (lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget'),
        secondaryLabel: lang === 'ar' ? 'المنصرف الفعلي' : 'Actual Spend',
        sourceNote: SAMPLE_NOTES.find((item) => item.key === 'time_supplemented')[lang],
        supplemented: true,
        variant: groupContext === 'g03' ? 'planned-actual-gap' : 'bars',
        series: series.map((row) => ({
            label: row.label,
            budget: groupContext === 'g03' ? Number(row.planned.toFixed(1)) : Number(row.budget.toFixed(1)),
            actual: Number(row.actual.toFixed(1)),
        })),
    };
}

function buildStructureSummary(metrics, lang) {
    const total = metrics.revised || 1;
    const segments = [
        { key: 'amana', label: lang === 'ar' ? 'الأمانات' : 'Amanah Structure', budget: metrics.revised * 0.54, planned: metrics.planned * 0.53, actual: metrics.spent * 0.55 },
        { key: 'initiatives', label: lang === 'ar' ? 'المبادرات' : 'Initiative Structure', budget: metrics.revised * 0.29, planned: metrics.planned * 0.3, actual: metrics.spent * 0.27 },
        { key: 'diwan', label: lang === 'ar' ? 'الديوان' : 'Diwan Structure', budget: metrics.revised * 0.17, planned: metrics.planned * 0.17, actual: metrics.spent * 0.18 },
    ];
    return segments.map((item) => ({
        ...item,
        budget: Number(item.budget.toFixed(1)),
        planned: Number(item.planned.toFixed(1)),
        actual: Number(item.actual.toFixed(1)),
        variance: Number((item.actual - item.planned).toFixed(1)),
        weight: item.budget / total * 100,
    }));
}

function buildVarianceRows(doors) {
    return doors.map((row) => ({
        ...row,
        variance: Number((row.actual - row.planned).toFixed(1)),
    }));
}

function buildRevenueOverview(metrics, lang) {
    return [
        {
            label: lang === 'ar' ? 'المستهدف السنوي' : 'Annual Revenue Target',
            value: formatMoney(metrics.annualTarget, lang),
        },
        {
            label: lang === 'ar' ? 'إجمالي الفوترة' : 'Total Invoiced',
            value: formatMoney(metrics.totalInvoiced, lang),
        },
        {
            label: lang === 'ar' ? 'صافي الفوترة' : 'Net Invoiced',
            value: formatMoney(metrics.netInvoiced, lang),
        },
        {
            label: lang === 'ar' ? 'المتحصل' : 'Collected Amount',
            value: formatMoney(metrics.collected, lang),
        },
    ];
}

function buildDashboardTable(groupContext, lang, scopeRows, metrics, doors, initiatives, contracts, revenueSources, revenueRows) {
    if (groupContext === 'g06') {
        return {
            title: lang === 'ar' ? 'جدول مصادر الإيرادات' : 'Revenue Source Result Table',
            sourceTable: 'عرض مجلس القطاع.pdf - p14 / supplemented source rows',
            appliedFilters: lang === 'ar' ? 'المرشح الحالي بحسب النطاق والفترة' : 'Current scope and period filters',
            recordCount: revenueSources.length,
            note: SAMPLE_NOTES.find((item) => item.key === 'g06_supplemented')[lang],
            columns: [
                { key: 'source', label: lang === 'ar' ? 'مصدر الإيراد' : 'Revenue Source' },
                { key: 'netInvoiced', label: lang === 'ar' ? 'صافي الفوترة' : 'Net Invoiced' },
                { key: 'collected', label: lang === 'ar' ? 'المتحصل' : 'Collected' },
                { key: 'collectionRate', label: lang === 'ar' ? 'نسبة التحصيل' : 'Collection Rate' },
                { key: 'sourceWeight', label: lang === 'ar' ? 'وزن المصدر' : 'Source Weight' },
            ],
            rows: revenueSources.map((row) => ({
                source: row.label,
                netInvoiced: formatMoney(row.netInvoiced, lang),
                collected: formatMoney(row.collected, lang),
                collectionRate: formatPercent(row.collectionRate),
                sourceWeight: formatPercent(row.sourceWeight),
            })),
        };
    }

    if (groupContext === 'g03') {
        return {
            title: lang === 'ar' ? 'جدول انحراف الخطة والأبواب' : 'Door & Plan Variance Table',
            sourceTable: 'عرض مجلس القطاع.pdf - p4/p5 + supplemented plan rows',
            appliedFilters: lang === 'ar' ? 'المرشح الحالي بحسب النطاق والفترة' : 'Current scope and period filters',
            recordCount: doors.length,
            note: SAMPLE_NOTES.find((item) => item.key === 'time_supplemented')[lang],
            columns: [
                { key: 'door', label: lang === 'ar' ? 'الباب' : 'Door' },
                { key: 'budget', label: lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget' },
                { key: 'planned', label: lang === 'ar' ? 'الخطة' : 'Planned Spend' },
                { key: 'actual', label: lang === 'ar' ? 'المنصرف' : 'Actual Spend' },
                { key: 'variance', label: lang === 'ar' ? 'الانحراف' : 'Plan Variance' },
                { key: 'rate', label: lang === 'ar' ? 'نسبة التنفيذ' : 'Execution Rate' },
            ],
            rows: buildVarianceRows(doors).map((row) => ({
                door: row.label,
                budget: formatMoney(row.budget, lang),
                planned: formatMoney(row.planned, lang),
                actual: formatMoney(row.actual, lang),
                variance: formatMoney(row.variance, lang),
                rate: formatPercent(row.rate),
            })),
        };
    }

    return {
        title: lang === 'ar' ? 'جدول المقارنة الإقليمية' : 'Regional Comparison Table',
        sourceTable: scopeRows.entityRows[0]?.supplemented
            ? 'أمانات_ترتيب + municipality supplemented split'
            : 'أمانات_ترتيب',
        appliedFilters: lang === 'ar' ? 'المرشح الحالي بحسب النطاق والفترة' : 'Current scope and period filters',
        recordCount: scopeRows.entityRows.length,
        note: scopeRows.entityRows[0]?.supplemented
            ? SAMPLE_NOTES.find((item) => item.key === 'municipality_supplemented')[lang]
            : SAMPLE_NOTES.find((item) => item.key === 'amana_actual')[lang],
        columns: [
            { key: 'entity', label: lang === 'ar' ? 'الجهة' : 'Entity' },
            { key: 'original', label: lang === 'ar' ? 'الأصلي' : 'Original' },
            { key: 'revised', label: lang === 'ar' ? 'بعد التعديل' : 'Current Budget' },
            { key: 'spent', label: lang === 'ar' ? 'المنصرف' : 'Actual Spend' },
            { key: 'remaining', label: lang === 'ar' ? 'المتبقي' : 'Remaining' },
            { key: 'rate', label: lang === 'ar' ? 'نسبة الصرف' : 'Spending Rate' },
        ],
        rows: scopeRows.entityRows.map((row) => ({
            entity: row.label,
            original: formatMoney(row.original, lang),
            revised: formatMoney(row.revised, lang),
            spent: formatMoney(row.spent, lang),
            remaining: formatMoney(row.remaining, lang),
            rate: formatPercent(row.rate),
        })),
    };
}

function buildDetailTables(groupContext, lang, scopeRows, doors, services, initiatives, contracts, revenueSources, revenueRows) {
    const tables = [];

    if (groupContext === 'g06') {
        tables.push({
            title: lang === 'ar' ? 'جدول مصادر الإيرادات - تفصيلي' : 'Revenue Sources - Aggregated View',
            sourceTable: 'عرض مجلس القطاع.pdf - p14 / supplemented source rows',
            appliedFilters: lang === 'ar' ? 'مجموعة 06 / النطاق الحالي' : 'Group 06 / current scope',
            recordCount: revenueSources.length,
            note: SAMPLE_NOTES.find((item) => item.key === 'g06_supplemented')[lang],
            columns: [
                { key: 'source', label: lang === 'ar' ? 'المصدر' : 'Source' },
                { key: 'target', label: lang === 'ar' ? 'المستهدف' : 'Target' },
                { key: 'netInvoiced', label: lang === 'ar' ? 'صافي الفوترة' : 'Net Invoiced' },
                { key: 'collected', label: lang === 'ar' ? 'المتحصل' : 'Collected' },
                { key: 'collectionRate', label: lang === 'ar' ? 'نسبة التحصيل' : 'Collection Rate' },
                { key: 'sourceWeight', label: lang === 'ar' ? 'وزن المصدر' : 'Source Weight' },
            ],
            rows: revenueSources.map((row) => ({
                source: row.label,
                target: formatMoney(row.target, lang),
                netInvoiced: formatMoney(row.netInvoiced, lang),
                collected: formatMoney(row.collected, lang),
                collectionRate: formatPercent(row.collectionRate),
                sourceWeight: formatPercent(row.sourceWeight),
            })),
        });
        tables.push({
            title: lang === 'ar' ? 'جدول تقدم الذمم والتحصيل' : 'Receivable Progression - Underlying Detail',
            sourceTable: 'عرض مجلس القطاع.pdf - p16 / supplemented receivable rows',
            appliedFilters: lang === 'ar' ? 'مجموعة 06 / النطاق الحالي' : 'Group 06 / current scope',
            recordCount: REVENUE_RECEIVABLES_SUPPLEMENTED.length,
            note: SAMPLE_NOTES.find((item) => item.key === 'g06_supplemented')[lang],
            columns: [
                { key: 'stage', label: lang === 'ar' ? 'المرحلة' : 'Stage' },
                { key: 'amount', label: lang === 'ar' ? 'القيمة' : 'Amount' },
            ],
            rows: REVENUE_RECEIVABLES_SUPPLEMENTED.map((row) => ({
                stage: row[lang],
                amount: formatMoney(row.amount, lang),
            })),
        });
        tables.push({
            title: lang === 'ar' ? 'جدول الأداء الإقليمي للتحصيل' : 'Regional Collection Table',
            sourceTable: 'Material B p18 / supplemented regional collection rows',
            appliedFilters: lang === 'ar' ? 'مجموعة 06 / النطاق الحالي' : 'Group 06 / current scope',
            recordCount: revenueRows.length,
            note: SAMPLE_NOTES.find((item) => item.key === 'g06_supplemented')[lang],
            columns: [
                { key: 'region', label: lang === 'ar' ? 'المنطقة' : 'Region' },
                { key: 'targetRate', label: lang === 'ar' ? 'المستهدف' : 'Target Rate' },
                { key: 'actualRate', label: lang === 'ar' ? 'الفعلي' : 'Actual Rate' },
                { key: 'gap', label: lang === 'ar' ? 'الفجوة' : 'Gap' },
            ],
            rows: revenueRows.map((row) => ({
                region: row.label,
                targetRate: formatPercent(row.targetRate),
                actualRate: formatPercent(row.actualRate),
                gap: formatPercent(row.collectionGap),
            })),
        });
        return tables;
    }

    tables.push({
        title: lang === 'ar' ? 'النتيجة المجمعة - النطاق الحالي' : 'Aggregated Result Table',
        sourceTable: scopeRows.entityRows[0]?.supplemented ? 'أمانات_ترتيب + supplemented municipality split' : 'أمانات_ترتيب',
        appliedFilters: lang === 'ar' ? 'النطاق الزمني والمكاني الحالي' : 'Current spatial and temporal filters',
        recordCount: scopeRows.entityRows.length,
        note: scopeRows.entityRows[0]?.supplemented
            ? SAMPLE_NOTES.find((item) => item.key === 'municipality_supplemented')[lang]
            : SAMPLE_NOTES.find((item) => item.key === 'amana_actual')[lang],
        columns: [
            { key: 'entity', label: lang === 'ar' ? 'الجهة' : 'Entity' },
            { key: 'revised', label: lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget' },
            { key: 'spent', label: lang === 'ar' ? 'المنصرف' : 'Actual Spend' },
            { key: 'remaining', label: lang === 'ar' ? 'المتبقي' : 'Remaining' },
            { key: 'rate', label: lang === 'ar' ? 'نسبة الصرف' : 'Spending Rate' },
        ],
        rows: scopeRows.entityRows.map((row) => ({
            entity: row.label,
            revised: formatMoney(row.revised, lang),
            spent: formatMoney(row.spent, lang),
            remaining: formatMoney(row.remaining, lang),
            rate: formatPercent(row.rate),
        })),
    });

    tables.push({
        title: lang === 'ar' ? 'المبادرات / المشاريع - سجلات الأساس' : 'Initiatives / Projects - Underlying Records',
        sourceTable: 'التكاليف الحرة_أبريل 2026م.xlsx',
        appliedFilters: lang === 'ar' ? 'أفضل المشاريع ضمن العينة الحالية' : 'Top projects in the current sample scope',
        recordCount: initiatives.length,
        note: lang === 'ar'
            ? 'الحقول مأخوذة من ملف التكاليف الحرة، وتم تحويلها إلى صيغة واجهة أمامية قابلة للعرض.'
            : 'Rows come from the free-cost workbook and are transformed into a frontend-friendly structure.',
        columns: [
            { key: 'initiative', label: lang === 'ar' ? 'المشروع / المبادرة' : 'Initiative / Project' },
            { key: 'door', label: lang === 'ar' ? 'الباب' : 'Door' },
            { key: 'budget', label: lang === 'ar' ? 'التكلفة / الميزانية' : 'Budget / Cost' },
            { key: 'actual', label: lang === 'ar' ? 'القيمة الفعلية' : 'Actual Value' },
            { key: 'remaining', label: lang === 'ar' ? 'التكلفة الحرة' : 'Free / Remaining' },
            { key: 'rate', label: lang === 'ar' ? 'نسبة التنفيذ' : 'Execution Rate' },
        ],
        rows: initiatives.map((row) => ({
            initiative: row.label,
            door: row.door,
            budget: row.budget,
            actual: row.actual,
            remaining: row.remaining,
            rate: row.rate,
        })),
    });

    tables.push({
        title: lang === 'ar' ? 'العقود - توزيع الحالات' : 'Contracts - Status Distribution',
        sourceTable: 'تقرير العقود_أبريل 2026م 2.xlsb / ALL',
        appliedFilters: lang === 'ar' ? 'العينة الحالية لحالات العقود' : 'Current contract sample',
        recordCount: contracts.length,
        note: lang === 'ar'
            ? 'هذا الجدول يمثل تجميعاً حقيقياً من ملف العقود المقدم.'
            : 'This table is a direct aggregation from the provided contract workbook.',
        columns: [
            { key: 'status', label: lang === 'ar' ? 'حالة العقد' : 'Contract Status' },
            { key: 'count', label: lang === 'ar' ? 'العدد' : 'Count' },
            { key: 'share', label: lang === 'ar' ? 'الحصة' : 'Share' },
        ],
        rows: contracts.map((row) => ({
            status: row.label,
            count: row.count.toLocaleString(),
            share: formatPercent(row.share),
        })),
    });

    if (groupContext === 'g03') {
        tables.push({
            title: lang === 'ar' ? 'الأبواب والانحراف عن الخطة' : 'Budget Doors & Plan Variance',
            sourceTable: 'عرض مجلس القطاع.pdf - p4/p5 + supplemented plan rows',
            appliedFilters: lang === 'ar' ? 'تفسير التنفيذ حسب الباب' : 'Execution interpretation by door',
            recordCount: doors.length,
            note: SAMPLE_NOTES.find((item) => item.key === 'time_supplemented')[lang],
            columns: [
                { key: 'door', label: lang === 'ar' ? 'الباب' : 'Door' },
                { key: 'budget', label: lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget' },
                { key: 'planned', label: lang === 'ar' ? 'الخطة' : 'Planned Spend' },
                { key: 'actual', label: lang === 'ar' ? 'المنصرف' : 'Actual Spend' },
                { key: 'variance', label: lang === 'ar' ? 'الانحراف' : 'Variance' },
            ],
            rows: buildVarianceRows(doors).map((row) => ({
                door: row.label,
                budget: formatMoney(row.budget, lang),
                planned: formatMoney(row.planned, lang),
                actual: formatMoney(row.actual, lang),
                variance: formatMoney(row.variance, lang),
            })),
        });
    }

    return tables;
}

function buildGroupMeta(groupContext, lang) {
    const config = GROUP_CONFIGS[groupContext];
    return {
        key: config.key,
        title: config.title[lang],
        subtitle: config.subtitle[lang],
        allowedReportTypes: config.allowedReportTypes,
        detailRows: config.detailRows,
    };
}

function buildDataNotes(groupContext, lang) {
    const common = [
        SAMPLE_NOTES.find((item) => item.key === 'amana_actual'),
        SAMPLE_NOTES.find((item) => item.key === 'time_supplemented'),
    ];
    if (groupContext === 'g06') {
        common.push(SAMPLE_NOTES.find((item) => item.key === 'g06_supplemented'));
    } else {
        common.push(SAMPLE_NOTES.find((item) => item.key === 'municipality_supplemented'));
    }
    return common.map((item) => ({
        text: item[lang],
        actual: item.actual,
    }));
}

export function getDashboardData(filters) {
    const { groupContext, fiscalYear } = filters;
    // This embedded analysis module ships EN/AR copy only; for any other UI
    // language (e.g. zh) fall back to English so data labels never resolve to
    // undefined (which previously crashed the g03 regional matrix on .split).
    const lang = filters.lang === 'ar' ? 'ar' : 'en';
    const scopeRows = getScopeRows(filters, lang);
    const metrics = buildScopeMetrics(groupContext, scopeRows, fiscalYear);
    const groupMeta = buildGroupMeta(groupContext, lang);
    const doors = buildBudgetDoors(metrics, lang);
    const services = buildServices(metrics, lang);
    const initiatives = buildInitiatives(metrics, lang);
    const contracts = buildContractStatus(metrics, lang);
    const revenueSources = buildRevenueSources(metrics, lang);
    const revenueRows = buildRevenueRegionalRows(filters.selectedAmanas, fiscalYear, lang);
    const insights = buildInsights(groupContext, scopeRows, metrics, lang);
    const structureSummary = buildStructureSummary(metrics, lang);
    const varianceRows = buildVarianceRows(doors);
    const revenueOverview = groupContext === 'g06' ? buildRevenueOverview(metrics, lang) : [];

    return {
        groupMeta,
        scopeLabel: buildScopeLabel(filters, lang),
        managementReadout: groupContext === 'g06'
            ? (lang === 'ar'
                ? 'تعرض الصفحة الحالية قراءة موجهة للإيرادات والتحصيل مع إيضاح العناصر المستكملة من مواد العينة.'
                : 'This page presents a revenue and collection lens, with clearly marked supplemented rows reconstructed from the sample materials.')
            : groupContext === 'g03'
                ? (lang === 'ar'
                    ? 'تعرض الصفحة الحالية قراءة موجهة للتنفيذ، وتوضح أين يتباطأ الصرف مقارنة بالخطة المستهدفة.'
                    : 'This page emphasizes execution monitoring and highlights where actual spend is drifting from the intended plan.')
                : (lang === 'ar'
                    ? 'تعرض الصفحة الحالية الأداء المالي العام، والفروقات الإقليمية، والتمركزات الهيكلية في الخدمات والمبادرات.'
                    : 'This page emphasizes overall financial performance, regional differences, and structural concentrations in services and initiatives.'),
        aiBrief: insights.brief,
        kpis: buildKpis(groupContext, metrics, lang),
        regionalMap: buildRegionalMap(groupContext, filters, scopeRows, metrics, lang),
        timeComparison: buildTimeSeries(groupContext, filters, metrics, lang),
        keyHighlights: insights.highlights,
        groupContext,
        metrics,
        doorAnalysis: doors,
        serviceAnalysis: services,
        initiativeAnalysis: initiatives,
        contractAnalysis: contracts,
        structureSummary,
        varianceAnalysis: varianceRows,
        revenueOverview,
        revenueSourceAnalysis: revenueSources,
        receivableProgress: REVENUE_RECEIVABLES_SUPPLEMENTED.map((row) => ({
            ...row,
            label: row[lang],
        })),
        regionalCollectionAnalysis: revenueRows,
        detailRows: groupMeta.detailRows,
        dashboardTable: buildDashboardTable(groupContext, lang, scopeRows, metrics, doors, initiatives, contracts, revenueSources, revenueRows),
        detailTables: buildDetailTables(groupContext, lang, scopeRows, doors, services, initiatives, contracts, revenueSources, revenueRows),
        dataNotes: buildDataNotes(groupContext, lang),
        sources: {
            amana: 'منصرف الميزانية_أبريل 2026.xlsx / أمانات_ترتيب',
            initiatives: 'التكاليف الحرة_أبريل 2026م.xlsx',
            contracts: 'تقرير العقود_أبريل 2026م 2.xlsb / ALL',
            revenue: 'عرض مجلس القطاع.pdf (supplemented extraction)',
        },
        smartQueryScope: {
            scopeRows,
            metrics,
            doors,
            initiatives,
            revenueSources,
        },
    };
}

export function getReportOutput({ reportType, dashboardData, lang }) {
    const groupMeta = dashboardData.groupMeta;
    const reportLabel = REPORT_LABELS[reportType]?.[lang] || reportType;
    const metrics = dashboardData.metrics || {};
    const kpiMap = Object.fromEntries((dashboardData.kpis || []).map((item) => [item.key, item]));
    const topService = [...(dashboardData.serviceAnalysis || [])].sort((a, b) => b.spentValue - a.spentValue)[0];
    const topInitiative = [...(dashboardData.initiativeAnalysis || [])].sort((a, b) => b.actualValue - a.actualValue)[0];
    const topDoor = [...(dashboardData.doorAnalysis || [])].sort((a, b) => b.rate - a.rate)[0];
    const weakDoor = [...(dashboardData.doorAnalysis || [])].sort((a, b) => a.rate - b.rate)[0];
    const topRevenueSource = [...(dashboardData.revenueSourceAnalysis || [])].sort((a, b) => b.collectionRate - a.collectionRate)[0];
    const weakCollectionRegion = [...(dashboardData.regionalCollectionAnalysis || [])].sort((a, b) => a.actualRate - b.actualRate)[0];
    const findTable = (...keywords) =>
        (dashboardData.detailTables || []).find((item) =>
            keywords.every((keyword) => item.title.toLowerCase().includes(keyword.toLowerCase()))
        );

    const buildServicesTable = () => ({
        title: lang === 'ar' ? 'الخدمات - ترتيب الأداء' : 'Services - Performance Ranking',
        sourceTable: 'منصرف الميزانية_أبريل 2026.xlsx / transformed service view',
        appliedFilters: dashboardData.scopeLabel,
        recordCount: (dashboardData.serviceAnalysis || []).length,
        note: lang === 'ar'
            ? 'تم اشتقاق هذا الجدول من نفس نطاق البيانات المستخدم في لوحة المؤشرات الحالية.'
            : 'This table is derived from the same filtered scope used in the current dashboard.',
        columns: [
            { key: 'service', label: lang === 'ar' ? 'الخدمة' : 'Service' },
            { key: 'budget', label: lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget' },
            { key: 'actual', label: lang === 'ar' ? 'المنصرف الفعلي' : 'Actual Spend' },
            { key: 'rate', label: lang === 'ar' ? 'نسبة الصرف' : 'Spending Rate' },
        ],
        rows: (dashboardData.serviceAnalysis || []).slice(0, 6).map((row) => ({
            service: row.label,
            budget: row.budget,
            actual: row.spent,
            rate: row.rate,
        })),
    });

    const buildDoorsTable = () => ({
        title: lang === 'ar' ? 'الأبواب المالية - ملخص التنفيذ' : 'Budget Doors - Execution Summary',
        sourceTable: 'منصرف الميزانية_أبريل 2026.xlsx / derived door view',
        appliedFilters: dashboardData.scopeLabel,
        recordCount: (dashboardData.doorAnalysis || []).length,
        note: lang === 'ar'
            ? 'تم اشتقاق هذا الملخص من نفس حسابات الأبواب المستخدمة في اللوحة.'
            : 'This summary is derived from the same budget-door calculations used in the dashboard.',
        columns: [
            { key: 'door', label: lang === 'ar' ? 'الباب' : 'Door' },
            { key: 'budget', label: lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget' },
            { key: 'planned', label: lang === 'ar' ? 'الخطة' : 'Planned Spend' },
            { key: 'actual', label: lang === 'ar' ? 'المنصرف' : 'Actual Spend' },
            { key: 'rate', label: lang === 'ar' ? 'نسبة الصرف' : 'Spending Rate' },
        ],
        rows: (dashboardData.doorAnalysis || []).map((row) => ({
            door: row.label,
            budget: row.budget,
            planned: row.planned,
            actual: row.actual,
            rate: row.rate,
        })),
    });

    const buildExecutiveRegionalTable = dashboardData.dashboardTable;
    const initiativesTable = findTable(lang === 'ar' ? 'المبادرات' : 'Initiatives');
    const contractsTable = findTable(lang === 'ar' ? 'العقود' : 'Contracts');
    const g03VarianceTable = findTable(lang === 'ar' ? 'الأبواب' : 'Budget Doors', lang === 'ar' ? 'الانحراف' : 'Variance');
    const g06ReceivablesTable = findTable(lang === 'ar' ? 'الذمم' : 'Receivable');
    const g06RegionalTable = findTable(lang === 'ar' ? 'الأداء الإقليمي' : 'Regional Collection');
    const g06SourcesTable = findTable(lang === 'ar' ? 'مصادر الإيرادات' : 'Revenue Sources');

    const selectKpis = (keys) => keys.map((key) => kpiMap[key]).filter(Boolean);
    const reportOutlineMapByGroup = {
        g02: {
            Executive: lang === 'ar'
                ? ['لقطة مالية مختصرة للقطاع', 'الإشارات والملاحظات الإدارية', 'الوضع المالي العام', 'منظور الأمانات / المبادرات / الديوان', 'التوصيات الإدارية']
                : ['Sector financial snapshot', 'Key observations and management signals', 'Overall financial position', 'Amanah / initiatives / diwan structure', 'Management recommendations'],
            Initiatives: lang === 'ar'
                ? ['ملخص المبادرات', 'تنفيذ المبادرات حسب الأمانة', 'موضع المبادرات ضمن المشهد الكلي', 'الإشارات التنفيذية']
                : ['Initiative overview', 'Initiative execution by amanah', 'Initiative position in the sector overall view', 'Execution signals'],
            Services: lang === 'ar'
                ? ['ملخص أداء الخدمات', 'مقارنة الخدمات الأعلى والأدنى', 'فجوات التنفيذ حسب الخدمة', 'قراءة الأداء']
                : ['Service performance snapshot', 'Top and bottom services', 'Service execution gaps', 'Performance interpretation'],
            Doors: lang === 'ar'
                ? ['الهيكل العام للأبواب المالية', 'تفصيل الفئات المالية', 'التنفيذ حسب الباب المالي', 'قراءة الفجوات']
                : ['Budget structure overview', 'Category-level breakdown', 'Execution by budget class', 'Gap interpretation'],
        },
        g03: {
            Disbursement: lang === 'ar'
                ? ['ملخص تنفيذ الميزانية', 'الخطة مقابل الصرف الفعلي', 'التنفيذ العام للقطاع', 'خريطة التنفيذ حسب الأمانة', 'المخاطر والتوصيات']
                : ['Budget execution summary', 'Planned versus actual disbursement', 'Sector overall execution', 'Amanah execution map', 'Risks and recommendations'],
            Doors: lang === 'ar'
                ? ['القطاع ككل حسب بنية الأبواب', 'تفصيل الأمانات / المبادرات / الديوان', 'التنفيذ حسب الباب', 'الانحرافات الرئيسية']
                : ['Sector overall by budget structure', 'Amanah / initiatives / diwan breakdown', 'Execution by budget door', 'Major variances'],
            Services: lang === 'ar'
                ? ['تنفيذ الميزانية حسب الخدمات', 'الخدمات: الميزانية مقابل الفعلي', 'فروق التنفيذ حسب الخدمة']
                : ['Budget execution by service lines', 'Service budget versus actual', 'Execution differences by service'],
            Executive: lang === 'ar'
                ? ['أبرز الملاحظات التنفيذية', 'تفصيل إقليمي / أمانات', 'المخاطر والمتابعات', 'التوصيات الإدارية']
                : ['Key execution observations', 'Regional / amanah drill-down', 'Risks and follow-ups', 'Management recommendations'],
        },
        g06: {
            Executive: lang === 'ar'
                ? ['ملخص تنفيذ الإيرادات', 'نظرة عامة على الإيرادات', 'تفصيل الإيرادات حسب المصدر', 'تقدم الذمم / الغرامات', 'تحصيل الأمانات']
                : ['Revenue execution snapshot', 'Overall revenue overview', 'Revenue source split', 'Receivables / penalties progression', 'Amanah collection achievement'],
        },
    };

    const fallbackOutlineMap = {
        Executive: lang === 'ar'
            ? ['لقطة مالية مختصرة للنطاق الحالي', 'أبرز الإشارات الإدارية', 'مقارنة جغرافية وزمنية', 'تحليل الهيكل أو المصدر الرئيسي', 'التوصيات المقترحة']
            : ['Financial snapshot for the current scope', 'Key management signals', 'Regional and time comparison', 'Primary structure or source analysis', 'Recommended actions'],
        Disbursement: lang === 'ar'
            ? ['ملخص تنفيذ الميزانية', 'الخطة مقابل المنصرف', 'انحراف الأبواب', 'توزيع حالات العقود', 'إشارات المتابعة']
            : ['Budget execution summary', 'Plan versus actual', 'Door-level variance', 'Contract status distribution', 'Follow-up actions'],
        Contracts: lang === 'ar'
            ? ['ملخص بنية العقود', 'حالات العقود', 'أكبر المشروعات التعاقدية', 'مخاطر التنفيذ']
            : ['Contract structure summary', 'Contract statuses', 'Largest contract-backed projects', 'Execution risks'],
        Initiatives: lang === 'ar'
            ? ['ملخص المبادرات والمشروعات', 'أفضل المشروعات من حيث القيمة', 'المتبقي والتكلفة الحرة', 'الإشارات التنفيذية']
            : ['Initiatives and projects snapshot', 'Top projects by value', 'Free-cost and remaining balance', 'Execution signals'],
        Services: lang === 'ar'
            ? ['ملخص الخدمات', 'ترتيب الخدمات', 'الخدمات ذات التركّز الأعلى', 'دلالات الأداء']
            : ['Service snapshot', 'Service ranking', 'Largest service concentrations', 'Performance interpretation'],
        Doors: lang === 'ar'
            ? ['ملخص الأبواب المالية', 'الخطة مقابل التنفيذ', 'الباب الأعلى والأضعف', 'تفسير الفجوات']
            : ['Budget doors overview', 'Plan versus execution', 'Strongest and weakest doors', 'Gap interpretation'],
        Infrastructure: lang === 'ar'
            ? ['ملخص البنية التحتية', 'المشروعات الكبرى', 'التكلفة الحرة والباقي', 'الإشارات الاستثمارية']
            : ['Infrastructure snapshot', 'Major projects', 'Free-cost and remaining balance', 'Investment signals'],
        Expropriation: lang === 'ar'
            ? ['ملخص نزع الملكية', 'المبالغ المرتبطة', 'التقدم والتنفيذ', 'مخاطر المتابعة']
            : ['Expropriation overview', 'Linked financial amounts', 'Progress and execution', 'Follow-up risks'],
    };

    const reportOutline =
        reportOutlineMapByGroup[groupMeta.key]?.[reportType]
        || fallbackOutlineMap[reportType]
        || fallbackOutlineMap.Executive;
    const reportConfigs = {
        g02: {
            Executive: {
                kpis: selectKpis(['original', 'currentBudget', 'actualSpend', 'remaining', 'rate']),
                supportTables: [buildExecutiveRegionalTable, initiativesTable].filter(Boolean),
                narratives: {
                    synthesis: lang === 'ar'
                        ? `يوضح التقرير التنفيذي أن ${dashboardData.aiBrief}`
                        : `The executive report indicates that ${dashboardData.aiBrief}`,
                    highlights: lang === 'ar'
                        ? `• أفضل خدمة من حيث القيمة المنصرفة: ${topService?.label || '-'}\n• أكبر مشروع/مبادرة في النطاق الحالي: ${topInitiative?.label || '-'}\n• أعلى باب من حيث نسبة الصرف: ${topDoor?.label || '-'}`
                        : `• Top service by actual spend: ${topService?.label || '-'}\n• Largest initiative / project in the current scope: ${topInitiative?.label || '-'}\n• Highest-spending budget door: ${topDoor?.label || '-'}`,
                    causes: lang === 'ar'
                        ? 'تعكس القراءة الحالية تمركز الأداء في عدد محدود من الخدمات والمبادرات، مع أثر واضح لتوزيع الاعتمادات بين الأبواب الرئيسية.'
                        : 'The current pattern reflects performance concentration in a limited set of services and initiatives, with a visible effect from how budget is distributed across major doors.',
                    risks: lang === 'ar'
                        ? `أبرز المخاطر ترتبط باستمرار ضعف التنفيذ في ${weakDoor?.label || 'أضعف باب'} وتفاوت الأداء بين الجهات الإقليمية.`
                        : `The main risk is sustained weakness in ${weakDoor?.label || 'the weakest door'} together with uneven regional performance.`,
                    recommendations: lang === 'ar'
                        ? 'يوصى بإبقاء هذا التقرير في مستوى الإدارة العليا، مع استخدام الجدول الإقليمي وجدول المبادرات لدعم أي توجيهات متابعة.'
                        : 'This report should remain at executive level, using the regional table and initiatives table to support follow-up actions.',
                },
            },
            Initiatives: {
                kpis: selectKpis(['currentBudget', 'actualSpend', 'remaining', 'rate']),
                supportTables: [initiativesTable, buildExecutiveRegionalTable].filter(Boolean),
                narratives: {
                    synthesis: lang === 'ar'
                        ? `${topInitiative?.label || 'المبادرات الأعلى'} يقود حالياً قراءة المبادرات في النطاق المختار، مع ارتباط واضح بين حجم المبادرات والأبواب الداعمة لها.`
                        : `${topInitiative?.label || 'The largest initiative'} currently leads the initiatives view, with a clear relationship between initiative size and its supporting budget doors.`,
                    highlights: lang === 'ar'
                        ? `• أعلى مشروع/مبادرة: ${topInitiative?.label || '-'}\n• الباب الأكثر ارتباطاً بالمبادرات الحالية: ${topInitiative?.door || '-'}\n• الرصيد الحر المتبقي يتطلب متابعة على مستوى المشروعات الأعلى قيمة`
                        : `• Largest initiative / project: ${topInitiative?.label || '-'}\n• Most relevant budget door for the current initiative mix: ${topInitiative?.door || '-'}\n• Remaining free balance requires follow-up on the highest-value projects`,
                    causes: lang === 'ar'
                        ? 'تتأثر هذه القراءة بطبيعة المشروعات الأعلى قيمة في ملف التكاليف الحرة، وبمستوى الصرف الفعلي الذي تحقق حتى الفترة الحالية.'
                        : 'This view is driven by the highest-value projects in the free-cost workbook and by the level of actual execution achieved to date.',
                    risks: lang === 'ar'
                        ? 'أهم المخاطر هنا هي تراكم المتبقي في المشروعات الكبيرة دون تحسن متناسب في نسب التنفيذ.'
                        : 'The main risk is remaining balance accumulating in large projects without a proportional improvement in execution rates.',
                    recommendations: lang === 'ar'
                        ? 'يوصى باستخدام هذا التقرير في جلسات المتابعة الخاصة بالمبادرات الكبرى وربطه بقراءة إقليمية عند الحاجة.'
                        : 'This report is best used in large-initiative follow-up sessions and can be paired with a regional view when needed.',
                },
            },
            Services: {
                kpis: selectKpis(['currentBudget', 'actualSpend', 'remaining', 'rate']),
                supportTables: [buildServicesTable(), buildExecutiveRegionalTable].filter(Boolean),
                narratives: {
                    synthesis: lang === 'ar'
                        ? `قراءة الخدمات تُظهر أن ${topService?.label || 'الخدمة الأعلى'} يمثل حالياً أكبر تمركز في الإنفاق والأداء ضمن النطاق المحدد.`
                        : `The services view shows that ${topService?.label || 'the leading service'} currently represents the strongest concentration of spend and performance in the selected scope.`,
                    highlights: lang === 'ar'
                        ? `• أعلى خدمة: ${topService?.label || '-'}\n• نسبة الصرف العامة للخدمات تتماشى مع النطاق الحالي البالغ ${formatPercent(metrics.rate || 0)}\n• يظهر اختلاف واضح بين الخدمات الأعلى والأدنى من حيث الكثافة المالية`
                        : `• Top service: ${topService?.label || '-'}\n• Overall service execution aligns with the current scope spending rate of ${formatPercent(metrics.rate || 0)}\n• A clear gap remains between the highest and lowest service concentrations`,
                    causes: lang === 'ar'
                        ? 'تنتج هذه الفروقات من اختلاف توزع الاعتماد الحالي بين الخدمات ومن مستوى التقدم الفعلي في البنود المرتبطة بكل خدمة.'
                        : 'These gaps are driven by how current budget is distributed across services and by the actual progress of the underlying spending lines.',
                    risks: lang === 'ar'
                        ? 'الاعتماد المفرط على عدد محدود من الخدمات قد يحجب تباطؤاً في خدمات أقل حجماً لكنها مؤثرة تشغيلياً.'
                        : 'Heavy concentration in a small number of services may hide slower movement in smaller but still operationally important services.',
                    recommendations: lang === 'ar'
                        ? 'يوصى باستخدام هذا التقرير لقراءة ترتيب الخدمات وتحديد أين يلزم تدخل تشغيلي أو إعادة موازنة داخلية.'
                        : 'This report should be used to rank services and identify where operational intervention or internal rebalancing is needed.',
                },
            },
            Doors: {
                kpis: selectKpis(['original', 'currentBudget', 'actualSpend', 'adjustment', 'rate']),
                supportTables: [buildDoorsTable(), buildExecutiveRegionalTable].filter(Boolean),
                narratives: {
                    synthesis: lang === 'ar'
                        ? `قراءة الأبواب المالية تؤكد أن ${topDoor?.label || 'أقوى باب'} يقود التنفيذ حالياً، بينما يبقى ${weakDoor?.label || 'أضعف باب'} موضع الفجوة الأساسية.`
                        : `The budget-door view confirms that ${topDoor?.label || 'the strongest door'} currently leads execution, while ${weakDoor?.label || 'the weakest door'} remains the main gap area.`,
                    highlights: lang === 'ar'
                        ? `• أعلى باب: ${topDoor?.label || '-'}\n• أضعف باب: ${weakDoor?.label || '-'}\n• قيمة التعديل الكلية الحالية: ${formatMoney(metrics.budgetAdjustment || 0, lang)}`
                        : `• Leading door: ${topDoor?.label || '-'}\n• Weakest door: ${weakDoor?.label || '-'}\n• Current total budget adjustment: ${formatMoney(metrics.budgetAdjustment || 0, lang)}`,
                    causes: lang === 'ar'
                        ? 'يعكس هذا التقرير أثر إعادة توزيع الاعتماد بين الأبواب، وكذلك أثر اختلاف السرعة التنفيذية بين البنود الرأسمالية والتشغيلية.'
                        : 'This report reflects both budget redistribution across doors and uneven execution speed between capital and operating lines.',
                    risks: lang === 'ar'
                        ? 'إذا استمر ضعف الباب الأضعف دون معالجة، فسيظهر أثره في قراءة الأداء الإقليمية وفي قدرة القطاع على تحقيق الخطة الربع سنوية.'
                        : 'If the weakest door continues to lag, it will affect the regional performance view and the sector’s ability to meet quarterly plan expectations.',
                    recommendations: lang === 'ar'
                        ? 'يوصى بمراجعة الأبواب الأضعف وربطها مباشرة بمشروعاتها أو خدماتها ذات الأثر الأعلى قبل أي إعادة تخصيص إضافية.'
                        : 'Review the weaker doors first and tie them back to their highest-impact projects or services before making additional reallocations.',
                },
            },
        },
        g03: {
            Disbursement: {
                kpis: selectKpis(['currentBudget', 'plannedSpend', 'actualSpend', 'planVariance', 'remaining', 'rate']),
                supportTables: [dashboardData.dashboardTable, g03VarianceTable, contractsTable].filter(Boolean),
                narratives: {
                    synthesis: lang === 'ar'
                        ? `${dashboardData.aiBrief} ويركز هذا التقرير تحديداً على الفجوة بين الخطة والمنصرف الفعلي ضمن النطاق المختار.`
                        : `${dashboardData.aiBrief} This version focuses specifically on the gap between planned and actual disbursement in the selected scope.`,
                    highlights: lang === 'ar'
                        ? `• الانحراف الكلي عن الخطة: ${formatMoney(metrics.planVariance || 0, lang)}\n• نسبة التنفيذ مقابل الخطة: ${formatPercent(metrics.executionVsPlan || 0)}\n• الباب الأكثر ضغطاً: ${weakDoor?.label || '-'}`
                        : `• Total plan variance: ${formatMoney(metrics.planVariance || 0, lang)}\n• Execution versus plan ratio: ${formatPercent(metrics.executionVsPlan || 0)}\n• Main pressure point: ${weakDoor?.label || '-'}`,
                    causes: lang === 'ar'
                        ? 'الفجوة الحالية تتأثر بمزيج من بطء الصرف في بعض الأبواب وبنية العقود المرتبطة بالتنفيذ في المرحلة الحالية.'
                        : 'The current gap is driven by slower disbursement in some doors together with the contract structure behind current-stage execution.',
                    risks: lang === 'ar'
                        ? 'استمرار هذا الانحراف سيزيد ضغط المتبقي وقد ينقل جزءاً من التنفيذ المخطط إلى فترات لاحقة.'
                        : 'If this variance persists, remaining budget pressure will increase and part of the planned execution may shift into later periods.',
                    recommendations: lang === 'ar'
                        ? 'يوصى باستخدام هذا التقرير كنسخة المتابعة الأساسية للصرف، مع التركيز على الجدول التفصيلي للأبواب والعقود.'
                        : 'Use this as the primary disbursement follow-up report, with emphasis on the budget-door and contract detail tables.',
                },
            },
            Doors: {
                kpis: selectKpis(['currentBudget', 'plannedSpend', 'actualSpend', 'planVariance', 'rate']),
                supportTables: [g03VarianceTable || buildDoorsTable(), dashboardData.dashboardTable].filter(Boolean),
                narratives: {
                    synthesis: lang === 'ar'
                        ? `هذا التقرير يقرأ التنفيذ من خلال الأبواب المالية، ويُظهر بوضوح أين تتشكل الفجوات الرئيسية بين الخطة والواقع.`
                        : 'This report reads execution through budget doors and shows clearly where the main gaps between plan and actual are forming.',
                    highlights: lang === 'ar'
                        ? `• أعلى باب من حيث التنفيذ: ${topDoor?.label || '-'}\n• أضعف باب: ${weakDoor?.label || '-'}\n• أكبر قيمة انحراف على مستوى الأبواب: ${formatMoney(metrics.planVariance || 0, lang)}`
                        : `• Leading execution door: ${topDoor?.label || '-'}\n• Weakest door: ${weakDoor?.label || '-'}\n• Largest variance at the door level: ${formatMoney(metrics.planVariance || 0, lang)}`,
                    causes: lang === 'ar'
                        ? 'تتباين الأبواب في سرعة التنفيذ نتيجة اختلاف طبيعة البنود، وأثر ذلك يظهر مباشرة عند مقارنة الخطة بالمنصرف الفعلي.'
                        : 'Doors move at different execution speeds because their underlying spending lines differ in nature, which appears directly in plan-versus-actual comparison.',
                    risks: lang === 'ar'
                        ? 'إهمال الفجوات على مستوى الأبواب قد يخفي ضغوطاً تنفيذية مبكرة لا تظهر في المجاميع الكلية.'
                        : 'Ignoring door-level gaps may conceal early execution pressure that is not obvious in top-level totals.',
                    recommendations: lang === 'ar'
                        ? 'يوصى بتقديم هذا التقرير كملحق هيكلي عند مراجعة تقارير الصرف التنفيذية.'
                        : 'This report should be used as the structural appendix to disbursement execution reviews.',
                },
            },
            Services: {
                kpis: selectKpis(['plannedSpend', 'actualSpend', 'planVariance', 'rate']),
                supportTables: [buildServicesTable(), dashboardData.dashboardTable].filter(Boolean),
                narratives: {
                    synthesis: lang === 'ar'
                        ? 'هذا التقرير يربط تنفيذ الميزانية بخطوط الخدمات ويُظهر أين تتجمع فروق التنفيذ على مستوى الخدمة.'
                        : 'This report ties budget execution to service lines and highlights where service-level execution gaps are concentrating.',
                    highlights: lang === 'ar'
                        ? `• الخدمة الأعلى في التنفيذ: ${topService?.label || '-'}\n• الأداء العام للخدمات ما زال مرتبطاً مباشرة بنسبة الصرف الحالية ${formatPercent(metrics.rate || 0)}\n• تظهر الفروقات بوضوح عند مقارنة الخدمة الأعلى وزناً بالخدمات الأصغر`
                        : `• Highest-executing service: ${topService?.label || '-'}\n• Overall service execution remains anchored to the current spending rate of ${formatPercent(metrics.rate || 0)}\n• The gap is clearest when comparing the dominant service with smaller lines`,
                    causes: lang === 'ar'
                        ? 'يتأثر هذا التقرير بتوزيع البنود التنفيذية بين الخدمات، وليس فقط بحجم الإنفاق الكلي.'
                        : 'This view is influenced by how executable lines are distributed across services, not only by total spend size.',
                    risks: lang === 'ar'
                        ? 'قد يؤدي التركيز على المجاميع إلى إخفاء خدمات محددة تسير دون الخطة رغم أن الإجمالي يبدو مقبولاً.'
                        : 'A focus on totals can hide specific services running below plan even when the aggregate still appears acceptable.',
                    recommendations: lang === 'ar'
                        ? 'يوصى باستخدام هذا التقرير مع فرق التنفيذ القطاعية لتحديد الخدمات التي تتطلب معالجة تشغيلية مباشرة.'
                        : 'Use this report with sector execution teams to identify services that require direct operational intervention.',
                },
            },
            Executive: {
                kpis: selectKpis(['actualSpend', 'planVariance', 'remaining', 'rate']),
                supportTables: [dashboardData.dashboardTable, g03VarianceTable].filter(Boolean),
                narratives: {
                    synthesis: lang === 'ar'
                        ? 'هذه النسخة التنفيذية تختصر حالة الصرف الحالية في إشارات متابعة إدارية قابلة للعرض على القيادة.'
                        : 'This executive version condenses current disbursement status into management-facing follow-up signals.',
                    highlights: lang === 'ar'
                        ? `• أفضل نطاق تنفيذي يظهر في القراءة الحالية، مع استمرار ضعف ${weakDoor?.label || 'أضعف باب'}\n• الانحراف الكلي عن الخطة: ${formatMoney(metrics.planVariance || 0, lang)}`
                        : `• A leading execution scope is visible in the current reading, while ${weakDoor?.label || 'the weakest door'} remains under pressure\n• Total variance to plan: ${formatMoney(metrics.planVariance || 0, lang)}`,
                    causes: lang === 'ar'
                        ? 'القراءة التنفيذية هنا تستند إلى الفجوات الأكثر بروزاً في الخطة مقابل الواقع وليس إلى كل التفاصيل التشغيلية الدقيقة.'
                        : 'This executive reading is anchored in the most visible plan-versus-actual gaps rather than every detailed operational signal.',
                    risks: lang === 'ar'
                        ? 'إذا لم تُعالج بؤر الضغط الحالية، فسيظهر أثرها سريعاً في الرصيد المتبقي وفي قدرة الجهة على إنهاء الدورة الحالية كما هو مخطط.'
                        : 'If current pressure points are not addressed, they will quickly affect remaining balance and the ability to close the current cycle as planned.',
                    recommendations: lang === 'ar'
                        ? 'يوصى باستخدام هذا التقرير في الإحاطة الإدارية السريعة، مع الرجوع إلى تقرير الصرف التفصيلي عند الحاجة.'
                        : 'Use this report for concise management briefings, then fall back to the detailed disbursement report when deeper action is needed.',
                },
            },
        },
        g06: {
            Executive: {
                kpis: selectKpis(['annualTarget', 'netInvoiced', 'collected', 'collectionRate', 'targetRate', 'unpaid']),
                supportTables: [g06SourcesTable || dashboardData.dashboardTable, g06RegionalTable, g06ReceivablesTable].filter(Boolean),
                narratives: {
                    synthesis: lang === 'ar'
                        ? `${topRevenueSource?.label || 'المصدر الأعلى'} يقود التحصيل الحالي، بينما تظهر ${weakCollectionRegion?.label || 'أضعف منطقة'} فجوة أوضح عن المستهدف الإقليمي.`
                        : `${topRevenueSource?.label || 'The leading source'} currently drives collection, while ${weakCollectionRegion?.label || 'the weakest region'} shows the most visible gap against target.`,
                    highlights: lang === 'ar'
                        ? `• أعلى مصدر تحصيل: ${topRevenueSource?.label || '-'}\n• صافي الفوترة الحالي: ${formatMoney(metrics.netInvoiced || 0, lang)}\n• ذمم غير محصلة: ${formatMoney(metrics.unpaid || 0, lang)}`
                        : `• Top collection source: ${topRevenueSource?.label || '-'}\n• Current net invoiced amount: ${formatMoney(metrics.netInvoiced || 0, lang)}\n• Unpaid receivables: ${formatMoney(metrics.unpaid || 0, lang)}`,
                    causes: lang === 'ar'
                        ? 'يعكس التقرير الحالي مزيجاً من مصادر الإيراد المختلفة وتفاوت الإنجاز الإقليمي في التحصيل مقارنة بالمستهدف.'
                        : 'The current report reflects the mix of revenue sources and the uneven regional collection achievement against target.',
                    risks: lang === 'ar'
                        ? 'أهم المخاطر ترتبط بتراكم الذمم غير المحصلة في حال لم يتحسن الأداء في المناطق الأدنى أو في المصادر الأضعف.'
                        : 'The main risk is unpaid receivables accumulating further if weaker regions or lower-performing sources do not improve.',
                    recommendations: lang === 'ar'
                        ? 'يوصى بعرض هذا التقرير على فرق التحصيل والمتابعة القانونية مع التركيز على المصدر الأعلى وزناً والمناطق الأضعف تحقيقاً.'
                        : 'Share this report with collection and legal follow-up teams, focusing on the highest-weight sources and the weakest-achieving regions.',
                },
            },
        },
    };

    const activeConfig =
        reportConfigs[groupMeta.key]?.[reportType]
        || reportConfigs[groupMeta.key]?.Executive
        || {
            kpis: dashboardData.kpis || [],
            supportTables: [dashboardData.dashboardTable].filter(Boolean),
            narratives: {
                synthesis: dashboardData.aiBrief,
                highlights: dashboardData.keyHighlights.map((group) => `• ${group.title}: ${(group.items || []).join(' / ')}`).join('\n'),
                causes: lang === 'ar'
                    ? 'تعتمد قراءة الأسباب هنا على الربط بين البيانات الفعلية في ملفات العينة وبعض السلاسل الزمنية أو التفاصيل المستكملة لأغراض العرض.'
                    : 'The current explanation combines true sample rows with a limited amount of supplemented time-series and drill-down detail used only for demo continuity.',
                risks: lang === 'ar'
                    ? 'قد تختلف بعض قراءات البلديات أو السلاسل الشهرية عن النظام الفعلي لأنها مستكملة عند غياب تفصيل منظم في حزمة العينة.'
                    : 'Some municipality and time-series readings may differ from the production system because they are supplemented where the sample package lacks a structured breakdown.',
                recommendations: lang === 'ar'
                    ? 'يوصى في المرحلة التالية بربط هذه الصفحة مباشرة بطبقة بيانات منظمة وإحلال أي بيانات مستكملة ببيانات تشغيلية فعلية عند توفرها.'
                    : 'The next step should connect this page to a structured data layer and replace supplemented rows with fully operational data when it becomes available.',
            },
        };

    return {
        reportLabel,
        groupLabel: groupMeta.title,
        reportOutline,
        narratives: activeConfig.narratives,
        kpis: activeConfig.kpis,
        focusTable: activeConfig.supportTables?.[0] || dashboardData.dashboardTable,
        supportTables: activeConfig.supportTables || [],
        dataNotes: dashboardData.dataNotes,
    };
}

export function getSmartQuerySampleQuestions(lang) {
    return [
        {
            key: 'highest-spending-rate',
            query: 'Which amana has the highest spending rate in April 2026?',
            label: lang === 'ar' ? 'ما الأمانة الأعلى في نسبة الصرف خلال أبريل 2026؟' : 'Which amana has the highest spending rate in April 2026?',
        },
        {
            key: 'top-initiatives',
            query: 'Show the top 5 initiatives by actual spend.',
            label: lang === 'ar' ? 'أظهر أعلى 5 مبادرات أو مشروعات حسب القيمة الفعلية.' : 'Show the top 5 initiatives by actual spend.',
        },
        {
            key: 'largest-plan-variance',
            query: 'Which budget door has the largest plan variance?',
            label: lang === 'ar' ? 'أي باب مالي لديه أكبر انحراف عن الخطة؟' : 'Which budget door has the largest plan variance?',
        },
        {
            key: 'highest-collection-rate',
            query: 'Which revenue source has the highest collection rate?',
            label: lang === 'ar' ? 'أي مصدر إيراد لديه أعلى نسبة تحصيل؟' : 'Which revenue source has the highest collection rate?',
        },
    ];
}

export function askSmartQuery(question, dashboardData, lang) {
    const normalized = question.toLowerCase();
    const scopeRows = dashboardData.smartQueryScope.scopeRows.entityRows;

    if (normalized.includes('highest spending rate') || normalized.includes('نسبة الصرف')) {
        const top = [...scopeRows].sort((a, b) => b.rate - a.rate)[0];
        return {
            title: lang === 'ar' ? 'نتيجة السؤال' : 'Query Result',
            answer: lang === 'ar'
                ? `الأعلى حالياً هو ${top.label} بنسبة صرف ${formatPercent(top.rate)} من اعتماد حالي يبلغ ${formatMoney(top.revised, lang)}.`
                : `${top.label} currently has the highest spending rate at ${formatPercent(top.rate)} against a current budget of ${formatMoney(top.revised, lang)}.`,
            table: {
                columns: [
                    { key: 'region', label: lang === 'ar' ? 'الجهة' : 'Region' },
                    { key: 'budget', label: lang === 'ar' ? 'الاعتماد الحالي' : 'Current Budget' },
                    { key: 'spent', label: lang === 'ar' ? 'المنصرف' : 'Actual Spend' },
                    { key: 'rate', label: lang === 'ar' ? 'نسبة الصرف' : 'Spending Rate' },
                ],
                rows: [top].map((row) => ({
                    region: row.label,
                    budget: formatMoney(row.revised, lang),
                    spent: formatMoney(row.spent, lang),
                    rate: formatPercent(row.rate),
                })),
            },
        };
    }

    if (normalized.includes('top 5 initiatives') || normalized.includes('مبادرات') || normalized.includes('مشروعات')) {
        const topFive = [...dashboardData.smartQueryScope.initiatives]
            .sort((a, b) => b.actualValue - a.actualValue)
            .slice(0, 5);
        return {
            title: lang === 'ar' ? 'أعلى 5 مبادرات / مشروعات' : 'Top 5 Initiatives / Projects',
            answer: lang === 'ar'
                ? `تم استخراج أعلى 5 مشاريع أو مبادرات حسب القيمة الفعلية من ملف التكاليف الحرة.`
                : 'Here are the top 5 initiatives or projects by actual value from the free-cost sample workbook.',
            table: {
                columns: [
                    { key: 'initiative', label: lang === 'ar' ? 'المشروع / المبادرة' : 'Initiative / Project' },
                    { key: 'actual', label: lang === 'ar' ? 'القيمة الفعلية' : 'Actual Value' },
                    { key: 'remaining', label: lang === 'ar' ? 'المتبقي' : 'Remaining / Free Cost' },
                    { key: 'rate', label: lang === 'ar' ? 'نسبة التنفيذ' : 'Execution Rate' },
                ],
                rows: topFive.map((row) => ({
                    initiative: row.label,
                    actual: formatMoney(row.actualValue, lang),
                    remaining: formatMoney(row.remainingValue, lang),
                    rate: row.rate,
                })),
            },
        };
    }

    if (normalized.includes('largest plan variance') || normalized.includes('انحراف')) {
        const topVariance = [...dashboardData.smartQueryScope.doors]
            .sort((a, b) => Math.abs(b.actual - b.planned) - Math.abs(a.actual - a.planned))[0];
        const variance = topVariance.actual - topVariance.planned;
        return {
            title: lang === 'ar' ? 'أكبر انحراف عن الخطة' : 'Largest Plan Variance',
            answer: lang === 'ar'
                ? `أكبر انحراف يظهر في ${topVariance.label} بقيمة ${formatMoney(variance, lang)} مقارنة بالخطة المستهدفة.`
                : `${topVariance.label} has the largest plan variance at ${formatMoney(variance, lang)} against the planned spend baseline.`,
            table: {
                columns: [
                    { key: 'door', label: lang === 'ar' ? 'الباب' : 'Door' },
                    { key: 'planned', label: lang === 'ar' ? 'الخطة' : 'Planned Spend' },
                    { key: 'actual', label: lang === 'ar' ? 'المنصرف' : 'Actual Spend' },
                    { key: 'variance', label: lang === 'ar' ? 'الانحراف' : 'Variance' },
                ],
                rows: [{
                    door: topVariance.label,
                    planned: formatMoney(topVariance.planned, lang),
                    actual: formatMoney(topVariance.actual, lang),
                    variance: formatMoney(variance, lang),
                }],
            },
        };
    }

    if (normalized.includes('highest collection rate') || normalized.includes('تحصيل')) {
        const topSource = [...buildRevenueSources(lang)].sort((a, b) => b.collectionRate - a.collectionRate)[0];
        return {
            title: lang === 'ar' ? 'أفضل مصدر تحصيل' : 'Highest Collection-Rate Source',
            answer: lang === 'ar'
                ? `أعلى مصدر تحصيل في العينة هو ${topSource.label} بنسبة ${formatPercent(topSource.collectionRate)}.`
                : `${topSource.label} currently has the highest collection rate in the sample at ${formatPercent(topSource.collectionRate)}.`,
            table: {
                columns: [
                    { key: 'source', label: lang === 'ar' ? 'المصدر' : 'Source' },
                    { key: 'netInvoiced', label: lang === 'ar' ? 'صافي الفوترة' : 'Net Invoiced' },
                    { key: 'collected', label: lang === 'ar' ? 'المتحصل' : 'Collected' },
                    { key: 'rate', label: lang === 'ar' ? 'نسبة التحصيل' : 'Collection Rate' },
                ],
                rows: [{
                    source: topSource.label,
                    netInvoiced: formatMoney(topSource.netInvoiced, lang),
                    collected: formatMoney(topSource.collected, lang),
                    rate: formatPercent(topSource.collectionRate),
                }],
            },
        };
    }

    return {
        title: lang === 'ar' ? 'الاستعلام الذكي' : 'Smart Query',
        answer: lang === 'ar'
            ? 'يمكن تجربة أحد الأسئلة النموذجية المرتبطة بالإنفاق أو المبادرات أو انحراف الخطة أو التحصيل.'
            : 'Try one of the sample questions related to spending, initiatives, plan variance, or collection performance.',
    };
}
