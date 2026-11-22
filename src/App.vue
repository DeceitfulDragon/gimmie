<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import WishlistForm from '@/components/WishlistForm.vue'
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
  { immediate: true },
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
  'One thing at a time.',
]

const currentNote = notes[Math.floor(Math.random() * notes.length)]!

/* === WISHLISTS === */

const wishlistStore = useWishlistStore()
const { wishlists, activeList } = storeToRefs(wishlistStore)

const showListForm = ref(false)
const editingListId = ref<string | null>(null)
const listError = ref('')
const confirmingListDelete = ref(false)

const listCount = computed(() => String(wishlists.value.length).padStart(2, '0'))

const pageNumber = computed(() => {
  const index = wishlists.value.findIndex((list) => list.id === activeList.value?.id)
  return String(index + 1).padStart(2, '0')
})

const editingList = computed(() => {
  return wishlists.value.find((list) => list.id === editingListId.value) ?? null
})

function closeListForm() {
  showListForm.value = false
  editingListId.value = null
  listError.value = ''
}

function toggleNewList() {
  if (showListForm.value && !editingListId.value) {
    closeListForm()
    return
  }

  closeWishForm()
  confirmingListDelete.value = false
  editingListId.value = null
  showListForm.value = true
}

function editList() {
  if (!activeList.value) return

  closeWishForm()
  confirmingListDelete.value = false
  editingListId.value = activeList.value.id
  showListForm.value = true
  listError.value = ''
}

function saveList(input: NewWishlist) {
  if (editingListId.value) {
    if (!wishlistStore.updateList(editingListId.value, input)) {
      listError.value = 'Could not save this list'
      return
    }
  } else {
    wishlistStore.createList(input)
  }

  closeListForm()
}

function selectList(id: string) {
  wishlistStore.selectList(id)
  closeListForm()
  closeWishForm()
  confirmingListDelete.value = false
}

/* === DELETE LIST === */

function toggleListDelete() {
  if (!activeList.value) return

  confirmingListDelete.value = !confirmingListDelete.value

  if (confirmingListDelete.value) {
    closeListForm()
    closeWishForm()
  }
}

function deleteList() {
  if (!activeList.value || !confirmingListDelete.value) return

  if (wishlistStore.removeList(activeList.value.id)) {
    confirmingListDelete.value = false
    closeListForm()
    closeWishForm()
  }
}

/* === ITEMS === */

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

  closeListForm()
  confirmingListDelete.value = false
  editingWishId.value = null
  showWishForm.value = true
}

