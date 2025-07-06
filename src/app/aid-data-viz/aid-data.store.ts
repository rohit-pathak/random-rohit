import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap } from "rxjs";
import { AidDataService, AidTransaction } from "./aid-data.service";
import { computed, inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";
import { FeatureCollection } from "geojson";

interface AidDataState {
  isLoading: boolean;
  isMapLoading: boolean;
  error: string | null;
  countriesGeoJson: FeatureCollection | null;
  data: AidTransaction[];
}

export const AidDataStore = signalStore(
  withState<AidDataState>({
    isLoading: false,
    isMapLoading: false,
    error: null,
    data: [],
    countriesGeoJson: null,
  }),
  withComputed((store) => {
    return {
      mapCountries: computed<Set<string>>(() => {
        const geoJson = store.countriesGeoJson();
        if (!geoJson) {
          return new Set();
        }
        return new Set(geoJson.features.map(feature => feature.properties?.['name'] ?? 'unknown'));
      })
    }
  }),
  withComputed((store) => {
    return {
      organizations: computed<string[]>(() => {
        const data = store.data();
        if (!data) {
          return [];
        }
        const countrySet = new Set(data.flatMap(d => [d.donor, d.recipient]));
        return [...countrySet.values()].filter(c => !store.mapCountries().has(c));
      })
    }
  }),
  withMethods((store, aidDataService = inject(AidDataService)) => {
    return {
      loadMap: rxMethod<void>(
        pipe(
          switchMap(() => {
            return aidDataService.getCountriesMap().pipe(
              tapResponse(
                (res) => {
                  patchState(store, {isMapLoading: false, countriesGeoJson: res});
                },
                (err) => {
                  console.error(err);
                  patchState(store, {isMapLoading: false, error: 'Failed to load map data.'});
                }
              )
            )
          })
        )
      ),
      loadData: rxMethod<void>(
        pipe(
          switchMap(() => {
            return aidDataService.getTransactionData().pipe(
              tapResponse(
                res => {
                  patchState(store, { isLoading: false, data: res });
                },
                err => {
                  console.error('Failed to load aid transactions', err);
                  patchState(store, { isLoading: false, error: 'Failed to load transaction data' });
                }
              )
            )
          })
        )
      )
    };
  })
)
