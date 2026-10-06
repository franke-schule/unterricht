/**
 * Gemeinsamer Apps-Script-Auswertungsserver fuer Informatik-Aufgaben:
 * - inf9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe1.html
 * - inf9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html
 * - inf10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe1.html
 * - inf10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html
 * - inf10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe3.html (zwei Java-Codeauswertungen)
 * - inf10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe4.html (zwei Beschreibe-Aufgaben)
 * - inf10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe5.html (drei Java-Codeauswertungen über mehrere Dateien)
 * - inf10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe6.html (zwei Beschreibe-Aufgaben)
 * - inf10/1-Datenbanken/aufgabe5.html (drei Beschreibe-Aufgaben)
 * - inf10/1-Datenbanken/aufgabe1-quiz.html (eine Beschreibe-Aufgabe, nicht verlinkter Test)
 * - inf10/1-Datenbanken/aufgabe2-quiz.html (eine Beschreibe-Aufgabe, nicht verlinkter Test)
 * - inf10/1-Datenbanken/aufgabe3-quiz.html (zwei Beschreibe-Aufgaben, nicht verlinkter Test)
 * - phy11/1-Kreisbewegungen/wdh2-quiz.html (eine Beschreibe-Aufgabe, nicht verlinkter Test)
 * - phy11/1-Kreisbewegungen/aufgabe3-quiz.html (drei Beschreibe-Aufgaben, nicht verlinkter Test)
 * - phy11/1-Kreisbewegungen/aufgabe4-quiz.html (drei Beschreibe-Aufgaben, nicht verlinkter Test)
 * - inf11/1-Kuenstliche-Intelligenz/aufgabe3a-quiz.html (drei Beschreibe-Aufgaben, nicht verlinkter Test)
 * - inf11/1-Kuenstliche-Intelligenz/aufgabe6.html (Beschreibung und vier Java-Codeauswertungen)
 * - inf11/1-Kuenstliche-Intelligenz/aufgabe7.html (eine Beschreibe-Aufgabe)
 * - inf11/1-Kuenstliche-Intelligenz/aufgabe8.html (eine Beschreibe-Aufgabe)
 * - inf11/2-Codierung-und-Verschluesselung/aufgabe1.html (eine Beschreibe-Aufgabe)
 * - inf9/1-Tabellenkalkulation/aufgabe5a.html und aufgabe5b.html (je eine Beschreibe-Aufgabe)
 *
 * Einrichtung:
 * 1. Alle Dateien aus diesem Ordner in ein Google-Apps-Script-Projekt kopieren.
 * 2. In den Projekteinstellungen eine Script Property anlegen:
 *    GEMINI_API_KEY = dein Gemini API-Key
 * 3. Optional:
 *    GEMINI_MODEL = gemini-3.5-flash
 * 4. Als Web-App bereitstellen:
 *    - Ausfuehren als: Ich
 *    - Zugriff: Jeder
 * 5. Nach Aenderungen die bestehende Bereitstellung auf eine neue Version
 *    aktualisieren. Die vorhandene /exec-URL kann dabei beibehalten werden.
 */

const PROPERTY_API_KEY =
  'GEMINI_API_KEY';

const PROPERTY_MODEL =
  'GEMINI_MODEL';

const DEFAULT_MODEL =
  'gemini-3.5-flash';

const MAX_ANSWER_LENGTH =
  3000;

const MAX_CODE_LENGTH =
  12000;

const CODE_RESULT_CACHE_SECONDS =
  600;

const CODE_REQUEST_TYPE =
  'code';

const CODE_RESULT_REQUEST_TYPE =
  'code-result';

const RESULT_MESSAGE_TYPE =
  'GEMINI_EVALUATION_RESULT';

const CODE_RESULT_MESSAGE_TYPE =
  'GEMINI_CODE_EVALUATION_RESULT';