function editWish(id: string) {
  if (!activeList.value?.items.some((item) => item.id === id)) return

  closeListForm()
  confirmingListDelete.value = false
  editingWishId.value = id
  showWishForm.value = true
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
          <div class="brand-logo">gimmie<span>.</span></div>
          <p class="brand-caption">want it? list it.</p>
        </div>

        <button
          type="button"
          class="theme-toggle"
          :aria-pressed="theme === 'dark'"
          :aria-label="theme === 'light' ? 'Switch to After Hours' : 'Switch to Daytime'"
          @click="toggleTheme"
        >
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
            <h1>stuff <span>i want.</span></h1>

            <p class="masthead-description">
              Things I might buy, things I probably won't. At least they're all in one place.
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

            <button
              type="button"
              class="theme-toggle"
              :aria-expanded="showListForm && !editingListId"
              :aria-controls="showListForm && !editingListId ? 'wishlist-form' : undefined"
              @click="toggleNewList"
            >
              {{ showListForm && !editingListId ? 'Cancel' : '+ New list' }}
            </button>
          </div>

          <WishlistForm
            v-if="showListForm && !editingListId"
            key="new"
            :dark="theme === 'dark'"
            @save="saveList"
            @cancel="closeListForm"
          />

          <template v-if="activeList">
            <nav class="list-tabs" aria-label="Wishlists">
              <button
                v-for="list in wishlists"
                :key="list.id"
                type="button"
                class="list-tab"
                :style="{
                  backgroundColor: list.color,
                  color: getTabTextColor(list.color),
                }"
                :aria-pressed="activeList.id === list.id"
                @click="selectList(list.id)"
              >
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

                  <button
                    type="button"
                    class="add-item-button"
                    :aria-expanded="showWishForm"
                    :aria-controls="showWishForm ? 'wish-form' : undefined"
                    @click="toggleWishForm"
                  >
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

                <div class="list-tools">
                  <button type="button" class="list-tool" @click="editList">Edit list</button>

                  <button
                    type="button"
                    class="list-tool list-tool--delete"
                    :aria-expanded="confirmingListDelete"
                    :aria-controls="confirmingListDelete ? 'list-delete-confirmation' : undefined"
                    @click="toggleListDelete"
                  >
                    Delete list
                  </button>
                </div>
              </div>

              <WishlistForm
                v-if="showListForm && editingListId === activeList.id"
                :key="activeList.id"
                :dark="theme === 'dark'"
                :wishlist="editingList"
                @save="saveList"
                @cancel="closeListForm"
              />

              <p v-if="listError" class="save-error" role="alert">
                {{ listError }}
              </p>

              <section
                v-if="confirmingListDelete"
                id="list-delete-confirmation"
                class="list-delete-confirm"
                aria-label="Delete wishlist confirmation"
              >
                <h3>Delete "{{ activeList.name }}"?</h3>

                <p v-if="activeList.items.length">
                  This also deletes all {{ activeList.items.length }}
                  {{ activeList.items.length === 1 ? 'item' : 'items' }}
                  inside it. You can't undo this.
                </p>

                <p v-else>This list will be removed from your browser. You can't undo this.</p>

                <div class="delete-actions">
                  <button
                    type="button"
                    class="keep-list-button"
                    @click="confirmingListDelete = false"
                  >
                    Keep list
                  </button>

                  <button type="button" class="delete-list-button" @click="deleteList">
                    Delete list
                  </button>
                </div>
              </section>

              <WishForm
                v-if="showWishForm"
                :key="`${activeList.id}-${editingWishId ?? 'new'}`"
                :dark="theme === 'dark'"
                :wish="editingWish"
                @save="saveWish"
                @cancel="closeWishForm"
              />

              <p v-if="saveError" class="save-error" role="alert">
                {{ saveError }}
              </p>

              <div v-if="activeList.items.length > 0" class="wish-grid">
                <WishCard
                  v-for="wish in activeList.items"
                  :key="wish.id"
                  :wish="wish"
                  @edit="editWish(wish.id)"
                  @remove="removeWish(wish.id)"
                />
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

      <footer class="site-footer">gimmie. want it? list it.</footer>
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

/* === LIST CONTROLS === */

.list-tools {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.list-tool {
  padding: 4px 0;

  color: var(--accent);
  background: transparent;
  border: 0;

  font-size: 12px;
  font-weight: 700;
}

.list-tool:hover {
  text-decoration: underline;
}

.list-tool--delete {
  color: var(--muted);
}

/* === DELETE CONFIRMATION === */

.list-delete-confirm {
  margin: 4px 0 26px;
  padding: 20px;

  background: var(--card);
  border: 1px solid var(--border);
  border-left: 4px solid #b65b56;
  border-radius: 4px;
}

.list-delete-confirm h3 {
  margin-bottom: 8px;
  font-size: 19px;
  font-weight: 800;
}

.list-delete-confirm p {
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.delete-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 19px;
}

.delete-actions button {
  min-height: 39px;
  padding: 9px 15px;

  border: 1px solid var(--border);
  border-radius: 4px;

  font-size: 13px;
  font-weight: 700;
}

.keep-list-button {
  color: var(--ink);
  background: var(--paper);
}

.delete-list-button {
  color: #ffffff;
  background: #a74949;
  border-color: #a74949 !important;
}

.delete-actions button:hover {
  filter: brightness(1.08);
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

  .page-meta {
    flex-wrap: wrap;
  }

  .list-tools {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
