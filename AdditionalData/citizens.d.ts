import { CitizenMood } from '@civ-clone/base-city-happiness/lib/calculateCitizenState';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import AdditionalData from '@civ-clone/core-data-object/AdditionalData';
import { IStagedCountsByStage } from '@civ-clone/base-city-happiness/lib/calculateStagedCitizenState';
import Yield from '@civ-clone/core-yield/Yield';
export type Citizens = {
  moods: CitizenMood[];
  causes: {
    yield: Yield;
    moods: CitizenMood[];
  }[];
  stages: IStagedCountsByStage[];
};
/**
 * The mood of each of a city's working citizens, so a renderer can draw them without knowing the rule, worked out in
 * Civ2's stages (`lib/stagedHappiness`): happy, content, unhappy, then angry. `causes` has one entry per `Happiness` or
 * `Unhappiness` yield, in order, with the moods once that yield and the ones before it are applied, as
 * civ1-city-happiness gives them. `stages` has the happy, unhappy and angry counts after each of Civ2's stages ('base',
 * 'luxuries', 'buildings', 'units', 'wonders'), for a happiness panel that shows them.
 */
export declare const getAdditionalData: (
  cityGrowthRegistry?: CityGrowthRegistry,
  specialistRegistry?: SpecialistRegistry,
  playerGovernmentRegistry?: PlayerGovernmentRegistry
) => AdditionalData[];
export default getAdditionalData;
