"use strict";


/* =========================================================
   CATEGORY INFORMATION
========================================================= */

const CATEGORIES = {

    memories: {
        title: "Memories",

        description:
            "Create games about meaningful memories and important moments.",

        examples: [
            ["Wedding photo", "Our wedding day"],
            ["Family vacation", "Summer at Lake Tahoe"],
            ["Birthday party", "Mom's 70th birthday"]
        ]
    },


    places: {
        title: "Places",

        description:
            "Create games about familiar homes, trips, neighborhoods, and locations.",

        examples: [
            ["Photo of house", "Our old home"],
            ["Beach photo", "Santa Cruz"],
            ["Restaurant photo", "Our favorite restaurant"]
        ]
    },


    people: {
        title: "People",

        description:
            "Create games about family members, friends, names, and relationships.",

        examples: [
            ["Photo of Grandma", "Grandma"],
            ["Photo of David", "My son"],
            ["Photo of Anna", "My granddaughter"]
        ]
    },


    favorites: {
        title: "Favorites",

        description:
            "Create games about favorite foods, music, hobbies, and activities.",

        examples: [
            ["Gardening", "Favorite hobby"],
            ["Noodles", "Favorite food"],
            ["Piano", "Favorite instrument"]
        ]
    },


    other: {
        title: "Other",

        description:
            "Create games about anything else you would like to remember or practice.",

        examples: [
            ["Blue", "Favorite color"],
            ["Golden Retriever", "Dog breed"],
            ["July 15", "Birthday"]
        ]
    }

};



/* =========================================================
   URL HELPERS
========================================================= */

function getParams() {
    return new URLSearchParams(
        window.location.search
    );
}


function getCategoryFromUrl() {

    const category =
        getParams().get("category");

    if (CATEGORIES[category]) {
        return category;
    }

    return "other";
}


function getGameIdFromUrl() {
    return getParams().get("game");
}



/* =========================================================
   STORAGE
========================================================= */

function categoryStorageKey(category) {
    return `memoryMatch-category-${category}`;
}


function loadCategoryGames(category) {

    try {

        const raw =
            localStorage.getItem(
                categoryStorageKey(category)
            );

        if (!raw) {
            return [];
        }

        const games =
            JSON.parse(raw);

        if (!Array.isArray(games)) {
            return [];
        }

        return games;

    } catch (error) {

        console.error(
            "Could not load games:",
            error
        );

        return [];
    }
}


function saveCategoryGames(
    category,
    games
) {

    localStorage.setItem(
        categoryStorageKey(category),
        JSON.stringify(games)
    );
}



/* =========================================================
   MATCHING PAIRS
========================================================= */

function blankPairs() {

    return Array.from(
        { length: 6 },

        (_, index) => ({

            id: index,

            first: {
                text: "",
                image: ""
            },

            match: {
                text: "",
                image: ""
            }

        })
    );
}


function createGameObject(name = "Untitled Game") {

    return {

        id:
            `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 8)}`,

        name,

        pairs: blankPairs(),

        createdAt:
            Date.now(),

        updatedAt:
            Date.now()
    };
}



/* =========================================================
   GENERAL HELPERS
========================================================= */

function escapeHtml(value) {

    return String(value)

        .replaceAll("&", "&amp;")

        .replaceAll("<", "&lt;")

        .replaceAll(">", "&gt;")

        .replaceAll('"', "&quot;")

        .replaceAll("'", "&#039;");
}


function shuffle(items) {

    const copy = [...items];

    for (
        let i = copy.length - 1;
        i > 0;
        i -= 1
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );

        [
            copy[i],
            copy[j]
        ] = [
            copy[j],
            copy[i]
        ];
    }

    return copy;
}



/* =========================================================
   PHOTO RESIZING
========================================================= */

