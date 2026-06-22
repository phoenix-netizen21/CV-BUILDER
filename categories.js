// categories.js
// Configuration schema for all CV categories in the application.
// Defines sections and fields collected per category, facilitating easy additions of future categories.

const CV_CATEGORIES = {
  college_app: {
    id: "college_app",
    title: "College Application CV",
    subtitle: "For high school students applying to colleges and universities.",
    icon: "fa-graduation-cap",
    description: "Highlight academic scores, extracurricular activities, leadership, and competitions.",
    sections: [
      { id: "personal", title: "Contact Information", type: "form", fields: "common" },
      { id: "education", title: "Education (High School)", type: "list", fields: ["schoolName", "gradeClass", "location", "duration"] },
      { id: "achievements", title: "Academic Achievements & Competitions", type: "list", fields: ["title", "issuer", "date", "description"] },
      { id: "projects", title: "Projects", type: "list", fields: ["title", "role", "duration", "description", "link"] },
      { id: "extracurricular", title: "Extracurriculars & Clubs", type: "list", fields: ["activity", "roleName", "duration", "description"] },
      { id: "leadership", title: "Leadership Roles", type: "list", fields: ["title", "organization", "duration", "description"] },
      { id: "volunteer", title: "Volunteer & Community Service", type: "list", fields: ["organization", "roleName", "duration", "description"] },
      { id: "certifications", title: "Certifications", type: "list", fields: ["name", "issuer", "date", "link"] },
      { id: "skills", title: "Skills", type: "tags", fields: ["skillsList"] },
      { id: "languages", title: "Languages", type: "tags", fields: ["languagesList"] },
      { id: "hobbies", title: "Hobbies (Optional)", type: "tags", fields: ["hobbiesList"] }
    ]
  },
  internship: {
    id: "internship",
    title: "Internship CV",
    subtitle: "For college students looking to secure internships.",
    icon: "fa-laptop-code",
    description: "Emphasize technical skills, course projects, academic performance, and club activities.",
    sections: [
      { id: "personal", title: "Contact Information", type: "form", fields: "common" },
      { id: "education", title: "Education (College)", type: "list", fields: ["collegeName", "degree", "department", "yearOfStudy", "cgpa", "coursework"] },
      { id: "projects", title: "Academic & Personal Projects", type: "list", fields: ["title", "technologies", "duration", "description", "link"] },
      { id: "skills", title: "Technical Skills", type: "tags", fields: ["skillsList"] },
      { id: "certifications", title: "Certifications", type: "list", fields: ["name", "issuer", "date", "link"] },
      { id: "achievements", title: "Achievements", type: "list", fields: ["title", "issuer", "date", "description"] },
      { id: "clubs", title: "Clubs & Activities", type: "list", fields: ["organization", "roleName", "duration", "description"] },
      { id: "languages", title: "Languages", type: "tags", fields: ["languagesList"] }
    ]
  },
  fresher: {
    id: "fresher",
    title: "Fresher CV",
    subtitle: "For recent graduates launching their professional career.",
    icon: "fa-user-graduate",
    description: "Focus on degree details, major projects, internship experiences, and core competencies.",
    sections: [
      { id: "personal", title: "Contact Information", type: "form", fields: "common" },
      { id: "education", title: "Education", type: "list", fields: ["collegeName", "degree", "graduationYear", "cgpa"] },
      { id: "internships", title: "Internships", type: "list", fields: ["companyName", "roleName", "duration", "responsibilities", "achievements"] },
      { id: "projects", title: "Major Projects", type: "list", fields: ["title", "technologies", "duration", "description", "link"] },
      { id: "skills", title: "Core Skills", type: "tags", fields: ["skillsList"] },
      { id: "certifications", title: "Certifications", type: "list", fields: ["name", "issuer", "date", "link"] },
      { id: "achievements", title: "Achievements", type: "list", fields: ["title", "issuer", "date", "description"] },
      { id: "languages", title: "Languages", type: "tags", fields: ["languagesList"] }
    ]
  },
  job_interview: {
    id: "job_interview",
    title: "Job Interview CV",
    subtitle: "For candidates interviewing for mid-level industry positions.",
    icon: "fa-briefcase",
    description: "Detail professional work experience, key deliverables, technical stack, and soft skills.",
    sections: [
      { id: "personal", title: "Contact Information", type: "form", fields: "common" },
      { id: "experience", title: "Work Experience", type: "list", fields: ["companyName", "roleName", "duration", "responsibilities", "projectsText"] },
      { id: "skills", title: "Technical Skills", type: "tags", fields: ["skillsList"] },
      { id: "soft_skills", title: "Soft Skills", type: "tags", fields: ["softSkillsList"] },
      { id: "projects", title: "Additional Projects", type: "list", fields: ["title", "technologies", "duration", "description", "link"] },
      { id: "certifications", title: "Certifications", type: "list", fields: ["name", "issuer", "date", "link"] },
      { id: "awards", title: "Awards & Honors", type: "list", fields: ["title", "issuer", "date", "description"] },
      { id: "languages", title: "Languages", type: "tags", fields: ["languagesList"] }
    ]
  },
  experienced: {
    id: "experienced",
    title: "Experienced Professional CV",
    subtitle: "For seasoned professionals with multi-year industry experience.",
    icon: "fa-user-tie",
    description: "Emphasize career progression, key leadership achievements, scalability, and domain expertise.",
    sections: [
      { id: "personal", title: "Contact Information", type: "form", fields: "common" },
      { id: "experience", title: "Professional Experience", type: "list", fields: ["companyName", "roleName", "duration", "responsibilities", "achievements"] },
      { id: "projects", title: "Key Projects", type: "list", fields: ["title", "technologies", "duration", "description", "link"] },
      { id: "skills", title: "Skills & Expertise", type: "tags", fields: ["skillsList"] },
      { id: "certifications", title: "Certifications", type: "list", fields: ["name", "issuer", "date", "link"] },
      { id: "languages", title: "Languages", type: "tags", fields: ["languagesList"] }
    ]
  },
  academic: {
    id: "academic",
    title: "Research/Academic CV",
    subtitle: "For scholars, researchers, PhD applicants, and university professors.",
    icon: "fa-book-open",
    description: "Focus on publications, conferences, grants, academic qualifications, and teaching roles.",
    sections: [
      { id: "personal", title: "Contact Information", type: "form", fields: "common" },
      { id: "education", title: "Educational Qualifications", type: "list", fields: ["collegeName", "degree", "graduationYear", "cgpa", "thesisTitle"] },
      { id: "research", title: "Research Interests", type: "tags", fields: ["researchInterestsList"] },
      { id: "publications", title: "Publications", type: "list", fields: ["title", "authors", "journalName", "date", "link"] },
      { id: "conferences", title: "Conferences & Seminars", type: "list", fields: ["title", "roleName", "location", "date", "description"] },
      { id: "grants", title: "Grants & Fellowships", type: "list", fields: ["title", "amount", "duration", "organization", "description"] },
      { id: "projects", title: "Research Projects", type: "list", fields: ["title", "role", "duration", "description"] },
      { id: "teaching", title: "Teaching & Mentoring Experience", type: "list", fields: ["course", "roleName", "institution", "duration", "description"] },
      { id: "skills", title: "Research & Technical Skills", type: "tags", fields: ["skillsList"] },
      { id: "awards", title: "Awards & Honors", type: "list", fields: ["title", "issuer", "date", "description"] }
    ]
  },
  scholarship: {
    id: "scholarship",
    title: "Scholarship CV",
    subtitle: "For students seeking financial aid or merit-based scholarships.",
    icon: "fa-award",
    description: "Highlight academic records, community service, volunteer work, leadership, and awards.",
    sections: [
      { id: "personal", title: "Contact Information", type: "form", fields: "common" },
      { id: "education", title: "Academic Record", type: "list", fields: ["schoolName", "degree", "duration", "cgpaScore"] },
      { id: "leadership", title: "Leadership & Club Activities", type: "list", fields: ["title", "organization", "duration", "description"] },
      { id: "volunteer", title: "Volunteer & Community Service", type: "list", fields: ["organization", "roleName", "duration", "description"] },
      { id: "achievements", title: "Key Achievements & Awards", type: "list", fields: ["title", "issuer", "date", "description"] },
      { id: "projects", title: "Projects", type: "list", fields: ["title", "technologies", "duration", "description"] },
      { id: "certifications", title: "Certifications", type: "list", fields: ["name", "issuer", "date"] },
      { id: "skills", title: "Skills", type: "tags", fields: ["skillsList"] },
      { id: "languages", title: "Languages", type: "tags", fields: ["languagesList"] }
    ]
  }
};

