import { GoogleGenAI } from '@google/genai';

interface ProblemInput {
  id: string;
  title: string;
  description: string;
  sector: string;
  location: string;
  budget: number;
  timeline_months: number;
  expected_impact: string;
  technologies: string[];
  requirements: { title: string; description: string; is_mandatory: boolean }[];
}

interface StartupInput {
  id: string;
  company_name: string;
  stage: string;
  team_size: number;
  funding_total: number;
  location: string;
  description: string;
  pitch_summary: string;
  previous_gov_experience: boolean;
  technologies: string[];
  sectors: string[];
  projects: { title: string; client: string; description: string; year: number }[];
  certifications: { name: string; issuing_body: string; year: number }[];
}

export interface MatchResult {
  overall_score: number;
  technology_score: number;
  sector_score: number;
  requirement_score: number;
  experience_score: number;
  budget_fit_score: number;
  location_fit_score: number;
  impact_potential_score: number;
  match_explanation: string;
  strengths: string[];
  potential_risks: string[];
  recommended_next_step: string;
  is_fallback: boolean;
}

export async function matchProblemAndStartup(
  problem: ProblemInput,
  startup: StartupInput
): Promise<MatchResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are the AI Semantic Matching Engine for InnovProcure, an enterprise government innovation procurement platform.
Your task is to objectively evaluate the alignment between a Government Problem Statement and a Tech Startup based EXCLUSIVELY on the provided factual data.
DO NOT fabricate details.

GOVERNMENT PROBLEM STATEMENT:
Title: ${problem.title}
Sector: ${problem.sector}
Description: ${problem.description}
Location: ${problem.location}
Budget: INR ₹${problem.budget}
Timeline: ${problem.timeline_months} months
Expected Impact: ${problem.expected_impact}
Required Technologies: ${problem.technologies.join(', ') || 'None specified'}
Key Requirements:
${problem.requirements.map((r, i) => `${i + 1}. [${r.is_mandatory ? 'Mandatory' : 'Optional'}] ${r.title}: ${r.description}`).join('\n')}

STARTUP PROFILE:
Company: ${startup.company_name}
Sector Focus: ${startup.sectors.join(', ')}
Stage: ${startup.stage} | Team Size: ${startup.team_size} | Funding: INR ₹${startup.funding_total}
Location: ${startup.location}
Description: ${startup.description}
Pitch Summary: ${startup.pitch_summary}
Previous Government Experience: ${startup.previous_gov_experience ? 'Yes' : 'No'}
Technologies: ${startup.technologies.join(', ')}
Past Projects:
${startup.projects.map(p => `- ${p.title} for ${p.client} (${p.year}): ${p.description}`).join('\n') || 'None listed'}
Certifications:
${startup.certifications.map(c => `- ${c.name} (${c.issuing_body}, ${c.year})`).join('\n') || 'None listed'}

Evaluate across these 7 dimensions (score 0 to 100):
1. technology_score: overlap and capability in required tech stack
2. sector_score: domain alignment with government sector
3. requirement_score: ability to meet specific problem requirements
4. experience_score: previous government projects and certifications
5. budget_fit_score: alignment with project budget and startup funding scale
6. location_fit_score: proximity or deployment capability in target location
7. impact_potential_score: ability to deliver the stated public impact

Overall score formula: (tech*0.25 + sector*0.15 + req*0.25 + exp*0.15 + budget*0.10 + impact*0.10)

Respond ONLY with a valid JSON object with exact keys:
{
  "overall_score": number (0-100),
  "technology_score": number (0-100),
  "sector_score": number (0-100),
  "requirement_score": number (0-100),
  "experience_score": number (0-100),
  "budget_fit_score": number (0-100),
  "location_fit_score": number (0-100),
  "impact_potential_score": number (0-100),
  "match_explanation": string (2-3 sentences concise professional evaluation),
  "strengths": string[] (3-4 bullet points based strictly on data),
  "potential_risks": string[] (1-2 real operational or scaling risks),
  "recommended_next_step": string (e.g. "Invite for formal screening", "Request field verification", "Approve for pilot")
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '';
      const parsed = JSON.parse(responseText);

      return {
        overall_score: Math.min(100, Math.max(0, Math.round(parsed.overall_score || 75))),
        technology_score: Math.min(100, Math.max(0, Math.round(parsed.technology_score || 70))),
        sector_score: Math.min(100, Math.max(0, Math.round(parsed.sector_score || 70))),
        requirement_score: Math.min(100, Math.max(0, Math.round(parsed.requirement_score || 70))),
        experience_score: Math.min(100, Math.max(0, Math.round(parsed.experience_score || 65))),
        budget_fit_score: Math.min(100, Math.max(0, Math.round(parsed.budget_fit_score || 75))),
        location_fit_score: Math.min(100, Math.max(0, Math.round(parsed.location_fit_score || 70))),
        impact_potential_score: Math.min(100, Math.max(0, Math.round(parsed.impact_potential_score || 75))),
        match_explanation: parsed.match_explanation || 'AI analysis completed.',
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ['Technical stack alignment', 'Field implementation readiness'],
        potential_risks: Array.isArray(parsed.potential_risks) ? parsed.potential_risks : ['Requires pilot verification in target environment'],
        recommended_next_step: parsed.recommended_next_step || 'Proceed to technical screening.',
        is_fallback: false,
      };
    } catch (error) {
      console.warn('Gemini API call failed or timed out. Falling back to deterministic matching algorithm:', (error as Error).message);
    }
  }

  // Deterministic Fallback Matching Algorithm
  return calculateDeterministicMatch(problem, startup);
}

