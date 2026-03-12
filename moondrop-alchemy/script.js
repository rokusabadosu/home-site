// Handle Start Screen
document.getElementById('start-btn').addEventListener('click', () => {
    const playerName = document.getElementById('player-name').value || "Player";
    const petName = document.getElementById('pet-name').value || "Buddy";
    
    // Get selected images
    const playerImg = document.querySelector('input[name="player-avatar"]:checked').value;
    const petImg = document.querySelector('input[name="pet-avatar"]:checked').value;

    document.getElementById('start-screen').style.display = 'none';
    startGame(playerName, petName, playerImg, petImg);
});

function startGame(playerName, petName, playerImg, petImg) {
    // --- 1. DATA DEFINITION ---
    // Pool of potential images
    const allImages = [
        "images/man1.png", "images/woman1.png",
        "images/man2.png", "images/woman2.png",
        "images/man3.png", "images/woman3.png",
        "images/man4.png", "images/woman4.png",
        "images/man5.png", "images/woman5.png"
    ];

    const maleNames = ["Arthur", "Benedict", "Charles", "Edward", "Felix", "George", "Henry", "Isaac", "Jack", "Liam"];
    const femaleNames = ["Alice", "Beatrice", "Clara", "Daisy", "Eleanor", "Flora", "Grace", "Hazel", "Ivy", "Jane"];

    // Ailments / Requests
    const ailments = ["🤕", "❤️", "💤", "🔥", "🍀", "🤢", "🤧", "💪"];

    // Ingredients
    const ingredients = ["🍄", "🌿", "🌸", "🍃", "💎", "💧", "⭐", "🌙"];

    const data = {
        nodes: [
            { id: playerName, group: 1, img: playerImg },
            { id: petName, group: 1, img: petImg }
        ],
        links: [
            { source: playerName, target: petName, strength: 18 }
        ]
    };

    // Generate ALL characters immediately
    const townspeopleRegistry = [];
    const usedImages = new Set([playerImg, petImg]);
    const availableImages = allImages.filter(img => !usedImages.has(img));

    availableImages.forEach(img => {
        const isFemale = img.includes("woman");
        const nameList = isFemale ? femaleNames : maleNames;
        
        // Find unused names
        const usedNames = new Set(townspeopleRegistry.map(n => n.id));
        usedNames.add(playerName);
        usedNames.add(petName);

        const availableNames = nameList.filter(name => !usedNames.has(name));
        
        let newName;
        if (availableNames.length > 0) {
            newName = availableNames[Math.floor(Math.random() * availableNames.length)];
        } else {
            let idCounter = 1;
            while (usedNames.has(`Townsperson ${idCounter}`)) { idCounter++; }
            newName = `Townsperson ${idCounter}`;
        }

        townspeopleRegistry.push({ 
            id: newName, 
            group: 2, 
            img: img, 
            relationshipStrength: 1 
        });
    });

    // Assign ingredients to townspeople
    const shuffledIngredients = [...ingredients].sort(() => 0.5 - Math.random());
    townspeopleRegistry.forEach((person, index) => {
        if (index < shuffledIngredients.length) {
            person.heldIngredient = shuffledIngredients[index];
        }
    });

    // --- 2. SETUP SVG & SIMULATION ---
    const width = window.innerWidth;
    const height = window.innerHeight;
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    const svg = d3.select("#graph-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height]);

    // Define clipPath for circular images
    svg.append("defs").append("clipPath")
        .attr("id", "circle-clip")
        .append("circle")
        .attr("r", 25);

    // Create a container group for all graph elements
    const g = svg.append("g");

    // Add zoom and pan behavior
    svg.call(d3.zoom()
        .scaleExtent([0.1, 4])
        .on("zoom", (event) => {
            g.attr("transform", event.transform);
        }));

    const simulation = d3.forceSimulation(data.nodes)
        .force("link", d3.forceLink(data.links).id(d => d.id).distance(200))
        .force("charge", d3.forceManyBody().strength(-500))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // --- 3. DRAW ELEMENTS ---

    // Create groups for layering to ensure order (lines under nodes)
    const linkGroup = g.append("g").attr("class", "links");
    const linkLabelGroup = g.append("g").attr("class", "link-labels");
    const nodeGroup = g.append("g").attr("class", "nodes");
    const nodeLabelGroup = g.append("g").attr("class", "node-labels");
    const indicatorGroup = g.append("g").attr("class", "indicators");

    let link, linkLabel, node, nodeLabel;

    // Personal Attributes
    const attributes = ["😊", "😢", "😠", "🧠", "🏃", "💰", "🤝", "🦁"];

    // Recipes: Map each ailment to a random selection of ingredients
    const recipes = {};
    ailments.forEach(ailment => {
        const numIngredients = Math.floor(Math.random() * 2) + 2; // 2 to 3 ingredients
        const shuffled = [...ingredients].sort(() => 0.5 - Math.random());
        recipes[ailment] = shuffled.slice(0, numIngredients);
    });

    // --- INVENTORY & STATE ---
    let gold = 10;
    let actions = 10;
    let petInteractedToday = false;
    let introductionSource = null;
    let dailyMarketPeople = null;
    let dailyShopPeople = null;
    const communityLinks = [];
    const inventory = {};
    // Initialize 1 potion of each type
    ailments.forEach(a => inventory[a] = 1);
    
    // Ingredient Inventory
    const ingredientInventory = {};
    ingredients.forEach(i => ingredientInventory[i] = 3);

    // Per-ingredient market prices (start at 3, fluctuate based on demand)
    const ingredientPrices = {};
    ingredients.forEach(i => ingredientPrices[i] = 3);

    // Track how many of each ingredient the player buys each day
    const dailyIngredientBuys = {};
    ingredients.forEach(i => dailyIngredientBuys[i] = 0);

    // UI Elements
    const uiContainer = d3.select("#game-ui");
    uiContainer.style("display", "block");
    uiContainer.html(""); // Clear any existing content

    // --- MESSAGE SYSTEM ---
    // Remove existing container if any (to prevent duplicates on restart)
    d3.select("#message-container").remove();
    const messageContainer = d3.select("body").append("div")
        .attr("id", "message-container");

    function showMessage(text) {
        const msg = messageContainer.append("div")
            .attr("class", "game-message")
            .text(text);

        // Fade out and remove
        setTimeout(() => {
            msg.style("opacity", 0);
        }, 9000); // Start fading after 9s

        setTimeout(() => {
            msg.remove();
        }, 10000); // Remove after 10s
    }

    // 1. Stats Display (Gold & Actions)
    const statsContainer = uiContainer.append("div")
        .attr("class", "stats-container");

    const goldDisplay = statsContainer.append("div")
        .style("font-size", "18px").style("font-weight", "bold").style("color", "#d4af37")
        .style("display", "flex")
        .style("align-items", "center")
        .html(`${gold} <img src="images/gold.png" style="height: 1.2em; margin-left: 5px;">`);
    const actionDisplay = statsContainer.append("div")
        .style("font-size", "18px").style("font-weight", "bold").style("color", "#4a90e2")
        .text(`${actions} ⚡`);

    // 2. Potions Section (Open by default)
    const potionsHeader = uiContainer.append("div")
        .attr("class", "panel-header")
        .on("click", function() { togglePanel(this); });
    potionsHeader.append("span").text("Potions");
    potionsHeader.append("span").attr("class", "chevron").text("▼");

    const potionsBody = uiContainer.append("div")
        .attr("class", "panel-body open"); // Start open
    const potionsGrid = potionsBody.append("div").attr("class", "inventory-grid").style("margin", "10px 0");

    // 3. Ingredients Section (Closed by default)
    const ingredientsHeader = uiContainer.append("div")
        .attr("class", "panel-header")
        .on("click", function() { togglePanel(this); });
    ingredientsHeader.append("span").text("Ingredients");
    ingredientsHeader.append("span").attr("class", "chevron").text("▼");

    const ingredientsBody = uiContainer.append("div")
        .attr("class", "panel-body"); // Start closed
    const ingredientsGrid = ingredientsBody.append("div").attr("class", "inventory-grid").style("margin", "10px 0");

    function togglePanel(headerElement) {
        const header = d3.select(headerElement);
        const body = d3.select(headerElement.nextElementSibling);
        body.classed("open", !body.classed("open"));
    }

    function updateInventoryUI() {
        goldDisplay.html(`${gold} <img src="images/gold.png" style="height: 1.2em; margin-left: 5px;">`);
        actionDisplay.text(`${actions} ⚡`);

        potionsGrid.html("");
        ailments.forEach(ailment => {
            const count = inventory[ailment] || 0;
            const recipe = recipes[ailment];
            const canBrew = recipe.every(ing => (ingredientInventory[ing] || 0) > 0) && actions > 0;

            const slot = potionsGrid.append("div")
                .attr("class", "potion-slot")
                .style("cursor", "default");
            
            // Draggable Potion Icon
            const iconGroup = slot.append("div")
                .style("opacity", count > 0 ? 1 : 0.5)
                .style("cursor", count > 0 ? "grab" : "default");

            iconGroup.append("div").style("font-size", "20px").text(ailment);
            iconGroup.append("div").style("font-size", "12px").text(`x${count}`);

            // Drag Logic
            if (count > 0) {
                iconGroup.on("mousedown", (event) => startDrag(event, ailment, 'potion'));
            }

            // Ingredients Required
            const recipeDiv = slot.append("div").style("margin-top", "4px");
            recipe.forEach(ing => {
                const has = (ingredientInventory[ing] || 0) > 0;
                recipeDiv.append("span")
                    .text(ing)
                    .style("font-size", "12px")
                    .style("opacity", has ? 1 : 0.2);
            });

            // Brew Button
            slot.append("div")
                .text("⚗️")
                .style("font-size", "16px")
                .style("margin-top", "2px")
                .style("cursor", canBrew ? "pointer" : "default")
                .style("opacity", canBrew ? 1 : 0.2)
                .on("click", () => canBrew && brewPotion(ailment));
        });

        ingredientsGrid.html("");
        ingredients.forEach(ing => {
            const count = ingredientInventory[ing] || 0;
            const slot = ingredientsGrid.append("div")
                .attr("class", "potion-slot")
                .style("opacity", count > 0 ? 1 : 0.5)
                .style("cursor", count > 0 ? "grab" : "default");
            
            slot.append("div").style("font-size", "20px").text(ing);
            slot.append("div").style("font-size", "12px").text(`x${count}`);

            if (count > 0) {
                slot.on("mousedown", (event) => startDrag(event, ing, 'ingredient'));
            }
        });
    }

    function brewPotion(potionName) {
        if (actions <= 0) {
            showMessage("No actions left!");
            return;
        }
        
        const recipe = recipes[potionName];
        // Consume ingredients
        recipe.forEach(ing => {
            ingredientInventory[ing]--;
        });
        
        inventory[potionName]++;
        actions--;
        showMessage(`Brewed ${potionName}!`);
        updateInventoryUI();
    }

    function startDrag(event, item, type) {
        event.preventDefault();
        const ghost = d3.select("body").append("div")
            .style("position", "absolute")
            .style("font-size", "30px")
            .style("pointer-events", "none") // Crucial: lets us check elementFromPoint below
            .style("z-index", "1000")
            .text(item);

        function move(event) {
            ghost.style("left", (event.pageX - 15) + "px")
                 .style("top", (event.pageY - 15) + "px");
        }

        function end(event) {
            document.removeEventListener("mousemove", move);
            document.removeEventListener("mouseup", end);
            ghost.remove();
            checkDrop(event.clientX, event.clientY, item, type);
        }

        document.addEventListener("mousemove", move);
        document.addEventListener("mouseup", end);
    }

    function showRelationshipChange(link, direction) {
        link.change = direction;
        update(); // Redraw to show the indicator

        // After a delay, remove the change property and redraw again
        setTimeout(() => {
            // The link might have been removed from the data, so check
            if (data.links.includes(link)) {
                delete link.change;
                update();
            }
        }, 1500);
    }

    // Helper: find a link between two nodes by id (direction-agnostic)
    function findLink(aId, bId) {
        return data.links.find(l =>
            (l.source.id === aId && l.target.id === bId) ||
            (l.target.id === aId && l.source.id === bId)
        );
    }

    // Function to update the graph (enter/update/exit pattern)
    function update() {
        // Draw Lines
        link = linkGroup.selectAll("line")
            .data(data.links)
            .join("line")
            .attr("class", "link");

        // Draw Link Labels
        linkLabel = linkLabelGroup.selectAll("text")
            .data(data.links)
            .join("text")
            .attr("class", "link-label")
            .text(d => getRelationshipLabel(d.strength));

        // Draw Nodes
        node = nodeGroup.selectAll(".node")
            .data(data.nodes, d => d.id)
            .join(enter => {
                const group = enter.append("g").attr("class", "node");
                
                group.call(d3.drag()
                    .on("start", dragstarted)
                    .on("drag", dragged)
                    .on("end", dragended));
                
                // Add click listener for Interaction
                group.on("click", (event, d) => {
                    if (d.id !== playerName) {
                        event.stopPropagation();
                        if (introductionSource) {
                            completeIntroduction(d);
                        } else {
                            showInteractionMenu(event.pageX, event.pageY, d);
                        }
                    }
                });

                group.append("circle")
                    .attr("r", 25)
                    .attr("fill", "white")
                    .attr("stroke", "#78a865")
                    .attr("stroke-width", 3);

                group.append("image")
                    .attr("href", d => d.img)
                    .attr("x", -25).attr("y", -25)
                    .attr("width", 50).attr("height", 50)
                    .attr("clip-path", "url(#circle-clip)");

                return group;
            });

        // Draw Ailment Bubbles
        node.each(function(d) {
            const g = d3.select(this);
            const bubbleData = d.ailment ? [d.ailment] : [];
            
            const bubble = g.selectAll(".ailment-bubble")
                .data(bubbleData);
            
            bubble.exit().remove();

            const bubbleEnter = bubble.enter().append("g")
                .attr("class", "ailment-bubble")
                .attr("transform", "translate(20, -20)");

            bubbleEnter.append("circle")
                .attr("r", 12)
                .attr("fill", "white")
                .attr("stroke", "#333")
                .attr("stroke-width", 1);
            
            bubbleEnter.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", ".35em")
                .style("font-size", "14px")
                .text(d => d);

            bubble.select("text").text(d => d);
        });

        // Draw Market Bubbles (Ingredients for sale)
        node.each(function(nodeData) {
            const g = d3.select(this);
            const marketData = nodeData.sellingIngredient ? [nodeData.sellingIngredient] : [];
            
            // Initialize quantity
            if (nodeData.sellingIngredient && typeof nodeData.buyQty === 'undefined') {
                nodeData.buyQty = 1;
            }

            const bubble = g.selectAll(".market-bubble")
                .data(marketData);
            
            bubble.exit().remove();

            const bubbleEnter = bubble.enter().append("g")
                .attr("class", "market-bubble")
                .attr("transform", "translate(-40, -40)");

            bubbleEnter.append("circle")
                .attr("r", 45)
                .attr("fill", "#fff")
                .attr("stroke", "#d4af37")
                .attr("stroke-width", 2);
            
            bubbleEnter.append("text")
                .attr("class", "market-icon market-text")
                .attr("text-anchor", "middle")
                .attr("dy", "-1.2em")
                .style("font-size", "20px")
                .text(d => d);

            bubbleEnter.append("text")
                .attr("class", "market-price market-text")
                .attr("text-anchor", "middle")
                .attr("dy", "-0.2em")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .text(`${ingredientPrices[nodeData.sellingIngredient] * nodeData.buyQty}💰`);

            // Quantity Controls
            const qtyGroup = bubbleEnter.append("g")
                .attr("transform", "translate(0, 10)");

            // Minus
            qtyGroup.append("circle")
                .attr("r", 10)
                .attr("cx", -20)
                .attr("fill", "#f0f0f0")
                .attr("stroke", "#ccc")
                .style("cursor", "pointer")
                .on("click", function(event) {
                    event.stopPropagation();
                    if (nodeData.buyQty > 1) {
                        nodeData.buyQty--;
                        update();
                    }
                });
            
            qtyGroup.append("text")
                .attr("class", "qty-minus market-text")
                .attr("text-anchor", "middle")
                .attr("x", -20)
                .attr("dy", "0.3em")
                .style("font-size", "14px")
                .style("pointer-events", "none")
                .text("-");

            // Qty Text
            qtyGroup.append("text")
                .attr("class", "qty-text market-text")
                .attr("text-anchor", "middle")
                .attr("dy", "0.3em")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .text(nodeData.buyQty);

            // Plus
            qtyGroup.append("circle")
                .attr("r", 10)
                .attr("cx", 20)
                .attr("fill", "#f0f0f0")
                .attr("stroke", "#ccc")
                .style("cursor", "pointer")
                .on("click", function(event) {
                    event.stopPropagation();
                    nodeData.buyQty++;
                    update();
                });

            qtyGroup.append("text")
                .attr("class", "qty-plus market-text")
                .attr("text-anchor", "middle")
                .attr("x", 20)
                .attr("dy", "0.3em")
                .style("font-size", "14px")
                .style("pointer-events", "none")
                .text("+");

            // Buy Button
            const buyBtn = bubbleEnter.append("g")
                .attr("class", "buy-btn")
                .attr("transform", "translate(0, 30)")
                .style("cursor", "pointer")
                .on("click", function(event) {
                    event.stopPropagation();
                    buyIngredient(nodeData.sellingIngredient, nodeData.buyQty);
                });

            buyBtn.append("rect")
                .attr("x", -25)
                .attr("y", -10)
                .attr("width", 50)
                .attr("height", 20)
                .attr("rx", 5)
                .attr("fill", "#78a865");

            buyBtn.append("text")
                .attr("text-anchor", "middle")
                .attr("dy", "0.3em")
                .style("fill", "white")
                .style("font-size", "12px")
                .style("font-weight", "bold")
                .text("BUY");

            const merged = bubble.merge(bubbleEnter);
            merged.select(".market-icon").text(d => d);
            merged.select(".qty-text").text(nodeData.buyQty);
            merged.select(".market-price").text(`${ingredientPrices[nodeData.sellingIngredient] * nodeData.buyQty}💰`);
        });

        // Draw Node Labels
        nodeLabel = nodeLabelGroup.selectAll("text")
            .data(data.nodes, d => d.id)
            .join("text")
            .attr("class", "node-label")
            .attr("dx", 18).attr("dy", 5)
            .text(d => d.id);

        // --- Draw Relationship Change Indicators ---
        const indicators = indicatorGroup.selectAll(".indicator")
            .data(data.links.filter(d => d.change), d => d.source.id + d.target.id); // Use a key

        indicators.exit().remove();

        const indicatorsEnter = indicators.enter().append("text")
            .attr("class", "indicator")
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .attr("dy", ".35em");

        indicators.merge(indicatorsEnter)
            .attr("fill", d => d.change === 'up' ? 'green' : 'red')
            .text(d => d.change === 'up' ? '▲' : '▼');

        // Restart simulation with new data
        simulation.nodes(data.nodes);
        simulation.force("link").links(data.links);
        simulation.alpha(1).restart();
    }

    function checkDrop(x, y, item, type) {
        // Find element under mouse
        const targetEl = document.elementFromPoint(x, y);
        if (!targetEl) return;

        if (type === 'potion') {
            // Check if it's part of a node
            const nodeEl = targetEl.closest(".node");
            if (nodeEl) {
                const d = d3.select(nodeEl).datum();
                if (d && d.ailment === item) {
                    if (actions <= 0) {
                        showMessage("No actions left! Finish up for the day.");
                        return;
                    }

                    // Success!
                    actions--;
                    gold += 5;
                    inventory[item]--;
                    d.ailment = null;
                    if (dailyShopPeople) {
                        const entry = dailyShopPeople.find(e => e.node === d);
                        if (entry) entry.cured = true;
                    }

                    // Increase relationship
                    showMessage(`${d.id} is pleased with their potion.`);
                    const link = findLink(playerName, d.id);
                    if (link) {
                        link.strength++;
                        d.relationshipStrength = link.strength; // Sync with registry
                        showRelationshipChange(link, 'up');
                    }

                    updateInventoryUI();
                }
            }
        }
    }

    function updateVisibleTownspeople() {
        // Clear state from all registry members
        townspeopleRegistry.forEach(n => {
            delete n.ailment;
            delete n.sellingIngredient;
            delete n.buyQty;
        });

        // Select and assign ailments once per day; reuse on return visits
        if (!dailyShopPeople) {
            const selected = [...townspeopleRegistry].sort(() => 0.5 - Math.random()).slice(0, 3);
            dailyShopPeople = selected.map(n => ({
                node: n,
                ailment: ailments[Math.floor(Math.random() * ailments.length)]
            }));
        }

        dailyShopPeople.forEach(({ node, ailment, cured }) => {
            if (!cured) {
                node.ailment = ailment;
            }
        });
        const selected = dailyShopPeople.map(e => e.node);

        // Update nodes (Keep Player & Pet)
        const playerNode = data.nodes.find(n => n.id === playerName);
        const petNode = data.nodes.find(n => n.id === petName);
        data.nodes = [playerNode, petNode, ...selected];

        // Update links
        const playerPetLink = findLink(playerName, petName);

        const newLinks = selected.map(n => ({
            source: playerNode,
            target: n,
            strength: n.relationshipStrength
        }));

        // Add visible community links
        const visibleNodeIds = new Set([playerNode.id, petNode.id, ...selected.map(n => n.id)]);
        const visibleCommunityLinks = communityLinks.filter(l => 
            visibleNodeIds.has(l.source.id) && visibleNodeIds.has(l.target.id)
        );

        data.links = [playerPetLink, ...newLinks, ...visibleCommunityLinks];
        update();
    }

    // Initial render
    updateInventoryUI();

    // --- 4. UPDATE LOOP ---
    simulation.on("tick", () => {
        // Update link positions
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);

        // Update link label positions (midpoint of line)
        linkLabel
            .attr("x", d => (d.source.x + d.target.x) / 2)
            .attr("y", d => (d.source.y + d.target.y) / 2);

        // Update node positions
        // Since node is now a group <g>, we use transform instead of cx/cy
        node.attr("transform", d => `translate(${d.x},${d.y})`);

        // Update node label positions
        nodeLabel
            .attr("x", d => d.x)
            .attr("y", d => d.y);

        // Update indicator positions
        indicatorGroup.selectAll(".indicator")
            .attr("x", d => (d.source.x + d.target.x) / 2 + 35) // Offset from the relationship label
            .attr("y", d => (d.source.y + d.target.y) / 2);
    });

    // --- 5. UI LOGIC ---
    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) nextBtn.style.display = 'none';

    const controlBar = d3.select("body").append("div")
        .attr("id", "control-bar");
    
    controlBar.append("button").text("Go to Market (1⚡)").on("click", goToMarket);
    controlBar.append("button").text("Go to Shop (1⚡)").on("click", goToShop);
    controlBar.append("button").text("Go to Bed").on("click", goToBed);

    // --- MARKET LOGIC ---

    // --- GAME LOOP / STATE MANAGEMENT ---
    function updateMarketTownspeople() {
        // Clear state from all registry members
        townspeopleRegistry.forEach(n => {
            delete n.ailment;
            delete n.sellingIngredient;
            delete n.buyQty;
        });

        // Select and assign ingredients once per day; reuse on return visits
        if (!dailyMarketPeople) {
            const selected = [...townspeopleRegistry].sort(() => 0.5 - Math.random()).slice(0, 4);
            dailyMarketPeople = selected.map(n => ({
                node: n,
                ingredient: n.heldIngredient || ingredients[Math.floor(Math.random() * ingredients.length)]
            }));
        }

        dailyMarketPeople.forEach(({ node, ingredient }) => {
            node.sellingIngredient = ingredient;
        });
        const selected = dailyMarketPeople.map(e => e.node);

        // Update nodes (Keep Player & Pet)
        const playerNode = data.nodes.find(n => n.id === playerName);
        const petNode = data.nodes.find(n => n.id === petName);
        data.nodes = [playerNode, petNode, ...selected];

        // Update links
        const playerPetLink = findLink(playerName, petName);

        const newLinks = selected.map(n => ({
            source: playerNode,
            target: n,
            strength: n.relationshipStrength
        }));

        const visibleNodeIds = new Set([playerNode.id, petNode.id, ...selected.map(n => n.id)]);
        const visibleCommunityLinks = communityLinks.filter(l => 
            visibleNodeIds.has(l.source.id) && visibleNodeIds.has(l.target.id)
        );

        data.links = [playerPetLink, ...newLinks, ...visibleCommunityLinks];
        update();
    }

    function buyIngredient(ing, qty = 1) {
        const totalCost = ingredientPrices[ing] * qty;
        if (actions <= 0) {
            showMessage("No actions left! Finish up for the day.");
            return;
        }
        if (gold >= totalCost) {
            gold -= totalCost;
            ingredientInventory[ing] += qty;
            dailyIngredientBuys[ing] = (dailyIngredientBuys[ing] || 0) + qty;
            updateInventoryUI();
            showMessage(`Bought ${qty} ${ing} for ${totalCost} gold.`);
        } else {
            showMessage(`Not enough gold! Need ${totalCost}.`);
        }
    }

    function goToMarket() {
        if (actions < 1) {
            showMessage("Not enough actions!");
            return;
        }
        actions--;
        updateInventoryUI();
        
        // UI
        document.body.classList.add('market-bg');
        document.body.classList.remove('shop-bg', 'bed-bg');
        ingredientsBody.classed("open", true);
        potionsBody.classed("open", false);
        d3.selectAll(".interaction-menu").remove();
        introductionSource = null;
        
        updateMarketTownspeople();
        showMessage("Welcome to the Market!");
    }

    function goToShop() {
        if (actions < 1) {
            showMessage("Not enough actions!");
            return;
        }
        actions--;
        updateInventoryUI();
        
        // UI
        document.body.classList.add('shop-bg');
        document.body.classList.remove('market-bg', 'bed-bg');
        potionsBody.classed("open", true);
        ingredientsBody.classed("open", false);
        d3.selectAll(".interaction-menu").remove();
        introductionSource = null;
        
        updateVisibleTownspeople();
        showMessage("The Shop is open!");
    }

    function goToBed() {
        // --- Relationship Decrease for ignored customer ---
        data.nodes.filter(n => n.group === 2 && n.ailment).forEach(ignoredCustomer => {
            showMessage(`${ignoredCustomer.id}: Where's my potion? 😠`);
            
            const link = findLink(playerName, ignoredCustomer.id);
            if (link && link.strength > 1) { // Don't go below 1
                link.strength--;
                ignoredCustomer.relationshipStrength = link.strength;
                showRelationshipChange(link, 'down');
            }
        });

        // --- Pet Logic: Check if neglected ---
        if (!petInteractedToday) {
            const link = findLink(playerName, petName);
            if (link) {
                if (link.strength > 1) {
                    link.strength--;
                    showRelationshipChange(link, 'down');
                }
                showMessage(`${petName} looks sad you didn't play with them. 😢`);
            }
        }

        // Adjust ingredient prices based on today's demand
        if (dailyMarketPeople) {
            const availableToday = new Set(dailyMarketPeople.map(e => e.ingredient));
            availableToday.forEach(ing => {
                const bought = dailyIngredientBuys[ing] || 0;
                if (bought >= 2) {
                    ingredientPrices[ing] = Math.min(ingredientPrices[ing] + 1, 10);
                } else if (bought === 0) {
                    ingredientPrices[ing] = Math.max(ingredientPrices[ing] - 1, 1);
                }
            });
        }
        ingredients.forEach(i => dailyIngredientBuys[i] = 0);

        // Reset
        actions = 10;
        petInteractedToday = false;
        dailyMarketPeople = null;
        dailyShopPeople = null;
        updateInventoryUI();
        
        // UI
        document.body.classList.add('bed-bg');
        document.body.classList.remove('market-bg', 'shop-bg');
        d3.selectAll(".interaction-menu").remove();
        introductionSource = null;
        
        updateHomeNodes();
        showMessage("Good night! Actions restored.");
    }

    function updateHomeNodes() {
        // Clear ailments and selling ingredients
        townspeopleRegistry.forEach(n => {
            delete n.ailment;
            delete n.sellingIngredient;
        });

        const playerNode = data.nodes.find(n => n.id === playerName);
        const petNode = data.nodes.find(n => n.id === petName);
        data.nodes = [playerNode, petNode];

        const playerPetLink = findLink(playerName, petName);

        data.links = [playerPetLink];
        update();
    }

    // Start the game at home
    document.body.classList.add('bed-bg');
    document.body.classList.remove('market-bg', 'shop-bg');
    updateHomeNodes();

    // --- INTERACTION LOGIC ---
    function showInteractionMenu(x, y, d) {
        d3.selectAll(".interaction-menu").remove(); // Close existing

        const menu = d3.select("body").append("div")
            .attr("class", "interaction-menu")
            .style("left", x + "px")
            .style("top", y + "px");

        if (d.id === petName) {
            menu.append("button").text("Pat").on("click", () => {
                interactWithPet("Pat");
                menu.remove();
            });

            menu.append("button").text("Feed").on("click", () => {
                interactWithPet("Feed");
                menu.remove();
            });
        } else {
            menu.append("button").text("Chat").on("click", () => {
                interactWithCharacter(d);
                menu.remove();
            });
        }

        // Introduce Option
        const link = findLink(playerName, d.id);
        if (link && link.strength >= 3) {
            menu.append("button").text("Introduce").on("click", () => {
                startIntroduction(d);
                menu.remove();
            });
        }
    }

    function startIntroduction(d) {
        if (actions > 0) {
            actions--;
            updateInventoryUI();
            introductionSource = d;
            showMessage(`Who should we introduce ${d.id} to?`);
        } else {
            showMessage("Not enough actions!");
        }
    }

    function completeIntroduction(target) {
        if (target.id === introductionSource.id) {
            showMessage("You can't introduce someone to themselves.");
            introductionSource = null;
            return;
        }

        const link = findLink(playerName, target.id);

        if (link && link.strength >= 3) {
            const existingLink = findLink(introductionSource.id, target.id);

            if (existingLink) {
                showMessage(`${introductionSource.id} and ${target.id} already know each other.`);
            } else {
                const newLink = { source: introductionSource, target: target, strength: 1 };
                data.links.push(newLink);
                communityLinks.push(newLink);

                // Boost relationship with target
                link.strength++;
                target.relationshipStrength = link.strength;
                showRelationshipChange(link, 'up');

                // Boost relationship with source
                const sourceLink = findLink(playerName, introductionSource.id);
                if (sourceLink) {
                    sourceLink.strength++;
                    introductionSource.relationshipStrength = sourceLink.strength;
                    showRelationshipChange(sourceLink, 'up');
                }

                update();
                showMessage(`You introduced ${introductionSource.id} to ${target.id}!`);
            }
        } else {
            showMessage(`You don't know ${target.id} well enough.`);
        }
        introductionSource = null;
    }

    function interactWithPet(action) {
        if (actions > 0) {
            actions--;
            petInteractedToday = true;
            updateInventoryUI();
            
            const link = findLink(playerName, petName);
            if (link) {
                link.strength++;
                showRelationshipChange(link, 'up');
            }
            const pastTense = action === 'Feed' ? 'fed' : `${action.toLowerCase()}ted`;
            showMessage(`You ${pastTense} ${petName}. Relationship up! ❤️`);
        } else {
            showMessage("Not enough actions!");
        }
    }

    function interactWithCharacter(d) {
        if (actions > 0) {
            actions--;
            updateInventoryUI();
            
            const link = findLink(playerName, d.id);
            if (link) {
                link.strength++;
                d.relationshipStrength = link.strength;
                showRelationshipChange(link, 'up');
            }
            showMessage(`You chatted with ${d.id}. Relationship up! 💬`);
        } else {
            showMessage("Not enough actions!");
        }
    }

    // Close pet menu when clicking elsewhere
    d3.select("body").on("click.interactionMenu", (event) => {
        if (!event.target.closest(".interaction-menu")) {
            d3.selectAll(".interaction-menu").remove();
            if (introductionSource) {
                introductionSource = null;
                showMessage("Introduction cancelled.");
            }
        }
    });

    // --- 5. DRAG FUNCTIONS ---
    function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    function getRelationshipLabel(strength) {
        if (strength <= 2) return "Don't Know Well";
        if (strength <= 5) return "Acquaintances";
        if (strength <= 9) return "Friends";
        if (strength <= 14) return "Close Friends";
        return "Best Friends";
    }
}