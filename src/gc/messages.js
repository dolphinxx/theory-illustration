const i18n = {
    'CN': {
        lang: '语言',
        title: 'Java分代垃圾回收演示',
        edenSurviveChanceLabel: '伊甸区对象存活机率',
        edenSurviveChanceTitle: '伊甸区对象存活机率，范围：0-1',
        survivorSurviveChanceLabel: '生存区对象存活机率',
        survivorSurviveChanceTitle: '生存区对象存活机率，范围：0-1',
        maxTenuringThresholdLabel: '老年化阈值',
        maxTenuringThresholdTitle: '达到该阈值',
        objectBaseSizeLabel: 'Object Base Size',
        objectBaseSizeTitle: 'The object\'s size = Math.random() * objectBaseSize',
        tickPeriodLabel: 'Tick Period',
        tickPeriodTitle: 'The period objects create & the duration of transitions',
        stop: '停止',
        start: '开始',
        stopped: '已停止',
        running: '运行中',
        eden: 'Eden',
        fromSurvivor:'From Survivor',
        toSurvivor: 'To Survivor',
        youngGeneration:'Young Generation',
        tenuredGeneration: 'Tenured Generation',
        newObject: '创建新对象',
        minorGCStart: '开始Minor GC...',
        minorGCMarking:'Minor GC标记中',
        minorGCRecycling: 'Minor GC回收中',
        minorGCFinished: 'Minor GC完成',
    },
    'EN': {
        lang: 'Language',
        title: 'Java Generational Garbage Collection Illustration',
        edenSurviveChanceLabel: 'Eden Survive Chance',
        edenSurviveChanceTitle: 'The chance for the eden\'s objects to survive, range: 0-1',
        survivorSurviveChanceLabel: 'Survivor Survive Chance',
        survivorSurviveChanceTitle: 'The chance for the from survivor\'s objects to survive, range: 0-1',
        maxTenuringThresholdLabel: 'Max Tenuring Threshold',
        maxTenuringThresholdTitle: '',
        objectBaseSizeLabel: 'Object Base Size',
        objectBaseSizeTitle: 'The object\'s size = Math.random() * objectBaseSize',
        tickPeriodLabel: 'Tick Period',
        tickPeriodTitle: 'The period objects create & the duration of transitions',
        stop: 'Stop',
        start: 'Start',
        stopped: 'Stopped',
        running: 'Running',
        eden: 'Eden',
        fromSurvivor:'From Survivor',
        toSurvivor: 'To Survivor',
        youngGeneration:'Young Generation',
        tenuredGeneration: 'Tenured Generation',
        newObject: 'New Object',
        minorGCStart: 'Minor GC start...',
        minorGCMarking:'Minor GC marking',
        minorGCRecycling: 'Minor GC recycling',
        minorGCFinished: 'Minor GC finished.',
    },
    get(lang) {
        if (lang.indexOf('-') !== -1) {
            lang = lang.substring(lang.indexOf('-') + 1);
        }
        if (this.hasOwnProperty(lang)) {
            return lang === 'EN' ? this.EN : Object.assign(this.EN, this[lang]);
        }
        return this.EN;
    }
};