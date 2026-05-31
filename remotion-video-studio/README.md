# 🎬 L'Conq Remotion Video Studio - الرندرة المحلية للفيديو

Ce dossier contient un projet **Remotion** autonome permettant de générer vos vidéos TikTok de QCM directement sur votre ordinateur. Cela évite les frais de serveurs externes et offre une vitesse de rendu maximale en utilisant vos ressources locales.

يحتوي هذا المجلد على مشروع **Remotion** مستقل يمكّنك من توليد فيديوهات الـ QCM الخاصة بـ تيكتوك مباشرة على حاسوبك الشخصي. هذا يغنيك عن تكاليف السيرفرات السحابية ويضمن سرعة رندرة قصوى باستغلال كارت الشاشة والمعالج الخاص بجهازك.

---

## 🛠️ Prérequis / المتطلبات الأساسية

1. **Node.js** (installé sur votre machine).
2. **FFmpeg** (requis par Remotion pour encoder les fichiers MP4. Il s'installe automatiquement la première fois, ou vous pouvez l'installer vous-même).

---

## 🚀 Guide Rapide (3 Étapes) / دليل الاستخدام السريع (3 خطوات)

### 1. Installation / التثبيت
Ouvrez votre terminal dans ce dossier (`remotion-video-studio`) et installez les dépendances :
افتح وحدة التحكم (Terminal) في هذا المجلد وقم بتثبيت المكونات:
```bash
npm install
```

### 2. Télécharger le Script JSON / تحميل ملف الـ JSON
- Allez sur votre **Studio Marketing IA** sur l'application.
- Sélectionnez l'examen et la question de votre choix.
- Cliquez sur **"Générer Script JSON"** puis sur **"Télécharger JSON"**.
- Déplacez le fichier téléchargé dans ce dossier et renommez-le `question.json` (ou gardez son nom d'origine).

- ادخل إلى **Studio Marketing IA** في التطبيق.
- اختر الامتحان والسؤال المناسبين.
- اضغط على **"Générer Script JSON"** ثم **"Télécharger JSON"**.
- انقل الملف الذي تم تحميله إلى هذا المجلد وقم بتسميته `question.json`.

### 3. Lancer le Rendu MP4 / توليد الفيديو
Lancez la commande suivante dans votre terminal pour générer le fichier `out.mp4` final :
شغّل الأمر التالي لتوليد ملف الفيديو `out.mp4` النهائي:
```bash
npm run render:props
```

Si vous avez gardé le nom d'origine du fichier (ex: `tiktok_script_question_12.json`), spécifiez-le ainsi :
إذا احتفظت باسم الملف الأصلي، قم بتمريره هكذا:
```bash
npx remotion render src/index.jsx TikTokVideo out.mp4 --props=tiktok_script_question_12.json
```

---

## 💻 Aperçu en direct / المعاينة المباشرة
Vous pouvez prévisualiser la vidéo dans un lecteur interactif local avant de la générer :
يمكنك معاينة الفيديو التفاعلي مباشرة في المتصفح قبل الرندرة عبر تشغيل:
```bash
npm start
```
