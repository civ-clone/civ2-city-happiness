import {
  AirSuperiorityRole,
  DiplomacyRole,
  TradeRole,
} from '@civ-clone/base-unit-role/Roles';
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
import contentCounts from '../../lib/content';
import { fortressNearCity } from '../../data/happiness';
import {
  freeAggressiveUnits,
  militaryUnhappinessTable,
  policeStationExemption,
} from '@civ-clone/civ2-government/militaryUnhappiness';
import Air from '@civ-clone/base-unit-type-air/Air';
import City from '@civ-clone/core-city/City';
import CityYield from '@civ-clone/core-city/Rules/Yield';
import Criterion from '@civ-clone/core-rule/Criterion';
import Description from '@civ-clone/core-rule/Description';
import Effect from '@civ-clone/core-rule/Effect';
import Fortress from '@civ-clone/base-tile-improvement-fortress/Fortress';
import { PopulationUnhappiness } from '../../Yields';
import Unit from '@civ-clone/core-unit/Unit';
import Yield from '@civ-clone/core-yield/Yield';
import {
  ImprovementOrWonderRegistries,
  cityHasImprovementOrWonder,
} from '@civ-clone/base-wonder/lib/hasImprovementOrWonder';
import PoliceStation from '@civ-clone/base-city-improvement-policestation/PoliceStation';
import WomensSuffrage from '@civ-clone/base-wonder-womenssuffrage/WomensSuffrage';
import { hasRole } from '@civ-clone/base-unit-role/roleOf';
import { isA } from '@civ-clone/core-unit/traits';

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
  ruleRegistry?: RuleRegistry,
  improvementOrWonderRegistries?: ImprovementOrWonderRegistries
) => CityYield[] = (
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance,
  playerGovernmentRegistry: PlayerGovernmentRegistry = playerGovernmentRegistryInstance,
  unitRegistry: UnitRegistry = unitRegistryInstance,
  cityRegistry: CityRegistry = cityRegistryInstance,
  gameDifficultyRegistry: GameDifficultyRegistry = gameDifficultyRegistryInstance,
  clientRegistry: ClientRegistry = clientRegistryInstance,
  tileImprovementRegistry: TileImprovementRegistry = tileImprovementRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  improvementOrWonderRegistries: ImprovementOrWonderRegistries = {}
): CityYield[] => {
  const { bornUnhappy, empireSize } = contentCounts({
      cityGrowthRegistry,
      cityRegistry,
      clientRegistry,
      gameDifficultyRegistry,
      playerGovernmentRegistry,
    }),
    aggressive = isAggressive(
      ruleRegistry,
      cityRegistry,
      tileImprovementRegistry
    ),
    // Worked out once a `yields()` call: its rules are all given the same `yields` array, while it's being filled. A
    //  caller that passes no array gets it worked out afresh.
    once = <T>(compute: (city: City) => T) => {
      const known = new WeakMap<Yield[], T>();

      return (city: City, yields?: Yield[]): T => {
        if (!Array.isArray(yields)) {
          return compute(city);
        }

        if (!known.has(yields)) {
          known.set(yields, compute(city));
        }

        return known.get(yields)!;
      };
    },
    empireSizeOnce = once(empireSize),
    aggressiveOnce = once(
      (city: City): Set<Unit> =>
        new Set(aggressiveUnits(city, aggressive, unitRegistry))
    ),
    // Each aggressive unit's share under the player's government (civ2-government's table).
    share = (city: City): number => {
      try {
        return militaryUnhappinessPerUnit(
          militaryUnhappinessTable,
          playerGovernmentRegistry.getByPlayer(city.player())
        );
      } catch (e) {
        return 0;
      }
    },
    // A Police Station in the city, or its player's Women's Suffrage, takes `policeStationExemption` off each unit's
    //  share: one test, so the two never stack (`city_calc_trade_happiness`'s `unhappy_mult`).
    perUnit = (city: City): number => {
      const perUnit = share(city);

      return perUnit > 0 &&
        cityHasImprovementOrWonder(
          city,
          PoliceStation,
          WomensSuffrage,
          improvementOrWonderRegistries
        )
        ? Math.max(perUnit - policeStationExemption, 0)
        : perUnit;
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
      new Criterion(
        (city: City, yields: Yield[]): boolean =>
          empireSizeOnce(city, yields) > 0
      ),
      new Criterion(
        (city: City, yields: Yield[]): boolean =>
          bornUnhappy(city, empireSizeOnce(city, yields)) > bornUnhappy(city)
      ),
      new Effect(
        (city: City, yields: Yield[]): Yield =>
          new PopulationUnhappiness(
            bornUnhappy(city, empireSizeOnce(city, yields)) - bornUnhappy(city),
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
        (city: City, yields: Yield[]): boolean =>
          aggressiveOnce(city, yields).size > free(city)
      ),
      new Effect((city: City, yields: Yield[]): Yield[] => {
        const units = aggressiveOnce(city, yields);

        return militaryUnhappiness(
          city,
          perUnit(city),
          (unit: Unit): boolean => units.has(unit),
          unitRegistry
        ).slice(free(city)) as Yield[];
      }),
      // What a Police Station and Women's Suffrage do, for the Civilopedia (civ-clone/web-renderer#1196).
      new Description(
        {
          type: 'military_unhappiness',
          subject: PoliceStation,
          value: policeStationExemption,
        },
        {
          type: 'acts_as',
          subject: WomensSuffrage,
          improvement: PoliceStation,
          scope: 'player',
        }
      )
    ),
  ];
};

export default getRules;
