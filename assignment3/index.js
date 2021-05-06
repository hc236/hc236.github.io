const playersImageUrl = "https://resources.premierleague.com/premierleague/photos/players/40x40/"
const teamsImageUrl   = "https://resources.premierleague.com/premierleague/badges/50/"

const margin = {top: 30, right: 30, bottom: 30, left: 30},
    width = 1400 - margin.left - margin.right,
    height = 800 - margin.top - margin.bottom;

const svg = d3.select('body')
    .append("svg")
        .attr("viewBox", [0, 0, width, height])
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

const mouseover = function(event, d, i) {
    Tooltip
        .style("opacity", 1)
    const x = d3.select(this).attr("x") | 0
    const y = d3.select(this).attr("y") | 0
    d3.select(this)
      .attr('width', 40)
      .attr("height", 40)
      .attr("x", ()=> x - 10)
      .attr("y", ()=> y - 10)
      .style("filter", "drop-shadow(0px 0px 4px #4444dd)")
      .raise()
}

const mousemove = function(event, d) {
    const point = d3.pointer(event, window.document.body)
    Tooltip
        .html(d.name)
        .style("left", `${point[0] + 30}px`)
        .style("top", `${point[1]}px`)

    
}
const mouseleave = function(event, d, i) {
    Tooltip
        .style("opacity", 0)
    
    const x = d3.select(this).attr("x") | 0
    const y = d3.select(this).attr("y") | 0

    
    d3.select(this)
      .attr('width', 20)
      .attr("height", 20)
      .attr("x", ()=> x + 10)
      .attr("y", ()=> y + 10)
      .style("filter","drop-shadow(0px 0px 0px #4444dd)")
}

const matchMouseover = function(event, d, i) {
    Tooltip
        .style("opacity", 1)

    const id = d3.select(this).attr("match-id");
    const x = d3.select(this).attr("x") | 0
    const y = d3.select(this).attr("y") | 0
    d3.selectAll(`[match-id="${id}"]`)
    .attr('width', 40)
    .attr("height", 40)
    .attr("x", ()=> x - 10)
    .attr("y", ()=> y - 10)
    .style("filter",()=>{
        let filter = d3.select(this).style("filter")
        return filter + "drop-shadow(0px 0px 4px #4444dd);"
    })
    .raise()
}

