import {
  CIVIL_DISORDER,
  LEADER_CELEBRATION,
  registerHandlers,
} from '../../lib/cityStatus';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityImprovementRegistry,
  instance as cityImprovementRegistryInstance,
} from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import {
  pendingRevolution,
  revolution,
} from '@civ-clone/civ2-government/lib/revolution';
import {
  ANARCHY,
  FUNDAMENTALISM,
} from '@civ-clone/civ2-rules/data/governments';
import Aqueduct from '@civ-clone/base-city-improvement-aqueduct/Aqueduct';
import City from '@civ-clone/core-city/City';
import Food from '@civ-clone/base-terrain-yield-food/Food';
import { GrowthLimit } from '@civ-clone/base-city-growth-limit/lib/growthLimit';
import SewerSystem from '@civ-clone/base-city-improvement-sewersystem/SewerSystem';
import cosmic from '@civ-clone/civ2-rules/data/cosmic';
import { raptureGrowth } from '@civ-clone/base-city-rapture-growth/lib/raptureGrowth';
import { CityStatusCheck } from '@civ-clone/base-city-happiness-status/lib/statusTurn';
import { Democracy } from '@civ-clone/civ2-government/Governments';
import Effect from '@civ-clone/core-rule/Effect';
import { Low } from '@civ-clone/core-rule/Priorities';
import Player from '@civ-clone/core-player/Player';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
import cityStatusTurn from '@civ-clone/base-city-happiness-status/lib/statusTurn';
import governmentOf from '@civ-clone/civ2-city/lib/government';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';

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
export const raptureGrowthLimits: GrowthLimit[] = [
  [cosmic.aqueductSize, Aqueduct],
  [cosmic.sewerSize, SewerSystem],
];

export const getRules: (
  cityRegistry?: CityRegistry,
  ruleRegistry?: RuleRegistry,
  engine?: Engine,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  pendingEffects?: PendingEffectRegistry,
  turn?: Turn,
  clientRegistry?: ClientRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  cityImprovementRegistry?: CityImprovementRegistry
) => TurnStart[] = (
  cityRegistry: CityRegistry = cityRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  engine: Engine = engineInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance,
  turn: Turn = turnInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  cityImprovementRegistry: CityImprovementRegistry = cityImprovementRegistryInstance
): TurnStart[] => {
  registerHandlers(pendingEffects, engine);

  const onCelebrationChecked = raptureGrowth(
    { cityGrowthRegistry, cityImprovementRegistry, turn },
    {
      FoodType: Food,
      allowed: (city: City): boolean =>
        governmentOf(city.player(), playerGovernmentRegistry) > FUNDAMENTALISM,
      growthLimits: raptureGrowthLimits,
    }
  );

  return [
    new TurnStart(
      'civ2-city-happiness:player/turn-start/city-status',
      new Low(),
      new Effect((player: Player): void =>
        cityStatusTurn(cityRegistry.getByPlayer(player), {
          disorderHandler: CIVIL_DISORDER,
          celebrationHandler: LEADER_CELEBRATION,
          pendingEffects,
          ruleRegistry,
          engine,
          onDisorderContinues: ({ city }: CityStatusCheck): void => {
            if (!isHuman(player, clientRegistry)) {
              return;
            }

            const playerGovernment =
              playerGovernmentRegistry.getByPlayer(player);

            if (
              !playerGovernment.is(Democracy) ||
              pendingRevolution(playerGovernment, pendingEffects) !== null
            ) {
              return;
            }

            revolution(
              playerGovernment,
              pendingEffects,
              ruleRegistry,
              turn,
              'civil-disorder'
            );

            engine.emit('player:government:collapsed', player, city);
          },
          forgetCelebration: ({ disorder }: CityStatusCheck): boolean =>
            disorder ||
            governmentOf(player, playerGovernmentRegistry) === ANARCHY,
          onCelebrationChecked,
        })
      )
    ),
  ];
};

export default getRules;
