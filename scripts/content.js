const MODULE_ID = "pf2e-affliction-forge-venoms-toxins";
const CONTENT_VERSION = "0.1.0";
const I18N_PREFIX = "PF2E_AFFLICTION_VT.Content";

const token = (slug, key) => `@i18n:${I18N_PREFIX}.${slug}.${key}`;
const restrictions = ({ locks = [], healing = "none", damageTypes = [], blocked = [] } = {}) => ({ conditionLocks: locks.map(([slug, minimum]) => ({ slug, minimum })), healing, unhealableDamageTypes: [...damageTypes], blockedCapabilities: [...blocked] });
const duration = ([value, unit]) => ({ value, unit });
const condition = (slug, value = null) => value == null ? { type: "condition", slug } : { type: "condition", slug, value };
const damage = (formula, damageType, persistent = false) => ({ type: "damage", formula, damageType, ...(persistent ? { persistent: true } : {}) });
const death = (category = "death-effect") => ({ type: "death", category });

function effect(slug, stageNumber, components, nameKey = null) {
  if (!components.length) return null;
  return { schemaVersion: 2, id: `${MODULE_ID}.${slug}.stage-${stageNumber}`, name: token(slug, nameKey ?? `Stage${stageNumber}.Name`), duration: { value: -1, unit: "unlimited", expiry: null }, components, application: {}, metadata: { originModule: MODULE_ID, originFeature: "venoms-toxins-stage" } };
}

function componentFromSpec(entry) {
  if (entry[0] === "condition") return condition(entry[1], entry[2]);
  if (entry[0] === "damage") return damage(entry[1], entry[2], false);
  if (entry[0] === "damagePersistent") return damage(entry[1], entry[2], true);
  if (entry[0] === "death") return death(entry[1]);
  throw new Error(`Unsupported Venoms & Toxins component type: ${entry[0]}`);
}

function makeStage(slug, stageNumber, stageSpec) {
  const [durationSpec, componentSpecs, options = {}] = stageSpec;
  const components = componentSpecs.map(componentFromSpec);
  const stageRestrictions = restrictions({ healing: options.healing ?? "none", blocked: options.blockSpeak ? ["speak"] : [] });
  const preActionGates = options.gate ? [{ id: `${slug}.stage-${stageNumber}.gate`, label: token(slug, `Stage${stageNumber}.Gate`), trigger: { actionKinds: ["spell-cast", "item-activation"], requiredTraits: ["concentrate"] }, check: { kind: "flat", dc: options.gate }, blockOnFailure: true }] : [];
  const periodicEffects = options.periodic ? [{ id: `${slug}.stage-${stageNumber}.periodic`, label: token(slug, `Stage${stageNumber}.Periodic`), interval: { value: options.periodic[0], unit: options.periodic[1] }, effect: effect(slug, `${stageNumber}-periodic`, [damage(options.periodic[2], options.periodic[3])], `Stage${stageNumber}.Periodic`) }] : [];
  return { id: `stage-${stageNumber}`, number: stageNumber, name: token(slug, `Stage${stageNumber}.Name`), description: token(slug, `Stage${stageNumber}.Description`), duration: duration(durationSpec), expiryAction: options.expiry ?? "check", check: null, restrictions: stageRestrictions, effectPersistence: "stage", effectPersistenceDuration: null, effectComponentPersistence: [], effectComponentPersistenceDurations: [], effect: effect(slug, stageNumber, components), numericModifiers: [], periodicEffects, preActionGates, reactions: [] };
}

