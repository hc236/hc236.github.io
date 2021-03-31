// const SunCalc = require('./suncalc.js')
const config = {
    Kettle :{power:[2, 2.4], period: [5, 15], floating: 0.4,
             times:[{time:0, probability:0.8},
                   {time:1, probability:0.4},
                   {time:2, probability:0.8}]
            },
    "Dish Washer":{power:[0.5, 1.8], period: [60, 180], floating: 0.5,
                   times:[{time:3, probability:0.8}]
            },
    "Heat Pump":{power:[1, 1.5], period: [30, 180], floating: 0.2,
                times:[{time:3, probability:0.1}]
         },
    Washer  : {power:[1, 2], period: [45, 90], floating: 0.4,
               times:[{time:0, probability:0.16},
                   {time:1, probability:0.16},
                   {time:2, probability:0.16}]
               },
    "Cloth Dryer"  : {power:[1, 2], period: [45, 90], floating: 0.4,
                times:[{time:0, probability:0.16},
                   {time:1, probability:0.16},
                   {time:2, probability:0.16}]
               },
    "Hair Dryer"  : {power:[1, 1.5], period: [15, 20], floating: 0.4,
        times:[
            {time:0, probability:0.16},
            {time:1, probability:0.16},
            {time:2, probability:0.16}]
        },
    
    Oven  : {power:[1, 2.4], period: [20, 90], floating: 0.4,
            times:[{time:0, probability:0.2},
               {time:1, probability:0.2},
               {time:2, probability:0.2}]
           },
    Stove : {power:[0.8, 2.4], period: [20, 90], floating: 0.4,
    times:[{time:0, probability:0.8},
            {time:1, probability:0.8},
            {time:2, probability:0.8}]
    }
}

function appliance(dateTime, {power, period, times, floating}){
    const tomorrow = dateTime + 86400000;
    const sunTimes = SunCalc.getTimes(new Date(tomorrow), -37.783333, 175.283333);
    
    const dayTimes = [sunTimes.goldenHourEnd, sunTimes.solarNoon, sunTimes.goldenHour, sunTimes.dusk]
    const runingTimes = []
    for(const {time, probability} of times){
        if(Math.random() <= probability){
            const startTime = dayTimes[time].getTime() + (Math.random() - 0.5) * 3600000 * 1.5;
            const endTime = startTime + ((period[1] - period[0]) * Math.random() + period[0]) * 60000;
            const runingPower = (power[1] - power[0]) * Math.random() + power[0];
            runingTimes.push({startTime, endTime, runingPower, sum:0});
        }
    }
    return {calc:function(time){
        var result = 0;
        runingTimes.forEach(t => {
            const {startTime, endTime, runingPower} = t;
            if(time >= startTime && time <= endTime){
                result = runingPower + floating * (Math.random() - 0.5)
                t.sum += result;
            }
        })
        return result;
    }, runingTimes}
}

function gernerate(startDate, endDate, interval){

    const startTime = startDate.getTime(), endTime = endDate.getTime();
    const data = [];
    const daysGroup = [];
    const configs = Object.entries(config);
    const days = (endTime - startTime) / 86400000;
    const timesPerDay = 86400000 / 60000 / interval;
    for(let dayIndex = 0; dayIndex < days; dayIndex++){
        const dayStartTime = startTime + dayIndex * 86400000
        const applianceMap = {}
        daysGroup.push(applianceMap)
        configs.forEach(([key, obj])=>{
            applianceMap[key] = appliance(dayStartTime, obj);
        })

        for(let timeIndex = 0; timeIndex < timesPerDay; timeIndex ++){
            const time = dayStartTime + timeIndex * interval * 60000;
            const item = {date: new Date(time)}
            data.push(item);
            item.Sum = 0
            item.Fridge = 0.1 + (Math.random() - 0.5) * 0.04
            
            Object.entries(applianceMap).forEach(([key, obj])=>{
                item[key] = obj.calc(time);
                item.Sum += item[key]
            })
        }
    }
    console.log(data.map(t=>{
        let obj = {};
        Object.entries(t).forEach(([key, val])=> obj[key] = key == 'date' ? `${val.getHours()}:${val.getMinutes()}` : val)
        return obj;
    }))
    return {data, daysGroup};
}

// const result = gernerate(new Date(2020, 0, 1), new Date(2020, 0, 2), 10);
// console.log(result)