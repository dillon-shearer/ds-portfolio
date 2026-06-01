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
      <div style={{ flex: 1, minHeight: 0 }}>
        <VolumeHeatmapInner
          mode={mode}
          data={data}
          fillParent
          naColor="#EBE3D5"
        />
      </div>
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Volume</span>
        <div className={styles.legendScale}>
          {LEGEND.map(({ color }, i) => (
            <div
              key={color}
              className={styles.legendSwatch}
              style={{
                background: color,
                height: `${6 + i * 3}px`,
                alignSelf: 'flex-end',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
