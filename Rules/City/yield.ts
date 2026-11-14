import {
  AirSuperiorityRole,
  DiplomacyRole,
  TradeRole,
} from '@civ-clone/base-unit-role/Roles';
import { COMMUNISM } from '@civ-clone/civ2-rules/data/governments';
import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  ClientRegistry,
  instance as clientRegistryInstance,
} from '@civ-clone/core-client/ClientRegistry';
import {
  GameDifficultyRegistry,
  instance as gameDifficultyRegistryInstance,
} from '@civ-clone/core-difficulty/GameDifficultyRegistry';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import {
  aggressiveUnits,
  militaryUnhappiness,
  militaryUnhappinessPerUnit,
} from '@civ-clone/base-government-military-unhappiness/lib/militaryUnhappiness';
import {
  computerContent,
  empireSizeLimit,
  empireSizeUnhappiness,
  fortressNearCity,
  humanContent,
} from '../../data/happiness';
import {
  freeAggressiveUnits,
  militaryUnhappinessTable,
} from '@civ-clone/civ2-government/militaryUnhappiness';
import Air from '@civ-clone/base-unit-type-air/Air';
import City from '@civ-clone/core-city/City';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Fortress from '@civ-clone/base-tile-improvement-fortress/Fortress';
import { PopulationUnhappiness } from '../../Yields';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';
import governmentOf from '@civ-clone/civ2-city/lib/government';
import { hasRole } from '@civ-clone/base-unit-role/roleOf';
import { isA } from '@civ-clone/core-unit/traits';
import isHuman from '@civ-clone/civ2-difficulty/isHuman';
import { levelOf } from '@civ-clone/civ2-difficulty/level';
import mapSize from '@civ-clone/civ2-rules/lib/mapSize';

/**
 * Whether a unit `city` supports is away making its citizens unhappy, as Civilization II counts it (OpenCiv2
 * `src/auto/city.cpp` `city_calc_unit_support`, richardpenman/civ2@49f26ec): it has an attack, isn't a unit of diplomacy
 * or trade (only roles below 6 are counted), and is an aircraft other than a fighter, wherever it is, or any other unit
 * that isn't on a city's square, unless it's on a Fortress close to one of its player's cities.
 */
export const isAggressive =
  (
    ruleRegistry: RuleRegistry,
    cityRegistry: CityRegistry,
    tileImprovementRegistry: TileImprovementRegistry
  ) =>
  (unit: Unit): boolean => {
    if (
      unit.attack().value() <= 0 ||
      hasRole(unit, DiplomacyRole, ruleRegistry) ||
      hasRole(unit, TradeRole, ruleRegistry)
    ) {
      return false;
    }

    if (isA(unit, Air)) {
      return !hasRole(unit, AirSuperiorityRole, ruleRegistry);
    }

    const tile = unit.tile();

    if (cityRegistry.getByTile(tile) !== null) {
      return false;
    }

    return !(
      tileImprovementRegistry
        .getByTile(tile)
        .some((improvement) => improvement instanceof Fortress) &&
      cityRegistry
        .getByPlayer(unit.player())
        .some((city: City) => city.tile().distanceFrom(tile) < fortressNearCity)
    );
  };

export const getRules: (
  cityGrowthRegistry?: CityGrowthRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  unitRegistry?: UnitRegistry,
  cityRegistry?: CityRegistry,
  gameDifficultyRegistry?: GameDifficultyRegistry,
  clientRegistry?: ClientRegistry,
  tileImprovementRegistry?: TileImprovementRegistry,
  ruleRegistry?: RuleRegistry
) => CityYield[] = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance,
  cityRegistry: CityRegistry = cityRegistryInstance,
  gameDifficultyRegistry: GameDifficultyRegistry = gameDifficultyRegistryInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance,
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): CityYield[] => {
  const size = (city: City): number =>
      cityGrowthRegistry.getByCity(city).size(),
    content = (city: City): number =>
      isHuman(city.player(), clientRegistry)
        ? humanContent(levelOf(gameDifficultyRegistry))
        : computerContent,
    // Citizens beyond those born content are born unhappy, up to the whole city (those past it are angry citizens:
    //  civ2-city-happiness's README).
    bornUnhappy = (city: City, extra: number = 0): number =>
      Math.min(Math.max(size(city) - content(city) + extra, 0), size(city)),
    // A person's empire, under any government but Communism (`data/happiness`). A map counts as large by its squares,
    //  as civ2-rules' `mapSize` has it.
    empireSize = (city: City): number => {
      const player = city.player(),
        government = governmentOf(player, playerGovernmentRegistry);

      if (!isHuman(player, clientRegistry) || government === COMMUNISM) {
        return 0;
      }

      const world = city.tile().map(),
        limit = empireSizeLimit(
          government,
          levelOf(gameDifficultyRegistry),
          mapSize(world.width() * world.height()) === 'large'
        );

      return empireSizeUnhappiness(
        cityRegistry.getByPlayer(player).length,
        Math.max(cityRegistry.indexOf(city), 0),
        limit
      );
    },
    aggressive = isAggressive(
      ruleRegistry,
      cityRegistry,
      tileImprovementRegistry
    ),
    perUnit = (city: City): number => {
      try {
        return militaryUnhappinessPerUnit(
          militaryUnhappinessTable,
          playerGovernmentRegistry.getByPlayer(city.player())
        );
      } catch (e) {
        return 0;
      }
    },
    free = (city: City): number =>
      freeAggressiveUnits(playerGovernmentRegistry.getByPlayer(city.player()));

  return [
    // OpenCiv2 `src/auto/city.cpp` `city_calc_trade_happiness`, richardpenman/civ2@49f26ec, stage 0.
    new CityYield(
      'civ2-city-happiness:city/yield/population',
      new Criterion((city: City): boolean => bornUnhappy(city) > 0),
      new Effect(
        (city: City): Yield => new PopulationUnhappiness(bornUnhappy(city))
      )
    ),

    new CityYield(
      'civ2-city-happiness:city/yield/empire-size',
      new Criterion((city: City): boolean => empireSize(city) > 0),
      new Criterion(
        (city: City): boolean =>
          bornUnhappy(city, empireSize(city)) > bornUnhappy(city)
      ),
      new Effect(
        (city: City): Yield =>
          new PopulationUnhappiness(
            bornUnhappy(city, empireSize(city)) - bornUnhappy(city),
            'empire-size'
          )
      )
    ),

    // Stage 3: each aggressive unit makes `perUnit` citizens unhappy (civ2-government's table), but under the Republic
    //  the first.
    new CityYield(
      'civ2-city-happiness:city/yield/military-unhappiness',
      new Criterion((city: City): boolean => perUnit(city) > 0),
      new Criterion(
        (city: City): boolean =>
          aggressiveUnits(city, aggressive, unitRegistry).length > free(city)
      ),
      new Effect(
        (city: City): Yield[] =>
          militaryUnhappiness(
            city,
            perUnit(city),
            aggressive,
            unitRegistry
          ).slice(free(city)) as Yield[]
      )
    ),
  ];
};

export default getRules;
