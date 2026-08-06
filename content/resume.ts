export type ResumeExperience = {
  employer: string
  title: string
  dates: string
  bullets: string[]
}

export type ResumeProject = {
  title: string
  description: string
  tools: string
  repository: string
}

export const RESUME_PAGE = {
  metadata: {
    title: 'Resume',
    description:
      'Resume for Dillon Shearer, a data analyst working in healthcare technology, data standards, and transformation processes.',
  },
  eyebrow: 'RESUME / DATA ANALYST',
  name: 'Dillon Shearer',
  location: 'Newnan, Georgia, United States',
  email: 'dillshearer@outlook.com',
  linkedin: 'https://www.linkedin.com/in/dillonshearer',
  github: 'https://github.com/dillon-shearer/portfolio',
  pdfHref: '/resumes/Dillon_Shearer_Resume.pdf',
  summary:
    'Data Analyst with a strong background in healthcare technology, data standards, and transformation processes. Adept at managing complex data workflows from raw data collection to standardized formats. Passionate about solving complex problems, driving business value, and improving outcomes in the healthcare space. Experienced in data modeling, clinical terminologies, and ETL processes, with a portfolio of projects demonstrating data analysis and visualization expertise.',
  skills: [
    { label: 'Programming', value: 'Python, SQL, R' },
    {
      label: 'Data Analysis & Visualization',
      value: 'Pandas, Matplotlib, Seaborn, Tableau, Power BI',
    },
    { label: 'Machine Learning', value: 'Scikit-learn, TensorFlow' },
    { label: 'Database Management', value: 'MySQL, PostgreSQL, SnowSQL' },
    { label: 'Tools', value: 'Jupyter, Git, Excel' },
    {
      label: 'Data Standards & Terminologies',
      value: 'SNOMED CT, LOINC, RxNorm',
    },
    {
      label: 'Data Modeling & Integration',
      value: 'ETL processes, relational databases, graph databases',
    },
    { label: 'Serialization Formats', value: 'XML, JSON' },
  ],
  experience: [
    {
      employer: 'ANSWER ALS',
      title: 'Data Concierge',
      dates: 'February 2022 - Present',
      bullets: [
        'Contributed to OMOP Common Data Model transformations, mapping clinical data to standardized terminologies.',
        'Developed pipelines for transforming raw clinical data into standardized formats for research use.',
        'Automated user acceptance processes with Python scripts, reducing manual effort.',
        'Validated data integrity across multiple drops and supported data curation.',
        'Facilitated data portal interactions, optimizing access for research purposes.',
      ],
    },
    {
      employer: 'Equity Quotient',
      title: 'Data Analyst',
      dates: 'September 2022 - April 2023',
      bullets: [
        'Created SQL views in Snowflake for dashboard integration.',
        'Performed ETL on census data, transforming it for analysis.',
        'Investigated data across healthcare, demographics, and income to derive insights.',
        'Extracted, loaded, and explored HMDA data, leading to widget creation for visualization.',
      ],
    },
    {
      employer: 'RARE-X',
      title: 'Data Standards Intern',
      dates: 'June 2021 - February 2022',
      bullets: [
        'Ensured alignment of data with standardized health data sources.',
        'Transformed data dictionaries and created JSON code for the Data Collection Platform.',
        'Developed e-Consent documents to meet legal and functional standards.',
      ],
    },
    {
      employer: 'Across Healthcare',
      title: 'Software Quality Assurance Intern',
      dates: 'May 2021 - February 2022',
      bullets: [
        'Created survey code for data collection, contributing to a comprehensive survey library.',
        'Assisted with integrating survey data into new structures.',
        'Automated QA tasks using Selenium, improving software testing workflows.',
        'Created and maintained data dictionaries to ensure compliance with health data standards.',
      ],
    },
  ] satisfies ResumeExperience[],
  projects: [
    {
      title: '2022 SAIPE Estimates Analysis',
      description:
        'Analyzed and visualized Small Area Income and Poverty Estimates (SAIPE) data to uncover insights on poverty rates and median income.',
      tools: 'Python, Pandas, Matplotlib, Seaborn',
      repository: 'Census SAIPE Analysis',
    },
    {
      title: 'State-by-State Analysis of Chronic Condition Drug Utilization and Costs',
      description:
        'Analyzed drug utilization patterns and costs across U.S. states, providing policy implications for healthcare strategies.',
      tools: 'Python, Pandas, SQLite, Matplotlib, Seaborn',
      repository: 'State-by-State Analysis of Chronic Condition Drug Utilization and Costs',
    },
  ] satisfies ResumeProject[],
  education: {
    institution: 'University of West Georgia',
    degree: 'Bachelor of Business Administration in Management of Information Systems',
    dates: 'August 2018 - July 2022',
  },
} as const