function makeDefinition(spec) {
  const save = spec.save ?? ["player", "public"];
  const themes = Object.entries(spec.tags).flatMap(([namespace, values]) => values.map((value) => `${namespace}:${value}`));
  return {
    schemaVersion: 2,
    id: `${MODULE_ID}.${spec.slug}`,
    name: token(spec.slug, "Name"),
    description: token(spec.slug, "Description"),
    img: "icons/svg/poison.svg",
    afflictionType: "poison",
    level: spec.level,
    rarity: spec.rarity,
    traits: spec.virulent === true ? ["poison", "virulent"] : ["poison"],
    themes,
    saveDefaults: { execution: save[0], visibility: save[1] },
    identification: { initialState: spec.identification ?? "identified" },
    delivery: { injuryPoison: spec.injuryPoison === true },
    multipleExposure: spec.multipleExposure ?? "default",
    restrictions: restrictions({ locks: spec.locks ?? [], healing: spec.rootHealing ?? "none" }),
    checks: [{ id: "primary", label: token(spec.slug, "SaveLabel"), kind: "save", statistic: spec.stat, dcMode: "fixed", dc: spec.dc, policy: null }],
    initialCheck: { checkIds: ["primary"], combine: "single", outcomes: { criticalSuccess: { action: "reject" }, success: { action: "reject" }, failure: { action: "set-stage", stage: 1 }, criticalFailure: { action: "set-stage", stage: 2 } } },
    onset: spec.onset ? duration(spec.onset) : null,
    maximumDuration: spec.maxDuration ? duration(spec.maxDuration) : null,
    defaultStageCheck: { checkIds: ["primary"], combine: "single", outcomes: { criticalSuccess: { action: "stage-delta", delta: -2 }, success: { action: "stage-delta", delta: -1 }, failure: { action: "stage-delta", delta: 1 }, criticalFailure: { action: "stage-delta", delta: 2 } } },
    progression: { belowStageOne: "recover", aboveMaximumStage: "clamp", virulent: spec.virulent === true },
    stages: spec.stages.map((stage, index) => makeStage(spec.slug, index + 1, stage)),
    metadata: { originModule: MODULE_ID, originFeature: "venoms-toxins-library", contentVersion: CONTENT_VERSION, contentLicense: "original-homebrew", creatureForgeReady: true }
  };
}

