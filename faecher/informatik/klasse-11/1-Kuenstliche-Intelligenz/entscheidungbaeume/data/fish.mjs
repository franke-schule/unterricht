export const FISH_LABELS = Object.freeze({
  PEACEFUL: "friedlich",
  HOSTILE: "feindselig",
});

export const FISH_FEATURES = Object.freeze({
  scalesBlue: Object.freeze({ label: "Schuppenfarbe", yes: "Blau", no: "Orange" }),
  patternNone: Object.freeze({ label: "Muster", yes: "Ohne", no: "Punkte" }),
  bellyBlack: Object.freeze({ label: "Bauchfarbe", yes: "Schwarz", no: "Weiß" }),
  finsYellow: Object.freeze({ label: "Flossenfarbe", yes: "Gelb", no: "Rot" }),
});

const fish = (id, pattern, belly, scales, fins, classification) => Object.freeze({
  id,
  classification,
  values: Object.freeze({
    scalesBlue: scales === "Blau" ? "Blau" : "Orange",
    patternNone: pattern === "Ohne" ? "Ohne" : "Punkte",
    bellyBlack: belly === "Schwarz" ? "Schwarz" : "Weiß",
    finsYellow: fins === "Gelb" ? "Gelb" : "Rot",
  }),
  features: Object.freeze({
    scalesBlue: scales === "Blau",
    patternNone: pattern === "Ohne",
    bellyBlack: belly === "Schwarz",
    finsYellow: fins === "Gelb",
  }),
});

// Quelle: Datensatz_Fische_Einstieg_Trainingsdaten.csv im Unterrichtsmaterial.
export const FISH_DATASET = Object.freeze([
  fish("F1", "Ohne", "Weiß", "Orange", "Gelb", FISH_LABELS.HOSTILE),
  fish("F2", "Ohne", "Weiß", "Orange", "Rot", FISH_LABELS.HOSTILE),
  fish("F3", "Ohne", "Schwarz", "Blau", "Gelb", FISH_LABELS.PEACEFUL),
  fish("F4", "Ohne", "Weiß", "Blau", "Gelb", FISH_LABELS.PEACEFUL),
  fish("F5", "Punkte", "Schwarz", "Blau", "Rot", FISH_LABELS.HOSTILE),
  fish("F6", "Punkte", "Schwarz", "Blau", "Gelb", FISH_LABELS.HOSTILE),
  fish("F7", "Punkte", "Weiß", "Orange", "Gelb", FISH_LABELS.HOSTILE),
  fish("F8", "Punkte", "Weiß", "Blau", "Rot", FISH_LABELS.PEACEFUL),
  fish("F9", "Punkte", "Schwarz", "Orange", "Rot", FISH_LABELS.PEACEFUL),
]);

export const FISH_FEATURE_KEYS = Object.freeze(Object.keys(FISH_FEATURES));

