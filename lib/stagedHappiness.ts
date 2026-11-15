import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  Happiness,
  LuxuryHappiness,
  MartialLaw,
  MilitaryUnhappiness,
  PopulationUnhappiness,
  Unhappiness,
} from '../Yields';
import {
  IHappinessStage,
  IStagedCitizenState,
  IStagedCounts,
  calculateStagedCitizenState,
} from '@civ-clone/base-city-happiness/lib/calculateStagedCitizenState';
import {
  PlayerGovernmentRegistry,
  instance as playerGovernmentRegistryInstance,
} from '@civ-clone/core-government/PlayerGovernmentRegistry';
import {
  SpecialistRegistry,
  instance as specialistRegistryInstance,
} from '@civ-clone/core-city/SpecialistRegistry';
import City from '@civ-clone/core-city/City';
import CityImprovementContent from '@civ-clone/base-city-yield-city-improvement-content/CityImprovementContent';
import CureForCancer from '@civ-clone/base-wonder-cureforcancer/CureForCancer';
import { FUNDAMENTALISM } from '@civ-clone/civ2-rules/data/governments';
import { GovernmentContent } from '../Yields/GovernmentContent';
import HangingGardens from '@civ-clone/base-wonder-hanging-gardens/HangingGardens';
import JsBachsCathedral from '@civ-clone/base-wonder-jsbachscathedral/JsBachsCathedral';
import ShakespearesTheatre from '@civ-clone/base-wonder-shakespearestheatre/ShakespearesTheatre';
import Yield from '@civ-clone/core-yield/Yield';
import governmentOf from '@civ-clone/civ2-city/lib/government';

/** Civ2's happiness stages after the base, in `city_calc_trade_happiness`'s order. */
export const stageNames = [
  'luxuries',
  'buildings',
  'units',
  'wonders',
] as const;

export type StageName = 'base' | (typeof stageNames)[number];

/** J. S. Bach's Cathedral makes 2 unhappy citizens content in each of its owner's cities (`city_calc_trade_happiness`). */
export const bachContent = 2;

/** Whether `cityYield` was given by `Provider` (a wonder's yields name it by its class's name: civ2-wonder). */
const providedBy = (cityYield: Yield, Provider: Function): boolean =>
  cityYield
    .values()
    .some(
      ([, provider]: [number, string]): boolean => provider === Provider.name
    );

/** What a city's yields say about its happiness, sorted into Civ2's stages. */
export interface HappinessStages {
  /** The citizens born unhappy, and those the empire's size makes unhappy: any beyond the city's size are angry. */
  unhappy: number;
  stages: IHappinessStage[];
}

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
export const happinessStages = (
  yields: Yield[],
  fundamentalism: boolean = false
): HappinessStages => {
  let unhappy = 0,
    luxuries = 0,
    buildingsHappy = 0,
    buildingsContent = 0,
    martialLaw = 0,
    hasMartialLaw = false,
    militaryUnhappy = 0,
    wondersHappy = 0,
    shakespeare = false,
    bach = false;

  yields.forEach((cityYield: Yield): void => {
    const value = cityYield.value();

    if (cityYield instanceof Happiness) {
      if (cityYield instanceof LuxuryHappiness) {
        luxuries += value;

        return;
      }

      if (
        providedBy(cityYield, HangingGardens) ||
        providedBy(cityYield, CureForCancer)
      ) {
        wondersHappy += value;

        return;
      }

      buildingsHappy += value;

      return;
    }

    if (!(cityYield instanceof Unhappiness)) {
      return;
    }

    if (cityYield instanceof GovernmentContent) {
      // Fundamentalism: the stage below sets it from the government itself.
      return;
    }

    if (cityYield instanceof MartialLaw) {
      hasMartialLaw = true;
      martialLaw -= value;

      return;
    }

    if (cityYield instanceof MilitaryUnhappiness) {
      militaryUnhappy += value;

      return;
    }

    if (cityYield instanceof CityImprovementContent) {
      buildingsContent -= value;

      return;
    }

    if (providedBy(cityYield, ShakespearesTheatre)) {
      shakespeare = true;

      return;
    }

    if (providedBy(cityYield, JsBachsCathedral)) {
      bach = true;

      return;
    }

    if (cityYield instanceof PopulationUnhappiness || value > 0) {
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
                  apply: (counts: IStagedCounts): IStagedCounts => ({
                    ...counts,
                    unhappy:
                      counts.unhappy -
                      Math.min(
                        Math.max(martialLaw, 0),
                        Math.max(counts.unhappy, 0)
                      ),
                  }),
                },
              ]
            : []),
          ...(fundamentalism
            ? [
                {
                  apply: (counts: IStagedCounts): IStagedCounts => ({
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
                  apply: (counts: IStagedCounts): IStagedCounts => ({
                    ...counts,
                    unhappy: 0,
                  }),
                },
              ]
            : []),
          ...(bach ? [{ content: bachContent }] : []),
        ],
      },
    ],
  };
};

export interface StagedHappinessDependencies {
  cityGrowthRegistry?: CityGrowthRegistry;
  playerGovernmentRegistry?: PlayerGovernmentRegistry;
  specialistRegistry?: SpecialistRegistry;
}

/**
 * The happy, unhappy and angry citizens of `city`, worked out in Civ2's stages from its yields (`happinessStages`), and
 *  the counts after each stage (`stages`: 'base', 'luxuries', 'buildings', 'units', 'wonders'), for a city screen's
 *  happiness panel. Disorder is fewer happy citizens than unhappy ones, and the angry are among the unhappy
 *  (`city_process_disorder`).
 */
export const stagedHappiness = (
  city: City,
  yields: Yield[] = city.yields(),
  {
    cityGrowthRegistry = cityGrowthRegistryInstance,
    playerGovernmentRegistry = playerGovernmentRegistryInstance,
    specialistRegistry = specialistRegistryInstance,
  }: StagedHappinessDependencies = {}
): IStagedCitizenState => {
  const { unhappy, stages } = happinessStages(
    yields,
    governmentOf(city.player(), playerGovernmentRegistry) === FUNDAMENTALISM
  );

  return calculateStagedCitizenState({
    size: cityGrowthRegistry.getByCity(city).size(),
    specialists: specialistRegistry.getByCity(city).length,
    unhappy,
    stages,
  });
};

export default stagedHappiness;
