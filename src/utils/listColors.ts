/* === COLORS === */
/* used in wishlist tabs during creation */

export const LIST_COLORS = [
  { name: 'Denim', value: '#315c8a' },
  { name: 'Navy', value: '#213d60' },
  { name: 'Teal', value: '#438c92' },
  { name: 'Sage', value: '#83a78a' },
  { name: 'Gold', value: '#e2b76e' },
  { name: 'Rust', value: '#c9826b' },
  { name: 'Rose', value: '#c66c80' },
  { name: 'Lilac', value: '#9b80af' },
  { name: 'Plum', value: '#66579a' },
  { name: 'Slate', value: '#585f65' },
  { name: 'Brown', value: '#a17753' },
  { name: 'Sand', value: '#e3c4ab' }
]


export const DEFAULT_LIST_COLOR = '#315c8a'

const oldColors: Record<string, string> = {
  blue: '#315c8a',
  gold: '#e2b76e',
  rust: '#c9826b'
}

/* === VALIDATION === */

export function normalizeListColor(value: unknown): string {
  if (typeof value !== 'string') {
    return DEFAULT_LIST_COLOR
  }

  const color = value.toLowerCase()

  if (oldColors[color]) {
    return oldColors[color]
  }

  if (/^#[0-9a-f]{6}$/.test(color)) {
    return color
  }

  return DEFAULT_LIST_COLOR
}

/* === TEXT CONTRAST === */

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((index) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255

    return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)
  })

  return (
    channels[0]! * 0.2126 +
    channels[1]! * 0.7152 +
    channels[2]! * 0.0722
  )
}

export function getTabTextColor(background: string): string {
  const color = normalizeListColor(background)
  const brightness = luminance(color)
  const darkText = luminance('#142238')

  const whiteContrast = 1.05 / (brightness + 0.05)
  const darkContrast = (brightness + 0.05) / (darkText + 0.05)

  return whiteContrast > darkContrast ? '#ffffff' : '#142238'
}