# civ2-city-happiness

Civilization II's city happiness, on `base-city-happiness` and `base-city-happiness-status`, from OpenCiv2's
`city_calc_trade_happiness`, `city_calc_unit_support` and `city_process_disorder` (`src/auto/city.cpp`,
richardpenman/civ2@49f26ec). The numbers in RULES.TXT come from `civ2-rules`' effective @COSMIC values; the martial law
and military unhappiness tables by government, and the revolution, are civ2-government's.

- **Content citizens** (`Rules/City/yield`, `data/happiness`): a person's city has @COSMIC's first unhappy size − 1 −
  level content citizens (6 on Chieftain down to 1 on Deity), a computer player's 3; the rest are born unhappy.
- **Empire size:** a person's city gains `(cities − limit + index % limit) / limit` unhappy citizens, where the limit
  is (government pair + 2) × (riot factor − 2 × level, + 2 on a large map) / 2. None under Communism.
- **Luxuries** (`Rules/City/cost`): each 2 make a citizen happier.
- **Martial law:** under Anarchy, Despotism and Monarchy each unit with an attack in the city calms 1, under Communism
  2, up to 3 units. **Fundamentalism:** no unhappy citizens.
- **Military unhappiness:** each aggressive unit makes 1 citizen unhappy under the Republic (but the first) and 2 under
  Democracy. Aggressive: an attack, not diplomacy or trade, and an aircraft other than a fighter anywhere, or any
  other unit off every city's square and not on a Fortress within 3 of one of its player's cities.
- **Civil disorder:** more unhappy citizens than happy ones. A person's Democracy falls into Anarchy on a city's second
  turn of it (`civil-disorder` revolution).
- **Celebrating** ("We Love the King Day"): more than 2 citizens, none unhappy, at least half happy, not under Anarchy.
  Its squares escape the Anarchy/Despotism penalty and get the trade bonus from Monarchy up (civ2-world's
  `governmentTileYield`). A celebration ends when its conditions fail, in disorder too, announced only outside
  disorder and Anarchy.
- **Citizens' moods** (`AdditionalData/citizens`) for a renderer, as civ1-city-happiness gives them.

## Not yet (Civ2 M2a deviations and gaps)

- **Civ1-shaped happiness:** no angry citizens (unhappy past the city's size are dropped) and the base calculator's
  order, not Civ2's clamp after each stage (M2c).
- **Rapture growth:** a Republic's or Democracy's city celebrating for a second turn doesn't grow yet (M2c).
- **Celebrating's corruption step** (civ2-city).
- **Content from improvements and wonders**, the Police Station and Women's Suffrage, the Courthouse's and Palace's
  happy citizen under Democracy: civ2-city-improvement and civ2-wonder.
- **City numbers:** empire size counts a city's place among every player's cities in founding order; Civ2 reuses a
  destroyed city's slot for the next city founded, so its numbers can differ once a city is gone.
- **Palace floor:** the content limit's floor of 2 with a Palace and no units abroad never changes the outcome at
  @COSMIC's 7, so it isn't modelled.
- **`GovernmentContent`** (Fundamentalism's content) is a yield class of this package's own until another rule set
  needs it in a `base-city-yield-*` package; `PlayerActions/CivilDisorder` is the same shape as civ1-city-happiness's.
