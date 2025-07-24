       const splashScreen = document.getElementById('splash-screen');
        const graphContainer = document.querySelector('.graph-container');
        const startGameBtn = document.getElementById('start-game-btn');
        const peopleSlider = document.getElementById('people-slider');
        const eventSlider = document.getElementById('event-slider');
        const peopleValueSpan = document.getElementById('people-value');
        const eventValueSpan = document.getElementById('event-value');
        const winDialog = document.getElementById('win-dialog');
        const restartGameBtn = document.getElementById('restart-game-btn');
        const closeDialogBtn = document.getElementById('close-dialog-btn');
        let randomEventInterval; 

        // --- Event Listeners for Controls ---
        peopleSlider.addEventListener('input', (e) => { peopleValueSpan.textContent = e.target.value; });
        eventSlider.addEventListener('input', (e) => { eventValueSpan.textContent = e.target.value; });
        
        startGameBtn.addEventListener('click', () => {
            splashScreen.style.display = 'none';
            graphContainer.style.display = 'block';
            const numNodes = parseInt(peopleSlider.value, 10);
            const eventFrequency = parseInt(eventSlider.value, 10) * 1000;
            if(randomEventInterval) clearInterval(randomEventInterval);
            initializeGame(numNodes, eventFrequency);
        });
        
        restartGameBtn.addEventListener('click', () => {
            winDialog.style.display = 'none';
            graphContainer.style.display = 'none';
            splashScreen.style.display = 'flex';
        });

        closeDialogBtn.addEventListener('click', () => {
            winDialog.style.display = 'none';
        });

        function initializeGame(numNodes, eventFrequency) {
            d3.select("#relationship-graph").selectAll("*").remove();

            const names = ["Alex", "Ben", "Chloe", "David", "Eva", "Frank", "Grace", "Henry", "Ivy", "Jack", "Kate", "Leo", "Mia", "Noah", "Olivia", "Paul", "Quinn", "Ruby", "Sam", "Tara"];
            const nodes = Array.from({ length: numNodes }, (_, i) => ({ id: i, name: names[i] || `Person ${i + 1}` }));
            const links = [];

            nodes.forEach(sourceNode => {
                const otherNodes = nodes.filter(n => n.id !== sourceNode.id);
                const shuffledNodes = d3.shuffle(otherNodes.slice());
                const numRelationships = Math.min(2, otherNodes.length); 
                const relationships = shuffledNodes.slice(0, numRelationships);
                relationships.forEach(targetNode => {
                    // Ensure unique links and avoid self-loops
                    if (!links.find(l => (l.source === sourceNode.id && l.target === targetNode.id) || (l.source === targetNode.id && l.target === sourceNode.id))) {
                        links.push({ source: sourceNode.id, target: targetNode.id, score: Math.floor(Math.random() * 9) + 1 });
                    }
                });
            });

            const svg = d3.select("#relationship-graph");
            let width = svg.node().getBoundingClientRect().width;
            let height = svg.node().getBoundingClientRect().height;
            const color = d3.scaleOrdinal(d3.schemeCategory10);

            const simulation = d3.forceSimulation(nodes)
                .force("link", d3.forceLink(links).id(d => d.id).distance(d => 350 - d.score * 15))
                .force("charge", d3.forceManyBody().strength(-800))
                .force("center", d3.forceCenter(width / 2, height / 2))
                .force("collide", d3.forceCollide().radius(40));

            let linkGroup = svg.append("g").attr("class", "links").selectAll("g.link-group")
                .data(links, l => `${l.source.id}-${l.target.id}`).enter().append("g").attr("class", "link-group");
            linkGroup.append("line").attr("class", "link-line");
            linkGroup.append("path").attr("class", "arrowhead").attr("d", "M -8,-4 L 0,0 L -8,4 Z").attr("fill", d => color(d.source.id));

            const nodeElements = svg.append("g").attr("class", "nodes").selectAll("g")
                .data(nodes).enter().append("g").attr("class", "node").call(drag(simulation));
            nodeElements.append("circle").attr("r", 30).attr("fill", d => color(d.id));
            nodeElements.append("text").attr("dy", "0.3em").attr("text-anchor", "middle").text(d => d.name);

            let selectedNode = null;
            const infoBox = d3.select("#relationship-info-box");
            const relationshipList = d3.select("#relationship-list");
            const messageBox = d3.select("#message-box");
            let messageTimeout;

            function hideInfoBox() { infoBox.style("display", "none"); }
            function showRelationshipInfo(event, d) {
                infoBox.style("display", "flex").select("#info-box-title").text(`${d.name}'s Relationships`);
                relationshipList.html("");
                links.filter(l => l.source.id === d.id).forEach(link => relationshipList.append("li").text(`→ ${link.target.name} (Score: ${link.score})`));
                links.filter(l => l.target.id === d.id).forEach(link => relationshipList.append("li").text(`← ${link.source.name} (Score: ${link.score})`));
            }
            function showMessage(message) {
                clearTimeout(messageTimeout);
                messageBox.text(message).classed("show", true);
                messageTimeout = setTimeout(() => messageBox.classed("show", false), 2500);
            }

            function updateLinkAppearance() {
                const strongestScores = new Map();
                nodes.forEach(node => {
                    const outboundLinks = links.filter(l => l.source.id === node.id);
                    strongestScores.set(node.id, d3.max(outboundLinks, l => l.score));
                });

                svg.selectAll('.link-line').each(function(d) {
                    const linkLine = d3.select(this);

                    const isStrongestForSource = d.score > 0 && d.score === strongestScores.get(d.source.id);
                    const reciprocalLink = links.find(l => l.source.id === d.target.id && l.target.id === d.source.id);
                    
                    let isStrongestForTarget = false;
                    if (reciprocalLink) {
                        isStrongestForTarget = reciprocalLink.score > 0 && reciprocalLink.score === strongestScores.get(d.target.id);
                    }

                    // A link is thick if it's the strongest for either person in the relationship
                    const strokeWidth = (isStrongestForSource || isStrongestForTarget) ? 4 : 2;

                    // Color logic remains: gold for mutual strongest, source color for one-way strongest
                    let strokeColor = '#999'; // Default grey
                    if (reciprocalLink && isStrongestForSource && isStrongestForTarget) {
                        strokeColor = 'gold';
                    } else if (isStrongestForSource) {
                        strokeColor = color(d.source.id);
                    }
                    
                    linkLine.attr('stroke-width', strokeWidth).attr('stroke', strokeColor);
                });
            }

            function checkWinCondition() {
                const strongestScores = new Map();
                nodes.forEach(node => {
                    const outboundLinks = links.filter(l => l.source.id === node.id);
                    strongestScores.set(node.id, d3.max(outboundLinks, l => l.score) || 0);
                });

                const goldenLinkCounts = new Map();
                nodes.forEach(node => goldenLinkCounts.set(node.id, 0));
                const processedPairs = new Set(); // To avoid double-counting pairs

                links.forEach(link => {
                    const sourceId = link.source.id;
                    const targetId = link.target.id;

                    // Create a canonical key for the pair to ensure each pair is processed once
                    const pairKey = sourceId < targetId ? `${sourceId}-${targetId}` : `${targetId}-${sourceId}`;
                    if (processedPairs.has(pairKey)) return;

                    const reciprocalLink = links.find(l => l.source.id === targetId && l.target.id === sourceId);
                    if (!reciprocalLink) return; // No reciprocal link, not a pair

                    const isStrongestForSource = link.score > 0 && link.score === strongestScores.get(sourceId);
                    const isStrongestForTarget = reciprocalLink.score > 0 && reciprocalLink.score === strongestScores.get(targetId);

                    if (isStrongestForSource && isStrongestForTarget) {
                        goldenLinkCounts.set(sourceId, goldenLinkCounts.get(sourceId) + 1);
                        goldenLinkCounts.set(targetId, goldenLinkCounts.get(targetId) + 1);
                    }
                    processedPairs.add(pairKey);
                });

                let nodesWithWrongCount = 0;
                goldenLinkCounts.forEach(count => {
                    // Each person should ideally be part of exactly one "golden" pair
                    if (count !== 1) {
                        nodesWithWrongCount++;
                    }
                });

                // Win condition: For an even number of nodes, all should have 1 golden link.
                // For an odd number of nodes, one node will have 0 (the un-paired one), and others will have 1.
                // This logic assumes a perfect matching scenario.
                const winConditionMet = (nodes.length % 2 === 0) ? (nodesWithWrongCount === 0) : (nodesWithWrongCount === 1);

                if (winConditionMet) {
                    clearInterval(randomEventInterval); // Stop random events
                    winDialog.style.display = 'flex'; // Show win dialog
                }
            }

            function handleClick(event, d) {
                // Check if it was a click (not a drag)
                if (!d.isClick) return;

                const clickedElement = d3.select(event.currentTarget);

                // If a node is already selected and it's not the same node clicked again
                if (selectedNode && selectedNode.node !== d) {
                    let existingLink = links.find(l => l.source.id === selectedNode.node.id && l.target.id === d.id);
                    // Determine score change based on mode (strengthen or weaken)
                    let scoreChange = selectedNode.mode === 'strengthen' ? Math.floor(Math.random() * 5) - 1 : Math.floor(Math.random() * 5) - 3;
                    
                    if (existingLink) {
                        // Update existing link score, keeping it between 1 and 9
                        existingLink.score = Math.max(1, Math.min(9, existingLink.score + scoreChange));
                        let desc = scoreChange > 0 ? `increased` : (scoreChange < 0 ? `decreased` : `remained the same`);
                        showMessage(`Relationship from ${selectedNode.node.name} to ${d.name} ${desc} to ${existingLink.score}!`);
                    } else {
                        // Create a new link with an initial score
                        links.push({ source: selectedNode.node.id, target: d.id, score: Math.max(1, 5 + scoreChange) });
                        showMessage(`New relationship formed from ${selectedNode.node.name} to ${d.name}!`);
                    }
                    
                    // Reset highlighting and selected node
                    svg.selectAll(".node").classed("highlight-strengthen highlight-weaken", false);
                    selectedNode = null;
                    
                    // Re-bind link data to update graph
                    let currentLinkSelection = svg.select(".links").selectAll("g.link-group").data(links, l => `${l.source.id}-${l.target.id}`);
                    currentLinkSelection.exit().remove(); // Remove old links
                    const newLinkGroups = currentLinkSelection.enter().append("g").attr("class", "link-group"); // Add new links
                    newLinkGroups.append("line").attr("class", "link-line");
                    newLinkGroups.append("path").attr("class", "arrowhead").attr("d", "M -8,-4 L 0,0 L -8,4 Z").attr("fill", d => color(d.source.id));
                    linkGroup = newLinkGroups.merge(currentLinkSelection); // Merge for updates
                    
                    // Update simulation with new links and restart
                    simulation.force("link").links(links);
                    simulation.alpha(1).restart();
                    updateLinkAppearance(); // Update link colors/widths
                    checkWinCondition(); // Check if game is won
                } else if (selectedNode && selectedNode.node === d) {
                    // If the same node is clicked again, toggle mode or deselect
                    if (selectedNode.mode === 'strengthen') {
                        selectedNode.mode = 'weaken';
                        clickedElement.classed('highlight-strengthen', false).classed('highlight-weaken', true);
                    } else {
                        selectedNode = null;
                        clickedElement.classed('highlight-weaken', false);
                    }
                } else {
                    // Select a new node in 'strengthen' mode
                    svg.selectAll(".node").classed("highlight-strengthen highlight-weaken", false);
                    selectedNode = { node: d, mode: 'strengthen' };
                    clickedElement.classed('highlight-strengthen', true);
                }
            }

            function handleRandomEvent() {
                if (nodes.length < 2) return; // Need at least two nodes for an event
                let sourceNode = nodes[Math.floor(Math.random() * nodes.length)];
                let targetNode = nodes[Math.floor(Math.random() * nodes.length)];
                // Ensure source and target are different
                while (sourceNode === targetNode) targetNode = nodes[Math.floor(Math.random() * nodes.length)];

                let existingLink = links.find(l => l.source.id === sourceNode.id && l.target.id === targetNode.id);
                if (existingLink) {
                    // Randomly change score for existing link
                    const scoreChange = Math.floor(Math.random() * 5) - 1; // -1 to 3
                    existingLink.score = Math.max(1, Math.min(9, existingLink.score + scoreChange));
                    let desc = scoreChange > 0 ? `increased` : (scoreChange < 0 ? `decreased` : `remained the same`);
                    showMessage(`Random event: ${sourceNode.name}'s feelings for ${targetNode.name} ${desc} to ${existingLink.score}!`);
                } else {
                    // Create a new link with an initial score of 1
                    links.push({ source: sourceNode.id, target: targetNode.id, score: 1 });
                    showMessage(`Random event: ${sourceNode.name} developed feelings for ${targetNode.name}!`);
                }
                
                // Update D3 links and restart simulation
                let currentLinkSelection = svg.select(".links").selectAll("g.link-group").data(links, l => `${l.source.id}-${l.target.id}`);
                currentLinkSelection.exit().remove();
                const newLinkGroups = currentLinkSelection.enter().append("g").attr("class", "link-group");
                newLinkGroups.append("line").attr("class", "link-line");
                newLinkGroups.append("path").attr("class", "arrowhead").attr("d", "M -8,-4 L 0,0 L -8,4 Z").attr("fill", d => color(d.source.id));
                linkGroup = newLinkGroups.merge(currentLinkSelection);
                simulation.force("link").links(links);
                simulation.alpha(1).restart();
                updateLinkAppearance();
                checkWinCondition();
            }

            // Update positions of nodes and links on each simulation tick
            simulation.on("tick", () => {
                linkGroup.each(function(d) {
                    const line = d3.select(this).select(".link-line"), arrow = d3.select(this).select(".arrowhead");
                    const sx = d.source.x, sy = d.source.y, tx = d.target.x, ty = d.target.y;
                    line.attr("x1", sx).attr("y1", sy).attr("x2", tx).attr("y2", ty);
                    // Position arrowhead at the midpoint of the link
                    const midX = (sx + tx) / 2, midY = (sy + ty) / 2;
                    // Calculate angle for arrowhead rotation
                    const angle = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI;
                    // Scale arrowhead based on link score
                    const scale = 0.8 + d.score * 0.1;
                    arrow.attr("transform", `translate(${midX},${midY}) rotate(${angle}) scale(${scale})`);
                });
                nodeElements.attr("transform", d => `translate(${d.x},${d.y})`);
            });

            // Drag behavior for nodes
            function drag(simulation) {
                function dragstarted(event, d) {
                    d.isClick = true; // Flag to distinguish click from drag
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y; // Fix node position on drag start
                }
                function dragged(event, d) { 
                    d.isClick = false; // It's a drag, not a click
                    d.fx = event.x; d.fy = event.y; 
                }
                function dragended(event, d) {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null; d.fy = null; // Unfix node position on drag end
                }
                return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
            }
            
            // Handle window resize to keep graph centered
            window.addEventListener('resize', () => {
                width = svg.node().getBoundingClientRect().width;
                height = svg.node().getBoundingClientRect().height;
                simulation.force("center", d3.forceCenter(width / 2, height / 2)).alpha(0.3).restart();
            });

            // Attach event listeners to node elements
            nodeElements.on("click", handleClick);
            nodeElements.on("mouseover", showRelationshipInfo);
            nodeElements.on("mouseout", hideInfoBox);

            // Initial update of link appearance and start random events
            updateLinkAppearance();
            randomEventInterval = setInterval(handleRandomEvent, eventFrequency);
        }