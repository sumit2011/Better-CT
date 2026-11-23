document
.getElementById("generateBtn")
.addEventListener("click", () => {

    const reportInfo = {

        testCaseName:
            document.getElementById(
                "testCaseName"
            ).value,

        testCaseId:
            document.getElementById(
                "testCaseId"
            ).value,

        module:
            document.getElementById(
                "module"
            ).value,

        environment:
            document.getElementById(
                "environment"
            ).value,

        executedBy:
            document.getElementById(
                "executedBy"
            ).value,

        status:
            document.getElementById(
                "status"
            ).value,

        executionDate:
            new Date()
            .toLocaleString(),

        browser:
            navigator.userAgent
    };

    chrome.storage.local.set(
        { reportInfo },
        () => {

            window.location.href =
                chrome.runtime.getURL(
                    "pdf.html"
                );
        }
    );
});