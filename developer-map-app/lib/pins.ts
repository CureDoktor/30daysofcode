import { Developer } from "@prisma/client";
import { DeveloperPin } from "@/lib/types";

export function toDeveloperPin(developer: Developer): DeveloperPin {
  return {
    id: developer.id,
    username: developer.username,
    country: developer.country,
    countryCode: developer.countryCode,
    coordinates: [developer.longitude, developer.latitude],
    joinedAt: developer.joinedAt.toISOString(),
  };
}
