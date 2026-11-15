"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.raptureGrowthLimits = void 0;
const cityStatus_1 = require("../../lib/cityStatus");
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityImprovementRegistry_1 = require("@civ-clone/core-city-improvement/CityImprovementRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const ClientRegistry_1 = require("@civ-clone/core-client/ClientRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const core_pending_effect_1 = require("@civ-clone/core-pending-effect");
const PlayerGovernmentRegistry_1 = require("@civ-clone/core-government/PlayerGovernmentRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const revolution_1 = require("@civ-clone/civ2-government/lib/revolution");
const governments_1 = require("@civ-clone/civ2-rules/data/governments");
const Aqueduct_1 = require("@civ-clone/base-city-improvement-aqueduct/Aqueduct");
const Food_1 = require("@civ-clone/base-terrain-yield-food/Food");
const SewerSystem_1 = require("@civ-clone/base-city-improvement-sewersystem/SewerSystem");
const cosmic_1 = require("@civ-clone/civ2-rules/data/cosmic");
const raptureGrowth_1 = require("@civ-clone/base-city-rapture-growth/lib/raptureGrowth");
const Governments_1 = require("@civ-clone/civ2-government/Governments");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Priorities_1 = require("@civ-clone/core-rule/Priorities");
const TurnStart_1 = require("@civ-clone/core-player/Rules/TurnStart");
const statusTurn_1 = require("@civ-clone/base-city-happiness-status/lib/statusTurn");
const government_1 = require("@civ-clone/civ2-city/lib/government");
const isHuman_1 = require("@civ-clone/civ2-difficulty/isHuman");
// A player's cities' civil disorder and celebrations, at the start of its turn (OpenCiv2 `src/auto/city.cpp`
//  `city_process_disorder`, richardpenman/civ2@49f26ec):
//  - a person's Democracy falls into Anarchy when a city is in disorder for a second turn running;
//  - a celebration ends when its conditions fail, in disorder too, and is only announced to have ended outside
//    disorder and Anarchy, and only to a person;
//  - rapture growth (`raptureGrowth` below).
/**
 * Civ2's rapture growth (OpenCiv2 `city_process_disorder` ~4271–4277): a city that was already celebrating grows by 1,
 *  its food box untouched, under a government above Fundamentalism (a Republic or a Democracy), with food to spare
 *  after its citizens and Settlers eat, and no Aqueduct (@COSMIC 8) or Sewer System (12) cap in the way
 *  (`city_needed_size_improvement`). The size < 127 test is one of OpenCiv2's opt-in bug fixes, not the original's.
 */
exports.raptureGrowthLimits = [
    [cosmic_1.default.aqueductSize, Aqueduct_1.default],
    [cosmic_1.default.sewerSize, SewerSystem_1.default],
];
const getRules = (cityRegistry = CityRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, engine = Engine_1.instance, playerGovernmentRegistry = PlayerGovernmentRegistry_1.instance, pendingEffects = core_pending_effect_1.instance, turn = Turn_1.instance, clientRegistry = ClientRegistry_1.instance, cityGrowthRegistry = CityGrowthRegistry_1.instance, cityImprovementRegistry = CityImprovementRegistry_1.instance) => {
    (0, cityStatus_1.registerHandlers)(pendingEffects, engine);
    const onCelebrationChecked = (0, raptureGrowth_1.raptureGrowth)({ cityGrowthRegistry, cityImprovementRegistry, turn }, {
        FoodType: Food_1.default,
        allowed: (city) => (0, government_1.default)(city.player(), playerGovernmentRegistry) > governments_1.FUNDAMENTALISM,
        growthLimits: exports.raptureGrowthLimits,
    });
    return [
        new TurnStart_1.default('civ2-city-happiness:player/turn-start/city-status', new Priorities_1.Low(), new Effect_1.default((player) => (0, statusTurn_1.default)(cityRegistry.getByPlayer(player), {
            disorderHandler: cityStatus_1.CIVIL_DISORDER,
            celebrationHandler: cityStatus_1.LEADER_CELEBRATION,
            pendingEffects,
            ruleRegistry,
            engine,
            onDisorderContinues: ({ city }) => {
                if (!(0, isHuman_1.default)(player, clientRegistry)) {
                    return;
                }
                const playerGovernment = playerGovernmentRegistry.getByPlayer(player);
                if (!playerGovernment.is(Governments_1.Democracy) ||
                    (0, revolution_1.pendingRevolution)(playerGovernment, pendingEffects) !== null) {
                    return;
                }
                (0, revolution_1.revolution)(playerGovernment, pendingEffects, ruleRegistry, turn, 'civil-disorder');
                engine.emit('player:government:collapsed', player, city);
            },
            forgetCelebration: ({ disorder }) => disorder ||
                (0, government_1.default)(player, playerGovernmentRegistry) === governments_1.ANARCHY,
            onCelebrationChecked,
        }))),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=turn-start.js.map