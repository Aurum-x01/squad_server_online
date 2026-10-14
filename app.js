const list = document.getElementById("server")
const stats = document.getElementById("stats")

let all = []
const state = { q: "", mode: "all", sort: "players" }

function render() {
    const q = state.q.toLowerCase()

    const items = all
        .filter(s => state.mode === "all" || s.attributes.details?.gameMode === state.mode)
        .filter(s => {
            const a = s.attributes
            return a.name.toLowerCase().includes(q) || (a.details?.map || "").toLowerCase().includes(q)
        })
        .sort((a, b) => {
            if (state.sort === "rank") return a.attributes.rank - b.attributes.rank
            if (state.sort === "queue") return (b.attributes.details?.squad_publicQueue || 0) - (a.attributes.details?.squad_publicQueue || 0)
            return b.attributes.players - a.attributes.players
        })

    if (!items.length) return message(list, "Нічого не знайдено. Спробуйте інший запит або режим.")

    list.replaceChildren(...items.map(s => buildRow(s)))
}

function updateStats() {
    const players = all.reduce((sum, s) => sum + s.attributes.players, 0)
    stats.replaceChildren(
        el("b", "", all.length), " серверів, ",
        el("b", "", players.toLocaleString("uk-UA")), " гравців на фронті"
    )
}

// інша вкладка змінила улюблені: перемальовуємо зірочки
function onFavChanged() {
    if (all.length) render()
}

async function load() {
    message(list, "Завантаження списку серверів…")
    try {
        all = await fetchServers()
        updateStats()
        render()
    } catch (err) {
        stats.textContent = "Немає звʼязку"
        message(list, "Не вдалося отримати сервери. Перевірте інтернет або CORS у консолі (F12).", true)
        console.error(err)
    }
}

document.getElementById("search").addEventListener("input", e => {
    state.q = e.target.value.trim()
    render()
})

document.getElementById("sort").addEventListener("change", e => {
    state.sort = e.target.value
    render()
})

document.getElementById("modes").addEventListener("click", e => {
    const btn = e.target.closest(".chip")
    if (!btn) return
    document.querySelectorAll(".chip").forEach(c => c.classList.toggle("active", c === btn))
    state.mode = btn.dataset.mode
    render()
})

load()
