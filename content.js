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

})();

function captureStep() {

    const toolbar =
        document.getElementById("oracle-toolbar");

    const stepTitle =
        prompt("Enter Step Description");
        

    
    if(stepTitle === null){
        return;
    }

    if(stepTitle.trim() === ""){
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
            toolbar.style.display = "block";
        }, 800);

    }, 300);
}

function generatePdf() {

    chrome.runtime.sendMessage({
        action: "generatePdf"
    });
}

function makeToolbarDraggable(toolbar) {

    const handle =
        toolbar.querySelector("#dragHandle");

    let isDragging = false;

    let offsetX = 0;
    let offsetY = 0;

    handle.addEventListener("mousedown", (e) => {

        isDragging = true;

        offsetX =
            e.clientX -
            toolbar.getBoundingClientRect().left;

        offsetY =
            e.clientY -
            toolbar.getBoundingClientRect().top;

        toolbar.style.right = "auto";

        e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {

        if (!isDragging) {
            return;
        }

        toolbar.style.left =
            (e.clientX - offsetX) + "px";

        toolbar.style.top =
            (e.clientY - offsetY) + "px";
    });

    document.addEventListener("mouseup", () => {

        isDragging = false;
    });
}