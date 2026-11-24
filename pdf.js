document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["steps", "reportInfo"], (data) => {
        const steps = Array.isArray(data.steps) ? data.steps : [];
        const info = data.reportInfo || {};

        if (!steps.length) {
            alert("No screenshots available to generate a report.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = pdf.internal.pageSize.getWidth();   // 210 mm
        const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm
        const margin = 14;
        const contentWidth = pageWidth - margin * 2;
        const bottomLimit = pageHeight - 16;

        // Color Palette (Enterprise Navy & Slate)
        const colors = {
            primary: [24, 48, 82],       // Deep Navy
            secondary: [241, 245, 249],  // Light Slate Tint
            border: [203, 213, 225],     // Muted Gray Border
            textDark: [15, 23, 42],      // Near-Black Text
            textMuted: [100, 116, 139],  // Secondary Text
            passBg: [220, 252, 231],     // Soft Green
            passText: [22, 101, 52],     // Dark Green
            failBg: [254, 226, 226],     // Soft Red
            failText: [153, 27, 27]      // Dark Red
        };

        const safeText = (value, fallback = "N/A") => {
            if (value === undefined || value === null || String(value).trim() === "") {
                return fallback;
            }
            return String(value).trim();
        };

        const formatTimestamp = (rawDate) => {
            if (!rawDate) {
                return new Date().toLocaleString("en-US", {
                    month: "2-digit",
                    day: "2-digit",
                    year: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                    hour12: true
                });
            }
            const parsed = new Date(rawDate);
            return Number.isNaN(parsed.getTime()) ? String(rawDate).trim() : parsed.toLocaleString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
                hour12: true
            });
        };

        const isFailedStatus = (statusText) => /fail|error|blocked/i.test(statusText);
        const isPassedStatus = (statusText) => /pass|success|completed/i.test(statusText);

        const getStatusStyle = (statusText) => {
            if (isFailedStatus(statusText)) {
                return { bg: colors.failBg, text: colors.failText };
            }
            if (isPassedStatus(statusText)) {
                return { bg: colors.passBg, text: colors.passText };
            }
            return { bg: colors.secondary, text: colors.textDark };
        };

        const addFooter = (pageNum, totalPages) => {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(8.5);
            pdf.setTextColor(...colors.textMuted);

            const footerY = pageHeight - 8;
            pdf.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
            pdf.text("Oracle Fusion — Test Execution Report", margin, footerY);
            pdf.text(
                `Page ${pageNum} of ${totalPages}`,
                pageWidth - margin,
                footerY,
                { align: "right" }
            );
        };

        const drawOverviewHeader = (startY) => {
            const colNum = 18;
            const colDesc = contentWidth * 0.44 - colNum;
            const colPage = contentWidth - colNum - colDesc;
            const headerH = 8.5;

            pdf.setFillColor(...colors.primary);
            pdf.rect(margin, startY, contentWidth, headerH, "F");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9);
            pdf.setTextColor(255, 255, 255);
            pdf.text("#", margin + 3, startY + 5.6);
            pdf.text("Step Description", margin + colNum + 3, startY + 5.6);
            pdf.text("Page Title", margin + colNum + colDesc + 3, startY + 5.6);

            return {
                nextY: startY + headerH,
                colNum,
                colDesc,
                colPage
            };
        };

        // ==========================================
        // PAGE 1: COVER PAGE & EXECUTIVE SUMMARY
        // ==========================================
        const bannerH = 38;
        pdf.setFillColor(...colors.primary);
        pdf.rect(0, 0, pageWidth, bannerH, "F");

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(255, 255, 255);
        pdf.text("TEST EXECUTION REPORT", margin, 16);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(226, 232, 240);
        pdf.text("Oracle Fusion QA Verification & Evidence Log", margin, 26);

        // Overall Status Pill on right side of banner
        const rawOverallStatus = safeText(info.status, "");
        const hasExplicitFailedStep = steps.some((s) => isFailedStatus(safeText(s.status, "")));
        const overallStatus = rawOverallStatus
            ? rawOverallStatus.toUpperCase()
            : (hasExplicitFailedStep ? "FAILED" : "PASSED");
        const overallStyle = getStatusStyle(overallStatus);

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        const pillW = Math.max(24, pdf.getTextWidth(overallStatus) + 10);
        const pillH = 7.5;
        const pillX = pageWidth - margin - pillW;
        const pillY = (bannerH - pillH) / 2;

        pdf.setFillColor(...overallStyle.bg);
        pdf.roundedRect(pillX, pillY, pillW, pillH, 2, 2, "F");
        pdf.setTextColor(...overallStyle.text);
        pdf.text(overallStatus, pillX + pillW / 2, pillY + 5.1, { align: "center" });

        // Execution Summary (2-Column Grid)
        let y = bannerH + 9;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(...colors.primary);
        pdf.text("Execution Summary", margin, y);
        y += 4;

        const executionDateText = formatTimestamp(info.executionDate);
        const reportGeneratedText = formatTimestamp(info.reportGenerated);

        const summaryPairs = [
            [
                { label: "Test Case ID", value: safeText(info.testCaseId) },
                { label: "Application", value: safeText(info.application, "Oracle Fusion") }
            ],
            [
                { label: "Test Case Name", value: safeText(info.testCaseName) },
                { label: "Module", value: safeText(info.module) }
            ],
            [
                { label: "Environment", value: safeText(info.environment, "DEV") },
                { label: "Execution Status", value: overallStatus, isStatus: true }
            ],
            [
                { label: "Executed By", value: safeText(info.executedBy) },
                { label: "Execution Date", value: executionDateText }
            ],
            [
                { label: "Total Captured Steps", value: String(steps.length) },
                { label: "Report Generated", value: reportGeneratedText }
            ]
        ];

        const halfWidth = contentWidth / 2;
        const cellLabelWidth = 34;
        const lineH = 4.6;
        const padY = 2.8;
        const gridTopY = y;

        summaryPairs.forEach((pair, rowIdx) => {
            const leftWrapped = pdf.splitTextToSize(pair[0].value, halfWidth - cellLabelWidth - 5);
            const rightWrapped = pdf.splitTextToSize(pair[1].value, halfWidth - cellLabelWidth - 5);
            const maxLines = Math.max(leftWrapped.length, rightWrapped.length, 1);
            const rowH = Math.max(8, maxLines * lineH + padY * 2);

            const rowBg = rowIdx % 2 === 0 ? [255, 255, 255] : colors.secondary;
            pdf.setFillColor(...rowBg);
            pdf.rect(margin, y, contentWidth, rowH, "F");

            pdf.setDrawColor(...colors.border);
            pdf.setLineWidth(0.2);
            pdf.rect(margin, y, contentWidth, rowH, "S");
            pdf.line(margin + halfWidth, y, margin + halfWidth, y + rowH);
            pdf.line(margin + cellLabelWidth, y, margin + cellLabelWidth, y + rowH);
            pdf.line(
                margin + halfWidth + cellLabelWidth,
                y,
                margin + halfWidth + cellLabelWidth,
                y + rowH
            );

            [
                { cell: pair[0], wrapped: leftWrapped, xStart: margin },
                { cell: pair[1], wrapped: rightWrapped, xStart: margin + halfWidth }
            ].forEach(({ cell, wrapped, xStart }) => {
                const textY = y + padY + 3.3;
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(8.5);
                pdf.setTextColor(...colors.textMuted);
                pdf.text(cell.label, xStart + 2.5, textY);

                if (cell.isStatus) {
                    const st = getStatusStyle(cell.value);
                    pdf.setFont("helvetica", "bold");
                    pdf.setFontSize(8.5);
                    pdf.setTextColor(...st.text);
                } else {
                    pdf.setFont("helvetica", cell.label === "Test Case ID" || cell.label === "Total Captured Steps" ? "bold" : "normal");
                    pdf.setFontSize(9);
                    pdf.setTextColor(...colors.textDark);
                }
                pdf.text(wrapped, xStart + cellLabelWidth + 2.5, textY);
            });

            y += rowH;
        });

        pdf.setDrawColor(...colors.border);
        pdf.setLineWidth(0.35);
        pdf.rect(margin, gridTopY, contentWidth, y - gridTopY, "S");

        // Captured Steps Overview Table on Cover Page
        y += 8;
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(11);
        pdf.setTextColor(...colors.primary);
        pdf.text("Captured Steps Overview", margin, y);
        y += 4;

        let overviewMetrics = drawOverviewHeader(y);
        y = overviewMetrics.nextY;
        const overviewTopY = y - 8.5;

        steps.forEach((step, index) => {
            const stepNumLabel = `Step ${safeText(step.id, String(index + 1)).replace(/^step\s*/i, "")}`;
            const stepDescText = safeText(step.description || step.title, "Untitled Step");
            const pageTitleText = safeText(
                step.pageTitle || step.title || info.pageTitle,
                "N/A"
            );

            const wrappedDesc = pdf.splitTextToSize(stepDescText, overviewMetrics.colDesc - 6);
            const wrappedPage = pdf.splitTextToSize(pageTitleText, overviewMetrics.colPage - 6);
            const rowH = Math.max(8.5, Math.max(wrappedDesc.length, wrappedPage.length) * 4.5 + 4.5);

            if (y + rowH > bottomLimit) {
                pdf.addPage();
                y = 14;
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(11);
                pdf.setTextColor(...colors.primary);
                pdf.text("Captured Steps Overview (Continued)", margin, y);
                y += 4;
                overviewMetrics = drawOverviewHeader(y);
                y = overviewMetrics.nextY;
            }

            const { colNum, colDesc, colPage } = overviewMetrics;
            pdf.setFillColor(...(index % 2 === 0 ? [255, 255, 255] : colors.secondary));
            pdf.rect(margin, y, contentWidth, rowH, "F");

            pdf.setDrawColor(...colors.border);
            pdf.setLineWidth(0.2);
            pdf.rect(margin, y, contentWidth, rowH, "S");
            pdf.line(margin + colNum, y, margin + colNum, y + rowH);
            pdf.line(margin + colNum + colDesc, y, margin + colNum + colDesc, y + rowH);

            const rowTextY = y + 5.3;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8.8);
            pdf.setTextColor(...colors.textDark);
            pdf.text(stepNumLabel, margin + 2.5, rowTextY);

            pdf.setFont("helvetica", "normal");
            pdf.text(wrappedDesc, margin + colNum + 3, rowTextY);
            pdf.text(wrappedPage, margin + colNum + colDesc + 3, rowTextY);

            y += rowH;
        });

        pdf.setDrawColor(...colors.border);
        pdf.setLineWidth(0.35);
        pdf.rect(margin, overviewTopY, contentWidth, y - overviewTopY, "S");

        // ==========================================
        // SUBSEQUENT PAGES: STEP-BY-STEP EVIDENCE
        // ==========================================
        steps.forEach((step, index) => {
            pdf.addPage();

            let cursorY = 14;
            const colStep = 26;
            const colStatus = 28;
            const colDesc = contentWidth - colStep - colStatus;
            const headerH = 9;

            const stepNumberText = safeText(step.id, String(index + 1));
            const stepTitleText = safeText(step.title || step.description, "Untitled Step");
            const stepStatusText = safeText(step.status, "Passed");
            const stepFailed = isFailedStatus(stepStatusText);

            const wrappedStepTitle = pdf.splitTextToSize(stepTitleText, colDesc - 6);
            const dataRowH = Math.max(12, wrappedStepTitle.length * 5 + 6);

            // Table Header
            pdf.setFillColor(...colors.primary);
            pdf.rect(margin, cursorY, contentWidth, headerH, "F");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9.5);
            pdf.setTextColor(255, 255, 255);
            pdf.text("Step #", margin + 3, cursorY + 6);
            pdf.text("Test Step Description", margin + colStep + 3, cursorY + 6);
            pdf.text("Status", margin + colStep + colDesc + 3, cursorY + 6);

            cursorY += headerH;

            // Table Row
            pdf.setFillColor(255, 255, 255);
            pdf.rect(margin, cursorY, contentWidth, dataRowH, "F");

            pdf.setDrawColor(...colors.border);
            pdf.setLineWidth(0.25);
            pdf.rect(margin, cursorY, contentWidth, dataRowH, "S");
            pdf.line(margin + colStep, cursorY - headerH, margin + colStep, cursorY + dataRowH);
            pdf.line(
                margin + colStep + colDesc,
                cursorY - headerH,
                margin + colStep + colDesc,
                cursorY + dataRowH
            );

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9.5);
            pdf.setTextColor(...colors.textDark);
            pdf.text(stepNumberText, margin + 3, cursorY + 7);

            pdf.setFont("helvetica", "normal");
            pdf.text(wrappedStepTitle, margin + colStep + 3, cursorY + 7);

            // Status Badge inside cell
            const badgeX = margin + colStep + colDesc + 2.5;
            const badgeY = cursorY + 2.5;
            const badgeW = colStatus - 5;
            const badgeH = Math.min(7, dataRowH - 5);

            pdf.setFillColor(...(stepFailed ? colors.failBg : colors.passBg));
            pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 1.5, 1.5, "F");

            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(8.5);
            pdf.setTextColor(...(stepFailed ? colors.failText : colors.passText));
            pdf.text(
                stepStatusText,
                badgeX + badgeW / 2,
                badgeY + badgeH / 2 + 2.5,
                { align: "center" }
            );

            cursorY += dataRowH + 8;

            // Screenshot Container
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(9.5);
            pdf.setTextColor(...colors.primary);
            pdf.text("Captured Screenshot", margin, cursorY);
            cursorY += 4;

            const maxImgHeight = pageHeight - cursorY - 18; // leave room for footer
            const imgWidth = contentWidth;
            let imgHeight = Math.min(imgWidth * 0.5625, maxImgHeight);

            if (step.image) {
                try {
                    const props = pdf.getImageProperties(step.image);
                    if (props && props.width && props.height) {
                        const aspectRatio = props.height / props.width;
                        imgHeight = imgWidth * aspectRatio;
                        if (imgHeight > maxImgHeight) {
                            imgHeight = maxImgHeight;
                        }
                    }

                    // Subtle frame behind screenshot
                    pdf.setFillColor(...colors.secondary);
                    pdf.setDrawColor(...colors.border);
                    pdf.setLineWidth(0.3);
                    pdf.rect(margin, cursorY, imgWidth, imgHeight, "FD");

                    pdf.addImage(
                        step.image,
                        "JPEG",
                        margin,
                        cursorY,
                        imgWidth,
                        imgHeight,
                        `step_${index}`,
                        "FAST"
                    );
                } catch (err) {
                    console.warn(`Failed to render image for step ${stepNumberText}:`, err);
                    pdf.setDrawColor(...colors.border);
                    pdf.rect(margin, cursorY, imgWidth, 40, "S");
                    pdf.setFont("helvetica", "italic");
                    pdf.setFontSize(9.5);
                    pdf.setTextColor(...colors.textMuted);
                    pdf.text("Screenshot unavailable or invalid image format.", margin + 6, cursorY + 22);
                }
            } else {
                pdf.setDrawColor(...colors.border);
                pdf.rect(margin, cursorY, imgWidth, 40, "S");
                pdf.setFont("helvetica", "italic");
                pdf.setFontSize(9.5);
                pdf.setTextColor(...colors.textMuted);
                pdf.text("No screenshot captured for this step.", margin + 6, cursorY + 22);
            }
        });

        // Stamp footers across all pages now that total page count is known
        const totalPages = pdf.getNumberOfPages();
        for (let p = 1; p <= totalPages; p++) {
            pdf.setPage(p);
            addFooter(p, totalPages);
        }

        const safeCaseId = safeText(info.testCaseName, "Report").replace(/[^\w\-]+/g, "_");
        const fileName = `${safeCaseId}-Execution-Report.pdf`;

        pdf.save(fileName);

        chrome.storage.local.set({ steps: [] }, () => {
            alert(`PDF generated successfully (${fileName}).`);
        });
    });
});