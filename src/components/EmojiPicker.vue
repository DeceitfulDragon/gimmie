<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'

/* === PROPS === */

const props = defineProps<{
    dark: boolean
}>()

const emit = defineEmits<{
    (e: 'select', emoji: string): void
}>()

/* === PICKER === */

const host = ref<HTMLElement | null>(null)
const loading = ref(true)
const failed = ref(false)

let picker: HTMLElement | null = null

function onEmojiClick(event: Event) {
    const detail = (event as CustomEvent<{ unicode: string }>).detail

    if (detail?.unicode) {
        emit('select', detail.unicode)
    }
}

onMounted(async () => {
    try {
        const { default: Picker } = await import('emoji-picker-element/picker')

        if (!host.value) {
            return
        }

        const element = new Picker()

        element.classList.add(props.dark ? 'dark' : 'light')
        element.addEventListener('emoji-click', onEmojiClick)

        picker = element
        host.value.appendChild(element)
    } catch {
        failed.value = true
    } finally {
        loading.value = false
    }
})

watch(
    () => props.dark,
    (dark) => {
        picker?.classList.toggle('dark', dark)
        picker?.classList.toggle('light', !dark)
    }
)

onUnmounted(() => {
    picker?.removeEventListener('emoji-click', onEmojiClick)
    picker?.remove()
    picker = null
})
</script>

<template>
    <div class="emoji-browser">
        <p v-if="loading" class="picker-message">
            Loading emoji...
        </p>

        <p v-if="failed" class="picker-message">
            Couldn't load the emoji browser. The quick picks still work.
        </p>

        <div ref="host" class="picker-host"></div>
    </div>
</template>

<style scoped>
/* === PICKER === */

.emoji-browser {
    width: min(100%, 390px);
    margin-top: 12px;

    border: 1px solid var(--border);
    border-radius: 5px;

    background: var(--paper);
    overflow: hidden;
}

.picker-host :deep(emoji-picker) {
    display: block;
    width: 100%;
    height: 330px;

    --num-columns: 7;
    --emoji-size: 1.5rem;
    --emoji-padding: 0.45rem;

    --background: var(--paper);
    --border-color: var(--border);
    --button-hover-background: var(--card);
    --button-active-background: var(--card);

    --input-font-color: var(--ink);
    --input-border-color: var(--border);
    --input-placeholder-color: var(--muted);
    --category-font-color: var(--ink);

    --indicator-color: var(--accent);
    --outline-color: var(--accent);
}

.picker-message {
    padding: 15px;

    color: var(--muted);
    font-size: 12px;
}

@media (max-width: 450px) {
    .picker-host :deep(emoji-picker) {
        --num-columns: 6;
        --emoji-padding: 0.3rem;
    }
}
</style>