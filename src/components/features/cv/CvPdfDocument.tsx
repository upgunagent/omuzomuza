import { Page, Text, View, Document, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { Candidate, ResumeEducation, ResumeExperience, ResumeLanguage, ResumeSkill, ResumeCertification, ResumeReference } from "@/types";

// Register fonts
Font.register({
    family: 'Roboto',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
    fontWeight: 'normal'
});
Font.register({
    family: 'Roboto-Bold',
    src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
    fontWeight: 'bold'
});

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: 'Roboto',
        fontSize: 10,
        color: '#000'
    },

    // Header Section
    headerContainer: {
        flexDirection: 'row',
        marginBottom: 20
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 15
    },
    headerInfo: {
        flex: 1,
        justifyContent: 'center'
    },
    nameTitle: {
        fontSize: 16,
        fontFamily: 'Roboto-Bold',
        marginBottom: 4,
        flexDirection: 'row',
        alignItems: 'center'
    },
    jobTitle: {
        fontSize: 11,
        fontFamily: 'Roboto-Bold',
        marginBottom: 2
    },
    location: {
        fontSize: 10,
        color: '#000'
    },
    logoContainer: {
        alignItems: 'flex-end',
        justifyContent: 'flex-start'
    },
    logoText: {
        color: '#6A1B9A', // Brand purple
        fontSize: 16,
        fontFamily: 'Roboto-Bold'
    },

    // Global
    updateDate: {
        fontSize: 9,
        marginBottom: 10
    },

    // Main Section Headings
    sectionHeader: {
        fontSize: 12,
        fontFamily: 'Roboto-Bold',
        marginBottom: 8,
        marginTop: 15,
        textTransform: 'uppercase'
    },

    // Boxed Section (Summary)
    summaryBox: {
        borderWidth: 1,
        borderColor: '#eee',
        padding: 10,
        backgroundColor: '#fcfcfc',
        marginBottom: 15
    },
    summaryText: {
        fontSize: 9,
        lineHeight: 1.4,
        fontStyle: 'italic'
    },

    // Boxed Section (General)
    boxContainer: {
        borderWidth: 1,
        borderColor: '#eee',
        padding: 15,
        marginBottom: 15
    },

    // Two Column Grid
    twoColGrid: {
        flexDirection: 'row'
    },
    colHalf: {
        width: '50%'
    },

    // Field Row
    fieldRow: {
        marginBottom: 4,
        fontSize: 9
    },
    label: {
        fontFamily: 'Roboto-Bold',
        width: 100
    },

    // Experiences
    experienceItem: {
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 8
    },
    expHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 2
    },
    expTitle: {
        fontFamily: 'Roboto-Bold',
        fontSize: 10
    },
    expDate: {
        fontSize: 9,
        color: '#000'
    },
    expCompany: {
        fontSize: 10,
        marginBottom: 4
    },
    expMeta: {
        flexDirection: 'row',
        backgroundColor: '#f9f9f9',
        padding: 4,
        marginBottom: 4,
        gap: 10
    },
    metaText: {
        fontSize: 8,
        color: '#666'
    },
    expDesc: {
        fontSize: 9,
        lineHeight: 1.3,
        color: '#444'
    },

    // Education
    eduItem: {
        flexDirection: 'row',
        marginBottom: 10,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0'
    },
    eduIcon: {
        width: 30,
        height: 30,
        backgroundColor: '#e0e0e0', // Placeholder for university logo
        marginRight: 10,
        borderRadius: 4
    },
    eduContent: {
        flex: 1
    },
    eduSchool: {
        fontFamily: 'Roboto-Bold',
        fontSize: 10
    },
    eduDept: {
        fontSize: 9,
        color: '#444'
    },
    eduDate: {
        fontSize: 9,
        color: '#666',
        textAlign: 'right'
    },

    // Skills
    skillContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6
    },
    skillBadge: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 3,
        fontSize: 8,
        backgroundColor: '#fafafa'
    }
});

interface CvProps {
    candidate: Candidate;
    educations: ResumeEducation[];
    experiences: ResumeExperience[];
    languages: ResumeLanguage[];
    skills: ResumeSkill[];
    certifications: ResumeCertification[];
    references: ResumeReference[];
}

