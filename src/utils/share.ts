import { normalizeListColor } from './listColors'
import { normalizeWebUrl } from './urls'
import type { Wish, WishColor, Wishlist } from '@/stores/wishlists'

/* === SHARED LINKS === */

const SHARE_PREFIX = '#gimmie=1.'
export const MAX_SHARE_URL_LENGTH = 6000

const MAX_JSON_BYTES = 320_000
const MAX_SHARED_ITEMS = 50

const itemColors: WishColor[] = ['blue', 'gold', 'peach', 'mint', 'lilac']

type SharedWish = Omit<Wish, 'id'> & { url: string; imageUrl: string }

interface ShareData {
  version: 1
  name: string
  description: string
  icon: string
  color: string
  items: SharedWish[]
}

export function hasSharedLink(hash: string): boolean {
  return hash.startsWith('#gimmie=')
}

/* === ENCODING === */

function toBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error('Invalid share link')

  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - padded.length % 4) % 4))

  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

/* === COMPRESSION === */

async function deflate(text: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(text)
  if (bytes.byteLength > MAX_JSON_BYTES) throw new Error('This list is too large to share as a link!')

  const stream = new Blob([new Uint8Array(bytes)]).stream()
    .pipeThrough(new CompressionStream('deflate-raw'))

  return new Uint8Array(await new Response(stream).arrayBuffer())
}

async function inflate(bytes: Uint8Array): Promise<string> {
  const stream = new Blob([new Uint8Array(bytes)]).stream()
    .pipeThrough(new DecompressionStream('deflate-raw'))

  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    total += value.byteLength

    if (total > MAX_JSON_BYTES) {
      await reader.cancel()
      throw new Error('Shared list is too large!')
    }

    chunks.push(value)
  }

  const result = new Uint8Array(total)
  let offset = 0

  for (const chunk of chunks) {
    result.set(chunk, offset)
    offset += chunk.byteLength
  }

  return new TextDecoder('utf-8', { fatal: true }).decode(result)
}

/* === VALIDATION === */

function readText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string' || value.length > maxLength) throw new Error('Invalid shared list')
  return value
}

function parseSharedList(raw: unknown): Wishlist {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Invalid shared list')

  const data = raw as Record<string, unknown>

  if (data.version !== 1 || !Array.isArray(data.items) || data.items.length > MAX_SHARED_ITEMS) {
    throw new Error('Unsupported shared list')
  }

  const name = readText(data.name, 60).trim()
  if (!name) throw new Error('Invalid shared list')

  const items: Wish[] = data.items.map((rawItem: unknown, index: number) => {
    if (!rawItem || typeof rawItem !== 'object' || Array.isArray(rawItem)) {
      throw new Error('Invalid shared item')
    }

    const item = rawItem as Record<string, unknown>
    const name = readText(item.name, 120).trim()
    const url = readText(item.url, 2000)
    const imageUrl = readText(item.imageUrl, 2000)
    const color = readText(item.color, 10)

    if (!name || !itemColors.includes(color as WishColor)) throw new Error('Invalid shared item')
    if (normalizeWebUrl(url) === null || normalizeWebUrl(imageUrl) === null) {
      throw new Error('Invalid item link')
    }

    return {
      id: `shared-${index}`,
      name,
      description: readText(item.description, 1000),
      price: readText(item.price, 40),
      icon: readText(item.icon, 32),
      color: color as WishColor,
      sticker: readText(item.sticker, 40),
      url,
      imageUrl
    }
  })

  return {
    id: 'shared-list',
    name,
    description: readText(data.description, 160),
    icon: readText(data.icon, 32),
    color: normalizeListColor(readText(data.color, 7)),
    items
  }
}

/* === CREATE LINK === */

export async function createShareLink(list: Wishlist): Promise<string> {
  if (list.items.length > MAX_SHARED_ITEMS) {
    throw new Error('Only 50 items can be shared in one link!')
  }

  if (typeof CompressionStream === 'undefined') {
    throw new Error('Your browser needs an update before it can share lists!')
  }

  const data: ShareData = {
    version: 1,
    name: list.name,
    description: list.description,
    icon: list.icon,
    color: list.color,
    items: list.items.map((item) => ({
      name: item.name,
      description: item.description,
      price: item.price,
      icon: item.icon,
      color: item.color,
      sticker: item.sticker,
      url: item.url ?? '',
      imageUrl: item.imageUrl ?? ''
    }))
  }

  const url = new URL(window.location.href)
  url.search = ''
  url.hash = `gimmie=1.${toBase64Url(await deflate(JSON.stringify(data)))}`

  if (url.href.length > MAX_SHARE_URL_LENGTH) {
    throw new Error('This link is too long. Try shortening items or URLs before sharing!')
  }

  return url.href
}

/* === READ LINK === */

export async function readShareLink(hash: string): Promise<Wishlist> {
  if (!hash.startsWith(SHARE_PREFIX) || hash.length > MAX_SHARE_URL_LENGTH) {
    throw new Error('Unsupported or oversized share link')
  }

  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser cannot open compressed share links!')
  }

  const bytes = fromBase64Url(hash.slice(SHARE_PREFIX.length))
  const data: unknown = JSON.parse(await inflate(bytes))

  return parseSharedList(data)
}
