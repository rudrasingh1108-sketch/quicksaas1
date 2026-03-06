import { cosineSimilarity } from '../utils/vector-similarity';
import { ProjectModule, User } from '../types/database.types';

export interface MatchResult {
  freelancerId: string;
  similarity: number;
  reliabilityMultiplier: number;
  availabilityMultiplier: number;
  score: number;
}

export function scoreFreelancerForModule(module: any, freelancer: any): MatchResult {
  const similarity = cosineSimilarity(freelancer.skill_vector, module.required_skills_vector || module.module_vector);
  const reliabilityMultiplier = Math.max(0.5, Math.min(1.5, freelancer.reliability_score || 1));
  const availabilityMultiplier = Math.max(0.3, Math.min(1.2, freelancer.availability_score));
  const score = similarity * reliabilityMultiplier * availabilityMultiplier;

  return {
    freelancerId: freelancer.id,
    similarity,
    reliabilityMultiplier,
    availabilityMultiplier,
    score,
  };
}

export function rankFreelancers(module: any, freelancers: any[], shiftKey: string): MatchResult[] {
  return freelancers
    .filter((f) => {
      const roleMatch = f.role === 'freelancer';
      const specialtyMatch = f.specialty_tags?.includes(module.module_key);
      // Check if freelancer is willing to work this shift
      const shiftMatch = !f.availability?.shifts || f.availability.shifts.includes(shiftKey);
      return roleMatch && specialtyMatch && shiftMatch;
    })
    .map((f) => scoreFreelancerForModule(module, f))
    .sort((a, b) => b.score - a.score);
}

export async function autoAssignTopCandidate(
  module: any,
  freelancers: any[],
  shiftKey: string,
  assigner: (moduleId: string, freelancerId: string) => Promise<void>,
): Promise<MatchResult | null> {
  const ranked = rankFreelancers(module, freelancers, shiftKey);
  const top = ranked[0];
  if (!top) return null;
  await assigner(module.id, top.freelancerId);
  return top;
}