function resizeImage(file) {

    return new Promise(
        (resolve, reject) => {

            if (
                !file ||
                !file.type.startsWith("image/")
            ) {

                reject(
                    new Error(
                        "Please choose an image file."
                    )
                );

                return;
            }


            const reader =
                new FileReader();


            reader.onload = () => {

                const image =
                    new Image();


                image.onload = () => {

                    const maxSide = 900;


                    const scale =
                        Math.min(
                            1,

                            maxSide /
                            Math.max(
                                image.width,
                                image.height
                            )
                        );


                    const width =
                        Math.max(
                            1,

                            Math.round(
                                image.width *
                                scale
                            )
                        );


                    const height =
                        Math.max(
                            1,

                            Math.round(
                                image.height *
                                scale
                            )
                        );


                    const canvas =
                        document.createElement(
                            "canvas"
                        );


                    canvas.width = width;
                    canvas.height = height;


                    const context =
                        canvas.getContext(
                            "2d"
                        );


                    context.drawImage(
                        image,
                        0,
                        0,
                        width,
                        height
                    );


                    resolve(
                        canvas.toDataURL(
                            "image/jpeg",
                            0.78
                        )
                    );
                };


                image.onerror = () => {

                    reject(
                        new Error(
                            "That image could not be opened."
                        )
                    );
                };


                image.src =
                    reader.result;
            };


            reader.onerror = () => {

                reject(
                    new Error(
                        "That image could not be read."
                    )
                );
            };


            reader.readAsDataURL(file);
        }
    );
}



/* =========================================================
   CATEGORY SETUP PAGE
========================================================= */

function initCategorySetupPage() {

    const root =
        document.querySelector(
            "[data-category-setup-page]"
        );


    if (!root) {
        return;
    }


    const category =
        getCategoryFromUrl();


    const info =
        CATEGORIES[category];


    const title =
        root.querySelector(
            "[data-category-title]"
        );


    const description =
        root.querySelector(
            "[data-category-description]"
        );


    const exampleContainer =
        root.querySelector(
            "[data-category-examples]"
        );


    const gamesContainer =
        root.querySelector(
            "[data-saved-games]"
        );


    const noGames =
        root.querySelector(
            "[data-no-games]"
        );


    title.textContent =
        info.title;


    description.textContent =
        info.description;


    exampleContainer.innerHTML =
        info.examples

            .map(
                ([first, match], index) => `
                    <div class="mm-example">

                        <span>
                            Example ${index + 1}
                        </span>

                        <strong>
                            ${escapeHtml(first)}
                            ↕
                            ${escapeHtml(match)}
                        </strong>

                    </div>
                `
            )

            .join("");


    function renderGames() {

        const games =
            loadCategoryGames(category);


        gamesContainer.innerHTML = "";


        noGames.hidden =
            games.length !== 0;


        games.forEach(
            (game) => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "mm-saved-game-card";


                const completePairs =
                    game.pairs.filter(
                        pair =>
                            (
                                pair.first.text ||
                                pair.first.image
                            ) &&
                            (
                                pair.match.text ||
                                pair.match.image
                            )
                    ).length;


                card.innerHTML = `

                    <div class="mm-document-icon">
                        ▤
                    </div>

                    <h3>
                        ${escapeHtml(game.name)}
                    </h3>

                    <p>
                        ${completePairs} of 6 pairs
                    </p>

                    <div class="mm-game-card-actions">

                        <a
                            class="mm-button mm-button-primary"
                            href="edit-game.html?category=${category}&game=${game.id}"
                        >
                            Edit
                        </a>

                        <button
                            class="mm-button mm-delete-game"
                            type="button"
                            data-delete-game="${game.id}"
                        >
                            Delete
                        </button>

                    </div>
                `;


                gamesContainer.appendChild(
                    card
                );
            }
        );
    }


    root
        .querySelector(
            "[data-create-game]"
        )
        .addEventListener(
            "click",
            () => {

                const name =
                    window.prompt(
                        "Name this game:"
                    );


                if (
                    name === null
                ) {
                    return;
                }


                const finalName =
                    name.trim() ||
                    "Untitled Game";


                const games =
                    loadCategoryGames(
                        category
                    );


                const game =
                    createGameObject(
                        finalName
                    );


                games.push(game);


                saveCategoryGames(
                    category,
                    games
                );


                window.location.href =
                    `edit-game.html?category=${category}&game=${game.id}`;
            }
        );


    root.addEventListener(
        "click",
        event => {

            const button =
                event.target.closest(
                    "[data-delete-game]"
                );


            if (!button) {
                return;
            }


            const gameId =
                button.dataset.deleteGame;


            const confirmed =
                window.confirm(
                    "Delete this game?"
                );


            if (!confirmed) {
                return;
            }


            const games =
                loadCategoryGames(category)
                    .filter(
                        game =>
                            game.id !== gameId
                    );


            saveCategoryGames(
                category,
                games
            );


            renderGames();
        }
    );


    renderGames();
}



