import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { FeatureCollection } from "geojson";
import { map, Observable } from "rxjs";
import { csvParse } from "d3";
import { Constituency } from "../models/models";

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

}
