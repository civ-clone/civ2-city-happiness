import { Game } from '@civ-clone/core-game';
import { expect } from 'chai';
import register from '../index';

describe('register', (): void => {
  it("registers only civ2-city-happiness's rules, each with its own id, and the citizens' moods", (): void => {
    const game = new Game();

    register(game);

    const ids = game.rules.entries().map((rule) => rule.id());

    expect(ids).not.empty;
    ids.forEach((id) => expect(id).match(/^civ2-city-happiness:/));
    expect(new Set(ids).size).equal(ids.length);
    expect(game.additionalData.entries()).length(1);
  });

  it('loads no civ1-* or library-* module', (): void => {
    expect(
      Object.keys(require.cache).filter((path) =>
        /@civ-clone[\\/+](civ1|library)-/.test(path)
      )
    ).eql([]);
  });
});
