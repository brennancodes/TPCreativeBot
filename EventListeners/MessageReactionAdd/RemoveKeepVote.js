const { EmbedBuilder } = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const axios = require('axios');

module.exports.execute = async (reaction, user) => {
    if(reaction.message.channelId === config.channels.mtc){
        if (reaction.partial){
            try{
                await reaction.fetch();
            } catch (error){
                console.error(error);
                return;
            }
        }
        // Use this IF block to determine if it is a reaction on a map submission
        if (reaction.message.content.includes("map removal nomination")){
            function getDecision(){
                if (reaction._emoji.name === '🔄'){
                    decision = "Refresh"
                    return;
                }
                if (reaction.count >= config.mtcSettings.approveDenyThreshold){ 
                    if (reaction._emoji.name === '✅'){
                        decision = "Removed";
                    }
                    else if (reaction._emoji.name === '❌'){
                        decision = "Kept"
                    }                
                    else {
                        decision = "Stop Clicking Weird Shit"
                    }
                }
                else {
                    decision = "No Decision";
                }
            }

            async function Respond(){                    
                const iconUrl = 'https://cdn.discordapp.com/icons/368194770553667584/9bbd5590bfdaebdeb34af78e9261f0fe.webp?size=96'
                const mapByAuthor = reaction.message.embeds[0].data.description.split("Current Score:")[0];
                const mapId = reaction.message.embeds[0].data.description.split("Map ID: ")[1];
                
                if (decision === "Refresh"){
                    await reaction.users.remove(user.id);
                    return;
                }
                if (decision === 'Removed' || decision === 'Kept'){
                    let header = "";
                    if (decision === 'Removed'){
                        header = `MAP REMOVED`
                    }
                    else {
                        header = `MAP KEPT`
                    }
                    reaction.message.unpin();
                    
                    if (config.mtcSettings.useDiscussionChannel){
                        const last = mapByAuthor.lastIndexOf(" by ");
                        const mapName = mapByAuthor.slice(2,last);
                        const channel = reaction.client.channels.cache.get(config.channels.mtcDiscussion);
                        const thread = channel.threads.cache.find(x=>x.name === `${mapName} Removal Discussion`)  
                        await thread.setArchived(true);              
                    }
                    
                    var appr = reaction.message.reactions.cache.get('✅');
                    var deny = reaction.message.reactions.cache.get('❌');
                    var approvalList = []; var denialList = [];
                    var approvalString = ""; var denialString = "";
                    await appr.users.fetch().then(function(users){
                        approvalList = Array.from(users.keys());
                        approvalString = "Yes votes: ";
                        approvalList.forEach(x=> {if (x != config.users.bot){approvalString += "<@" + x + "> "}});
                    })
                    await deny.users.fetch().then(function(users){
                        denialList = Array.from(users.keys());
                        denialString = "No votes: ";
                        denialList.forEach(x=> {if (x != config.users.bot){denialString += "<@" + x + "> "}});                
                    })
                    const embed = new EmbedBuilder().setColor(decision === 'Kept' ? '#7bcf5c' : '#da3e52')
                        .setAuthor({name:header,iconURL:iconUrl})
                        .setDescription(`${mapByAuthor}\n${approvalString}\n${denialString}`)
                        .setThumbnail(`${reaction.message.embeds[0].data.image.url}`).setTimestamp()
                    // const row = new ActionRowBuilder();
                    // if (decision === "Removed"){
                    //     row.addComponents(
                    //         new ButtonBuilder().setCustomId('MarkAsRemoved').setStyle(ButtonStyle.Primary).setLabel('Mark as Removed'),
                    //     )
                    // }
                    reaction.message.reactions.removeAll();
        
                    reaction.message.channel.send({embeds:[embed],content:`${header}\n${mapByAuthor}`,allowedMentions: {"users":[]}})
                        .then(sent=>{
                            if (decision === "Removed"){
                                const headers = {
                                    'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY
                                }
                                const url = `${config.urls.api}/removemap/${mapId}`
                                axios({method:'post',url:url,headers:headers}).then(function(resp){
                                    if (resp.data && (resp.data.includes("Updated map") || resp.data.includes("Deleted map"))){
                                        console.log("Success!!!")
                                        var mtcAdminChannel = reaction.client.channels.cache.get(config.channels.mtcAdmin);
                                        mtcAdminChannel.send({embeds:[embed],content:`${header}\n${mapByAuthor}`,allowedMentions: {"users":[]}})
                                    }
                                    else {
                                        console.log("FAILURE! ABORT!")
                                        var mtcAdminChannel = reaction.client.channels.cache.get(config.channels.mtcAdmin);
                                        mtcAdminChannel.send({content:`**Potential API error.** URL: ${url}\n Please investigate ${mapByAuthor}`})
                                    }
                                });
                            }
                        }).then(()=>{
                            reaction.message.suppressEmbeds(true);
                        })
                    
                }
            }

            getDecision();
            Respond();
        }
    }
}