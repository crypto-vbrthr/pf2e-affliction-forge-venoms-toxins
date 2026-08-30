# PF2E Affliction Forge: Venoms & Toxins

`Venoms & Toxins` is an original, bilingual poison library for **PF2E Affliction Forge**.


## Part of the Forge Suite

**Affliction Forge: Venoms & Toxins** is part of the **Forge Suite**, a growing collection of Foundry VTT modules and add-ons built for the busy Game Master. The suite is designed to reduce preparation and bookkeeping, make common GM tasks easier, and add useful tools that help make running and playing campaigns smoother and more enjoyable.

An overview of the Forge Suite, its modules, add-ons, and shared documentation is available here:

**Forge Suite:** https://github.com/crypto-vbrthr/pf2e-forge-suite


## Feedback, Bug Reports & Feature Requests

Found a bug, have an idea for an improvement, or would like to suggest a new feature?

Feedback is always welcome. Please feel free to open a new **GitHub Issue** at any time, whether you want to report a problem, suggest a quality-of-life improvement, propose a new feature, or share an idea for how the module could be made more useful.

When reporting a bug, please include as much relevant information as possible, such as the Foundry VTT version, PF2e system version, module version, steps to reproduce the issue, and any console errors or screenshots that may help identify the problem.

Suggestions and feature requests are equally welcome. Even small ideas can lead to useful improvements.

**Open an issue here:** https://github.com/crypto-vbrthr/pf2e-affliction-forge-venoms-toxins/issues


## Version 0.1.0

- 32 original staged poisons from level 0 to 20
- German and English localization
- natural venoms from spiders, snakes, scorpions, fish, insects, amphibians, beasts, and planar predators
- alchemical contact, ingested, inhaled, and weapon toxins
- 7 dedicated injury-poison coatings using Affliction Forge's charge-aware weapon/attack workflow
- PF2e-style Fortitude and selected Will save progressions, onsets, maximum durations, staged damage, conditions, persistent damage, virulent progression, and a high-level death effect
- standardized Affliction Forge semantic tags for Creature Forge matching
- read-only provider library exposed through the Affliction Forge public Library API

## Semantic Creature Forge contract

Every definition is tagged in its root `themes` array using the Affliction Forge 0.1.63 semantic contract, for example:

```text
creature:animal
family:spider
habitat:underground
theme:poison
theme:venom
origin:natural
delivery:bite
```

Creature Forge and other consumers can use `api.libraries.search({ tags: ... })` or the public semantic scoring API without knowing anything about this module's internals.

### Innate venom vs. injury-poison coating

Natural bite and sting venoms are **not** marked with `delivery.injuryPoison`. Their semantic `delivery:bite`, `delivery:sting`, or `delivery:injury` tags describe how a creature delivers the affliction, while Creature Forge can attach the affliction as an innate attack reference without consumable charges.

Only deliberately formulated weapon coatings are marked with `delivery.injuryPoison: true`. Those entries also carry `delivery:weapon`, `delivery:injury`, and `origin:alchemical`, so dropping them onto a compatible weapon or melee attack uses Affliction Forge's charge prompt and combat-trigger workflow.

## Content installation

On the first GM startup, this module provisions a managed **world Item compendium** named `world.affliction-forge-venoms-toxins`, writes the current content into it, and registers that pack as a read-only Affliction Forge provider library.

The managed content is synchronized to the module version when a GM starts the world. Copies made into the normal Affliction Forge world library remain independent and editable.

## Requirements

- Foundry VTT 14
- PF2e 8.1.2+
- PF2E Affliction Forge 0.1.63+
- Critical Forge as required by Affliction Forge

## Content notice

All poison names, descriptions, and game content in this library are original homebrew content created for this module. The package uses published PF2e poison conventions only as mechanical inspiration and does not reproduce published poison entries.

## Development tests

`npm test` resolves the required Affliction Forge contract from a sibling module whose `module.json` id is `pf2e-affliction-forge`. For non-standard development layouts, set `PF2E_AFFLICTION_FORGE_PATH` to the Affliction Forge module directory before running the tests. No release test contains build-machine absolute paths.
