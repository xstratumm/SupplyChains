"use strict";

var cursor_x = -1;
var cursor_y = -1;
document.onmousemove = function(event) {
    cursor_x = event.pageX;
    cursor_y = event.pageY;
}

function apiRequest(reqType, URL, data) {
    let xhr = new XMLHttpRequest();
    xhr.open(reqType, URL, false);

    if (reqType == "POST") {
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.send(JSON.stringify(data));
    } else {
        xhr.send();
    }

    return JSON.parse(xhr.response);
}

let nodes = apiRequest("GET", "api/getnodes");
let links = apiRequest("GET", "api/getlinks");
let graph = { nodes: nodes, links: links };

function arrResToUL(arr, s) {
    let str = "<ul " + s + " >";
    arr.forEach((a) => {
        str += "<li>" + a.quantity + " " + a.name + "</li>";
    });
    str += "</ul>";
    return str;
}

function arrResToArrStr(arr) {
    let str = [];
    arr.forEach((a) => {
        str.push(a.quantity + " " + a.name);
    });
    return str;
}

function radians_to_degrees(radians) {
    var pi = Math.PI;
    return radians * (180 / pi);
}

function giveN(El, n) {
    El.setAttribute("n", n);
    if (El.childNodes[0].tagName == undefined) return;
    El.childNodes.forEach((child) => { giveN(child, n); });
}

const triggerEvent = (el, eventType, detail) =>
    el.dispatchEvent(new CustomEvent(eventType, { detail }));

drawGraph(graph);

let resources = new Set();

setResources(graph, resources);

