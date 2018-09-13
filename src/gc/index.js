function getLang() {
    let search = location.search;
    if(search) {
        let pos = search.indexOf('lang=');
        if(pos !== -1) {
            search = search.substring(pos + 5);
            if(search.indexOf('&') !== -1) {
                search = search.substring(0, search.indexOf('&'));
            }
            return formatLang(search);
        }
    }
    if(window.navigator.language) {
        return formatLang(window.navigator.language);
    }
    return 'EN';
}
function formatLang(lang) {
    if(lang.indexOf('-') !== -1) {
        return lang.substring(lang.indexOf('-') + 1);
    }
    return lang;
}
const lang = getLang();
const messages = i18n.get(lang);
const config = {
    width: 500,
    height: 500,
    youngWidth: 500,
    youngHeight: 20,
    youngX: 0,
    youngY: 100,
    tenuredX: 0,
    splitterWidth: 2,
    maxTenuringThreshold: 15,
    edenSurviveChance: 0.1,
    survivorSurviveChance: 0.7,
    tenuredSurviveChance: 0.8,
    objectBaseSize: 20,
    tickPeriod: 300,
    running: false,
    gcType: 'serialGC',
    parallelThreads: 2,
    oom: false,
    step: null,
    minorGCs: 0,
    majorGCs: 0
};
config.edenWidth = config.youngWidth * 0.6;
config.tenuredWidth = config.youngWidth / 2.5;
config.tenuredY = config.youngY + 100;
config.survivorWidth = (config.youngWidth - config.edenWidth) / 2;
const options = [
    {name: 'edenSurviveChance', label:messages.edenSurviveChanceLabel, title: messages.edenSurviveChanceTitle, width: 6},
    {name: 'survivorSurviveChance', label:messages.survivorSurviveChanceLabel, title: messages.survivorSurviveChanceTitle, width: 6},
    {name: 'tenuredSurviveChance', label:messages.tenuredSurviveChanceLabel, title: messages.tenuredSurviveChanceTitle, width: 6},
    {name: 'maxTenuringThreshold', label:messages.maxTenuringThresholdLabel, title: messages.maxTenuringThresholdTitle, width: 6},
    {name: 'objectBaseSize', label:messages.objectBaseSizeLabel, title: messages.objectBaseSizeTitle, width: 6},
    {name: 'tickPeriod', label:messages.tickPeriodLabel, title:messages.tickPeriodTitle, width: 6}
    ];
const gcTypes = [
    {name: 'serialGC', label: 'Serial GC', description: 'The serial collector is the default for client style machines in Java SE 5 and 6. With the serial collector, both minor and major garbage collections are done serially (using a single virtual CPU). In addition, it uses a mark-compact collection method. This method moves older memory to the beginning of the heap so that new memory allocations are made into a single continuous chunk of memory at the end of the heap. This compacting of memory makes it faster to allocate new chunks of memory to the heap.'},
    {name: 'parallelGC', label: 'Parallel GC', description: 'Multi-thread young generation collector with a single-threaded old generation collector.'},
    {name: 'parallelOldGC', label: 'ParallelOldGC', description: 'The GC is both a multithreaded young generation collector and multithreaded old generation collector. It is also a multithreaded compacting collector. HotSpot does compaction only in the old generation. Young generation in HotSpot is considered a copy collector; therefore, there is no need for compaction.'},
    {name: 'CMS', label: 'Concurrent Mark Sweep ', description: 'The Concurrent Mark Sweep (CMS) collector (also referred to as the concurrent low pause collector) collects the tenured generation. It attempts to minimize the pauses due to garbage collection by doing most of the garbage collection work concurrently with the application threads. Normally the concurrent low pause collector does not copy or compact the live objects. A garbage collection is done without moving the live objects. If fragmentation becomes a problem, allocate a larger heap.'}
];


