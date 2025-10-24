import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { csvParse } from "d3";
import { map, Observable } from "rxjs";
import { FeatureCollection } from "geojson";

export interface AidTransaction {
  donor: string;
  recipient: string;
  year: number;
  amount: number;
}

@Injectable()
export class AidDataService {
  private httpClient = inject(HttpClient);

  getCountriesMap(): Observable<FeatureCollection> {
    return this.httpClient.get<FeatureCollection>('/data/aid-data/countries.fixed.geo.json')
  }

  getTransactionData(): Observable<AidTransaction[]> {
    return this.httpClient.get('/data/aid-data/aid-data.csv', {responseType: 'text'}).pipe(
      map(rawData => {
        return csvParse<'donor' | 'recipient' | 'year' | 'commitment_amount_usd_constant_sum'>(rawData).map(d => {
          const transaction: AidTransaction = {
            donor: d.donor,
            recipient: d.recipient,
            year: +d.year,
            amount: +d.commitment_amount_usd_constant_sum
          };
          return transaction;
        });
      })
    )
  }
}
