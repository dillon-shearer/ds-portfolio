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
  link: { label: string; href: string }
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
      title: 'Variant Report Tool',
      description:
        'Production web app in an ALS research data portal for exploring whole genome sequencing variant data. Builds multi-sheet Excel variant reports for a chosen gene list and participant set, runs genotype-first lookups that turn a locus or rsID into the participants carrying that variant, and plots cohort variants in an embedded igv.js genome browser.',
      tools: 'Python, Panel, Azure SQL, Azure Blob Storage, igv.js, Azure App Service',
      link: {
        label: 'neuromine-variant-reports-prod.azurewebsites.net',
        href: 'https://neuromine-variant-reports-prod.azurewebsites.net/home',
      },
    },
    {
      title: 'Gym Tracker',
      description:
        'Personal training dashboard built on every workout I log. Tracks weekly volume, splits, body part frequency, and exercise PRs, with an interactive 3D body diagram and an AI coach that answers questions directly against the lift database.',
      tools: 'Next.js, PostgreSQL, Recharts, React Three Fiber, OpenAI',
      link: { label: 'datawithdillon.com/demos/gym', href: '/demos/gym' },
    },
  ] satisfies ResumeProject[],
  education: {
    institution: 'University of West Georgia',
    degree: 'Bachelor of Business Administration in Management of Information Systems',
    dates: 'August 2018 - July 2022',
  },
} as const