/* =========================================================
   EDITOR CARD
========================================================= */

function makeEditorCard(
    pairIndex,
    side,
    item
) {

    const sideName =
        side === "first"
            ? "First item"
            : "Matching item";


    const imageMarkup =
        item.image

            ? `
                <img
                    src="${item.image}"
                    alt="${sideName} photo"
                >
            `

            : `
                <div class="mm-photo-placeholder">
                    Add an optional photo
                </div>
            `;


    return `

        <article
            class="mm-editor-card"
            data-pair-index="${pairIndex}"
            data-side="${side}"
        >

            <span class="mm-card-number">
                ${pairIndex + 1}
            </span>


            <div
                class="mm-photo-preview"
                data-preview
            >
                ${imageMarkup}
            </div>


            <textarea
                class="mm-text-input"
                rows="2"
                maxlength="160"
                placeholder="Type the ${sideName.toLowerCase()} here"
                data-text-input
            >${escapeHtml(item.text)}</textarea>


            <div class="mm-photo-controls">

                <label class="mm-file-label">

                    Add photo

                    <input
                        type="file"
                        accept="image/*"
                        data-image-input
                    >

                </label>


                <button
                    class="mm-remove-photo"
                    type="button"
                    data-remove-image
                >
                    Remove
                </button>

            </div>

        </article>
    `;
}



/* =========================================================
   SETUP ARROWS
========================================================= */

function drawSetupArrows(board) {

    const svg =
        board.querySelector(
            ".mm-arrow-layer"
        );


    if (!svg) {
        return;
    }


    const firstCards = [
        ...board.querySelectorAll(
            '.mm-editor-card[data-side="first"]'
        )
    ];


    const matchCards = [
        ...board.querySelectorAll(
            '.mm-editor-card[data-side="match"]'
        )
    ];


    const boardRect =
        board.getBoundingClientRect();


    svg.setAttribute(
        "viewBox",
        `0 0 ${boardRect.width} ${boardRect.height}`
    );


    svg.innerHTML = `
        <defs>

            <marker
                id="mmArrowHead"
                markerWidth="8"
                markerHeight="8"
                refX="6.5"
                refY="3.5"
                orient="auto"
            >

                <path
                    d="M0,0 L0,7 L7,3.5 z"
                    fill="rgba(29,29,31,0.52)"
                ></path>

            </marker>

        </defs>
    `;


    firstCards.forEach(
        (firstCard, index) => {

            const matchingCard =
                matchCards[index];


            if (!matchingCard) {
                return;
            }


            const firstRect =
                firstCard.getBoundingClientRect();


            const matchRect =
                matchingCard.getBoundingClientRect();


            const x1 =
                firstRect.left -
                boardRect.left +
                firstRect.width / 2;


            const y1 =
                firstRect.bottom -
                boardRect.top +
                10;


            const x2 =
                matchRect.left -
                boardRect.left +
                matchRect.width / 2;


            const y2 =
                matchRect.top -
                boardRect.top -
                12;


            const line =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );


            line.setAttribute(
                "x1",
                x1
            );


            line.setAttribute(
                "y1",
                y1
            );


            line.setAttribute(
                "x2",
                x2
            );


            line.setAttribute(
                "y2",
                y2
            );


            line.setAttribute(
                "stroke",
                "rgba(29,29,31,0.42)"
            );


            line.setAttribute(
                "stroke-width",
                "2.5"
            );


            line.setAttribute(
                "stroke-linecap",
                "round"
            );


            line.setAttribute(
                "marker-end",
                "url(#mmArrowHead)"
            );


            svg.appendChild(line);
        }
    );
}



/* =========================================================
   GAME EDITOR
========================================================= */

