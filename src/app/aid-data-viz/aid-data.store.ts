import { patchState, signalState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap } from "rxjs";
import { AidDataService, AidTransaction } from "./aid-data.service";
import { computed, inject, Injectable } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { FeatureCollection } from "geojson";
import { max, min } from "d3";

interface AidDataState {
  isLoading: boolean;
  isMapLoading: boolean;
  error: string | null;
  countriesGeoJson: FeatureCollection | null;
  data: AidTransaction[];
  selectedEntity: string | null;
  selectedYearRange: [number, number] | null;
}

@Injectable()
export class AidDataStore {
  private readonly aidDataService = inject(AidDataService);
  private readonly state = signalState<AidDataState>({
    isLoading: false,
    isMapLoading: false,
    error: null,
    data: [],
    countriesGeoJson: null,
    selectedEntity: null,
    selectedYearRange: null,
  });

  // state properties
  readonly isLoading = this.state.isLoading;
  readonly isMapLoading = this.state.isMapLoading;
  readonly error = this.state.error;
  readonly data = this.state.data;
  readonly countriesGeoJson = this.state.countriesGeoJson;
  readonly selectedEntity = this.state.selectedEntity;
  readonly selectedYearRange = this.state.selectedYearRange;

  // computed properties
  readonly mapCountries = computed<Set<string>>(() => {
    const geoJson = this.countriesGeoJson();
    if (!geoJson) {
      return new Set();
    }
    return new Set(geoJson.features.map(feature => feature.properties?.['name'] ?? 'unknown'));
  });

  readonly organizations = computed<string[]>(() => {
    const data = this.data();
    if (!data) {
      return [];
    }
    const countrySet = new Set(data.flatMap(d => [d.donor, d.recipient]));
    return [...countrySet.values()].filter(c => !this.mapCountries().has(c));
  });

  readonly dataInYearRange = computed(() => {
    const selectedYearRange = this.state.selectedYearRange();
    if (!selectedYearRange) {
      return this.state.data();
    }
    const [begin, end] = selectedYearRange;
    return this.state.data().filter(d => d.year >= begin && d.year <= end);
  });

  readonly dataByCountryOrOrg = computed<Map<string, AidDataAggregate>>(() => {
    const data = this.dataInYearRange();
    const nameDataMap = new Map<string, AidDataAggregate>();
    for (const transaction of data) {
      const donorEntry = nameDataMap.get(transaction.donor) ?? {
        name: transaction.donor,
        totalDonated: 0,
        totalReceived: 0,
        transactions: []
      }
      donorEntry.totalDonated += transaction.amount;
      donorEntry.transactions.push(transaction);
      nameDataMap.set(transaction.donor, donorEntry);

      const recipientEntry = nameDataMap.get(transaction.recipient) ?? {
        name: transaction.recipient,
        totalDonated: 0,
        totalReceived: 0,
        transactions: []
      }
      recipientEntry.totalReceived += transaction.amount;
      recipientEntry.transactions.push(transaction);
      nameDataMap.set(transaction.recipient, recipientEntry);
    }
    return nameDataMap;
  });

  readonly totalYearRange = computed<[number, number]>(() => {
    const data = this.transactionsPerYear();
    return [min(data.map(d => d.year)) ?? 0, max(data.map(d => d.year)) ?? 0] as [number, number];
  });

  readonly selectedEntityData = computed<AidDataAggregate | null>(() => {
    const selected = this.selectedEntity();
    const data = this.dataByCountryOrOrg().get(selected ?? '');
    if (!selected || !data) {
      return null;
    }
    return data;
  });

  readonly selectedReceivedPerYear = computed<YearTotal[]>(() => {
    const selected = this.selectedEntityData();
    if (!selected) {
      return [];
    }
    const data = this.data().filter(t => t.recipient === selected.name);
    return transactionsPerYear(data);
  });

  readonly selectedDonatedPerYear = computed<YearTotal[]>(() => {
    const selected = this.selectedEntityData();
    if (!selected) {
      return [];
    }
    const data = this.data().filter(t => t.donor === selected.name);
    return transactionsPerYear(data);
  });

  readonly transactionsPerYear = computed<YearTotal[]>(() => {
    const data = this.data();
    return transactionsPerYear(data);
  });

  // methods
  readonly loadMap = rxMethod<void>(
    pipe(
      switchMap(() => {
        return this.aidDataService.getCountriesMap().pipe(
          tapResponse(
            (res) => {
              patchState(this.state, { isMapLoading: false, countriesGeoJson: res });
            },
            (err) => {
              console.error(err);
              patchState(this.state, { isMapLoading: false, error: 'Failed to load map data.' });
            }
          )
        );
      })
    )
  );

  readonly loadData = rxMethod<void>(
    pipe(
      switchMap(() => {
        return this.aidDataService.getTransactionData().pipe(
          tapResponse(
            res => {
              patchState(this.state, { isLoading: false, data: res });
            },
            err => {
              console.error('Failed to load aid transactions', err);
              patchState(this.state, { isLoading: false, error: 'Failed to load transaction data' });
            }
          )
        );
      })
    )
  );

  readonly setYearRange = (selectedYearRange: [number, number] | null) => patchState(this.state, { selectedYearRange });
  readonly setSelectedSymbolDatum = (selected: string | null) => {
    patchState(this.state, (state) => {
      if (state.selectedEntity === selected) {
        return { selectedEntity: null };
      }
      return { selectedEntity: selected };
    });
  }
}

function transactionsPerYear(data: AidTransaction[]): YearTotal[] {
  const perYear = new Map<number, YearTotal>();
  data.forEach(d => {
    const yearTotal: YearTotal = perYear.get(d.year) ?? { year: d.year, amount: 0 };
    yearTotal.amount += d.amount;
    perYear.set(d.year, yearTotal);
  });
  return [...perYear.values()]
    .filter(d => d.year !== 9999) // filter bad data
    .sort((a, b) => a.year - b.year);
}


export interface AidDataAggregate {
  name: string;
  totalDonated: number;
  totalReceived: number;
  transactions: AidTransaction[];
}

export interface YearTotal {
  year: number;
  amount: number;
}
