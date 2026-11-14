"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const governmentTileYield_1 = require("@civ-clone/civ2-world/lib/governmentTileYield");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const celebrationYields_1 = require("@civ-clone/base-city-celebration-yields/lib/celebrationYields");
const Yield_1 = require("@civ-clone/core-city/Rules/Yield");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Pollution_1 = require("@civ-clone/base-tile-improvement-pollution/Pollution");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const cityStatus_1 = require("../../lib/cityStatus");
// The providers of what the government and pollution did to a square, which a celebrating city works out again.
const governmentSteps = [governmentTileYield_1.DESPOTISM_PENALTY, governmentTileYield_1.TRADE_BONUS, Pollution_1.default.name];
const getRules = (pendingEffects = core_pending_effect_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance) => [
    // A celebrating city's squares escape the Anarchy and Despotism penalty, and from Monarchy up get the Republic's
    //  trade bonus (civ2-world `governmentTileYield`; OpenCiv2 `src/auto/city.cpp` `city_tile_yield`,
    //  richardpenman/civ2@49f26ec). A square's own yields are worked out for a city that isn't celebrating, so this adds
    //  the difference. After the worked squares, and before corruption, which counts it.
    new Yield_1.default('civ2-city-happiness:city/yield/celebration', new Priority_1.default(1), new Criterion_1.default((city) => (0, cityStatus_1.leaderCelebration)(city, pendingEffects) !== null), new Effect_1.default((city) => {
        let government;
        try {
            government = playerGovernmentRegistry.getByPlayer(city.player());
        }
        catch (e) {
            return [];
        }
        // Pollution halves what the steps leave, rounded up, as civ2-world's tile rules do.
        const afterSteps = (tile) => tileImprovementRegistry
            .getByTile(tile)
            .some((improvement) => improvement instanceof Pollution_1.default)
            ? (value) => Math.ceil(value / 2)
            : (value) => value;
        return (0, celebrationYields_1.default)(city, government, governmentTileYield_1.governmentTileYieldTypes, governmentSteps, governmentTileYield_1.governmentTileYield, afterSteps);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=celebration-yield.js.map