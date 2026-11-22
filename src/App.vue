<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import WishlistForm from '@/components/WishlistForm.vue'
import WishForm from '@/components/WishForm.vue'
import WishCard from '@/components/WishCard.vue'

import { useWishlistStore } from '@/stores/wishlists'
import { getTabTextColor } from '@/utils/listColors'
import { createShareLink, hasSharedLink, readShareLink } from '@/utils/share'

import type { NewWishlist, NewWish, Wishlist } from '@/stores/wishlists'

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
  closeSharePanel()
  confirmingListDelete.value = false
  editingListId.value = null
  showListForm.value = true
}

function editList() {
  if (!activeList.value) return

  closeWishForm()
  closeSharePanel()
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
  closeSharePanel()
}

function selectList(id: string) {
  wishlistStore.selectList(id)
  closeListForm()
  closeWishForm()
  closeSharePanel()
  confirmingListDelete.value = false
}

/* === DELETE LIST === */

function toggleListDelete() {
  if (!activeList.value) return

  confirmingListDelete.value = !confirmingListDelete.value

  if (confirmingListDelete.value) {
    closeListForm()
    closeWishForm()
    closeSharePanel()
  }
}

function deleteList() {
  if (!activeList.value || !confirmingListDelete.value) return

  if (wishlistStore.removeList(activeList.value.id)) {
    confirmingListDelete.value = false
    closeListForm()
    closeWishForm()
    closeSharePanel()
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
  closeSharePanel()
  confirmingListDelete.value = false
  editingWishId.value = null
  showWishForm.value = true
}

function editWish(id: string) {
  if (!activeList.value?.items.some((item) => item.id === id)) return

  closeListForm()
  closeSharePanel()
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
    closeSharePanel()
  } else {
    saveError.value = 'Could not save this item. Check the fields and try again.'
  }
}

function removeWish(id: string) {
  if (!activeList.value) return

  const removed = wishlistStore.removeWish(activeList.value.id, id)
  if (removed && editingWishId.value === id) closeWishForm()
  if (removed) closeSharePanel()
}

/* === SHARING === */

const shareOpen = ref(false)
const shareBusy = ref(false)
const shareUrl = ref('')
const shareError = ref('')
const copyMessage = ref('')
const shareLinkInput = ref<HTMLInputElement | null>(null)

function closeSharePanel() {
  shareOpen.value = false
  shareUrl.value = ''
  shareError.value = ''
  copyMessage.value = ''
}

async function toggleShare() {
  if (shareOpen.value) {
    closeSharePanel()
    return
  }

  if (!activeList.value) return

  const listId = activeList.value.id
  shareOpen.value = true
  shareBusy.value = true
  shareError.value = ''

  try {
    const url = await createShareLink(activeList.value)
    if (shareOpen.value && activeList.value?.id === listId) shareUrl.value = url
  } catch (error) {
    if (shareOpen.value) {
      shareError.value = error instanceof Error ? error.message : 'Could not create this link'
    }
  } finally {
    shareBusy.value = false
  }
}

async function copyShareLink() {
  if (!shareUrl.value) return

  try {
    await navigator.clipboard.writeText(shareUrl.value)
    copyMessage.value = 'Copied to clipboard'
  } catch {
    shareLinkInput.value?.select()
    copyMessage.value = 'Select and copy the link manually'
  }
}

/* === SHARED LINKS === */

const sharedMode = ref(hasSharedLink(window.location.hash))
const sharedList = ref<Wishlist | null>(null)
const sharedError = ref('')

async function openSharedPage() {
  const hash = window.location.hash
  sharedMode.value = hasSharedLink(hash)
  sharedList.value = null
  sharedError.value = ''

  if (!sharedMode.value) return

  try {
    const list = await readShareLink(hash)
    if (window.location.hash === hash) sharedList.value = list
  } catch {
    if (window.location.hash === hash)
      sharedError.value = 'This shared link is invalid or incomplete.'
  }
}

function onHashChange() {
  void openSharedPage()
}

function leaveSharedPage() {
  const url = new URL(window.location.href)
  url.hash = ''
  window.history.replaceState(null, '', url.href)

  sharedMode.value = false
  sharedList.value = null
  sharedError.value = ''
}

onMounted(() => {
  void openSharedPage()
  window.addEventListener('hashchange', onHashChange)
})

