import { Engine } from '@civ-clone/core-engine/Engine';
import {
  PendingEffect,
  PendingEffectRegistry,
} from '@civ-clone/core-pending-effect';
import City from '@civ-clone/core-city/City';
/** Recorded in the save for a city in civil disorder: a second turn of it brings a person's Democracy down. */
export declare const CIVIL_DISORDER = 'civ2-city-happiness:civil-disorder';
/** Recorded in the save for a city celebrating ("We Love the King Day"). */
export declare const LEADER_CELEBRATION =
  'civ2-city-happiness:leader-celebration';
export declare const civilDisorder: (
  city: City,
  pendingEffects?: PendingEffectRegistry
) => PendingEffect | null;
export declare const leaderCelebration: (
  city: City,
  pendingEffects?: PendingEffectRegistry
) => PendingEffect | null;
/** Registered with the rules, so a status loaded from a save can still end. */
export declare const registerHandlers: (
  pendingEffects?: PendingEffectRegistry,
  engine?: Engine
) => void;
