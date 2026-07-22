/*
    MEMORY MATCH

    SETUP:
    Each column is one correct matching pair.

    PLAY:
    The top and bottom rows are shuffled separately.
    The player selects one item from each row.
    Correct matches stay connected with a line.
*/

const NUMBER_OF_PAIRS = 6;

let currentLevel = "";
let selectedTopCard = null;
let selectedBottomCard = null;
let matchedPairs = [];
let temporaryLine = null;

/* =====================================================
   GENERAL HELPERS
===================================================== */

function getStorageKey(level) {
    return `memory-match-${level}-pairs`;
}

function itemHasContent(item) {
    if (!item) {
        return false;
    }

    const hasText =
        typeof item.text === "string" &&
        item.text.trim() !== "";

    const hasImage =
        typeof item.image === "string" &&
        item.image !== "";

    return hasText || hasImage;
}

function shuffleArray(items) {
    const shuffled = [...items];

    for (let i = shuffled.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));

        [shuffled[i], shuffled[randomIndex]] =
            [shuffled[randomIndex], shuffled[i]];
    }

    return shuffled;
}

/* =====================================================
   COLLAPSIBLE SETUP INSTRUCTIONS
===================================================== */

function toggleInstructions() {
    const instructions =
        document.getElementById("setup-instructions");

    const button =
        document.getElementById("instructions-button");

    if (!instructions || !button) {
        return;
    }

    const isOpen =
        instructions.classList.toggle("open");

    button.setAttribute(
        "aria-expanded",
        String(isOpen)
    );

    button.textContent = isOpen
        ? "Hide setup instructions"
        : "How to create matching pairs";
}

/* =====================================================
   PHOTO UPLOAD AND COMPRESSION
===================================================== */

function choosePhoto(position, side) {
    const input =
        document.getElementById(`${side}-photo-input-${position}`);

    if (input) {
        input.click();
    }
}

async function handlePhotoSelection(position, side, input) {
    const file = input.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        alert("Please choose an image file.");
        input.value = "";
        return;
    }

    try {
        const compressedImage =
            await resizeAndCompressImage(file);

        setCardImage(
            position,
            side,
            compressedImage
        );
    } catch (error) {
        console.error(error);

        alert(
            "The photo could not be added. Please try another image."
        );
    }

    input.value = "";
}

function resizeAndCompressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = function () {
            const image = new Image();

            image.onload = function () {
                const maximumSize = 700;

                let width = image.width;
                let height = image.height;

                if (width > height && width > maximumSize) {
                    height = Math.round(
                        height * maximumSize / width
                    );

                    width = maximumSize;
                } else if (
                    height >= width &&
                    height > maximumSize
                ) {
                    width = Math.round(
                        width * maximumSize / height
                    );

                    height = maximumSize;
                }

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

                const compressedData =
                    canvas.toDataURL(
                        "image/jpeg",
                        0.72
                    );

                resolve(compressedData);
            };

            image.onerror = reject;
            image.src = reader.result;
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function setCardImage(position, side, imageData) {
    const preview =
        document.getElementById(
            `${side}-preview-${position}`
        );

    const placeholder =
        document.getElementById(
            `${side}-placeholder-${position}`
        );

    const removeButton =
        document.getElementById(
            `${side}-remove-${position}`
        );

    const hiddenImage =
        document.getElementById(
            `${side}-image-${position}`
        );

    if (
        !preview ||
        !placeholder ||
        !removeButton ||
        !hiddenImage
    ) {
        return;
    }

    hiddenImage.value = imageData;

    preview.src = imageData;
    preview.hidden = false;

    placeholder.hidden = true;
    removeButton.hidden = false;
}

function removePhoto(position, side) {
    const preview =
        document.getElementById(
            `${side}-preview-${position}`
        );

    const placeholder =
        document.getElementById(
            `${side}-placeholder-${position}`
        );

    const removeButton =
        document.getElementById(
            `${side}-remove-${position}`
        );

    const hiddenImage =
        document.getElementById(
            `${side}-image-${position}`
        );

    const fileInput =
        document.getElementById(
            `${side}-photo-input-${position}`
        );

    if (preview) {
        preview.src = "";
        preview.hidden = true;
    }

    if (placeholder) {
        placeholder.hidden = false;
    }

    if (removeButton) {
        removeButton.hidden = true;
    }

    if (hiddenImage) {
        hiddenImage.value = "";
    }

    if (fileInput) {
        fileInput.value = "";
    }
}

/* =====================================================
   SETUP PAGE
===================================================== */

function loadMatchingGameSetup(level) {
    currentLevel = level;

    const savedData =
        localStorage.getItem(getStorageKey(level));

    if (!savedData) {
        return;
    }

    try {
        const pairs = JSON.parse(savedData);

        pairs.forEach((pair, index) => {
            const position = index + 1;

            loadSetupItem(
                position,
                "top",
                pair.top
            );

            loadSetupItem(
                position,
                "bottom",
                pair.bottom
            );
        });
    } catch (error) {
        console.error(
            "Could not load saved setup:",
            error
        );
    }
}

function loadSetupItem(position, side, item) {
    if (!item) {
        return;
    }

    const textInput =
        document.getElementById(
            `${side}-text-${position}`
        );

    if (textInput) {
        textInput.value = item.text || "";
    }

    if (item.image) {
        setCardImage(
            position,
            side,
            item.image
        );
    }
}

function readSetupItem(position, side) {
    const textInput =
        document.getElementById(
            `${side}-text-${position}`
        );

    const hiddenImage =
        document.getElementById(
            `${side}-image-${position}`
        );

    return {
        text: textInput
            ? textInput.value.trim()
            : "",

        image: hiddenImage
            ? hiddenImage.value
            : ""
    };
}

function saveMatchingGame(level) {
    const pairs = [];

    for (
        let position = 1;
        position <= NUMBER_OF_PAIRS;
        position++
    ) {
        pairs.push({
            id: position,

            top: readSetupItem(
                position,
                "top"
            ),

            bottom: readSetupItem(
                position,
                "bottom"
            )
        });
    }

    const incompletePairs =
        pairs.filter((pair) => {
            const topHasContent =
                itemHasContent(pair.top);

            const bottomHasContent =
                itemHasContent(pair.bottom);

            return topHasContent !== bottomHasContent;
        });

    if (incompletePairs.length > 0) {
        const continueSaving = confirm(
            "Some columns contain only one item. " +
            "Those incomplete pairs will not appear in the game. " +
            "Would you still like to save?"
        );

        if (!continueSaving) {
            return;
        }
    }

    try {
        localStorage.setItem(
            getStorageKey(level),
            JSON.stringify(pairs)
        );

        showSaveMessage(
            "Your matching game has been saved.",
            "success"
        );
    } catch (error) {
        console.error(error);

        showSaveMessage(
            "The game could not be saved. " +
            "The photos may be using too much browser storage. " +
            "Try removing one or more photos.",
            "error"
        );
    }
}

function clearMatchingGame(level) {
    const confirmed = confirm(
        "Clear all text and photos from this level?"
    );

    if (!confirmed) {
        return;
    }

    for (
        let position = 1;
        position <= NUMBER_OF_PAIRS;
        position++
    ) {
        ["top", "bottom"].forEach((side) => {
            const textInput =
                document.getElementById(
                    `${side}-text-${position}`
                );

            if (textInput) {
                textInput.value = "";
            }

            removePhoto(position, side);
        });
    }

    localStorage.removeItem(
        getStorageKey(level)
    );

    showSaveMessage(
        "This level has been cleared.",
        "success"
    );
}

function showSaveMessage(message, type) {
    const messageElement =
        document.getElementById("save-message");

    if (!messageElement) {
        return;
    }

    messageElement.textContent = message;
    messageElement.className =
        `save-message ${type}`;

    window.clearTimeout(
        messageElement.hideTimer
    );

    messageElement.hideTimer =
        window.setTimeout(() => {
            messageElement.textContent = "";
            messageElement.className =
                "save-message";
        }, 4000);
}

/* =====================================================
   PLAY PAGE
===================================================== */

function loadMatchingGame(level) {
    currentLevel = level;

    const topRow =
        document.getElementById("top-card-row");

    const bottomRow =
        document.getElementById("bottom-card-row");

    const emptyMessage =
        document.getElementById(
            "empty-game-message"
        );

    const gameBoard =
        document.getElementById("game-board");

    if (!topRow || !bottomRow) {
        return;
    }

    topRow.innerHTML = "";
    bottomRow.innerHTML = "";

    selectedTopCard = null;
    selectedBottomCard = null;
    matchedPairs = [];

    clearAllLines();

    const savedData =
        localStorage.getItem(
            getStorageKey(level)
        );

    if (!savedData) {
        showEmptyGame(
            emptyMessage,
            gameBoard
        );

        return;
    }

    let savedPairs;

    try {
        savedPairs = JSON.parse(savedData);
    } catch (error) {
        showEmptyGame(
            emptyMessage,
            gameBoard
        );

        return;
    }

    const completePairs =
        savedPairs.filter((pair) => {
            return (
                itemHasContent(pair.top) &&
                itemHasContent(pair.bottom)
            );
        });

    if (completePairs.length === 0) {
        showEmptyGame(
            emptyMessage,
            gameBoard
        );

        return;
    }

    if (emptyMessage) {
        emptyMessage.hidden = true;
    }

    if (gameBoard) {
        gameBoard.hidden = false;
    }

    const shuffledTop =
        shuffleArray(completePairs);

    const shuffledBottom =
        shuffleArray(completePairs);

    shuffledTop.forEach((pair) => {
        topRow.appendChild(
            createGameCard(
                pair.top,
                pair.id,
                "top"
            )
        );
    });

    shuffledBottom.forEach((pair) => {
        bottomRow.appendChild(
            createGameCard(
                pair.bottom,
                pair.id,
                "bottom"
            )
        );
    });

    updateProgress();

    requestAnimationFrame(
        redrawAllLines
    );
}

function showEmptyGame(emptyMessage, gameBoard) {
    if (gameBoard) {
        gameBoard.hidden = true;
    }

    if (emptyMessage) {
        emptyMessage.hidden = false;

        emptyMessage.textContent =
            "This level has not been set up yet. " +
            "Go to Setup and add at least one complete matching pair.";
    }

    const progress =
        document.getElementById("game-progress");

    if (progress) {
        progress.textContent = "";
    }
}

function createGameCard(item, pairId, side) {
    const card =
        document.createElement("button");

    card.type = "button";
    card.className =
        `match-card ${side}-card`;

    card.dataset.pairId =
        String(pairId);

    card.dataset.side = side;

    if (item.image) {
        const image =
            document.createElement("img");

        image.className =
            "game-card-image";

        image.src = item.image;
        image.alt =
            item.text ||
            "Matching item photo";

        image.addEventListener(
            "load",
            redrawAllLines
        );

        card.appendChild(image);
    }

    if (item.text) {
        const text =
            document.createElement("span");

        text.className =
            "game-card-text";

        text.textContent = item.text;

        card.appendChild(text);
    }

    card.addEventListener("click", () => {
        selectCard(card);
    });

    return card;
}

function selectCard(card) {
    if (
        card.classList.contains("matched") ||
        card.disabled
    ) {
        return;
    }

    const side = card.dataset.side;

    if (side === "top") {
        if (
            selectedTopCard &&
            selectedTopCard !== card
        ) {
            selectedTopCard.classList.remove(
                "selected"
            );
        }

        selectedTopCard = card;
    } else {
        if (
            selectedBottomCard &&
            selectedBottomCard !== card
        ) {
            selectedBottomCard.classList.remove(
                "selected"
            );
        }

        selectedBottomCard = card;
    }

    card.classList.add("selected");

    if (
        selectedTopCard &&
        selectedBottomCard
    ) {
        checkSelectedPair();
    }
}

function checkSelectedPair() {
    const topPairId =
        selectedTopCard.dataset.pairId;

    const bottomPairId =
        selectedBottomCard.dataset.pairId;

    if (topPairId === bottomPairId) {
        handleCorrectMatch(
            selectedTopCard,
            selectedBottomCard,
            topPairId
        );
    } else {
        handleIncorrectMatch(
            selectedTopCard,
            selectedBottomCard
        );
    }
}

function handleCorrectMatch(
    topCard,
    bottomCard,
    pairId
) {
    topCard.classList.remove("selected");
    bottomCard.classList.remove("selected");

    topCard.classList.add("matched");
    bottomCard.classList.add("matched");

    topCard.disabled = true;
    bottomCard.disabled = true;

    matchedPairs.push({
        pairId,
        topCard,
        bottomCard
    });

    selectedTopCard = null;
    selectedBottomCard = null;

    drawLineBetweenCards(
        topCard,
        bottomCard,
        "correct-line",
        pairId
    );

    showFeedback(
        "Correct match!",
        "correct"
    );

    updateProgress();

    const totalCards =
        document.querySelectorAll(
            ".top-card"
        ).length;

    if (
        matchedPairs.length === totalCards
    ) {
        window.setTimeout(
            showCompletionMessage,
            500
        );
    }
}

function handleIncorrectMatch(
    topCard,
    bottomCard
) {
    topCard.classList.add("incorrect");
    bottomCard.classList.add("incorrect");

    temporaryLine =
        drawLineBetweenCards(
            topCard,
            bottomCard,
            "incorrect-line",
            "temporary"
        );

    showFeedback(
        "Those items do not match. Try again.",
        "incorrect"
    );

    window.setTimeout(() => {
        topCard.classList.remove(
            "selected",
            "incorrect"
        );

        bottomCard.classList.remove(
            "selected",
            "incorrect"
        );

        if (temporaryLine) {
            temporaryLine.remove();
            temporaryLine = null;
        }

        selectedTopCard = null;
        selectedBottomCard = null;
    }, 1000);
}

/* =====================================================
   CONNECTION LINES
===================================================== */

function drawLineBetweenCards(
    topCard,
    bottomCard,
    lineClass,
    lineId
) {
    const svg =
        document.getElementById(
            "connection-lines"
        );

    const board =
        document.getElementById(
            "game-board"
        );

    if (!svg || !board) {
        return null;
    }

    const boardRect =
        board.getBoundingClientRect();

    const topRect =
        topCard.getBoundingClientRect();

    const bottomRect =
        bottomCard.getBoundingClientRect();

    const startX =
        topRect.left +
        topRect.width / 2 -
        boardRect.left;

    const startY =
        topRect.bottom -
        boardRect.top;

    const endX =
        bottomRect.left +
        bottomRect.width / 2 -
        boardRect.left;

    const endY =
        bottomRect.top -
        boardRect.top;

    const line =
        document.createElementNS(
            "http://www.w3.org/2000/svg",
            "line"
        );

    line.setAttribute("x1", startX);
    line.setAttribute("y1", startY);
    line.setAttribute("x2", endX);
    line.setAttribute("y2", endY);

    line.setAttribute(
        "class",
        lineClass
    );

    line.dataset.lineId =
        String(lineId);

    svg.appendChild(line);

    return line;
}

function clearAllLines() {
    const svg =
        document.getElementById(
            "connection-lines"
        );

    if (svg) {
        svg.innerHTML = "";
    }
}

function redrawAllLines() {
    clearAllLines();

    matchedPairs.forEach((match) => {
        drawLineBetweenCards(
            match.topCard,
            match.bottomCard,
            "correct-line",
            match.pairId
        );
    });
}

/* =====================================================
   FEEDBACK AND COMPLETION
===================================================== */

function updateProgress() {
    const progress =
        document.getElementById(
            "game-progress"
        );

    const total =
        document.querySelectorAll(
            ".top-card"
        ).length;

    if (!progress) {
        return;
    }

    progress.textContent =
        `${matchedPairs.length} of ${total} matches completed`;
}

function showFeedback(message, type) {
    const feedback =
        document.getElementById(
            "game-feedback"
        );

    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.className =
        `game-feedback ${type}`;

    window.clearTimeout(
        feedback.hideTimer
    );

    feedback.hideTimer =
        window.setTimeout(() => {
            feedback.textContent = "";
            feedback.className =
                "game-feedback";
        }, 1800);
}

function showCompletionMessage() {
    const completionBox =
        document.getElementById(
            "completion-box"
        );

    if (completionBox) {
        completionBox.hidden = false;
    }

    showFeedback(
        "You matched them all!",
        "correct"
    );
}

function restartMatchingGame() {
    const completionBox =
        document.getElementById(
            "completion-box"
        );

    if (completionBox) {
        completionBox.hidden = true;
    }

    loadMatchingGame(currentLevel);
}

window.addEventListener(
    "resize",
    redrawAllLines
);
