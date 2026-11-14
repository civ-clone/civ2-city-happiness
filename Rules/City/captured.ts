import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect';
import { CIVIL_DISORDER, LEADER_CELEBRATION } from '../../lib/cityStatus';
import Captured from '@civ-clone/core-city/Rules/Captured';
import City from '@civ-clone/core-city/City';
import Effect from '@civ-clone/core-rule/Effect';
import { High } from '@civ-clone/core-rule/Priorities';
import { forgetCityStatuses } from '@civ-clone/base-city-happiness-status/lib/cityStatus';

export const getRules = (
  pendingEffects: PendingEffectRegistry = pendingEffectRegistryInstance
): Captured[] => [
  // A captured city, taken by force or incited, starts out for its captor neither in disorder nor celebrating (OpenCiv2
  //  `src/auto/city.cpp` `city_capture_aftermath`, richardpenman/civ2@49f26ec: `flags & 0xffffffc4` clears
  //  `CITYF_DISORDER` and `CITYF_CELEBRATING`). Dropped rather than ended, so the captor isn't told order was restored
  //  or the celebration is over. At `High`, ahead of the other packages' `Captured` rules that read the city's status.
  new Captured(
    'civ2-city-happiness:city/captured/forget-status',
    new High(),
    new Effect((city: City): void =>
      forgetCityStatuses(
        city,
        [CIVIL_DISORDER, LEADER_CELEBRATION],
        pendingEffects
      )
    )
  ),
];

export default getRules;
