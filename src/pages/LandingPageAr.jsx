import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLandingArConfig } from '../services/schoolService';
import { 
  Zap, CheckCircle2, ArrowRight, Sparkles, 
  Sun, Moon, Globe, CreditCard, ShieldCheck, 
  MessageSquare, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import LconqLogo from '../components/LconqLogo';
import WhatsAppButton from '../components/WhatsAppButton';

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ opacity: 0.35 }}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

const planTranslations = {
  ar: {
    plan_lconq: {
      name: "بريميوم L'CONQ",
      description: "الحزمة الكاملة للتفوق والقبول في مباريات المدارس العليا.",
      priceSuffix: "درهم / شهر",
      features: [
        "الوصول لجميع أرشيف المباريات (2010–2025)",
        "حلول سريعة بالذكاء الاصطناعي (Cheat Codes)",
        "محاكي امتحانات تجريبية حقيقية بالوقت",
        "تحديد مواطن الضعف ونسبة التقدم الدراسي"
      ]
    },
    plan_complet: {
      name: "الباقة البريميوم الكاملة السنوية",
      description: "التحضير الأقصى والأنسب على المدى الطويل للتفوق المضمون.",
      priceSuffix: "درهم / سنة",
      features: [
        "الوصول لجميع أرشيف المباريات (2010–2025)",
        "حلول سريعة بالذكاء الاصطناعي (Cheat Codes)",
        "محاكي امتحانات تجريبية حقيقية بالوقت",
        "تحديد مواطن الضعف ونسبة التقدم الدراسي",
        "دعم مباشر ذو أولوية وتحديثات حصرية"
      ]
    }
  },
  fr: {
    plan_lconq: {
      name: "Premium L'CONQ",
      description: "Le pack complet pour la réussite.",
      priceSuffix: "Dh/mois",
      features: [
        "Accès à toutes les archives (2010–2025)",
        "Astuces IA exclusives pour chaque QCM",
        "Simulateur de concours chronométré",
        "Heatmaps des faiblesses"
      ]
    },
    plan_complet: {
      name: "Pack Premium Global",
      description: "La préparation ultime sur le long terme.",
      priceSuffix: "Dh/an",
      features: [
        "Accès à toutes les archives (2010–2025)",
        "Astuces IA exclusives pour chaque QCM",
        "Simulateur de concours chronométré",
        "Heatmaps des faiblesses",
        "Accès prioritaire aux nouveautés"
      ]
    }
  }
};

