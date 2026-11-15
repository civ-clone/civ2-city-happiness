"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdditionalData = void 0;
const calculateCitizenState_1 = require("@civ-clone/base-city-happiness/lib/calculateCitizenState");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const Yields_1 = require("../Yields");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const SpecialistRegistry_1 = require("@civ-clone/core-city/SpecialistRegistry");
const AdditionalData_1 = require("@civ-clone/core-data-object/AdditionalData");
const City_1 = require("@civ-clone/core-city/City");
const stagedHappiness_1 = require("../lib/stagedHappiness");
/**
 * The mood of each of a city's working citizens, so a renderer can draw them without knowing the rule, worked out in
 * Civ2's stages (`lib/stagedHappiness`): happy, content, unhappy, then angry. `causes` has one entry per `Happiness` or
 * `Unhappiness` yield, in order, with the moods once that yield and the ones before it are applied, as
 * civ1-city-happiness gives them. `stages` has the happy, unhappy and angry counts after each of Civ2's stages ('base',
 * 'luxuries', 'buildings', 'units', 'wonders'), for a happiness panel that shows them.
 */
const getAdditionalData = (cityGrowthRegistry = CityGrowthRegistry_1.instance, specialistRegistry = SpecialistRegistry_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance) => [
    new AdditionalData_1.default(City_1.default, 'citizens', (city) => {
        const yields = city.yields(), causes = yields.filter((cityYield) => (cityYield instanceof Yields_1.Happiness ||
            cityYield instanceof Yields_1.Unhappiness) &&
            cityYield.value() !== 0), staged = (yields) => (0, stagedHappiness_1.default)(city, yields, {
            cityGrowthRegistry,
            playerGovernmentRegistry,
            specialistRegistry,
        }), all = staged(yields);
        return {
            moods: all.states.map(calculateCitizenState_1.citizenMood),
            causes: causes.map((cityYield, index) => ({
                yield: cityYield,
                moods: staged(causes.slice(0, index + 1)).states.map(calculateCitizenState_1.citizenMood),
            })),
            stages: all.stages,
        };
    }),
];
exports.getAdditionalData = getAdditionalData;
exports.default = exports.getAdditionalData;
//# sourceMappingURL=citizens.js.map