
const width = 500,
    height = 500;
const youngWidth = 400,youngHeight = 50,  youngX = 0, youngY = 0;
const edenWidth = 200, survivorWidth = (youngWidth - edenWidth)/2;
const tenuredX = 0, tenuredY = youngY + 100, tenuredWidth = 200;
const splitterWidth = 2;

let MaxTenuringThreshold = 5;
let edenCollectChance = 0.8;
let survivorCollectChance = 0.2;
let objectBaseSize = 20;
let tickPeriod = 500;

let running = false;

$(function(){
    $('#edenCollectChance').val(edenCollectChance).change(function(){
        edenCollectChance = Number($(this).val());
    });
    $('#survivorCollectChance').val(survivorCollectChance).change(function(){
        survivorCollectChance = Number($(this).val());
    });
    $('#maxTenuringThreshold').val(MaxTenuringThreshold).change(function(){
        MaxTenuringThreshold = Number($(this).val());
    });
    $('#objectBaseSize').val(objectBaseSize).change(function(){
        objectBaseSize = Number($(this).val());
    });
    $('#tickPeriod').val(tickPeriod).change(function(){
        tickPeriod = Number($(this).val());
    });
    $('#startBtn').click(function(){
        running = !running;
        $(this).text(running ? 'Stop':'Start');
    });
});
function updateStatus(status) {
    $('#status').text(status);
}

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
svg.append('rect')
    .attr('x', youngX + edenWidth)
    .attr('y', youngY)
    .attr('width', splitterWidth)
    .attr('height', youngHeight)
    .attr('class', 'splitter');
const survivor1 = svg.append('rect')
    .attr('x', youngX + edenWidth + splitterWidth)
    .attr('y', youngY)
    .attr('width', survivorWidth)
    .attr('height', youngHeight)
    .attr('class', 'survivor');
survivor1._data = {x: youngX + edenWidth + splitterWidth, size: 0};
svg.append('rect')
    .attr('x', youngX + edenWidth + survivorWidth + splitterWidth)
    .attr('y', youngY)
    .attr('width', splitterWidth)
    .attr('height', youngHeight)
    .attr('class', 'splitter');
const survivor2 = svg.append('rect')
    .attr('x', youngX + edenWidth + survivorWidth + splitterWidth * 2)
    .attr('y', youngY)
    .attr('width', survivorWidth)
    .attr('height', youngHeight)
    .attr('class', 'survivor');
survivor2._data = {x: youngX + edenWidth + survivorWidth + splitterWidth * 2, size: 0};
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
    const size = Math.ceil(Math.random() * objectBaseSize);
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
function isCollectable(chance) {
    return Math.random() < chance;
}
function minorGC() {
    updateStatus('Minor GC start...');
    const toSurvivorObjects = [];
    for(let obj of [...edenObjects, ...survivorObjects]) {
        ticks.push(() => {
            if(isCollectable(obj._data.position === 's'?survivorCollectChance:edenCollectChance)) {
                collect(obj, edenObjects);
                return;
            }
            const age = Number(obj.select('text').text());
            if(age === MaxTenuringThreshold || obj._data.size + survivors[1]._data.size > survivorWidth) {
                promote(obj);
                return;
            }
            obj.select('text').text(String(age + 1));
            obj._data.position = 's';
            toSurvivorObjects.push(obj);
            obj.transition()
                .duration(tickPeriod)
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
        updateStatus('Minor GC finished.');
    });
}
function promote(obj) {
    removeFirst(edenObjects, obj);
    obj.transition()
        .duration(tickPeriod)
        .attr('x', tenuredX + tenuredGeneration._data.size)
        .attr('y', tenuredY);
    tenuredGeneration._data.size += obj._data.size;
}

function collect(obj, objects) {
    obj.select('rect').attr('fill', 'red');
    obj.transition()
        .duration(tickPeriod)
        .attr('width', 1)
        .on('end', () => {
            removeFirst(objects, obj);
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
    if(running) {
        if(ticks.length > 0 ) {
            ticks.shift()();
        } else {
            doCreate();
        }
    }
    setTimeout(() => {
        doTick();
    }, tickPeriod);
}());

function doCreate() {
    updateStatus('OK');
    const obj = createObject();
    const size = obj._data.size;
    if(edenSize + size > edenWidth) {
        minorGC();
        ticks.push(() => {
            edenObjects.push(obj);
            obj.transition()
                .duration(tickPeriod)
                .attr('x', edenSize)
                .attr('y', youngY);
            edenSize += size;
        });
        return;
    }
    edenObjects.push(obj);
    obj.transition()
        .duration(tickPeriod)
        .attr('x', edenSize)
        .attr('y', youngY);
    edenSize += size;
}