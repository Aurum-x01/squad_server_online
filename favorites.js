const list = document.getElementById("server")
const stats = document.getElementById("stats")

let all = null // null = дані ще не завантажені

function renderEmpty() {
    const box = message(list, "Ще немає улюблених серверів. Натисніть ☆ біля сервера на ")
    const link = el("a", "", "головній сторінці")
    link.href = "index.html"
    box.append(link, ".")
}

function render() {
    const favs = Fav.load()
    if (!favs.length) {
        stats.textContent = "Список порожній"
        return renderEmpty()
    }

    const byId = new Map((all || []).map(s => [String(s.id), s]))
    const rows = []
    let online = 0
    let players = 0

    for (const fav of favs) {
        const server = byId.get(fav.id)
        // при зніманні зірочки прибираємо рядок зі сторінки
        const onChange = on => { if (!on) render() }

        if (server) {
            online++
            players += server.attributes.players
            rows.push(buildRow(server, onChange))
        } else {
            rows.push(buildMissingRow(fav, onChange))
        }
    }

    stats.replaceChildren(
        el("b", "", favs.length), " в улюблених, ",
        el("b", "", online), " онлайн, ",
        el("b", "", players), " гравців"
    )
    list.replaceChildren(...rows)
}

function onFavChanged() {
    render()
}

async function load(first = true) {
    if (first) {
        if (!Fav.load().length) return render()
        message(list, "Завантаження улюблених серверів…")
    }
    try {
        all = await fetchServers()
        render()
    } catch (err) {
        console.error(err)
        if (first) {
            stats.textContent = "Немає звʼязку"
            message(list, "Не вдалося отримати сервери. Перевірте інтернет або CORS у консолі (F12).", true)
        }
    }
}

load()
// оновлюємо онлайн кожні 30 секунд
setInterval(() => load(false), 30000)
