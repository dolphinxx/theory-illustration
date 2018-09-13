const config = {
    width: 500,
    height: 500,
    youngWidth: 400,
    youngHeight: 20,
    youngX: 0,
    youngY: 100,
    edenWidth: 200,
    tenuredX: 0,
    tenuredWidth: 200,
    splitterWidth: 2,
    maxTenuringThreshold: 5,
    edenCollectChance: 0.8,
    survivorCollectChance: 0.2,
    objectBaseSize: 20,
    tickPeriod: 500,
    running: false
};
config.tenuredY = config.youngY + 100;
config.survivorWidth = (config.youngWidth - config.edenWidth) / 2;
const options = [
    {name: 'edenCollectChance', label:'Eden Collect Chance', title: 'The chance for the eden\'s objects to be collected, range: 0-1'},
    {name: 'survivorCollectChance', label:'Survivor Collect Chance', title: 'The chance for the from survivor\'s objects to be collected, range: 0-1'},
    {name: 'maxTenuringThreshold', label:'Max Tenuring Threshold', title: ''},
    {name: 'objectBaseSize', label:'Object Base Size', title: 'The object\'s size = Math.random() * objectBaseSize'},
    {name: 'tickPeriod', label:'Tick Period', title: 'The period objects create & the duration of transitions'}
    ];


