const { ActionRowBuilder, SelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args)) 

module.exports = (client, pageNum) => {
    client.on('interactionCreate', interaction => {
        if (!interaction.isChatInputCommand()){
            return false;
        }
        if (interaction.commandName != "updatemap"){
            return false;
        }
        if (pageNum == 0) {
            console.log("yup, 0")
        }
        const fullMapList = [];
        const mapList = [];
        const fetchEm = new Promise((resolve,reject)=>{
            async function getMaps(){
                const maps = await nfetch('https://tagpro.koalabeast.com/maps.json')
                const body = await maps.json();
                body.rotation.forEach(x=>{
                    var tmp = {
                        name: x.name,
                        author: x.author,
                        score: x.averageRating,
                        key: x.key,
                        category: "Rotation"
                    }
                    fullMapList.push(tmp); 
                });
                body.retired.forEach(x=>{
                    var tmp = {
                        name: x.name,
                        author: x.author,
                        score: x.averageRating,
                        key: x.key,
                        category: "Retired"
                    }
                    fullMapList.push(tmp); 
                });
                body.classic.forEach(x=>{
                    var tmp = {
                        name: x.name,
                        author: x.author,
                        score: x.averageRating,
                        key: x.key,
                        category: "Classic"
                    }
                    fullMapList.push(tmp); 
                });
                fullMapList.sort((a,b)=>{
                    return a.name.localeCompare(b.name)
                })                                
                resolve();
            }
            getMaps();
        })
        fetchEm.then(()=>{
            console.log(fullMapList);
            const row = new ActionRowBuilder()
                .addComponents(
                    new SelectMenuBuilder()
                        .setCustomId('updateexistingmap')
                        .setPlaceholder('Select Map')
                        .addOptions([{
                            label:'Cancel',
                            description:'Nevermind!',
                            value:'Cancel'
                        }])                        
                )
            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('pageDown')
                        .setLabel('<')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(),
                    new ButtonBuilder()
                        .setCustomId('pageUp')
                        .setLabel('>')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                    .setCustomId('cancelUpdate')
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Danger)
                )                
            addMaps(row)

            async function addMaps(row){
                const startIndex = 0 + (24 * pageNum);
                const maxIndex = fullMapList.length;
                for (var i = startIndex; i < 24 + (24 * pageNum); i++){
                    row.components[0].addOptions([{
                        label: `${fullMapList[i].name} by ${fullMapList[i].author}`,
                        description: `${fullMapList[i].category} | Score: ${fullMapList[i].score}`,
                        value: `${fullMapList[i].key}`
                    }])
                }
            }
            console.log(fullMapList.length)
            if (fullMapList.length > 24){
                interaction.reply({content:"Select a map to update",ephemeral:true,components:[row,row2]})
            }
            else {
                interaction.reply({content:"Select a map to update",ephemeral:true,components:[row]})
            }
        });
    })
}