const API = "https://squadcalc.app/api/get/servers"
const FAV_KEY = "squad:favorites"

function el(tag, cls, text) {
    const node = document.createElement(tag)
    if (cls) node.className = cls
    if (text !== undefined) node.textContent = text
    return node
}

/* ---------- Улюблені в localStorage ---------- */
// Зберігаємо [{ id, name }], щоб показати назву, навіть якщо сервера зараз немає в списку API
const Fav = {
    load() {
        try {
            const data = JSON.parse(localStorage.getItem(FAV_KEY))
            return Array.isArray(data) ? data : []
        } catch {
            return []
        }
    },
    save(list) {
        try {
            localStorage.setItem(FAV_KEY, JSON.stringify(list))
        } catch (err) {
            console.error("Не вдалося зберегти улюблені", err)
        }
    },
    has(id) {
        return this.load().some(f => f.id === id)
    },
    // повертає true, якщо сервер тепер в улюблених
    toggle(id, name) {
        const list = this.load()
        const index = list.findIndex(f => f.id === id)
        if (index >= 0) list.splice(index, 1)
        else list.push({ id, name })
        this.save(list)
        updateFavCount()
        return index < 0
    }
}

function updateFavCount() {
    const badge = document.getElementById("fav-count")
    if (badge) badge.textContent = Fav.load().length || ""
}

// синхронізація між вкладками
window.addEventListener("storage", e => {
    if (e.key === FAV_KEY) {
        updateFavCount()
        if (typeof onFavChanged === "function") onFavChanged()
    }
})

/* ---------- API ---------- */
async function fetchServers() {
    const res = await fetch(API)
    if (!res.ok) throw new Error(res.status)
    const json = await res.json()
    return json.servers || []
}

/* ---------- Рядки ---------- */
function starButton(id, name, onChange) {
    const btn = el("button", "star")
    btn.type = "button"

    const paint = on => {
        btn.textContent = on ? "★" : "☆"
        btn.setAttribute("aria-pressed", on)
        btn.setAttribute("aria-label", on ? "Прибрати з улюблених" : "Додати в улюблені")
    }
    paint(Fav.has(id))

    btn.addEventListener("click", () => {
        const on = Fav.toggle(id, name)
        paint(on)
        btn.classList.remove("pop")
        void btn.offsetWidth
        if (on) btn.classList.add("pop")
        if (onChange) onChange(on)
    })
    return btn
}

function buildRow(s, onChange) {
    const a = s.attributes
    const d = a.details || {}
    const name = a.name.trim()
    const fill = a.maxPlayers ? Math.min(a.players / a.maxPlayers, 1) : 0

    const row = el("article", "row" + (fill >= 0.98 ? " full" : fill >= 0.6 ? " live" : " mid"))
    row.append(
        starButton(String(s.id), name, onChange),
        el("div", "name", name),
        el("div", "map", (d.map || "—").replace(/_v\d+$/i, "").replace(/_/g, " ")),
        el("div", "mode", `${d.gameMode || "—"} · ${a.country || "?"}`)
    )

    const players = el("div", "players")
    const bar = el("div", "bar")
    const fillEl = el("i")
    fillEl.style.setProperty("--fill", fill)
    bar.append(fillEl)
    players.append(el("span", "", `${a.players}/${a.maxPlayers}`), bar)

    const queue = el("div", "queue")
    const qn = d.squad_publicQueue || 0
    if (qn) queue.append("черга ", el("b", "", qn))
    else queue.textContent = "без черги"

    row.append(players, queue)
    return row
}

// сервер збережено, але в поточній відповіді API його немає
function buildMissingRow(fav, onChange) {
    const row = el("article", "row missing")
    row.append(
        starButton(fav.id, fav.name, onChange),
        el("div", "name", fav.name),
        el("div", "map", "офлайн"),
        el("div", "mode", "немає у списку"),
        el("div", "players"),
        el("div", "queue")
    )
    return row
}

function message(container, text, error = false) {
    const box = el("div", "msg" + (error ? " error" : ""), text)
    container.replaceChildren(box)
    return box
}

updateFavCount()
