# civ2-city-happiness

Civilization II's city happiness, on `base-city-happiness` and `base-city-happiness-status`, from OpenCiv2's
`city_calc_trade_happiness`, `city_calc_unit_support` and `city_process_disorder` (`src/auto/city.cpp`,
richardpenman/civ2@49f26ec). The numbers in RULES.TXT come from `civ2-rules`' effective @COSMIC values; the martial law
and military unhappiness tables by government, and the revolution, are civ2-government's.

- **Stages** (`lib/stagedHappiness`): the city's happiness is worked out in `city_calc_trade_happiness`'s five stages,
  base, luxuries, buildings, units and wonders, each clamped (`city_happy_clamp_stage`) before the next, by
  base-city-happiness' `calculateStagedCitizenState`. `stagedHappiness(city, yields?)` sorts the city's yields into
  the stages and gives the happy, unhappy and angry citizens, and the counts after each stage for a city screen.
  `happinessStages(yields)` is the sorting alone.
- **Angry citizens:** those born unhappy beyond the city's size. After each stage an angry citizen becomes a plain
  unhappy one before any content effect reaches a plain unhappy citizen, so an angry citizen takes two to become
  content. They count among the unhappy for disorder.
- **Content citizens** (`Rules/City/yield`, `data/happiness`): a person's city has @COSMIC's first unhappy size − 1 −
  level content citizens (6 on Chieftain down to 1 on Deity), a computer player's 3; the rest are born unhappy.
- **Empire size:** a person's city gains `(cities − limit + index % limit) / limit` unhappy citizens, where the limit
  is (government pair + 2) × (riot factor − 2 × level, + 2 on a large map) / 2. None under Communism.
- **Luxuries** (`Rules/City/cost`): each 2 make a citizen happier.
- **Martial law:** under Anarchy, Despotism and Monarchy each unit with an attack in the city calms 1, under Communism
  2, up to 3 units, but no more than are unhappy after the buildings. **Fundamentalism:** no unhappy or angry citizens.
- **Military unhappiness:** each aggressive unit makes 1 citizen unhappy under the Republic (but the first) and 2 under
  Democracy, 1 fewer with a Police Station in the city or its player's Women's Suffrage (one test, so they don't
  stack). Aggressive: an attack, not diplomacy or trade, and an aircraft other than a fighter anywhere, or any
  other unit off every city's square and not on a Fortress within 3 of one of its player's cities.
- **Civil disorder:** more unhappy citizens than happy ones. A person's Democracy falls into Anarchy on a city's second
  turn of it (`civil-disorder` revolution).
- **Celebrating** ("We Love the King Day"): more than 2 citizens, none unhappy, at least half happy, not under Anarchy.
  A celebration ends when its conditions fail, in disorder too, announced only outside disorder and Anarchy. What it
  does to the city's squares is civ2-city's (its per-square steps read the same status).
- **Wonders** (stage 4, from civ2-wonder's yields): the Hanging Gardens' and the Cure for Cancer's happy citizens, then
  Shakespeare's Theatre's city has no unhappy citizens (its angry ones come back as unhappy in the clamp), then J. S.
  Bach's makes 2 content.
- **Citizens' moods** (`AdditionalData/citizens`) for a renderer: `moods` (`'angry'` among them), `causes` as
  civ1-city-happiness gives them, and `stages`, the counts after each stage.

## Not yet (Civ2 M2a deviations and gaps)

- **Content from improvements and wonders**, the Courthouse's and Palace's happy citizen under Democracy:
  civ2-city-improvement and civ2-wonder give the yields; the stages here only sort them. A wonder's yield is known by
  its provider, the wonder's class name.
- **City numbers:** empire size counts a city's place among every player's cities in founding order; Civ2 reuses a
  destroyed city's slot for the next city founded, so its numbers can differ once a city is gone.
- **Palace floor:** the content limit's floor of 2 with a Palace and no units abroad never changes the outcome at
  @COSMIC's 7, so it isn't modelled.
- **`GovernmentContent`** (Fundamentalism's content) is a yield class of this package's own until another rule set
  needs it in a `base-city-yield-*` package; `PlayerActions/CivilDisorder` is the same shape as civ1-city-happiness's.
