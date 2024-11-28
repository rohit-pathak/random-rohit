import { Injectable } from '@angular/core';
import { ScaleOrdinal, scaleOrdinal } from "d3";

@Injectable()
export class ColorScaleService {

  // The following, along with "others" is derived from d3.schemeSet3.
  // The colors are re-arranged to assign commonly-associated colors with parties.
  public readonly partyColorMap = {
    "Bharatiya Janata Party": "#fdb462",
    "Indian National Congress": "#80b1d3",
    "Samajwadi Party": "#8dd3c7",
    "All India Trinamool Congress": "#bc80bd",
    "Dravida Munnetra Kazhagam": "#bebada",
    "Telugu Desam": "#ccebc5",
    "Janata Dal (United)": "#ffed6f",
    "Shiv Sena (Uddhav Balasaheb Thackrey)": "#fccde5",
    "Nationalist Congress Party – Sharadchandra Pawar": "#fb8072",
    "Shiv Sena": "#ffffb3",
    "Lok Janshakti Party(Ram Vilas)": "#b3de69",
  };

  public readonly others = "#d9d9d9";

  public partyColorScale(): ScaleOrdinal<string, string, string> {
    const topParties = Object.keys(this.partyColorMap);
    const colors = Object.values(this.partyColorMap);
    return scaleOrdinal<string>()
      .domain(topParties)
      .range(colors)
      .unknown(this.others)
  }

}