function initGameEditor() {

    const root =
        document.querySelector(
            "[data-game-editor]"
        );


    if (!root) {
        return;
    }


    const category =
        getCategoryFromUrl();


    const gameId =
        getGameIdFromUrl();


    let games =
        loadCategoryGames(category);


    let game =
        games.find(
            item =>
                item.id === gameId
        );


    if (!game) {

        game =
            createGameObject();


        games.push(game);


        saveCategoryGames(
            category,
            games
        );
    }


    if (
        !Array.isArray(game.pairs)
    ) {
        game.pairs =
            blankPairs();
    }


    while (
        game.pairs.length < 6
    ) {

        game.pairs.push(
            blankPairs()[
                game.pairs.length
            ]
        );
    }


    const backUrl =
        `category.html?category=${category}`;


    root
        .querySelector(
            "[data-editor-back]"
        )
        .href =
            backUrl;


    root
        .querySelector(
            "[data-bottom-back]"
        )
        .href =
            backUrl;


    const nameInput =
        root.querySelector(
            "[data-game-name]"
        );


    nameInput.value =
        game.name;


    const exampleContainer =
        root.querySelector(
            "[data-editor-examples]"
        );


    exampleContainer.innerHTML =
        CATEGORIES[category]
            .examples

            .map(
                ([first, match], index) => `

                    <div class="mm-example">

                        <span>
                            Example ${index + 1}
                        </span>

                        <strong>
                            ${escapeHtml(first)}
                            ↕
                            ${escapeHtml(match)}
                        </strong>

                    </div>
                `
            )

            .join("");


    const firstRow =
        root.querySelector(
            "[data-first-row]"
        );


    const matchRow =
        root.querySelector(
            "[data-match-row]"
        );


    const board =
        root.querySelector(
            "[data-pair-board]"
        );


    const status =
        root.querySelector(
            "[data-status]"
        );


    function render() {

        firstRow.innerHTML =
            game.pairs

                .map(
                    (pair, index) =>
                        makeEditorCard(
                            index,
                            "first",
                            pair.first
                        )
                )

                .join("");


        matchRow.innerHTML =
            game.pairs

                .map(
                    (pair, index) =>
                        makeEditorCard(
                            index,
                            "match",
                            pair.match
                        )
                )

                .join("");


        requestAnimationFrame(
            () =>
                drawSetupArrows(
                    board
                )
        );
    }


    root.addEventListener(
        "input",
        event => {

            const textInput =
                event.target.closest(
                    "[data-text-input]"
                );


            if (textInput) {

                const card =
                    textInput.closest(
                        ".mm-editor-card"
                    );


                const index =
                    Number(
                        card.dataset.pairIndex
                    );


                const side =
                    card.dataset.side;


                game.pairs[index][side].text =
                    textInput.value;
            }


            if (
                event.target ===
                nameInput
            ) {

                game.name =
                    nameInput.value;
            }
        }
    );


    root.addEventListener(
        "change",
        async event => {

            const input =
                event.target.closest(
                    "[data-image-input]"
                );


            if (
                !input ||
                !input.files?.[0]
            ) {
                return;
            }


            const card =
                input.closest(
                    ".mm-editor-card"
                );


            const index =
                Number(
                    card.dataset.pairIndex
                );


            const side =
                card.dataset.side;


            try {

                const image =
                    await resizeImage(
                        input.files[0]
                    );


                game.pairs[index][side].image =
                    image;


                card
                    .querySelector(
                        "[data-preview]"
                    )
                    .innerHTML = `

                        <img
                            src="${image}"
                            alt="Selected photo"
                        >
                    `;


                status.textContent =
                    "Photo added. Press Save Game when you are finished.";

            } catch (error) {

                window.alert(
                    error.message
                );
            }


            input.value = "";
        }
    );


    root.addEventListener(
        "click",
        event => {

            const remove =
                event.target.closest(
                    "[data-remove-image]"
                );


            if (remove) {

                const card =
                    remove.closest(
                        ".mm-editor-card"
                    );


                const index =
                    Number(
                        card.dataset.pairIndex
                    );


                const side =
                    card.dataset.side;


                game.pairs[index][side].image =
                    "";


                card
                    .querySelector(
                        "[data-preview]"
                    )
                    .innerHTML = `

                        <div class="mm-photo-placeholder">
                            Add an optional photo
                        </div>
                    `;


                status.textContent =
                    "Photo removed. Press Save Game to keep the change.";

                return;
            }


            if (
                event.target.closest(
                    "[data-save-game]"
                )
            ) {

                game.name =
                    nameInput.value.trim() ||
                    "Untitled Game";


                game.updatedAt =
                    Date.now();


                games =
                    loadCategoryGames(
                        category
                    );


                const index =
                    games.findIndex(
                        item =>
                            item.id === game.id
                    );


                if (index >= 0) {

                    games[index] =
                        game;

                } else {

                    games.push(game);
                }


                try {

                    saveCategoryGames(
                        category,
                        games
                    );


                    status.textContent =
                        "Game saved successfully.";

                } catch (error) {

                    console.error(error);


                    status.textContent =
                        "The game could not be saved. Try using smaller photos.";
                }


                return;
            }


            if (
                event.target.closest(
                    "[data-clear-game]"
                )
            ) {

                const confirmed =
                    window.confirm(
                        "Clear all six matching pairs?"
                    );


                if (!confirmed) {
                    return;
                }


                game.pairs =
                    blankPairs();


                render();


                status.textContent =
                    "All matching pairs were cleared. Press Save Game to keep the change.";
            }
        }
    );


    window.addEventListener(
        "resize",
        () =>
            drawSetupArrows(
                board
            )
    );


    render();
}



