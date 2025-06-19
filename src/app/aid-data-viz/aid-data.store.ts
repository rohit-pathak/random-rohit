import { patchState, signalStore, withMethods, withState } from "@ngrx/signals";
import { rxMethod } from "@ngrx/signals/rxjs-interop";
import { pipe, switchMap } from "rxjs";
import { AidDataService, AidTransaction } from "./aid-data.service";
import { inject } from "@angular/core";
import { tapResponse } from "@ngrx/operators";

interface AidDataState {
  isLoading: boolean;
  error: string | null;
  data: AidTransaction[];
}

export const AidDataStore = signalStore(
  withState<AidDataState>({
    isLoading: false,
    error: null,
    data: []
  }),
  withMethods((store, aidDataService = inject(AidDataService)) => {
    return {
      loadData: rxMethod<void>(
        pipe(
          switchMap(() => {
            return aidDataService.getTransactionData().pipe(
              tapResponse(
                res => {
                  console.log(res);
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