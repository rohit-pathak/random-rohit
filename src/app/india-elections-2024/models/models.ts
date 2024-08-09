export interface Constituency {
  id: string;
  name: string;
  stateOrUT: string;
  latitude: number;
  longitude: number;
}

export interface ConstituencyResult {
  constituencyId: string;
  candidateName: string;
  partyName: string;
  evmVotes: number;
  postalVotes: number;
  totalVotes: number;
  percentageOfVotes: number;
}