export function calculateDeterministicMatch(
  problem: ProblemInput,
  startup: StartupInput
): MatchResult {
  // 1. Technology overlap
  const pTechs = problem.technologies.map(t => t.toLowerCase());
  const sTechs = startup.technologies.map(t => t.toLowerCase());
  let techMatches = 0;
  for (const pt of pTechs) {
    if (sTechs.some(st => st.includes(pt) || pt.includes(st))) {
      techMatches++;
    }
  }
  const techRatio = pTechs.length > 0 ? techMatches / pTechs.length : 0.6;
  const technology_score = Math.round(Math.min(98, Math.max(45, 50 + techRatio * 45)));

  // 2. Sector overlap
  const pSector = problem.sector.toLowerCase();
  const sSectors = startup.sectors.map(s => s.toLowerCase());
  const sectorDirect = sSectors.some(s => s.includes(pSector) || pSector.includes(s));
  const sector_score = sectorDirect ? 95 : 65;

  // 3. Requirement overlap (keywords matching description & pitch)
  const corpus = (startup.description + ' ' + startup.pitch_summary + ' ' + startup.technologies.join(' ')).toLowerCase();
  let reqHits = 0;
  for (const req of problem.requirements) {
    const words = req.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    if (words.some(w => corpus.includes(w))) {
      reqHits++;
    }
  }
  const reqRatio = problem.requirements.length > 0 ? reqHits / problem.requirements.length : 0.7;
  const requirement_score = Math.round(Math.min(96, Math.max(50, 55 + reqRatio * 40)));

  // 4. Experience & Certifications
  let expScore = startup.previous_gov_experience ? 85 : 60;
  expScore += Math.min(10, startup.projects.length * 3);
  expScore += Math.min(5, startup.certifications.length * 2.5);
  const experience_score = Math.round(Math.min(98, expScore));

  // 5. Budget Fit
  // Healthy ratio: startup funding vs budget
  const budgetRatio = problem.budget > 0 ? startup.funding_total / problem.budget : 1;
  let budget_fit_score = 80;
  if (budgetRatio >= 0.5 && budgetRatio <= 3.0) budget_fit_score = 92;
  else if (budgetRatio > 3.0) budget_fit_score = 88;
  else budget_fit_score = 72;

  // 6. Location Fit
  const pLocState = problem.location.toLowerCase();
  const sLocState = startup.location.toLowerCase();
  const sameLocation = pLocState.split(',').some(p => sLocState.includes(p.trim())) ||
                       sLocState.split(',').some(s => pLocState.includes(s.trim()));
  const location_fit_score = sameLocation ? 94 : 78;

  // 7. Impact Potential
  const impact_potential_score = Math.round((technology_score * 0.4 + requirement_score * 0.4 + experience_score * 0.2));

  // Overall Weighted Score
  const overall_score = Math.round(
    technology_score * 0.25 +
    sector_score * 0.15 +
    requirement_score * 0.25 +
    experience_score * 0.15 +
    budget_fit_score * 0.10 +
    impact_potential_score * 0.10
  );

  // Synthesize Explanation
  let explanation = '';
  if (overall_score >= 90) {
    explanation = `${startup.company_name} shows high technical and domain compatibility with the ${problem.sector} mandate. Their stack directly aligns with ${problem.technologies.slice(0, 2).join(', ')} requirements.`;
  } else if (overall_score >= 80) {
    explanation = `${startup.company_name} demonstrates strong relevant capabilities for this problem statement, backed by relevant technical capabilities and operational readiness.`;
  } else {
    explanation = `${startup.company_name} has baseline domain relevance, though specific field customization and technical validation will be required for full deployment.`;
  }

  const strengths: string[] = [];
  if (techRatio >= 0.5) strengths.push(`Strong overlap with core required technologies (${startup.technologies.slice(0, 3).join(', ')})`);
  if (sectorDirect) strengths.push(`Direct enterprise experience in the ${problem.sector} public domain`);
  if (startup.previous_gov_experience) strengths.push(`Verified track record with prior government projects`);
  if (startup.certifications.length > 0) strengths.push(`Certified compliance: ${startup.certifications[0].name}`);
  if (strengths.length < 2) strengths.push('Capable multidisciplinary engineering team');

  const potential_risks: string[] = [];
  if (!sameLocation) potential_risks.push(`Startup is headquartered in ${startup.location}; may require local field operations support in ${problem.location}`);
  if (budgetRatio < 0.5) potential_risks.push('Project budget represents a significant expansion relative to current startup capitalization');
  if (potential_risks.length === 0) potential_risks.push('Field durability and edge uptime must be verified under extreme weather conditions');

  const recommended_next_step = overall_score >= 88
    ? 'Recommend immediate shortlisting and technical pilot scoping.'
    : overall_score >= 75
    ? 'Invite for formal technical screening and feasibility interview.'
    : 'Retain in candidate pool for secondary technical review.';

  return {
    overall_score,
    technology_score,
    sector_score,
    requirement_score,
    experience_score,
    budget_fit_score,
    location_fit_score,
    impact_potential_score,
    match_explanation: explanation,
    strengths,
    potential_risks,
    recommended_next_step,
    is_fallback: true,
  };
}
