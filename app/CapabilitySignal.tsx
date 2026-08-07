import { CAPABILITIES, CAPABILITY_SIGNAL } from '@/content/home'
import styles from './page.module.css'

const POINT_COUNT = 10
const PLOT_WIDTH = 288
const PLOT_HEIGHT = 48

function buildSignalPoints(capability: (typeof CAPABILITIES)[number], rowIndex: number) {
  const source = [capability.eyebrow, capability.title, ...capability.tags].join('')
  let value = PLOT_HEIGHT / 2

  return Array.from({ length: POINT_COUNT }, (_, pointIndex) => {
    const character = source.charCodeAt((pointIndex * 5 + rowIndex * 3) % source.length)
    const target = 8 + ((character + pointIndex * 7 + rowIndex * 11) % 33)
    value = value * 0.35 + target * 0.65

    return {
      x: (pointIndex * PLOT_WIDTH) / (POINT_COUNT - 1),
      y: value,
    }
  })
}

export function CapabilitySignal() {
  return (
    <figure className={styles.signal} aria-label={CAPABILITY_SIGNAL.description}>
      <div className={styles.signalHeader}>
        <figcaption className={styles.signalTitle}>{CAPABILITY_SIGNAL.title}</figcaption>
        <span className={styles.signalCount}>
          {String(CAPABILITIES.length).padStart(2, '0')} {CAPABILITY_SIGNAL.recordLabel}
        </span>
      </div>

      <ol className={styles.signalRows}>
        {CAPABILITIES.map((capability, rowIndex) => {
          const points = buildSignalPoints(capability, rowIndex)
          const lastPoint = points[points.length - 1]

          return (
            <li key={capability.title} className={styles.signalRow}>
              <span className={styles.signalIndex}>{String(rowIndex + 1).padStart(2, '0')}</span>
              <span className={styles.signalLabel}>{capability.eyebrow}</span>
              <svg
                className={styles.signalPlot}
                viewBox={`0 0 ${PLOT_WIDTH} ${PLOT_HEIGHT}`}
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                {[0, 72, 144, 216, 288].map((x) => (
                  <line
                    key={x}
                    className={styles.signalGridLine}
                    x1={x}
                    y1="0"
                    x2={x}
                    y2={PLOT_HEIGHT}
                  />
                ))}
                <line
                  className={styles.signalGridLine}
                  x1="0"
                  y1={PLOT_HEIGHT / 2}
                  x2={PLOT_WIDTH}
                  y2={PLOT_HEIGHT / 2}
                />
                <polyline
                  className={styles.signalTrace}
                  points={points.map(({ x, y }) => `${x},${y}`).join(' ')}
                />
                <rect
                  className={styles.signalMarker}
                  x={lastPoint.x - 2.5}
                  y={lastPoint.y - 2.5}
                  width="5"
                  height="5"
                />
              </svg>
            </li>
          )
        })}
      </ol>

      <div className={styles.signalFooter}>
        <span>{CAPABILITY_SIGNAL.source}</span>
        <span>{CAPABILITY_SIGNAL.mode}</span>
      </div>
    </figure>
  )
}
