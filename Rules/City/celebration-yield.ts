import {
  DESPOTISM_PENALTY,
  TRADE_BONUS,
  governmentTileYield,
  governmentTileYieldTypes,
} from '@civ-clone/civ2-world/lib/governmentTileYield';
import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import celebrationYields, {
  AfterSteps,
} from '@civ-clone/base-city-celebration-yields/lib/celebrationYields';
import City from '@civ-clone/core-city/City';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import PlayerGovernment from '@civ-clone/core-government/PlayerGovernment';
import Pollution from '@civ-clone/base-tile-improvement-pollution/Pollution';
import Priority from '@civ-clone/core-rule/Priority';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Yield from '@civ-clone/core-yield/Yield';
import { leaderCelebration } from '../../lib/cityStatus';

// The providers of what the government and pollution did to a square, which a celebrating city works out again.
const governmentSteps = [DESPOTISM_PENALTY, TRADE_BONUS, Pollution.name];

export const getRules: (
  pendingEffects?: PendingEffectRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  tileImprovementRegistry?: TileImprovementRegistry
) => CityYield[] = (
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance
): CityYield[] => [
  // A celebrating city's squares escape the Anarchy and Despotism penalty, and from Monarchy up get the Republic's
  //  trade bonus (civ2-world `governmentTileYield`; OpenCiv2 `src/auto/city.cpp` `city_tile_yield`,
  //  richardpenman/civ2@49f26ec). A square's own yields are worked out for a city that isn't celebrating, so this adds
  //  the difference. After the worked squares, and before corruption, which counts it.
  new CityYield(
    'civ2-city-happiness:city/yield/celebration',
    new Priority(1),
    new Criterion(
      (city: City): boolean => leaderCelebration(city, pendingEffects) !== null
    ),
    new Effect((city: City): Yield[] => {
      let government: PlayerGovernment;

      try {
        government = playerGovernmentRegistry.getByPlayer(city.player());
      } catch (e) {
        return [];
      }

      // Pollution halves what the steps leave, rounded up, as civ2-world's tile rules do.
      const afterSteps: AfterSteps = (tile) =>
        tileImprovementRegistry
          .getByTile(tile)
          .some(
            (improvement: TileImprovement): boolean =>
              improvement instanceof Pollution
          )
          ? (value: number): number => Math.ceil(value / 2)
          : (value: number): number => value;

      return celebrationYields(
        city,
        government,
        governmentTileYieldTypes,
        governmentSteps,
        governmentTileYield,
        afterSteps
      );
    })
  ),
];

export default getRules;
