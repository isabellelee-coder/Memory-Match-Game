"use strict";

const LEVEL_INFO = {
    gentle: {
        title: "Gentle",
        examples: [
            ["Photo of Grandma", "Grandma"],
            ["Photo of Dad", "My son, David"],
            ["Photo of Anna", "My granddaughter"]
        ]
    },

    guided: {
        title: "Guided",
        examples: [
            ["Family vacation", "Lake Tahoe"],
            ["Wedding photo", "Our wedding day"],
            ["Old family home", "San Jose"]
        ]
    },

    challenge: {
        title: "Challenge",
        examples: [
            ["Grandpa", "Loves gardening"],
            ["Maria", "Enjoys singing"],
            ["Robert", "Favorite food is noodles"]
        ]
    }
};

function storageKey(level) {
    return `memoryMatch-${level}`;
}

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

function loadPairs(level) {
    try {
        const raw = localStorage.getItem(storageKey(level));

        if (!raw) {
            return blankPairs();
        }

        const parsed = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
            return blankPairs();
        }

        return blankPairs().map((fallback, index) => {
            const saved = parsed[index] || {};

            return {
                id: index,

                first: {
                    text: saved.first?.text || "",
                    image: saved.first?.image || ""
                },

                match: {
                    text: saved.match?.text || "",
                    image: saved.match?.image || ""
                }
            };
        });
    } catch (error) {
        console.error(
            "Could not load saved game:",
            error
        );

        return blankPairs();
    }
}

