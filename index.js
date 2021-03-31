
(async () =>{
    const csv = (await d3.csv('./half-hourly-data.csv')).map(d => {
        const date = d.DATE.split('-')
        date[1] -= 1
        return {
            date: new Date(...date), 
            time: new Date(...[...date, ...d['START TIME'].split(':')]), 
            value: d.USAGE
        }
    })

    function interpolateCosine([ar, ag, ab], [br, bg, bb], [cr, cg, cb], [dr, dg, db]) {
        return t => `rgb(${[
          ar + br * Math.cos(2 * Math.PI * (cr * t + dr)),
          ag + bg * Math.cos(2 * Math.PI * (cg * t + dg)),
          ab + bb * Math.cos(2 * Math.PI * (cb * t + db))
        ].map(v => Math.floor(Math.max(0, Math.min(1, v)) * 255))})`;
      }

    const data = d3.rollups(csv, v => [d3.sum(v, d => d.value), d3.max(v, d => d.value)], t=>t.date)
                   .map(([date, value])=>{return {date, value:value[0], max:value[1] * 2}})

          Object.assign(data, {x:'Hour', y:'Kw'})
    const [max, min] = [d3.max(data, d => d.value), d3.min(data, d => d.value)]
    //const color = d3.scaleLinear([0, 2, 4, 6, 8, 9.99999999, 10, 15], ["white", "MintCream", "OldLace", "NavajoWhite", "Gold", "orange" , "red", "Magenta"])//d3.scaleSequential(d3.interpolateRdYlGn).domain([max, min])
    const color = d3.scaleLinear(["HoneyDew", "Ivory", "Cornsilk", "Yellow", "red", "Magenta", "black"])
                    .domain([2, 4, 6, 8, 10, 12, 14])
    const formatMonth = d3.timeFormat("%b")
    const formatDate = d3.timeFormat("%Y-%m-%d")
    const formatValue = d3.format(".2f")
    const formatDay = i => "SMTWTFS"[i]

    const weekday = "monday"
    const timeWeek = weekday === "sunday" ? d3.timeSunday : d3.timeMonday
    const countDay = weekday === "sunday" ? i => i : i => (i + 6) % 7

    const years = d3.groups(data, d => d.date.getFullYear()).reverse()

    const cellSize = 17, width = 954, height = cellSize * (weekday === "weekday" ? 7 : 9);

    function pathMonth(t) {
        const n = weekday === "weekday" ? 5 : 7;
        const d = Math.max(0, Math.min(n, countDay(t.getDay())));
        const w = timeWeek.count(d3.timeYear(t), t);
        return `${d === 0 ? `M${w * cellSize},0`
            : d === n ? `M${(w + 1) * cellSize},0`
            : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`}V${n * cellSize}`;
    }

    const calendarLegend = d3.select('#legendDiv')
      .append(()=>legend({color, title: "Daily usage, Kwh", tickFormat: ".1f", marginLeft : 20}))
      .select('g')
      calendarLegend.append("rect")
        .attr("width", cellSize - 1)
        .attr("height", cellSize - 1)
        .style("fill", color(10))
        .attr('x', 400)
        .attr('y', -12)
        .attr("stroke", "blue")
        .attr("stroke-width", 1)
    
     calendarLegend.append('text')
        .attr('x', 420)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .attr("class", "title")
        .text('Usage >= 10 Kwh')

    
      calendarLegend.append("rect")
      .attr("width", cellSize - 1)
      .attr("height", cellSize - 1)
      .attr("fill", "url(#diagonalHatch)")
      .attr('x', 520)
      .attr('y', -12)
      .attr("stroke", "blue")
      .attr("stroke-width", 1)

      calendarLegend.append('text')
        .attr('x', 540)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .attr("class", "title")
        .text('Peak >= 3 Kw')
    
    
   

    const svg = d3.select('#calenderChart')
      .attr("viewBox", [0, 0, width, height * years.length])
      .attr("font-family", "sans-serif")
      .attr("font-size", 10);

    var Tooltip = d3.select("#div_template")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "white")
      .style("border", "solid")
      .style("border-width", "2px")
      .style("border-radius", "5px")
      .style("padding", "5px")
    
    const mouseover = function(event, d) {
        Tooltip
            .style("opacity", 1)
        d3.select(this)
            .style("stroke", "black")
            .style("opacity", 0.5)
    }
    const mousemove = function(event, d) {
        const point = d3.pointer(event, window.document.body)
        //console.log(point);
        Tooltip
            .html(`Date ${formatDate(d.date)}<br/>Usage ${formatValue(d.value)}kwh<br/>Peak     ${formatValue(d.max)}kw`)
            .style("left", `${point[0] + 30}px`)
            .style("top", `${point[1]}px`)
        
    }
    const mouseleave = function(event, d) {
        Tooltip
            .style("opacity", 0)
        d3.select(this)
            .style("stroke", "blue")
            .attr("stroke-width", d => d.value >= 10 ? 1 : 0)
            .style("opacity", 0.8)
    }

    const defs = svg.append('defs')
    defs.append('pattern')
        .attr('id', 'diagonalHatch')
        .attr('patternUnits', 'userSpaceOnUse')
        .attr('width', 4)
        .attr('height', 4)
    .append('path')
        .attr('d', 'M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2')
        .attr('stroke', 'black')
        .attr('stroke-width', 0.5);
    
    const sunriseGradient = defs.append('linearGradient')
        .attr('id', 'sunriseGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', "100%")
        .attr('y2', "0%")
    
    sunriseGradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', 'rgb(0,0,128)')
        .style('stop-opacity','1')

    sunriseGradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', 'rgb(255,255,255)')
        .style('stop-opacity','1')
    
    const sunsetGradient = defs.append('linearGradient')
        .attr('id', 'sunsetGradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', "100%")
        .attr('y2', "0%")
    
    sunsetGradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', 'rgb(255,255,255)')
        .style('stop-opacity','1')

    sunsetGradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', 'rgb(0,0,128)')
        .style('stop-opacity','1')
    
    const year = svg.selectAll("g")
        .data(years)
        .join("g")
        .attr("transform", (d, i) => `translate(40.5,${height * i + cellSize * 1.5})`);

    year.append("text")
        .attr("x", -5)
        .attr("y", -5)
        .attr("font-weight", "bold")
        .attr("text-anchor", "end")
        .text(([key]) => key);

    year.append("g")
        .attr("text-anchor", "end")
        .selectAll("text")
        .data(weekday === "weekday" ? d3.range(1, 6) : d3.range(7))
        .join("text")
        .attr("x", -5)
        .attr("y", i => (countDay(i) + 0.5) * cellSize)
        .attr("dy", "0.31em")
        .text(formatDay);


    year.append("g")
        .selectAll("rect")
        .data(weekday === "weekday"
            ? ([, values]) => values.filter(d => ![0, 6].includes(d.date.getDay()))
            : ([, values]) => values)
        .join("rect")
        .attr("width", cellSize - 1)
        .attr("height", cellSize - 1)
        .attr("x", d => timeWeek.count(d3.timeYear(d.date), d.date) * cellSize + 0.5)
        .attr("y", d => countDay(d.date.getDay()) * cellSize + 0.5)
        .attr("stroke", "blue")
        .attr("stroke-width", d => d.value >= 10 ? 1 : 0)
        .style("fill", d => color(d.value))
        .style("cursor", "pointer")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", (event, d) => update(dailyFilter(d.date)));
       
        

    year.append("g")
        .selectAll("rect")
        .data(weekday === "weekday"
            ? ([, values]) => values.filter(d => ![0, 6].includes(d.date.getDay())).filter(d => d.max >= 3)
            : ([, values]) => values.filter(d => d.max >= 3))
        .join("rect")
        .attr("width", cellSize - 1)
        .attr("height", cellSize - 1)
        .attr("stroke", "blue")
        .attr("stroke-width", d => d.value >= 10 ? 1 : 0)
        .attr("x", d => timeWeek.count(d3.timeYear(d.date), d.date) * cellSize + 0.5)
        .attr("y", d => countDay(d.date.getDay()) * cellSize + 0.5)
        .attr("fill", "url(#diagonalHatch)")
        .style("cursor", "pointer")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", (event, d) => update(dailyFilter(d.date)))
        
    
    const month = year.append("g")
        .selectAll("g")
        .data(([, values]) => d3.timeMonths(d3.timeMonth(values[0].date), values[values.length - 1].date))
        .join("g");

    month.filter((d, i) => i).append("path")
        .attr("fill", "none")
        .attr("stroke", "#000000")
        .attr("stroke-width", 1)
        .attr("d", pathMonth);

    month.append("text")
        .attr("x", d => timeWeek.count(d3.timeYear(d), timeWeek.ceil(d)) * cellSize + 2)
        .attr("y", -5)
        .style("cursor", "pointer")
        .text(formatMonth)
        .on('click', (event, d) => update(monthlyFilter(d)))
        // .on('click' (e, d)=>{
        //     const monthData = csv.filter(t => d.date.getMonth() == t.getMonth())
        //                          .map(({date, time, value})=>{return{date, time, value:value*2}});
        // });
    
    const maxWatt = 6
    //const _top = height - 400;

    update = (function line(){
        const height = 200, margin = ({top: 20, right: 30, bottom: 20, left: 40})
        
        const x = d3.scaleTime()
            .range([margin.left, width - margin.right])
        
        const y = d3.scaleLinear()
            .domain([0, maxWatt]).nice()
            .range([height - margin.bottom, margin.top])

        const xAxis = g => g
            .attr("transform", `translate(0,${height - margin.bottom})`)
            .call(d3.axisBottom(x).ticks(width / 48).tickSizeOuter(0).tickFormat(d3.timeFormat('%H:00')))

        const yAxis = g => g
            .attr("transform", `translate(${margin.left}, 0)`)
            .call(d3.axisLeft(y))
            .call(g => g.select(".domain").remove())
            .call(g => g.select(".tick:last-of-type text").clone()
                .attr("x", -10)
                .attr("y", -10)
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .text(data.y))
        
        var svg = d3.select('#dayLineChart')
            .attr("viewBox", [0, 0, width, height])
        svg.append("g")
            .call(xAxis);
    
        svg.append("g")
            .call(yAxis);
        
        
        // const line = d3.line()
        //     .defined(d => !isNaN(d.value))
        //     .x(d => x(d.time))
        //     .y(d => y(d.value))
        
        const beforeDawn = svg.append('rect')
            .attr("fill", 'rgba(0, 0, 128, 1)')
            .attr("height", height - margin.top - margin.bottom - 0.5)
            .attr("y", margin.top)
            
        
        const sunrise = svg.append('rect')
            .attr("fill", 'url(#sunriseGradient)')
            .attr("height", height - margin.top - margin.bottom - 0.5)
            .attr("y", margin.top)
        
        
        const beforeSunset = svg.append('rect')
            .attr("fill", 'url(#sunsetGradient)')
            .attr("height", height - margin.top - margin.bottom - 0.5)
            .attr("y", margin.top)

        const sunset = svg.append('rect')
            .attr("fill", 'rgba(0, 0, 128, 1)')
            .attr("height", height - margin.top - margin.bottom - 0.5)
            .attr("y", margin.top)
            

        svg.append("path")
            .attr("stroke", "red")
            .attr("stroke-width", 1.5)
            .attr("d", d3.line()([[margin.left, y(3)], [width - margin.right, y(3)]]))
            .style("z-index", 10)
        const names = [...["Fridge"], ...Object.keys(config)];
        const colors = d3.scaleOrdinal().domain(names)
                        .range(d3.quantize(t => d3.interpolateSpectral(t *0.9 + 0.1), names.length).reverse())

        d3.select('#lineChartLegend')
            .append('span')
            .attr('id', 'dayChartTilte')
            .attr('class', 'chartTitle')
            .style('margin-left', '20px')
            
            
        d3.select('#lineChartLegend')
            .append(()=>swatches({color:colors}))
            .style('float', "right")
            .style('margin-right','20px');
        

        function update({date, tomorrow, data, times}){
            x.domain([date, tomorrow])
            const data_ = gernerate(date, tomorrow, 1);
            const series = d3.stack().keys(names)(data_)
            
            d3.select('#lineChartLegend span')
                .html(date.toLocaleDateString() + ' Usage 13.6 Kwh, Peak 3.8 Kw')

            const area = d3.area()
                .x(d => x(d.data.date))
                .y0(d => y(d[0]))
                .y1(d => y(d[1]))

            svg.selectAll("path.area")
                .data(series)
                .join("path")
                .attr("class", 'area')
                .attr("fill", ({key}) => colors(key))
                .attr("d", area)
                .append("title")
                .text(({key}) => key);
            
            beforeDawn.attr("x", x(date))
            beforeDawn.attr("width", x(times.dawn) - x(date))
            
            sunrise.attr("x", x(times.dawn))
            sunrise.attr("width", x(times.sunriseEnd) - x(times.dawn))

            beforeSunset.attr("x", x(times.goldenHour))
            beforeSunset.attr("width", x(times.sunset) - x(times.goldenHour))

            sunset.attr("x", x(times.sunset))
            sunset.attr("width", x(tomorrow) - x(times.sunset))
        }
        return update
    })()

    function dailyFilter(date){
        const data = csv.filter(d => d.date.getTime() == date.getTime()).map(({date, time, value})=>{return{date, time, value:value*2}});
        var tomorrow = new Date(date.getTime() + 86400000);
        var times = SunCalc.getTimes(tomorrow, -37.783333, 175.283333);
        //console.log(Object.entries(times).sort(a, b => a[0] - b[0]))
        return {date, tomorrow, data, times}
    }

    function monthlyFilter(date){
        const dateTime = date.getTime();
        const data = d3.rollups(csv.filter(d => d.date.getMonth() == date.getMonth()), 
            v => [d3.max(v, d => d.value)], t=> new Date(dateTime + t.time.getHours() * 3600000 + t.time.getMinutes() * 60000))
            .map(([time, value])=>{return {date, time, value:value[0] * 2}})
        
        var tomorrow = new Date(dateTime + 86400000);
        var times = SunCalc.getTimes(tomorrow, -37.783333, 175.283333);
        return {date, tomorrow, data, times}
    }
    
    update(dailyFilter(new Date(2020, 1, 1)));

    {
        let data = [
            [.096899, .008859, .000554, .004430, .025471, .024363, .005537, .025471],
            [.001107, .018272, .000000, .004983, .011074, .010520, .002215, .004983],
            [.000554, .002769, .002215, .002215, .003876, .008306, .000554, .003322],
            [.000554, .001107, .000554, .012182, .011628, .006645, .004983, .010520],
            [.002215, .004430, .000000, .002769, .104097, .012182, .004983, .028239],
            [.011628, .026024, .000000, .013843, .087486, .168328, .017165, .055925],
            [.000554, .004983, .000000, .003322, .004430, .008859, .017719, .004430],
            [.002215, .007198, .000000, .003322, .016611, .014950, .001107, .054264]
          ];
        
        //data = data.sort((a,b)=>d3.sum(b) - d3.sum(a))

        data = Object.assign(data, {
            names: ['Heat Pumps', 'Oven', 'Kettle', 'Hair Dryer', 'Clothes dryer', 'Stove', 'Washer', 'Dish Washer'],
            colors: ["#c4c4c4", "#69b40f", "#ec1d25", "#c8125c", "#008fc8", "#10218b", "#134b24", "#737373"]
        })

        for(let i =0; i < data.length; i++){
            data[i][i] = 0
            for(let j = 0; j < data.length; j++){
                if(i != j){
                    const a = data[i][j], b = data[j][i];
                    const max = Math.max(a, b);
                    data[i][j] = max;
                    data[j][i] = max;
                }
            }
        }
        
        const names = data.names === undefined ? d3.range(data.length) : data.names
        //const colors = data.colors === undefined ? d3.quantize(d3.interpolateRainbow, names.length) : data.colors
        const color1 = d3.scaleOrdinal().domain(names)
                        .range(d3.quantize(t => d3.interpolateSpectral(t *0.9 + 0.1), names.length).reverse())

        const height = 954, innerRadius = 387, outerRadius = 417
        function ticks({startAngle, endAngle, value}) {
            const k = (endAngle - startAngle) / value;
            return d3.range(0, value, tickStep).map(value => {
                return {value, angle: value * k + startAngle};
            });
        }
        const tickStep = d3.tickStep(0, d3.sum(data.flat()), 100)
        const formatValue = d3.format(".1~%")
        const chord = d3.chord()
            .padAngle(10 / innerRadius)
            .sortSubgroups(d3.descending)
            .sortChords(d3.descending)
        
        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
        const ribbon = d3.ribbon()
            .radius(innerRadius - 1)
            .padAngle(1 / innerRadius)
        
        const svg = d3.create("svg")
      .attr("viewBox", [-width / 2, -height / 2, width, height]);

  const chords = chord(data);

  const textId = DOM.uid("text");

  svg.append("path")
      .attr("id", textId.id)
      .attr("fill", "none")
      .attr("d", d3.arc()({outerRadius, startAngle: 0, endAngle: 2 * Math.PI}));

  svg.append("g")
      .attr("fill-opacity", 0.8)
    .selectAll("g")
    .data(chords)
    .join("path")
      .attr("d", ribbon)
      .attr("fill", d => color1(names[d.source.index]))
      .style("mix-blend-mode", "multiply")
    .append("title")
      .text(d => `${names[d.source.index]} and ${names[d.target.index]} ${d.source.value * 100 | 0} times`);

  svg.append("g")
      .attr("font-family", "sans-serif")
      .attr("font-size", 18)
    .selectAll("g")
    .data(chords.groups)
    .join("g")
      .call(g => g.append("path")
        .attr("d", arc)
        .attr("fill", d => color1(names[d.index]))
        .attr("stroke", "#fff"))
      .call(g => g.append("text")
        .attr("dy", -10)
      .append("textPath")
        .attr("xlink:href", textId.href)
        .attr("startOffset", d => outerRadius*(d.startAngle + d.endAngle) /2.038) 
        .text(d => names[d.index]))
      .call(g => g.append("title")
        .text(d => `${names[d.index]} ${d3.sum(data[d.index]) * 100 | 0} times`));
  
 
        d3.select('#chord').append(() => svg.node())
    }
    //
})();
