function elMaker(type, className, text) {
    const el = document.createElement(type)
    if (className) { el.classList.add(className) }
    if (text !== undefined) { el.textContent = text }
    return el
}

const typeTraductions = {
    normal: 'Normal',
    fighting: 'Combat',
    flying: 'Vol',
    poison: 'Poison',
    ground: 'Sol',
    rock: 'Roche',
    bug: 'Insecte',
    ghost: 'Spectre',
    steel: 'Acier',
    fire: 'Feu',
    water: 'Eau',
    grass: 'Plante',
    electric: 'Électrik',
    psychic: 'Psy',
    ice: 'Glace',
    dragon: 'Dragon',
    dark: 'Ténèbres',
    fairy: 'Fée'
}

const typesColor = {
    normal: "#a8a878",
    fire: "#f08030",
    water: "#6890f0",
    grass: "#78c850",
    electric: "#f8d030",
    ice: "#98d8d8",
    fighting: "#c03028",
    poison: "#a040a0",
    ground: "#e0c068",
    flying: "#a890f0",
    psychic: "#f85888",
    bug: "#a8b820",
    rock: "#b8a038",
    ghost: "#705898",
    dragon: "#7038f8",
    dark: "#705848",
    steel: "#b8b8d0",
    fairy: "#ee99ac"
}

const statsTraductions = {
    hp: 'PV',
    attack: 'Attaque',
    defense: 'Défense',
    'special-attack': 'Attaque Spé.',
    'special-defense': 'Défense Spé.',
    speed: 'Vitesse'
}

let currentPageUrl = 'https://pokeapi.co/api/v2/pokemon?limit=20&offset=0';
let nextUrl = null;
let prevUrl = null;

async function fetchApi(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Impossible de charger la liste');

        const data = await response.json();

        nextUrl = data.next;
        prevUrl = data.previous;

        document.querySelector('.previous').disabled = !prevUrl;
        document.querySelector('.next').disabled = !nextUrl;

        document.getElementById('pokedex-container').innerHTML = '';

        for (const pokemon of data.results) {
            await getPokemonDetails(pokemon.url);
        }

    } catch (error) {
        console.error("Erreur de chargement :", error.message);
    }
}

function configurationPagination() {
    const btnPrev = document.querySelector('.previous');
    const btnNext = document.querySelector('.next');

    btnPrev.addEventListener('click', () => {
        if (prevUrl) {
            fetchApi(prevUrl);
        }
    });

    btnNext.addEventListener('click', () => {
        if (nextUrl) {
            fetchApi(nextUrl);
        }
    });
}

async function getPokemonDetails(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Erreur détails');
        const data = await response.json();

        const speciesResponse = await fetch(data.species.url);
        const speciesData = await speciesResponse.json();

        const frenchNameObj = speciesData.names.find(nameObj => nameObj.language.name === 'fr');

        data.french_name = frenchNameObj ? frenchNameObj.name : data.name;

        creerCartePokemon(data);
    } catch (error) {
        console.error(error);
    }
}

function couleurStat(valeur) {
    if (valeur < 50) return '#e74c3c';
    if (valeur < 90) return '#f39c12';
    return '#4caf50';
}

function creerBadgesTypes(types) {
    return types.map(t => {
        const nom = typeTraductions[t.type.name] || t.type.name;
        const couleur = typesColor[t.type.name] || '#777';
        return `<span class="type-badge" style="background-color: ${couleur}">${nom}</span>`;
    }).join('');
}

function creerCartePokemon(data) {
    const container = document.getElementById('pokedex-container');
    const card = document.createElement('div');
    card.className = 'pokemon-card';

    const badgesTypes = creerBadgesTypes(data.types);

    card.innerHTML = `
        <h2 class="poke-name">#${data.id} - ${data.french_name}</h2>
        <img class="poke-img" src="${data.sprites.front_default}" alt="${data.french_name}">
        <div class="poke-types">${badgesTypes}</div>
    `;

    card.addEventListener('mouseenter', () => afficherPopover(data));
    card.addEventListener('mouseleave', masquerPopover);

    container.appendChild(card);
}

function afficherPopover(data) {
    const popover = document.getElementById('pokemon-popover');
    const popoverBody = document.getElementById('popover-body');

    const badgesTypes = creerBadgesTypes(data.types);

    const hauteur = data.height / 10;
    const poids = data.weight / 10;

    const statsHtml = data.stats.map(s => {
        const nomStat = statsTraductions[s.stat.name] || s.stat.name;
        const pourcentage = Math.min(100, Math.round((s.base_stat / 255) * 100));
        const couleur = couleurStat(s.base_stat);
        return `
            <li class="stat-line">
                <span class="stat-name">${nomStat}</span>
                <div class="stat-bar"><div class="stat-bar-fill" style="width: ${pourcentage}%; background-color: ${couleur}"></div></div>
                <span class="stat-value">${s.base_stat}</span>
            </li>
        `;
    }).join('');

    popoverBody.innerHTML = `
        <h2>#${data.id} - ${data.french_name.toUpperCase()}</h2>

        <img class="popover-img" src="${data.sprites.other['official-artwork'].front_default || data.sprites.front_default}" alt="${data.french_name}">

        <div class="popover-info">
            <p><strong>Type(s) :</strong></p>
            <div class="popover-types">${badgesTypes}</div>
            <p><strong>Taille :</strong> ${hauteur} m</p>
            <p><strong>Poids :</strong> ${poids} kg</p>
        </div>

        <h3>Statistiques de base</h3>
        <ul class="stats-list">
            ${statsHtml}
        </ul>
    `;

    popover.classList.remove('hidden');
}

function masquerPopover() {
    document.getElementById('pokemon-popover').classList.add('hidden');
}

function searchInputText() {
    const inputText = document.querySelector('.searchInput')

    inputText.addEventListener('keydown', async (e) => {
        if (e.key !== 'Enter') return

        const recherche = inputText.value.trim().toLowerCase()

        if (recherche === '') {
            fetchApi(currentPageUrl)
            return
        }

        try {
            const url = `https://pokeapi.co/api/v2/pokemon/${recherche}`
            const response = await fetch(url)

            if (!response.ok) throw new Error('Pokémon introuvable')

            document.getElementById('pokedex-container').innerHTML = ''
            await getPokemonDetails(url)

        } catch (error) {
            document.getElementById('pokedex-container').innerHTML =
                `<p>Aucun Pokémon trouvé pour « ${recherche} »</p>`
        }
    })
}

configurationPagination()
searchInputText()
fetchApi(currentPageUrl)