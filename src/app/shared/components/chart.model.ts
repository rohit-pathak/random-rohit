import { AxisDomain } from "d3";

export type DomainDatum<T> = T & { toString(): string } & AxisDomain;

export type NumberKeys<T> = {
  [K in keyof T]: T[K] extends number ? K : never
}[keyof T];
