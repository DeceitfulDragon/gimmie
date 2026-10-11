<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'

import NewWishlistForm from '@/components/NewWishlistForm.vue'
import { useWishlistStore } from '@/stores/wishlists'
import { getTabTextColor } from '@/utils/listColors'

import type { NewWishlist } from '@/stores/wishlists'

/* === THEME === */

type Theme = 'light' | 'dark'

const THEME_KEY = 'gimmie-theme'

function loadTheme(): Theme {
    try {
        return localStorage.getItem(THEME_KEY) === 'dark'
            ? 'dark'
            : 'light'
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

        const themeColor = document.querySelector<HTMLMetaElement>(
            'meta[name="theme-color"]'
        )

        if (themeColor) {
            themeColor.content =
                value === 'dark' ? '#142238' : '#dbe1e4'
        }

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

const listCount = computed(() => {
    return String(wishlists.value.length).padStart(2, '0')
})

const pageNumber = computed(() => {
    const index = wishlists.value.findIndex(
        (list) => list.id === activeList.value?.id
    )

    return String(index + 1).padStart(2, '0')
})

function createList(input: NewWishlist) {
    wishlistStore.createList(input)
    showNewList.value = false
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

                <button type="button" class="theme-toggle" :aria-pressed="theme === 'dark'" :aria-label="theme === 'light'
                        ? 'Switch to After Hours'
                        : 'Switch to Daytime'
                    " @click="toggleTheme">
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
                        <div class="paper-note-title">
                            NOTE TO SELF
                        </div>

                        <p>{{ currentNote }}</p>
                    </aside>
                </section>

                <section class="collection">
                    <div class="collection-label">
                        <span>MY LISTS / {{ listCount }}</span>

                        <button type="button" class="theme-toggle" :aria-expanded="showNewList" :aria-controls="showNewList ? 'new-wishlist-form' : undefined
                            " @click="showNewList = !showNewList">
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
                            }" :aria-pressed="activeList.id === list.id" @click="wishlistStore.selectList(list.id)">
                                <span aria-hidden="true">
                                    {{ list.icon }}
                                </span>

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

                                <span class="page-number">
                                    PAGE {{ pageNumber }}
                                </span>
                            </div>

                            <div class="page-meta">
                                <span>
                                    <strong>{{ activeList.items.length }}</strong>
                                    things on this list
                                </span>

                                <span>{{ activeList.name }}</span>
                            </div>

                            <div v-if="activeList.items.length > 0" class="wish-grid">
                                <article v-for="wish in activeList.items" :key="wish.id" class="wish-card">
                                    <div class="wish-art" :class="`wish-art--${wish.color}`">
                                        <span class="wish-illustration" aria-hidden="true">
                                            {{ wish.icon }}
                                        </span>

                                        <span class="wish-sticker">
                                            {{ wish.sticker }}
                                        </span>
                                    </div>

                                    <div class="wish-details">
                                        <h3>{{ wish.name }}</h3>

                                        <p class="wish-description">
                                            {{ wish.description }}
                                        </p>

                                        <div class="wish-price">
                                            {{ wish.price }}
                                        </div>
                                    </div>
                                </article>
                            </div>

                            <div v-else class="list-empty">
                                <span class="overline">EMPTY PAGE</span>
                                <h3>Nothing here yet.</h3>
                                <p>This page is waiting for its first wish.</p>
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
</style>