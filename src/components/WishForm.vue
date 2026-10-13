<script setup lang="ts">
import { onMounted, ref } from 'vue'

import EmojiPicker from './EmojiPicker.vue'
import { normalizeWebUrl } from '@/utils/urls'

import type { NewWish, Wish } from '@/stores/wishlists'

/* === PROPS === */

const props = defineProps<{
  dark: boolean
  wish?: Wish | null
}>()

const emit = defineEmits<{
  (e: 'save', wish: NewWish): void
  (e: 'cancel'): void
}>()

/* === FORM === */

const editing = !!props.wish
const nameInput = ref<HTMLInputElement | null>(null)

const name = ref(props.wish?.name ?? '')
const price = ref(props.wish?.price ?? '')
const url = ref(props.wish?.url ?? '')
const imageUrl = ref(props.wish?.imageUrl ?? '')
const description = ref(props.wish?.description ?? '')
const icon = ref(props.wish?.icon ?? '📦')

const errorMessage = ref('')
const showEmojiPicker = ref(false)

const quickEmojis = ['📦', '🎮', '🎧', '📚', '💻', '👟', '🛋️', '🎨', '🚗', '🎁']

function chooseEmoji(value: string) {
  icon.value = value
  showEmojiPicker.value = false
}

function handleEscape() {
  if (showEmojiPicker.value) {
    showEmojiPicker.value = false
    return
  }

  emit('cancel')
}

function submit() {
  errorMessage.value = ''

  if (!name.value.trim()) {
    errorMessage.value = 'Give this item a name first'
    return
  }

  const productUrl = normalizeWebUrl(url.value)
  const imageLink = normalizeWebUrl(imageUrl.value)

  if (productUrl === null) {
    errorMessage.value = 'Check the product link'
    return
  }

  if (imageLink === null) {
    errorMessage.value = 'Check the image link'
    return
  }

  emit('save', {
    name: name.value,
    price: price.value,
    description: description.value,
    icon: icon.value,
    url: productUrl,
    imageUrl: imageLink
  })
}

onMounted(() => nameInput.value?.focus())
</script>

<template>
  <form id="wish-form" class="wish-form" @submit.prevent="submit" @keydown.esc.stop.prevent="handleEscape">
    <div class="form-header">
      <div>
        <span class="form-label">{{ editing ? 'EDIT ITEM' : 'NEW ITEM' }}</span>
        <h3>{{ editing ? 'Edit item' : 'Add a thing' }}</h3>
      </div>

      <button type="button" class="close-button" aria-label="Cancel" @click="emit('cancel')">
        ✕
      </button>
    </div>

    <div class="form-grid">
      <div class="field field--full">
        <label for="wish-name">What is it?</label>

        <input id="wish-name" ref="nameInput" v-model="name" type="text" maxlength="120"
          placeholder="A new pair of headphones" required />
      </div>

      <div class="field">
        <label for="wish-price">Price <span>(optional)</span></label>

        <input id="wish-price" v-model="price" type="text" maxlength="40" placeholder="$49.99" />
      </div>

      <div class="field">
        <label for="wish-url">Product link <span>(optional)</span></label>

        <input id="wish-url" v-model="url" type="text" inputmode="url" maxlength="2000" placeholder="https://..." />
      </div>

      <div class="field field--full">
        <label for="wish-image">Image link <span>(optional)</span></label>

        <input id="wish-image" v-model="imageUrl" type="text" inputmode="url" maxlength="2000"
          placeholder="https://example.com/photo.jpg" />

        <small>
          Use a direct link to an image. Some shops block images from other websites.
        </small>
      </div>

      <div class="field field--full">
        <label for="wish-notes">Notes <span>(optional)</span></label>

        <textarea id="wish-notes" v-model="description" maxlength="1000" rows="3"
          placeholder="Size, color, or anything else worth remembering"></textarea>
      </div>
    </div>

    <fieldset class="emoji-field">
      <legend>Icon</legend>

      <p class="field-help">Shown when there's no photo</p>

      <div class="emoji-options">
        <button v-for="option in quickEmojis" :key="option" type="button" class="emoji-choice"
          :class="{ 'emoji-choice--selected': icon === option }" :aria-label="`Choose ${option}`"
          :aria-pressed="icon === option" @click="chooseEmoji(option)">
          {{ option }}
        </button>

        <button type="button" class="more-emoji" :aria-expanded="showEmojiPicker"
          @click="showEmojiPicker = !showEmojiPicker">
          {{ showEmojiPicker ? 'Close' : 'More emoji...' }}
        </button>
      </div>

      <EmojiPicker v-if="showEmojiPicker" :dark="dark" @select="chooseEmoji" />
    </fieldset>

    <p v-if="errorMessage" class="form-error" role="alert">
      {{ errorMessage }}
    </p>

    <div class="form-actions">
      <button type="button" class="form-button form-button--cancel" @click="emit('cancel')">
        Cancel
      </button>

      <button type="submit" class="form-button form-button--save">
        {{ editing ? 'Save changes' : 'Add item' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
/* === FORM === */

.wish-form {
  margin: 22px 0;
  padding: 24px;

  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 5px;
  box-shadow: 4px 5px 0 var(--shadow);
}

.form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.form-label {
  color: var(--muted);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 1.2px;
}

.form-header h3 {
  margin-top: 5px;
  font-size: 24px;
  font-weight: 800;
}

.close-button {
  padding: 6px 9px;
  color: var(--muted);
  background: transparent;
  border: 0;
  font-size: 18px;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.field--full {
  grid-column: 1 / -1;
}

.field label,
.emoji-field legend {
  font-size: 13px;
  font-weight: 700;
}

.field label span {
  color: var(--muted);
  font-weight: 400;
}

.field input,
.field textarea {
  width: 100%;
  padding: 11px 12px;

  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 4px;
}

.field input {
  min-height: 44px;
}

.field textarea {
  resize: vertical;
  line-height: 1.5;
}

.field input:focus,
.field textarea:focus {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.field small,
.field-help {
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

/* === EMOJI === */

.emoji-field {
  margin: 24px 0 0;
  padding: 0;
  border: 0;
}

.emoji-field legend {
  margin-bottom: 5px;
}

.field-help {
  margin-bottom: 12px;
}

.emoji-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.emoji-choice {
  display: grid;
  place-items: center;

  width: 43px;
  height: 43px;

  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 5px;
  font-size: 22px;
}

.emoji-choice:hover,
.emoji-choice--selected {
  border-color: var(--accent);
}

.emoji-choice--selected {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.more-emoji {
  min-height: 43px;
  padding: 0 13px;

  color: var(--ink);
  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 5px;

  font-size: 12px;
  font-weight: 700;
}

.more-emoji:hover {
  background: var(--card);
}

/* === BUTTONS === */

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  margin-top: 25px;
  padding-top: 17px;
  border-top: 1px dashed var(--border);
}

.form-button {
  min-height: 42px;
  padding: 9px 17px;

  border: 1px solid var(--border);
  border-radius: 5px;

  font-size: 13px;
  font-weight: 700;
}

.form-button--cancel {
  color: var(--ink);
  background: transparent;
}

.form-button--save {
  color: var(--accent-text);
  background: var(--accent);
  border-color: var(--accent);
}

.form-button:hover {
  filter: brightness(1.08);
}

.form-error {
  margin-top: 18px;
  color: #c04d49;
  font-size: 13px;
  font-weight: 700;
}

/* === MOBILE === */

@media (max-width: 600px) {
  .wish-form {
    padding: 17px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-button {
    flex: 1;
  }
}
</style>
