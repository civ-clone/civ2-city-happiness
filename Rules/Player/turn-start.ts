import {
  CIVIL_DISORDER,
  LEADER_CELEBRATION,
  registerHandlers,
} from '../../lib/cityStatus';
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
import { ANARCHY } from '@civ-clone/civ2-rules/data/governments';
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
//    disorder and Anarchy (`if (human && civ_gov != 0 && !(flags & CITYF_DISORDER)) "WEDONTLOVEKING"`).
//  Rapture growth comes later (civ2-city-happiness's README).
export const getRules: (
  cityRegistry?: CityRegistry,
  ruleRegistry?: RuleRegistry,
  engine?: Engine,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  pendingEffects?: PendingEffectRegistry,
  turn?: Turn,
  clientRegistry?: ClientRegistry
) => TurnStart[] = (
  cityRegistry: CityRegistry = cityRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  engine: Engine = engineInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance,
  turn: Turn = turnInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance
): TurnStart[] => {
  registerHandlers(pendingEffects, engine);

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
        })
      )
    ),
  ];
};

export default getRules;
