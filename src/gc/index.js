
const width = 500,
    height = 500;
const youngWidth = 400,youngHeight = 50,  youngX = 0, youngY = 0;
const edenWidth = 200, survivorWidth = (youngWidth - edenWidth)/2;
const tenuredX = 0, tenuredY = youngY + 100, tenuredWidth = 200;

const MaxTenuringThreshold = 5;

var svg = d3.select('#container')
    .attr("preserveAspectRatio", "xMidYMid")
    .attr("viewBox", "0 0 500 500")
    .attr("width", "100%")
    .attr("height", "100%");

const youngGeneration = svg.append('rect')
    .attr('x', youngX)
    .attr('y', youngY)
    .attr('width', youngWidth)
    .attr('height', youngHeight)
    .attr('class', 'young-generation');

const eden = svg.append('rect')
    .attr('x', youngX)
    .attr('y', youngY)
    .attr('width', edenWidth)
    .attr('height', youngHeight)
    .attr('class', 'eden');
const survivor1 = svg.append('rect')
    .attr('x', youngX + edenWidth)
    .attr('y', youngY)
    .attr('width', survivorWidth)
    .attr('height', youngHeight)
    .attr('class', 'survivor');
survivor1._data = {x: youngX + edenWidth, size: 0};
const survivor2 = svg.append('rect')
    .attr('x', youngX + edenWidth + survivorWidth)
    .attr('y', youngY)
    .attr('width', survivorWidth)
    .attr('height', youngHeight)
    .attr('class', 'survivor');
survivor2._data = {x: youngX + edenWidth + survivorWidth, size: 0};
svg.append('g')
    .attr('class', 'label-container')
    .append('text')
    .attr('x', youngX + edenWidth / 2)
    .attr('y', youngY + youngHeight + 16)
    .attr('class', 'label')
    .text('Eden');

svg.append('g')
    .attr('class', 'label-container')
    .append('text')
    .attr('x', youngX + edenWidth + survivorWidth / 2)
    .attr('y', youngY + youngHeight + 16)
    .attr('class', 'label')
    .text('Survivor 1');

svg.append('g')
    .attr('class', 'label-container')
    .append('text')
    .attr('x', youngX + edenWidth + survivorWidth + survivorWidth / 2)
    .attr('y', youngY + youngHeight + 16)
    .attr('class', 'label')
    .text('Survivor 2');

svg.append('text')
    .attr('x', youngX + youngWidth/2)
    .attr('y', youngY + youngHeight + 32)
    .attr('class', 'label')
    .text('Young Generation');

const tenuredGeneration = svg.append('rect')
    .attr('x', tenuredX)
    .attr('y', tenuredY)
    .attr('width', tenuredWidth)
    .attr('height', youngHeight)
    .attr('class', 'genured');
tenuredGeneration._data = {size: 0, x: tenuredX};

let edenSize = 0;
let edenObjects = [];
let survivorObjects = [];
let survivors = [survivor1, survivor2];
function createObject() {
    const size = Math.floor(Math.random() * 50 + 1);
    const color = `#${Math.ceil((Math.random() * 9 + 1) * 20).toString(16)}${Math.ceil(Math.random() * 150 + 50).toString(16)}${Math.ceil(Math.random() * 150 + 50).toString(16)}`;
    const c = svg.append('svg')
        .attr('width', size)
        .attr('height', youngHeight)
        .attr('x', youngX + youngWidth / 2)
        .attr('y', youngY + youngHeight + 200);
    const obj = c.append('rect')
        .attr('width', size)
        .attr('height', youngHeight)
        .attr('class', 'object')
        .attr('fill', color);
    const text = c.append('text')
        .attr('x', size / 2)
        .attr('y', youngHeight / 2)
        .attr('class', 'inline-label')
        .text(String(1));
    c._data = {size};
    return c;
}
function isCollectable() {
    return Math.random() > 0.7;
}
function minorGC() {
    const toSurvivorObjects = [];
    for(let obj of [...edenObjects, ...survivorObjects]) {
        ticks.push(() => {
            if(isCollectable()) {
                collect(obj);
                return;
            }
            const age = Number(obj.select('text').text());
            if(age === MaxTenuringThreshold || obj._data.size + survivors[1]._data.size > survivorWidth) {
                promote(obj);
                return;
            }
            obj.select('text').text(String(age + 1));
            toSurvivorObjects.push(obj);
            obj.transition()
                .duration(500)
                .attr('x', survivors[1]._data.x + survivors[1]._data.size);
            survivors[1]._data.size += obj._data.size;
        });
    }
    ticks.push(() => {
        edenObjects = [];
        survivorObjects = toSurvivorObjects;
        survivors[0]._data.size = 0;
        const oldFromSurvivor = survivors[0];
        survivors[0] = survivors[1];
        survivors[1] = oldFromSurvivor;
        edenSize = 0;
        console.log('minor gc finished');
    });
}
function promote(obj) {
    removeFirst(edenObjects, obj);
    obj.transition()
        .duration(500)
        .attr('x', tenuredX + tenuredGeneration._data.size)
        .attr('y', tenuredY);
    tenuredGeneration._data.size += obj._data.size;
}

function collect(obj) {
    obj.select('rect').attr('fill', 'red');
    obj.transition()
        .duration(500)
        .attr('width', 1)
        .on('end', () => {
            removeFirst(edenObjects, obj);
            obj.remove();
        });
}
function removeFirst(array, item) {
    for(let i = 0;i < array.length;i++) {
        if(array[i] === item) {
            array.splice(i, 1);
            break;
        }
    }
}

const ticks = [];
(function doTick() {
    if(ticks.length > 0 ) {
        ticks.shift()();
    } else {
        doCreate();
    }
    setTimeout(() => {
        doTick();
    }, 500);
}());

function doCreate() {
    const obj = createObject();
    const size = obj._data.size;
    if(edenSize + size > edenWidth) {
        minorGC();
        ticks.push(() => {
            edenObjects.push(obj);
            obj.transition()
                .duration(500)
                .attr('x', edenSize)
                .attr('y', youngY);
            edenSize += size;
            console.log('new obj');
        });
        return;
    }
    edenObjects.push(obj);
    obj.transition()
        .duration(500)
        .attr('x', edenSize)
        .attr('y', youngY);
    edenSize += size;
}