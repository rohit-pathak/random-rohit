import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { FeatureCollection } from "geojson";
import { map, Observable } from "rxjs";
import { csvParse, dsvFormat } from "d3";
import { Constituency, ConstituencyResult } from "../models/models";

@Injectable()
export class ElectionDataService {
  constructor(private http: HttpClient) {
  }

  public getMapGeoJSON(): Observable<FeatureCollection> {
    return this.http.get<FeatureCollection>('/data/india-parliamentary-constituencies-2024.geo.json');
  }

  public getConstituencies(): Observable<Constituency[]> {
    return this.http.get('/data/constituencies.csv', { responseType: "text" }).pipe(
      map((rawData) => {
          return csvParse<keyof Constituency>(rawData).map(d => {
            const result: Constituency = {
              id: d.id,
              name: d.name,
              stateOrUT: d.stateOrUT,
              latitude: +d.latitude,
              longitude: +d.longitude,
            };
            return result;
          })
        }
      )
    );
  }

  public getConstituencyResults(): Observable<ConstituencyResult[]> {
    return this.http.get('/data/constituency-results.csv', { responseType: "text" }).pipe(
      map((resultsCsv) => {
        const parser = dsvFormat(";")
        return parser.parse<keyof ConstituencyResult>(resultsCsv).map(d => {
          const result: ConstituencyResult = {
            constituencyId: d.constituencyId,
            candidateName: d.candidateName,
            partyName: d.partyName,
            evmVotes: +d.evmVotes,
            postalVotes: +d.postalVotes,
            totalVotes: +d.totalVotes,
            percentageOfVotes: +d.percentageOfVotes
          }
          return result;
        })
      })
    )
  }

}
