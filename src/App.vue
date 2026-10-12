<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import NewWishlistForm from '@/components/NewWishlistForm.vue'
import NewWishForm from '@/components/NewWishForm.vue'

import { useWishlistStore } from '@/stores/wishlists'
import { getTabTextColor } from '@/utils/listColors'
import { normalizeWebUrl } from '@/utils/urls'

import type { NewWishlist, NewWish } from '@/stores/wishlists'

/* === THEME === */

type Theme = 'light' | 'dark'

const THEME_KEY = 'gimmie-theme'

function loadTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const theme = ref<Theme>(loadTheme())

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

watch(
  theme,
  (value) => {
    document.documentElement.dataset.theme = value

    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (themeColor) themeColor.content = value === 'dark' ? '#142238' : '#dbe1e4'

    try {
      localStorage.setItem(THEME_KEY, value)
    } catch {
      console.warn('Could not save theme preference')
    }
  },
  { immediate: true }
)

/* === NOTES === */

const notes = [
  'Maybe next payday.',
  'Wait for a sale.',
  'Sleep on it.',
  'Do I really need another one?',
  'Save the link this time.',
  'Still thinking about it.',
  'Check the measurements first.',
  'That can stay on the list.',
  'Maybe ask for it for my birthday.',
  'One thing at a time.'
]

const currentNote = notes[Math.floor(Math.random() * notes.length)]!

/* === WISHLISTS === */

const wishlistStore = useWishlistStore()
const { wishlists, activeList } = storeToRefs(wishlistStore)

const showNewList = ref(false)
const showNewWish = ref(false)

const listCount = computed(() => String(wishlists.value.length).padStart(2, '0'))

const pageNumber = computed(() => {
  const index = wishlists.value.findIndex((list) => list.id === activeList.value?.id)
  return String(index + 1).padStart(2, '0')
})

function createList(input: NewWishlist) {
  wishlistStore.createList(input)
  showNewList.value = false
  showNewWish.value = false
}

function selectList(id: string) {
  wishlistStore.selectList(id)
  showNewWish.value = false
}

/* === ITEMS === */

const failedImages = ref<string[]>([])

function createWish(input: NewWish) {
  if (!activeList.value) return

  const added = wishlistStore.addWish(activeList.value.id, input)
  if (added) showNewWish.value = false
}

function onImageError(id: string) {
  if (!failedImages.value.includes(id)) failedImages.value.push(id)
}
</script>

