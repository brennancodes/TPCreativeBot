const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args));
const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json")
const Canvas = require('canvas');
const { EmbedBuilder } = require('discord.js');
const Image = Canvas.Image;

module.exports = (client, interaction) => {
    const fetchEm = new Promise((resolve,reject)=>{
        async function getMaps(){
            const maps = await nfetch('https://tagpro.koalabeast.com/allmaps.json')
            const body = await maps.json();            
            resolve(body);
        }
        getMaps();
    })

    fetchEm.then((body)=>{
        function createCategoryArray(bodyKey){
            let arr = [];
            for (const key in bodyKey){
                arr.push(bodyKey[key])
            }
            return arr;
        }

        function createPlaceholder(){
            var str = [{category:"trial",name: 'Placeholder',weight: 0,averageRating: 100,png:null}]
            return str;
        }

        const mapData = [];
        for (const key in body){
            if (body[key]){
                if (key == "group"){
                    continue;
                }
                const array = createCategoryArray(body[key]);
                getDataByCategory(sorted(array), key)
            }
            else {
                getDataByCategory(createPlaceholder(), key)
            }
        }

        function sorted(obj){
            obj.sort(function(a,b){
                return b.averageRating - a.averageRating;
            })
            return obj;
        }

        function getDataByCategory(category, catName){
            var weight = 0;
            var CTFWt = 0;
            var NFWt = 0;
            var EXWt = 0;
            var cumulativeScore = 0;
            var bestMap = "";
            var worstMap = "";
            var averageCounter = 0;
            for (var i = 0; i < category.length; i++){
                var thisWeight = category[i].weight;
                // MAY NEED TO ADD IF BLOCK TO CHECK IF AVERAGERATING EXISTS
                // Above note is relevant if Devs decide to add every map with weight > 0 to the /maps page (maps json) without necessarily attaching a score
                if (thisWeight > 0) {
                    averageCounter++
                    cumulativeScore += category[i].averageRating
                }
                var type = getType(category[i].png)
                if (type==="CTF"){CTFWt+=thisWeight}else if(type==="NF"){NFWt+=thisWeight}else if(type==="Placeholder"){CTFWt=0;NFWt=0}else{EXWt+=thisWeight};
                weight += thisWeight;
                if (i == 0) {bestMap = `${category[i].name} (${category[i].averageRating})`}
                if (i == category.length - 1) {worstMap = `${category[i].name} (${category[i].averageRating})`}
            }
            var data = {
                category: catName,
                totalWeight: weight,
                CTFWeight: CTFWt,
                NFWeight: NFWt,
                EXWeight: EXWt,
                avgScore: averageCounter > 0 ? (cumulativeScore/averageCounter) : (cumulativeScore),
                bestMap: bestMap,
                worstMap: worstMap
            }
            mapData.push(data);
        }

        var totalCTFWt = 0;
        var totalNFWt = 0;
        var totalEXWt = 0;
        var totalWt = 0;
        var totalSum = 0;
        var bestPlaylist = "";
        var bestMap = "";
        var worstMap = "";
        for(var i = 0; i < mapData.length; i++){
            wL = mapData[i].worstMap.length;
            bL = mapData[i].bestMap.length;
            totalWt += mapData[i].totalWeight;
            totalCTFWt += mapData[i].CTFWeight;
            totalNFWt += mapData[i].NFWeight;
            totalEXWt += mapData[i].EXWeight;
            totalSum += (mapData[i].avgScore*mapData[i].totalWeight);
            if (i == 0 || (i > 0 && mapData[i].avgScore > mapData[i-1].avgScore)){
                bestPlaylist = `${mapData[i].category} (${mapData[i].avgScore})`;
            }
            if (i == 0 || (i > 0 && parseInt(mapData[i].bestMap.substring(bL-3,bL-1))) > parseInt(mapData[i-1].bestMap.substring(mapData[i-1].bestMap.length-3,mapData[i-1].bestMap.length-1))){
                bestMap = mapData[i].bestMap;
            }
            if (i == 0 || (i > 0 && parseInt(mapData[i].worstMap.substring(wL-3,wL-1)) < parseInt(mapData[i-1].worstMap.substring(mapData[i-1].worstMap.length-3,mapData[i-1].worstMap.length-1)))){
                worstMap = mapData[i].worstMap;
            }
        }
        mapData.push({category:"all",
                    totalWeight:totalWt,
                    CTFWeight:totalCTFWt,
                    NFWeight:totalNFWt,
                    EXWeight:totalEXWt,
                    avgScore:parseFloat(parseFloat(totalSum/totalWt).toFixed(2)),
                    CTFNFBalance: `🔴🔵 ${(totalCTFWt/totalWt*100).toFixed(2)}%\n⚫🟡 ${(totalNFWt/totalWt*100).toFixed(2)}%`,
                    bestPlaylist: bestPlaylist,
                    bestMap: bestMap,
                    worstMap: worstMap
                })
        const channel = client.channels.cache.get(config.channels.mtc);
        //channel.send({content:JSON.stringify(mapData)})
        mapData.sort(function(a,b){
            return b.totalWeight - a.totalWeight
        })
        const embed = new EmbedBuilder()
            .setColor("#186360")
            .setAuthor({name:"State of Rotation",iconURL:"https://imgur.com/QWrriCS.png"})
            .setTimestamp()
        
        const rotSize = mapData[0].totalWeight;
        for (var i = 0; i < mapData.length; i++){
            var formattedCategory = mapData[i].category.charAt(0).toUpperCase() + mapData[i].category.slice(1)
            styleMachine(mapData[i], rotSize);
            if (mapData[i].category == "all"){
                embed.addFields(
                    {
                        name: "Size",
                        value: mapData[i].totalWeight,
                        inline: true
                    },
                    {
                        name: "Balance",
                        value: mapData[i].CTFNFBalance,
                        inline: true
                    },
                    {
                        name: "Score",
                        value: mapData[i].avgScore,
                        inline: true
                    }
                )
            }
            else {
                if (mapData[i].category != "rotation"){
                    embed.addFields(
                        {
                            name: formattedCategory,
                            value: mapData[i].totalWeight + mapData[i].avgScore,
                            inline: true
                        }
                    )
                }
                if (mapData[i].category == "rotation"){
                    embed.addFields(                        
                        {
                            name: "\n\u200b",
                            value: "\u200b",
                            inline: true
                        },
                        {
                            name: "\n"+formattedCategory,
                            value: mapData[i].totalWeight + mapData[i].avgScore,
                            inline: true
                        },
                        {
                            name: "\n\u200b",
                            value: "\u200b",
                            inline: true
                        }
                    )
                }
            }
        }
        if (interaction){
            interaction.reply({content:"Overview",embeds:[embed]})
        }
        else {
            channel.send({content:"Overview",embeds:[embed]})
        }
    })

    function styleMachine(item, rotSize){
        const ideal = {
            ctfBal: [55,60,65,70], // below[0]/above[3] red, between [1,2] green, else yellow
            nfBal: [30,35,40,45], // below[0]/above[3] red, between [1,2] green, else yellow
            size: [20,22,28,30], // below[0]/above[3] red, between [1,2] green, else yellow
            score: [72.5,75], // below [0] red, above [1] green, else yellow
            rotBal: [80,85], // below [0] red, above [1] green, else yellow
            claBal: [10,12], // above [1] red, below [0] green, else yellow
            triBal: [10,12], // above [1] red, below [0] green, else yellow
            tbkBal: [2.5,3.5] // above [1] red, below [0] green, else yellow
        }
        if (item.category === "all"){
            if (item.totalWeight < ideal.size[0] || item.totalWeight > ideal.size[3]){
                item.totalWeight = "\`\`\`\n🔴 "+item.totalWeight.toFixed(2)+"\n🔴 Expect " + ideal.size[1] + "-" + ideal.size[2] + "\`\`\`"
            }
            else if (item.totalWeight > ideal.size[1] && item.totalWeight < ideal.size[2]){
                item.totalWeight = "\`\`\`\n🟢 "+item.totalWeight.toFixed(2)+"\n🟢 Expect " + ideal.size[1] + "-" + ideal.size[2] + "\`\`\`"
            }
            else {
                item.totalWeight = "\`\`\`\n🟡 "+item.totalWeight.toFixed(2)+ "\n🟡 Expect " + ideal.size[1] + "-" + ideal.size[2] + "\`\`\`"
            }
            
            if (item.CTFWeight/rotSize*100 < ideal.ctfBal[0] || item.CTFWeight/rotSize*100 > ideal.ctfBal[3]){
                item.CTFNFBalance = "\`\`\`\n🔴 CTF: " + (item.CTFWeight/rotSize*100).toFixed(2) + "%\n🔴 NF : " + (item.NFWeight/rotSize*100).toFixed(2) + "%\`\`\`"
            }
            else if (item.CTFWeight/rotSize*100 < ideal.ctfBal[1] || item.CTFWeight/rotSize*100 > ideal.ctfBal[2]){
                item.CTFNFBalance = "\`\`\`\n🟡 CTF: " + (item.CTFWeight/rotSize*100).toFixed(2) + "%\n🟡 NF : " + (item.NFWeight/rotSize*100).toFixed(2) + "%\`\`\`"
            }
            else {
                item.CTFNFBalance = "\`\`\`\n🟢 CTF: " + (item.CTFWeight/rotSize*100).toFixed(2) + "%\n🟢 NF : " + (item.NFWeight/rotSize*100).toFixed(2) + "%\`\`\`"
            }
        }
        if (item.category === "rotation"){
            if (item.totalWeight/rotSize*100 < ideal.rotBal[0]){
                item.totalWeight = "\`\`\`\n🔴 Wgt: "+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            }
            else if (item.totalWeight/rotSize*100 < ideal.rotBal[1]){
                item.totalWeight = "\`\`\`\n🟡 Wgt: "+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            }
            else {
                item.totalWeight = "\`\`\`\n🟢 Weight："+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            }                
        }
        if (item.category === "classic"){
            if (item.totalWeight/rotSize*100 > ideal.claBal[1]){
                item.totalWeight = "\`\`\`\n🔴 Weight: "+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            }
            else if (item.totalWeight/rotSize*100 > ideal.claBal[0]){
                item.totalWeight = "\`\`\`\n🟡 Wgt: "+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            }
            else {
                item.totalWeight = "\`\`\`\n🟢 Weight："+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            } 
        }
        if (item.category === "retired"){
            if (item.totalWeight/rotSize*100 > ideal.tbkBal[1]){
                item.totalWeight = "\`\`\`\n🔴 Weight: "+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            }
            else if (item.totalWeight/rotSize*100 > ideal.tbkBal[0]){
                item.totalWeight = "\`\`\`\n🟡 Wgt: "+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            }
            else {
                item.totalWeight = "\`\`\`\n🟢 Weight："+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            } 
        }
        if (item.category === "trial"){
            if (item.totalWeight/rotSize*100 > ideal.triBal[1]){
                item.totalWeight/rotSize*100 < 10 ? itemTotalWeight = "\`\`\`\n🔴 Wgt: "+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`" :
                item.totalWeight = "\`\`\`\n🔴 Weight: "+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            }
            else if (item.totalWeight/rotSize*100 > ideal.triBal[0]){
                item.totalWeight = "\`\`\`\n🟡 Wgt: "+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            }
            else {
                item.totalWeight = "\`\`\`\n🟢 Weight："+(item.totalWeight/rotSize*100).toFixed(2)+"%\`\`\`"
            } 
        }
        if (item.category === "all"){
            if (item.avgScore > ideal.score[1]){
                item.avgScore = "\`\`\`\n🟢 "+item.avgScore.toFixed(2)+"\n🟢 Expect > " + ideal.score[1] + "\`\`\`"
            }
            else if (item.avgScore > ideal.score[0]){
                item.avgScore = "\`\`\`\n🟡 "+item.avgScore.toFixed(2)+"\nExpect > " + ideal.score[1] + "\`\`\`"
            }
            else {
                item.avgScore = "\`\`\`\n🔴 "+item.avgScore.toFixed(2)+"\n🔴 Expect > " + ideal.score[1] + "\`\`\`"
            }
        }
        else {
            if (item.avgScore > ideal.score[1]){
                item.avgScore = "\`\`\`\n🟢 Score："+item.avgScore.toFixed(2)+"\`\`\`"
            }
            else if (item.avgScore > ideal.score[0]){
                item.avgScore = "\`\`\`\n🟡 Score: "+item.avgScore.toFixed(2)+"\`\`\`"
            }
            else {
                item.avgScore = "\`\`\`\n🔴 Score: "+item.avgScore.toFixed(2)+"\`\`\`"
            }
        }
    }
    
    function getType(png){
        if (png == null){
            return "Placeholder"
        }
        else{
            var image = new Image();
            var mapType = "Other"
            image.onload = function(){
                var canvas = Canvas.createCanvas();
                canvas.width = image.width;
                canvas.height = image.height;
    
                var context = canvas.getContext('2d');
                context.drawImage(image,0,0);
                var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                var yellow = 0;
                var red = 0;
                var blue = 0;
                for (var i = 0; i < imageData.data.length; i+=4){
                    var rgbString = `r${imageData.data[i]}g${imageData.data[i+1]}b${imageData.data[i+2]}`
                    switch(rgbString){
                        case "r255g0b0": red++
                            break;
                        case "r0g0b255": blue++;
                            break;
                        case "r128g128b0": yellow++;
                            break;
                    }
                }
                switch(true){
                    case (blue==1 && red ==1 && yellow == 0): mapType = "CTF";
                        break;
                    case (blue==0 && red ==0 && yellow == 1): mapType = "NF"; 
                        break;
                }
            }
            image.src = `data:image/png;base64,${png}`
            return mapType;
        }
    }

}