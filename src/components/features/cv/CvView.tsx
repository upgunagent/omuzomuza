import { Candidate, ResumeEducation, ResumeExperience, ResumeLanguage, ResumeSkill, ResumeCertification, ResumeReference } from "@/types";
import { Mail, Phone, MapPin, Calendar, Globe, Award, Users } from "lucide-react";

interface CvProps {
    candidate: Candidate;
    educations: ResumeEducation[];
    experiences: ResumeExperience[];
    languages: ResumeLanguage[];
    skills: ResumeSkill[];
    certifications: ResumeCertification[];
    references: ResumeReference[];
}

export function CvView({ candidate, educations, experiences, languages, skills, certifications, references }: CvProps) {
    return (
        <div className="bg-white p-8 max-w-[210mm] mx-auto shadow-sm border text-sm leading-relaxed text-slate-800">
            {/* Header */}
            <div className="flex gap-6 items-start border-b pb-6 mb-6">
                <div className="h-24 w-24 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                    {candidate.avatar_url && <img src={candidate.avatar_url} className="h-full w-full object-cover" />}
                </div>
                <div className="flex-1">
                    <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-900">{candidate.first_name} {candidate.last_name}</h1>
                    <div className="flex flex-wrap gap-4 mt-3 text-slate-600">
                        {candidate.country && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {candidate.city}, {candidate.country}</span>}
                        {candidate.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {candidate.phone}</span>}
                        {/* {candidate.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {candidate.email}</span>} // Email often in profile not candidate table but logical to have */}
                    </div>
                    {candidate.summary && <p className="mt-4 text-slate-600 italic">{candidate.summary}</p>}
                </div>
            </div>

            <div className="grid grid-cols-12 gap-8">
                {/* Left Column (Main) */}
                <div className="col-span-8 flex flex-col gap-6">
                    {experiences.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 mb-4 pb-1">Experience</h2>
                            <div className="space-y-4">
                                {experiences.map(exp => (
                                    <div key={exp.id}>
                                        <h3 className="font-bold text-base">{exp.position}</h3>
                                        <div className="flex justify-between text-slate-500 mb-1">
                                            <span className="font-semibold text-slate-700">{exp.company_name}</span>
                                            <span className="text-xs">{exp.start_date} - {exp.is_continued ? 'Present' : exp.end_date}</span>
                                        </div>
                                        {exp.description && <p className="whitespace-pre-wrap text-slate-600 text-xs">{exp.description}</p>}
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {educations.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 mb-4 pb-1">Education</h2>
                            <div className="space-y-3">
                                {educations.map(edu => (
                                    <div key={edu.id}>
                                        <h3 className="font-bold text-base">{edu.school_name}</h3>
                                        <p className="text-slate-700">{edu.department} - {edu.education_level}</p>
                                        <span className="text-slate-500 text-xs">{edu.start_date} - {edu.is_continued ? 'Present' : edu.end_date}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                    {references.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 mb-4 pb-1">References</h2>
                            <div className="grid grid-cols-1 gap-2">
                                {references.map(ref => (
                                    <div key={ref.id} className="text-xs">
                                        <p className="font-bold">{ref.full_name}</p>
                                        <p>{ref.position}, {ref.company}</p>
                                        <p className="text-slate-500">{ref.email} | {ref.phone}</p>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                {/* Right Column (Sidebar like) */}
                <div className="col-span-4 flex flex-col gap-6">
                    {skills.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 mb-4 pb-1">Skills</h2>
                            <div className="flex flex-wrap gap-2">
                                {skills.map(skill => (
                                    <span key={skill.id} className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-700">{skill.skill_name}</span>
                                ))}
                            </div>
                        </section>
                    )}

                    {languages.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 mb-4 pb-1">Languages</h2>
                            <ul className="space-y-1">
                                {languages.map(lang => (
                                    <li key={lang.id} className="flex justify-between items-center text-xs">
                                        <span className="font-semibold">{lang.language_name}</span>
                                        <span className="text-slate-500">{lang.level}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {certifications.length > 0 && (
                        <section>
                            <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 mb-4 pb-1">Certifications</h2>
                            <ul className="space-y-2">
                                {certifications.map(cert => (
                                    <li key={cert.id} className="text-xs">
                                        <p className="font-semibold">{cert.name}</p>
                                        <p className="text-slate-500">{cert.institution}</p>
                                        <p className="text-slate-400">{cert.date}</p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}
                    <section>
                        <h2 className="text-lg font-bold uppercase border-b-2 border-slate-900 mb-4 pb-1">Personal Details</h2>
                        <div className="space-y-1 text-xs text-slate-600">
                            {candidate.birth_date && <p><span className="font-semibold">Born:</span> {candidate.birth_date}</p>}
                            {candidate.nationality && <p><span className="font-semibold">Nationality:</span> {candidate.nationality}</p>}
                            {candidate.marital_status && <p><span className="font-semibold">Marital Status:</span> {candidate.marital_status}</p>}
                            {candidate.gender && <p><span className="font-semibold">Gender:</span> {candidate.gender}</p>}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}
