import City from '@civ-clone/core-city/City';
import PlayerAction from '@civ-clone/core-player/PlayerAction';

/** A city of the player's is in civil disorder: offered so the player can see to it. */
export class CivilDisorder extends PlayerAction<City> {}

export default CivilDisorder;
