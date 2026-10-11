import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'

import {
  DEFAULT_LIST_COLOR,
  normalizeListColor
} from '@/utils/listColors'

/* === TYPES === */

export type WishColor = 'blue' | 'gold' | 'peach' | 'mint' | 'lilac'

export interface Wish {
  id: string
  name: string
  description: string
  price: string
  sticker: string
  icon: string
  color: WishColor
}

export interface Wishlist {
  id: string
  name: string
  description: string
  icon: string
  color: string
  items: Wish[]
}

export interface NewWishlist {
  name: string
  description: string
  icon: string
  color: string
}

interface SavedData {
  version: number
  lists: Wishlist[]
  activeListId: string | null
}

type StoredWishlist = Omit<Wishlist, 'color'> & {
  color: unknown
}

/* === STORAGE === */

const STORAGE_KEY = 'gimmie-wishlists-v2'

function isWishlist(value: unknown): value is StoredWishlist {
  if (!value || typeof value !== 'object') {
    return false
  }

  const list = value as Partial<Wishlist>

  return (
    typeof list.id === 'string' &&
    typeof list.name === 'string' &&
    typeof list.description === 'string' &&
    typeof list.icon === 'string' &&
    Array.isArray(list.items)
  )
}

function loadData(): SavedData {
  const empty: SavedData = {
    version: 2,
    lists: [],
    activeListId: null
  }

  try {
    const saved =
      localStorage.getItem(STORAGE_KEY)

    if (!saved) {
      return empty
    }

    const data: unknown = JSON.parse(saved)

    if (!data || typeof data !== 'object') {
      return empty
    }

    const stored = data as Partial<SavedData>

    if (
      (stored.version !== 1 && stored.version !== 2) ||
      !Array.isArray(stored.lists)
    ) {
      return empty
    }

    const records: unknown[] = stored.lists

    const lists: Wishlist[] = records
      .filter(isWishlist)
      .map((list) => ({
        ...list,
        color: normalizeListColor(list.color)
      }))

    const activeListId = lists.some(
      (list) => list.id === stored.activeListId
    )
      ? stored.activeListId!
      : (lists[0]?.id ?? null)

    return {
      version: 2,
      lists,
      activeListId
    }
  } catch {
    return empty
  }
}

/* === WISHLISTS === */

export const useWishlistStore = defineStore('wishlists', () => {
  const saved = loadData()

  const wishlists = ref<Wishlist[]>(saved.lists)
  const activeListId = ref<string | null>(saved.activeListId)

  const activeList = computed(() => {
    return (
      wishlists.value.find((list) => list.id === activeListId.value) ??
      wishlists.value[0] ??
      null
    )
  })

  const listCount = computed(() => wishlists.value.length)

  function selectList(id: string) {
    if (wishlists.value.some((list) => list.id === id)) {
      activeListId.value = id
    }
  }

  function createList(input: NewWishlist) {
    const name = input.name.trim().slice(0, 60)

    if (!name) {
      return
    }

    const list: Wishlist = {
      id: crypto.randomUUID(),
      name,
      description: input.description.trim().slice(0, 160),
      icon: input.icon.trim() || '📌',
      color: normalizeListColor(input.color || DEFAULT_LIST_COLOR),
      items: []
    }

    wishlists.value.push(list)
    activeListId.value = list.id
  }

  /* === AUTOSAVE === */

  watch(
    [wishlists, activeListId],
    () => {
      const data: SavedData = {
        version: 2,
        lists: wishlists.value,
        activeListId: activeListId.value
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch {
        console.warn('Could not save wishlists')
      }
    },
    { deep: true }
  )

  return {
    wishlists,
    activeListId,
    activeList,
    listCount,
    selectList,
    createList
  }
})