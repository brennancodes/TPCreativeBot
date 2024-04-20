const { EmbedBuilder } = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const axios = require('axios');
const { GetFMRoot } = require("../../Functions");
//const fetch = require('node-fetch')

module.exports.execute = async (reaction, user) => {
    if(reaction.message.channelId === config.channels.mtc){
        // Use this IF block to determine if it is a reaction on a map submission
        if (reaction.message.content.includes("New map submission [")){
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
            
            const description = reaction.message.embeds[0].data.description;
            const descSplit = description.split('**');                
            const channel = reaction.client.channels.cache.get(config.channels.mtc);
            const active = await channel.threads.fetchActive(true)
            let feedbackThreads = active.threads.filter(x=>x.name.includes(`${descSplit[3]} Feedback`));
            // need all this nonsense so it grabs the latest thread rather than finding first match
            // with potentially old feedback.
            feedbackThreads.sort(function(a,b){
                return b.archiveTimestamp - a.archiveTimestamp;
            })
            const feedbackArray = [];
            const threads = Array.from(feedbackThreads.keys());
            if (feedbackThreads.find(x=>x.id == threads[0]) != null){
                const msgs = await feedbackThreads.find(x=>x.id == threads[0]).messages.fetch();
                msgs.map(z=>{
                    if (z.content.length > 1){
                        feedbackArray.push(z.content)
                    }
                })
            }
            // extract userTag from message content
            let msgCont = reaction.message.content;
            const submitterTag = msgCont.substring(msgCont.lastIndexOf('<'), msgCont.lastIndexOf('>')+1);
            // parse out the ID from the userTag
            const submitterId = submitterTag.slice(2,submitterTag.length-1)
            if (config.mtcSettings.blockSelfVoting){
                if (reaction.message.content.includes(user.id) && reaction._emoji.name !== '❌'){
                    await reaction.users.remove(user.id)
                    reaction.message.channel.send({content:`You know better than to vote on your own submission, <@${user.id}>.`,allowedMentions:{"users":[]}})
                }
            }
            
            let decision;
            let wired;
            const isWired = new Promise((resolve,reject)=>{
                async function wireFunc(){
                    var wire = reaction.message.reactions.cache.get('🔬');
                    if (wire != null){
                        var u = await wire.users.fetch()
                        wired = u.size >= config.mtcSettings.qualityControlThreshold;
                        resolve();
                    }
                    else {
                        wired = false;
                        resolve();
                    }
                }
                wireFunc();
            })
            
            async function getDecision(){
                if (reaction._emoji.name === '🔄'){
                    decision = "Refresh"
                    return;
                }
                let yVotes = reaction.message.reactions.cache.get('✅');
                let nVotes = reaction.message.reactions.cache.get('❌');
                if ((reaction._emoji.name === '✅' || reaction._emoji.name === '❌')){
                    if (yVotes.count >= config.mtcSettings.approveDenyThreshold || nVotes.count >= config.mtcSettings.approveDenyThreshold){     
                        if (feedbackArray.length < config.mtcSettings.feedbackThreshold){
                            decision = "Pending Feedback";
                        } 
                        else if (yVotes.count > nVotes.count){
                            if (!wired){
                                decision = "Pending Manual Test"
                            }
                            else {
                                decision = "Approved";
                            }
                        }
                        else if (nVotes.count > yVotes.count){
                            decision = "Denied"
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
    
            isWired.then(async ()=>{
                await reaction.message.fetch();

                await getDecision();
                Respond();
            })
    
            async function Respond(){
                const rootUrl = GetFMRoot();
                const mapByAuthorLinks = `[**${descSplit[1]}**](${rootUrl}map/${descSplit[3]}) by [**${descSplit[5]}**](${rootUrl}profile/${descSplit[5].replaceAll(" ","_")})`
                const mapByAuthor = `${descSplit[3]}: *${descSplit[1]}* by ${descSplit[5]}`
                const iconUrl = 'https://cdn.discordapp.com/icons/368194770553667584/9bbd5590bfdaebdeb34af78e9261f0fe.webp?size=96'
                if (decision === "Refresh"){
                    await reaction.users.remove(user.id);
                    return;
                }
                if (decision === "Pending Feedback"){
                    if (!user.bot){
                        await reaction.users.remove(user.id)
                    }
                    const embed = new EmbedBuilder().setColor('#ffca3a').setAuthor({name:"Pending verbal feedback from MTC",iconURL:iconUrl})
                    .setDescription(`${mapByAuthorLinks}\n\nThe feedback thread has not met the required minimum of ${config.mtcSettings.feedbackThreshold} comment${config.mtcSettings.feedbackThreshold>1?"s.":"."}\nPlease ensure that enough feedback is given to continue.`)
                    .setThumbnail(`${rootUrl}preview/${descSplit[3]}.jpeg`)
                    reaction.message.reply({content:`**PENDING FEEDBACK** \n${mapByAuthor}`,embeds:[embed]})
                    return;
                }
                if (decision === 'Pending Manual Test'){
                    if (!user.bot){
                        await reaction.users.remove(user.id)
                    }
                    const embed = new EmbedBuilder().setColor('#ffca3a').setAuthor({name:"Pending manual test confirmation",iconURL:iconUrl})
                    .setDescription(`${mapByAuthorLinks}\n\nPlease click the message this is replying to and perform a manual test of the map to ensure everything is wired properly 
                        and nothing is broken.\n\nIf everything looks good, click the 🔬 reaction then re-cast your ✅ reaction so this map may advance.`)
                    .setThumbnail(`${rootUrl}preview/${descSplit[3]}.jpeg`)
                    reaction.message.reply({content:`**NO QUALITY CONTROL INDICATED** \n${mapByAuthor}`,embeds:[embed]})
                    return;
                }
                if (decision === 'Approved' || decision === 'Denied'){
                    const header = `${decision} for trial rotation`
                    reaction.message.unpin();
                    await feedbackThreads.find(x=>x.id == threads[0])?.setArchived(true);

                    if (config.mtcSettings.useDiscussionChannel){
                        const discChannel = reaction.client.channels.cache.get(config.channels.mtcDiscussion);
                        const discussionThread = discChannel.threads.cache.find(x=>x.name.includes(`${descSplit[3]} Discussion`))  
                        await discussionThread?.setArchived(true);
                    }
                    
                    var appr = reaction.message.reactions.cache.get('✅');
                    var deny = reaction.message.reactions.cache.get('❌');
                    var wire = reaction.message.reactions.cache.get('🔬');
                    var approvalList = []; var denialList = []; var wireList = [];
                    var approvalString = ""; var denialString = ""; var wireString = "";
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
                    await wire.users.fetch().then(function(users){
                        wireList = Array.from(users.keys());
                        wireString = "Quality control by: ";
                        wireList.forEach(x=> {if (x != config.users.bot){wireString += "<@" + x + "> "}});
                    })
                    const imageUrl = `${reaction.message.embeds[0].data.image.url}`
                    const embed = new EmbedBuilder().setColor(decision === 'Approved' ? '#7bcf5c' : '#da3e52')
                        .setAuthor({name:header,iconURL:iconUrl})
                        .setDescription(`${mapByAuthorLinks}\n\nID: **${descSplit[3]}**\n\n${approvalString}\n${denialString}${decision == "Denied" ? '' : '\n' + wireString}`)
                        .setThumbnail(`${rootUrl}preview/${descSplit[3]}.jpeg`).setTimestamp()
                    reaction.message.reactions.removeAll();
        
                    reaction.message.channel.send({embeds:[embed],content:`**${decision.toLocaleUpperCase()} FOR ROTATION** \n${mapByAuthor}`,allowedMentions: {"users":[]}})
                        .then(async (sent)=>{
                            if (decision === "Approved"){
                                var mtcAdminChannel = reaction.client.channels.cache.get(config.channels.mtcAdmin);
                                var mtcAnnouncementChannel = reaction.client.channels.cache.get(config.channels.mtcAnnouncements);
                                
                                const headers = {
                                    'x-mtc-api-key': process.env.ENVIRONMENT == "Production" ? process.env.PROD_API_KEY : process.env.STAGING_API_KEY
                                }
                                const url = `${config.urls.api}/addmap/${descSplit[3]}`
                                await axios({method:'post',url:url,headers:headers}).then(function(resp){
                                    try {
                                        if (resp.data && resp.data.includes("Inserted")){
                                            console.info("Success!!!")
                                            mtcAdminChannel.send({embeds:[embed],content:`**${decision.toLocaleUpperCase()} FOR ROTATION** \n${mapByAuthor}`,allowedMentions: {"users":[]}});
                                            embed.setDescription(`${mapByAuthorLinks}\nID: **${descSplit[3]}**`);
                                            embed.setThumbnail(null);
                                            embed.setImage(imageUrl)
                                            mtcAnnouncementChannel.send({embeds:[embed],content:`<@&${config.roles.mapUpdates}> ${header}\n${mapByAuthor}`})
                                        }
                                        else {
                                            console.error("FAILURE! ABORT!")
                                            mtcAdminChannel.send({content:`**Potential API error.** URL:${url}\n Please investigate ${mapByAuthor}`})
                                            mtcAdminChannel.send({embeds:[embed],content:`**${decision.toLocaleUpperCase()} FOR ROTATION** \n${mapByAuthor}`,allowedMentions: {"users":[]}});
                                            embed.setDescription(`${mapByAuthorLinks}\nID: **${descSplit[3]}**`);
                                            embed.setThumbnail(null);
                                            embed.setImage(imageUrl)
                                        }
                                    }
                                    catch (err) {
                                        mtcAdminChannel.send({content: "RemoveMap API Error. Check logs."})
                                        console.error(err);
                                    }
                                })
                            }                                
                        }).then(()=>{
                            reaction.message.suppressEmbeds(true);
                        }).then(()=>{
                            let feedbackString = "**Feedback:**\n";
                            let contentString = "";
                            if (decision == "Approved"){
                                contentString = "Congratulations!! Your map has been selected to enter the map rotation on a trial basis."
                            }
                            else {
                                contentString = "Sorry, your map was not selected this time."
                            }
                            for (var i = 0; i < feedbackArray.length; i++){
                                feedbackString += feedbackArray[i] + "\n\n"
                            }
                            feedbackString += `\nUse command **/getfeedback ${descSplit[3]}** any time in the official TagPro discord to review this.`
                            embed.data.description = `${embed.data.description.split("Yes votes:")[0]} ${feedbackString}`;
                            reaction.client.users.cache.get(`${submitterId}`).send({
                                content: contentString,
                                embeds:[embed]
                            })
                        })
                    
                }
            }
        }
    }
}