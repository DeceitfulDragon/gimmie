<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import NewWishlistForm from '@/components/NewWishlistForm.vue'
import WishForm from '@/components/WishForm.vue'
import WishCard from '@/components/WishCard.vue'

import { useWishlistStore } from '@/stores/wishlists'
import { getTabTextColor } from '@/utils/listColors'

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

const listCount = computed(() => String(wishlists.value.length).padStart(2, '0'))

const pageNumber = computed(() => {
  const index = wishlists.value.findIndex((list) => list.id === activeList.value?.id)
  return String(index + 1).padStart(2, '0')
})

function toggleNewList() {
  showNewList.value = !showNewList.value
  if (showNewList.value) closeWishForm()
}

function createList(input: NewWishlist) {
  wishlistStore.createList(input)
  showNewList.value = false
  closeWishForm()
}

function selectList(id: string) {
  wishlistStore.selectList(id)
  closeWishForm()
}

/* === ITEM FORM === */

const showWishForm = ref(false)
const editingWishId = ref<string | null>(null)
const saveError = ref('')

const editingWish = computed(() => {
  if (!editingWishId.value) return null
  return activeList.value?.items.find((item) => item.id === editingWishId.value) ?? null
})

function closeWishForm() {
  showWishForm.value = false
  editingWishId.value = null
  saveError.value = ''
}

function toggleWishForm() {
  if (showWishForm.value) {
    closeWishForm()
    return
  }

  editingWishId.value = null
  showWishForm.value = true
  showNewList.value = false
  saveError.value = ''
}

function editWish(id: string) {
  if (!activeList.value?.items.some((item) => item.id === id)) return

  editingWishId.value = id
  showWishForm.value = true
  showNewList.value = false
  saveError.value = ''
}

function saveWish(input: NewWish) {
  if (!activeList.value) return

  const listId = activeList.value.id

  const saved = editingWishId.value
    ? wishlistStore.updateWish(listId, editingWishId.value, input)
    : wishlistStore.addWish(listId, input)

  if (saved) {
    closeWishForm()
  } else {
    saveError.value = 'Could not save this item. Check the fields and try again.'
  }
}

function removeWish(id: string) {
  if (!activeList.value) return

  const removed = wishlistStore.removeWish(activeList.value.id, id)
  if (removed && editingWishId.value === id) closeWishForm()
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
              :aria-controls="showNewList ? 'new-wishlist-form' : undefined" @click="toggleNewList">
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

                  <button type="button" class="add-item-button" :aria-expanded="showWishForm"
                    :aria-controls="showWishForm ? 'wish-form' : undefined" @click="toggleWishForm">
                    {{ showWishForm ? 'Cancel' : '+ Add item' }}
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

              <WishForm v-if="showWishForm" :key="`${activeList.id}-${editingWishId ?? 'new'}`" :dark="theme === 'dark'"
                :wish="editingWish" @save="saveWish" @cancel="closeWishForm" />

              <p v-if="saveError" class="save-error" role="alert">
                {{ saveError }}
              </p>

              <div v-if="activeList.items.length > 0" class="wish-grid">
                <WishCard v-for="wish in activeList.items" :key="wish.id" :wish="wish" @edit="editWish(wish.id)"
                  @remove="removeWish(wish.id)" />
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

/* === ERRORS === */

.save-error {
  margin: 12px 0;
  color: #c04d49;
  font-size: 13px;
  font-weight: 700;
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