/* =========================================================
   PLAY CATEGORY PAGE
========================================================= */

function initPlayCategoryPage() {

    const root =
        document.querySelector(
            "[data-play-category-page]"
        );


    if (!root) {
        return;
    }


    const category =
        getCategoryFromUrl();


    root
        .querySelector(
            "[data-category-title]"
        )
        .textContent =
            CATEGORIES[category].title;


    const container =
        root.querySelector(
            "[data-play-games]"
        );


    const empty =
        root.querySelector(
            "[data-no-play-games]"
        );


    const games =
        loadCategoryGames(category);


    empty.hidden =
        games.length > 0;


    container.innerHTML =
        games

            .map(
                game => {

                    const count =
                        game.pairs.filter(
                            pair =>
                                (
                                    pair.first.text ||
                                    pair.first.image
                                ) &&
                                (
                                    pair.match.text ||
                                    pair.match.image
                                )
                        ).length;


                    return `

                        <article class="mm-saved-game-card">

                            <div class="mm-document-icon">
                                ▤
                            </div>

                            <h3>
                                ${escapeHtml(game.name)}
                            </h3>

                            <p>
                                ${count} matching pairs
                            </p>

                            <a
                                class="mm-button mm-button-primary"
                                href="game.html?category=${category}&game=${game.id}"
                            >
                                Play
                            </a>

                        </article>
                    `;
                }
            )

            .join("");
}



/* =========================================================
   PLAY CARD
========================================================= */

function makePlayCard(
    item,
    rowName,
    index
) {

    const text =
        item.text.trim() ||
        "Photo";


    const imageMarkup =
        item.image

            ? `
                <div class="mm-play-image">

                    <img
                        src="${item.image}"
                        alt=""
                    >

                </div>
            `

            : "";


    return `

        <button
            type="button"
            class="mm-play-card"
            data-play-card
            data-row="${rowName}"
            data-card-key="${rowName}-${index}"
            data-pair-id="${item.pairId}"
        >

            ${imageMarkup}

            <span class="mm-play-text">
                ${escapeHtml(text)}
            </span>

        </button>
    `;
}



/* =========================================================
   DRAW PLAYER LINES
========================================================= */

