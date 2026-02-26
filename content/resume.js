/**
 * Resume / profile data.
 * Pure data extracted from resume — separated from route and view logic.
 */

module.exports = {
    name: 'U R Ayyappan Pillai',
    title: 'Full-Stack Developer',
    tagline: 'MERN Stack · Cloud Infrastructure',
    location: 'Kerala',
    email: 'ayyappanpillai689@gmail.com',
    phone: '+91 7306459221',
    website: 'aypn.me',
    github: 'https://github.com/aypn',
    linkedin: 'https://linkedin.com/in/aypnpillai',

    summary: 'Results-driven Full-Stack Developer with hands-on experience building scalable web applications using the MERN stack. Deployed production-ready projects on AWS and GCP using Docker, Kubernetes, and CI/CD pipelines. Passionate about creating efficient, user-centric solutions with optimized performance and clean code architecture.',

    skills: {
        'Languages': ['JavaScript', 'TypeScript', 'Python', 'C', 'HTML5', 'CSS3'],
        'Frontend': ['React.js', 'Redux Toolkit', 'Tailwind CSS', 'Material UI', 'EJS'],
        'Backend': ['Node.js', 'Express.js', 'Fastify', 'REST APIs', 'grammY'],
        'Databases': ['MongoDB', 'Mongoose', 'MySQL', 'Firebase Firestore', 'Redis'],
        'DevOps & Cloud': ['AWS (EC2, S3)', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Nginx', 'PM2'],
        'Tools & Methods': ['Git', 'GitHub', 'Postman', 'Figma', 'Agile/Scrum'],
    },

    experience: [
        {
            role: 'Full-Stack Developer Intern',
            company: 'Brototype (Packapeer Academy)',
            location: 'Trivandrum',
            period: '2024 – 2025',
            highlights: [
                'Completed intensive 1-year industry bootcamp focused on MERN stack, building 3 production-ready full-stack applications under industry expert mentorship.',
                'Engineered a complete e-commerce platform with user/admin authentication (OTP, JWT), integrated PayPal payments, and RESTful API architecture using Node.js, Express, and MongoDB.',
                'Implemented industry-standard security practices including JWT token management, input sanitization, rate limiting, and secure session handling.',
                'Collaborated in Agile environment with daily standups, code reviews, and sprint planning to deliver projects on schedule.',
            ],
        },
    ],

    education: [
        {
            degree: 'B.Tech in Computer Science',
            institution: 'Pathanapuram College of Engineering, Kerala',
            period: 'June 2018 – May 2022',
            highlights: [
                'Core coursework: Data Structures, Algorithms, Database Management, Operating Systems, Computer Networks',
                'Developed multiple academic projects applying theoretical concepts to real-world software solutions',
            ],
        },
    ],

    certifications: [
        {
            name: 'Architecting with Google Compute Engine',
            issuer: 'Google Cloud | Coursera',
            year: '2021',
            description: 'Specialization in GCP infrastructure: Compute Engine, VPC networking, load balancing, and auto-scaling.',
        },
        {
            name: 'AWS Academy Graduate - Cloud Foundations',
            issuer: 'Amazon Web Services',
            year: '2021',
            description: 'Comprehensive training in AWS core services, cloud architecture, security, and cost optimization.',
        },
    ],
};
