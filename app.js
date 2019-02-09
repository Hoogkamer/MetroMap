

var tippyA;
var stations = [];
var id = 0;
var cy;
var init = {
    nodes: [

        { data: { id: "last", name: "" }, classes: 'station', position: { x: 800, y: 400 } },
        { data: { id: "first", name: "" }, classes: 'station', position: { x: 0, y: 0 } }

    ]
};
function startup() {
    processUrl();

    cy = cytoscape({
        container: document.getElementById("cy"),
        style: [
            {
                selector: "node",
                css: {
                    label: "data(name)",
                    "border-width": 2,
                    width: 10,
                    height: 10,
                    'font-family': 'sans-serif',
                    "font-size": '10px',
                    'text-rotation': '45deg',
                    'text-halign': 'left',
                    "text-background-color": '#ffff00',
                    "text-background-opacity": "0",
                }
            },
            {
                selector: "edge",
                css: {
                    "curve-style": "bezier",
                    width: 10,
                    "source-endpoint": "inside-to-node",
                    "target-endpoint": "inside-to-node",
                }
            },
            {
                selector: "edge.owner",
                css: {
                    "line-color": "red"
                }
            },
            {
                selector: "edge.user",
                css: {
                    "line-color": "blue"
                }
            },
            {
                selector: "edge.owner_bao",
                css: {
                    "line-color": "green"
                }
            },
            {
                selector: "edge.user_bao",
                css: {
                    "line-color": "orange"
                }
            }

        ],
        elements: init,
        layout: {
            name: "preset"
        }
    });
    cy.on('click', function (evt) {
        if (tippyA)
            tippyA.destroy();
        /*
    var edit = document.getElementById("editmode");
    console.log(edit.checked)
    if (edit.checked) {
        var stationname = prompt("stationname", "");
        console.log(stationname)
    }
    */

    });

    cy.on('click', 'node', function (evt) {

        var a = evt.target;
        //	var b = cy.getElementById('b');

        var makeTippy = function (node, text) {
            return tippy(node.popperRef(), {
                html: (function () {
                    var div = document.createElement('div');

                    div.innerHTML = text;

                    return div;
                })(),
                trigger: 'manual',
                arrow: true,
                placement: 'bottom',
                hideOnClick: false,
                multiple: true,
                sticky: true,
                interactive: true
            }).tooltips[0];
        };
        var name = a.data().name || a.data().name1;
        var description = a.data().description || "no description";
        var linkDoc = "";
        if (a.data().linkDoc) {
            var iconDoc = '<i class="material-icons"> description </i>';
            linkDoc = "<a title='View documentation' target='clicked' href='" + a.data().linkDoc + "'>" + iconDoc + "</a>";
        }
        var linkTool = "";

        if (a.data().linkTool) {
            var iconTool = '<i class="material-icons"> exit_to_app </i>';
            linkTool = "<a title='Goto application' target='clicked' href='" + a.data().linkTool + "'>" + iconTool + "</a>";
        }

        if (tippyA)
            tippyA.destroy();

        tippyA = makeTippy(a, '<div class="tip">' +
            '<img src="metro.jpg" width="200px">' +
            '<br><h3>' + name + '</h3>' +
            description + '<br><br>' +
            linkDoc +
            linkTool +
            '</div>'
        );
        tippyA.show();
    });
    cy.add(elements);
}

window.onload = startup;

function processFile(e) {
    cy.elements().remove();
    cy.add(init)

    var f = e.files[0];
    var reader = new FileReader();
    var name = f.name;
    var that = this;
    stations = [];
    reader.onload = function (e) {
        var data = e.target.result;
        var workbook = XLSX.read(data, { type: 'binary' });
        var stationData = XLSX.utils.sheet_to_json(workbook.Sheets['stations'], { "defval": "" });
        stationData.forEach(function (d, i) {
            createElement(d)
        });
        console.log(elements);

        var links = [];
        var prevStation = null;
        stations.forEach(function (station, i) {
            if (prevStation && prevStation.data.type !== station.data.type) {
                prevStation = null;
            }
            if (prevStation) {
                links.push({ group: 'edges', data: { source: prevStation.data.id, target: station.data.id }, classes: station.data.type })
            }
            prevStation = station;
        });
        cy.add(stations);
        cy.add(links);
        console.log(cy.elements().jsons())
    };
    reader.readAsBinaryString(f);

}
function createElement(station) {
    var x = parseInt(station.x);
    var y = parseInt(station.y);
    var node = { group: 'nodes', data: { id: id++, name: station.hidename === 'y' ? '' : station.station, name1: station.station, description: station.description, linkDoc: station.linkDoc, linkTool: station.linkTool, type: station.type, hidename: station.hidename }, classes: 'station', position: { x: x, y: y } };

    stations.push(node);
}

function exportData() {

    var toExport = [];
    var stations = cy.nodes().jsons();
    stations.forEach(function (station) {
        if (station.data.id !== 'last' && station.data.id !== 'first') {
            toExport.push({ station: station.data.name1, type: station.data.type, hidename: station.data.hidename, description: station.data.description, linkDoc: station.data.linkDoc, linkTool: station.data.linkTool, x: station.position.x, y: station.position.y })
        }
    })

    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(toExport), 'stations');
    XLSX.writeFile(wb, 'stations.xlsx');

}

function processUrl() {
    var urlParams;
    (window.onpopstate = function () {
        var match,
            pl = /\+/g,  // Regex for replacing addition symbol with a space
            search = /([^&=]+)=?([^&]*)/g,
            decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
            query = window.location.search.substring(1);

        urlParams = {};
        while (match = search.exec(query))
            urlParams[decode(match[1])] = decode(match[2]);
    })();
    var editmenu = document.getElementById('editmenu');
    editmenu.style.visibility = 'hidden';
    if (urlParams.edit) {
        console.log(urlParams.edit);

        console.log(editmenu)
        editmenu.style.visibility = 'visible';

    }
}

function saveData() { // use the filesaver library for support in IE11

    var tosave = "var elements=" + JSON.stringify(cy.elements().jsons());
    console.log(tosave)
    var saveData = { departments: this.departments, titles: this.titles, settings: this.settings }
    var fileName = 'data.js';
    var fileToSave = new Blob([tosave], {
        type: 'application/json',
        name: fileName
    });
    saveAs(fileToSave, fileName);
}
