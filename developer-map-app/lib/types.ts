export type DeveloperPin = {
  id: string;
  username: string;
  country: string;
  countryCode: string;
  coordinates: [number, number];
  joinedAt: string;
};

export type DevelopersPayload = {
  totalJoined: number;
  activeUsers: DeveloperPin[];
  incomingQueue: DeveloperPin[];
  source: "mock" | "x-live";
};

export type SubmissionRequest = {
  username: string;
  text: string;
  sourceRef?: string;
};
