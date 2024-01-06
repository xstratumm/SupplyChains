"use strict";

function apiRequest(reqType, URL, data) {
    let xhr = new XMLHttpRequest();
    xhr.open(reqType, URL, false);

    if (reqType == "POST") {
        xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        xhr.send(JSON.stringify(data));
    }

    else {
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

const triggerEvent = (el, eventType, detail) =>
    el.dispatchEvent(new CustomEvent(eventType, { detail }));

drawGraph(graph);

let resources = new Set();

setResources(graph, resources);

function drawGraph(graph) {
    let radius = 30;
    let svg = document.getElementById('graph');
    svg.innerHTML = `<defs><!-- A marker to be used as an arrowhead -->
    <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path fill="#9ecae1" d="M 0 0 L 10 5 L 0 10 z" /></marker></defs>`;
    let width = 960,
        height = 500;
    svg.setAttribute('viewBox', (-width / 2) + " " + (-height / 2) + " " + (width) + " " + (height));
    let nodesEl = Array();
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
        svg.appendChild(linksEl[index].g);

        let modal = document.createElement("div");
        modal.classList.add("modal")
            //modal.style.display = "none";
        modal.style.position = "absolute";
        modal.innerHTML = '<div style="margin: 0 auto; width: fit-content; height: 20px;"><svg style="margin: 0 auto; width: 20px; height: 20px;"><path fill="#e3f4ff" d="M 0 20 L 10 0 L 20 20 z" /></svg></div>'
        modal.innerHTML += '<div style="background-color: #e3f4ff;">' + "Transfers:" + arrResToUL(element.transferedRes, "") + "</div>";
        modalsLinks.push(modal);
        document.body.insertBefore(modal, svg);
    });
    graph.nodes.forEach((element, index) => {
        let modal = undefined;
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
            innerDiv.innerHTML = arrResToUL(element.giveRes, 'class = "entryExitPoint"');
            nodesEl[index].appendChild(innerDiv);
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
            innerDiv.innerHTML = arrResToUL(element.neededRes, 'class = "entryExitPoint"');
            nodesEl[index].appendChild(innerDiv);
        } else {
            nodesEl.push(document.createElementNS('http://www.w3.org/2000/svg', 'circle'));
            nodesEl[index].setAttribute("r", radius);
            nodesEl[index].setAttribute("fill", "#9ecae1");
            modal = document.createElement("div");
            modal.classList.add("modal")
                //modal.style.display = "none";
            modal.style.position = "absolute";
            modal.innerHTML = '<div style="margin: 0 auto; width: fit-content; height: 20px;"><svg style="margin: 0 auto; width: 20px; height: 20px;"><path fill="#e3f4ff" d="M 0 20 L 10 0 L 20 20 z" /></svg></div>'
            modal.innerHTML += '<div style="background-color: #e3f4ff;">' + "Eats:" + arrResToUL(element.neededRes, "") + "Provides:" + arrResToUL(element.giveRes, "") + "</div>";
        }
        modalsNodes.push(modal);
        if (modal != undefined) {
            document.body.insertBefore(modal, svg);
        }
        nodesEl[index].classList.add("node");
        nodesEl[index].setAttribute("id", element.id);
        nodesEl[index].setAttribute("fill", "none");
        svg.appendChild(nodesEl[index]);
    });

    let linksCopy = JSON.parse(JSON.stringify(links));
    let nodesCopy = JSON.parse(JSON.stringify(nodes));
    const simulation = d3.forceSimulation(nodesCopy)
        .force("link", d3.forceLink(linksCopy).distance(50).id(d => d.id))
        .force("charge", d3.forceManyBody())
        .force("collide", d3.forceCollide((d) => radius))
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
            link.line.setAttribute("x1", x1);
            link.line.setAttribute("y1", y1);
            link.line.setAttribute("x2", x2);
            link.line.setAttribute("y2", y2);

            let boundBox = link.line.getBoundingClientRect();
            let modalWidth = modalsLinks[index].getBoundingClientRect().width;
            modalsLinks[index].style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
            modalsLinks[index].style.left = ((boundBox.left + boundBox.right - modalWidth) / 2) + "px";
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
                let boundBox = link.line.getBoundingClientRect();
                let modalWidth = modalsLinks[index].getBoundingClientRect().width;
                modalsLinks[index].style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
                modalsLinks[index].style.left = ((boundBox.left + boundBox.right - modalWidth) / 2) + "px";
            }

        };

        link.line.onmouseleave = function() {
            if (modalsLinks[index] != undefined) {
                modalsLinks[index].style.display = "none";
                let boundBox = link.line.getBoundingClientRect();
                let modalWidth = modalsLinks[index].getBoundingClientRect().width;
                modalsLinks[index].style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
                modalsLinks[index].style.left = ((boundBox.left + boundBox.right - modalWidth) / 2) + "px";
            }
        };
    });

    nodesEl.forEach((node, nodeIndex) => {
        node.addEventListener("click", function(event) {
            let menu = document.getElementById("contextMenu");
            menu.style.display = "block";
            let boundBox = node.getBoundingClientRect();
            menu.style.top = (boundBox.top + boundBox.bottom) / 2 + "px";
            menu.style.left = (boundBox.left + boundBox.right + 100) / 2 + "px";
            document.getElementById("contextMenuButtonDelete").onclick = function() {
                graph.nodes.forEach((node, index) => {
                    if (node.id == event.target.id) graph.nodes.splice(index, 1);
                });
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
                graph.nodes.forEach((n, i) => {
                    if (n.id == event.target.id) {
                        node = graph.nodes[i];
                        index = i;
                    };
                });
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
                document.getElementById("changeNodeWindowButton").setAttribute("changing", index);
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
                    if (graph.links[i].source == event.target.id[0] && graph.links[i].target == event.target.id[2]) {
                        graph.links.splice(i, 1);
                        i--;
                    }
                }
                drawGraph(graph);
                menu.style.display = "none";
            };
        });
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
    if (input.value == "-none-") {
        alert("Can't create resource named " + input.value);
        return;
    }
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
    if (s == "-none-") return;
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
    if (s == "-none-" || s2 == "" || s2 == "-none-") return;
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
    li.innerHTML = `<input type="number" placeholder="Resource quantity"><select class="resSelect"><option>-none-</option></select><button type="button">X</button>`;
    li.querySelector('button').addEventListener("click", deleteLi);
    let select = li.querySelector("select");
    resources.forEach((resource) => {
        let option = document.createElement("option");
        option.innerHTML = resource;
        select.appendChild(option);
    });
    document.getElementById("addNodeResEats").appendChild(li);
});

