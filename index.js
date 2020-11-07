'use strict';

document.getElementById('button').onclick = click;
// Create a worker from worker.js which is loaded using a script tag.
const worker = new Worker(
    URL.createObjectURL(
        new Blob(['(' + workerFunction.toString() + ')()'], { type: 'text/javascript' })
    )
);
const preInfo = document.getElementById('pre-info');
const info = document.getElementById('info');
// This appends text to the parent.
function text(parent, text) {
    const div = document.createElement('div');
    div.innerText = text;
    parent.appendChild(div);
}
// Append a table row.
function table(parent, rowData, tableType) {
    const row = document.createElement('tr');
    rowData.forEach((x) => {
        const cell = document.createElement(tableType);
        cell.innerText = x;
        row.appendChild(cell);
    })
    parent.appendChild(row);
}
// Appends a pre.
function pre(parent, data) {
    const pre = document.createElement('pre');
    pre.innerHTML = data;
    parent.appendChild(pre);
}

function click() {
    console.log('Clicked');
    const input = document.createElement('input');
    input.type = 'file';
    input.style.display = 'none';
    document.body.appendChild(input);
    input.click();
    window.input = input;
    input.onchange = loadFile;
}

function loadFile() {
    console.log('Loading File...');
    const file = input.files[0];
    if (! file.name.endsWith('.csv')) {
        throw new Error('Invalid File. Only `.csv` files are supported.');
    }
    worker.postMessage([file, {
        tolerance: 100, // This number is in years, and represents how old a voter could be before it becomes suspicious.
        /* Settings to be filled in when necessary */
    }]);
    text(preInfo, 'Loading...');
}

worker.onmessage = (msg) => {
    const data = msg.data;
    switch (data.shift()) {
        case 'finished':
            text(preInfo, 'Finished loading.');
            break;
        case 'header':
            table(info, data, 'th');
            break;
        case 'out_of_tolerance':
            table(info, data, 'td');
            break;
        case 'finished_parsing':
            text(preInfo, 'Finished parsing.');
            // These are all the votes that are suspicious, mapped by party.
            text(preInfo, 'Vote Breakdown by Party.');
            pre(preInfo, JSON.stringify(data[0], null, 4));
            text(preInfo, 'Vote Breakdown by Party; Voters over age of 100.');
            pre(preInfo, JSON.stringify(data[1], null, 4));
            text(preInfo, 'Years of registration and number of voters over age of 100 which registered that year.');
            pre(preInfo, JSON.stringify(data[2], null, 4));
            break;
    }
}
