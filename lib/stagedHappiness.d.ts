import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  IHappinessStage,
  IStagedCitizenState,
} from '@civ-clone/base-city-happiness/lib/calculateStagedCitizenState';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import City from '@civ-clone/core-city/City';
import Yield from '@civ-clone/core-yield/Yield';
/** Civ2's happiness stages after the base, in `city_calc_trade_happiness`'s order. */
export declare const stageNames: readonly [
  'luxuries',
  'buildings',
  'units',
  'wonders'
];
export type StageName = 'base' | (typeof stageNames)[number];
/** J. S. Bach's Cathedral makes 2 unhappy citizens content in each of its owner's cities (`city_calc_trade_happiness`). */
export declare const bachContent = 2;
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
export declare const happinessStages: (
  yields: Yield[],
  fundamentalism?: boolean
) => HappinessStages;
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
export declare const stagedHappiness: (
  city: City,
  yields?: Yield[],
  {
    cityGrowthRegistry,
    playerGovernmentRegistry,
    specialistRegistry,
  }?: StagedHappinessDependencies
) => IStagedCitizenState;
export default stagedHappiness;