const content = {
  ar: {
    heroBadge: "مدعوم بالذكاء الاصطناعي ⚡",
    heroTitlePart1: "حضّر لكونكور كليات النخبة بذكاء،",
    heroTitlePart2: "واضمن بلاصتك مع L'CONQ.",
    heroSubtitle: "Médecine · ENSA · ENSAM. حوّل الامتحانات السابقة إلى حصص تفاعلية ذكية مع حلول سريعة (Cheat Codes) وخوارزمية تكرار متباعد تتكيف مع مستوى الحفظ ديالك.",
    ctaStart: "ابدأ التحضير مجاناً",
    ctaDemo: "رؤية عرض توضيحي",
    socialProof: "انضم إلى أكثر من 2,000 طالب وطالبة يستعدون للنجاح",
    
    whySectionTitle: "علاش طريقة L'CONQ كتضمن التفوق ديالك؟",
    whySectionSubtitle: "الكونكور ماشي هو الباكالوريا. السر ماشي في المعرفة بوحدها، بل في السرعة والمنهجية.",
    painPoints: [
      {
        title: "تحدي عامل الوقت الحاسم",
        desc: "في امتحان الباك عندك الوقت تفكر وتكتب بالتفصيل. في الكونكور عندك أقل من 60 ثانية لكل سؤال. كنعلموك كيفاش تجاوب بسرعة البرق."
      },
      {
        title: "الذكاء الاصطناعي كمرشد خاص",
        desc: "كل سؤال مرافق بـ 'Cheat Code' أو طريقة حل سريعة مبرهنة باش تفادى الحسابات الطويلة وتلقى الجواب الصحيح فالحين."
      },
      {
        title: "التكرار المتباعد (SRS)",
        desc: "المنصة كتسجل النقط اللي خطأتي فيها وكتعاود تفكرك فيها تلقائياً فاش كتوشك تنساها، باش نهار الامتحان تلقى راسك حافظ كاع القواعد."
      }
    ],

    featuresTitle: "خصائص المنصة الذكية",
    featuresSubtitle: "أدوات متطورة مصممة لمساعدتك على التفوق بأقل مجهود.",
    featuresList: [
      {
        title: "خوارزمية المراجعة الذكية (SRS)",
        desc: "نظام علمي متكامل يعيد جدولة الأسئلة الصعبة بناءً على إجاباتك. راجع فقط ما تحتاجه وفي الوقت المناسب تماماً لمنع النسيان.",
        image: "/study_mockup.png",
        url: "lconq.ma/study-srs",
        ctaText: "ابدأ المراجعة الذكية مجاناً"
      },
      {
        title: "شروحات وحلول سريعة بالذكاء الاصطناعي (Cheat Codes)",
        desc: "بلاش تضييع الوقت في الحلول التقليدية الطويلة. زر 'Astuce IA' يعطيك أسرار الحل السريع لحل المسائل المعقدة في أقل من دقيقة.",
        image: "/dashboard_mockup.png",
        url: "lconq.ma/ai-tutor",
        ctaText: "جرب حلول الذكاء الاصطناعي مجاناً"
      },
      {
        title: "المحاكاة والترتيب الوطني المباشر",
        desc: "تدرب في ظروف حقيقية مع عداد تنازلي، وقارن مستواك فوراً مع آلاف المترشحين على الصعيد الوطني لتعرف أين تقف بدقة.",
        image: "/ranking_mockup.png",
        url: "lconq.ma/leaderboard",
        ctaText: "دوز امتحان تجريبي واعرف ترتيبك"
      }
    ],

    paymentTitle: "كيفاش تفعل اشتراك البريميوم في المغرب؟",
    paymentSubtitle: "طرق تفعيل سهلة ومحلية 100% لتوفير أقصى درجات الراحة لك ولعائلتك.",
    paymentMethods: [
      {
        title: "التحويل البنكي السريع",
        desc: "دير تحويل لـ CIH Bank أو أي بنك مغربي آخر، رسل لينا التوصيل (Screenshot) على الواتساب وكنفعلوا ليك حسابك في دقائق معدودة.",
        details: "RIB: 230 780 4567890123 0001 89 | باسم: L'CONQ SARL"
      },
      {
        title: "الدفع كاش (Cash Plus / Wafacash)",
        desc: "ما عندكش حساب بنكي؟ ماشي مشكل! تواصل معنا مباشرة على الواتساب باش نعطيوك معلومات التعبئة كاش في أقرب وكالة ليك.",
        details: "متوفر في جميع مدن المغرب"
      },
      {
        title: "البطاقة البنكية الوطنية والدولية",
        desc: "تفعيل فوري وتلقائي 100%. دفع آمن ومشفر مباشرة عبر بوابة الدفع في المنصة للبدء في المراجعة فوراً.",
        details: "آمن ومتوافق مع مركز النقديات CMI"
      }
    ],

    pricingTitle: "اختر العرض المناسب لنجاحك",
    pricingSubtitle: "ابدأ مجاناً وجرب المنصة بنفسك، ثم اختر الباقة المناسبة للتحضير المكثف.",
    priceFree: "باقة مجانية",
    priceFreeDesc: "لتجربة طريقة المراجعة SRS",
    priceFreeFeatures: [
      "إمكانية الوصول لآخر سنتين من الامتحانات",
      "تصحيح إلكتروني فوري",
      "رؤية محدودة للترتيب الوطني",
      "لا تشمل حلول الذكاء الاصطناعي الذكية"
    ],
    ctaSubscribe: "اشترك الآن فالحين",
    ctaStartFree: "ابدأ مجاناً",
    allowedSchoolsLabel: "المدارس المشمولة:",

    faqTitle: "الأسئلة الشائعة حول المنصة",
    faqSubtitle: "كل ما تحتاج لمعرفته للبدء بثقة والتفوق في مباراتك.",
    faqItems: [
      {
        q: "واش منصة L'CONQ كافية باش ننجح فالمباراة؟",
        a: "نعم، المنصة كتجمع كاع الامتحانات السابقة (من 2010 إلى 2025) مصححة بطرق علمية وسريعة، مع فصول الدعم وخوارزميات الحفظ ومحاكاة الامتحانات، وهادشي كافي جداً ومجرب من طرف متفوقين السنوات السابقة."
      },
      {
        q: "شنو هوما الـ Cheat Codes وكيفاش كينفعوني؟",
        a: "الـ Cheat Codes هي تقنيات رياضية وفيزيائية ذكية كتختصر الحلول الطويلة لثواني معدودة. عوض تضيع 5 دقائق في عملية حسابية، كنعلموك كيفاش تستبعد الأجوبة الخاطئة وتلقى الجواب الصحيح فقل من دقيقة."
      },
      {
        q: "تخلصت بالتحويل البنكي، فوقاش كيتفعل الحساب ديالي؟",
        a: "بعد إرسال صورة التحويل لخدمة العملاء عبر الواتساب، كيتم تفعيل حسابك مباشرة وخلال أقل من 10 دقائق، وكنرسلوا ليك كود التفعيل الخاص بك."
      },
      {
        q: "واش كاين ملخصات للدروس ولا غير الامتحانات?‏",
        a: "المنصة كتوفر ملخصات وفيديوهات قصيرة للدروس الصعبة (بحال المتتاليات، الأعداد العقدية، الميكانيك...) اللي كتحط بزاف فالكونكور، باش ترجع للقواعد فاش كتخطأ فشي سؤال."
      }
    ],

    footerText: "حقوق الطبع والنشر © 2026 L'CONQ. جميع الحقوق محفوظة. منصة رائدة للتحضير لمباريات المدارس العليا بالمغرب."
  },
  fr: {
    heroBadge: "Propulsé par l'IA ⚡",
    heroTitlePart1: "Prépare tes concours d'élite,",
    heroTitlePart2: "sécurise ta place avec L'CONQ.",
    heroSubtitle: "Médecine · ENSA · ENSAM. Transforme les annales en révisions interactives grâce à des solutions rapides (Cheat Codes) et une méthode SRS qui s'adapte à ta mémoire.",
    ctaStart: "Commencer gratuitement",
    ctaDemo: "Voir la démo",
    socialProof: "Rejoint par plus de 2 000 bacheliers à travers le Maroc",
    
    whySectionTitle: "Pourquoi la méthode L'CONQ garantit ton succès ?",
    whySectionSubtitle: "Les concours ne sont pas le Bac. La clé n'est pas seulement le savoir, mais la vitesse et la stratégie.",
    painPoints: [
      {
        title: "Le facteur temps crucial",
        desc: "Au Bac, tu as le temps d'expliquer. Au concours, tu as moins de 60 secondes par question. Nous t'apprenons à répondre à la vitesse de l'éclair."
      },
      {
        title: "L'IA comme tuteur privé",
        desc: "Chaque question est accompagnée d'un 'Cheat Code' pour éviter les calculs fastidieux et trouver la bonne option instantanément."
      },
      {
        title: "Répétition espacée (SRS)",
        desc: "La plateforme suit tes faiblesses et te fait réviser exactement ce qu'il faut juste au moment où tu allais l'oublier, pour être prêt le jour J."
      }
    ],

    featuresTitle: "Fonctionnalités Intelligentes",
    featuresSubtitle: "Des outils de pointe conçus pour t'aider à exceller avec un effort optimisé.",
    featuresList: [
      {
        title: "Algorithme de Révision Intelligente (SRS)",
        desc: "Un système scientifique qui planifie tes révisions selon tes performances. Révises uniquement tes points faibles pour ne rien oublier.",
        image: "/study_mockup.png",
        url: "lconq.ma/study-srs",
        ctaText: "Commencer la révision SRS"
      },
      {
        title: "Astuces et Raccourcis IA (Cheat Codes)",
        desc: "Ne perds plus de temps sur les calculs longs. Le bouton 'Astuce IA' te révèle l'astuce pour résoudre les problèmes en moins de 60 secondes.",
        image: "/dashboard_mockup.png",
        url: "lconq.ma/ai-tutor",
        ctaText: "Essayer les Cheat Codes IA"
      },
      {
        title: "Leaderboard & Simulation Nationale",
        desc: "Entraîne-toi en conditions réelles avec minuteur et compare tes résultats en temps réel avec des milliers d'étudiants marocains.",
        image: "/ranking_mockup.png",
        url: "lconq.ma/leaderboard",
        ctaText: "Lancer un test et voir son rang"
      }
    ],

    paymentTitle: "Comment activer ton compte Premium au Maroc ?",
    paymentSubtitle: "Des moyens de paiement simples et 100% locaux pour ta tranquillité d'esprit.",
    paymentMethods: [
      {
        title: "Virement Bancaire Rapide",
        desc: "Effectue un virement sur notre compte CIH ou toute autre banque, envoie le reçu (Capture) par WhatsApp et ton compte est activé en quelques minutes.",
        details: "RIB : 230 780 4567890123 0001 89 | Titulaire : L'CONQ SARL"
      },
      {
        title: "Paiement Cash (Cash Plus / Wafacash)",
        desc: "Pas de compte bancaire ? Aucun problème ! Contacte-nous sur WhatsApp pour effectuer un versement cash dans l'agence la plus proche de chez toi.",
        details: "Disponible partout au Maroc"
      },
      {
        title: "Carte Bancaire Nationale / Internationale",
        desc: "Activation 100% automatique et instantanée. Paiement sécurisé et crypté directement sur notre plateforme pour commencer tes révisions sans attendre.",
        details: "Sécurisé et compatible CMI"
      }
    ],

    pricingTitle: "Choisis la formule adaptée à ta réussite",
    pricingSubtitle: "Commence gratuitement pour tester notre méthode, puis passe à la vitesse supérieure.",
    priceFree: "Formule Gratuite",
    priceFreeDesc: "Pour tester l'algorithme SRS",
    priceFreeFeatures: [
      "Accès aux 2 dernières années d'annales",
      "Correction automatique instantanée",
      "Classement national basique",
      "Sans astuces IA (Cheat Codes)"
    ],
    ctaSubscribe: "S'abonner maintenant",
    ctaStartFree: "S'inscrire",
    allowedSchoolsLabel: "Écoles incluses :",

    faqTitle: "Questions Fréquentes",
    faqSubtitle: "Tout ce que tu dois savoir pour démarrer sereinement et réussir tes concours.",
    faqItems: [
      {
        q: "La plateforme L'CONQ est-elle suffisante pour réussir ?",
        a: "Oui, la plateforme rassemble toutes les annales (2010-2025) corrigées avec des astuces rapides, des fiches de cours clés, un simulateur national et l'algorithme SRS. C'est le pack de préparation le plus complet."
      },
      {
        q: "C'est quoi les Cheat Codes et comment ça m'aide ?",
        a: "Ce sont des méthodes mathématiques et physiques qui simplifient des calculs de plusieurs minutes en astuces de quelques secondes pour répondre juste en moins d'une minute."
      },
      {
        q: "J'ai payé par virement, quand mon compte sera-t-il actif ?",
        a: "Une fois le reçu envoyé à notre support WhatsApp, notre équipe active ton accès Premium en moins de 10 minutes."
      },
      {
        q: "Y a-t-il des fiches de cours ou uniquement des QCM ?",
        a: "La plateforme contient des fiches de révision et vidéos explicatives sur les chapitres les plus récurrents (Suites, Complexes, Mécanique...) pour consolider tes bases."
      }
    ],

    footerText: "Copyright © 2026 L'CONQ. Tous droits réservés. Plateforme leader de préparation aux concours d'accès aux grandes écoles au Maroc."
  }
};

