/**
 * Gemeinsamer Apps-Script-Auswertungsserver fuer Informatik-Aufgaben:
 * - inf9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe1.html
 * - inf9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html
 * - inf10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe1.html
 * - inf10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html
 * - inf10/1-Datenbanken/aufgabe5.html (zwei Beschreibe-Aufgaben)
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