const matchMousemove = function(event, d) {
    const point = d3.pointer(event, window.document.body)
    const id = d3.select(this).attr("match-id");
    const match = matches[id|0];

    Tooltip
        .html(`Match<br/>${match[match.winner].team.name} won over ${match[(match.winner + 1) % 2].team.name}`)
        .style("left", `${point[0] + 30}px`)
        .style("top", `${point[1]}px`)
}
const matchMouseleave = function(event, d, i) {
    Tooltip
        .style("opacity", 0)
    const id = d3.select(this).attr("match-id");
    const x = d3.select(this).attr("x") | 0
    const y = d3.select(this).attr("y") | 0
    d3.selectAll(`[match-id="${id}"]`)
      .attr('width', 20)
      .attr("height", 20)
      .attr("x", ()=> x + 10)
      .attr("y", ()=> y + 10)
      .style("filter", "filter: drop-shadow(0px 0px 0px #4444dd);")
    
}
const matches = [];
d3.json("./data.json")
.then((data) => {

    for(let i = 0; i < data.teams.length; i++){
        data.teams[i].rank = Math.random();
    }

    for(let i = 0; i < data.teams.length; i++){
        for(let j = 0; j < data.teams.length; j++){
            if(i != j){
                let match = [{index: i, team: data.teams[i]}, {index:j, team:data.teams[j]}];
                let winner = data.teams[j].rank > data.teams[i].rank ? 1 : 0;
                match.winner = winner;
                matches.push(match);
            }
        }
    }

    const settledPlayers = [], restPlayers = [];
    for(let k = 0; k < 3; k++){
        for(let i = 0; i< data.teams.length; i++){
            let team = data.teams[i];
            if(!team.players)
                team.players = [[],[],[]]
            for(let j = 0; j < 11; j++){
                let playerIndex;
                if(restPlayers.length){
                    let restIndex = Math.random() * restPlayers.length | 0;
                    playerIndex = restPlayers[restIndex];
                    restPlayers.splice(restIndex, 1);
                }else{
                    do{
                        playerIndex = Math.random() * 200 | 0;
                    }while(settledPlayers.includes(playerIndex))
                }
                settledPlayers.push(playerIndex);
                team.players[k].push(playerIndex);
            }
        }
        for(let i = 0; i< 200; i++){
            if(!settledPlayers.includes(i)){
                restPlayers.push(i);
            }
        }
        settledPlayers.splice(0, settledPlayers.length)
    }

    for(let i = 0; i < 90; i++){
        let teamPlayerSet = Math.random() * 3 | 0;//i % 3;
        let match = matches[i];
        match[0].players = data.teams[match[0].index].players[teamPlayerSet];
        match[1].players = data.teams[match[1].index].players[teamPlayerSet];
    }
    // for(let i = 0; i < data.players.length; i++){
        
    //     let playerMatches = [], playerTeams = [];
    //     for(let j = 0; j < 2; j++){

    //         let matchIndex, teamIndex, aOrB, match;
            
    //         do{
    //             matchIndex = Math.random() * 90 | 0
    //             aOrB = Math.random() > 0.5 ? 1 : 0;
    //             match = matches[matchIndex]

    //             teamIndex = match[aOrB].index

    //             if(!match[aOrB].players)
    //               match[aOrB].players = []

    //         }while(playerMatches.includes(matchIndex)
    //             || playerTeams.includes(teamIndex)
    //             || match[aOrB].players.length >= 11)

    //         playerMatches.push(matchIndex);
    //         playerTeams.push(teamIndex);
    //         match[aOrB].players.push(i);

    //     }
    // }

    // for(let i = 0; i < matches.length; i++){
    //     let match = matches[i]
    //     for(let j = 0; j < 2; j++){
    //         let team = match[j];
    //         let team1 = match[(j + 1) % 2];

    //         if(!team.players)
    //             team.players = []
            
    //         if(!team1.players)
    //             team1.players = []

    //         while(team.players.length < 11){
    //             let player;

    //             do{
    //                 player = Math.random() * 200 | 0;
    //             }while(team.players.includes(player) || team1.players.includes(player))

    //             team.players.push(player);
    //         }
    //     }
    // }

    const teamLogo = {size:20, margin:2};
    const centerX = (width - 11 * (teamLogo.size + teamLogo.margin))/ 2;
    const centerY = (height - 11 * (teamLogo.size + teamLogo.margin))/ 2;
    const teamX = (d, i) => (i + 1) * (teamLogo.size + teamLogo.margin) + centerX;
    const teamY = (d, i) => (i + 1) * (teamLogo.size + teamLogo.margin) + centerY;

    const playerX = (d, i, offset) => {
        offset = typeof offset === "number" ? offset : 0;
        let angle = i / 100 * 2 * Math.PI - Math.PI / 2
        const radius = (i >= 100 ? 330 : 300)
        angle += i >= 100 ? 0 : Math.PI / 100
        return Math.cos(angle) * radius + width / 2 + offset
    }
    const playerY = (d, i, offset) => {
        offset = typeof offset === "number" ? offset : 0;
        let angle = i / 100 * 2 * Math.PI - Math.PI / 2
        const radius = (i >= 100 ? 330 : 300)
        angle += i >= 100 ? 0 : Math.PI / 100
        return Math.sin(angle) * radius + height / 2  + offset
    }


    const linksData = (matchIndex, winner) =>{
        const result = [];
        let match = matches[matchIndex]
        let target, teamIndex;
        if(winner){
            teamIndex = match.winner;
        }
        else
            teamIndex = (match.winner + 1) % 2;
        
        let team = match[teamIndex]
        if(teamIndex == 0)
            target = [teamX(team, team.index) + 10, centerY + 10]
        else
            target = [centerX + 10, teamY(team, team.index) + 10]

        for(let i = 0; i < team.players.length; i++){
            let player = team.players[i]
            let source = [playerX(data.players[player], player, 10), playerY(data.players[player], player, 10)];
            let link = {target, source}
            result.push(link);
        }
        return result;
    }

    const link = (d, i) => `M${d.source[0]},${d.source[1]}L${d.target[0]},${d.target[1]}`
    
        
    const links = svg.append('g')
       .attr("class", "links");
    let matchClicked = false;
    const matchClick = function(event, d, i) {
        if(teamClicked || playerClicked || winnerPlayerClicked){
            return;
        }

        links
            .selectAll("path")
            .remove()
        
        matchClicked = !matchClicked
        if(!matchClicked){
            teamAndMatches.selectAll("image").style("display", null);
            playerImages.selectAll("image").style("display", null);
            bar.style("display", null);
            return;
        }
        bar.style("display", "none");
        const node = d3.select(this)
        const id = node.attr("match-id");
        
        links
            .selectAll("path")
            .data(linksData(id, true))
            .join("path")
            .attr("d", link)
            .attr("stroke", "red")
            .exit()
            .data(linksData(id, false))
            .join("path")
            .attr("d", link)
            .attr("stroke", "grey")

        teamAndMatches.selectAll("image").style("display", "none");
        teamAndMatches.selectAll(`image[match-id="${id}"]`).style("display", null);
        teamAndMatches.selectAll(`image[team0-id="${matches[id][0].index}"]`).style("display", null);
        teamAndMatches.selectAll(`image[team1-id="${matches[id][1].index}"]`).style("display", null);
        
        playerImages.selectAll("image").style("display", "none")

        matches[id][0].players.forEach(i=>playerImages.select(`image[player-id="${i}"`).style("display", null))
        matches[id][1].players.forEach(i=>playerImages.select(`image[player-id="${i}"`).style("display", null))
    }

    let teamClicked = false;
    const teamClick = function(event, d, i) {
        if(matchClicked || playerClicked || winnerPlayerClicked){
            return;
        }

        links
            .selectAll("path")
            .remove()

        teamClicked = !teamClicked
        if(!teamClicked){
            teamAndMatches.selectAll("image").style("display", null);
            playerImages.selectAll("image").style("display", null);
            bar.style("display", null);
            return;
        }

        
        teamAndMatches.selectAll("image").style("display", "none");
        playerImages.selectAll("image").style("display", "none");
        bar.style("display", "none");
        let result = []
        
        const node = d3.select(this)
        const id = (node.attr("team0-id") || node.attr("team1-id")) | 0;
        let target = [teamX(data.teams[id], id) + 10, centerY + 10]
        
        if(node.attr("team0-id") === null){
            teamAndMatches.selectAll(`image[team1-id="${id}"]`).style("display", null);
            target = [centerX + 10, teamY(data.teams[id], id) + 10]
        }
        else{
            teamAndMatches.selectAll(`image[team0-id="${id}"]`).style("display", null);
        }
        
        for(let i = 0; i < matches.length; i++){
            let match = matches[i]
            for(let j = 0; j<2; j++){
                team = match[j];
                if(team.index == id){
                    result = [...result, ...team.players.map(p => {
                        let source = [playerX(data.players[p], p, 10), playerY(data.players[p], p, 10)]
                        playerImages.select(`image[player-id="${p}"`).style("display", null)
                        return {source, target}
                        }
                    )]
                }
            }
        }
        
        links
            .selectAll("path")
            .data(result)
            .join("path")
            .attr("d", link)
            .attr("stroke", "red")
        
    }

    let playerClicked = false;
    const playerClick = function(event, d, i) {
        if(matchClicked || teamClicked || winnerPlayerClicked){
            return;
        }
        links
            .selectAll("path")
            .remove()
        
        playerClicked = !playerClicked
        if(!playerClicked){
            teamAndMatches.selectAll("image").style("display", null);
            playerImages.selectAll("image").style("display", null);
            bar.style("display", null);
            return;
        }

        teamAndMatches.selectAll("image").style("display", "none");
        playerImages.selectAll("image").style("display", "none");
        bar.style("display", "none");
        
        
        
        const node = d3.select(this);
        const id = node.attr("player-id")|0;
        playerImages.select(`image[player-id="${id}"`).style("display", null);

        let target = [playerX(data.players[id], id, 10), playerY(data.players[id], id, 10)]
        
        let result = [[],[]];
        for(let i = 0; i < matches.length; i++){
            let match = matches[i]
            for(let j = 0; j<2; j++){
                team = match[j];
                
                if(team.players.includes(id)){
                    if (j == 0){
                        source = [teamX(data.teams[team.index], team.index) + 10, centerY + 10]
                        teamAndMatches.selectAll(`image[team0-id="${team.index}"]`).style("display", null);
                    }
                    else{
                        source = [centerX + 10, teamY(data.teams[team.index], team.index) + 10]
                        teamAndMatches.selectAll(`image[team1-id="${team.index}"]`).style("display", null);
                    }
                    result[j].push({source, target});
                    let teamA = match[0];
                    let teamB = match[1];
                    result[j].push({source, target:[
                        teamX(data.teams[teamA.index], teamA.index) + 10,
                        teamY(data.teams[teamB.index], teamB.index) + 10]
                    });
                    teamAndMatches.selectAll(`image[match-id="${i}"]`).style("display", null)
                }
            }
        }
        links
            .selectAll("path")
            .data(result[0])
            .join("path")
            .attr("d", link)
            .attr("stroke", "red")
            .attr('fill', 'none')
            .exit()
            .data(result[1])
            .join("path")
            .attr("d", link)
            .attr("stroke", "blue")
            .attr('fill', 'none')
        
    }
    let winnerPlayerClicked = false
    const winnerPlayerClick = () =>{
        if(matchClicked || playerClicked || teamClicked){
            return;
        }

        links
            .selectAll("path")
            .remove()

        winnerPlayerClicked = !winnerPlayerClicked
        if(!winnerPlayerClicked){
            playerImages.selectAll("image").style("opacity","1");
            return;
        }
        
        
        playerImages.selectAll("image").style("opacity","0.2");

        for(let i = 0; i < matches.length; i ++){
            let match = matches[i];
            let players = match[match.winner].players;
            players.forEach(p => playerImages.select(`image[player-id="${p}"`).style("opacity","1"))
        }
    }
    const teamAndMatches = svg.append("g")
    teamAndMatches
        .selectAll("image")
        .data(data.teams)
        .join("image")
        .attr('x', teamX)
        .attr('y', centerY)
        .attr('width', teamLogo.size)
        .attr('height', teamLogo.size)
        .attr('team0-id', (d, i)=> i)
        .attr("xlink:href", (d, i)=>teamsImageUrl + d.image)
        .on("mouseenter", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", teamClick)
        .exit()
        .data(data.teams)
        .join("image")
        .attr('x', centerX)
        .attr('y', teamY)
        .attr('team1-id', (d, i)=> i)
        .attr('width', teamLogo.size)
        .attr('height', teamLogo.size)
        .attr("xlink:href", (d, i)=>teamsImageUrl + d.image)
        .on("mouseenter", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", teamClick)
        .exit()
        .data(matches)
        .join("image")
        .attr('x', (d, i) => (d[0].index + 1) * (teamLogo.size + teamLogo.margin) + centerX)
        .attr('y', (d, i) => (d[1].index + 1) * (teamLogo.size + teamLogo.margin) + centerY)
        .attr('width', teamLogo.size)
        .attr('height', teamLogo.size)
        .attr("xlink:href", (d, i)=>teamsImageUrl + d[0].team.image)
        .attr("clip-path", "url(#leftHalf)")
        .attr("style", (d, i)=> d.winner !== 0 ? 'filter: grayscale(100%);opacity:0.5;' : 'filter: grayscale(0%);')
        .attr("match-id", (d, i) => `${i}`)
        .on("mouseenter", matchMouseover)
        .on("mousemove", matchMousemove)
        .on("mouseleave", matchMouseleave)
        .on("click", matchClick)
        .exit()
        .data(matches)
        .join("image")
        .attr('x', (d, i) => (d[0].index + 1) * (teamLogo.size + teamLogo.margin) + centerX)
        .attr('y', (d, i) => (d[1].index + 1) * (teamLogo.size + teamLogo.margin) + centerY)
        .attr('width', teamLogo.size)
        .attr('height', teamLogo.size)
        .attr("xlink:href", (d, i)=>teamsImageUrl + d[1].team.image)
        .attr("clip-path", "url(#rightHalf)")
        .attr("style", (d, i)=> d.winner !== 1 ? 'filter: grayscale(100%);opacity:0.5;' : 'filter: grayscale(0%);')
        .attr("match-id", (d, i) => `${i}`)
        .on("mouseenter", matchMouseover)
        .on("mousemove", matchMousemove)
        .on("mouseleave", matchMouseleave)
        .on("click", matchClick)
    
    const playerImages = svg.append("g")
        playerImages
        .selectAll("image")
        .data(data.players)
        .join("image")
        .attr('x', playerX)
        .attr('y', playerY)
        .attr('player-id', (d, i)=> i)
        .attr('width', teamLogo.size)
        .attr('height', teamLogo.size)
        .attr("xlink:href", (d, i)=>playersImageUrl + d.image)
        .on("mouseenter", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        .on("click", playerClick)

    var bar = svg.append("g")
        .attr("transform", `translate(${width / 2 - 75}, ${height / 2 + 150})`)
        .style("cursor", "pointer")
        .on("click", winnerPlayerClick)
    
    bar.append("rect")
        .attr("width", 150)
        .attr("height", 30)
        .attr('fill', 'none')
        .attr("stroke", "red")
    
    bar.append("text")
        .attr("x", 25)
        .attr("y", 15)
        .attr("dy", ".5em")
        .text("Winning teams' players");
    
    var path = d3.path();
        path.moveTo(0, 0)
        path.lineTo(teamLogo.size / 2, 0)
        path.lineTo(teamLogo.size / 2, teamLogo.size)
        path.lineTo(0, teamLogo.size)
        path.closePath();
    
    const defs = svg.append('defs')
        defs.append("clipPath")
            .attr("id", "leftHalf")
            .attr("clipPathUnits", "objectBoundingBox")
            .append("rect")
            .attr("x", "0")
            .attr("y", "0")
            .attr("width", ".5")
            .attr("height", "1")
        
        defs.append("clipPath")
            .attr("id", "rightHalf")
            .attr("clipPathUnits", "objectBoundingBox")
            .append("rect")
            .attr("x", "0.5")
            .attr("y", "0")
            .attr("width", ".5")
            .attr("height", "1")
})
.catch((error) => {
    console.error(error);
});
