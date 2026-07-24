import type { Deck } from "./types";
import { gettingStartedDeck } from "./getting-started";
import { gitWeatherForecastDeck } from "./git-weather-forecast";
import { aiPicklesDeck } from "./ai-pickles";

export const DECKS: Deck[] = [gettingStartedDeck, gitWeatherForecastDeck, aiPicklesDeck];
