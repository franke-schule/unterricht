/**
 * Gemeinsamer Apps-Script-Auswertungsserver fuer Informatik-Aufgaben:
 * - inf9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe1.html
 * - inf9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html
 * - inf10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe1.html
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
 */

const PROPERTY_API_KEY =
  'GEMINI_API_KEY';

const PROPERTY_MODEL =
  'GEMINI_MODEL';

const DEFAULT_MODEL =
  'gemini-3.5-flash';

const MAX_ANSWER_LENGTH =
  3000;

const RESULT_MESSAGE_TYPE =
  'GEMINI_EVALUATION_RESULT';
