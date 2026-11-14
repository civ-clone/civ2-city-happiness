import { Game, defaultGame } from '@civ-clone/core-game';
import cityCaptured from './Rules/City/captured';
import cityCelebrateLeader from './Rules/City/celebrate-leader';
import cityCelebrationYield from './Rules/City/celebration-yield';
import cityCivilDisorder from './Rules/City/civil-disorder';
import cityCost from './Rules/City/cost';
import cityDestroyed from './Rules/City/destroyed';
import cityYield from './Rules/City/yield';
import playerAction from './Rules/Player/action';
import playerTurnStart from './Rules/Player/turn-start';

export const register = (game: Game): void => {
  game.rules.register(
    ...cityCaptured(game.pendingEffects),
    ...cityCelebrateLeader(
      game.cityGrowth,
      game.specialists,
      game.playerGovernments
    ),
    ...cityCelebrationYield(
      game.pendingEffects,
      game.playerGovernments,
      game.tileImprovements
    ),
    ...cityCivilDisorder(game.cityGrowth, game.specialists),
    ...cityCost(game.playerGovernments, game.units),
    ...cityDestroyed(game.pendingEffects),
    ...cityYield(
      game.cityGrowth,
      game.playerGovernments,
      game.units,
      game.cities,
      game.difficulty,
      game.clients,
      game.tileImprovements,
      game.rules,
      {
        cityImprovementRegistry: game.cityImprovements,
        wonderRegistry: game.wonders,
        playerResearchRegistry: game.playerResearch,
        requirementRegistry: game.requirements,
      }
    ),
    ...playerAction(game.cities, game.pendingEffects),
    ...playerTurnStart(
      game.cities,
      game.rules,
      game.engine,
      game.playerGovernments,
      game.pendingEffects,
      game.turn,
      game.clients
    )
  );
};

// The plugin loader imports each package for this side effect. Until it passes a `Game` of its own, dropping it would
//  produce a game with silently absent rules: no error, just wrong behaviour.
register(defaultGame);

export default register;
