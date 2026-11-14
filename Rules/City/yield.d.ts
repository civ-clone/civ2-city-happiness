import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { GameDifficultyRegistry } from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Unit from '@civ-clone/core-unit/Unit';
/**
 * Whether a unit `city` supports is away making its citizens unhappy, as Civilization II counts it (OpenCiv2
 * `src/auto/city.cpp` `city_calc_unit_support`, richardpenman/civ2@49f26ec): it has an attack, isn't a unit of diplomacy
 * or trade (only roles below 6 are counted), and is an aircraft other than a fighter, wherever it is, or any other unit
 * that isn't on a city's square, unless it's on a Fortress close to one of its player's cities.
 */
export declare const isAggressive: (
  ruleRegistry: RuleRegistry,
  cityRegistry: CityRegistry,
  tileImprovementRegistry: TileImprovementRegistry
) => (unit: Unit) => boolean;
export declare const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  unitRegistry?: UnitRegistry,
  cityRegistry?: CityRegistry,
  gameDifficultyRegistry?: GameDifficultyRegistry,
  clientRegistry?: ClientRegistry,
  tileImprovementRegistry?: TileImprovementRegistry,
  ruleRegistry?: RuleRegistry
) => CityYield[];
export default getRules;
