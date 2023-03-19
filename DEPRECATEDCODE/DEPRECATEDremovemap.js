const { ActionRowBuilder, SelectMenuBuilder } = require("discord.js")
const nfetch = (...args) => import('node-fetch').then(({default:fetch}) => fetch(...args)) 

module.exports = (client) => {
    client.on('interactionCreate', interaction => {
        if (!interaction.isChatInputCommand()){
            return false;
        }
        if (interaction.commandName != "removemap"){
            return false;
        }
        const mapList = [];
        const fetchEm = new Promise((resolve,reject)=>{
            async function getMaps(){
                const maps = await nfetch('https://tagpro.koalabeast.com/maps.json')
                const body = await maps.json();
                body.rotation.sort(function(a,b){
                    return a.averageRating - b.averageRating;
                })
                body.rotation.forEach(x=>{
                    var tmp = {
                        name: x.name,
                        author: x.author,
                        score: x.averageRating,
                        key: x.key
                    }
                    mapList.push(tmp);
                })
                resolve();
            }
            getMaps();
        })
        fetchEm.then(()=>{
            const row = new ActionRowBuilder()
                .addComponents(
                    new SelectMenuBuilder()
                        .setCustomId('removerotationmap')
                        .setPlaceholder('Select Map')
                        .addOptions([{
                            label:'Cancel',
                            description:'Nevermind!',
                            value:'Cancel'
                        }])                        
                )
            addMaps(row)

            async function addMaps(row){
                mapList.forEach(x=>{
                    row.components[0].addOptions([{
                        label: `${x.name} by ${x.author}`,
                        description: `Current Score: ${x.score}`,
                        value: `${x.key}`
                    }])
                })
            }

            interaction.reply({content:"Nominate a map for removal",ephemeral:true,components:[row]})
        });
    })
}