export const CLASSIFICATIONS = Object.freeze({
  BITES: "bites",
  DOES_NOT_BITE: "does-not-bite",
});

export const FEATURE_DEFINITIONS = Object.freeze({
  smilingMouth: {
    key: "smilingMouth",
    label: "Lächelt der Mund?",
    group: "additional",
    description: "Gemeint ist die lächelnde Mundform. Eine herausgestreckte Zunge zählt dabei nicht als Lächeln.",
  },
  xEyes: {
    key: "xEyes",
    label: "X-Augen?",
    group: "additional",
  },
  openMouth: {
    key: "openMouth",
    label: "Offener Mund?",
    group: "regular",
  },
  eyeOpen: {
    key: "eyeOpen",
    label: "Mindestens ein Auge offen?",
    group: "regular",
  },
  accessory: {
    key: "accessory",
    label: "Accessoire?",
    group: "regular",
  },
  tongueOut: {
    key: "tongueOut",
    label: "Zunge raus?",
    group: "regular",
  },
  teethVisible: {
    key: "teethVisible",
    label: "Zähne sichtbar?",
    group: "regular",
  },
});

export const EASY_FEATURE_KEYS = Object.freeze([
  "smilingMouth",
  "xEyes",
  "openMouth",
  "eyeOpen",
  "accessory",
  "tongueOut",
  "teethVisible",
]);

export const ADVANCED_FEATURE_KEYS = Object.freeze([
  "openMouth",
  "eyeOpen",
  "accessory",
  "tongueOut",
  "teethVisible",
]);

function monkey(id, features) {
  return Object.freeze({
    id,
    imageFile: `${id}.png`,
    image: `entscheidungbaeume/assets/monkeys/${id}.png`,
    features: Object.freeze({
      openMouth: false,
      eyeOpen: false,
      accessory: false,
      tongueOut: false,
      teethVisible: false,
      smilingMouth: false,
      xEyes: false,
      ...features,
    }),
  });
}

// Die Merkmale wurden einmalig anhand der Originalgrafiken erfasst. Zur Laufzeit
// findet bewusst keine Bilderkennung statt. Frisuren zählen nicht als Accessoire.
export const MONKEYS = Object.freeze([
  monkey("01", { openMouth: true, eyeOpen: true, teethVisible: true }),
  monkey("02", { openMouth: true, eyeOpen: true, teethVisible: true }),
  monkey("03", { openMouth: true, teethVisible: true, xEyes: true }),
  monkey("04", { openMouth: true, teethVisible: true }),
  monkey("05", { eyeOpen: true, smilingMouth: true }),
  monkey("06", { eyeOpen: true, smilingMouth: true }),
  monkey("07", { xEyes: true }),
  monkey("08", { smilingMouth: true }),
  monkey("09", { eyeOpen: true }),
  monkey("10", { eyeOpen: true }),
  monkey("11", { xEyes: true }),
  monkey("12", {}),
  monkey("13", { openMouth: true, eyeOpen: true }),
  monkey("14", { openMouth: true, eyeOpen: true }),
  monkey("15", { openMouth: true, xEyes: true }),
  monkey("16", { openMouth: true }),
  monkey("17", { openMouth: true, eyeOpen: true, tongueOut: true }),
  monkey("18", { openMouth: true, eyeOpen: true, tongueOut: true }),
  monkey("19", { openMouth: true, tongueOut: true, xEyes: true }),
  monkey("20", { openMouth: true, tongueOut: true }),
  monkey("21", { accessory: true, smilingMouth: true }),
  monkey("22", { openMouth: true, eyeOpen: true, accessory: true, teethVisible: true }),
  monkey("23", { openMouth: true, accessory: true, teethVisible: true, xEyes: true }),
  monkey("24", { openMouth: true, teethVisible: true }),
  monkey("25", { eyeOpen: true, accessory: true, smilingMouth: true }),
  monkey("26", { eyeOpen: true, accessory: true }),
  monkey("27", { xEyes: true }),
  monkey("28", { eyeOpen: true, smilingMouth: true }),
  monkey("29", { accessory: true }),
  monkey("30", { eyeOpen: true, accessory: true }),
  monkey("31", { accessory: true, xEyes: true }),
  monkey("32", { accessory: true }),
  monkey("33", { openMouth: true, eyeOpen: true, accessory: true }),
  monkey("34", { openMouth: true, eyeOpen: true, accessory: true }),
  monkey("35", { openMouth: true, xEyes: true }),
  monkey("36", { openMouth: true, accessory: true }),
  monkey("37", { openMouth: true, eyeOpen: true, accessory: true, tongueOut: true }),
  monkey("38", { openMouth: true, eyeOpen: true, accessory: true, tongueOut: true }),
  monkey("39", { openMouth: true, accessory: true, tongueOut: true, xEyes: true }),
  monkey("40", { openMouth: true, tongueOut: true }),
]);

const MONKEYS_BY_ID = new Map(MONKEYS.map((entry) => [entry.id, entry]));

export function getMonkeyById(id) {
  const entry = MONKEYS_BY_ID.get(id);
  if (!entry) throw new Error(`Unbekanntes Äffchen: ${id}`);
  return entry;
}

function createDataset(bitesIds, doesNotBiteIds) {
  const withClassification = (id, classification) => {
    const base = MONKEYS_BY_ID.get(id);
    if (!base) throw new Error(`Unbekanntes Äffchen: ${id}`);
    return Object.freeze({ ...base, classification });
  };

  return Object.freeze([
    ...bitesIds.map((id) => withClassification(id, CLASSIFICATIONS.BITES)),
    ...doesNotBiteIds.map((id) => withClassification(id, CLASSIFICATIONS.DOES_NOT_BITE)),
  ]);
}

export const EASY_BITES_IDS = Object.freeze(["06", "07", "08", "15"]);
export const EASY_DOES_NOT_BITE_IDS = Object.freeze(["01", "14", "02", "04", "18", "09", "12", "17"]);
export const ADVANCED_BITES_IDS = Object.freeze(["01", "02", "05", "10", "14", "15", "16", "17", "28", "33", "35", "36"]);
export const ADVANCED_DOES_NOT_BITE_IDS = Object.freeze(["04", "07", "12", "19", "22", "23", "24", "25", "30", "32", "37", "38", "39", "40"]);

export const EASY_DATASET = createDataset(EASY_BITES_IDS, EASY_DOES_NOT_BITE_IDS);
export const ADVANCED_DATASET = createDataset(ADVANCED_BITES_IDS, ADVANCED_DOES_NOT_BITE_IDS);

export const VARIANTS = Object.freeze({
  easy: Object.freeze({
    id: "easy",
    datasetVersion: 2,
    shortLabel: "1a – Einfach",
    heading: "Einfache Variante",
    dataset: EASY_DATASET,
    featureKeys: EASY_FEATURE_KEYS,
  }),
  advanced: Object.freeze({
    id: "advanced",
    datasetVersion: 1,
    shortLabel: "1b – Fortgeschritten",
    heading: "Fortgeschrittene Variante",
    dataset: ADVANCED_DATASET,
    featureKeys: ADVANCED_FEATURE_KEYS,
  }),
});
