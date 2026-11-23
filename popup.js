document
.getElementById("reset")
.addEventListener("click", () => {

    chrome.storage.local.set({
        steps:[]
    });

    alert("Steps Cleared");
});