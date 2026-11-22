<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import EmojiPicker from './EmojiPicker.vue'

import {
    DEFAULT_LIST_COLOR,
    LIST_COLORS,
    getTabTextColor
} from '@/utils/listColors'

import type { NewWishlist } from '@/stores/wishlists'

/* === PROPS === */

defineProps<{
    dark: boolean
}>()

const emit = defineEmits<{
    (e: 'create', list: NewWishlist): void
    (e: 'cancel'): void
}>()

/* === FORM === */

const nameInput = ref<HTMLInputElement | null>(null)

const name = ref('')
const description = ref('')
const icon = ref('📌')
const color = ref(DEFAULT_LIST_COLOR)

const showEmojiPicker = ref(false)

const quickEmojis = [
    '📌', '🎮', '🎁', '🎂', '📚', '🏠', '🎨', '🎵', '✈️', '☕'
]

const tabTextColor = computed(() => getTabTextColor(color.value))

function chooseEmoji(value: string) {
    icon.value = value
    showEmojiPicker.value = false
}

function onEscape() {
    if (showEmojiPicker.value) {
        showEmojiPicker.value = false
        return
    }

    emit('cancel')
}

function submit() {
    if (!name.value.trim()) {
        return
    }

    emit('create', {
        name: name.value,
        description: description.value,
        icon: icon.value,
        color: color.value
    })
}

onMounted(() => {
    nameInput.value?.focus()
})
</script>

<template>
    <form id="new-wishlist-form" class="new-list" @submit.prevent="submit" @keydown.esc.stop="onEscape">
        <div class="form-header">
            <div>
                <span class="form-label">NEW LIST</span>
                <h3>Make a list</h3>
            </div>

            <button type="button" class="close-button" aria-label="Cancel" @click="emit('cancel')">
                ✕
            </button>
        </div>

        <div class="form-fields">
            <div class="field">
                <label for="list-name">Name</label>

                <input id="list-name" ref="nameInput" v-model="name" type="text" maxlength="60"
                    placeholder="Birthday ideas" required />
            </div>

            <div class="field">
                <label for="list-description">
                    Description <span>(optional)</span>
                </label>

                <input id="list-description" v-model="description" type="text" maxlength="160"
                    placeholder="What's this list for?" />
            </div>
        </div>

        <fieldset class="emoji-field">
            <legend>Icon</legend>

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

            <p class="selected-emoji">
                Selected: <span>{{ icon }}</span>
            </p>
        </fieldset>

        <fieldset class="color-field">
            <legend>Tab color</legend>

            <div class="color-options">
                <button v-for="option in LIST_COLORS" :key="option.value" type="button" class="color-choice"
                    :class="{ 'color-choice--selected': color === option.value }"
                    :style="{ backgroundColor: option.value }" :aria-label="option.name"
                    :aria-pressed="color === option.value" :title="option.name" @click="color = option.value"></button>
            </div>

            <div class="custom-color">
                <label for="custom-list-color">Custom color</label>

                <input id="custom-list-color" v-model="color" type="color" />

                <span class="color-code">{{ color.toUpperCase() }}</span>
            </div>
        </fieldset>

        <div class="tab-preview">
            <span>Preview</span>

            <div class="preview-tab" :style="{
                backgroundColor: color,
                color: tabTextColor
            }">
                <span>{{ icon }}</span>
                {{ name.trim() || 'My list' }}
            </div>
        </div>

        <div class="form-actions">
            <button type="button" class="form-button form-button--cancel" @click="emit('cancel')">
                Cancel
            </button>

            <button type="submit" class="form-button form-button--save">
                Create list
            </button>
        </div>
    </form>
</template>

<style scoped>
/* === FORM === */

.new-list {
    margin: 0 0 24px;
    padding: 25px;

    background: var(--paper);
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

.form-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 19px;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.field label,
.emoji-field legend,
.color-field legend {
    font-size: 13px;
    font-weight: 700;
}

.field label span {
    color: var(--muted);
    font-weight: 400;
}

.field input {
    width: 100%;
    min-height: 44px;
    padding: 10px 12px;

    color: var(--ink);
    background: var(--card);

    border: 1px solid var(--border);
    border-radius: 4px;
}

.field input:focus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}

/* === EMOJI === */

.emoji-field,
.color-field {
    margin: 23px 0 0;
    padding: 0;
    border: 0;
}

.emoji-field legend,
.color-field legend {
    margin-bottom: 12px;
}

.emoji-options {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
}

.emoji-choice {
    display: grid;
    place-items: center;

    width: 43px;
    height: 43px;

    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 5px;

    font-size: 22px;
}

.emoji-choice:hover,
.emoji-choice--selected {
    border-color: var(--accent);
    background: var(--paper);
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

.selected-emoji {
    margin-top: 12px;

    color: var(--muted);
    font-size: 12px;
}

.selected-emoji span {
    margin-left: 5px;
    font-size: 20px;
    vertical-align: middle;
}

/* === COLORS === */

.color-options {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.color-choice {
    width: 31px;
    height: 31px;

    border: 2px solid var(--paper);
    border-radius: 5px;
}

.color-choice:hover {
    transform: translateY(-2px);
}

.color-choice--selected {
    outline: 2px solid var(--ink);
    outline-offset: 2px;
}

.custom-color {
    display: flex;
    align-items: center;
    gap: 12px;

    margin-top: 18px;
}

.custom-color label {
    font-size: 12px;
    font-weight: 700;
}

.custom-color input {
    width: 45px;
    height: 33px;
    padding: 2px;

    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 4px;

    cursor: pointer;
}

.color-code {
    color: var(--muted);
    font-family: monospace;
    font-size: 12px;
}

/* === PREVIEW === */

.tab-preview {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;

    margin-top: 25px;
    padding-top: 20px;

    border-top: 1px dashed var(--border);
}

.tab-preview>span {
    color: var(--muted);
    font-size: 12px;
}

.preview-tab {
    display: inline-flex;
    align-items: center;
    gap: 9px;

    max-width: 100%;
    padding: 12px 17px;

    border-radius: 9px 9px 0 0;

    font-size: 13px;
    font-weight: 800;

    overflow-wrap: anywhere;
}

.preview-tab span {
    font-size: 17px;
}

/* === BUTTONS === */

.form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;

    margin-top: 27px;
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

/* === MOBILE === */

@media (max-width: 600px) {
    .new-list {
        padding: 19px;
    }

    .form-fields {
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