function drawMatchLines(
    board,
    choices,
    showResults = false
) {

    const svg =
        board.querySelector(
            ".mm-line-layer"
        );


    if (!svg) {
        return;
    }


    const rect =
        board.getBoundingClientRect();


    svg.setAttribute(
        "viewBox",
        `0 0 ${rect.width} ${rect.height}`
    );


    svg.innerHTML = "";


    choices.forEach(
        choice => {

            const first =
                board.querySelector(
                    `[data-card-key="${choice.firstKey}"]`
                );


            const match =
                board.querySelector(
                    `[data-card-key="${choice.matchKey}"]`
                );


            if (
                !first ||
                !match
            ) {
                return;
            }


            const firstRect =
                first.getBoundingClientRect();


            const matchRect =
                match.getBoundingClientRect();


            const x1 =
                firstRect.left -
                rect.left +
                firstRect.width / 2;


            const y1 =
                firstRect.bottom -
                rect.top;


            const x2 =
                matchRect.left -
                rect.left +
                matchRect.width / 2;


            const y2 =
                matchRect.top -
                rect.top;


            const correct =
                choice.firstPairId ===
                choice.matchPairId;


            const color =
                showResults

                    ? (
                        correct
                            ? "#248a3d"
                            : "#d70015"
                    )

                    : "rgba(0,113,227,0.68)";


            const middleY =
                (y1 + y2) / 2;


            const path =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );


            path.setAttribute(
                "d",

                `M ${x1} ${y1}
                 C ${x1} ${middleY},
                   ${x2} ${middleY},
                   ${x2} ${y2}`
            );


            path.setAttribute(
                "fill",
                "none"
            );


            path.setAttribute(
                "stroke",
                color
            );


            path.setAttribute(
                "stroke-width",
                "4"
            );


            path.setAttribute(
                "stroke-linecap",
                "round"
            );


            svg.appendChild(path);
        }
    );
}



/* =========================================================
   ACTUAL GAME
========================================================= */

