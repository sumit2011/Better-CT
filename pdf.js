document.addEventListener(
    "DOMContentLoaded",
    () => {

        chrome.storage.local.get(
            ["steps","reportInfo"],
            (data) => {

                const steps =
                    data.steps || [];
                
                const reportInfo =
                    data.reportInfo || {};

                if (!steps.length) {

                    alert(
                        "No screenshots available"
                    );
                    return;
                }

                const pdf =
                    new window.jspdf.jsPDF(
                        "p",
                        "mm",
                        "a4"
                    );
                
pdf.setFontSize(20);

pdf.text(
    "TEST EXECUTION REPORT",
    45,
    20
);

pdf.rect(
    15,
    35,
    180,
    110
);

pdf.setFontSize(12);

let y = 50;

pdf.text(
    `Test Case Name : ${reportInfo.testCaseName}`,
    20,
    y
);

y += 12;

pdf.text(
    `Test Case ID : ${reportInfo.testCaseId}`,
    20,
    y
);

y += 12;

pdf.text(
    `Application : Oracle Fusion`,
    20,
    y
);

y += 12;

pdf.text(
    `Module : ${reportInfo.module}`,
    20,
    y
);

y += 12;

pdf.text(
    `Environment : ${reportInfo.environment}`,
    20,
    y
);

y += 12;

pdf.text(
    `Executed By : ${reportInfo.executedBy}`,
    20,
    y
);

y += 12;

pdf.text(
    `Execution Date : ${reportInfo.executionDate}`,
    20,
    y
);

y += 12;

pdf.text(
    `Execution Status : ${reportInfo.status}`,
    20,
    y
);

y += 12;

pdf.text(
    `Total Steps : ${steps.length}`,
    20,
    y
);
pdf.addPage();

                steps.forEach(
                    (step, index) => {

                        if (index !== 0) {
                            pdf.addPage();
                        }

                        const pageWidth =
                            pdf.internal.pageSize.getWidth();

                        const margin = 10;

                        const tableWidth =
                            pageWidth - (margin * 2);

                        // Column widths
                        const col1 = 30; // Step Number
                        const col3 = 30; // Status
                        const col2 = tableWidth - col1 - col3; // Test Step

                        const startX = margin;
                        const startY = 15;

                        const headerHeight = 10;
                        const rowHeight = 15;

                        // Outer border
                        pdf.rect(
                            startX,
                            startY,
                            tableWidth,
                            headerHeight + rowHeight
                        );

                        // Vertical lines
                        pdf.line(
                            startX + col1,
                            startY,
                            startX + col1,
                            startY + headerHeight + rowHeight
                        );

                        pdf.line(
                            startX + col1 + col2,
                            startY,
                            startX + col1 + col2,
                            startY + headerHeight + rowHeight
                        );

                        // Horizontal line
                        pdf.line(
                            startX,
                            startY + headerHeight,
                            startX + tableWidth,
                            startY + headerHeight
                        );

                        // Header
                        pdf.setFont(undefined, "bold");
                        pdf.setFontSize(11);

                        pdf.text(
                            "Step Number",
                            startX + 2,
                            startY + 7
                        );

                        pdf.text(
                            "Test Step",
                            startX + col1 + 2,
                            startY + 7
                        );

                        pdf.text(
                            "Status",
                            startX + col1 + col2 + 2,
                            startY + 7
                        );

                        // Data
                        pdf.setFont(undefined, "normal");

                        pdf.text(
                            String(step.id),
                            startX + 2,
                            startY + 18
                        );

                        pdf.text(
                            step.title,
                            startX + col1 + 2,
                            startY + 18,
                            {
                                maxWidth: col2 - 4
                            }
                        );

                        pdf.text(
                            "Passed",
                            startX + col1 + col2 + 2,
                            startY + 18
                        );

                        // const pageWidth =
                        //     pdf.internal
                        //         .pageSize
                        //         .getWidth();

                        const imgWidth =
                            pageWidth - 20;

                        const imgHeight =
                            imgWidth * 0.56;

                        pdf.addImage(
                            step.image,
                            "JPEG",
                            10,
                            70,
                            imgWidth,
                            imgHeight,
                            "",
                            "FAST"
                        );

                    });

                pdf.save(
                    "Better-CT-Report.pdf"
                );

                chrome.storage.local.set({
                    steps: []
                });

                alert(
                    "PDF generated successfully."
                );

            });
    });