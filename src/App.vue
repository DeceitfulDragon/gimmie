<script setup lang="ts">
import { computed, ref, watch } from 'vue'

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
    'Save the link this time.',
    'Still thinking on it.',
    'That can stay on the list.',
    'One thing at a time.'
]

const currentNote = notes[Math.floor(Math.random() * notes.length)]!

/* === WISHLISTS === */

type WishColor = 'blue' | 'gold' | 'peach' | 'mint' | 'lilac'
type TabTone = 'blue' | 'gold' | 'rust'

interface Wish {
    id: string
    name: string
    description: string
    price: string
    sticker: string
    icon: string
    color: WishColor
}

interface Wishlist {
    id: string
    tabName: string
    tabIcon: string
    tabTone: TabTone
    title: string
    description: string
    pageNumber: string
    items: Wish[]
}

const wishlists = ref<Wishlist[]>([])

/* === ACTIVE LIST === */

const activeListId = ref<string | null>(null)

const activeList = computed<Wishlist | null>(() => {
    return (
        wishlists.value.find((list) => list.id === activeListId.value) ??
        wishlists.value[0] ??
        null
    )
})

const listCount = computed(() => {
    return String(wishlists.value.length).padStart(2, '0')
})

function selectList(id: string) {
    activeListId.value = id
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
                        <small v-if="wishlists.length > 0">Pick a list</small>
                    </div>

                    <template v-if="activeList">
                        <nav class="list-tabs" aria-label="Wishlists">
                            <button v-for="list in wishlists" :key="list.id" type="button" class="list-tab"
                                :class="`list-tab--${list.tabTone}`" :aria-pressed="activeList.id === list.id"
                                @click="selectList(list.id)">
                                <span aria-hidden="true">
                                    {{ list.tabIcon }}
                                </span>

                                {{ list.tabName }}
                            </button>
                        </nav>

                        <div class="notebook-page">
                            <div class="page-heading">
                                <div>
                                    <span class="overline">MY WISHLIST</span>

                                    <h2>{{ activeList.title }}</h2>
                                    <p>{{ activeList.description }}</p>
                                </div>

                                <span class="page-number">
                                    PAGE {{ activeList.pageNumber }}
                                </span>
                            </div>

                            <div class="page-meta">
                                <span>
                                    <strong>{{ activeList.items.length }}</strong>
                                    things on this list
                                </span>

                                <span>{{ activeList.tabName }}</span>
                            </div>

                            <div class="wish-grid">
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

                            <p>
                                Fresh notebook, empty pages.
                                List making is coming soon.
                            </p>
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