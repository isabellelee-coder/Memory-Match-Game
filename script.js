function loadMatchingGameSetup(level) {
    function createSetupCards() {
    const topRow =
        document.getElementById(
            "top-setup-row"
        );

    const bottomRow =
        document.getElementById(
            "bottom-setup-row"
        );

    if (!topRow || !bottomRow) {
        return;
    }

    topRow.innerHTML = "";
    bottomRow.innerHTML = "";

    for (
        let position = 1;
        position <= NUMBER_OF_PAIRS;
        position++
    ) {
        topRow.appendChild(
            createSetupCard(
                position,
                "top",
                "First item"
            )
        );

        bottomRow.appendChild(
            createSetupCard(
                position,
                "bottom",
                "Matching item"
            )
        );
    }
}

function createSetupCard(
    position,
    side,
    placeholderText
) {
    const card =
        document.createElement("article");

    card.className = "setup-item-card";

    card.innerHTML = `
        <div class="photo-area">
            <img
                id="${side}-preview-${position}"
                class="setup-photo-preview"
                alt="Selected matching item"
                hidden
            >

            <div
                id="${side}-placeholder-${position}"
                class="photo-placeholder"
            >
                <span class="photo-icon">＋</span>
                <span>Add Photo</span>
            </div>

            <input
                id="${side}-photo-input-${position}"
                class="photo-file-input"
                type="file"
                accept="image/*"
                onchange="handlePhotoSelection(
                    ${position},
                    '${side}',
                    this
                )"
            >

            <input
                id="${side}-image-${position}"
                type="hidden"
                value=""
            >
        </div>

        <button
            type="button"
            class="photo-button"
            onclick="choosePhoto(
                ${position},
                '${side}'
            )"
        >
            Add Photo
        </button>

        <button
            id="${side}-remove-${position}"
            type="button"
            class="remove-photo-button"
            onclick="removePhoto(
                ${position},
                '${side}'
            )"
            hidden
        >
            Remove Photo
        </button>

        <textarea
            id="${side}-text-${position}"
            class="setup-text-input"
            placeholder="${placeholderText}"
            aria-label="${placeholderText} ${position}"
        ></textarea>
    `;

    return card;
}
