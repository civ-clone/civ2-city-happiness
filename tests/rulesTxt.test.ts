import {
  computerContent,
  empireSizeLimit,
  humanContent,
} from '../data/happiness';
import { expect } from 'chai';
import { join } from 'path';
import { readCosmic } from '@civ-clone/civ2-asset-extractor/rules';
import { readFileSync } from 'fs';

// Compares what the rules do with the player's own RULES.TXT's @COSMIC values. Skipped unless `CIV2_PATH` names the
//  game's folder, so CI, which has no copy of the game, never runs it. Only numbers are compared, and a failure names
//  the row, never the file's text.
const path = process.env.CIV2_PATH;

(path ? describe : describe.skip)('RULES.TXT', (): void => {
  const { effective } = readCosmic(
    path ? readFileSync(join(path, 'RULES.TXT'), 'latin1') : ''
  );

  it('@COSMIC row 8: content citizens from the first unhappy size', (): void => {
    [0, 1, 2, 3, 4, 5].forEach(
      (level) =>
        expect(
          humanContent(level) === effective.unhappySize - level - 1,
          `row 8, level ${level}`
        ).true
    );
    expect(computerContent === effective.unhappySize - 4, 'row 8').true;
  });

  it('@COSMIC row 9: the empire size limit from the riot factor', (): void => {
    [0, 3, 5].forEach((level) =>
      [0, 1, 2, 3, 4, 5, 6].forEach((government) =>
        [false, true].forEach(
          (large) =>
            expect(
              empireSizeLimit(government, level, large) ===
                Math.max(
                  Math.trunc(
                    (((government >> 1) + 2) *
                      (effective.riotFactor - 2 * level + (large ? 2 : 0))) /
                      2
                  ),
                  1
                ),
              `row 9, government ${government}, level ${level}`
            ).true
        )
      )
    );
  });
});
