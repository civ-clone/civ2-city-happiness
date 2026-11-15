"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stagedHappiness = exports.happinessStages = exports.bachContent = exports.stageNames = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Yields_1 = require("../Yields");
const calculateStagedCitizenState_1 = require("@civ-clone/base-city-happiness/lib/calculateStagedCitizenState");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const CityImprovementContent_1 = require("@civ-clone/base-city-yield-city-improvement-content/CityImprovementContent");
const CureForCancer_1 = require("@civ-clone/base-wonder-cureforcancer/CureForCancer");
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const GovernmentContent_1 = require("../Yields/GovernmentContent");
const HangingGardens_1 = require("@civ-clone/base-wonder-hanging-gardens/HangingGardens");
const JsBachsCathedral_1 = require("@civ-clone/base-wonder-jsbachscathedral/JsBachsCathedral");
const ShakespearesTheatre_1 = require("@civ-clone/base-wonder-shakespearestheatre/ShakespearesTheatre");
const government_1 = require("@civ-clone/civ2-city/lib/government");
/** Civ2's happiness stages after the base, in `city_calc_trade_happiness`'s order. */
exports.stageNames = [
    'luxuries',
    'buildings',
    'units',
    'wonders',
];
/** J. S. Bach's Cathedral makes 2 unhappy citizens content in each of its owner's cities (`city_calc_trade_happiness`). */
exports.bachContent = 2;
/** Whether `cityYield` was given by `Provider` (a wonder's yields name it by its class's name: civ2-wonder). */
const providedBy = (cityYield, Provider) => cityYield
    .values()
    .some(([, provider]) => provider === Provider.name);
/**
 * Sorts a city's happiness yields into the stages of OpenCiv2's `city_calc_trade_happiness` (`src/auto/city.cpp`
 *  ~3640–3840, richardpenman/civ2@49f26ec), each clamped by `city_happy_clamp_stage` (~3459) before the next, for
 *  base-city-happiness' `calculateStagedCitizenState`:
 *
 * - **base** (stage 0, ~3745–3770): `PopulationUnhappiness` (born unhappy and the empire's size). Any other unhappiness
 *   the city's yields add, such as a caller asking what one more unhappy citizen would do, counts here too.
 * - **luxuries** (stage 1, ~3772): `LuxuryHappiness`, a happy citizen for each 2 luxuries.
 * - **buildings** (stage 2, ~3774–3808): each improvement's `CityImprovementContent` (the Colosseum, a Cathedral or
 *   Michelangelo's, the Temple: civ2-city-improvement), and the Courthouse's or the Palace's happy citizen under
 *   Democracy (any `Happiness` but the luxuries' and the wonders'). Content from anything else counts here too.
 * - **units** (stage 3, ~3809–3846): under Fundamentalism no citizen is unhappy or angry (this package's
 *   `GovernmentContent` is how the city's yields show it); martial law (`MartialLaw`) quiets no more than are unhappy
 *   after the buildings (`int_clamp(martial_law_units, 0, unhappy)`); military unhappiness (`MilitaryUnhappiness`).
 *   The code takes one of the three by government, so they never meet.
 * - **wonders** (stage 4, ~3848–3866), in the code's order: the Hanging Gardens' and the Cure for Cancer's happy
 *   citizens, then Shakespeare's Theatre sets the unhappy to none (but not the angry, who come back as unhappy in the
 *   clamp), then J. S. Bach's takes 2 away. civ2-wonder's own yields for these two are capped to the city's net
 *   unhappiness, as a single total sees it; here they only say the wonder applies, and the code's numbers are used.
 *
 * The rules that give these yields cap them to the city's net `Unhappiness` (no more content than there are unhappy
 *  citizens). That total is never smaller than what a stage has left to calm, so the cap never changes a stage.
 */