const SPECS = [
  {
    "slug": "cellar-spider-venom",
    "level": 0,
    "dc": 14,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "spider"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d4",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d4",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "nettle-sap",
    "level": 0,
    "dc": 14,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      1,
      "minutes"
    ],
    "maxDuration": [
      10,
      "minutes"
    ],
    "tags": {
      "creature": [
        "plant"
      ],
      "habitat": [
        "forest",
        "plains"
      ],
      "theme": [
        "poison",
        "toxin"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "contact"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "dune-scorpion-venom",
    "level": 1,
    "dc": 15,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "scorpion"
      ],
      "habitat": [
        "desert"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "sting"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d4",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "dockside-ratbane",
    "level": 1,
    "dc": 15,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      1,
      "hours"
    ],
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban",
        "coastal"
      ],
      "theme": [
        "poison",
        "toxin"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "ingested"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          10,
          "minutes"
        ],
        [
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          10,
          "minutes"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          10,
          "minutes"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "marsh-viper-venom",
    "level": 2,
    "dc": 16,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "snake"
      ],
      "habitat": [
        "swamp"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "enfeebled",
            1
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "smokeleaf-toxin",
    "level": 2,
    "dc": 16,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      1,
      "rounds"
    ],
    "maxDuration": [
      10,
      "minutes"
    ],
    "tags": {
      "creature": [
        "plant"
      ],
      "habitat": [
        "forest",
        "jungle"
      ],
      "theme": [
        "poison",
        "toxin"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "condition",
            "dazzled"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "condition",
            "dazzled"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "dazzled"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "cobalt-frog-secretion",
    "level": 3,
    "dc": 18,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "amphibian"
      ],
      "habitat": [
        "jungle",
        "swamp"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "contact"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "blackglass-needle-poison",
    "level": 3,
    "dc": 18,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "toxin"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "injury",
        "weapon"
      ]
    },
    "injuryPoison": true,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "enfeebled",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "cave-widow-venom",
    "level": 4,
    "dc": 19,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "spider"
      ],
      "habitat": [
        "underground"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "choking-lime-toxin",
    "level": 4,
    "dc": 19,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      1,
      "rounds"
    ],
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban",
        "underground"
      ],
      "theme": [
        "poison",
        "toxin"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "1d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "reefspine-venom",
    "level": 5,
    "dc": 20,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "fish"
      ],
      "habitat": [
        "aquatic",
        "coastal"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "sting",
        "injury"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "enfeebled",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "crimson-ichor",
    "level": 5,
    "dc": 20,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "toxin",
        "blood"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "injury",
        "weapon"
      ]
    },
    "injuryPoison": true,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "damagePersistent",
            "1d4",
            "bleed"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "damagePersistent",
            "1d6",
            "bleed"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "damagePersistent",
            "1d6",
            "bleed"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "dusk-adder-venom",
    "level": 6,
    "dc": 22,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "snake"
      ],
      "habitat": [
        "forest",
        "plains"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            1
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "fever-dust",
    "level": 6,
    "dc": 22,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      1,
      "rounds"
    ],
    "maxDuration": [
      10,
      "minutes"
    ],
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban",
        "desert"
      ],
      "theme": [
        "poison",
        "toxin"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "inhaled"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "damage",
            "2d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            1
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "minutes"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "carrion-wasp-venom",
    "level": 7,
    "dc": 23,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "insect"
      ],
      "habitat": [
        "forest",
        "swamp"
      ],
      "theme": [
        "poison",
        "venom",
        "necrotic"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "sting"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "moonmilk-toxin",
    "level": 7,
    "dc": 23,
    "rarity": "common",
    "stat": "fortitude",
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      1,
      "hours"
    ],
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "underground"
      ],
      "theme": [
        "poison",
        "toxin"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "contact",
        "ingested"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          10,
          "minutes"
        ],
        [
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          10,
          "minutes"
        ],
        [
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          10,
          "minutes"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "obsidian-scorpion-venom",
    "level": 8,
    "dc": 24,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "scorpion"
      ],
      "habitat": [
        "volcanic",
        "desert"
      ],
      "theme": [
        "poison",
        "venom",
        "elemental"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "sting"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "damage",
            "1d6",
            "fire"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "damage",
            "1d6",
            "fire"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "fire"
          ],
          [
            "condition",
            "clumsy",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "assassins-sap",
    "level": 8,
    "dc": 24,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "toxin"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "injury",
        "weapon"
      ]
    },
    "injuryPoison": true,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "3d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "glassfang-venom",
    "level": 9,
    "dc": 26,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "snake"
      ],
      "habitat": [
        "mountain",
        "underground"
      ],
      "theme": [
        "poison",
        "venom",
        "blood"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "damagePersistent",
            "1d6",
            "bleed"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "damagePersistent",
            "1d6",
            "bleed"
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "6d6",
            "poison"
          ],
          [
            "damagePersistent",
            "2d6",
            "bleed"
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "grave-lotus-distillate",
    "level": 9,
    "dc": 26,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": [
      10,
      "minutes"
    ],
    "maxDuration": [
      1,
      "hours"
    ],
    "tags": {
      "creature": [
        "plant",
        "undead"
      ],
      "habitat": [
        "swamp",
        "urban"
      ],
      "theme": [
        "poison",
        "toxin",
        "necrotic"
      ],
      "origin": [
        "alchemical",
        "undead"
      ],
      "delivery": [
        "ingested",
        "contact"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          10,
          "minutes"
        ],
        [
          [
            "condition",
            "stupefied",
            1
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          10,
          "minutes"
        ],
        [
          [
            "damage",
            "4d6",
            "void"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          10,
          "minutes"
        ],
        [
          [
            "damage",
            "5d6",
            "void"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "storm-eel-toxin",
    "level": 10,
    "dc": 27,
    "rarity": "common",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "fish"
      ],
      "habitat": [
        "aquatic",
        "coastal"
      ],
      "theme": [
        "poison",
        "venom",
        "elemental"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite",
        "injury"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "electricity"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "electricity"
          ],
          [
            "condition",
            "clumsy",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "6d6",
            "poison"
          ],
          [
            "damage",
            "3d6",
            "electricity"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "widowmaker-compound",
    "level": 10,
    "dc": 27,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "toxin",
        "blood"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "injury",
        "weapon"
      ]
    },
    "injuryPoison": true,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "4d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "7d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "ash-manticore-venom",
    "level": 11,
    "dc": 28,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "beast"
      ],
      "habitat": [
        "mountain",
        "volcanic"
      ],
      "theme": [
        "poison",
        "venom",
        "elemental"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "sting",
        "injury"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "fire"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "6d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "fire"
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "7d6",
            "poison"
          ],
          [
            "damage",
            "3d6",
            "fire"
          ],
          [
            "condition",
            "enfeebled",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "basilisk-bile",
    "level": 12,
    "dc": 30,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "beast"
      ],
      "family": [
        "reptile"
      ],
      "habitat": [
        "desert",
        "underground"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "contact",
        "injury"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "5d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "acid"
          ],
          [
            "condition",
            "clumsy",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "6d6",
            "poison"
          ],
          [
            "damage",
            "2d6",
            "acid"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "8d6",
            "poison"
          ],
          [
            "damage",
            "3d6",
            "acid"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "slowed",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "red-crown-serpent-venom",
    "level": 13,
    "dc": 31,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "snake"
      ],
      "habitat": [
        "mountain"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "bite"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "6d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            1
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "7d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "enfeebled",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "8d6",
            "poison"
          ],
          [
            "condition",
            "clumsy",
            2
          ],
          [
            "condition",
            "enfeebled",
            2
          ],
          [
            "condition",
            "slowed",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "emperor-scorpion-venom",
    "level": 14,
    "dc": 32,
    "rarity": "uncommon",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "animal"
      ],
      "family": [
        "scorpion"
      ],
      "habitat": [
        "desert",
        "underground"
      ],
      "theme": [
        "poison",
        "venom"
      ],
      "origin": [
        "natural"
      ],
      "delivery": [
        "sting"
      ]
    },
    "injuryPoison": false,
    "virulent": true,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "6d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "8d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "10d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "enfeebled",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "voidwasp-venom",
    "level": 15,
    "dc": 34,
    "rarity": "rare",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "fiend"
      ],
      "family": [
        "insect"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "poison",
        "venom",
        "necrotic"
      ],
      "origin": [
        "planar"
      ],
      "delivery": [
        "sting"
      ]
    },
    "injuryPoison": false,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "6d6",
            "poison"
          ],
          [
            "damage",
            "3d6",
            "void"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "8d6",
            "poison"
          ],
          [
            "damage",
            "3d6",
            "void"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "10d6",
            "poison"
          ],
          [
            "damage",
            "4d6",
            "void"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "drained",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "wyrm-gall-toxin",
    "level": 16,
    "dc": 35,
    "rarity": "rare",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "dragon"
      ],
      "habitat": [
        "mountain",
        "volcanic"
      ],
      "theme": [
        "poison",
        "toxin",
        "elemental"
      ],
      "origin": [
        "alchemical",
        "magical"
      ],
      "delivery": [
        "injury",
        "weapon"
      ]
    },
    "injuryPoison": true,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "7d6",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "9d6",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "11d6",
            "poison"
          ],
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "sickened",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "nightglass-poison",
    "level": 17,
    "dc": 36,
    "rarity": "rare",
    "stat": "will",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "toxin",
        "mental",
        "shadow"
      ],
      "origin": [
        "alchemical",
        "occult"
      ],
      "delivery": [
        "injury",
        "weapon"
      ]
    },
    "injuryPoison": true,
    "virulent": false,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "8d6",
            "poison"
          ],
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "dazzled"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "10d6",
            "poison"
          ],
          [
            "damage",
            "3d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "dazzled"
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "12d6",
            "poison"
          ],
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "stupefied",
            2
          ],
          [
            "condition",
            "confused"
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "starved-god-ichor",
    "level": 18,
    "dc": 38,
    "rarity": "rare",
    "stat": "fortitude",
    "onset": [
      1,
      "rounds"
    ],
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "aberration"
      ],
      "habitat": [
        "planar",
        "underground"
      ],
      "theme": [
        "poison",
        "toxin",
        "corruption",
        "necrotic"
      ],
      "origin": [
        "occult",
        "planar"
      ],
      "delivery": [
        "contact",
        "ingested"
      ]
    },
    "injuryPoison": false,
    "virulent": true,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "8d6",
            "poison"
          ],
          [
            "damage",
            "4d6",
            "void"
          ],
          [
            "condition",
            "sickened",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "10d6",
            "poison"
          ],
          [
            "damage",
            "4d6",
            "void"
          ],
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "drained",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "12d6",
            "poison"
          ],
          [
            "damage",
            "5d6",
            "void"
          ],
          [
            "condition",
            "sickened",
            2
          ],
          [
            "condition",
            "drained",
            2
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "eternity-serpent-venom",
    "level": 19,
    "dc": 39,
    "rarity": "rare",
    "stat": "will",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "beast"
      ],
      "family": [
        "snake"
      ],
      "habitat": [
        "planar"
      ],
      "theme": [
        "poison",
        "venom",
        "mental"
      ],
      "origin": [
        "planar"
      ],
      "delivery": [
        "bite"
      ]
    },
    "injuryPoison": false,
    "virulent": true,
    "identification": "identified",
    "save": [
      "player",
      "public"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "9d6",
            "poison"
          ],
          [
            "damage",
            "4d6",
            "mental"
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "11d6",
            "poison"
          ],
          [
            "damage",
            "5d6",
            "mental"
          ],
          [
            "condition",
            "slowed",
            2
          ],
          [
            "condition",
            "stupefied",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "13d6",
            "poison"
          ],
          [
            "damage",
            "6d6",
            "mental"
          ],
          [
            "condition",
            "slowed",
            2
          ],
          [
            "condition",
            "stupefied",
            3
          ],
          [
            "condition",
            "confused"
          ]
        ],
        {}
      ]
    ]
  },
  {
    "slug": "sovereign-toxin",
    "level": 20,
    "dc": 40,
    "rarity": "unique",
    "stat": "fortitude",
    "onset": null,
    "maxDuration": [
      6,
      "rounds"
    ],
    "tags": {
      "creature": [
        "humanoid"
      ],
      "habitat": [
        "urban"
      ],
      "theme": [
        "poison",
        "toxin",
        "blood",
        "necrotic"
      ],
      "origin": [
        "alchemical"
      ],
      "delivery": [
        "injury",
        "weapon"
      ]
    },
    "injuryPoison": true,
    "virulent": true,
    "identification": "hidden",
    "save": [
      "gm",
      "gmOnly"
    ],
    "multipleExposure": "default",
    "locks": [],
    "rootHealing": "none",
    "stages": [
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "10d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            1
          ],
          [
            "condition",
            "enfeebled",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "12d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            2
          ],
          [
            "condition",
            "enfeebled",
            2
          ],
          [
            "condition",
            "slowed",
            1
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "14d6",
            "poison"
          ],
          [
            "condition",
            "drained",
            3
          ],
          [
            "condition",
            "enfeebled",
            2
          ],
          [
            "condition",
            "slowed",
            2
          ]
        ],
        {}
      ],
      [
        [
          1,
          "rounds"
        ],
        [
          [
            "damage",
            "16d6",
            "poison"
          ],
          [
            "death",
            "death-effect"
          ]
        ],
        {}
      ]
    ]
  }
];

const DEFINITIONS = Object.freeze(SPECS.map(makeDefinition));

export const VENOMS_TOXINS_MODULE_ID = MODULE_ID;
export const VENOMS_TOXINS_CONTENT_VERSION = CONTENT_VERSION;
export const VENOMS_TOXINS_DEFINITIONS = DEFINITIONS;

export function createVenomsToxinsDefinitions() {
  return DEFINITIONS.map((definition) => structuredClone(definition));
}