function drawGraph(graph) {
    let radius = 30;
    let svg = document.getElementById('graph');
    svg.innerHTML = `<defs><!-- A marker to be used as an arrowhead -->
    <marker id="arrow" viewBox="0 0 10 10" refX="4" refY="2.5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path fill="#4C8EDA" d="M 0 0 L 5 2.5 L 0 5 z" /></marker>
    <marker id="arrowOptimized" viewBox="0 0 10 10" refX="4" refY="2.5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path fill="#ffbb00" d="M 0 0 L 5 2.5 L 0 5 z" /></marker>
    <marker id="arrowNew" viewBox="0 0 10 10" refX="4" refY="2.5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path fill="purple" d="M 0 0 L 5 2.5 L 0 5 z" /></marker>
    </defs>`;
    let width = 960,
        height = 500;
    svg.setAttribute('viewBox', (-width / 2) + " " + (-height / 2) + " " + (width) + " " + (height));
    svg.style.height = (window.innerHeight - 10) + "px";
    let nodesEl = Array();
    let nodesTextsEl = Array();
    let linksEl = Array();
    let nodesIds = Array();
    let modalsLinks = Array();
    let modalsNodes = Array();
    document.querySelectorAll(".modal").forEach((modal) => {
        document.body.removeChild(modal);
    });
    graph.nodes.forEach((element) => { nodesIds.push(element.id); });
    graph.links.forEach((element, index) => {
        let textElArray = [];
        let textArray = arrResToArrStr(element.transferedRes);
        let g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        textArray.forEach((el, index) => {
            textElArray.push(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
            textElArray[index].innerHTML = el;
            //g.appendChild(textElArray[index]);
        });
        linksEl.push({ line: document.createElementNS('http://www.w3.org/2000/svg', 'line'), text: textElArray, g: g, start: nodesIds.indexOf(element.source), end: nodesIds.indexOf(element.target) });
        linksEl[index].line.classList.add("link");
        linksEl[index].line.setAttribute("id", (element.source) + "/" + (element.target));
        linksEl[index].g.appendChild(linksEl[index].line);
        if (element.optimized == true) {
            linksEl[index].line.classList.add("optimized");
        }
        if (element.new == true) {
            linksEl[index].line.classList.add("new");
        }
        svg.appendChild(linksEl[index].g);

        let modal = document.createElement("div");
        modal.classList.add("modal")
            //modal.style.display = "none";
        modal.style.position = "fixed";
        modal.innerHTML = '<div style="margin: 0 auto; width: fit-content; height: 20px;"><svg style="margin: 0 auto; width: 20px; height: 20px;"><path fill="#e3f4ff" d="M 0 20 L 10 0 L 20 20 z" /></svg></div>'
        modal.innerHTML += '<div style="background-color: #e3f4ff;">' + "Transfers:" + arrResToUL(element.transferedRes, "") + "</div>";
        modalsLinks.push(modal);
        document.body.insertBefore(modal, svg);
    });
    graph.nodes.forEach((element, index) => {
        let modal = undefined;
        let textEl = undefined
        if (element.entryPoint != undefined) {
            element.fx = 0;
            element.fy = -height / 2 + radius;
            nodesEl.push(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'));
            nodesEl[index].setAttribute("x", -width / 2);
            nodesEl[index].setAttribute("y", -height / 2);
            nodesEl[index].setAttribute("width", width);
            nodesEl[index].setAttribute("height", radius * 2);
            let innerDiv = document.createElement('div');
            innerDiv.classList.add('entryExitDiv');
            innerDiv.classList.add('entryDiv');
            innerDiv.innerHTML = arrResToUL(element.giveRes, 'class = "entryExitPoint"');
            nodesEl[index].appendChild(innerDiv);
            giveN(innerDiv, element.id);
        } else
        if (element.exitPoint != undefined) {
            element.fx = 0;
            element.fy = height / 2 - radius;
            nodesEl.push(document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject'));
            nodesEl[index].setAttribute("x", -width / 2);
            nodesEl[index].setAttribute("y", height / 2 - radius * 2);
            nodesEl[index].setAttribute("width", width);
            nodesEl[index].setAttribute("height", radius * 2);
            let innerDiv = document.createElement('div');
            innerDiv.classList.add('entryExitDiv');
            innerDiv.classList.add('exitDiv');
            innerDiv.innerHTML = arrResToUL(element.neededRes, 'class = "entryExitPoint"');
            nodesEl[index].appendChild(innerDiv);
            giveN(innerDiv, element.id);
        } else {
            nodesEl.push(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
            nodesEl[index].setAttribute("r", radius);
            nodesEl[index].setAttribute("fill", "#9ecae1");
            modal = document.createElement("div");
            modal.classList.add("modal")
                //modal.style.display = "none";
            modal.style.position = "fixed";
            modal.innerHTML = '<div style="margin: 0 auto; width: fit-content; height: 20px;"><svg style="margin: 0 auto; width: 20px; height: 20px;"><path fill="#e3f4ff" d="M 0 20 L 10 0 L 20 20 z" /></svg></div>'
            modal.innerHTML += '<div style="background-color: #e3f4ff;">' + "Eats:" + arrResToUL(element.neededRes, "") + "Provides:" + arrResToUL(element.giveRes, "") + "</div>";
            textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.innerHTML = element.id;
        }
        modalsNodes.push(modal);
        nodesTextsEl.push(textEl);
        if (modal != undefined) {
            document.body.insertBefore(modal, svg);
        }
        nodesEl[index].classList.add("node");
        nodesEl[index].setAttribute("id", element.id);
        nodesEl[index].setAttribute("fill", "none");
        svg.appendChild(nodesEl[index]);
        if (textEl != undefined) {
            svg.appendChild(textEl);
        }
    });

    let linksCopy = JSON.parse(JSON.stringify(links));
    let nodesCopy = JSON.parse(JSON.stringify(nodes));
    const simulation = d3.forceSimulation(nodesCopy)
        .force("link", d3.forceLink(linksCopy).distance(100).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide((d) => (radius + 20)))
        .force("x", d3.forceX())
        .force("y", d3.forceY());


    simulation.on("tick", function() {

        function changePoseNode(node, index) {
            node.setAttribute("cx", simulation.nodes()[index].x);
            node.setAttribute("cy", simulation.nodes()[index].y);
            let boundBox = node.getBoundingClientRect();
            let modalWidth = modalsNodes[index].getBoundingClientRect().width;
            modalsNodes[index].style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
            modalsNodes[index].style.left = ((boundBox.left + boundBox.right - modalWidth) / 2) + "px";
            let textWidth = nodesTextsEl[index].getBoundingClientRect().width;
            let textHeight = nodesTextsEl[index].getBoundingClientRect().height;
            nodesTextsEl[index].setAttribute("x", simulation.nodes()[index].x - (textWidth / 3));
            nodesTextsEl[index].setAttribute("y", simulation.nodes()[index].y + (textHeight / 3) - 5);
        }

        function changePoseLink(link, index) {
            let x1 = simulation.nodes()[link.start].x,
                x2 = simulation.nodes()[link.end].x,
                y1 = simulation.nodes()[link.start].y,
                y2 = simulation.nodes()[link.end].y;
            let angle = Math.abs(Math.atan((y2 - y1) / (x2 - x1)));
            let r = radius;
            if (x1 < x2) {
                x1 += Math.cos(angle) * r;
                x2 -= Math.cos(angle) * r;
            } else {
                x1 -= Math.cos(angle) * r;
                x2 += Math.cos(angle) * r;
            }
            if (y1 < y2) {
                y1 += Math.sin(angle) * r;
                y2 -= Math.sin(angle) * r;
            } else {
                y1 -= Math.sin(angle) * r;
                y2 += Math.sin(angle) * r;
            }
            if (simulation.nodes()[link.start].entryPoint == true) y1 = -194;
            if (simulation.nodes()[link.end].exitPoint == true) y2 = 190;
            link.line.setAttribute("x1", x1);
            link.line.setAttribute("y1", y1);
            link.line.setAttribute("x2", x2);
            link.line.setAttribute("y2", y2);

            let boundBox = link.line.getBoundingClientRect();
            let modalWidth = modalsLinks[index].getBoundingClientRect().width;
            //modalsLinks[index].style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
            //modalsLinks[index].style.left = ((boundBox.left + boundBox.right - modalWidth) / 2) + "px";
        }

        nodesEl.forEach((node, index) => {
            if (node.tagName != "foreignObject") changePoseNode(node, index);
        });
        linksEl.forEach((link, index) => {
            changePoseLink(link, index);
        });
    });

    nodesEl.forEach((node, index) => {

        node.onmouseenter = function() {
            if (modalsNodes[index] != undefined) {
                modalsNodes[index].style.display = "block";
                let boundBox = node.getBoundingClientRect();
                let modalWidth = modalsNodes[index].getBoundingClientRect().width;
                modalsNodes[index].style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
                modalsNodes[index].style.left = ((boundBox.left + boundBox.right - modalWidth) / 2) + "px";
            }
        };

        node.onmouseleave = function() {
            if (modalsNodes[index] != undefined) {
                modalsNodes[index].style.display = "none";
                let boundBox = node.getBoundingClientRect();
                let modalWidth = modalsNodes[index].getBoundingClientRect().width;
                modalsNodes[index].style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
                modalsNodes[index].style.left = ((boundBox.left + boundBox.right - modalWidth) / 2) + "px";
            }
        };
    });

    linksEl.forEach((link, index) => {
        link.line.onmouseenter = function() {
            if (modalsLinks[index] != undefined) {
                modalsLinks[index].style.display = "block";
                /*let boundBox = link.line.getBoundingClientRect();
                let modalWidth = modalsLinks[index].getBoundingClientRect().width;
                modalsLinks[index].style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
                modalsLinks[index].style.left = ((boundBox.left + boundBox.right - modalWidth) / 2) + "px";*/
            }

        };

        link.line.onmouseleave = function() {
            if (modalsLinks[index] != undefined) {
                modalsLinks[index].style.display = "none";
                /*let boundBox = link.line.getBoundingClientRect();
                let modalWidth = modalsLinks[index].getBoundingClientRect().width;
                modalsLinks[index].style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
                modalsLinks[index].style.left = ((boundBox.left + boundBox.right - modalWidth) / 2) + "px";*/
            }
        };
    });

    document.onmousemove = function(event) {
        linksEl.forEach((link, index) => {
            if (modalsLinks[index] != undefined) {
                let boundBox = link.line.getBoundingClientRect();
                let modalWidth = modalsLinks[index].getBoundingClientRect().width;
                modalsLinks[index].style.top = event.pageY + "px";
                modalsLinks[index].style.left = (event.pageX - modalWidth / 2) + "px";
            }
        });
    };


    nodesEl.forEach((node, nodeIndex) => {
        node.addEventListener("click", function(event) {
            let menu = document.getElementById("contextMenu");
            menu.style.display = "block";
            let boundBox = node.getBoundingClientRect();
            menu.style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
            menu.style.left = (boundBox.left + boundBox.right + 100) / 2 + "px";
            document.getElementById("contextMenuButtonDelete").disabled = false;
            graph.nodes.forEach((node, index) => {
                if (node.id == event.target.id || event.target.getAttribute("n") == node.id) {
                    if (node.entryPoint == true || node.exitPoint == true) {
                        document.getElementById("contextMenuButtonDelete").disabled = true;
                        return;
                    }
                }
            });
            document.getElementById("contextMenuButtonDelete").onclick = function() {
                let isEntryExit = 0;
                graph.nodes.forEach((node, index) => {
                    if (node.id == event.target.id || event.target.getAttribute("n") == node.id) {
                        if (node.entryPoint == true || node.exitPoint == true) {
                            isEntryExit = 1;
                            return;
                        }
                        graph.nodes.splice(index, 1);
                    }
                });
                if (isEntryExit) {
                    menu.style.display = "none";
                    return;
                }
                for (let i = 0; i < graph.links.length; i++) {
                    if (graph.links[i].source == event.target.id || graph.links[i].target == event.target.id) {
                        graph.links.splice(i, 1);
                        i--;
                    }
                }
                drawGraph(graph);
                menu.style.display = "none";
            };
            document.getElementById("contextMenuButtonChange").onclick = function() {
                menu.style.display = "none";
                document.getElementById("changeNodeWindowWrap").style.display = "flex";
                let node = {};
                let index;
                let id;
                graph.nodes.forEach((n, i) => {
                    if (n.id == event.target.id || n.id == event.target.getAttribute("n")) {
                        node = graph.nodes[i];
                        index = i;
                        id = n.id;
                    };
                });
                document.getElementById("changeNodeWindow").childNodes.forEach((child) => {
                    if (child.style != undefined)
                        child.style.display = "block";
                    if (child.tagName == "DIV" || child.tagName == "BUTTON")
                        child.style.display = "inline";
                });
                if (node.entryPoint == true) {
                    document.getElementById("changeNodeNewResEatsText").style.display = "none";
                    document.getElementById("changeNodeNewResEats").style.display = "none";
                    document.getElementById("changeNodeResEats").style.display = "none";
                }
                if (node.exitPoint == true) {
                    document.getElementById("changeNodeNewResGivesText").style.display = "none";
                    document.getElementById("changeNodeNewResGives").style.display = "none";
                    document.getElementById("changeNodeResGives").style.display = "none";
                }
                let eatsLi = document.querySelectorAll("#changeNodeResEats li");
                let givesLi = document.querySelectorAll("#changeNodeResGives li");
                eatsLi.forEach((li, index) => {
                    if (index > 0)
                        li.parentElement.removeChild(li);
                    else {
                        li.querySelector("input").value = "";
                        li.querySelector("option").selected = "true";
                    }
                });
                givesLi.forEach((li, index) => {
                    if (index > 0)
                        li.parentElement.removeChild(li);
                    else {
                        li.querySelector("input").value = "";
                        li.querySelector("option").selected = "true";
                    }
                });
                node.neededRes.forEach((resource) => {
                    triggerEvent(document.getElementById("changeNodeNewResEats"), "click");
                });
                eatsLi = document.querySelectorAll("#changeNodeResEats li");
                node.neededRes.forEach((resource, index) => {
                    eatsLi[index].querySelector("input").value = resource.quantity;
                    let select = eatsLi[index].querySelector("select");
                    select.childNodes.forEach((child) => {
                        if (child.innerHTML == resource.name) child.selected = "true";
                    });
                });
                node.giveRes.forEach((resource) => {
                    triggerEvent(document.getElementById("changeNodeNewResGives"), "click");
                });
                givesLi = document.querySelectorAll("#changeNodeResGives li");
                node.giveRes.forEach((resource, index) => {
                    givesLi[index].querySelector("input").value = resource.quantity;
                    let select = givesLi[index].querySelector("select");
                    select.childNodes.forEach((child) => {
                        if (child.innerHTML == resource.name) child.selected = "true";
                    });
                });
                document.getElementById("changeNodeWindowButton").setAttribute("changing", id);
            };
        });
    });

    linksEl.forEach((link) => {
        link.line.addEventListener("click", function(event) {
            let menu = document.getElementById("contextMenu");
            menu.style.display = "block";
            let boundBox = link.line.getBoundingClientRect();
            menu.style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
            menu.style.left = (boundBox.left + boundBox.right + 50) / 2 + "px";
            document.getElementById("contextMenuButtonDelete").onclick = function() {
                for (let i = 0; i < graph.links.length; i++) {
                    let id = event.target.id.split("/");
                    if (graph.links[i].source == id[0] && graph.links[i].target == id[1]) {
                        graph.links.splice(i, 1);
                        i--;
                    }
                }
                drawGraph(graph);
                menu.style.display = "none";
            };
            document.getElementById("contextMenuButtonChange").onclick = function() {
                menu.style.display = "none";
                document.getElementById("addLinkWindowButton").innerHTML = "Change link";
                document.getElementById("addLinkWindowWrap").style.display = "flex";
                let link = {};
                let index;
                let id;
                graph.links.forEach((l, i) => {
                    if (l.source + "/" + l.target == event.target.id) {
                        link = graph.links[i];
                        index = i;
                        id = event.target.id;
                    };
                });
                document.getElementById("addLinkSourceInput").parentElement.style.display = "none";
                document.getElementById("addLinkTargetInput").parentElement.style.display = "none";
                let transLi = document.querySelectorAll("#addLinkRes li");
                transLi.forEach((li, index) => {
                    if (index > 0)
                        li.parentElement.removeChild(li);
                    else {
                        li.querySelector("input").value = "";
                        li.querySelector("option").selected = "true";
                    }
                });
                link.transferedRes.forEach((resource) => {
                    triggerEvent(document.getElementById("addLinkNewRes"), "click");
                });
                transLi = document.querySelectorAll("#addLinkRes li");
                link.transferedRes.forEach((resource, index) => {
                    transLi[index].querySelector("input").value = resource.quantity;
                    let select = transLi[index].querySelector("select");
                    select.childNodes.forEach((child) => {
                        if (child.innerHTML == resource.name) child.selected = "true";
                    });
                });
                document.getElementById("addLinkWindowButton").setAttribute("changing", id);
            };
        });
    });


    graph.links.forEach((link, index) => {
        graph.links[index].optimized = "";
        graph.links[index].new = "";
    });

}

document.getElementById("graph").addEventListener("click", function(event) {
    if (event.target.tagName == "svg") document.getElementById("contextMenu").style.display = "none";
});

function setResources(graph, resources) {
    let nodes = graph.nodes;
    let links = graph.links;
    nodes.forEach((node) => {
        node.neededRes.forEach((resource) => {
            resources.add(resource.name);
        });
        node.giveRes.forEach((resource) => {
            resources.add(resource.name);
        });
    });
    links.forEach((link) => {
        link.transferedRes.forEach((resource) => {
            resources.add(resource.name);
        });
    });

    let selects = document.querySelectorAll('select.resSelect');
    selects.forEach((select) => {
        resources.forEach((resource) => {
            let resourceOption = document.createElement("option");
            resourceOption.innerHTML = resource;
            switch (select.id) {
                case "deleteResSelect":
                    resourceOption.classList.add("deleteResOption");
                    break;
            }
            select.appendChild(resourceOption);
        });
    });
}

document.getElementById("addResButton").addEventListener("click", function() {
    let input = document.getElementById("addResInput");
    if (input.value == "Choose resource" || input.value == "") {
        //alert("Can't create resource named " + input.value);
        return;
    }
    let audio = new Audio('/static/audio/newres.mp3')
    audio.play();
    resources.add(input.value);
    let selects = document.querySelectorAll('select.resSelect');
    selects.forEach((select) => {
        let resourceOption = document.createElement("option");
        resourceOption.innerHTML = input.value;
        switch (select.id) {
            case "deleteResSelect":
                resourceOption.classList.add("deleteResOption");
                break;
        }
        select.appendChild(resourceOption);
    });
    input.value = "";
});

document.getElementById("deleteResButton").addEventListener("click", function(event) {
    let selected = document.getElementById("deleteResSelect");
    let s = selected.value;
    if (s == "Choose resource") return;
    let audio = new Audio('/static/audio/deleteres.mp3')
    audio.play();
    resources.delete(s);
    let selects = document.querySelectorAll('select.resSelect');
    selects.forEach((select) => {
        let resourceOptions = select.querySelectorAll("option");
        resourceOptions.forEach((resourceOption) => {
            if (resourceOption.value == s) select.removeChild(resourceOption);
        });
    });
    nodes.forEach((node) => {
        node.neededRes.forEach((resource) => {
            if (resource.name == s) node.neededRes.splice(node.neededRes.indexOf(resource), 1);
        });
        node.giveRes.forEach((resource) => {
            if (resource.name == s) node.giveRes.splice(node.giveRes.indexOf(resource), 1);
        });
    });
    links.forEach((link) => {
        link.transferedRes.forEach((resource) => {
            if (resource.name == s) link.transferedRes.splice(link.transferedRes.indexOf(resource), 1);
        });
    });
    graph = { nodes: nodes, links: links };
    drawGraph(graph);
});

document.getElementById("renameResButton").addEventListener("click", function() {
    let selected = document.getElementById("renameResSelect");
    let input = document.getElementById("renameResInput");
    let s = selected.value;
    let s2 = input.value;
    if (s == "Choose resource" || s2 == "" || s2 == "Choose resource") return;
    let audio = new Audio('/static/audio/renameres.mp3')
    audio.play();
    input.value = "";
    selected.children[0].selected = "true";
    resources.delete(s);
    resources.add(s2);
    let selects = document.querySelectorAll('select.resSelect');
    selects.forEach((select) => {
        let resourceOptions = select.querySelectorAll("option");
        resourceOptions.forEach((resourceOption) => {
            if (resourceOption.value == s) resourceOption.innerHTML = s2;
        });
    });
    nodes.forEach((node) => {
        node.neededRes.forEach((resource) => {
            if (resource.name == s) resource.name = s2;
        });
        node.giveRes.forEach((resource) => {
            if (resource.name == s) resource.name = s2;
        });
    });
    links.forEach((link) => {
        link.transferedRes.forEach((resource) => {
            if (resource.name == s) resource.name = s2;
        });
    });
    graph = { nodes: nodes, links: links };
    drawGraph(graph);
});

document.getElementById("addNodeButton").addEventListener("click", function() {
    document.getElementById("addNodeWindowWrap").style.display = "flex";
    let audio = new Audio('/static/audio/addnode.mp3')
    audio.play();
});

document.getElementById("addNodeWindowWrap").addEventListener("click", function(event) {
    if (event.target.id == "addNodeWindowWrap") event.target.style.display = "none";
});

function deleteLi(event) {
    let li = event.target.parentElement;
    let ul = li.parentElement;
    ul.removeChild(li);
}

document.getElementById("addNodeResEats").querySelector("button").addEventListener("click", deleteLi);
document.getElementById("addNodeResGives").querySelector("button").addEventListener("click", deleteLi);

document.getElementById("addNodeNewResEats").addEventListener("click", function() {
    let li = document.createElement("li");
    li.innerHTML = `<input type="text" placeholder="Resource quantity"><select class="resSelect"><option>Choose resource</option></select><button type="button" class="btn">X</button>`;
    li.querySelector('button').addEventListener("click", deleteLi);
    li.querySelector('button').classList.add("btn");
    let select = li.querySelector("select");
    select.style.margin = "0 4px";
    resources.forEach((resource) => {
        let option = document.createElement("option");
        option.innerHTML = resource;
        select.appendChild(option);
    });
    document.getElementById("addNodeResEats").appendChild(li);
});

document.getElementById("addNodeNewResGives").addEventListener("click", function() {
    let li = document.createElement("li");
    li.innerHTML = `<input type="text" placeholder="Resource quantity"><select class="resSelect"><option>Choose resource</option></select><button type="button">X</button>`;
    li.querySelector('button').addEventListener("click", deleteLi);
    li.querySelector('button').classList.add("btn");
    let select = li.querySelector("select");
    select.style.margin = "0 4px";
    resources.forEach((resource) => {
        let option = document.createElement("option");
        option.innerHTML = resource;
        select.appendChild(option);
    });
    document.getElementById("addNodeResGives").appendChild(li);
});

document.getElementById("addNodeWindowButton").addEventListener("click", function() {
    let maxId = "0";
    graph.nodes.forEach((element) => { if (parseInt(element.id) > parseInt(maxId)) maxId = element.id; });
    maxId = (parseInt(maxId) + 1) + "";
    let node = { id: maxId };
    node.neededRes = [];
    node.giveRes = [];
    let eatsLi = document.querySelectorAll("#addNodeResEats li");
    let givesLi = document.querySelectorAll("#addNodeResGives li");
    let isCorrect = 1;
    eatsLi.forEach((li) => {
        let name = li.querySelector("select").value;
        let quantity = li.querySelector("input").value;
        if (quantity.match(/\d*/)[0] != quantity && name != "Choose resource") {
            isCorrect = 0;
            li.querySelector("input").classList.add("incorrectNumber");
        } else {
            li.querySelector("input").classList.remove("incorrectNumber");
        }
        quantity = parseInt(li.querySelector("input").value);
        if (name != "Choose resource" && quantity != NaN && quantity != 0) {
            let flag = 1;
            node.neededRes.forEach((resource) => {
                if (resource.name == name) {
                    resource.quantity += quantity;
                    flag = 0;
                }
            });
            if (flag == 1) {
                node.neededRes.push({ name: name, quantity: quantity });
            }
        }
    });
    givesLi.forEach((li) => {
        let name = li.querySelector("select").value;
        let quantity = li.querySelector("input").value;
        if (quantity.match(/\d*/)[0] != quantity && name != "Choose resource") {
            isCorrect = 0;
            li.querySelector("input").classList.add("incorrectNumber");
        } else {
            li.querySelector("input").classList.remove("incorrectNumber");
        }
        quantity = parseInt(li.querySelector("input").value);
        if (name != "Choose resource" && quantity != NaN && quantity != 0) {
            let flag = 1;
            node.giveRes.forEach((resource) => {
                if (resource.name == name) {
                    resource.quantity += quantity;
                    flag = 0;
                }
            });
            if (flag == 1) {
                node.giveRes.push({ name: name, quantity: quantity });
            }
        }
    });

    if (!isCorrect) {
        return;
    }

    eatsLi.forEach((li, index) => {
        if (index > 0)
            li.parentElement.removeChild(li);
        else {
            li.querySelector("input").value = "";
            li.querySelector("option").selected = "true";
        }
    });
    givesLi.forEach((li, index) => {
        if (index > 0)
            li.parentElement.removeChild(li);
        else {
            li.querySelector("input").value = "";
            li.querySelector("option").selected = "true";
        }
    });
    document.getElementById("addNodeWindowWrap").style.display = "none";

    graph.nodes.push(node);
    drawGraph(graph);
});

document.getElementById("changeNodeWindowWrap").addEventListener("click", function(event) {
    if (event.target.id == "changeNodeWindowWrap") event.target.style.display = "none";
});

// function deleteLi(event) {
//     let li = event.target.parentElement;
//     let ul = li.parentElement;
//     ul.removeChild(li);
// }

document.getElementById("changeNodeResEats").querySelector("button").addEventListener("click", deleteLi);
document.getElementById("changeNodeResGives").querySelector("button").addEventListener("click", deleteLi);

document.getElementById("changeNodeNewResEats").addEventListener("click", function() {
    let li = document.createElement("li");
    li.innerHTML = `<input type="text" placeholder="Resource quantity"><select class="resSelect"><option>Choose resource</option></select><button type="button">X</button>`;
    li.querySelector('button').addEventListener("click", deleteLi);
    li.querySelector('button').classList.add("btn");
    let select = li.querySelector("select");
    select.style.margin = "0 4px";
    resources.forEach((resource) => {
        let option = document.createElement("option");
        option.innerHTML = resource;
        select.appendChild(option);
    });
    document.getElementById("changeNodeResEats").appendChild(li);
});

document.getElementById("changeNodeNewResGives").addEventListener("click", function() {
    let li = document.createElement("li");
    li.innerHTML = `<input type="text" placeholder="Resource quantity"><select class="resSelect"><option>Choose resource</option></select><button type="button">X</button>`;
    li.querySelector('button').addEventListener("click", deleteLi);
    li.querySelector('button').classList.add("btn");
    let select = li.querySelector("select");
    select.style.margin = "0 4px";
    resources.forEach((resource) => {
        let option = document.createElement("option");
        option.innerHTML = resource;
        select.appendChild(option);
    });
    document.getElementById("changeNodeResGives").appendChild(li);
});

document.getElementById("changeNodeWindowButton").addEventListener("click", function(event) {
    let node = { id: event.target.getAttribute("changing") };
    let nodeOld = {};
    graph.nodes.forEach((E) => {
        if (E.id == node.id) nodeOld = JSON.parse(JSON.stringify(E));
    });
    node.neededRes = [];
    node.giveRes = [];
    let eatsLi = document.querySelectorAll("#changeNodeResEats li");
    let givesLi = document.querySelectorAll("#changeNodeResGives li");
    let isCorrect = 1;
    eatsLi.forEach((li) => {
        let name = li.querySelector("select").value;
        let quantity = li.querySelector("input").value;
        if (quantity.match(/\d*/)[0] != quantity && name != "Choose resource") {
            isCorrect = 0;
            li.querySelector("input").classList.add("incorrectNumber");
        } else {
            li.querySelector("input").classList.remove("incorrectNumber");
        }
        quantity = parseInt(li.querySelector("input").value);
        if (name != "Choose resource" && quantity != NaN && quantity != 0) {
            let flag = 1;
            node.neededRes.forEach((resource) => {
                if (resource.name == name) {
                    resource.quantity += quantity;
                    flag = 0;
                }
            });
            if (flag == 1) {
                node.neededRes.push({ name: name, quantity: quantity });
            }
        }
    });
    givesLi.forEach((li) => {
        let name = li.querySelector("select").value;
        let quantity = li.querySelector("input").value;
        if (quantity.match(/\d*/)[0] != quantity && name != "Choose resource") {
            isCorrect = 0;
            li.querySelector("input").classList.add("incorrectNumber");
        } else {
            li.querySelector("input").classList.remove("incorrectNumber");
        }
        quantity = parseInt(li.querySelector("input").value);
        if (name != "Choose resource" && quantity != NaN && quantity != 0) {
            let flag = 1;
            node.giveRes.forEach((resource) => {
                if (resource.name == name) {
                    resource.quantity += quantity;
                    flag = 0;
                }
            });
            if (flag == 1) {
                node.giveRes.push({ name: name, quantity: quantity });
            }
        }
    });

    if (!isCorrect) {
        node = nodeOld;
        return;
    }

    if (nodeOld.entryPoint == true) node.entryPoint = true;
    if (nodeOld.exitPoint == true) node.exitPoint = true;

    document.getElementById("changeNodeWindowWrap").style.display = "none";

    graph.nodes.forEach((E, i) => {
        if (E.id == node.id) graph.nodes[i] = node;
    });
    drawGraph(graph);
});


document.getElementById("optimizeGraphButton").addEventListener("click", function() {
    let response = apiRequest("POST", "api/optimizegraph", graph);
    if (response == "incorrect") {
        // alert("Graph plohoi");
        let audio = new Audio('/static/audio/incorrect.mp3')
        audio.play();
        return;
    }
    let oldGraph = graph;
    graph = response.graph;
    if (JSON.stringify(oldGraph) === JSON.stringify(graph)) {
        let audio = new Audio('/static/audio/alreadyopt.mp3')
        audio.play();
        return;
    }
    let audio = new Audio('/static/audio/optimized.mp3')
    audio.play();
    links = graph.links;
    nodes = graph.nodes;

    graph.links.forEach((link, index) => {
        response.optimizedLinks.forEach((optLink) => {
            if (optLink.source == link.source && optLink.target == link.target) {
                graph.links[index].optimized = true;
            }
        });
        response.newLinks.forEach((newLink) => {
            if (newLink.source == link.source && newLink.target == link.target) {
                graph.links[index].new = true;
            }
        });
    });
    drawGraph(graph);
});

document.getElementById("addLinkButton").addEventListener("click", function() {
    document.getElementById("addLinkWindowWrap").style.display = "flex";
    document.getElementById("addLinkSourceInput").parentElement.style.display = "block";
    document.getElementById("addLinkTargetInput").parentElement.style.display = "block";
    document.getElementById("addLinkWindowButton").setAttribute("changing", "");
    document.getElementById("addLinkWindowButton").innerHTML = "Add link";
    let transLi = document.querySelectorAll("#addLinkRes li");
    transLi.forEach((li, index) => {
        if (index > 0)
            li.parentElement.removeChild(li);
        else {
            li.querySelector("input").value = "";
            li.querySelector("option").selected = "true";
        }
    });
    let audio = new Audio('/static/audio/newlink.mp3');
    audio.play();
});

document.getElementById("addLinkWindowWrap").addEventListener("click", function(event) {
    if (event.target.id == "addLinkWindowWrap") event.target.style.display = "none";
});

document.getElementById("addLinkRes").querySelector("button").addEventListener("click", deleteLi);

document.getElementById("addLinkNewRes").addEventListener("click", function() {
    let li = document.createElement("li");
    li.innerHTML = `<input type="text" placeholder="Resource quantity"><select class="resSelect"><option>Choose resource</option></select><button type="button">X</button>`;
    li.querySelector('button').addEventListener("click", deleteLi);
    li.querySelector('button').classList.add("btn");
    let select = li.querySelector("select");
    select.style.margin = "0 4px";
    resources.forEach((resource) => {
        let option = document.createElement("option");
        option.innerHTML = resource;
        select.appendChild(option);
    });
    document.getElementById("addLinkRes").appendChild(li);
});

document.getElementById("addLinkWindowButton").addEventListener("click", function(event) {
    if (event.target.getAttribute("changing") == null || event.target.getAttribute("changing") == "") {

        let source = document.getElementById("addLinkSourceInput");
        let target = document.getElementById("addLinkTargetInput");
        source.classList.remove("incorrectNumber");
        target.classList.remove("incorrectNumber");
        let isCorrect = 1;
        if (source.value === "") {
            source.classList.add("incorrectNumber");
            isCorrect = 0;
        }
        if (target.value === "") {
            target.classList.add("incorrectNumber");
            isCorrect = 0;
        }
        let sourceId = undefined,
            targetId = undefined;
        graph.nodes.forEach((node) => {
            if (node.id == source.value) sourceId = node.id;
            if (node.id == target.value) targetId = node.id;
        });
        if (sourceId == undefined) {
            source.classList.add("incorrectNumber");
            isCorrect = 0;
        }
        if (targetId == undefined) {
            target.classList.add("incorrectNumber");
            isCorrect = 0;
        }
        if (target.value == source.value) {
            source.classList.add("incorrectNumber");
            target.classList.add("incorrectNumber");
            isCorrect = 0;
        }
        if (!isCorrect) {
            return;
        }
        graph.links.forEach((link) => {
            if ((sourceId == link.source && targetId == link.target) || ((sourceId == link.target && targetId == link.source))) {
                source.classList.add("incorrectNumber");
                target.classList.add("incorrectNumber");
                isCorrect = 0;
            }
        });
        if (!isCorrect) {
            return;
        }

        let link = { "source": sourceId, "target": targetId };
        link.transferedRes = [];
        let transLi = document.querySelectorAll("#addLinkRes li");
        transLi.forEach((li) => {
            let name = li.querySelector("select").value;
            let quantity = li.querySelector("input").value;
            if (quantity.match(/\d*/)[0] != quantity && name != "Choose resource") {
                isCorrect = 0;
                li.querySelector("input").classList.add("incorrectNumber");
            } else {
                li.querySelector("input").classList.remove("incorrectNumber");
            }
            quantity = parseInt(li.querySelector("input").value);
            if (name != "Choose resource" && quantity != NaN && quantity != 0) {
                let flag = 1;
                link.transferedRes.forEach((resource) => {
                    if (resource.name == name) {
                        resource.quantity += quantity;
                        flag = 0;
                    }
                });
                if (flag == 1) {
                    link.transferedRes.push({ name: name, quantity: quantity });
                }
            }
        });


        if (!isCorrect) {
            return;
        }

        source.value = "";
        target.value = "";

        transLi.forEach((li, index) => {
            if (index > 0)
                li.parentElement.removeChild(li);
            else {
                li.querySelector("input").value = "";
                li.querySelector("option").selected = "true";
            }
        });
        document.getElementById("addLinkWindowWrap").style.display = "none";

        graph.links.push(link);
        drawGraph(graph);
    } else {
        let ID = event.target.getAttribute("changing").split("/");
        let link = { source: ID[0], target: ID[1] };
        let linkOld = {};
        graph.links.forEach((E) => {
            if (E.source == link.source && E.target == link.target) linkOld = JSON.parse(JSON.stringify(E));
        });
        link.transferedRes = [];
        let transLi = document.querySelectorAll("#addLinkRes li");
        let isCorrect = 1;
        transLi.forEach((li) => {
            let name = li.querySelector("select").value;
            let quantity = li.querySelector("input").value;
            if (quantity.match(/\d*/)[0] != quantity && name != "Choose resource") {
                isCorrect = 0;
                li.querySelector("input").classList.add("incorrectNumber");
            } else {
                li.querySelector("input").classList.remove("incorrectNumber");
            }
            quantity = parseInt(li.querySelector("input").value);
            if (name != "Choose resource" && quantity != NaN && quantity != 0) {
                let flag = 1;
                link.transferedRes.forEach((resource) => {
                    if (resource.name == name) {
                        resource.quantity += quantity;
                        flag = 0;
                    }
                });
                if (flag == 1) {
                    link.transferedRes.push({ name: name, quantity: quantity });
                }
            }
        });

        if (!isCorrect) {
            link = linkOld;
            return;
        }

        document.getElementById("addLinkWindowWrap").style.display = "none";

        graph.links.forEach((E, i) => {
            if (E.source == link.source && E.target == link.target) graph.links[i] = link;
        });
        drawGraph(graph);
    }
});

document.getElementById("saveGraphButton").addEventListener("click", function() {
    if ("incorrect" == apiRequest("POST", "api/savegraph", graph)) {
        let audio = new Audio('/static/audio/incorrect.mp3');
        audio.play();
        return;
    }
    let audio = new Audio('/static/audio/savegraph.mp3');
    audio.play();
});

document.getElementById("estimationCloseButton").addEventListener("click", function() {
    let wrap = document.getElementById("estimationWrap");
    wrap.style.display = "none";
});

document.getElementById("estimateGraphButton").addEventListener("click", function() {
    let response = apiRequest("POST", "api/estimategraph", graph);
    if ("incorrect" == response) {
        let audio = new Audio('/static/audio/incorrect.mp3');
        audio.play();
        return;
    }
    let wrap = document.getElementById("estimationWrap");
    wrap.style.display = "block";
    let outerUl = document.getElementById("estimationOuterList");
    outerUl.innerHTML = "";
    let optimalsUl = document.getElementById("estimationOptimalsList");
    optimalsUl.innerHTML = "";
    let optimalsLabel = document.getElementById("estimationOptimalsLabel");
    optimalsLabel.innerHTML = "";
    graph.nodes.forEach((node) => {
        if (response[node.id] != undefined) {
            let li = document.createElement("li");
            let idLabel = document.createElement("div");
            idLabel.innerHTML = "Id: " + node.id;
            li.appendChild(idLabel);
            if (response[node.id].leak.length + response[node.id].excess.length == 0) {
                let opt = document.getElementById(node.id);
                opt.classList.add("optimal");
                return;
            }
            if (response[node.id].leak.length != 0) {
                let lackLabel = document.createElement("div");
                lackLabel.innerHTML = "Lack of:";
                li.appendChild(lackLabel);
                li.innerHTML += arrResToUL(response[node.id].leak, "");
            }
            if (response[node.id].excess.length != 0) {
                let excessLabel = document.createElement("div");
                excessLabel.innerHTML = "Excess of:";
                li.appendChild(excessLabel);
                li.innerHTML += arrResToUL(response[node.id].excess, "");
            }
            outerUl.appendChild(li);
        }
    });
    if (response.optimals.length != 0) {
        optimalsLabel.innerHTML = "List of optimals: " + response.optimals.join(", ") + ".";
    }
    let audio = new Audio('/static/audio/estimation.mp3');
    audio.play();
})

// маленький граф (без слоев, не заработает)
// nodes = [{ "id": "0", "entryPoint": true, "neededRes": [], "giveRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }] }, { "id": "1", "neededRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }], "giveRes": [{ "name": "iron plate", "quantity": 1 }] }, { "id": "2", "neededRes": [{ "name": "iron plate", "quantity": 1 }], "giveRes": [{ "name": "shit made of iron", "quantity": 1 }] }, { "id": "3", "exitPoint": true, "neededRes": [{ "name": "shit made of iron", "quantity": 1 }], "giveRes": [] }];
// links = [{ "source": "1", "target": "2", "transferedRes": [{ "name": "iron plate", "quantity": 1 }] }, { "source": "0", "target": "1", "transferedRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }] }, { "source": "2", "target": "3", "transferedRes": [{ "name": "shit made of iron", "quantity": 1 }] }];

// большой граф (НЕкорректный, без слоев, не заработает)
// nodes = [{"id": "0", "neededRes": [], "giveRes": [{"name": "water", "quantity": 9}, {"name": "stone", "quantity": 3}, {"name": "fire", "quantity": 4}, {"name": "iron", "quantity": 8}], "entryPoint": true}, {"id": "1", "neededRes": [{"name": "water", "quantity": 2}, {"name": "stone", "quantity": 1}], "giveRes": [{"name": "buttplug", "quantity": 2}, {"name": "iron", "quantity": 5}]}, {"id": "2", "neededRes": [{"name": "fire", "quantity": 3}, {"name": "iron", "quantity": 4}], "giveRes": [{"name": "shit", "quantity": 2}, {"name": "stone", "quantity": 3}, {"name": "water", "quantity": 6}]}, {"id": "3", "neededRes": [{"name": "iron", "quantity": 1}], "giveRes": [{"name": "buttplug", "quantity": 5}]}, {"id": "4", "neededRes": [{"name": "buttplug", "quantity": 3}], "giveRes": [{"name": "fire", "quantity": 2}]}, {"id": "5", "neededRes": [{"name": "stone", "quantity": 2}, {"name": "shit", "quantity": 1}], "giveRes": [{"name": "water", "quantity": 1}, {"name": "shit", "quantity": 10}]}, {"id": "6", "neededRes": [{"name": "shit", "quantity": 3}, {"name": "water", "quantity": 2}], "giveRes": [{"name": "iron", "quantity": 7}]}, {"id": "7", "neededRes": [{"name": "iron", "quantity": 1}, {"name": "buttplug", "quantity": 5}, {"name": "shit", "quantity": 2}], "giveRes": [{"name": "iron", "quantity": 4}]}, {"id": "8", "neededRes": [{"name": "fire", "quantity": 1}], "giveRes": [{"name": "shit", "quantity": 4}]}, {"id": "9", "neededRes": [{"name": "shit", "quantity": 8}], "giveRes": [{"name": "buttplug", "quantity": 3}]}, {"id": "10", "neededRes": [{"name": "iron", "quantity": 4}, {"name": "shit", "quantity": 2}, {"name": "buttplug", "quantity": 1}], "giveRes": [], "exitPoint": true}]
// links = [{"source": "0", "target": "1", "transferedRes": [{"name": "water", "quantity": 4}, {"name": "stone", "quantity": 2}]}, {"source": "0", "target": "2", "transferedRes": [{"name": "water", "quantity": 3}, {"name": "fire", "quantity": 3}, {"name": "iron", "quantity": 7}]}, {"source": "1", "target": "3", "transferedRes": [{"name": "iron", "quantity": 3}, {"name": "buttplug", "quantity": 1}]}, {"source": "1", "target": "4", "transferedRes": [{"name": "buttplug", "quantity": 1}, {"name": "iron", "quantity": 1}]}, {"source": "2", "target": "5", "transferedRes": [{"name": "shit", "quantity": 1}, {"name": "stone", "quantity": 3}, {"name": "water", "quantity": 4}]}, {"source": "5", "target": "6", "transferedRes": [{"name": "water", "quantity": 1}]}, {"source": "3", "target": "7", "transferedRes": [{"name": "buttplug", "quantity": 5}]}, {"source": "6", "target": "7", "transferedRes": [{"name": "iron", "quantity": 4}]}, {"source": "5", "target": "7", "transferedRes": [{"name": "shit", "quantity": 2}]}, {"source": "4", "target": "8", "transferedRes": [{"name": "fire", "quantity": 2}]}, {"source": "5", "target": "9", "transferedRes": [{"name": "shit", "quantity": 8}]}, {"source": "7", "target": "10", "transferedRes": [{"name": "iron", "quantity": 4}]}, {"source": "8", "target": "10", "transferedRes": [{"name": "shit", "quantity": 3}]}, {"source": "9", "target": "10", "transferedRes": [{"name": "buttplug", "quantity": 3}]}]

// большой граф (корректный, без слоев, не заработает)
// nodes = [{"id": "0", "neededRes": [], "giveRes": [{"name": "water", "quantity": 9}, {"name": "stone", "quantity": 3}, {"name": "fire", "quantity": 4}, {"name": "iron", "quantity": 8}], "entryPoint": true}, {"id": "1", "neededRes": [{"name": "water", "quantity": 2}, {"name": "stone", "quantity": 1}], "giveRes": [{"name": "buttplug", "quantity": 2}, {"name": "iron", "quantity": 5}]}, {"id": "2", "neededRes": [{"name": "fire", "quantity": 3}, {"name": "iron", "quantity": 4}], "giveRes": [{"name": "shit", "quantity": 2}, {"name": "stone", "quantity": 3}, {"name": "water", "quantity": 6}]}, {"id": "3", "neededRes": [{"name": "iron", "quantity": 1}], "giveRes": [{"name": "buttplug", "quantity": 5}]}, {"id": "4", "neededRes": [{"name": "buttplug", "quantity": 3}], "giveRes": [{"name": "fire", "quantity": 2}]}, {"id": "5", "neededRes": [{"name": "stone", "quantity": 2}, {"name": "shit", "quantity": 1}], "giveRes": [{"name": "water", "quantity": 1}, {"name": "shit", "quantity": 10}]}, {"id": "6", "neededRes": [{"name": "shit", "quantity": 3}, {"name": "water", "quantity": 2}], "giveRes": [{"name": "iron", "quantity": 7}]}, {"id": "7", "neededRes": [{"name": "iron", "quantity": 1}, {"name": "buttplug", "quantity": 5}, {"name": "shit", "quantity": 2}], "giveRes": [{"name": "iron", "quantity": 3}]}, {"id": "8", "neededRes": [{"name": "fire", "quantity": 5}], "giveRes": [{"name": "shit", "quantity": 4}, {"name": "iron", "quantity": 6}]}, {"id": "9", "neededRes": [{"name": "shit", "quantity": 9}], "giveRes": [{"name": "buttplug", "quantity": 3}]}, {"id": "10", "neededRes": [{"name": "iron", "quantity": 4}, {"name": "shit", "quantity": 2}, {"name": "buttplug", "quantity": 1}], "giveRes": [], "exitPoint": true}]
// links = [{"source": "0", "target": "1", "transferedRes": [{"name": "water", "quantity": 2}, {"name": "stone", "quantity": 1}]}, {"source": "0", "target": "2", "transferedRes": [{"name": "fire", "quantity": 3}, {"name": "iron", "quantity": 4}]}, {"source": "1", "target": "3", "transferedRes": [{"name": "iron", "quantity": 1}]}, {"source": "1", "target": "4", "transferedRes": [{"name": "buttplug", "quantity": 1}]}, {"source": "2", "target": "5", "transferedRes": [{"name": "shit", "quantity": 1}, {"name": "stone", "quantity": 2}]}, {"source": "5", "target": "6", "transferedRes": [{"name": "water", "quantity": 1}]}, {"source": "3", "target": "7", "transferedRes": [{"name": "buttplug", "quantity": 5}]}, {"source": "6", "target": "7", "transferedRes": [{"name": "iron", "quantity": 1}]}, {"source": "5", "target": "7", "transferedRes": [{"name": "shit", "quantity": 2}]}, {"source": "4", "target": "8", "transferedRes": [{"name": "fire", "quantity": 1}]}, {"source": "5", "target": "9", "transferedRes": [{"name": "shit", "quantity": 8}]}, {"source": "7", "target": "10", "transferedRes": [{"name": "iron", "quantity": 3}]}, {"source": "8", "target": "10", "transferedRes": [{"name": "shit", "quantity": 2}, {"name": "iron", "quantity": 1}]}, {"source": "9", "target": "10", "transferedRes": [{"name": "buttplug", "quantity": 1}]}]

// большой граф (корректный)
//nodes = [{ "id": "0", "neededRes": [], "giveRes": [{ "name": "water", "quantity": 9 }, { "name": "stone", "quantity": 3 }, { "name": "fire", "quantity": 4 }, { "name": "iron", "quantity": 8 }], "entryPoint": true, "layerNum": 0 }, { "id": "1", "neededRes": [{ "name": "water", "quantity": 2 }, { "name": "stone", "quantity": 1 }], "giveRes": [{ "name": "buttplug", "quantity": 2 }, { "name": "iron", "quantity": 5 }], "layerNum": 1 }, { "id": "2", "neededRes": [{ "name": "fire", "quantity": 3 }, { "name": "iron", "quantity": 4 }], "giveRes": [{ "name": "shit", "quantity": 2 }, { "name": "stone", "quantity": 3 }, { "name": "water", "quantity": 6 }], "layerNum": 1 }, { "id": "3", "neededRes": [{ "name": "iron", "quantity": 1 }], "giveRes": [{ "name": "buttplug", "quantity": 5 }], "layerNum": 2 }, { "id": "4", "neededRes": [{ "name": "buttplug", "quantity": 3 }], "giveRes": [{ "name": "fire", "quantity": 2 }], "layerNum": 2 }, { "id": "5", "neededRes": [{ "name": "stone", "quantity": 2 }, { "name": "shit", "quantity": 1 }], "giveRes": [{ "name": "water", "quantity": 1 }, { "name": "shit", "quantity": 10 }], "layerNum": 2 }, { "id": "6", "neededRes": [{ "name": "shit", "quantity": 3 }, { "name": "water", "quantity": 2 }], "giveRes": [{ "name": "iron", "quantity": 7 }], "layerNum": 2 }, { "id": "7", "neededRes": [{ "name": "iron", "quantity": 1 }, { "name": "buttplug", "quantity": 5 }, { "name": "shit", "quantity": 2 }], "giveRes": [{ "name": "iron", "quantity": 3 }], "layerNum": 3 }, { "id": "8", "neededRes": [{ "name": "fire", "quantity": 5 }], "giveRes": [{ "name": "shit", "quantity": 4 }, { "name": "iron", "quantity": 6 }], "layerNum": 3 }, { "id": "9", "neededRes": [{ "name": "shit", "quantity": 9 }, { "name": "water", "quantity": 5 }], "giveRes": [{ "name": "buttplug", "quantity": 3 }], "layerNum": 3 }, { "id": "10", "neededRes": [{ "name": "iron", "quantity": 4 }, { "name": "shit", "quantity": 2 }, { "name": "buttplug", "quantity": 1 }], "giveRes": [], "exitPoint": true, "layerNum": 4 }]
//links = [{ "source": "0", "target": "1", "transferedRes": [{ "name": "water", "quantity": 2 }, { "name": "stone", "quantity": 1 }] }, { "source": "0", "target": "2", "transferedRes": [{ "name": "fire", "quantity": 3 }, { "name": "iron", "quantity": 4 }] }, { "source": "1", "target": "3", "transferedRes": [{ "name": "iron", "quantity": 1 }] }, { "source": "1", "target": "4", "transferedRes": [{ "name": "buttplug", "quantity": 1 }] }, { "source": "2", "target": "5", "transferedRes": [{ "name": "shit", "quantity": 1 }, { "name": "stone", "quantity": 2 }] }, { "source": "2", "target": "6", "transferedRes": [{ "name": "water", "quantity": 1 }] }, { "source": "3", "target": "7", "transferedRes": [{ "name": "buttplug", "quantity": 5 }] }, { "source": "6", "target": "7", "transferedRes": [{ "name": "iron", "quantity": 1 }] }, { "source": "5", "target": "7", "transferedRes": [{ "name": "shit", "quantity": 2 }] }, { "source": "4", "target": "8", "transferedRes": [{ "name": "fire", "quantity": 1 }] }, { "source": "5", "target": "9", "transferedRes": [{ "name": "shit", "quantity": 8 }, { "name": "water", "quantity": 1 }] }, { "source": "7", "target": "10", "transferedRes": [{ "name": "iron", "quantity": 3 }] }, { "source": "8", "target": "10", "transferedRes": [{ "name": "shit", "quantity": 2 }, { "name": "iron", "quantity": 1 }] }, { "source": "9", "target": "10", "transferedRes": [{ "name": "buttplug", "quantity": 1 }] }]
//graph = { nodes: nodes, links: links };


// graph = { nodes: nodes, links: links };
// если граф корректный, apiRequest получит строчку "correct", иначе "incorrect"
// console.log(apiRequest("POST", "api/savegraph", graph));

// оценка оптимальности
// "incorrect" либо JSON с оценкой графа
//console.log(apiRequest("POST", "api/estimategraph", graph));