onUnmounted(() => window.removeEventListener('hashchange', onHashChange))
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

      <main v-if="sharedMode" class="shared-view">
        <template v-if="sharedList">
          <div class="shared-heading">
            <span class="overline">SHARED WISHLIST</span>
            <h1>{{ sharedList.name }}</h1>
            <p v-if="sharedList.description">{{ sharedList.description }}</p>
            <p class="shared-caption">
              A read-only copy. Changes made later won't update this link.
            </p>
          </div>

          <div class="list-tabs">
            <div
              class="list-tab"
              :style="{
                backgroundColor: sharedList.color,
                color: getTabTextColor(sharedList.color),
              }"
            >
              <span aria-hidden="true">{{ sharedList.icon }}</span>
              {{ sharedList.name }}
            </div>
          </div>

          <div class="notebook-page">
            <div class="page-meta shared-meta">
              <span>
                <strong>{{ sharedList.items.length }}</strong>
                {{ sharedList.items.length === 1 ? 'thing' : 'things' }} on this list
              </span>

              <span>Shared copy</span>
            </div>

            <div v-if="sharedList.items.length" class="wish-grid">
              <WishCard v-for="wish in sharedList.items" :key="wish.id" :wish="wish" read-only />
            </div>

            <div v-else class="list-empty">
              <h3>Nothing on this list yet.</h3>
            </div>
          </div>
        </template>

        <div v-else class="notebook-page share-loading">
          <span class="overline">SHARED WISHLIST</span>
          <h2>{{ sharedError || 'Opening wishlist...' }}</h2>
          <p v-if="sharedError">The link may have been cut off or damaged.</p>
        </div>

        <button type="button" class="back-button" @click="leaveSharedPage">Back to my lists</button>
      </main>

      <main v-else>
        <section class="collection">
          <div class="collection-header">
            <div class="collection-heading">
              <div class="collection-title">
                <h1>My lists</h1>
                <span class="list-count">{{ listCount }}</span>
              </div>

              <button
                type="button"
                class="theme-toggle new-list-button"
                :aria-expanded="showListForm && !editingListId"
                :aria-controls="showListForm && !editingListId ? 'wishlist-form' : undefined"
                @click="toggleNewList"
              >
                {{ showListForm && !editingListId ? 'Cancel' : '+ New list' }}
              </button>
            </div>

            <aside class="paper-note" aria-label="Note to self">
              <div class="paper-note-title">NOTE TO SELF</div>
              <p>{{ currentNote }}</p>
            </aside>
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
                  <p v-if="activeList.description">{{ activeList.description }}</p>
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
                  {{ activeList.items.length === 1 ? 'thing' : 'things' }} on this list
                </span>

                <div class="list-tools">
                  <button type="button" class="list-tool" @click="toggleShare">
                    {{ shareOpen ? 'Hide link' : 'Share list' }}
                  </button>

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

              <section v-if="shareOpen" class="share-panel" aria-label="Share wishlist">
                <h3>Share this list</h3>

                <p>
                  Anyone with the link can view a copy of this list. New edits won't appear unless
                  you share it again.
                </p>

                <p v-if="shareBusy" class="share-message">Making a link...</p>
                <p v-else-if="shareError" class="save-error" role="alert">{{ shareError }}</p>

                <template v-else-if="shareUrl">
                  <div class="share-link-row">
                    <input
                      ref="shareLinkInput"
                      type="text"
                      :value="shareUrl"
                      aria-label="Shared wishlist link"
                      readonly
                      @focus="shareLinkInput?.select()"
                    />

                    <button type="button" class="copy-button" @click="copyShareLink">
                      Copy link
                    </button>
                  </div>

                  <p v-if="copyMessage" class="share-message" role="status">{{ copyMessage }}</p>

                  <p v-if="shareUrl.length > 4000" class="share-message">
                    This is a long link. Some apps may have trouble sharing it.
                  </p>
                </template>
              </section>

              <WishlistForm
                v-if="showListForm && editingListId === activeList.id"
                :key="activeList.id"
                :dark="theme === 'dark'"
                :wishlist="editingList"
                @save="saveList"
                @cancel="closeListForm"
              />

              <p v-if="listError" class="save-error" role="alert">{{ listError }}</p>

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

              <p v-if="saveError" class="save-error" role="alert">{{ saveError }}</p>

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
                <h3>Nothing here yet</h3>
                <p>Add something when you're ready!</p>
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

              <h2>Nothing here yet</h2>
              <p>Make a list to get started!</p>
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

/* === SHARING === */

.share-panel {
  margin: 4px 0 26px;
  padding: 20px;

  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 5px;
}

.share-panel h3 {
  margin-bottom: 8px;
  font-size: 19px;
  font-weight: 800;
}

.share-panel > p {
  max-width: 650px;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.6;
}

.share-link-row {
  display: flex;
  gap: 10px;
  margin-top: 17px;
}

.share-link-row input {
  flex: 1;
  min-width: 0;
  min-height: 40px;
  padding: 9px 11px;

  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 4px;

  font-size: 12px;
}

.copy-button {
  padding: 9px 15px;
  color: var(--accent-text);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
}

.share-panel .share-message {
  margin-top: 11px;
  font-size: 12px;
}

.shared-view {
  padding-top: 35px;
}

.shared-heading {
  padding: 0 0 35px;
}

.shared-heading h1 {
  margin: 4px 0 12px;
  font-size: clamp(34px, 5vw, 55px);
  font-weight: 800;
  letter-spacing: -1.4px;
  overflow-wrap: anywhere;
}

.shared-heading p {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.shared-heading .shared-caption {
  margin-top: 10px;
  font-size: 12px;
}

.shared-meta {
  margin-top: 0;
}

.share-loading {
  min-height: 210px;
}

.share-loading h2 {
  margin: 10px 0;
  font-size: 25px;
}

.share-loading p {
  color: var(--muted);
  font-size: 13px;
}

.back-button {
  margin-top: 27px;
  padding: 9px 0;

  color: var(--accent);
  background: transparent;
  border: 0;

  font-size: 13px;
  font-weight: 700;
}

.back-button:hover {
  text-decoration: underline;
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
  color: #c04d49 !important;
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

  .share-link-row {
    flex-direction: column;
  }

  .shared-view {
    padding-top: 20px;
  }

  .shared-heading {
    padding-bottom: 24px;
  }
}
</style>