$(function(){
    const title = $('<h1></h1>').text(messages.title).prependTo($('.container'));
    const langContainer = $('<div></div>').addClass('lang').appendTo(title);
    langContainer.append(`<label>${messages.lang}</label>`);
    const langSelector = $('<select></select>').appendTo(langContainer);
    for(let o in i18n) {
        if(i18n.hasOwnProperty(o) && typeof i18n[o] === 'object') {
            langSelector.append(`<option value="${o}" ${o === lang ? 'selected':''}>${o}</option>`);
        }
    }
    langSelector.change(function(){
       window.location = `${window.location.protocol}//${window.location.host}${window.location.pathname}?lang=${$(this).val()}`;
    });
    const optionsContainer = $('#options');
    for(let option of options) {
        $(`
<div class="form-group col-sm-${option.width}">
    <label title="${option.title}">${option.label}</label>
    <input id="${option.name}" class="form-control" value="${config[option.name]}">
</div>
`).appendTo(optionsContainer).find('input').change(function(){
            config[option.name] = Number($(this).val());
        });
    }

    const gcTypeContainer = $('<div class="form-group col-sm-6"></div>').appendTo(optionsContainer);
    gcTypeContainer.append('<label>GC Types</label>');
    const gcTypeSelector = $('<select class="form-control"></select>').appendTo(gcTypeContainer);
    for(let type of gcTypes) {
        gcTypeSelector.append(`<option value="${type.name}">${type.label}</option>`);
    }
    gcTypeSelector.change(function(){
       config.gcType = $(this).val();
    });
    const gcThreadsContainer = $('<div class="form-group col-sm-6"></div>').appendTo(optionsContainer);
    gcThreadsContainer.append('<label>Parallel GC&CMS Threads</label>');
    $('<input class="form-control">').val(config.parallelThreads).change(function(){
        config.parallelThreads = Number($(this).val());
    }).appendTo(gcThreadsContainer);

    const toolsContainer = $('#tools');
    const startBtn = $('<button id="startBtn" class="btn btn-default"></button>').text(messages.start)
        .appendTo(toolsContainer)
        .click(function(){
            if(config.oom) {
                clear();
            }
        config.running = !config.running;
        $(this).text(config.running ? messages.stop:messages.start);
        updateStatus(config.running ? messages.running : messages.stopped);
    });
    $('<label>Major GC Count: <code id="majorGCStat">0</code></label>').appendTo(toolsContainer);
    $('<label>Minor GC Count: <code id="minorGCStat">0</code></label>').appendTo(toolsContainer);
    $('<label>Status: <code id="status"></code></label>').appendTo(toolsContainer).find('code').text(messages.stopped);
});
function updateStatus(status) {
    $('#status').text(status);
}
var svg = d3.select('#container')
    .attr("preserveAspectRatio", "xMidYMid")
    .attr("viewBox", `0 0 ${config.width} ${config.height}`)
    .attr("width", "100%")
    .attr("height", "100%");
svg.append('pattern')
    .attr('id', 'diagonalHatch')
    .attr('patternUnits', 'userSpaceOnUse')
    .attr('width', 4)
    .attr('height', 4)
    .append('path')
    .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2');

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
    .text(messages.eden);

survivor1._data.label = svg.append('g')
    .attr('class', 'label-container')
    .append('text')
    .attr('x', config.youngX + config.edenWidth + config.survivorWidth / 2)
    .attr('y', config.youngY + config.youngHeight + 16)
    .attr('class', 'label')
    .text(messages.fromSurvivor);

survivor2._data.label = svg.append('g')
    .attr('class', 'label-container')
    .append('text')
    .attr('x', config.youngX + config.edenWidth + config.survivorWidth + config.survivorWidth / 2)
    .attr('y', config.youngY + config.youngHeight + 16)
    .attr('class', 'label')
    .text(messages.toSurvivor);

svg.append('text')
    .attr('x', config.youngX + config.youngWidth/2)
    .attr('y', config.youngY + config.youngHeight + 32)
    .attr('class', 'label')
    .text(messages.youngGeneration);

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
    .text(messages.tenuredGeneration);
svg.append('text')
    .attr('x', config.youngX + config.youngWidth / 2)
    .attr('y', config.youngHeight + 16)
    .attr('class', 'label')
    .text(messages.newObject);