<template>
  <div class="site-shell">
    <div class="page-container">
      <header class="site-header">
        <div class="brand">
          <div class="brand-logo">
            gimmie<span>.</span>
          </div>

          <p class="brand-caption">
            want it? list it.
          </p>
        </div>

        <button type="button" class="theme-toggle" :aria-pressed="theme === 'dark'"
          :aria-label="theme === 'light' ? 'Switch to After Hours' : 'Switch to Daytime'" @click="toggleTheme">
          <span class="theme-icon" aria-hidden="true">
            {{ theme === 'light' ? '☾' : '☀' }}
          </span>

          {{ theme === 'light' ? 'After Hours' : 'Daytime' }}
        </button>
      </header>

      <main>
        <section class="masthead">
          <div>
            <span class="overline">YOUR LISTS</span>

            <h1>
              stuff <span>i want.</span>
            </h1>

            <p class="masthead-description">
              Things I might buy, things I probably won't.
              At least they're all in one place.
            </p>
          </div>

          <aside class="paper-note">
            <div class="paper-note-title">NOTE TO SELF</div>
            <p>{{ currentNote }}</p>
          </aside>
        </section>

        <section class="collection">
          <div class="collection-label">
            <span>MY LISTS / {{ listCount }}</span>

            <button type="button" class="theme-toggle" :aria-expanded="showNewList"
              :aria-controls="showNewList ? 'new-wishlist-form' : undefined" @click="showNewList = !showNewList">
              {{ showNewList ? 'Cancel' : '+ New list' }}
            </button>
          </div>

          <NewWishlistForm v-if="showNewList" :dark="theme === 'dark'" @create="createList"
            @cancel="showNewList = false" />

          <template v-if="activeList">
            <nav class="list-tabs" aria-label="Wishlists">
              <button v-for="list in wishlists" :key="list.id" type="button" class="list-tab" :style="{
                backgroundColor: list.color,
                color: getTabTextColor(list.color)
              }" :aria-pressed="activeList.id === list.id" @click="selectList(list.id)">
                <span aria-hidden="true">{{ list.icon }}</span>
                {{ list.name }}
              </button>
            </nav>

            <div class="notebook-page">
              <div class="page-heading">
                <div>
                  <span class="overline">MY WISHLIST</span>
                  <h2>{{ activeList.name }}</h2>

                  <p v-if="activeList.description">
                    {{ activeList.description }}
                  </p>
                </div>

                <div class="page-actions">
                  <span class="page-number">PAGE {{ pageNumber }}</span>

                  <button type="button" class="add-item-button" :aria-expanded="showNewWish"
                    :aria-controls="showNewWish ? 'new-wish-form' : undefined" @click="showNewWish = !showNewWish">
                    {{ showNewWish ? 'Cancel' : '+ Add item' }}
                  </button>
                </div>
              </div>

              <div class="page-meta">
                <span>
                  <strong>{{ activeList.items.length }}</strong>
                  {{ activeList.items.length === 1 ? 'thing' : 'things' }}
                  on this list
                </span>

                <span>{{ activeList.name }}</span>
              </div>

              <NewWishForm v-if="showNewWish" :key="activeList.id" :dark="theme === 'dark'" @create="createWish"
                @cancel="showNewWish = false" />

              <div v-if="activeList.items.length > 0" class="wish-grid">
                <article v-for="wish in activeList.items" :key="wish.id" class="wish-card">
                  <div class="wish-art" :class="`wish-art--${wish.color}`">
                    <img v-if="normalizeWebUrl(wish.imageUrl) && !failedImages.includes(wish.id)" class="wish-image"
                      :src="normalizeWebUrl(wish.imageUrl) || undefined" :alt="wish.name" loading="lazy"
                      @error="onImageError(wish.id)" />

                    <span v-else class="wish-illustration" aria-hidden="true">
                      {{ wish.icon }}
                    </span>

                    <span v-if="wish.sticker" class="wish-sticker">
                      {{ wish.sticker }}
                    </span>
                  </div>

                  <div class="wish-details">
                    <h3>{{ wish.name }}</h3>

                    <p v-if="wish.description" class="wish-description">
                      {{ wish.description }}
                    </p>

                    <div v-if="wish.price || normalizeWebUrl(wish.url)" class="wish-footer">
                      <span v-if="wish.price" class="wish-price">
                        {{ wish.price }}
                      </span>

                      <a v-if="normalizeWebUrl(wish.url)" class="wish-link"
                        :href="normalizeWebUrl(wish.url) || undefined" target="_blank" rel="noopener noreferrer">
                        View item ↗
                      </a>
                    </div>
                  </div>
                </article>
              </div>

              <div v-else class="list-empty">
                <span class="overline">EMPTY PAGE</span>
                <h3>Nothing here yet.</h3>
                <p>Add something when you're ready.</p>
              </div>
            </div>
          </template>

          <div v-else class="notebook-page notebook-page--empty">
            <div class="empty-state">
              <div class="empty-sheet" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <span class="overline">FIRST PAGE</span>
              <h2>Nothing here yet.</h2>
              <p>Make a list to get started.</p>
            </div>
          </div>
        </section>
      </main>

      <footer class="site-footer">
        gimmie. want it? list it.
      </footer>
    </div>
  </div>
</template>

<style scoped>
/* === PAGE ACTIONS === */

.page-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.add-item-button {
  min-height: 39px;
  padding: 9px 14px;

  color: var(--accent-text);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 5px;

  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.add-item-button:hover {
  filter: brightness(1.1);
}

/* === EMPTY LIST === */

.list-empty {
  padding: 35px 0 18px;
  text-align: center;
}

.list-empty h3 {
  margin: 4px 0 9px;
  font-size: 23px;
  font-weight: 800;
}

.list-empty p {
  color: var(--muted);
  font-size: 13px;
}

/* === ITEM IMAGES === */

.wish-image {
  position: relative;
  z-index: 1;

  display: block;
  width: 100%;
  height: 100%;

  object-fit: contain;
}

/* === ITEM LINKS === */

.wish-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;

  margin-top: 14px;
  padding-top: 11px;
  border-top: 1px solid var(--border);
}

.wish-footer .wish-price {
  margin: 0;
  padding: 0;
  border: 0;
}

.wish-link {
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
}

.wish-link:hover {
  text-decoration: underline;
}

/* === MOBILE === */

@media (max-width: 650px) {
  .page-heading {
    flex-wrap: wrap;
  }

  .page-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
