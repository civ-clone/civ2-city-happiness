import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import Action from '@civ-clone/core-player/Rules/Action';
export declare const getRules: (
  cityRegistry?: CityRegistry,
  pendingEffects?: PendingEffectRegistry
) => Action[];
export default getRules;
