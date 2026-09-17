export type UserRole =
  | 'SUPER_ADMIN'
  | 'GOVERNMENT_OFFICER'
  | 'EVALUATOR'
  | 'STARTUP'
  | 'PROCUREMENT_OFFICER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string | null;
  startupId?: string | null;
  designation?: string;
  phone?: string;
  avatarUrl?: string | null;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  ministry: string;
  description: string;
  location: string;
  contact_email: string;
  contact_phone: string;
  active_problems_count: number;
  pilots_count: number;
  total_procurement_value: number;
}

export interface ProblemRequirement {
  id: string;
  problem_id: string;
  title: string;
  description: string;
  is_mandatory: boolean;
}

export interface EvaluationWeights {
  id: string;
  problem_id: string;
  technical: number;
  innovation: number;
  feasibility: number;
  financial: number;
  scalability: number;
  impact: number;
  security: number;
  compliance: number;
}

export type ProblemStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'UNDER_REVIEW'
  | 'SHORTLISTED'
  | 'PILOT'
  | 'PROCUREMENT'
  | 'COMPLETED'
  | 'CLOSED';

export interface ProblemStatement {
  id: string;
  problem_code: string;
  title: string;
  description: string;
  department_id: string;
  department_name?: string;
  department_code?: string;
  department_ministry?: string;
  department_location?: string;
  sector: string;
  location: string;
  budget: number;
  timeline_months: number;
  expected_impact: string;
  target_beneficiaries: string;
  status: ProblemStatus;
  published_at?: string | null;
  created_at: string;
  technologies?: string[];
  requirements?: ProblemRequirement[];
  weights?: EvaluationWeights;
  applications_count?: number;
  matches_count?: number;
}

export interface StartupProject {
  id: string;
  title: string;
  client: string;
  description: string;
  year: number;
  outcome_url?: string;
}

export interface StartupCertification {
  id: string;
  name: string;
  issuing_body: string;
  year: number;
  valid_until?: string;
}

export interface StartupDocument {
  id: string;
  startup_id: string;
  title: string;
  file_type: string;
  file_url: string;
  file_size: number;
  created_at?: string;
}

export interface Startup {
  id: string;
  company_name: string;
  registration_number: string;
  founded_year: number;
  stage: string;
  team_size: number;
  funding_total: number;
  location: string;
  website: string;
  contact_email: string;
  contact_phone: string;
  description: string;
  pitch_summary: string;
  previous_gov_experience: boolean;
  technologies?: string[];
  sectors?: string[];
  projects?: StartupProject[];
  certifications?: StartupCertification[];
  documents?: StartupDocument[];
  applications_count?: number;
  pilots_count?: number;
}

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'SCREENING'
  | 'EVALUATION'
  | 'SHORTLISTED'
  | 'PILOT'
  | 'PROCUREMENT'
  | 'REJECTED'
  | 'WITHDRAWN';

export interface ApplicationDocument {
  id: string;
  title: string;
  file_type: string;
  file_url: string;
  file_size: number;
}

export interface Application {
  id: string;
  problem_id: string;
  startup_id: string;
  proposal_title: string;
  technical_approach: string;
  implementation_plan: string;
  timeline_months: number;
  proposed_budget: number;
  expected_impact: string;
  team_details: string;
  status: ApplicationStatus;
  submitted_at: string;
  shortlisted_at?: string | null;
  created_at: string;
  problem_title?: string;
  problem_code?: string;
  sector?: string;
  problem_budget?: number;
  department_name?: string;
  company_name?: string;
  startup_stage?: string;
  startup_location?: string;
  funding_total?: number;
  evaluation_score?: number;
  documents?: ApplicationDocument[];
  evaluations?: Evaluation[];
  aiMatch?: AIMatch | null;
}

export interface AIMatch {
  id: string;
  problem_id: string;
  startup_id: string;
  overall_score: number;
  technology_score: number;
  sector_score: number;
  requirement_score: number;
  experience_score: number;
  budget_fit_score: number;
  location_fit_score: number;
  impact_potential_score: number;
  match_explanation: string;
  strengths: string[] | string;
  potential_risks: string[] | string;
  recommended_next_step: string;
  is_fallback: boolean;
  company_name?: string;
  stage?: string;
  location?: string;
  funding_total?: number;
  team_size?: number;
  technologies?: string[];
  sectors?: string[];
  application_id?: string;
  application_status?: string;
}

export interface Evaluation {
  id: string;
  application_id: string;
  evaluator_id: string;
  evaluator_name?: string;
  evaluator_designation?: string;
  technical_score: number;
  innovation_score: number;
  feasibility_score: number;
  financial_score: number;
  scalability_score: number;
  impact_score: number;
  security_score: number;
  compliance_score: number;
  total_weighted_score: number;
  comments: string;
  status: string;
  submitted_at: string;
}

