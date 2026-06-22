# Minimalist Life Dashboard & Second Brain 🧠

![Minimalist Design](https://img.shields.io/badge/Design-Minimalist_Studio-1A1A1A?style=flat-square)
![Offline First](https://img.shields.io/badge/Architecture-Offline_First-10B981?style=flat-square)
![React](https://img.shields.io/badge/Frontend-React_18-61DAFB?style=flat-square)
![TailwindCSS](https://img.shields.io/badge/Styling-TailwindCSS-38B2AC?style=flat-square)
![Zustand](https://img.shields.io/badge/State-Zustand-orange?style=flat-square)

Ein extrem sauberes, lokales und offline-fähiges Life-Management-System (PWA) für das iPhone und den Desktop. Es vereint ein intelligentes "Second Brain" für Notizen, einen Workout-Tracker (Gym) und einen minimalistischen Finanz-Manager in einer nahtlosen, wunderschönen Applikation.

## ✨ Features

### 1. Second Brain (Notizen & KI)
* **Offline First**: Alle Notizen werden lokal auf deinem Gerät gespeichert (LocalStorage).
* **KI-Integration**: Trage deinen OpenAI API-Key in den Einstellungen ein. Das System generiert lautlos im Hintergrund Zusammenfassungen, analysiert deinen Mood-Score und verknüpft verwandte Ideen.
* **Organisches Netzwerk**: Die *Insights*-Ansicht baut aus deinen Notizen dynamisch einen interaktiven, visuellen Graphen (Wolke) auf.

### 2. Gym Tracker
* **Zero Friction**: Trage dein Körpergewicht und Workout mit zwei Klicks ein.
* **Condition Pics**: Nimm Fotos direkt in der App auf (werden als Base64 lokal im Storage persistiert – keine Cloud nötig!).
* **Consistency Check**: Behalte deine monatlichen Trainings-Sessions in einer cleanen Listenansicht im Blick.

### 3. Finanz Manager
* **Zero-Based Budgeting**: Verteile jeden Euro deines Einkommens auf Sparziele. Kein Restbetrag bleibt ungenutzt.
* **Master-Export**: Ein Klick und die App generiert eine `.zip`-Datei mit allen Tabellen als `.csv` sowie deinen Gym-Fotos als JPGs. Volle Datenkontrolle!

### 4. Cross-Data Intelligence (Insights)
Die App analysiert domänenübergreifend Zusammenhänge:
* Korreliert deine Trainings-Konsistenz mit deiner Sparrate?
* Steigt dein mentaler *Mood-Score* an Tagen mit Gym-Sessions?
Das Dashboard generiert aus diesen Datenpunkten automatisch Motivation und Insights.

## 🚀 Installation & Setup

Da das System zu 100 % im Browser läuft (Client-Side), gibt es keine komplizierten Datenbank-Setups oder Backends. 

1. **Repository klonen**
   ```bash
   git clone https://github.com/dein-username/personal-planner.git
   cd personal-planner
   ```

2. **Abhängigkeiten installieren**
   ```bash
   npm install
   ```

3. **Entwicklungsserver starten**
   ```bash
   npm run dev
   ```

4. *(Optional)* **Als PWA auf dem iPhone installieren**
   Öffne die lokale Netzwerk-URL (z.B. `http://192.168.x.x:5173`) in Safari, tippe auf "Teilen" und wähle **"Zum Home-Bildschirm hinzufügen"**. Die App läuft sofort Fullscreen ohne Browser-Leisten.

## 🔐 Sicherheit & Privatsphäre
**Dein Leben, deine Daten.**
* Keine Datenbank in der Cloud. Kein Tracking.
* Alles wird via `zustand/persist` im LocalStorage deines Browsers gespeichert.
* Der (optionale) OpenAI API-Key wird nicht im Code hardcodiert, sondern direkt in der App eingetippt und nur lokal gespeichert.

## 🎨 Design-Philosophie
Gebaut nach dem **"Minimalist Studio"** Ansatz:
- Monochromatisch (Reines Weiß / Tiefschwarz)
- Warmgraue Nuancen (`#F9F9FB`, `#F3F4F6`)
- Subtile Akzente (z.B. Gold `#D4BA6A` für KI-Elemente)
- Keine Neon-Farben, maximaler Fokus durch viel Whitespace (Padding).

---
*Built with ❤️ for a focused life.*
