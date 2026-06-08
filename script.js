function saveData(level) {
    const input = document.getElementById("dataInput");

    localStorage.setItem(level, input.value);

    alert("Saved!");
}

function loadData(level) {
    const display = document.getElementById("savedData");
    const saved = localStorage.getItem(level);

    if (saved && saved.trim() !== "") {
        display.textContent = saved;
    } else {
        display.textContent = "No information has been added yet.";
    }
}

function loadExistingData(level) {
    const input = document.getElementById("dataInput");
    const saved = localStorage.getItem(level);

    if (saved) {
        input.value = saved;
    }
}
