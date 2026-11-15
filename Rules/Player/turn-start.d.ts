import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityImprovementRegistry } from '@civ-clone/core-city-improvement/CityImprovementRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { ClientRegistry } from '@civ-clone/core-client/ClientRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { PendingEffectRegistry } from '@civ-clone/core-pending-effect';
import { PlayerGovernmentRegistry } from '@civ-clone/core-government/PlayerGovernmentRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import { GrowthLimit } from '@civ-clone/base-city-growth-limit/lib/growthLimit';
import TurnStart from '@civ-clone/core-player/Rules/TurnStart';
/**
 * Civ2's rapture growth (OpenCiv2 `city_process_disorder` ~4271–4277): a city that was already celebrating grows by 1,
 *  its food box untouched, under a government above Fundamentalism (a Republic or a Democracy), with food to spare
 *  after its citizens and Settlers eat, and no Aqueduct (@COSMIC 8) or Sewer System (12) cap in the way
 *  (`city_needed_size_improvement`). The size < 127 test is one of OpenCiv2's opt-in bug fixes, not the original's.
 */
export declare const raptureGrowthLimits: GrowthLimit[];
export declare const getRules: (
  cityRegistry?: CityRegistry,
  ruleRegistry?: RuleRegistry,
  engine?: Engine,
  playerGovernmentRegistry?: PlayerGovernmentRegistry,
  pendingEffects?: PendingEffectRegistry,
  turn?: Turn,
  clientRegistry?: ClientRegistry,
  cityGrowthRegistry?: CityGrowthRegistry,
  cityImprovementRegistry?: CityImprovementRegistry
) => TurnStart[];
export default getRules;