$(function(){
    const optionsContainer = $('#options');
    for(let option of options) {
        $(`
<div class="form-group col-sm-6">
    <label title="${option.title}">${option.label}</label>
    <input id="${option.name}" class="form-control" value="${config[option.name]}">
</div>
`).appendTo(optionsContainer).find('input').change(function(){
            config[option.name] = Number($(this).val());
        });
    }
    $('#startBtn').click(function(){
        config.running = !config.running;
        $(this).text(config.running ? 'Stop':'Start');
        updateStatus(config.running ? 'OK' : 'Stopped');
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
svg.append('pattern')
    .attr('id', 'diagonalHatch')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 4)
    .attr('height', 4)
    .append('path')
    .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
    .attr('style', 'stroke:red;stroke-width:0.5');

const youngGeneration = svg.append('rect')
    .attr('x', config.youngX)
    .attr('y', config.youngY)
    .attr('width', config.youngWidth)
    .attr('height', config.youngHeight)
    .attr('class', 'young-generation');

const eden = svg.append('rect')
    .attr('x', config.youngX)
    .attr('y', config.youngY)
    .attr('width', config.edenWidth)
    .attr('height', config.youngHeight)
    .attr('class', 'eden');
svg.append('rect')
    .attr('x', config.youngX + config.edenWidth)
    .attr('y', config.youngY)
    .attr('width', config.splitterWidth)
    .attr('height', config.youngHeight)
    .attr('class', 'splitter');
const survivor1 = svg.append('rect')
    .attr('x', config.youngX + config.edenWidth + config.splitterWidth)
    .attr('y', config.youngY)
    .attr('width', config.survivorWidth)
    .attr('height', config.youngHeight)
    .attr('class', 'survivor');
survivor1._data = {x: config.youngX + config.edenWidth + config.splitterWidth, size: 0, position: 1};
svg.append('rect')
    .attr('x', config.youngX + config.edenWidth + config.survivorWidth + config.splitterWidth)
    .attr('y', config.youngY)
    .attr('width', config.splitterWidth)
    .attr('height', config.youngHeight)
    .attr('class', 'splitter');
const survivor2 = svg.append('rect')
    .attr('x', config.youngX + config.edenWidth + config.survivorWidth + config.splitterWidth * 2)
    .attr('y', config.youngY)
    .attr('width', config.survivorWidth)
    .attr('height', config.youngHeight)
    .attr('class', 'survivor');
survivor2._data = {x: config.youngX + config.edenWidth + config.survivorWidth + config.splitterWidth * 2, size: 0, position: 2};
svg.append('g')
    .attr('class', 'label-container')
    .append('text')
    .attr('x', config.youngX + config.edenWidth / 2)
    .attr('y', config.youngY + config.youngHeight + 16)
    .attr('class', 'label')
    .text('Eden');

survivor1._data.label = svg.append('g')
    .attr('class', 'label-container')
    .append('text')
    .attr('x', config.youngX + config.edenWidth + config.survivorWidth / 2)
    .attr('y', config.youngY + config.youngHeight + 16)
    .attr('class', 'label')
    .text('From Survivor');

survivor2._data.label = svg.append('g')
    .attr('class', 'label-container')
    .append('text')
    .attr('x', config.youngX + config.edenWidth + config.survivorWidth + config.survivorWidth / 2)
    .attr('y', config.youngY + config.youngHeight + 16)
    .attr('class', 'label')
    .text('To Survivor');

svg.append('text')
    .attr('x', config.youngX + config.youngWidth/2)
    .attr('y', config.youngY + config.youngHeight + 32)
    .attr('class', 'label')
    .text('Young Generation');

const tenuredGeneration = svg.append('rect')
    .attr('x', config.tenuredX)
    .attr('y', config.tenuredY)
    .attr('width', config.tenuredWidth)
    .attr('height', config.youngHeight)
    .attr('class', 'tenured');
tenuredGeneration._data = {size: 0, x: config.tenuredX};
svg.append('text')
    .attr('x', config.tenuredX + config.tenuredWidth/2)
    .attr('y', config.tenuredY + config.youngHeight + 16)
    .attr('class', 'label')
    .text('Tenured Generation');

let edenSize = 0;
let edenObjects = [];
let survivorObjects = [];
let survivors = [survivor1, survivor2];
function createObject() {
    const size = Math.ceil(Math.random() * config.objectBaseSize);
    const color = `#${Math.ceil((Math.random() * 9 + 1) * 20).toString(16)}${Math.ceil(Math.random() * 150 + 50).toString(16)}${Math.ceil(Math.random() * 150 + 50).toString(16)}`;
    const c = svg.append('svg')
        .attr('width', size)
        .attr('height', config.youngHeight)
        .attr('x', config.youngX + config.youngWidth / 2)
        .attr('y', config.youngY + config.youngHeight + 200);
    c.append('rect')
        .attr('width', size)
        .attr('height', config.youngHeight)
        .attr('class', 'object')
        .attr('fill', color);
    c.append('text')
        .attr('x', size / 2)
        .attr('y', config.youngHeight / 2)
        .attr('class', 'inline-label')
        .text(String(1));
    c._data = {size};
    return c;
}
function isCollectible(chance) {
    return Math.random() < chance;
}
function minorGC(callback) {
    updateStatus('Minor GC start...');
    ticks.push(() => {
        const toSurvivorObjects = [];
        const collectible = [];
        const promotable = [];
        for(let obj of [...edenObjects, ...survivorObjects]) {
            updateStatus('Minor GC marking');
            if(isCollectible(obj._data.position === 's'?config.survivorCollectChance:config.edenCollectChance)) {
                collectible.push(collect(obj, edenObjects));
                continue;
            }
            promotable.push(() => {
                const age = Number(obj.select('text').text());
                if(age === config.maxTenuringThreshold || obj._data.size + survivors[1]._data.size > config.survivorWidth) {
                    promote(obj);
                    return;
                }
                obj.select('text').text(String(age + 1));
                obj._data.position = 's';
                toSurvivorObjects.push(obj);
                obj.transition()
                    .duration(config.tickPeriod)
                    .attr('x', survivors[1]._data.x + survivors[1]._data.size);
                survivors[1]._data.size += obj._data.size;
            });
        }
        ticks.push(() => {
            updateStatus('Minor GC collecting');
            collectible.forEach((fn) => fn());
        });
        promotable.forEach(fn => {
            ticks.push(fn);
        });
        ticks.push(() => {
            edenObjects = [];
            survivorObjects = toSurvivorObjects;
            survivors[0]._data.size = 0;
            const oldFromSurvivor = survivors[0];
            survivors[0] = survivors[1];
            survivors[1] = oldFromSurvivor;
            survivors[0]._data.label.text('From Survivor');
            survivors[1]._data.label.text('To Survivor');
            edenSize = 0;
            updateStatus('Minor GC finished.');
        });
        if(callback) {
            callback();
        }
    });
}
function promote(obj) {
    removeFirst(edenObjects, obj);
    obj.transition()
        .duration(config.tickPeriod)
        .attr('x', config.tenuredX + tenuredGeneration._data.size)
        .attr('y', config.tenuredY);
    tenuredGeneration._data.size += obj._data.size;
}

function collect(obj, objects) {
    obj.select('rect').attr('fill', 'url(#diagonalHatch)');
    return () => {
        obj.transition()
            .duration(config.tickPeriod)
            .attr('width', 1)
            .on('end', () => {
                removeFirst(objects, obj);
                obj.remove();
            });
    };
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
    if(config.running) {
        if(ticks.length > 0 ) {
            ticks.shift()();
        } else {
            doCreate();
        }
    }
    setTimeout(() => {
        doTick();
    }, config.tickPeriod);
}());

function doCreate() {
    updateStatus('OK');
    const obj = createObject();
    const size = obj._data.size;
    if(edenSize + size > config.edenWidth) {
        minorGC(() => {
            ticks.push(() => {
                edenObjects.push(obj);
                obj.transition()
                    .duration(config.tickPeriod)
                    .attr('x', edenSize)
                    .attr('y', config.youngY);
                edenSize += size;
            });
        });
        return;
    }
    edenObjects.push(obj);
    obj.transition()
        .duration(config.tickPeriod)
        .attr('x', edenSize)
        .attr('y', config.youngY);
    edenSize += size;
}