let edenSize = 0;
let edenObjects = [];
let survivorObjects = [];
let tenuredObjects = [];
let survivors = [survivor1, survivor2];
function createObject() {
    const size = Math.ceil(Math.random() * config.objectBaseSize);
    const color = `#${Math.ceil((Math.random() * 9 + 1) * 20).toString(16)}${Math.ceil(Math.random() * 150 + 50).toString(16)}${Math.ceil(Math.random() * 150 + 50).toString(16)}`;
    const c = svg.append('svg')
        .attr('width', size)
        .attr('height', config.youngHeight)
        .attr('x', config.youngX + config.youngWidth / 2 - size / 2)
        .attr('y', 0)
        .attr('class', 'object');
    c.append('rect')
        .attr('width', size)
        .attr('height', config.youngHeight)
        .attr('fill', color);
    c.append('text')
        .attr('x', size / 2)
        .attr('y', config.youngHeight / 2)
        .text(String(0));
    c._data = {size, birth: new Date().getTime()};
    return c;
}
function isCollectible(obj, surviveChance) {
    return Math.random() > surviveChance;
}
function majorGC(obj) {
    // we just finished a major GC, so an OOM should throw.
    if(config.step === null) {
        OOM(obj);
        return;
    }
    updateMajorGCs();
    updateStatus(messages.majorGCStart);
    config.step = 'majorGC';
    switch(config.gcType) {
        case 'serialGC':// same as parallelOldGC
        case 'parallelGC':// same as parallelOldGC
        case 'parallelOldGC':{
            ticks.push(() => {
                const marked = [];
                const collectible = [];
                for(let obj of [...tenuredObjects]) {
                    if(isCollectible(obj, config.tenuredSurviveChance)) {
                        marked.push(mark(obj));
                        collectible.push(collect(obj, tenuredObjects));
                        removeFirst(tenuredObjects, obj);
                    }
                }
                let threads = config.gcType === 'parallelOldGC' ? config.parallelThreads : 1;
                while(marked.length > 0 && threads > 0) {
                    let tasks = [];
                    for(let i = 0;i < threads;i++) {
                        let fn = marked.shift();
                        if(fn) {
                            tasks.push(fn);
                        }
                    }
                    ticks.push(() => {
                        updateStatus(messages.majorGCMarking);
                        tasks.forEach(fn => fn());
                    });
                }
                while(collectible.length > 0 && threads > 0) {
                    let tasks = [];
                    for(let i = 0;i < threads;i++) {
                        let fn = collectible.shift();
                        if(fn) {
                            tasks.push(fn);
                        }
                    }
                    ticks.push(() => {
                        updateStatus(messages.majorGCRecycling);
                        tasks.forEach(fn => fn());
                    });
                }
                ticks.push(() => {
                    // ordering, move old objects to the beginning of the heap
                    bubbleSortObjectsByBirth(tenuredObjects);
                    // compact
                    let offset = 0;
                    for(let obj of tenuredObjects) {
                        // ticks.push(() => {
                            updateStatus(messages.majorGCCompacting);
                            obj.transition()
                                .duration(config.tickPeriod)
                                .attr('x', tenuredGeneration._data.x + offset);
                            offset += obj._data.size;
                        // });
                    }
                    // ticks.push(() => {
                        tenuredGeneration._data.size = 0;
                        for(let obj of tenuredObjects) {
                            tenuredGeneration._data.size += obj._data.size;
                        }
                        updateStatus(messages.majorGCFinished);
                    // });
                    config.step = null;
                    // if(callback) {
                    //     // ticks.push(callback);
                    //     callback();
                    // }
                });
            });
        }
    }
}
function minorGC(callback) {
    updateMinorGCs();
    updateStatus(messages.minorGCStart);
    config.step = 'minorGC';
    ticks.push(() => {
        const toSurvivorObjects = [];
        const marked = [];
        const collectible = [];
        const survivable = [];
        for(let obj of [...edenObjects, ...survivorObjects]) {
            if(isCollectible(obj, obj._data.position === 's'?config.survivorSurviveChance:config.edenSurviveChance)) {
                marked.push(mark(obj));
                collectible.push(collect(obj, edenObjects));
                removeFirst(obj._data.position === 's' ? survivorObjects : edenObjects, obj);
                continue;
            }
            survivable.push(() => {
                const age = Number(obj.select('text').text()) + 1;
                obj.select('text').text(String(age));
                if(age > config.maxTenuringThreshold || obj._data.size + survivors[1]._data.size > config.survivorWidth) {
                    return promote(obj);
                }
                obj._data.position = 's';
                toSurvivorObjects.push(obj);
                obj.transition()
                    .duration(config.tickPeriod)
                    .attr('x', survivors[1]._data.x + survivors[1]._data.size);
                survivors[1]._data.size += obj._data.size;
                return true;
            });
        }
        let threads = config.gcType === 'serialGC' ? 1 : config.parallelThreads;
        while(marked.length > 0 && threads > 0) {
            let tasks = [];
            for(let i = 0;i < threads;i++) {
                let fn = marked.shift();
                if(fn) {
                    tasks.push(fn);
                }
            }
            ticks.push(() => {
                updateStatus(messages.minorGCMarking);
                tasks.forEach(fn => fn());
            });
        }
        while(collectible.length > 0 && threads > 0) {
            let tasks = [];
            for(let i = 0;i < threads;i++) {
                let fn = collectible.shift();
                if(fn) {
                    tasks.push(fn);
                }
            }
            ticks.push(() => {
                updateStatus(messages.minorGCRecycling);
                tasks.forEach(fn => fn());
            });
        }
        // ticks.push(() => {
        //     updateStatus(messages.minorGCRecycling);
        //     collectible.forEach((fn) => fn());
        // });
        // while(promotable.length > 0 && threads > 0) {
        //     let tasks = [];
        //     for(let i = 0;i < threads;i++) {
        //         let fn = promotable.shift();
        //         if(fn) {
        //             tasks.push(fn);
        //         }
        //     }
        //     ticks.push(() => {
        //         handlePromotable(tasks);
        //     });
        // }
        // promotable.forEach(fn => {
        //     ticks.push(fn);
        // });
        // Using single 'thread' for promotion since using multiple 'threads' makes it too complex when meeting major GC.
        ticks.push(() => {
            handleSurvivable(survivable, () => {
                ticks.push(() => {
                    finishMinorGC(toSurvivorObjects);
                    if(callback) {
                        callback();
                    }
                });
            });
        });
    });
}
function finishMinorGC(toSurvivorObjects) {
    edenObjects = [];
    survivorObjects = toSurvivorObjects;
    survivors[0]._data.size = 0;
    const oldFromSurvivor = survivors[0];
    survivors[0] = survivors[1];
    survivors[1] = oldFromSurvivor;
    survivors[0]._data.label.text(messages.fromSurvivor);
    survivors[1]._data.label.text(messages.toSurvivor);
    edenSize = 0;
    updateStatus(messages.minorGCFinished);
    config.step = 'null';
}
function OOM(obj) {
    config.running = false;
    config.oom = true;
    ticks.splice(0, ticks.length);
    $('#startBtn').text(messages.start);
    updateStatus(`OutOfMemoryError, Tenured Size: ${config.tenuredWidth}, Used: ${tenuredGeneration._data.size}, Require: ${obj._data.size}`);
}
function handleSurvivable(tasks, callback) {
    let task = tasks.shift();
    while(task) {
        if(!task()) {
            // meeting major GC, promotion task failed.
            tasks.unshift(task);
            break;
        }
        task = tasks.shift();
    }
    // wait for major GC to be finished.
    if(tasks.length > 0) {
        ticks.push(() => {
            handleSurvivable(tasks, callback);
        });
        return;
    }
    if(callback) {
        callback();
    }
}
function promote(obj) {
    // removeFirst(edenObjects, obj);
    if(tenuredGeneration._data.size + obj._data.size > config.tenuredWidth) {
        console.log(`Tenured Size: ${config.tenuredWidth}, Used: ${tenuredGeneration._data.size}, Require: ${obj._data.size}`);
        majorGC(obj);
        return false;
    }
    obj.transition()
        .duration(config.tickPeriod)
        .attr('x', config.tenuredX + tenuredGeneration._data.size)
        .attr('y', config.tenuredY);
    tenuredObjects.push(obj);
    tenuredGeneration._data.size += obj._data.size;
    return true;
}
function mark(obj) {
    return () => obj.select('rect').attr('fill', 'url(#diagonalHatch)')
}
function collect(obj) {
    return () => {
        obj.transition()
            .duration(config.tickPeriod)
            .attr('width', 1)
            .on('end', () => {
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
    updateStatus(messages.ok);
    const obj = createObject();
    const size = obj._data.size;
    if(edenSize + size > config.edenWidth) {
        minorGC(() => {
            ticks.push(() => {
                updateStatus(messages.running);
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

function bubbleSortObjectsByBirth(arr){
    var len = arr.length;
    for (var i = len-1; i>=0; i--){
        for(var j = 1; j<=i; j++){
            if(arr[j-1]._data.birth<arr[j]._data.birth){
                var temp = arr[j-1];
                arr[j-1] = arr[j];
                arr[j] = temp;
            }
        }
    }
    return arr;
}
function clear() {
    svg.selectAll('.object').each((_, i, array) => d3.select(array[i]).remove());
    edenObjects = [];
    survivorObjects = [];
    tenuredObjects = [];
    edenSize = 0;
    survivor1._data.size = 0;
    survivor2._data.size = 0;
    tenuredGeneration._data.size = 0;
}

function updateMajorGCs(){
    config.majorGCs++;
    $('#majorGCStat').text(config.majorGCs);
}
function updateMinorGCs(){
    config.minorGCs++;
    $('#minorGCStat').text(config.minorGCs);
}
