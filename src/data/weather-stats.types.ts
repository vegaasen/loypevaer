import type { Discipline } from "../lib/arrangements";

export interface BestWorstYear {
  year: number;
  comfortScore: number;
  avgTempMax: number;
  avgPrecipitation: number;
  avgWindSpeed: number;
  weatherCode: number;
}

export interface EventWeatherStats {
  id: string;
  name: string;
  discipline: Discipline;
  officialDate: string;
  region: string;
  avgTempMax: number | null;
  avgFeelsLikeMax: number | null;
  avgPrecipitation: number | null;
  avgWindSpeed: number | null;
  avgWeatherCode: number | null;
  comfortScore: number | null;
  bestYear: BestWorstYear | null;
  worstYear: BestWorstYear | null;
  /** Linear regression slope of tempMax over the decade (°C/year). Null if <3 years data. */
  tempTrend: number | null;
  dataYears: number;
}

export interface WeatherStatsData {
  generatedAt: string;
  events: EventWeatherStats[];
}
