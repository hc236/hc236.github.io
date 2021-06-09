// let year = 2017
// let type = "Salary"
// let subject = "devType"

const options = {
    year:2017,
    type:"Salary",
    subject:"devType",
}

const barWidth = 120, barHeight = 22;
const margin = {left: 120, right: 20, top: 20, bottom: 20}
const width = barWidth * (8 + 2)
const height = barHeight * 30

const chart = d3.select('#chart')


d3.json("./data.json")
.then((data) => {
    window.data = data;
    update()
})

const controls = document.querySelector('.controls');
controls.addEventListener('click', (event)=>{
    if(event.target.tagName === 'SPAN'){
        [...event.target.parentNode.querySelectorAll('span')].forEach(t=>t.className='')
        const t = event.target.textContent
        event.target.className = 'selected'
        const name = [...event.target.parentNode.classList].slice(-1)[0]
        options[name] = t;
        console.log(options)
        update()
    }
})
const columnNames = {
"Amazon Web Services (AWS)": "AWS",
"Developer with a statistics or mathematics background": "Statistician",
"Desktop applications developer": "Desktop developer",
"Embedded applications/devices developer": "Embedded developer",
"Developer, desktop or enterprise applications": "Desktop developer",
"Desktop or enterprise applications developer":"Desktop developer",
"Developer, back-end": "Back-end Developer",
"Developer, full-stack": "Full-stack Developer",
"Developer, front-end": "Front-end Developer",
"Microsoft SQL Server": "SQL Server",
"Windows Desktop or Server": "Windows"}
function update(){
    const {year, type, subject} = options;
    const columns = data.columns;
    const filteredColumns = columns[year][subject].slice(0, 8)
    const filteredData = data[year].map(d=> {
        const result = {Country: d["Country"]}
        filteredColumns.forEach(c => result[c[0]] = d[type][subject][c[0]])
        return result;
    });
    const orderedColunms = filteredColumns.map((c) => {
        return [c[0], d3.max(filteredData.map(d => d[c[0]])), d3.min(filteredData.map(d => d[c[0]]))]
    }).sort((a, b) => d3.descending(a[1], b[1]));

    const orderedData = orderedColunms.map((c, i) => {
        return filteredData.map(d => {
            return {rowName: d["Country"], colName: c[0], value:d[c[0]] || 0, col: i}
        })
        .sort((a, b) =>d3.descending(a.value, b.value))
        .map((d, i)=> {return {...d, row:i}})
    })
    
    const max = orderedColunms[0][1]
    const dataRows = orderedData[0]
                .map(d=>[d, ...orderedData.slice(1,orderedColunms.length).map(t=> {
                    
                    return t.find(p => p.rowName === d.rowName)}
                )])
    
    const x = d3.scaleLinear().domain([7, 0]).range([barWidth * 8, 0])
    const y = d3.scaleLinear().domain([29, 0]).range([barHeight * 30, 0])
    const widthScale = d3.scaleLinear().domain([max, 0]).range([100, 0])

    const line = d3.line(
        (d, i)=> {
        if(i == 0) return margin.left - 10;
        if(i == 8 * 2 - 1) return width;
        
        let midOffset = (widthScale(max) - widthScale(d.value)) * 0.5;
        
        let result = x(d.col) + margin.left;
        if(type !== "BigMac") {
            result += midOffset;
            result +=  (i % 2 ? widthScale(d.value) + 10: - 10)
        }
        else{
            result +=  (i % 2 ? Math.ceil(d.value / 10) * 16.5  + 10: - 10)
        }

        return result
    }, (d, i) => y(d.row) + 30 + 5)

    const pLine = (p) => {
        const d = []
        p.forEach(c=> {d.push(c), d.push(c)})

        return line(d)
    }
    
    chart.select("svg").remove();
    const svg = chart.append("svg")
			.attr("width",width)
			.attr("height",height);

    const _colunms = svg.selectAll(".column")
        .data(orderedColunms)
        .join("g")
        .attr("class","column")
        .attr('transform', (d, i) => `translate(${x(i) + 120}, 20)`)
    
    _colunms.append("text")
        .text(d=> columnNames[d[0]] || d[0])
    
    const countries = svg.selectAll(".country")
        .data(dataRows)
        .join("g")
        .attr("class", "country")
    
    countries.append("path")
        .attr("class", "line")
        .attr("stroke-width", "1")
        .attr("stroke","black")
        .attr("fill", "none")
        .attr("d", pLine)
    
    countries
        .append('g')
        .attr("class", 'countryName')
        .attr('transform', d => `translate(0, ${y(d[0].row) + 40})`)
        .append("text")
        .text(d=> d[0].rowName)
   
    if(type !== "BigMac"){
        const bars = countries
    .selectAll('g.bar')
        .data((d)=>d)
        .join("g")
        .attr("class","bar")
        .attr("transform", (i) => {
            return `translate(${x(i.col) + margin.left}, ${y(i.row) + 30})`
        })


        bars.append("rect")
        .attr("width", (j) => widthScale(j.value))
        .attr("transform",  (j) => `translate(${(widthScale(max) - widthScale(j.value)) * 0.5}, 0)`)
        .attr("height", `${barHeight/2}`)

        bars.append('text')
        .text(d=>d.value && d.value.toFixed(2))
        .attr("class", "label")
        .attr("transform", function(j){
            return `translate(${-this.getBBox().width + (widthScale(max) - widthScale(j.value)) * 0.5 - 5}, 0)`
        })
        
    }
    else{
        const bigMacs = countries
            .selectAll('g.bigMac')
            .data((d)=>d)
            .join("g")
            .attr('class', 'bigMac')
            .attr("transform", (i) => {
                return `translate(${x(i.col) + margin.left}, ${y(i.row) + 41.5})`
            })
            // .attr("width", (j) => 16.5 * (j.value / 10))
            // .attr("height", `${21.5}`)
            
            bigMacs.append("text")
                .text((j) => "🍔".repeat(Math.ceil((j.value)/10)));

            bigMacs.append('text')
                .text(d=>((d.value)).toFixed(2))
                .attr("class", "label")
                .attr("transform", function(j){
                    return `translate(${-this.getBBox().width - 5}, -10)`
                })
    }
}