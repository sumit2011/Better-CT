chrome.runtime.onMessage.addListener((request) => {

    if (request.action === "capture") {

        chrome.tabs.captureVisibleTab(
            null,
            {
                format: "jpeg",
                quality: 35
            },
            (image) => {

                chrome.storage.local.get(
                    ["steps"],
                    (result) => {

                        const steps =
                            result.steps || [];

                        steps.push({
                            id: steps.length + 1,
                            title: request.title,
                            pageTitle: request.pageTitle,
                            url: request.url,
                            image,
                            timestamp:
                                new Date()
                                    .toLocaleString()
                        });

                        chrome.storage.local.set({
                            steps
                        });

                        console.log(
                            "Step Captured:",
                            steps.length
                        );
                    }
                );

            }
        );
    }


    if (request.action === "generatePdf") {

        chrome.tabs.create({
            url:
            chrome.runtime.getURL(
                "report-form.html"
            )
        });

    }
});

// keyboard shortcut for capturing step

chrome.commands.onCommand.addListener(
    async (command) => {

        if (command === "capture-screen") {

            const tabs =
                await chrome.tabs.query({
                    active: true,
                    currentWindow: true
                });

            const activeTab = tabs[0];

            chrome.tabs.captureVisibleTab(
                null,
                {
                    format: "jpeg",
                    quality: 35
                },
                (image) => {

                    chrome.storage.local.get(
                        ["steps"],
                        (result) => {

                            const steps =
                                result.steps || [];

                            steps.push({
                                id: steps.length + 1,
                                title: activeTab.title,
                                pageTitle: activeTab.title,
                                url: activeTab.url,
                                image,
                                timestamp:
                                    new Date()
                                    .toLocaleString()
                            });

                            chrome.storage.local.set({
                                steps
                            });

                            console.log(
                                "Screenshot captured using shortcut"
                            );
                        }
                    );
                }
            );
        }
    }
);