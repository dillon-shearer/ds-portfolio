import type { Metadata } from 'next'
import { Button } from '@/components/ui'
import { RESUME_PAGE } from '@/content/resume'
import styles from './page.module.css'

export const metadata: Metadata = RESUME_PAGE.metadata

export default function ResumePage() {
  return (
    <div className="page-wrapper--wide">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>RESUME / DATA ANALYST</p>
          <h1 className={styles.name}>{RESUME_PAGE.name}</h1>
          <p className={styles.location}>{RESUME_PAGE.location}</p>
        </div>
        <Button href={RESUME_PAGE.pdfHref} variant="outline" download>
          Download PDF
        </Button>
      </header>

      <div className={styles.contact}>
        <a href={`mailto:${RESUME_PAGE.email}`}>{RESUME_PAGE.email}</a>
        <span aria-hidden="true"> / </span>
        <a href={RESUME_PAGE.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
        <span aria-hidden="true"> / </span>
        <a href={RESUME_PAGE.github} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </div>

      <section className={styles.section} aria-labelledby="summary-heading">
        <h2 id="summary-heading" className={styles.sectionTitle}>
          Summary
        </h2>
        <p className={styles.summary}>{RESUME_PAGE.summary}</p>
      </section>

      <section className={styles.section} aria-labelledby="skills-heading">
        <h2 id="skills-heading" className={styles.sectionTitle}>
          Skills
        </h2>
        <dl className={styles.skills}>
          {RESUME_PAGE.skills.map((skill) => (
            <div key={skill.label} className={styles.skill}>
              <dt>{skill.label}</dt>
              <dd>{skill.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section} aria-labelledby="experience-heading">
        <h2 id="experience-heading" className={styles.sectionTitle}>
          Professional Experience
        </h2>
        <ol className={styles.entryList}>
          {RESUME_PAGE.experience.map((role, index) => (
            <li key={`${role.employer}-${role.title}`} className={styles.entry}>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <article>
                <header className={styles.entryHeader}>
                  <div>
                    <p className={styles.meta}>{role.employer}</p>
                    <h3 className={styles.entryTitle}>{role.title}</h3>
                  </div>
                  <p className={styles.dates}>{role.dates}</p>
                </header>
                <ul className={styles.bullets}>
                  {role.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="projects-heading">
        <h2 id="projects-heading" className={styles.sectionTitle}>
          Projects
        </h2>
        <ol className={styles.projectList}>
          {RESUME_PAGE.projects.map((project, index) => (
            <li key={project.title} className={styles.project}>
              <span className={styles.index} aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className={styles.entryTitle}>{project.title}</h3>
                <p className={styles.projectDescription}>{project.description}</p>
                <p className={styles.projectMeta}>
                  <span>Tools: </span>
                  {project.tools}
                </p>
                <p className={styles.projectMeta}>
                  <span>Live: </span>
                  <a href={project.link.href} target="_blank" rel="noopener noreferrer">
                    {project.link.label}
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="education-heading">
        <h2 id="education-heading" className={styles.sectionTitle}>
          Education
        </h2>
        <div className={styles.education}>
          <div>
            <p className={styles.meta}>{RESUME_PAGE.education.institution}</p>
            <h3 className={styles.entryTitle}>{RESUME_PAGE.education.degree}</h3>
          </div>
          <p className={styles.dates}>{RESUME_PAGE.education.dates}</p>
        </div>
      </section>
    </div>
  )
}