const happinessStages = (yields, fundamentalism = false) => {
    let unhappy = 0, luxuries = 0, buildingsHappy = 0, buildingsContent = 0, martialLaw = 0, hasMartialLaw = false, militaryUnhappy = 0, wondersHappy = 0, shakespeare = false, bach = false;
    yields.forEach((cityYield) => {
        const value = cityYield.value();
        if (cityYield instanceof Yields_1.Happiness) {
            if (cityYield instanceof Yields_1.LuxuryHappiness) {
                luxuries += value;
                return;
            }
            if (providedBy(cityYield, HangingGardens_1.default) ||
                providedBy(cityYield, CureForCancer_1.default)) {
                wondersHappy += value;
                return;
            }
            buildingsHappy += value;
            return;
        }
        if (!(cityYield instanceof Yields_1.Unhappiness)) {
            return;
        }
        if (cityYield instanceof GovernmentContent_1.GovernmentContent) {
            // Fundamentalism: the stage below sets it from the government itself.
            return;
        }
        if (cityYield instanceof Yields_1.MartialLaw) {
            hasMartialLaw = true;
            martialLaw -= value;
            return;
        }
        if (cityYield instanceof Yields_1.MilitaryUnhappiness) {
            militaryUnhappy += value;
            return;
        }
        if (cityYield instanceof CityImprovementContent_1.default) {
            buildingsContent -= value;
            return;
        }
        if (providedBy(cityYield, ShakespearesTheatre_1.default)) {
            shakespeare = true;
            return;
        }
        if (providedBy(cityYield, JsBachsCathedral_1.default)) {
            bach = true;
            return;
        }
        if (cityYield instanceof Yields_1.PopulationUnhappiness || value > 0) {
            unhappy += value;
            return;
        }
        buildingsContent -= value;
    });
    return {
        unhappy: Math.max(unhappy, 0),
        stages: [
            { name: 'luxuries', happy: luxuries },
            { name: 'buildings', happy: buildingsHappy, content: buildingsContent },
            {
                name: 'units',
                unhappy: militaryUnhappy,
                steps: [
                    ...(hasMartialLaw
                        ? [
                            {
                                apply: (counts) => ({
                                    ...counts,
                                    unhappy: counts.unhappy -
                                        Math.min(Math.max(martialLaw, 0), Math.max(counts.unhappy, 0)),
                                }),
                            },
                        ]
                        : []),
                    ...(fundamentalism
                        ? [
                            {
                                apply: (counts) => ({
                                    ...counts,
                                    angry: 0,
                                    unhappy: 0,
                                }),
                            },
                        ]
                        : []),
                ],
            },
            {
                name: 'wonders',
                happy: wondersHappy,
                steps: [
                    ...(shakespeare
                        ? [
                            {
                                apply: (counts) => ({
                                    ...counts,
                                    unhappy: 0,
                                }),
                            },
                        ]
                        : []),
                    ...(bach ? [{ content: exports.bachContent }] : []),
                ],
            },
        ],
    };
};
exports.happinessStages = happinessStages;
/**
 * The happy, unhappy and angry citizens of `city`, worked out in Civ2's stages from its yields (`happinessStages`), and
 *  the counts after each stage (`stages`: 'base', 'luxuries', 'buildings', 'units', 'wonders'), for a city screen's
 *  happiness panel. Disorder is fewer happy citizens than unhappy ones, and the angry are among the unhappy
 *  (`city_process_disorder`).
 */
const stagedHappiness = (city, yields = city.yields(), { cityGrowthRegistry = CityGrowthRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, } = {}) => {
    const { unhappy, stages } = (0, exports.happinessStages)(yields, (0, government_1.default)(city.player(), playerGovernmentRegistry) === governments_1.FUNDAMENTALISM);
    return (0, calculateStagedCitizenState_1.calculateStagedCitizenState)({
        size: cityGrowthRegistry.getByCity(city).size(),
        specialists: specialistRegistry.getByCity(city).length,
        unhappy,
        stages,
    });
};
exports.stagedHappiness = stagedHappiness;
exports.default = exports.stagedHappiness;
//# sourceMappingURL=stagedHappiness.js.map