function savePairs(level, pairs) {
    localStorage.setItem(
        storageKey(level),
        JSON.stringify(pairs)
    );
}

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
        const j = Math.floor(
            Math.random() * (i + 1)
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

function resizeImage(file) {
    return new Promise((resolve, reject) => {
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

        const reader = new FileReader();

        reader.onload = () => {
            const image = new Image();

            image.onload = () => {
                const maxSide = 900;

                const scale = Math.min(
                    1,
                    maxSide /
                    Math.max(
                        image.width,
                        image.height
                    )
                );

                const width = Math.max(
                    1,
                    Math.round(
                        image.width * scale
                    )
                );

                const height = Math.max(
                    1,
                    Math.round(
                        image.height * scale
                    )
                );

                const canvas =
                    document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const context =
                    canvas.getContext("2d");

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

            image.src = reader.result;
        };

        reader.onerror = () => {
            reject(
                new Error(
                    "That image could not be read."
                )
            );
        };

        reader.readAsDataURL(file);
    });
}

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
                    alt="${sideName} photo preview"
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
                aria-label="${sideName} ${pairIndex + 1} text"
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
                    type="button"
                    class="mm-remove-photo"
                    data-remove-image
                >
                    Remove
                </button>

            </div>

        </article>
    `;
}

function drawSetupArrows(board) {
    const svg =
        board.querySelector(".mm-arrow-layer");

    if (!svg) {
        return;
    }

    const topCards = [
        ...board.querySelectorAll(
            '.mm-editor-card[data-side="first"]'
        )
    ];

    const bottomCards = [
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
                    fill="rgba(29,29,31,0.55)"
                ></path>
            </marker>
        </defs>
    `;

    topCards.forEach(
        (topCard, index) => {
            const bottomCard =
                bottomCards[index];

            if (!bottomCard) {
                return;
            }

            const topRect =
                topCard.getBoundingClientRect();

            const bottomRect =
                bottomCard.getBoundingClientRect();

            const x1 =
                topRect.left -
                boardRect.left +
                topRect.width / 2;

            const y1 =
                topRect.bottom -
                boardRect.top +
                8;

            const x2 =
                bottomRect.left -
                boardRect.left +
                bottomRect.width / 2;

            const y2 =
                bottomRect.top -
                boardRect.top -
                8;

            const line =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "line"
                );

            line.setAttribute("x1", x1);
            line.setAttribute("y1", y1);
            line.setAttribute("x2", x2);
            line.setAttribute("y2", y2);

            line.setAttribute(
                "stroke",
                "rgba(29,29,31,0.45)"
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

function initEditor() {
    const root =
        document.querySelector(
            "[data-editor-level]"
        );

    if (!root) {
        return;
    }

    const level =
        root.dataset.editorLevel;

    let pairs =
        loadPairs(level);

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
            pairs
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
            pairs
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
            () => drawSetupArrows(board)
        );
    }

    root.addEventListener(
        "input",
        (event) => {
            const input =
                event.target.closest(
                    "[data-text-input]"
                );

            if (!input) {
                return;
            }

            const card =
                input.closest(
                    ".mm-editor-card"
                );

            const pairIndex =
                Number(
                    card.dataset.pairIndex
                );

            const side =
                card.dataset.side;

            pairs[pairIndex][side].text =
                input.value;
        }
    );

    root.addEventListener(
        "change",
        async (event) => {
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

            const pairIndex =
                Number(
                    card.dataset.pairIndex
                );

            const side =
                card.dataset.side;

            try {
                const imageData =
                    await resizeImage(
                        input.files[0]
                    );

                pairs[pairIndex][side].image =
                    imageData;

                const preview =
                    card.querySelector(
                        "[data-preview]"
                    );

                preview.innerHTML = `
                    <img
                        src="${imageData}"
                        alt="Selected photo preview"
                    >
                `;

                status.textContent =
                    "Photo added. Press Save Game when you are finished.";
            } catch (error) {
                window.alert(error.message);
            }

            input.value = "";
        }
    );

    root.addEventListener(
        "click",
        (event) => {
            const removeButton =
                event.target.closest(
                    "[data-remove-image]"
                );

            if (removeButton) {
                const card =
                    removeButton.closest(
                        ".mm-editor-card"
                    );

                const pairIndex =
                    Number(
                        card.dataset.pairIndex
                    );

                const side =
                    card.dataset.side;

                pairs[pairIndex][side].image =
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
                try {
                    savePairs(
                        level,
                        pairs
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
                        "Clear all six matching pairs for this level?"
                    );

                if (!confirmed) {
                    return;
                }

                pairs = blankPairs();

                savePairs(
                    level,
                    pairs
                );

                render();

                status.textContent =
                    "All matching pairs were cleared.";
            }
        }
    );

    window.addEventListener(
        "resize",
        () => drawSetupArrows(board)
    );

    render();
}

function makePlayCard(
    item,
    rowName
) {
    const hasContent =
        item.text.trim() ||
        item.image;

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
            : `
                <div class="mm-play-image">
                    <div class="mm-play-placeholder">
                        ${
                            hasContent
                                ? "No photo"
                                : "Not set up yet"
                        }
                    </div>
                </div>
            `;

    const text =
        item.text.trim() ||
        "Not set up yet";

    return `
        <button
            type="button"
            class="mm-play-card"
            data-play-card
            data-row="${rowName}"
            data-pair-id="${item.pairId}"
            aria-label="${escapeHtml(text)}"
        >
            ${imageMarkup}

            <span class="mm-play-text">
                ${escapeHtml(text)}
            </span>
        </button>
    `;
}

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

    const boardRect =
        board.getBoundingClientRect();

    svg.setAttribute(
        "viewBox",
        `0 0 ${boardRect.width} ${boardRect.height}`
    );

    svg.innerHTML = "";

    choices.forEach(
        (choice) => {
            const topCard =
                board.querySelector(
                    `[data-play-card][data-row="first"][data-card-key="${choice.firstKey}"]`
                );

            const bottomCard =
                board.querySelector(
                    `[data-play-card][data-row="match"][data-card-key="${choice.matchKey}"]`
                );

            if (
                !topCard ||
                !bottomCard
            ) {
                return;
            }

            const topRect =
                topCard.getBoundingClientRect();

            const bottomRect =
                bottomCard.getBoundingClientRect();

            const x1 =
                topRect.left -
                boardRect.left +
                topRect.width / 2;

            const y1 =
                topRect.bottom -
                boardRect.top;

            const x2 =
                bottomRect.left -
                boardRect.left +
                bottomRect.width / 2;

            const y2 =
                bottomRect.top -
                boardRect.top;

            const correct =
                choice.firstPairId ===
                choice.matchPairId;

            const stroke =
                showResults
                    ? (
                        correct
                            ? "#248a3d"
                            : "#d70015"
                    )
                    : "rgba(0, 113, 227, 0.66)";

            const path =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            const middleY =
                (y1 + y2) / 2;

            path.setAttribute(
                "d",
                `
                    M ${x1} ${y1}
                    C ${x1} ${middleY},
                      ${x2} ${middleY},
                      ${x2} ${y2}
                `
            );

            path.setAttribute(
                "fill",
                "none"
            );

            path.setAttribute(
                "stroke",
                stroke
            );

            path.setAttribute(
                "stroke-width",
                "4"
            );

            path.setAttribute(
                "stroke-linecap",
                "round"
            );

            path.setAttribute(
                "opacity",
                "0.92"
            );

            svg.appendChild(path);
        }
    );
}

function initGame() {
    const root =
        document.querySelector(
            "[data-game-level]"
        );

    if (!root) {
        return;
    }

    const level =
        root.dataset.gameLevel;

    const savedPairs =
        loadPairs(level);

    const validPairs =
        savedPairs.filter(
            (pair) =>
                (
                    pair.first.text.trim() ||
                    pair.first.image
                ) &&
                (
                    pair.match.text.trim() ||
                    pair.match.image
                )
        );

    const boardWrap =
        root.querySelector(
            "[data-game-area]"
        );

    const emptyMessage =
        root.querySelector(
            "[data-empty-message]"
        );

    if (validPairs.length === 0) {
        boardWrap.hidden = true;
        emptyMessage.hidden = false;

        return;
    }

    const firstItems =
        shuffle(
            validPairs.map(
                (pair) => ({
                    ...pair.first,
                    pairId: pair.id
                })
            )
        );

    const matchItems =
        shuffle(
            validPairs.map(
                (pair) => ({
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

    const resultList =
        root.querySelector(
            "[data-result-list]"
        );

    const scoreText =
        root.querySelector(
            "[data-score]"
        );

    let selectedFirst = null;
    let selectedMatch = null;
    let choices = [];

    firstRow.innerHTML =
        firstItems
            .map(
                (item, index) => {
                    const markup =
                        makePlayCard(
                            item,
                            "first"
                        );

                    return markup.replace(
                        'data-pair-id="',
                        `data-card-key="first-${index}" data-pair-id="`
                    );
                }
            )
            .join("");

    matchRow.innerHTML =
        matchItems
            .map(
                (item, index) => {
                    const markup =
                        makePlayCard(
                            item,
                            "match"
                        );

                    return markup.replace(
                        'data-pair-id="',
                        `data-card-key="match-${index}" data-pair-id="`
                    );
                }
            )
            .join("");

    function updateProgress() {
        progress.textContent =
            `${choices.length} of ${validPairs.length} matches selected`;
    }

    function clearCurrentSelection() {
        selectedFirst?.classList.remove(
            "is-selected"
        );

        selectedMatch?.classList.remove(
            "is-selected"
        );

        selectedFirst = null;
        selectedMatch = null;
    }

    function completeChoice() {
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

        selectedFirst.classList.add(
            "is-used"
        );

        selectedMatch.classList.add(
            "is-used"
        );

        selectedFirst.disabled = true;
        selectedMatch.disabled = true;

        choices.push(choice);

        clearCurrentSelection();
        updateProgress();

        drawMatchLines(
            board,
            choices,
            false
        );

        if (
            choices.length ===
            validPairs.length
        ) {
            showResults();
        }
    }

    function showResults() {
        const score =
            choices.filter(
                (choice) =>
                    choice.firstPairId ===
                    choice.matchPairId
            ).length;

        choices.forEach(
            (choice) => {
                const correct =
                    choice.firstPairId ===
                    choice.matchPairId;

                const topCard =
                    board.querySelector(
                        `[data-card-key="${choice.firstKey}"]`
                    );

                const bottomCard =
                    board.querySelector(
                        `[data-card-key="${choice.matchKey}"]`
                    );

                topCard.classList.add(
                    correct
                        ? "is-correct"
                        : "is-wrong"
                );

                bottomCard.classList.add(
                    correct
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

        scoreText.textContent =
            `You matched ${score} out of ${validPairs.length} correctly.`;

        resultList.innerHTML =
            choices
                .map(
                    (choice) => {
                        const correct =
                            choice.firstPairId ===
                            choice.matchPairId;

                        const symbol =
                            correct
                                ? "✓"
                                : "✕";

                        return `
                            <li
                                class="mm-result-item ${
                                    correct
                                        ? "correct"
                                        : "wrong"
                                }"
                            >
                                <strong>
                                    ${symbol}
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

        results.hidden = false;

        results.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    root.addEventListener(
        "click",
        (event) => {
            const card =
                event.target.closest(
                    "[data-play-card]"
                );

            if (
                card &&
                !card.disabled
            ) {
                const row =
                    card.dataset.row;

                if (row === "first") {
                    selectedFirst
                        ?.classList
                        .remove(
                            "is-selected"
                        );

                    selectedFirst = card;

                    selectedFirst
                        .classList
                        .add(
                            "is-selected"
                        );
                } else {
                    selectedMatch
                        ?.classList
                        .remove(
                            "is-selected"
                        );

                    selectedMatch = card;

                    selectedMatch
                        .classList
                        .add(
                            "is-selected"
                        );
                }

                completeChoice();

                return;
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
        () => {
            drawMatchLines(
                board,
                choices,
                !results.hidden
            );
        }
    );

    updateProgress();
}

document.addEventListener(
    "DOMContentLoaded",
    () => {
        initEditor();
        initGame();
    }
);
