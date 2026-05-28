'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type LanguageCode = 'en' | 'yo' | 'ha' | 'ig';

export const translations: Record<LanguageCode, Record<string, string>> = {
  en: {
    nav_verify: 'Verify',
    nav_about: 'About',
    hero_badge: 'AI-Powered Verification',
    hero_heading: 'Detect Fake News with VerifyIt',
    hero_paragraph: 'Paste an article or upload a screenshot — our multi-model AI engine analyzes text, cross-references sources, and delivers a credibility score in seconds.',
    hero_start: 'Start Verifying ↓',
    hero_trending: 'Trending News',
    verify_title: 'Verify Your Content',
    verify_subtitle: 'Choose your verification method below and get instant results.',
    text_card_title: 'Text Verification',
    text_card_desc: 'Paste an article or claim to analyze',
    url_card_title: 'URL Verification',
    url_card_desc: 'Enter a news article URL to analyze',
    image_card_title: 'Image Verification',
    image_card_desc: 'Upload a news screenshot to analyze',
    play_learn_title: 'Play and Share',
    play_learn_subtitle: 'Improve your fact-checking skills and report suspicious news with WhatsApp.',
    quiz_title: 'Fake News Quiz',
    quiz_desc: 'Challenge yourself with short quiz questions to spot misinformation.',
    start_quiz_btn: 'Start Quiz',
    whatsapp_title: 'WhatsApp Verification Helper',
    whatsapp_desc: 'Generate a ready-made WhatsApp message to report or verify suspicious claims.',
    whatsapp_input_placeholder: 'Paste the claim or headline you want to verify...',
    whatsapp_generate: 'Generate Message',
    whatsapp_copy: 'Copy Message',
    whatsapp_open: 'Open WhatsApp',
    language_title: 'Local Language Support',
    language_desc: 'Switch to Yoruba, Hausa, or Igbo for a more comfortable verification experience.',
    language_info: 'Use the selector above to choose your local language.',
    result_title: 'Verification Result',
    result_ai_analysis: 'AI Analysis',
    result_sources: 'Sources Found',
    no_analysis_available: 'No detailed analysis available.',
    verdict_likely_credible: 'Likely Credible',
    verdict_possibly_credible: 'Possibly Credible',
    verdict_uncertain: 'Uncertain',
    verdict_likely_unreliable: 'Likely Unreliable',
    verdict_very_likely_fake: 'Very Likely Fake',
    verdict_desc_high: 'This content appears highly credible and is well-supported by trusted sources.',
    verdict_desc_medium: 'This content seems mostly credible but some claims could not be fully verified.',
    verdict_desc_mixed: 'This content has mixed signals — some claims check out while others are questionable.',
    verdict_desc_warning: 'This content shows significant warning signs of being unreliable or misleading.',
    verdict_desc_fake: 'This content is very likely to be fake or heavily misleading. Exercise extreme caution.'
  },
  yo: {
    nav_verify: 'Ṣàyẹwo',
    nav_about: 'Nipa',
    hero_badge: 'Ìmúlòlùfẹ́ AI',
    hero_heading: 'Ṣàwárí Ìròyìn Asán pẹ̀lú VerifyIt',
    hero_paragraph: 'Da àpilẹ̀kọ sílẹ̀ tàbí gbe àwòrán kan sórí — Ẹ̀rọ AI wa yóò ṣe àyẹ̀wò àti fí ìtẹ́numọ́ hàn ní ìsẹ́jú.',
    hero_start: 'Bẹrẹ Ṣàyẹwo ↓',
    hero_trending: 'Ìròyìn tó ń gbajú',
    verify_title: 'Ṣàyẹwo Àkóónú Rẹ',
    verify_subtitle: 'Yan ọ̀nà ṣàyẹwo rẹ̀ ní isalẹ kí o sì gba esi lẹ́sẹkẹsẹ.',
    text_card_title: 'Ṣàyẹwo Ọ̀rọ̀',
    text_card_desc: 'Da àpilẹ̀kọ tàbí ẹ̀sùn sílẹ̀ láti ṣe àyẹ̀wò',
    url_card_title: 'Ṣàyẹwo URL',
    url_card_desc: 'Tẹ URL ìròyìn kan láti ṣe àyẹ̀wò',
    image_card_title: 'Ṣàyẹwo Aworan',
    image_card_desc: 'Gbe aworan iṣawari tabi iroyin kan sórí',
    deepfake_section_title: 'Ìmúlòlùfẹ́ Deepfake',
    deepfake_section_subtitle: 'Gbe fidio tàbí ohun àfihàn sórí fún ìtúpalẹ̀ amuṣẹ́fún.',
    deepfake_card_title: 'Olùwádìí Deepfake',
    deepfake_card_desc: 'Gbe ohun tàbí fíìmù sórí láti ṣàyẹwo amuṣẹ́fún àti gba ìtumọ̀ AI.',
    deepfake_input_placeholder: 'Yan faili ohun tabi fidio...',
    deepfake_button: 'Gbe Media',
    deepfake_detect_btn: 'Ṣàyẹwo Deepfake',
    play_learn_title: 'Ṣeré àti Pín',
    play_learn_subtitle: 'Mu ogbontarigi rẹ pọ̀ nípa kíkẹ́kọ̀ọ́ àti fí WhatsApp ránṣẹ́.',
    quiz_title: 'Ìdánwò Ìròyìn Asán',
    quiz_desc: 'Kọ ẹ̀kọ bí a ṣe ń rí iroyin asán nípasẹ̀ ìbéèrè kúkúrú.',
    start_quiz_btn: 'Bẹrẹ Ìdánwò',
    whatsapp_title: 'Iranlọwọ WhatsApp',
    whatsapp_desc: 'Ṣẹda ifiranṣẹ WhatsApp tí ó ṣetan láti jabo tàbí ṣe àyẹ̀wò ẹ̀sùn.',
    whatsapp_input_placeholder: 'Da ẹ̀sùn tàbí akọle tí o fẹ́ ṣe àyẹ̀wò sílẹ̀...',
    whatsapp_generate: 'Ṣẹda Ifiranṣẹ',
    whatsapp_copy: 'Daakọ Ifiranṣẹ',
    whatsapp_open: 'Ṣí WhatsApp',
    language_title: 'Atilẹyin Èdè Agbegbe',
    language_desc: 'Yan Yorùbá, Hausa, tàbí Igbo fún ìrírí títúnṣe tó rọrùn.',
    language_info: 'Use the selector above to choose your local language.', // fallback
    result_title: 'Esi Ṣàyẹwo',
    result_ai_analysis: 'Ìtúpalẹ̀ AI',
    result_sources: 'Orísun Tó Rí',
    no_analysis_available: 'Kò sí àlàyé pípa tó wà.',
    verdict_likely_credible: 'Ẹ̀rí Òótọ́ Ló Wà',
    verdict_possibly_credible: 'Ṣeé Ṣàtúnṣe',
    verdict_uncertain: 'Aìdánidájọ́',
    verdict_likely_unreliable: 'Kò Dáa Gẹ́gẹ́ Bí Ó Tó',
    verdict_very_likely_fake: 'Ẹ̀rí Ọ̀tító Kò Dáa',
    verdict_desc_high: 'Àkóónú yìí dàbí ẹni pé ó ní ìmúlòlùfẹ́ gíga àti orísun tó dájú.',
    verdict_desc_medium: 'Àkóónú yìí dàbí ẹni pé ó lè jẹ́ gidi ṣùgbọ́n ìkan nínú rẹ̀ kò tíì jẹ́ kó dájú.',
    verdict_desc_mixed: 'Àkóónú yìí ní ami àìmọ̀kan — diẹ̀ nínú ẹ̀rí wà, ṣugbọn àwọn míì ṣòro láti jẹ́ kó dájú.',
    verdict_desc_warning: 'Àkóónú yìí fi àfihàn ìkìlọ̀ hàn pé ó lè jẹ́ aláìdánidájọ́ tàbí ẹ̀sùn.',
    verdict_desc_fake: 'Àkóónú yìí dájú pé ó ṣeé ṣe kí ó jẹ́ ìròyìn asán. Ṣọra gan-an.'
  },
  ha: {
    nav_verify: 'Tabbatar',
    nav_about: 'Game da',
    hero_badge: 'Bincike na AI',
    hero_heading: 'Gano Karya Labarai tare da VerifyIt',
    hero_paragraph: 'Manna labarin ko ɗora hoton allo — ƙirar AI namu zata bincika sannan ta bayar da sakamako cikin sauri.',
    hero_start: 'Fara Tabbatarwa ↓',
    hero_trending: 'Labarai Masu Ƙarfi',
    verify_title: 'Tabbatar Abun Cikin Ka',
    verify_subtitle: 'Zaɓi hanyar tabbaci a ƙasa ka samu sakamako nan da nan.',
    text_card_title: 'Tabbatar Rubutu',
    text_card_desc: 'Manna labarin ko ƙila don a bincika',
    url_card_title: 'Tabbatar URL',
    url_card_desc: 'Shigar da URL ɗin labari don a bincika',
    image_card_title: 'Tabbatar Hoton',
    image_card_desc: 'Loda hoto na labari ko allo',
    deepfake_section_title: 'Gano Deepfake',
    deepfake_section_subtitle: 'Loda sauti ko bidiyo don nazarin kafofin watsa labarai na ƙarya.',
    deepfake_card_title: 'Mai Ganowa Deepfake',
    deepfake_card_desc: 'Loda sauti ko bidiyo don gano hanyoyin kirkirar AI da samun bayani.',
    deepfake_input_placeholder: 'Zaɓi fayil na sauti ko bidiyo...',
    deepfake_button: 'Loda Media',
    deepfake_detect_btn: 'Gano Deepfake',
    play_learn_title: 'Yi Wasan Koyo',
    play_learn_subtitle: 'Inganta ƙwarewar ka ta hanyar wasa da kuma raba via WhatsApp.',
    quiz_title: 'Gwajin Karya Labarai',
    quiz_desc: 'Gwada kanka da tambayoyi don gano labarai mara gaskiya.',
    start_quiz_btn: 'Fara Gwaji',
    whatsapp_title: 'Taimakon WhatsApp',
    whatsapp_desc: 'Ƙirƙiri saƙon WhatsApp da za a iya tura wa don tantance gaskiya.',
    whatsapp_input_placeholder: 'Manna ikirari ko taken da kake son tantancewa...',
    whatsapp_generate: 'Ƙirƙiri Saƙo',
    whatsapp_copy: 'Kwafi Saƙo',
    whatsapp_open: 'Bude WhatsApp',
    language_title: 'Taimako na Yanki',
    language_desc: 'Canza zuwa Yorùbá, Hausa, ko Igbo don ƙwarewa mafi sauƙi.',
    language_info: 'Yi amfani da zaɓin harshe a sama don zaɓar harshen ka.',
    result_title: 'Sakamakon Tabbatarwa',
    result_ai_analysis: 'Binciken AI',
    result_sources: 'Tushen da aka samu',
    no_analysis_available: 'Babu cikakken bayani da aka samu.',
    verdict_likely_credible: 'Mai Yuwuwar Amincewa',
    verdict_possibly_credible: 'Yiwuwar Amincewa',
    verdict_uncertain: 'Ba a Tabbatar ba',
    verdict_likely_unreliable: 'Mai Yuwuwar Rashin Amincewa',
    verdict_very_likely_fake: 'Mai Yuwuwar Karya',
    verdict_desc_high: 'Wannan abun cikin yana nuna alamun gaskiya sosai kuma ana tallafawa da tushen da suka dace.',
    verdict_desc_medium: 'Wannan abun cikin yana da alamar gaskiya amma wasu ƙididdiga ba a iya tabbatar da su ba.',
    verdict_desc_mixed: 'Wannan abun cikin yana da alamun gauraye — wasu abubuwa sun dace amma wasu suna da tambaya.',
    verdict_desc_warning: 'Wannan abun cikin yana nuna manyan alamun cewa ba a iya dogaro da shi ba ko ƙila yana zama mai yaudara.',
    verdict_desc_fake: 'Wannan abun cikin yana iya zama ƙarya sosai ko kuma yaudara. Kasance mai matukar hankali.'
  },
  ig: {
    nav_verify: 'Nyocha',
    nav_about: 'Banyere',
    hero_badge: 'Nyocha AI',
    hero_heading: 'Chọta Akwụkwọ Akụkọ Ụgha na VerifyIt',
    hero_paragraph: 'Tinye akụkọ ma ọ bụ bulite onyonyo — igwe AI anyị ga-enyocha ma nye akara ntụkwasị obi n’oge.',
    hero_start: 'Malite Nyocha ↓',
    hero_trending: 'Akụkọ Na-apụta',
    verify_title: 'Nyocha Ebumnuche Gị',
    verify_subtitle: 'Họrọ ụzọ nnyocha gị n’okpuru ma nweta nsonaazụ ozugbo.',
    text_card_title: 'Nyocha Okwu',
    text_card_desc: 'Tinye akụkọ ma ọ bụ nkwupụta iji nyochaa',
    url_card_title: 'Nyocha URL',
    url_card_desc: 'Tinye URL akụkọ iji nyochaa',
    image_card_title: 'Nyocha Ihe Onyonyo',
    image_card_desc: 'Bulite eserese akụkọ ma ọ bụ screenshot',
    deepfake_section_title: 'Nyocha Deepfake',
    deepfake_section_subtitle: 'Bulite faịlụ vidiyo ma ọ bụ ụda maka nyocha mgbakwunye.',
    deepfake_card_title: 'Ngwa Nyocha Deepfake',
    deepfake_card_desc: 'Bulite faịlụ ụda ma ọ bụ vidiyo iji chọpụta ọnụọgụ AI na inweta nkọwa.',
    deepfake_input_placeholder: 'Họrọ faịlụ ụda ma ọ bụ vidiyo...',
    deepfake_button: 'Bulite Media',
    deepfake_detect_btn: 'Chọpụta Deepfake',
    play_learn_title: 'Mee Ihe Ọma',
    play_learn_subtitle: 'Melite nkà nne gị site n’ịmụta na ịkekọrịta na WhatsApp.',
    quiz_title: 'Nzaghachi Akụkọ Ụgha',
    quiz_desc: 'Nwalee onwe gị na ajụjụ dị mkpụmkpụ iji chọpụta ozi ụgha.',
    start_quiz_btn: 'Malite Nzaghachi',
    whatsapp_title: 'Nkwado WhatsApp',
    whatsapp_desc: 'Mepụta ozi WhatsApp dị njikere ịkekọrịta maka ịlele okwu.',
    whatsapp_input_placeholder: 'Tinye nkwupụta ma ọ bụ isiokwu ịchọrọ iji nyochaa...',
    whatsapp_generate: 'Mepụta Ozi',
    whatsapp_copy: 'Detuo Ozi',
    whatsapp_open: 'Meghee WhatsApp',
    language_title: 'Nkwado Asụsụ Ọgbakọ',
    language_desc: 'Họrọ Yoruba, Hausa, ma ọ bụ Igbo maka ahụmịhe nchegharị ka mma.',
    language_info: 'Jiri onye nhọpụta asụsụ n’elu họrọ asụsụ mpaghara gị.',
    result_title: 'Nsonaazụ Nyocha',
    result_ai_analysis: 'Nyocha AI',
    result_sources: 'Isi iyi e hụrụ',
    no_analysis_available: 'Enweghị nkọwa zuru ezu dị.',
    verdict_likely_credible: 'O yiri ka ọ bụ eziokwu',
    verdict_possibly_credible: 'O nwere ike ịbụ eziokwu',
    verdict_uncertain: 'E nweghị nkenke',
    verdict_likely_unreliable: 'O yiri ka ọ bụghị ntụkwasị obi',
    verdict_very_likely_fake: 'O yiri ka ọ bụ ụgha',
    verdict_desc_high: 'Ihe a yiri ka ọ ga-adị ezigbo ntụkwasị obi ma kwado ya site na isi iyi a pụrụ ịdabere na ya.',
    verdict_desc_medium: 'Ihe a yiri ka ọ pụrụ ịbụ eziokwu mana ụfọdụ nkwupụta adịghị edozi.',
    verdict_desc_mixed: 'Ihe a nwere akara ngwakọta — ụfọdụ ihe doro anya ma ụfọdụ adịghị mma.',
    verdict_desc_warning: 'Ihe a na-egosi ihe ngosi siri ike na ọ gaghị adị ntụkwasị obi ma ọ bụ nwere ike ịghọgharia.',
    verdict_desc_fake: 'Ihe a ga-adị ọtụtụ oge ụgha ma ọ bụ nke a na-ezighị ezi. Nwee nchegbu nke ukwuu.'
  }
};

interface LanguageContextProps {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('verifyit-language') as LanguageCode;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'yo' || savedLanguage === 'ha' || savedLanguage === 'ig')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('verifyit-language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
