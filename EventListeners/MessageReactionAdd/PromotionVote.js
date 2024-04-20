const { EmbedBuilder } = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const axios = require('axios');

module.exports.execute = async (reaction, user) => {
    if(reaction.message.channelId === config.channels.mtc){

        // Use this IF block to determine if it is a reaction on a map promotion nomination
        if (reaction.message.content.includes("New map promotion nomination")){

            const currentDate = new Date();
            const guild =  await reaction.client.guilds.fetch(config.guildId);
            const mtcRole = guild.roles.cache.get(config.roles.mtc);
            const mtcMajority = Math.floor(mtcRole.members.size/2)

            //Make sure we're counting all reactions even if the bot restarts
            reaction.message.fetch();

            if (
                (((currentDate - reaction.message.createdTimestamp)/3600000).toFixed(2) < config.mtcSettings.minimumVoteTime || config.mtcSettings.minimumVoteTime == 0) && 
                reaction._emoji.name !== '🔄' &&
                (reaction.count < mtcMajority || reaction.count == 1)
            ){
                // It is too early to worry about taking any action. 
                return;
            }
            if (reaction.partial){
                try{
                    await reaction.fetch();
                } catch (error){
                    console.error(error);
                    return;
                }
            }

            function getDecision(){
                if (reaction._emoji.name === '🔄'){
                    decision = "Refresh"
                    return;
                }
                let yVotes = reaction.message.reactions.cache.get('✅');
                let nVotes = reaction.message.reactions.cache.get('⏳');
                if ((reaction._emoji.name === '✅' || reaction._emoji.name === '⏳')){                
                    if (yVotes.count >= config.mtcSettings.approveDenyThreshold || nVotes.count >= config.mtcSettings.approveDenyThreshold){ 
                        if (yVotes.count > nVotes.count){
                            decision = "Added";
                        }
                        else if (nVotes.count > yVotes.count){
                            decision = "Delayed"
                        }
                        else {
                            // Tie
                            decision = "No Decision";
                        }
                    }
                    else {
                        // Not enough votes
                        decision = "No Decision";
                    }
                }
                else {
                    decision = "Stop Clicking Weird Shit"
                }
                
            }

            async function Respond(){                    
                const iconUrl = 'https://cdn.discordapp.com/icons/368194770553667584/9bbd5590bfdaebdeb34af78e9261f0fe.webp?size=96'
                const mapByAuthor = reaction.message.embeds[0].data.description.split("Current Score:")[0];
                const score = reaction.message.embeds[0].data.description.split(mapByAuthor)[1].split("Map ID:")[0];
                const mapId = reaction.message.embeds[0].data.description.split("Map ID: ")[1];
                const RaR = `Current Rating: ${score.split("Current Score:")[1]}`
                
                if (decision === "Refresh"){
                    await reaction.users.remove(user.id);
                    return;
                }
                if (decision === 'Added' || decision === 'Delayed'){
                    let header = "";
                    if (decision === 'Added'){
                        header = `MAP PROMOTED TO FULL ROTATION`
                    }
                    else if (decision === 'Delayed'){
                        header = `MAP VOTE TABLED`
                    }
                    else {
                        throw new Exception();
                    }
                    reaction.message.unpin();
                    
                    // if (config.mtcSettings.useDiscussionChannel){
                    //     const last = mapByAuthor.lastIndexOf(" by ");
                    //     const mapName = mapByAuthor.slice(2,last);
                    //     const channel = reaction.client.channels.cache.get(config.channels.mtcDiscussion);
                    //     const thread = channel.threads.cache.find(x=>x.name === `${mapName} Promotion Discussion`)  
                    //     await thread.setArchived(true);              
                    // }
                    
                    const last = mapByAuthor.lastIndexOf(" by ");
                    const mapName = mapByAuthor.slice(2,last);
                    const channel = reaction.client.channels.cache.get(config.channels.mtc)
                    const thread = channel.threads.cache.find(x=>x.name === `${mapName} Promotion Discussion`)
                    if (thread != null && thread != undefined){
                        await thread.setArchived(true);
                    }

                    var appr = reaction.message.reactions.cache.get('✅');
                    var delay = reaction.message.reactions.cache.get('⏳');
                    var approvalList = []; var delayList = [];
                    var approvalString = ""; var delayString = "";
                    await appr.users.fetch().then(function(users){
                        approvalList = Array.from(users.keys());
                        approvalString = "Yes votes: ";
                        approvalList.forEach(x=> {if (x != config.users.bot){approvalString += "<@" + x + "> "}});
                    })
                    await delay.users.fetch().then(function(users){
                        delayList = Array.from(users.keys());
                        delayString = "Delay votes: ";
                        delayList.forEach(x=> {if (x != config.users.bot){delayString += "<@" + x + "> "}});                
                    })
                    const imageUrl = `${reaction.message.embeds[0].data.image.url}`
                    const embed = new EmbedBuilder().setColor(decision === 'Added' ? '#7bcf5c' : '#ffca3a')
                        .setAuthor({name:header,iconURL:iconUrl})
                        .setDescription(`${mapByAuthor}${RaR}\n${approvalString}\n${delayString}`)
                        .setThumbnail(imageUrl).setTimestamp()

                    reaction.message.reactions.removeAll();
        
                    reaction.message.channel.send({embeds:[embed],content:`${header}\n${mapByAuthor}`,allowedMentions: {"users":[]}})
                        .then(sent=>{
                            if (decision == "Added"){
                                const headers = {
                                    'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY
                                }
                                const url = `${config.urls.api}/updatemap/${mapId}?category=rotation&weight=1`
                                // const url = `${config.urls.api}/updatemap/${mapId}?category=${playlist.toLowerCase()}&weight=${weight}`
                                axios({method:'post',url:url,headers:headers}).then(function(resp){
                                    var mtcAdminChannel = reaction.client.channels.cache.get(config.channels.mtcAdmin);
                                    var mtcAnnouncementChannel = reaction.client.channels.cache.get(config.channels.mtcAnnouncements);
                                    try {
                                        if (resp.data && (resp.data.includes("Updated map"))){
                                            console.info("Success!!!")
                                            mtcAdminChannel.send({embeds:[embed],content:`${mapByAuthor} has been promoted to full rotation`,allowedMentions: {"users":[]}})
                                            embed.setDescription(`${mapByAuthor}${RaR}`);
                                            embed.setThumbnail(null);
                                            embed.setImage(imageUrl)
                                            mtcAnnouncementChannel.send({embeds:[embed],content:`<@&${config.roles.mapUpdates}> ${header}\n${mapByAuthor}`})
                                        }
                                        else {
                                            console.error("FAILURE! ABORT!")
                                            mtcAdminChannel.send({content:`**Potential API error.** URL: ${url}\n Please investigate ${mapByAuthor}`})
                                        }
                                    }
                                    catch (err){
                                        mtcAdminChannel.send({content: "UpdateMap API Error. Check logs."})
                                        console.error(err);
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