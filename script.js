
/* ============================================
   EPSILON-CLOSURE CALCULATOR
   Complete script.js
============================================ */

const stateCountInput = document.getElementById("stateCount");
const generateBtn = document.getElementById("generateBtn");
const calculateBtn = document.getElementById("calculateBtn");
const matrixContainer = document.getElementById("matrixContainer");
const message = document.getElementById("message");
const originalSection = document.getElementById("originalSection");
const originalDiagram = document.getElementById("originalDiagram");
const closureSection = document.getElementById("closureSection");
const closureResults = document.getElementById("closureResults");

let stateNames = [];
let transitionMatrix = [];

// Change this to true if the last state should be a final state.
const SHOW_LAST_STATE_AS_FINAL = false;

/* ---------- Messages ---------- */

function showMessage(text, type = "error") {
    if (!message) return;
    message.textContent = text;
    message.className = type;
}

/* ---------- Epsilon suggestions ---------- */

function ensureEpsilonSuggestions() {
    if (document.getElementById("epsilonOptions")) return;

    const datalist = document.createElement("datalist");
    datalist.id = "epsilonOptions";

    const option = document.createElement("option");
    option.value = "ε";
    option.label = "Epsilon";

    datalist.appendChild(option);
    document.body.appendChild(datalist);
}

/* ---------- Create one input per matrix cell ---------- */

function createTransitionCell(row, column) {
    ensureEpsilonSuggestions();

    const input = document.createElement("input");
    input.type = "text";
    input.className = "transition-input";
    input.placeholder = "Symbol / ε";
    input.setAttribute("list", "epsilonOptions");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("spellcheck", "false");
    input.dataset.row = row;
    input.dataset.column = column;

    return input;
}

/* ---------- Generate transition matrix ---------- */

function generateMatrix() {
    const count = Number.parseInt(stateCountInput?.value, 10);

    if (!Number.isInteger(count) || count < 1 || count > 10) {
        showMessage("Enter a number of states from 1 to 10.");
        return;
    }

    stateNames = Array.from({ length: count }, (_, i) => `q${i}`);

    transitionMatrix = Array.from(
        { length: count },
        () => Array.from({ length: count }, () => [])
    );

    matrixContainer.replaceChildren();

    const table = document.createElement("table");
    table.className = "transition-matrix";

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");

    const corner = document.createElement("th");
    corner.textContent = "From / To";
    headerRow.appendChild(corner);

    stateNames.forEach((state) => {
        const th = document.createElement("th");
        th.textContent = state;
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");

    for (let row = 0; row < count; row++) {
        const tr = document.createElement("tr");

        const rowHeader = document.createElement("th");
        rowHeader.textContent = stateNames[row];
        tr.appendChild(rowHeader);

        for (let column = 0; column < count; column++) {
            const td = document.createElement("td");
            td.appendChild(createTransitionCell(row, column));
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    matrixContainer.appendChild(table);

    if (originalSection) originalSection.hidden = true;
    if (closureSection) closureSection.hidden = true;
    if (calculateBtn) calculateBtn.disabled = false;

    showMessage("Matrix generated. Enter transitions.", "success");
}

/* ---------- Read transition matrix ---------- */

function readMatrix() {
    const count = stateNames.length;

    transitionMatrix = Array.from(
        { length: count },
        () => Array.from({ length: count }, () => [])
    );

    matrixContainer.querySelectorAll(".transition-input").forEach((input) => {
        const row = Number(input.dataset.row);
        const column = Number(input.dataset.column);
        const value = input.value.trim();

        // Empty input means no transition.
        if (!value) return;

        // Multiple symbols can be separated by commas.
        const symbols = value
            .split(",")
            .map((symbol) => symbol.trim())
            .filter(Boolean);

        transitionMatrix[row][column] = [...new Set(symbols)];
    });

    return transitionMatrix;
}

/* ---------- Calculate epsilon closure ---------- */

function calculateEpsilonClosure(startState) {
    const visited = new Set([startState]);
    const stack = [startState];

    while (stack.length > 0) {
        const current = stack.pop();

        for (let next = 0; next < stateNames.length; next++) {
            const labels = transitionMatrix[current][next];

            if (labels.includes("ε") && !visited.has(next)) {
                visited.add(next);
                stack.push(next);
            }
        }
    }

    return [...visited].sort((a, b) => a - b);
}

/* ---------- SVG helper ---------- */

function svgElement(name, attributes = {}, textContent = "") {
    const element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        name
    );

    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, String(value));
    });

    if (textContent !== "") {
        element.textContent = textContent;
    }

    return element;
}

/* ---------- Draw diagram from transition matrix ---------- */


