import { CitizenMood } from '@civ-clone/base-city-happiness/lib/calculateCitizenState';
import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { SpecialistRegistry } from '@civ-clone/core-city/SpecialistRegistry';
import AdditionalData from '@civ-clone/core-data-object/AdditionalData';
import Yield from '@civ-clone/core-yield/Yield';
export type Citizens = {
  moods: CitizenMood[];
  causes: {
    yield: Yield;
    moods: CitizenMood[];
  }[];
};
/**
 * The mood of each of a city's working citizens, so a renderer can draw them without knowing the rule, as
 * civ1-city-happiness gives them: `causes` has one entry per `Happiness` or `Unhappiness` yield, in order, with the
 * moods once that yield and the ones before it are applied.
 */
export declare const getAdditionalData: (
  cityGrowthRegistry?: CityGrowthRegistry,
  specialistRegistry?: SpecialistRegistry
) => AdditionalData[];
export default getAdditionalData;
