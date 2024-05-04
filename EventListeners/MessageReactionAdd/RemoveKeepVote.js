const { EmbedBuilder } = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const axios = require('axios');

module.exports.execute = async (reaction, user) => {
    if(reaction.message.channelId === config.channels.mtc){
        // Use this IF block to determine if it is a reaction on a map removal nomination
        if (reaction.message.content.includes("map removal nomination")){
            
            const currentDate = new Date();
            const guild =  await reaction.client.guilds.fetch(config.guildId);
            const mtcRole = guild.roles.cache.get(config.roles.mtc);
            const mtcMajority = Math.ceil(mtcRole.members.size/2) + 1
            
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
                let nVotes = reaction.message.reactions.cache.get('❌');
                if ((reaction._emoji.name === '✅' || reaction._emoji.name === '❌')){                
                    if (yVotes.count >= config.mtcSettings.approveDenyThreshold || nVotes.count >= config.mtcSettings.approveDenyThreshold){ 
                        if (yVotes.count > nVotes.count){
                            decision = "Removed";
                        }
                        else if (nVotes.count > yVotes.count){
                            decision = "Kept"
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
                const mapByAuthor = reaction.message.embeds[0].data.description.split("\n")[0];
                const score = reaction.message.embeds[0].data.description.split("\n")[1].split(" (")[0];
                const votes = reaction.message.embeds[0].data.description.split("\n")[1].split(" (")[1]?.split(" votes")[0];
                const mapIdString = reaction.message.embeds[0].data.description.split("\n")[2];
                const mapId = mapIdString.split("Map ID: ")[1];
                const rawRatingwPercent = score.split("Current Score: ")[1]
                let RaR = decision === 'Removed' ? `Rating at removal: ${rawRatingwPercent}` : `Current Rating: ${rawRatingwPercent}`
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
                    
                    const last = mapByAuthor.lastIndexOf(" by ");
                    const mapName = mapByAuthor.slice(2,last);
                    const channel = reaction.client.channels.cache.get(config.channels.mtc)
                    const thread = channel.threads.cache.find(x=>x.name === `${mapName} Removal Discussion`)
                    if (thread != null && thread != undefined){
                        await thread.setArchived(true);
                    }

                    // if (config.mtcSettings.useDiscussionChannel){
                    //     const last = mapByAuthor.lastIndexOf(" by ");
                    //     const mapName = mapByAuthor.slice(2,last);
                    //     const channel = reaction.client.channels.cache.get(config.channels.mtcDiscussion);
                    //     const thread = channel.threads.cache.find(x=>x.name === `${mapName} Removal Discussion`)
                    //     if (thread != null && thread != undefined){
                    //         await thread.setArchived(true);
                    //     }
                    // }
                    
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
                    const imageUrl = `${reaction.message.embeds[0].data.image.url}`
                    const embed = new EmbedBuilder().setColor(decision === 'Kept' ? '#7bcf5c' : '#da3e52')
                        .setAuthor({name:header,iconURL:iconUrl})
                        .setDescription(`${mapByAuthor}\n${RaR} (${votes} votes)\n\n${approvalString}\n${denialString}`)
                        .setThumbnail(imageUrl).setTimestamp()

                    reaction.message.reactions.removeAll();
        
                    reaction.message.channel.send({embeds:[embed],content:`${header}\n${mapByAuthor}`,allowedMentions: {"users":[]}})
                        .then(sent=>{
                            if (decision === "Removed"){
                                const headers = {
                                    'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY
                                }
                                const url = `${config.urls.api}/removemap/${mapId}`
                                axios({method:'post',url:url,headers:headers}).then(function(resp){
                                    var mtcAdminChannel = reaction.client.channels.cache.get(config.channels.mtcAdmin);
                                    var mtcAnnouncementChannel = reaction.client.channels.cache.get(config.channels.mtcAnnouncements);
                                    try {
                                        if (resp.data && (resp.data.includes("Updated map") || resp.data.includes("Deleted map"))){
                                            console.info("Successful request. Response: ", resp.data)
                                            mtcAdminChannel.send({embeds:[embed],content:`${header}\n${mapByAuthor}`,allowedMentions: {"users":[]}})
                                            const rawRating = rawRatingwPercent.replaceAll("**","").replaceAll("%","");
                                            if (rawRating < 50) { RaR = "Rating at removal: < 50%"; }
                                            embed.setDescription(`${mapByAuthor}\n${RaR}`);
                                            embed.setThumbnail(null);
                                            embed.setImage(imageUrl)
                                            mtcAnnouncementChannel.send({embeds:[embed],content:`<@&${config.roles.mapUpdates}> ${header}\n${mapByAuthor}`})
                                        }
                                        else {
                                            console.error("Request failed.")
                                            mtcAdminChannel.send({content:`**Potential API error.** URL: ${url}\n Please investigate ${mapByAuthor}`})
                                        }
                                    }
                                    catch (err){
                                        mtcAdminChannel.send({content: "RemoveMap API Error. Check logs."})
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