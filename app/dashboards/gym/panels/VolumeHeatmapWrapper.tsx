import VolumeHeatmapInner from './VolumeHeatmap'
import styles from './VolumeHeatmap.module.css'

type Mode = 'week' | 'month' | 'year'
type Props = {
  mode: Mode
  data: { date: string; volume: number }[]
}

const LEGEND = [
  { color: '#ECEAE4' },
  { color: '#EFE0DD' },
  { color: '#D9AFA9' },
  { color: '#B97B72' },
  { color: '#98524A' },
  { color: '#7A2E2E' },
]

export default function VolumeHeatmap({ mode, data }: Props) {
  return (
    <div className={styles.wrapper}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <VolumeHeatmapInner mode={mode} data={data} fillParent naColor="#ECEAE4" />
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
