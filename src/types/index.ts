export type ProfileRole = "candidate" | "admin" | "consultant";

export interface Profile {
    id: string;
    email: string | null;
    first_name?: string | null;
    last_name?: string | null;
    role: ProfileRole;
    created_at: string;
}

export interface Candidate {
    id: string;
    first_name: string | null;
    last_name: string | null;
    identity_number: string | null;
    phone: string | null;
    phone_secondary: string | null;
    birth_date: string | null;
    gender: string | null;
    marital_status: string | null;
    nationality: string | null;
    country: string | null;
    city: string | null;
    district: string | null;
    address_detail: string | null;
    summary: string | null;
    avatar_url: string | null;
    updated_at: string | null;
    // New fields for extended profile
    military_status?: string | null;
    driving_license?: string[] | null; // e.g., ["B", "A2"]
    // Merged fields
    email?: string | null;
    is_disabled?: boolean | null;
    disability_category?: string | null;
    disability_rate?: string | null;
    disability_report_duration?: string | null;
}

export interface ResumeEducation {
    id?: number; // assuming serial
    candidate_id: string;
    school_name: string;
    department: string;
    education_level: string;
    start_date: string | null;
    end_date: string | null;
    is_continued: boolean;
}

export interface ResumeExperience {
    id?: number;
    candidate_id: string;
    company_name: string;
    position: string;
    start_date: string | null;
    end_date: string | null;
    is_continued: boolean;
    description: string | null;
}

export interface ResumeLanguage {
    id?: number;
    candidate_id: string;
    language_name: string;
    level: string;
}

export interface ResumeSkill {
    id?: number;
    candidate_id: string;
    skill_name: string;
    category: string | null;
}

export interface ResumeCertification {
    id?: number;
    candidate_id: string;
    name: string;
    institution: string;
    date: string | null;
}

export interface ResumeReference {
    id?: number;
    candidate_id: string;
    full_name: string;
    company: string;
    position: string;
    phone: string;
    email: string;
}

export interface ResumeDocument {
    id?: number;
    candidate_id: string;
    file_url: string;
    file_name: string;
}

export interface Job {
    id: number;
    title: string;
    description: string;
    company_name: string;
    location: string;
    work_type: string;
    is_active: boolean;
    is_handicapped?: boolean; // New field for Disabled Friendly jobs
    created_by: string;
    created_at: string;
}

export interface Application {
    id: number;
    job_id: number;
    candidate_id: string;
    status: "pending" | "reviewed" | "consultant_interview" | "company_interview" | "offered" | "accepted" | "started" | "rejected";
    created_at: string;
    // Joins
    jobs?: Job;
    candidates?: Candidate;
}

// CRM Interfaces
export interface Company {
    id: string;
    name: string;
    commercial_title: string | null;
    registration_number: string | null;
    address: string | null;
    website: string | null;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CompanyContact {
    id: string;
    company_id: string;
    full_name: string;
    title: string | null;
    email: string | null;
    phone: string | null;
    created_at: string;
}

export interface JobPosition {
    id: string;
    company_id: string;
    title: string;
    requirements: string | null;
    benefits: string | null;
    assigned_consultant_id: string | null;
    status: string; // 'open' | 'closed'
    created_by: string | null;
    created_at: string;
    updated_at: string;
    // Joins
    companies?: Company;
    profiles?: Profile; // Assigned consultant
}

export interface PositionCandidate {
    id: string;
    position_id: string;
    candidate_id: string | null;
    source_type: 'existing_candidate' | 'new_candidate';
    cv_file_url: string | null;
    candidate_name: string;
    position_title_snapshot: string | null;
    phone: string | null;
    email: string | null;
    interview_datetime: string | null;
    consultant_evaluation: string | null;
    disability_status: string | null;
    share_date_with_client: string | null;
    salary_expectation: string | null;
    city: string | null;
    district: string | null;
    company_interview_date: string | null;
    company_feedback: string | null;
    result_status: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    // Joins
    job_positions?: JobPosition;
}