function initGamePage() {

    const root =
        document.querySelector(
            "[data-game-page]"
        );


    if (!root) {
        return;
    }


    const category =
        getCategoryFromUrl();


    const gameId =
        getGameIdFromUrl();


    const games =
        loadCategoryGames(category);


    const game =
        games.find(
            item =>
                item.id === gameId
        );


    const categoryBack =
        `play-category.html?category=${category}`;


    root
        .querySelector(
            "[data-game-back]"
        )
        .href =
            categoryBack;


    root
        .querySelector(
            "[data-results-back]"
        )
        .href =
            categoryBack;


    if (!game) {

        root
            .querySelector(
                "[data-game-area]"
            )
            .hidden =
                true;


        root
            .querySelector(
                "[data-empty-game]"
            )
            .hidden =
                false;


        return;
    }


    root
        .querySelector(
            "[data-game-title]"
        )
        .textContent =
            game.name;


    const validPairs =
        game.pairs.filter(
            pair =>
                (
                    pair.first.text ||
                    pair.first.image
                ) &&
                (
                    pair.match.text ||
                    pair.match.image
                )
        );


    if (
        validPairs.length === 0
    ) {

        root
            .querySelector(
                "[data-game-area]"
            )
            .hidden =
                true;


        root
            .querySelector(
                "[data-empty-game]"
            )
            .hidden =
                false;


        return;
    }


    const firstItems =
        shuffle(
            validPairs.map(
                pair => ({
                    ...pair.first,
                    pairId: pair.id
                })
            )
        );


    const matchingItems =
        shuffle(
            validPairs.map(
                pair => ({
                    ...pair.match,
                    pairId: pair.id
                })
            )
        );


    const firstRow =
        root.querySelector(
            "[data-play-first-row]"
        );


    const matchRow =
        root.querySelector(
            "[data-play-match-row]"
        );


    firstRow.innerHTML =
        firstItems

            .map(
                (item, index) =>
                    makePlayCard(
                        item,
                        "first",
                        index
                    )
            )

            .join("");


    matchRow.innerHTML =
        matchingItems

            .map(
                (item, index) =>
                    makePlayCard(
                        item,
                        "match",
                        index
                    )
            )

            .join("");


    const board =
        root.querySelector(
            "[data-game-board]"
        );


    const progress =
        root.querySelector(
            "[data-progress]"
        );


    const results =
        root.querySelector(
            "[data-results]"
        );


    const score =
        root.querySelector(
            "[data-score]"
        );


    const resultList =
        root.querySelector(
            "[data-result-list]"
        );


    let selectedFirst = null;
    let selectedMatch = null;

    const choices = [];


    function updateProgress() {

        progress.textContent =
            `${choices.length} of ${validPairs.length} matches selected`;
    }


    function makeChoice() {

        if (
            !selectedFirst ||
            !selectedMatch
        ) {
            return;
        }


        const choice = {

            firstKey:
                selectedFirst.dataset.cardKey,

            matchKey:
                selectedMatch.dataset.cardKey,

            firstPairId:
                Number(
                    selectedFirst.dataset.pairId
                ),

            matchPairId:
                Number(
                    selectedMatch.dataset.pairId
                ),

            firstText:
                selectedFirst
                    .querySelector(
                        ".mm-play-text"
                    )
                    .textContent,

            matchText:
                selectedMatch
                    .querySelector(
                        ".mm-play-text"
                    )
                    .textContent
        };


        selectedFirst.classList.remove(
            "is-selected"
        );


        selectedMatch.classList.remove(
            "is-selected"
        );


        selectedFirst.classList.add(
            "is-used"
        );


        selectedMatch.classList.add(
            "is-used"
        );


        selectedFirst.disabled =
            true;


        selectedMatch.disabled =
            true;


        choices.push(choice);


        selectedFirst = null;
        selectedMatch = null;


        updateProgress();


        drawMatchLines(
            board,
            choices
        );


        if (
            choices.length ===
            validPairs.length
        ) {

            showResults();
        }
    }


    function showResults() {

        const correct =
            choices.filter(
                choice =>
                    choice.firstPairId ===
                    choice.matchPairId
            ).length;


        choices.forEach(
            choice => {

                const isCorrect =
                    choice.firstPairId ===
                    choice.matchPairId;


                const first =
                    board.querySelector(
                        `[data-card-key="${choice.firstKey}"]`
                    );


                const match =
                    board.querySelector(
                        `[data-card-key="${choice.matchKey}"]`
                    );


                first.classList.add(
                    isCorrect
                        ? "is-correct"
                        : "is-wrong"
                );


                match.classList.add(
                    isCorrect
                        ? "is-correct"
                        : "is-wrong"
                );
            }
        );


        drawMatchLines(
            board,
            choices,
            true
        );


        score.textContent =
            `You matched ${correct} out of ${validPairs.length} correctly.`;


        resultList.innerHTML =
            choices

                .map(
                    choice => {

                        const isCorrect =
                            choice.firstPairId ===
                            choice.matchPairId;


                        return `

                            <li
                                class="mm-result-item ${
                                    isCorrect
                                        ? "correct"
                                        : "wrong"
                                }"
                            >

                                <strong>
                                    ${
                                        isCorrect
                                            ? "✓"
                                            : "✕"
                                    }
                                    ${escapeHtml(choice.firstText)}
                                </strong>

                                matched with

                                <strong>
                                    ${escapeHtml(choice.matchText)}
                                </strong>

                            </li>
                        `;
                    }
                )

                .join("");


        results.hidden =
            false;


        results.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }


    root.addEventListener(
        "click",
        event => {

            const card =
                event.target.closest(
                    "[data-play-card]"
                );


            if (
                card &&
                !card.disabled
            ) {

                if (
                    card.dataset.row ===
                    "first"
                ) {

                    selectedFirst
                        ?.classList
                        .remove(
                            "is-selected"
                        );


                    selectedFirst =
                        card;


                    card.classList.add(
                        "is-selected"
                    );

                } else {

                    selectedMatch
                        ?.classList
                        .remove(
                            "is-selected"
                        );


                    selectedMatch =
                        card;


                    card.classList.add(
                        "is-selected"
                    );
                }


                makeChoice();
            }


            if (
                event.target.closest(
                    "[data-try-again]"
                )
            ) {

                window.location.reload();
            }
        }
    );


    window.addEventListener(
        "resize",
        () =>
            drawMatchLines(
                board,
                choices,
                !results.hidden
            )
    );


    updateProgress();
}



/* =========================================================
   START EVERYTHING
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initCategorySetupPage();

        initGameEditor();

        initPlayCategoryPage();

        initGamePage();
    }
);