// Global metadata schema for fields. Describes types, placeholders, tooltips, validation.
const FIELD_SCHEMAS = {
  // Common personal fields
  fullName: { label: "Full Name", type: "text", required: true, placeholder: "Jane Doe", tooltip: "Use your professional full name.", valType: "name" },
  professionalTitle: { label: "Professional Title", type: "text", required: true, placeholder: "Software Engineer / Undergraduate Scholar", tooltip: "E.g. Senior Backend Engineer, High School Student, Research Fellow.", valType: "title" },
  profilePhoto: { label: "Profile Photo (Optional Link)", type: "url", required: false, placeholder: "https://example.com/photo.jpg", tooltip: "Provide a direct image URL (must start with http/https).", valType: "url" },
  email: { label: "Email Address", type: "email", required: true, placeholder: "jane.doe@example.com", tooltip: "Use a clean, professional email.", valType: "email" },
  phone: { label: "Phone Number", type: "tel", required: true, placeholder: "+1 (555) 019-2834", tooltip: "Include country code if applicable.", valType: "phone" },
  location: { label: "Location", type: "text", required: true, placeholder: "New York, USA", tooltip: "Format: City, Country.", valType: "location" },
  linkedin: { label: "LinkedIn Profile URL", type: "url", required: false, placeholder: "https://linkedin.com/in/janedoe", tooltip: "Ensure it is a valid LinkedIn profile link.", valType: "url" },
  github: { label: "GitHub Profile URL", type: "url", required: false, placeholder: "https://github.com/janedoe", tooltip: "Optional, ideal for tech roles.", valType: "url" },
  portfolio: { label: "Portfolio URL", type: "url", required: false, placeholder: "https://janedoe.dev", tooltip: "Personal website, design portfolio, or research page.", valType: "url" },
  summary: { label: "Professional Summary / About Me", type: "textarea", required: true, placeholder: "Write a short summary of who you are...", tooltip: "Write a concise 3-4 sentence elevator pitch. Limit 400 chars.", limit: 400, valType: "summary" },

  // Education fields
  schoolName: { label: "School Name", type: "text", required: true, placeholder: "Oakridge High School" },
  collegeName: { label: "Institution / College Name", type: "text", required: true, placeholder: "Stanford University" },
  degree: { label: "Degree / Certificate", type: "text", required: true, placeholder: "B.S. in Computer Science" },
  department: { label: "Department / Major", type: "text", required: true, placeholder: "EECS Department" },
  gradeClass: { label: "Current Grade/Class", type: "text", required: true, placeholder: "Grade 12 / Senior" },
  yearOfStudy: { label: "Year of Study", type: "text", required: true, placeholder: "3rd Year" },
  graduationYear: { label: "Graduation Year", type: "text", required: true, placeholder: "2026" },
  cgpa: { label: "CGPA / GPA Score", type: "text", required: false, placeholder: "3.85 / 4.00" },
  cgpaScore: { label: "GPA / Academic Score", type: "text", required: true, placeholder: "3.9 / 4.0 or 95%" },
  coursework: { label: "Relevant Coursework", type: "text", required: false, placeholder: "Data Structures, Operating Systems, Econometrics" },
  thesisTitle: { label: "Thesis / Dissertation Title", type: "text", required: false, placeholder: "Scalable Machine Learning on Distributed Graphs" },

  // Experience / Internship fields
  companyName: { label: "Company Name", type: "text", required: true, placeholder: "Google Inc." },
  roleName: { label: "Position / Role", type: "text", required: true, placeholder: "Software Engineering Intern" },
  duration: { label: "Duration", type: "text", required: true, placeholder: "June 2024 - Present" },
  responsibilities: { label: "Key Responsibilities", type: "textarea", required: true, placeholder: "- Developed backend microservices using Node.js\n- Led a team of 3 interns...", tooltip: "Describe tasks. Use bullet points starting with dash (-).", limit: 600 },
  projectsText: { label: "Projects Managed / Developed", type: "textarea", required: false, placeholder: "- Designed a real-time chat service using WebSockets", tooltip: "Describe projects completed during this role.", limit: 500 },
  achievements: { label: "Key Achievements", type: "textarea", required: false, placeholder: "- Optimized database queries, reducing response times by 35%\n- Awarded Intern of the Month", tooltip: "List notable deliverables with numbers.", limit: 500 },

  // Projects fields
  title: { label: "Title", type: "text", required: true, placeholder: "E-Commerce Microservice Architecture" },
  technologies: { label: "Technologies Used", type: "text", required: false, placeholder: "React, Node.js, Docker, AWS" },
  role: { label: "Your Role / Contributions", type: "text", required: false, placeholder: "Lead Backend Developer" },
  description: { label: "Description / Bullet Points", type: "textarea", required: true, placeholder: "- Built secure authentication services using JWT\n- Deployed to AWS ECS using CI/CD", limit: 500 },
  link: { label: "Project Link / URL", type: "url", required: false, placeholder: "https://github.com/janedoe/shop-api", valType: "url" },

  // Extracurricular / Clubs / Volunteer fields
  activity: { label: "Activity Name", type: "text", required: true, placeholder: "Varsity Debate Team" },
  organization: { label: "Organization / Club Name", type: "text", required: true, placeholder: "Red Cross Society" },

  // Certifications / Achievements fields
  name: { label: "Certification Name", type: "text", required: true, placeholder: "AWS Certified Solutions Architect" },
  issuer: { label: "Issuing Organization", type: "text", required: true, placeholder: "Amazon Web Services" },
  date: { label: "Date / Year", type: "text", required: true, placeholder: "2025" },

  // Research / Academic fields
  authors: { label: "Authors List", type: "text", required: true, placeholder: "Jane Doe, John Smith, Alice Cooper" },
  journalName: { label: "Journal / Conference Name", type: "text", required: true, placeholder: "IEEE Transactions on Pattern Analysis" },
  researchInterests: { label: "Research Interests", type: "text", placeholder: "Deep Learning, Computational Linguistics" },
  amount: { label: "Funding / Grant Amount", type: "text", required: true, placeholder: "$50,000 USD" },
  institution: { label: "Institution / Department", type: "text", required: true, placeholder: "MIT CS Department" },
  course: { label: "Course Name / Subject", type: "text", required: true, placeholder: "Introduction to Algorithm Design" },

  // Tags inputs
  skillsList: { label: "Skills", type: "tags", required: true, placeholder: "Python, Java, Git, Photoshop (Press Enter to add)", tooltip: "List skills separated by commas or press enter." },
  softSkillsList: { label: "Soft Skills", type: "tags", required: true, placeholder: "Communication, Leadership, Problem Solving", tooltip: "Enter soft skills relevant for the job." },
  languagesList: { label: "Languages", type: "tags", required: true, placeholder: "English (Native), Spanish (Conversational)", tooltip: "Languages you can speak/write." },
  hobbiesList: { label: "Hobbies & Interests", type: "tags", required: false, placeholder: "Photography, Hiking, Chess", tooltip: "List hobbies to showcase personality." },
  researchInterestsList: { label: "Research Interests", type: "tags", required: true, placeholder: "Quantum Computing, NLP, Graph Theory" }
};

if (typeof window !== "undefined") {
  window.CV_CATEGORIES = CV_CATEGORIES;
  window.FIELD_SCHEMAS = FIELD_SCHEMAS;
}