export function CvPdfDocument({ candidate, educations, experiences, languages, skills, certifications, references }: CvProps) {

    // Calculate Age
    const getAge = (birthDate: string | null) => {
        if (!birthDate) return '';
        const today = new Date();
        const birthDateObj = new Date(birthDate);
        let age = today.getFullYear() - birthDateObj.getFullYear();
        const m = today.getMonth() - birthDateObj.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
            age--;
        }
        return age;
    };

    const currentJob = experiences.find(e => e.is_continued);
    const age = getAge(candidate.birth_date);
    const updatedDate = candidate.updated_at ? new Date(candidate.updated_at).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR');

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* HEADER */}
                <View style={styles.headerContainer}>
                    {candidate.avatar_url && <Image src={candidate.avatar_url} style={styles.avatar} />}
                    <View style={styles.headerInfo}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.nameTitle}>
                                {candidate.first_name} {candidate.last_name}
                                {age && `, ${age}`}
                            </Text>
                            {/* Disability indicator badge */}
                            {candidate.is_disabled && (
                                <View style={{
                                    backgroundColor: '#6A1B9A',
                                    borderRadius: 10,
                                    paddingHorizontal: 6,
                                    paddingVertical: 2,
                                    marginLeft: 5
                                }}>
                                    <Text style={{
                                        fontSize: 8,
                                        color: '#fff',
                                        fontFamily: 'Roboto-Bold'
                                    }}>ENGELLI</Text>
                                </View>
                            )}
                        </View>

                        {currentJob ? (
                            <Text style={styles.jobTitle}>{currentJob.position}, {currentJob.company_name}</Text>
                        ) : (
                            <Text style={styles.jobTitle}>Aday</Text>
                        )}

                        <Text style={styles.location}>
                            {(candidate.district ? candidate.district + ', ' : '') + (candidate.city || '')}
                        </Text>
                    </View>
                    <View style={styles.logoContainer}>
                        <Image
                            src={candidate.is_disabled
                                ? '/omuzomuza_logo.png'
                                : '/happy_logo.png'
                            }
                            style={{ width: 80, height: 'auto' }}
                        />
                    </View>
                </View>

                <Text style={styles.updateDate}>Özgeçmiş Güncelleme : {updatedDate}</Text>

                {/* SUMMARY */}
                {candidate.summary && (
                    <View>
                        <Text style={styles.sectionHeader}>ÖZET BİLGİ</Text>
                        <View style={styles.summaryBox}>
                            <Text style={styles.summaryText}>{candidate.summary}</Text>
                        </View>
                    </View>
                )}

                {/* PERSONAL INFO */}
                <View>
                    <Text style={styles.sectionHeader}>KİŞİSEL BİLGİLER</Text>
                    <View style={styles.boxContainer}>
                        <View style={styles.twoColGrid}>
                            <View style={styles.colHalf}>
                                {/* Left Col */}
                                <View style={styles.fieldRow}>
                                    <Text style={{ fontFamily: 'Roboto-Bold' }}>Uyruk</Text>
                                    <Text>{candidate.country || 'T.C.'}</Text>
                                </View>
                                {candidate.is_disabled && (
                                    <View style={[styles.fieldRow, { marginTop: 5 }]}>
                                        <Text style={{ fontFamily: 'Roboto-Bold' }}>Engel Durumu</Text>
                                        <Text>Var / {candidate.disability_rate || '-'}</Text>
                                        <Text style={{ fontSize: 8, color: '#666' }}>{candidate.disability_category}</Text>
                                    </View>
                                )}
                            </View>
                            <View style={styles.colHalf}>
                                {/* Right Col */}
                                <View style={styles.fieldRow}>
                                    <Text style={{ fontFamily: 'Roboto-Bold' }}>Doğum Tarihi</Text>
                                    <Text>{candidate.birth_date ? new Date(candidate.birth_date).toLocaleDateString('tr-TR') : '-'}</Text>
                                </View>
                                <View style={styles.fieldRow}>
                                    <Text style={{ fontFamily: 'Roboto-Bold' }}>Cinsiyet</Text>
                                    <Text>{candidate.gender === 'Male' ? 'Erkek' : candidate.gender === 'Female' ? 'Kadın' : '-'}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* CONTACT INFO */}
                <View>
                    <Text style={styles.sectionHeader}>İLETİŞİM BİLGİLERİ</Text>
                    <View style={styles.boxContainer}>
                        <View style={styles.twoColGrid}>
                            <View style={styles.colHalf}>
                                <View style={styles.fieldRow}>
                                    <Text style={{ fontFamily: 'Roboto-Bold' }}>E-posta</Text>
                                    <Text>{candidate.email}</Text>
                                </View>
                            </View>
                            <View style={styles.colHalf}>
                                <View style={styles.fieldRow}>
                                    <Text style={{ fontFamily: 'Roboto-Bold' }}>Cep Telefonu</Text>
                                    <Text>{candidate.phone}</Text>
                                </View>
                            </View>
                        </View>
                        {candidate.address_detail && (
                            <View style={{ marginTop: 5 }}>
                                <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 9 }}>Adres</Text>
                                <Text style={{ fontSize: 9 }}>{candidate.address_detail}</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* EXPERIENCE */}
                {experiences.length > 0 && (
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.sectionHeader}>İŞ DENEYİMLERİ</Text>
                            <Text style={{ fontSize: 9, fontFamily: 'Roboto-Bold' }}>TOPLAM TECRÜBE : {experiences.length} İşyeri</Text>
                        </View>

                        <View style={styles.boxContainer}>
                            {experiences.map((exp, index) => (
                                <View key={exp.id} style={index === experiences.length - 1 ? styles.experienceItem : [styles.experienceItem, { borderBottomWidth: 0 }]}>
                                    <View style={styles.expHeader}>
                                        <Text style={styles.expTitle}>{exp.position}</Text>
                                        <Text style={styles.expDate}>
                                            {exp.start_date ? new Date(exp.start_date).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : ''} -
                                            {exp.is_continued ? ' Devam Ediyor' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }) : '')}
                                        </Text>
                                    </View>
                                    <Text style={styles.expCompany}>{exp.company_name}</Text>

                                    <View style={styles.expMeta}>
                                        <Text style={styles.metaText}>Firma Sektörü: -</Text>
                                        <Text style={styles.metaText}>Çalışma Şekli: Tam Zamanlı</Text>
                                    </View>

                                    {exp.description && <Text style={styles.expDesc}>{exp.description}</Text>}
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* EDUCATION */}
                {educations.length > 0 && (
                    <View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.sectionHeader}>EĞİTİM BİLGİLERİ</Text>
                        </View>
                        <View style={styles.boxContainer}>
                            {educations.map((edu, index) => (
                                <View key={edu.id} style={index === educations.length - 1 ? [styles.eduItem, { borderBottomWidth: 0 }] : styles.eduItem}>
                                    <View style={styles.eduContent}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={styles.eduSchool}>{edu.school_name}</Text>
                                            <Text style={styles.eduDate}>
                                                {edu.start_date ? new Date(edu.start_date).getFullYear() : ''} - {edu.is_continued ? 'Devam' : (edu.end_date ? new Date(edu.end_date).getFullYear() : '')}
                                            </Text>
                                        </View>
                                        <Text style={styles.eduDept}>{edu.department}</Text>
                                        <Text style={{ fontSize: 9, color: '#666' }}>{edu.education_level}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* LANGUAGES */}
                {languages.length > 0 && (
                    <View>
                        <Text style={styles.sectionHeader}>YABANCI DİL BİLGİSİ</Text>
                        <View style={styles.boxContainer}>
                            {languages.map((lang, index) => (
                                <View key={lang.id} style={{ marginBottom: 5 }}>
                                    <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 10 }}>{lang.language_name}</Text>
                                    <Text style={{ fontSize: 9 }}>{lang.level}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* SKILLS */}
                {skills.length > 0 && (
                    <View>
                        <Text style={styles.sectionHeader}>YETENEKLER</Text>
                        <View style={[styles.boxContainer, styles.skillContainer]}>
                            {skills.map((skill) => (
                                <Text key={skill.id} style={styles.skillBadge}>{skill.skill_name}</Text>
                            ))}
                        </View>
                    </View>
                )}

                {/* CERTIFICATIONS / SEMINARS */}
                {certifications.length > 0 && (
                    <View>
                        <Text style={styles.sectionHeader}>SEMİNER VE KURSLAR</Text>
                        <View style={styles.boxContainer}>
                            {certifications.map((cert) => (
                                <View key={cert.id} style={{ marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <View>
                                        <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 10 }}>{cert.name}</Text>
                                        <Text style={{ fontSize: 9 }}>{cert.institution}</Text>
                                    </View>
                                    <Text style={{ fontSize: 9 }}>{cert.date}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* REFERENCES */}
                {references.length > 0 && (
                    <View>
                        <Text style={styles.sectionHeader}>REFERANSLAR</Text>
                        <View style={styles.boxContainer}>
                            {references.map((ref) => (
                                <View key={ref.id} style={{ marginBottom: 8 }}>
                                    <Text style={{ fontFamily: 'Roboto-Bold', fontSize: 10 }}>{ref.full_name}</Text>
                                    <Text style={{ fontSize: 9 }}>{ref.position} - {ref.company}</Text>
                                    <Text style={{ fontSize: 9, color: '#666' }}>{ref.email} | {ref.phone}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

            </Page>
        </Document>
    );
}
