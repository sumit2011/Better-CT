(function () {

    if (document.getElementById("oracle-toolbar")) {
        return;
    }

    const toolbar = document.createElement("div");

    toolbar.id = "oracle-toolbar";

   toolbar.innerHTML = `
    <div id="dragHandle" title="Move Toolbar">
        ☰
    </div>

    <button
        class="capture-btn"
        title="Capture Screenshot">
        📸
    </button>

    <button
        class="delay-capture-btn"
        title="Capture Screenshot with 3s Delay">
        ⏱️
    </button>

    <button
        class="pdf-btn"
        title="Generate PDF">
        📄
    </button>
    `;

    document.body.appendChild(toolbar);

    makeToolbarDraggable(toolbar);

    toolbar
        .querySelector(".capture-btn")
        .addEventListener("click", captureStep);

    toolbar
        .querySelector(".pdf-btn")
        .addEventListener("click", generatePdf);
    
    toolbar
        .querySelector(".delay-capture-btn")
        .addEventListener("click",captureWithDelay);

})();

function captureStep() {
    const toolbar = document.getElementById("oracle-toolbar");
    const stepTitle = prompt("Enter Step Description");

    if (stepTitle === null || stepTitle.trim() === "") {
        return;
    }

    toolbar.style.display = "none";

    setTimeout(() => {
        chrome.runtime.sendMessage({
            action: "capture",
            title: stepTitle,
            pageTitle: document.title,
            url: location.href
        });

        setTimeout(() => {
            toolbar.style.display = ""; // Restores CSS `display: flex`
        }, 800);
    }, 300);
}

function captureWithDelay() {
    const toolbar = document.getElementById("oracle-toolbar");
    const stepTitle = prompt("Enter Step Description");

    if (stepTitle === null || stepTitle.trim() === "") {
        return;
    }

    toolbar.style.display = "none";

    setTimeout(() => {
        chrome.runtime.sendMessage({
            action: "capture",
            title: stepTitle,
            pageTitle: document.title,
            url: location.href
        });

        toolbar.style.display = ""; // Restores CSS `display: flex`
    }, 3000);
}

function generatePdf() {
    chrome.runtime.sendMessage({
        action: "generatePdf"
    });
}

function makeToolbarDraggable(toolbar) {
    if (!toolbar) return;

    const handle = toolbar.querySelector("#dragHandle");
    if (!handle) return;

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    handle.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;

        const rect = toolbar.getBoundingClientRect();

        toolbar.style.left = `${rect.left}px`;
        toolbar.style.top = `${rect.top}px`;
        toolbar.style.right = "auto";

        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        isDragging = true;

        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
        if (!isDragging) return;

        const maxLeft = Math.max(0, window.innerWidth - toolbar.offsetWidth);
        const maxTop = Math.max(0, window.innerHeight - toolbar.offsetHeight);

        const nextLeft = Math.min(Math.max(0, e.clientX - offsetX), maxLeft);
        const nextTop = Math.min(Math.max(0, e.clientY - offsetY), maxTop);

        toolbar.style.left = `${nextLeft}px`;
        toolbar.style.top = `${nextTop}px`;
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });
}