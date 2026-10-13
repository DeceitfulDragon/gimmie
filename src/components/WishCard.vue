<script setup lang="ts">
import { computed, ref } from 'vue'

import { normalizeWebUrl } from '@/utils/urls'
import type { Wish } from '@/stores/wishlists'

/* === PROPS === */

const props = defineProps<{
  wish: Wish
}>()

const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'remove'): void
}>()

/* === IMAGE === */

const failedImage = ref('')

const imageUrl = computed(() => normalizeWebUrl(props.wish.imageUrl) || '')
const productUrl = computed(() => normalizeWebUrl(props.wish.url) || '')
const showImage = computed(() => !!imageUrl.value && failedImage.value !== imageUrl.value)

/* === DELETE === */

const confirmRemove = ref(false)
</script>

<template>
  <article class="wish-card" @keydown.esc="confirmRemove = false">
    <div class="wish-art" :class="`wish-art--${wish.color}`">
      <img v-if="showImage" class="wish-image" :src="imageUrl" alt="" loading="lazy" decoding="async"
        @error="failedImage = imageUrl" />

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

      <div v-if="wish.price || productUrl" class="wish-footer">
        <span v-if="wish.price" class="wish-price">
          {{ wish.price }}
        </span>

        <a v-if="productUrl" class="wish-link" :href="productUrl" target="_blank" rel="noopener noreferrer">
          View item ↗
        </a>
      </div>

      <div v-if="!confirmRemove" class="card-actions">
        <button type="button" class="card-button" @click="emit('edit')">
          Edit
        </button>

        <button type="button" class="card-button card-button--remove" @click="confirmRemove = true">
          Remove
        </button>
      </div>

      <div v-else class="remove-confirm">
        <p>Remove this item?</p>

        <div class="remove-buttons">
          <button type="button" class="keep-button" @click="confirmRemove = false">
            Keep it
          </button>

          <button type="button" class="delete-button" @click="emit('remove')">
            Remove
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
/* === IMAGE === */

.wish-image {
  position: relative;
  z-index: 1;

  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* === LINKS === */

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

/* === CARD ACTIONS === */

.card-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 14px;

  margin-top: 13px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.card-button {
  padding: 5px 0;

  color: var(--accent);
  background: transparent;
  border: 0;

  font-size: 12px;
  font-weight: 700;
}

.card-button:hover {
  text-decoration: underline;
}

.card-button--remove {
  color: var(--muted);
}

/* === DELETE CONFIRMATION === */

.remove-confirm {
  margin-top: 13px;
  padding: 13px;

  background: var(--paper);
  border: 1px solid var(--border);
  border-radius: 4px;
}

.remove-confirm p {
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 700;
}

.remove-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.remove-buttons button {
  min-height: 35px;
  padding: 7px 12px;

  border: 1px solid var(--border);
  border-radius: 4px;

  font-size: 12px;
  font-weight: 700;
}

.keep-button {
  color: var(--ink);
  background: var(--card);
}

.delete-button {
  color: #ffffff;
  background: #a74949;
  border-color: #a74949 !important;
}

.remove-buttons button:hover {
  filter: brightness(1.08);
}
</style>
