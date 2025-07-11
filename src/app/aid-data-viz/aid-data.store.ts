import { patchState, signalState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap } from "rxjs";
import { AidDataService, AidTransaction } from "./aid-data.service";
import { computed, inject, Injectable } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { FeatureCollection } from "geojson";

interface AidDataState {
  isLoading: boolean;
  isMapLoading: boolean;
  error: string | null;
  countriesGeoJson: FeatureCollection | null;
  data: AidTransaction[];
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
  });

  // state properties
  readonly isLoading = this.state.isLoading;
  readonly isMapLoading = this.state.isMapLoading;
  readonly error = this.state.error;
  readonly data = this.state.data;
  readonly countriesGeoJson = this.state.countriesGeoJson;

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
  })

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

}