export type PilotStatus =
  | 'PLANNED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'TERMINATED'
  | 'APPROVED_FOR_SCALE';

export interface PilotMilestone {
  id: string;
  pilot_id: string;
  title: string;
  description: string;
  due_date: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED';
  completion_percentage: number;
  owner: string;
}

export interface PilotKPI {
  id: string;
  pilot_id: string;
  name: string;
  metric_unit: string;
  baseline_value: number;
  target_value: number;
  current_value: number;
  status: 'ON_TRACK' | 'AT_RISK' | 'EXCEEDED';
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface PilotRisk {
  id: string;
  pilot_id: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigation: string;
  owner: string;
  status: string;
}

export interface ScaleAssessment {
  id: string;
  pilot_id: string;
  impact_score: number;
  technical_readiness_score: number;
  operational_readiness_score: number;
  financial_sustainability_score: number;
  user_adoption_score: number;
  security_score: number;
  compliance_score: number;
  scalability_score: number;
  overall_score: number;
  readiness_level: 'HIGHLY_READY' | 'READY' | 'CONDITIONALLY_READY' | 'NOT_READY';
  summary: string;
  recommendations: string[] | string;
}

export interface Pilot {
  id: string;
  application_id: string;
  problem_id: string;
  startup_id: string;
  department_id: string;
  title: string;
  objectives: string;
  expected_outcomes: string;
  budget: number;
  start_date: string;
  end_date: string;
  status: PilotStatus;
  completion_percentage: number;
  scale_readiness_score?: number | null;
  problem_title?: string;
  problem_code?: string;
  sector?: string;
  department_name?: string;
  department_code?: string;
  company_name?: string;
  startup_location?: string;
  milestones?: PilotMilestone[];
  kpis?: PilotKPI[];
  risks?: PilotRisk[];
  scaleAssessment?: ScaleAssessment | null;
  milestones_count?: number;
  kpis_count?: number;
}

export type ProcurementStage =
  | 'RECOMMENDATION'
  | 'BUDGET_APPROVAL'
  | 'TENDER_EXEMPTION'
  | 'VENDOR_NEGOTIATION'
  | 'CONTRACT'
  | 'PURCHASE_ORDER'
  | 'IMPLEMENTATION'
  | 'COMPLETED';

export interface ProcurementEvent {
  id: string;
  procurement_id: string;
  from_stage: string;
  to_stage: string;
  notes: string;
  actor_id: string;
  actor_name?: string;
  created_at: string;
}

export interface Contract {
  id: string;
  procurement_id: string;
  contract_number: string;
  startup_id: string;
  department_id: string;
  start_date: string;
  end_date: string;
  contract_value: number;
  terms: string;
  status: string;
  document_url?: string;
  signed_at?: string;
  procurement_title?: string;
  company_name?: string;
  department_name?: string;
}

export interface Procurement {
  id: string;
  pilot_id?: string | null;
  problem_id: string;
  startup_id: string;
  department_id: string;
  title: string;
  estimated_value: number;
  approved_budget: number;
  current_stage: ProcurementStage;
  procurement_officer_id?: string;
  target_completion_date: string;
  status: string;
  problem_title?: string;
  problem_code?: string;
  sector?: string;
  department_name?: string;
  department_code?: string;
  company_name?: string;
  startup_location?: string;
  procurement_officer_name?: string;
  contract_number?: string;
  contract_status?: string;
  contract_value?: number;
  events?: ProcurementEvent[];
  contract?: Contract | null;
}

export interface Notification {
  id: string;
  user_id?: string | null;
  role?: string | null;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string | null;
  user_email?: string | null;
  action: string;
  entity: string;
  entity_id: string;
  metadata?: any;
  ip_address?: string;
  created_at: string;
}

export interface DashboardAnalytics {
  kpis: {
    totalProblems: number;
    activeProblems: number;
    registeredStartups: number;
    aiMatches: number;
    shortlistedStartups: number;
    activePilots: number;
    procurementValue: number;
    successfulInnovations: number;
  };
  charts: {
    problemsBySector: { sector: string; count: number }[];
    pipelineFunnel: {
      problems: number;
      applications: number;
      ai_matches: number;
      shortlisted: number;
      pilots: number;
      scale_ready: number;
      procurement: number;
      contracts: number;
    };
    pilotStatus: { status: string; count: number }[];
    procurementByDepartment: {
      department_name: string;
      department_code: string;
      total_value: number;
    }[];
    applicationsByStatus: { status: string; count: number }[];
    problemsByStatus: { status: string; count: number }[];
  };
}
