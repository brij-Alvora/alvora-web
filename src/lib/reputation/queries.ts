import {
  calculateReputation,
  type ReputationSnapshot,
} from "@/lib/reputation/calculator";

export type { ReputationSnapshot };

export async function getReputationForUser(
  userId: string,
): Promise<ReputationSnapshot> {
  return calculateReputation(userId);
}