function drawDiagram(container, closureStates = null) {
    if (!container || stateNames.length === 0) return;

    container.replaceChildren();

    const count = stateNames.length;
    const radius = 30;
    const spacing = 180;
    const width = Math.max(540, (count + 1) * spacing);
    const height = 260;
    const centerY = 145;

    const positions = stateNames.map((_, i) => ({
        x: spacing * (i + 1),
        y: centerY
    }));

    const svg = svgElement("svg", {
        viewBox: `0 0 ${width} ${height}`,
        width: "100%",
        role: "img",
        "aria-label": "Transition diagram"
    });

    const markerId = `arrow-${Math.random().toString(36).slice(2, 9)}`;

    const defs = svgElement("defs");
    const marker = svgElement("marker", {
        id: markerId,
        markerWidth: 9,
        markerHeight: 9,
        refX: 8,
        refY: 4,
        orient: "auto",
        markerUnits: "userSpaceOnUse"
    });

    marker.appendChild(svgElement("path", {
        d: "M0,0 L8,4 L0,8 Z",
        fill: "#333"
    }));

    defs.appendChild(marker);
    svg.appendChild(defs);

    // Draw only real transitions.
    for (let row = 0; row < count; row++) {
        for (let column = 0; column < count; column++) {
            const labels = transitionMatrix[row][column];

            if (!labels || labels.length === 0) continue;

            if (closureStates !== null) {
                if (
                    !closureStates.includes(row) ||
                    !closureStates.includes(column) ||
                    !labels.includes("ε")
                ) continue;
            }

            const from = positions[row];
            const to = positions[column];

            let pathData;
            let labelX;
            let labelY;

            if (row === column) {
                // Draw a loop only if a self-transition exists.
                pathData = `
                    M ${from.x - 14} ${from.y - radius + 2}
                    C ${from.x - 48} ${from.y - 88},
                      ${from.x + 48} ${from.y - 88},
                      ${from.x + 14} ${from.y - radius + 2}
                `;

                labelX = from.x;
                labelY = from.y - 63;
            } else {
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const distance = Math.hypot(dx, dy);

                if (distance === 0) continue;

                const ux = dx / distance;
                const uy = dy / distance;

                // Stop before the state circles.
                const startX = from.x + ux * (radius + 1);
                const startY = from.y + uy * (radius + 1);
                const endX = to.x - ux * (radius + 11);
                const endY = to.y - uy * (radius + 11);

                const middleX = (startX + endX) / 2;
                const middleY = (startY + endY) / 2;

                // Curve opposite-direction arrows apart.
                const bend = row < column ? -38 : 38;
                const controlX = middleX;
                const controlY = middleY + bend;

                pathData = `
                    M ${startX} ${startY}
                    Q ${controlX} ${controlY}
                      ${endX} ${endY}
                `;

                labelX = controlX;
                labelY = controlY + (bend < 0 ? -8 : 19);
            }

            // Each actual transition gets its own arrowhead.
            svg.appendChild(svgElement("path", {
                d: pathData,
                fill: "none",
                stroke: "#333",
                "stroke-width": 1.7,
                "stroke-linecap": "round",
                "marker-end": `url(#${markerId})`
            }));

            svg.appendChild(svgElement("text", {
                x: labelX,
                y: labelY,
                fill: "#111",
                "font-size": 15,
                "text-anchor": "middle"
            }, labels.join(", ")));
        }
    }

    // Draw state circles over arrow endpoints.
    for (let i = 0; i < count; i++) {
        const { x, y } = positions[i];

        let fill = "#fff";
        let stroke = "#555";

        if (closureStates !== null) {
            if (closureStates.includes(i)) {
                fill = i === closureStates[0] ? "#bfdbfe" : "#bbf7d0";
                stroke = i === closureStates[0] ? "#2563eb" : "#16a34a";
            } else {
                fill = "#e5e7eb";
                stroke = "#9ca3af";
            }
        }

        svg.appendChild(svgElement("circle", {
            cx: x,
            cy: y,
            r: radius,
            fill,
            stroke,
            "stroke-width": 1.8
        }));

        svg.appendChild(svgElement("text", {
            x,
            y: y + 5,
            "text-anchor": "middle",
            "font-size": 15,
            "font-weight": "bold",
            fill: "#111"
        }, stateNames[i]));
    }

    container.appendChild(svg);
}



/* ---------- Calculate and display all closures ---------- */

function calculateAllClosures() {
    if (stateNames.length === 0) {
        showMessage("Generate the matrix first.");
        return;
    }

    readMatrix();

    // Display the original diagram once.
    drawDiagram(originalDiagram, null);

    if (originalSection) originalSection.hidden = false;

    closureResults.replaceChildren();

    for (let state = 0; state < stateNames.length; state++) {
        const closure = calculateEpsilonClosure(state);

        const card = document.createElement("div");
        card.className = "closure-card";

        const heading = document.createElement("h3");
        heading.textContent = `ε-closure(${stateNames[state]})`;

        const result = document.createElement("p");
        result.className = "closure-value";
        result.textContent =
            "{ " + closure.map((i) => stateNames[i]).join(", ") + " }";

        const diagramHeading = document.createElement("h4");
        diagramHeading.textContent = "Closure Diagram";

        const diagram = document.createElement("div");
        diagram.className = "closure-diagram";

        card.append(heading, result, diagramHeading, diagram);
        closureResults.appendChild(card);

        drawDiagram(diagram, closure);
    }

    if (closureSection) closureSection.hidden = false;

    showMessage("Epsilon closures calculated successfully.", "success");
}

/* ---------- Button events ---------- */

if (generateBtn) {
    generateBtn.addEventListener("click", generateMatrix);
}

if (calculateBtn) {
    calculateBtn.addEventListener("click", calculateAllClosures);
}

// Generate initial matrix when a default count is present.
if (stateCountInput && stateCountInput.value !== "") {
    generateMatrix();
}