document.getElementById("addNodeNewResGives").addEventListener("click", function() {
    let li = document.createElement("li");
    li.innerHTML = `<input type="number" placeholder="Resource quantity"><select class="resSelect"><option>-none-</option></select><button type="button">X</button>`;
    li.querySelector('button').addEventListener("click", deleteLi);
    let select = li.querySelector("select");
    resources.forEach((resource) => {
        let option = document.createElement("option");
        option.innerHTML = resource;
        select.appendChild(option);
    });
    document.getElementById("addNodeResGives").appendChild(li);
});

document.getElementById("addNodeWindowButton").addEventListener("click", function() {
    let maxId = "0";
    graph.nodes.forEach((element) => { if (element.id > maxId) maxId = element.id; });
    maxId = (parseInt(maxId) + 1) + "";
    let node = { id: maxId };
    node.neededRes = [];
    node.giveRes = [];
    let eatsLi = document.querySelectorAll("#addNodeResEats li");
    let givesLi = document.querySelectorAll("#addNodeResGives li");
    eatsLi.forEach((li) => {
        let name = li.querySelector("select").value;
        let quantity = parseInt(li.querySelector("input").value);
        if (name != "-none-" && quantity != NaN && quantity != 0) {
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
        let quantity = parseInt(li.querySelector("input").value);
        if (name != "-none-" && quantity != NaN && quantity != 0) {
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
    li.innerHTML = `<input type="number" placeholder="Resource quantity"><select class="resSelect"><option>-none-</option></select><button type="button">X</button>`;
    li.querySelector('button').addEventListener("click", deleteLi);
    let select = li.querySelector("select");
    resources.forEach((resource) => {
        let option = document.createElement("option");
        option.innerHTML = resource;
        select.appendChild(option);
    });
    document.getElementById("changeNodeResEats").appendChild(li);
});

document.getElementById("changeNodeNewResGives").addEventListener("click", function() {
    let li = document.createElement("li");
    li.innerHTML = `<input type="number" placeholder="Resource quantity"><select class="resSelect"><option>-none-</option></select><button type="button">X</button>`;
    li.querySelector('button').addEventListener("click", deleteLi);
    let select = li.querySelector("select");
    resources.forEach((resource) => {
        let option = document.createElement("option");
        option.innerHTML = resource;
        select.appendChild(option);
    });
    document.getElementById("changeNodeResGives").appendChild(li);
});

document.getElementById("changeNodeWindowButton").addEventListener("click", function(event) {
    let node = { id: event.target.getAttribute("changing") };
    node.neededRes = [];
    node.giveRes = [];
    let eatsLi = document.querySelectorAll("#changeNodeResEats li");
    let givesLi = document.querySelectorAll("#changeNodeResGives li");
    eatsLi.forEach((li) => {
        let name = li.querySelector("select").value;
        let quantity = parseInt(li.querySelector("input").value);
        if (name != "-none-" && quantity != NaN && quantity != 0) {
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
        let quantity = parseInt(li.querySelector("input").value);
        if (name != "-none-" && quantity != NaN && quantity != 0) {
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

    document.getElementById("changeNodeWindowWrap").style.display = "none";

    graph.nodes[event.target.getAttribute("changing")] = node;
    drawGraph(graph);
});


// nodes = [{ "id": "0", "entryPoint": true, "neededRes": [], "giveRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }] }, { "id": "1", "neededRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }], "giveRes": [{ "name": "iron plate", "quantity": 1 }] }, { "id": "2", "neededRes": [{ "name": "iron plate", "quantity": 1 }], "giveRes": [{ "name": "shit made of iron", "quantity": 1 }] }, { "id": "3", "exitPoint": true, "neededRes": [{ "name": "shit made of iron", "quantity": 1 }], "giveRes": [] }];
// links = [{ "source": "1", "target": "2", "transferedRes": [{ "name": "iron plate", "quantity": 1 }] }, { "source": "0", "target": "1", "transferedRes": [{ "name": "iron ore", "quantity": 1 }, { "name": "coal", "quantity": 1 }] }, { "source": "2", "target": "3", "transferedRes": [{ "name": "shit made of iron", "quantity": 1 }] }];
// graph = { nodes: nodes, links: links };
// xhr = new XMLHttpRequest();
// xhr.open("POST", "api/savegraph", false);
// xhr.setRequestHeader('Content-type', 'application/json; charset=utf-8');
// xhr.send(JSON.stringify(graph));
// apiRequest("POST", "api/savegraph", graph);