const testimonials = [
  {
    name: "سناء",
    role: "طالبة مقبولة في كلية الطب بالدار البيضاء",
    avatar: "س",
    quote: "بفضل L'Conq قدرت نولف على سرعة الكونكور. التكرار المتباعد عاوني بزاف نعقل على كاع قواعد الرياضيات والفيزياء وطرق الجواب السريع."
  },
  {
    name: "يوسف",
    role: "طالب مقبول في المدرسة الوطنية للعلوم التطبيقية ENSA",
    avatar: "ي",
    quote: "الـ Cheat codes ديال الذكاء الاصطناعي هما اللي عتقوني فاش كان الوقت ضيق بزاف فامتحان الهندسة والفيزياء. أنصح به بشدة."
  },
  {
    name: "هدى",
    role: "طالبة مقبولة في المدرسة الوطنية العليا للفنون والمهن ENSAM",
    avatar: "ه",
    quote: "المحاكاة والامتحانات التجريبية المباشرة عطاتني ثقة كبيرة ف راسي. الترتيب الوطني عاوني نعرف مستواي الحقيقي مقارنة بالآخرين."
  }
];

export default function LandingPageAr() {
  const { theme, toggleTheme, plans, user } = useAuth();
  const isLight = theme === 'light';
  
  const [lang, setLang] = useState('ar');
  const [openFaq, setOpenFaq] = useState(null);
  
  const isRtl = lang === 'ar';
  const t = content[lang];

  // Dynamic configurations loadable by the admin/manager
  const [heroBadgeAr, setHeroBadgeAr] = useState("مدعوم بالذكاء الاصطناعي ⚡");
  const [heroTitlePart1Ar, setHeroTitlePart1Ar] = useState("حضّر لكونكور كليات النخبة بذكاء،");
  const [heroTitlePart2Ar, setHeroTitlePart2Ar] = useState("واضمن بلاصتك مع L'CONQ.");
  const [heroSubtitleAr, setHeroSubtitleAr] = useState("Médecine · ENSA · ENSAM. حوّل الامتحانات السابقة إلى حصص تفاعلية ذكية مع حلول سريعة (Cheat Codes) وخوارزمية تكرار متباعد تتكيف مع مستوى الحفظ ديالك.");
  
  const [featuresListAr, setFeaturesListAr] = useState([
    {
      title: "خوارزمية المراجعة الذكية (SRS)",
      desc: "نظام علمي متكامل يعيد جدولة الأسئلة الصعبة بناءً على إجاباتك. راجع فقط ما تحتاجه وفي الوقت المناسب تماماً لمنع النسيان.",
      image: "/study_mockup.png",
      url: "lconq.ma/study-srs",
      ctaText: "ابدأ المراجعة الذكية مجاناً"
    },
    {
      title: "شروحات وحلول سريعة بالذكاء الاصطناعي (Cheat Codes)",
      desc: "بلاش تضييع الوقت في الحلول التقليدية الطويلة. زر 'Astuce IA' يعطيك أسرار الحل السريع لحل المسائل المعقدة في أقل من دقيقة.",
      image: "/dashboard_mockup.png",
      url: "lconq.ma/ai-tutor",
      ctaText: "جرب حلول الذكاء الاصطناعي مجاناً"
    },
    {
      title: "المحاكاة والترتيب الوطني المباشر",
      desc: "تدرب في ظروف حقيقية مع عداد تنازلي، وقارن مستواك فوراً مع آلاف المترشحين على الصعيد الوطني لتعرف أين تقف بدقة.",
      image: "/ranking_mockup.png",
      url: "lconq.ma/leaderboard",
      ctaText: "دوز امتحان تجريبي واعرف ترتيبك"
    }
  ]);

  const [showPainPoints, setShowPainPoints] = useState(true);
  const [showPayments, setShowPayments] = useState(true);
  const [showPricing, setShowPricing] = useState(true);
  const [showFaqs, setShowFaqs] = useState(true);
  const [showTestimonials, setShowTestimonials] = useState(true);

  useEffect(() => {
    const loadLandingConfig = async () => {
      try {
        const cfg = await getLandingArConfig();
        if (cfg) {
          if (cfg.heroBadgeAr) setHeroBadgeAr(cfg.heroBadgeAr);
          if (cfg.heroTitlePart1Ar) setHeroTitlePart1Ar(cfg.heroTitlePart1Ar);
          if (cfg.heroTitlePart2Ar) setHeroTitlePart2Ar(cfg.heroTitlePart2Ar);
          if (cfg.heroSubtitleAr) setHeroSubtitleAr(cfg.heroSubtitleAr);
          if (cfg.featuresAr) setFeaturesListAr(cfg.featuresAr);
          if (cfg.showPainPoints !== undefined) setShowPainPoints(cfg.showPainPoints);
          if (cfg.showPayments !== undefined) setShowPayments(cfg.showPayments);
          if (cfg.showPricing !== undefined) setShowPricing(cfg.showPricing);
          if (cfg.showFaqs !== undefined) setShowFaqs(cfg.showFaqs);
          if (cfg.showTestimonials !== undefined) setShowTestimonials(cfg.showTestimonials);
        }
      } catch (err) {
        console.warn("Failed to load landing configuration:", err);
      }
    };
    loadLandingConfig();
  }, []);

  const featuresToShow = lang === 'ar' ? featuresListAr : t.featuresList;

  return (
    <div style={{ 
      background: 'var(--bg-base)', 
      minHeight: '100vh', 
      color: 'var(--text-main)', 
      transition: 'background 0.3s, color 0.3s',
      direction: isRtl ? 'rtl' : 'ltr',
      fontFamily: isRtl ? "'Cairo', sans-serif" : "'Plus Jakarta Sans', sans-serif"
    }}>
      <style>{`
        .features-container {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .feature-row {
          display: flex;
          align-items: center;
          gap: 4rem;
          padding-bottom: 6rem;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .feature-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .feature-row.even {
          flex-direction: row;
        }
        .feature-row.odd {
          flex-direction: row-reverse;
        }
        .feature-text-col {
          flex: 1 1 400px;
          text-align: start;
        }
        .feature-image-col {
          flex: 1 1 450px;
          display: flex;
          justify-content: center;
          position: relative;
        }
        .feature-title {
          font-size: 1.65rem;
          font-weight: 800;
          margin-bottom: 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          justify-content: flex-start;
        }
        
        @media (max-width: 768px) {
          .feature-row {
            flex-direction: column !important;
            gap: 1.75rem !important;
            padding-bottom: 3.5rem !important;
          }
          .feature-text-col {
            flex: 1 1 auto !important;
            width: 100% !important;
            text-align: center !important;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .feature-title {
            justify-content: center !important;
            width: 100%;
          }
          .feature-text-col .btn-emerald {
            width: 100% !important;
            max-width: 320px;
            justify-content: center !important;
          }
          .feature-image-col {
            flex: 1 1 auto !important;
            width: 100% !important;
          }
        }
      `}</style>

      {/* ── Navbar ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: isLight ? 'rgba(255,255,255,0.95)' : 'rgba(15,23,42,0.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
        boxShadow: isLight ? '0 1px 8px rgba(15,23,42,0.08)' : 'none',
        padding: '0 1.25rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
        transition: 'background 0.3s, box-shadow 0.3s',
      }}>
        <LconqLogo size={32} textSize="1.15rem" />
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Language Toggle */}
          <button
            onClick={() => setLang(prev => prev === 'ar' ? 'fr' : 'ar')}
            style={{
              background: 'var(--violet-soft)', border: '1px solid rgba(99,102,241,0.3)',
              color: 'var(--violet)',
              cursor: 'pointer', padding: '6px 12px', borderRadius: '8px',
              fontSize: '0.78rem', fontWeight: 700,
              display: 'flex', alignItems: 'center', gap: '4px', transition: 'all 0.2s',
              fontFamily: isRtl ? "'Cairo', sans-serif" : "'Plus Jakarta Sans', sans-serif"
            }}
          >
            <Globe size={13} />
            {lang === 'ar' ? 'Français' : 'العربية'}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={isLight ? 'Mode sombre' : 'Mode clair'}
            style={{
              background: 'transparent', border: '1px solid var(--border)',
              color: isLight ? 'var(--violet)' : 'var(--warning)',
              cursor: 'pointer', padding: '6px 10px', borderRadius: '8px',
              display: 'flex', alignItems: 'center', transition: 'all 0.2s',
              flexShrink: 0
            }}
          >
            {isLight ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {user ? (
            <Link to={user.role === 'admin' ? "/admin/dashboard" : "/dashboard"} className="btn" style={{ textDecoration: 'none', padding: '0.5rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap', fontWeight: 700 }}>
              {isRtl ? 'لوحة التحكم' : 'Dashboard'} <ArrowRight size={12} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none', fontWeight: 700, fontSize: '0.82rem', padding: '0.5rem 0.65rem', whiteSpace: 'nowrap' }}>
                {isRtl ? 'تسجيل الدخول' : 'Connexion'}
              </Link>
              <Link to="/register" className="btn" style={{ textDecoration: 'none', padding: '0.5rem 0.85rem', fontSize: '0.8rem', whiteSpace: 'nowrap', fontWeight: 700 }}>
                {isRtl ? 'البدء مجاناً' : 'Commencer'}
              </Link>
            </>
          )}
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: '960px', margin: '0 auto',
        padding: 'clamp(2rem, 5vw, 3.5rem) 1.25rem clamp(1.25rem, 3.5vw, 1.75rem)',
        textAlign: 'center',
        position: 'relative',
        boxSizing: 'border-box'
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)',
          width: 'min(700px, 95vw)', height: '320px',
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 70%)',
          pointerEvents: 'none', zIndex: 0,
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Glowing Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
            background: 'var(--violet-soft)', border: '1px solid rgba(99,102,241,0.3)',
            padding: '0.4rem 0.95rem', borderRadius: '99px',
            fontSize: '0.75rem', fontWeight: 800, color: 'var(--violet)',
            marginBottom: '1rem',
            boxShadow: '0 4px 15px rgba(99,102,241,0.08)',
          }}>
            <Sparkles size={12} /> {lang === 'ar' ? heroBadgeAr : t.heroBadge}
          </div>

          <h1 style={{ 
            fontSize: 'clamp(1.95rem, 5.5vw, 3.4rem)', 
            fontWeight: 900, 
            lineHeight: 1.15, 
            marginBottom: '1.25rem', 
            letterSpacing: '-0.02em',
            padding: '0 0.5rem'
          }}>
            {lang === 'ar' ? heroTitlePart1Ar : t.heroTitlePart1}{' '}
            <span className="text-gradient" style={{ background: 'linear-gradient(135deg, var(--violet), var(--emerald))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {lang === 'ar' ? heroTitlePart2Ar : t.heroTitlePart2}
            </span>
          </h1>

          <p style={{ 
            fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', 
            color: 'var(--text-muted)', 
            maxWidth: '680px', 
            margin: '0 auto 1.5rem', 
            lineHeight: 1.65,
            padding: '0 0.5rem'
          }}>
            {lang === 'ar' ? heroSubtitleAr : t.heroSubtitle}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '480px', margin: '0 auto' }}>
            {user ? (
              <Link to="/dashboard" className="btn-emerald" style={{ textDecoration: 'none', fontSize: '0.95rem', padding: '0.85rem 1.75rem', flex: '1 1 180px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
                <Zap size={16} /> {isRtl ? 'لوحة التحكم الخاصة بي' : 'Accéder au Dashboard'}
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-emerald" style={{ textDecoration: 'none', fontSize: '0.95rem', padding: '0.85rem 1.75rem', flex: '1 1 180px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 800, boxShadow: '0 8px 24px rgba(52,211,153,0.25)' }}>
                  <Zap size={16} /> {t.ctaStart}
                </Link>
                <Link to="/login" className="btn-outline" style={{ textDecoration: 'none', fontSize: '0.95rem', padding: '0.85rem 1.75rem', flex: '1 1 180px', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
                  {t.ctaDemo} <ArrowRight size={14} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Visual Feature Showcases (Step-by-step screenshots & CTAs next to each) ── */}
      <section style={{ 
        maxWidth: '1100px', margin: '0 auto', 
        padding: '1.75rem 1.25rem 4.5rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
            {t.featuresTitle}
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
            {t.featuresSubtitle}
          </p>
        </div>

        <div className="features-container">
          {featuresToShow.map((feature, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div 
                key={idx} 
                className={`feature-row ${isEven ? 'even' : 'odd'}`}
              >
                {/* Feature Description & Register Button */}
                <div className="feature-text-col">
                  <h3 className="feature-title">
                    <span>{feature.title}</span>
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
                    {feature.desc}
                  </p>
                  
                  {/* Dynamic Registration Button next to the feature */}
                  <Link 
                    to="/register" 
                    className="btn-emerald" 
                    style={{ 
                      textDecoration: 'none', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: '10px', 
                      fontWeight: 800, 
                      fontSize: '0.95rem', 
                      padding: '0.85rem 1.75rem',
                      boxShadow: '0 8px 20px rgba(52,211,153,0.2)',
                      borderRadius: '10px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; }}
                  >
                    <Zap size={16} />
                    {feature.ctaText}
                  </Link>
                </div>

                {/* Screenshot Display with Simulated Browser Window Frame */}
                <div className="feature-image-col">
                  {/* Neon Glow effect behind mockup */}
                  <div style={{
                    position: 'absolute', inset: '10%',
                    background: idx === 0 ? 'var(--violet)' : idx === 1 ? 'var(--warning)' : 'var(--emerald)',
                    filter: 'blur(50px)',
                    opacity: 0.12,
                    zIndex: 0
                  }} />

                  {/* Browser Mockup Window */}
                  <div style={{
                    background: isLight ? '#f8fafc' : '#1e293b',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                    width: '100%',
                    maxWidth: '520px',
                    position: 'relative',
                    zIndex: 1,
                    boxSizing: 'border-box'
                  }}>
                    {/* Browser Mockup Title Bar */}
                    <div style={{
                      height: '36px',
                      background: isLight ? '#e2e8f0' : '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 12px',
                      gap: '6px',
                      borderBottom: '1px solid var(--border)',
                      direction: 'ltr' // Always LTR for browser controls
                    }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ff5f56' }}></span>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ffbd2e' }}></span>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#27c93f' }}></span>
                      <span style={{
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        fontSize: '0.7rem',
                        color: 'var(--text-subtle)',
                        fontFamily: 'monospace',
                        opacity: 0.8
                      }}>
                        {feature.url}
                      </span>
                    </div>

                    {/* App Screenshot Image */}
                    <img 
                      src={feature.image} 
                      alt={feature.title} 
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block',
                        transition: 'transform 0.4s ease',
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={e => e.currentTarget.style.transform = ''}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Pain Points (BAC vs Concours) ── */}
      {showPainPoints && (
        <section style={{ 
          maxWidth: '1100px', margin: '0 auto', 
          padding: '3rem 1.25rem', 
          borderTop: '1px solid rgba(255,255,255,0.04)' 
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
              {t.whySectionTitle}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '620px', margin: '0 auto' }}>
              {t.whySectionSubtitle}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {t.painPoints.map((item, index) => {
              const colors = [
                { border: 'rgba(239, 68, 68, 0.2)', text: 'var(--rose)', soft: 'rgba(239, 68, 68, 0.04)' },
                { border: 'rgba(245, 158, 11, 0.2)', text: 'var(--warning)', soft: 'rgba(245, 158, 11, 0.04)' },
                { border: 'rgba(16, 185, 129, 0.2)', text: 'var(--emerald)', soft: 'rgba(16, 185, 129, 0.04)' }
              ];
              const currentC = colors[index % colors.length];

              return (
                <div 
                  key={index} 
                  className="glass-panel" 
                  style={{
                    background: isLight ? '#ffffff' : 'var(--bg-card)',
                    border: `1px solid ${currentC.border}`,
                    padding: '2rem 1.5rem',
                    borderRadius: '16px',
                    boxShadow: 'var(--shadow-card)',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.625rem', 
                    marginBottom: '1rem', color: currentC.text, fontWeight: 800, fontSize: '1.15rem' 
                  }}>
                    <CheckCircle2 size={20} />
                    <span>{item.title}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.7, margin: 0 }}>
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Local Morocco Payment Information ── */}
      {showPayments && (
        <section style={{
          background: isLight ? 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' : 'linear-gradient(180deg, rgba(15,23,42,0) 0%, rgba(30,41,59,0.3) 100%)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          padding: '5rem 1.25rem'
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                background: 'var(--emerald-soft)', border: '1px solid rgba(16,185,129,0.3)',
                padding: '0.4rem 0.95rem', borderRadius: '99px',
                fontSize: '0.75rem', fontWeight: 800, color: 'var(--emerald)',
                marginBottom: '1rem'
              }}>
                <ShieldCheck size={12} /> {isRtl ? 'طرق دفع آمنة ومحلية 100%' : 'Paiements Sécurisés & Marocains'}
              </div>
              <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
                {t.paymentTitle}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
                {t.paymentSubtitle}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {t.paymentMethods.map((method, idx) => (
                <div 
                  key={idx}
                  className="glass-panel"
                  style={{
                    background: isLight ? '#ffffff' : 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '2rem 1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                      <div style={{ 
                        width: '42px', height: '42px', borderRadius: '50%', 
                        background: 'rgba(52,211,153,0.1)', display: 'flex', 
                        alignItems: 'center', justifyContent: 'center', color: 'var(--emerald)'
                      }}>
                        {idx === 0 ? <Globe size={20} /> : idx === 1 ? <MessageSquare size={20} /> : <CreditCard size={20} />}
                      </div>
                      <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
                        {method.title}
                      </h3>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                      {method.desc}
                    </p>
                  </div>
                  <div style={{ 
                    background: 'var(--bg-base)', 
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px', 
                    fontSize: '0.8rem', 
                    color: 'var(--text-subtle)',
                    fontFamily: idx === 0 ? 'monospace' : 'inherit',
                    border: '1px solid var(--border)',
                    textAlign: idx === 0 ? 'left' : 'center',
                    direction: 'ltr'
                  }}>
                    {method.details}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '3rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                {isRtl ? 'عندك أي تساؤل بخصوص طرق الدفع؟ تواصل معنا مباشرة عبر الواتساب :' : 'Une question sur le paiement ? Écris-nous sur WhatsApp :'}
              </p>
              <a 
                href="https://wa.me/212600000000"
                target="_blank" 
                rel="noopener noreferrer"
                className="btn-emerald"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                <MessageSquare size={16} />
                {isRtl ? 'تواصل معنا فالحين عبر الواتساب' : 'Support Client WhatsApp'}
              </a>
            </div>
          </div>
        </section>
      )}

      {/* ── Pricing ── */}
      {showPricing && (
        <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '5rem 1.25rem 5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
              {t.pricingTitle}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              {t.pricingSubtitle}
            </p>
          </div>

          <div className="pricing-grid" style={{ alignItems: 'stretch' }}>
            {/* Freemium */}
            <div className="glass-panel" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between',
              background: isLight ? '#ffffff' : 'var(--bg-card)',
              border: isLight ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid var(--border)',
              boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.03)' : 'var(--shadow-card)',
              padding: '2.25rem 2rem',
              borderRadius: '20px'
            }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.5rem', color: isLight ? 'var(--navy-900)' : 'var(--text-main)' }}>
                  {t.priceFree}
                </h3>
                <div style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'baseline', gap: '0.25rem', color: isLight ? 'var(--navy-900)' : 'var(--text-main)' }}>
                  0 <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>{isRtl ? 'درهم / شهر' : 'Dh/mois'}</span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem' }}>
                  {t.priceFreeDesc}
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', padding: 0 }}>
                  {t.priceFreeFeatures.map((label, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9rem', color: idx < 2 ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                      {idx < 2 ? <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink: 0 }} /> : <XIcon />}
                      <span style={{ textDecoration: idx < 2 ? 'none' : 'line-through' }}>{label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Link to={user ? "/dashboard" : "/register"} className="btn-outline" style={{ width: '100%', textDecoration: 'none', justifyContent: 'center', padding: '0.75rem', fontWeight: 700 }}>
                {user ? (isRtl ? "الذهاب للوحة التحكم" : "Accéder au dashboard") : t.ctaStartFree}
              </Link>
            </div>

            {/* Dynamic Premium Plans */}
            {plans && plans.map((plan) => {
              const isRecommended = !!plan.isRecommended;
              const localizedPlan = planTranslations[lang]?.[plan.id] || {
                name: plan.name,
                description: plan.description || "Le pack complet pour la réussite.",
                priceSuffix: plan.durationDays === 365 ? (isRtl ? 'درهم / سنة' : 'Dh/an') : (isRtl ? 'درهم / شهر' : 'Dh/mois'),
                features: plan.features
              };

              return (
                <div 
                  key={plan.id}
                  className="glass-panel" 
                  style={{
                    border: isRecommended ? '2px solid rgba(99,102,241,0.6)' : (isLight ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid var(--border)'),
                    background: isRecommended 
                      ? (isLight 
                          ? 'linear-gradient(145deg, #ffffff, #f5f7ff)' 
                          : 'linear-gradient(145deg, rgba(99,102,241,0.1), rgba(15,23,42,0.85))')
                      : (isLight ? '#ffffff' : 'var(--bg-card)'),
                    boxShadow: isRecommended 
                      ? (isLight ? '0 20px 40px rgba(99,102,241,0.18)' : '0 20px 40px rgba(99,102,241,0.35)')
                      : (isLight ? '0 10px 30px rgba(0,0,0,0.03)' : 'var(--shadow-card)'),
                    position: 'relative', 
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transform: isRecommended ? 'scale(1.03)' : 'none',
                    zIndex: isRecommended ? 5 : 1,
                    padding: '2.25rem 2rem',
                    borderRadius: '20px'
                  }}
                >
                  {/* Glowing border accent */}
                  {isRecommended && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                      background: 'linear-gradient(90deg, var(--violet), var(--emerald))',
                    }} />
                  )}
                  
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                      <h3 style={{ fontWeight: 850, fontSize: '1.3rem', margin: 0, color: isRecommended ? 'var(--violet)' : (isLight ? 'var(--navy-900)' : 'var(--text-main)') }}>
                        {localizedPlan.name}
                      </h3>
                      {isRecommended && (
                        <span className="badge badge-pro" style={{
                          background: 'linear-gradient(135deg, var(--violet), #818cf8)',
                          color: '#fff',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          padding: '4px 8px',
                          borderRadius: '12px'
                        }}>
                          <Zap size={9} fill="currentColor" /> {isRtl ? 'موصى به' : 'RECOMMANDÉ'}
                        </span>
                      )}
                    </div>
                    
                    <div style={{ fontSize: '2.8rem', fontWeight: 900, marginBottom: '0.5rem', color: isLight ? 'var(--navy-900)' : 'var(--text-main)', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                      {plan.price} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>{localizedPlan.priceSuffix}</span>
                    </div>
                    
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                      {localizedPlan.description}
                    </p>
                    
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem', padding: 0 }}>
                      {localizedPlan.features && localizedPlan.features.map((label, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', fontSize: '0.9rem' }}>
                          <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink: 0 }} />
                          <span>{label}</span>
                        </li>
                      ))}
                      
                      {plan.allowedSchools && plan.allowedSchools.length > 0 && (
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', fontSize: '0.85rem', borderTop: isLight ? '1px solid rgba(226, 232, 240, 0.8)' : '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                          <CheckCircle2 size={16} color="var(--emerald)" style={{ flexShrink: 0, opacity: 0.7 }} />
                          <div>
                            <strong style={{ color: isLight ? 'var(--navy-800)' : 'var(--text-main)' }}>{t.allowedSchoolsLabel}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                              {plan.allowedSchools.join(', ')}
                            </div>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                  
                  <Link to={user ? "/subscription" : "/register"} className="btn-emerald" style={{ 
                    width: '100%', 
                    textDecoration: 'none', 
                    justifyContent: 'center', 
                    marginTop: 'auto',
                    gap: '0.5rem',
                    fontWeight: 800,
                    padding: '0.75rem'
                  }}>
                    <Zap size={15} fill={isRecommended ? "currentColor" : "none"} /> {t.ctaSubscribe}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Testimonials ── */}
      {showTestimonials && (
        <section style={{
          maxWidth: '1100px', margin: '0 auto',
          padding: '3rem 1.25rem 5rem',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
              {isRtl ? 'قصص نجاح طلبتنا' : 'Témoignages de nos Admis'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              {isRtl ? 'شكون حسن من الطلبة اللي دوزوا نفس التجربة ونعجوا فيها للتحدث عن المنصة ؟' : 'Découvre l\'avis de ceux qui ont réussi grâce à L\'CONQ.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {testimonials.map((t, idx) => (
              <div 
                key={idx}
                className="glass-panel"
                style={{
                  padding: '2rem 1.5rem',
                  borderRadius: '16px',
                  background: isLight ? '#ffffff' : 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                  " {t.quote} "
                </p>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--violet), var(--emerald))',
                    color: '#fff',
                    fontWeight: 900,
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {t.avatar}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '0.95rem', margin: 0 }}>{t.name}</h4>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>{t.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ Section (Accordions) ── */}
      {showFaqs && (
        <section style={{ 
          maxWidth: '840px', margin: '0 auto', 
          padding: '2rem 1.25rem 7rem' 
        }}>
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', fontWeight: 800, marginBottom: '0.75rem' }}>
              {t.faqTitle}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
              {t.faqSubtitle}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {t.faqItems.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div 
                  key={idx}
                  className="glass-panel"
                  style={{
                    background: isLight ? '#ffffff' : 'var(--bg-card)',
                    border: isOpen ? '1px solid rgba(99,102,241,0.5)' : '1px solid var(--border)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      padding: '1.25rem 1.5rem',
                      textAlign: isRtl ? 'right' : 'left',
                      color: 'var(--text-main)',
                      fontWeight: 750,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      fontFamily: 'inherit'
                    }}
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  <div style={{
                    maxHeight: isOpen ? '300px' : '0',
                    overflow: 'hidden',
                    transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}>
                    <p style={{
                      padding: '0 1.5rem 1.5rem',
                      margin: 0,
                      color: 'var(--text-muted)',
                      fontSize: '0.92rem',
                      lineHeight: 1.65,
                      borderTop: '1px solid rgba(255,255,255,0.03)'
                    }}>
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '2.5rem 1.25rem',
        textAlign: 'center',
        background: isLight ? '#f8fafc' : 'rgba(9, 9, 11, 0.5)'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <LconqLogo size={28} textSize="1.05rem" />
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.8rem', margin: 0, maxWidth: '600px', lineHeight: 1.6 }}>
            {t.footerText}
          </p>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <WhatsAppButton />
    </div>
  );
}
