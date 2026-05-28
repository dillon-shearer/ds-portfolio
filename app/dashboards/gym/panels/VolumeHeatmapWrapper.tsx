import VolumeHeatmapInner from './VolumeHeatmap'
import styles from './VolumeHeatmap.module.css'

type Mode = 'week' | 'month' | 'year'
type Props = {
  mode: Mode
  data: { date: string; volume: number }[]
}

const LEGEND = [
  { color: '#EBE3D5' },
  { color: '#D8CFC2' },
  { color: '#8A7F71' },
  { color: '#4A4239' },
  { color: '#7A2E2E' },
]

export default function VolumeHeatmap({ mode, data }: Props) {
  return (
    <div className={styles.wrapper}>
      <VolumeHeatmapInner
        mode={mode}
        data={data}
        fillParent
        naColor="#EBE3D5"
      />
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Less</span>
        <div className={styles.legendScale}>
          {LEGEND.map(({ color }) => (
            <div key={color} className={styles.legendSwatch} style={{ background: color }} />
          ))}
        </div>
        <span className={styles.legendLabel}>More</span>
      </div>
    </div>
  )
}
