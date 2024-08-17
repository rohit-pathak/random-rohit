import { patchState, signalStore, withComputed, withMethods, withState } from "@ngrx/signals";
import { FeatureCollection } from "geojson";
import { Constituency, ConstituencyResult } from "./models/models";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { computed, inject } from "@angular/core";
import { ElectionDataService } from "./services/election-data.service";
import { switchMap, tap } from "rxjs/operators";
import { forkJoin, pipe } from "rxjs";
import { tapResponse } from "@ngrx/operators";

interface ElectionDataState {
  isLoading: boolean;
  error: string | null;
  constituencies2024Map: FeatureCollection | null;
  constituencies: Constituency[];
  constituencyResults: ConstituencyResult[];
}

const initialState: ElectionDataState = {
  isLoading: false,
  error: null,
  constituencies2024Map: null,
  constituencies: [],
  constituencyResults: []
}

export const ElectionDataStore = signalStore(
  withState(initialState),
  withComputed((state) => {
    return {
      constituenciesById: computed(() => {
        return state.constituencies().reduce((acc, curr) => {
          acc[curr.id] = curr;
          return acc;
        }, {} as Record<string, Constituency>);
      }),
      resultsByConstituency: computed(() => { // returns results for each constituency sorted by totalVotes desc
        const resultsMap = state.constituencyResults().reduce((acc, curr) => {
          if (!(curr.constituencyId in acc)) {
            acc[curr.constituencyId] = [];
          }
          acc[curr.constituencyId].push(curr);
          return acc;
        }, {} as Record<string, ConstituencyResult[]>);
        Object.values(resultsMap).forEach(results => results.sort((a, b) => b.totalVotes - a.totalVotes));
        return resultsMap;
      }),
      totalVotesByParty: computed(() => {
        return state.constituencyResults().reduce((acc, curr) => {
          acc[curr.partyName] = (acc[curr.partyName] || 0) + curr.totalVotes;
          return acc;
        }, {} as Record<string, number>);
      })
    }
  }),
  withMethods((store, electionDataService = inject(ElectionDataService)) => {
    return {
      loadAllData: rxMethod<void>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(() => {
            return forkJoin([
              electionDataService.getMapGeoJSON(),
              electionDataService.getConstituencies(),
              electionDataService.getConstituencyResults()
            ]).pipe(
              tapResponse(
                ([mapData, constituencies, constituencyResults]) => {
                  patchState(store, {
                    constituencies2024Map: mapData,
                    constituencies,
                    constituencyResults,
                  });
                },
                (error) => {
                  console.error(error);
                  patchState(store, {isLoading: false, error: 'Failed to load data'})
                }
              )
            )
          })
        )
      )
    };
  })
);