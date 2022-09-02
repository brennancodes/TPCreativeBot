const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")
const config = require("../../config.json")

module.exports = (client) => {
    client.on('messageReactionAdd', async(reaction, user)=>{
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
            if (reaction.message.content.includes("map submission received")){
                const description = reaction.message.embeds[0].data.description;
                const descSplit = description.split('**');                
                const channel = client.channels.cache.get(config.channels.mtc);
                const active = await channel.threads.fetchActive(true)
                let feedbackThreads = active.threads.filter(x=>x.name === `${descSplit[3]} Feedback`);
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
                const tmp = reaction.message.content.split("from ")[1];
                const submitterTag = tmp.substring(0,tmp.length-1);
                // parse out the ID from the userTag
                const submitterId = submitterTag.slice(2,submitterTag.length-1)
                if (config.mtcSettings.blockSelfVoting){
                    if (reaction.message.content.includes(user.id)){
                        await reaction.users.remove(user.id)
                        reaction.message.channel.send({content:`You know better than to vote on your own map, <@${user.id}>.`,allowedMentions:{"users":[]}})
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
                    if (reaction.count >= config.mtcSettings.approveDenyThreshold){                        
                        if (feedbackArray.length < config.mtcSettings.feedbackThreshold && (reaction._emoji.name === '✅' || reaction._emoji.name === '❌')){
                            decision = "Pending Feedback";
                        } 
                        else if (reaction._emoji.name === '✅'){
                            if (!wired){
                                decision = "Pending Manual Test"
                            }
                            else {
                                decision = "Approved";
                            }
                        }
                        else if (reaction._emoji.name === '❌'){
                            decision = "Denied"
                        }                
                        else {
                            decision = "Stop Clicking Weird Shit"
                        }
                    }
                    else {
                        decision = "No Decision";
                    }
                }
        
                isWired.then(async ()=>{
                    await getDecision();
                    Respond();
                })
        
                async function Respond(){
                    // const description = reaction.message.embeds[0].data.description;
                    // const descSplit = description.split('**');
                    const rootUrl = 'https://fortunatemaps.herokuapp.com/'
                    const mapByAuthorLinks = `[**${descSplit[1]}**](${rootUrl}map/${descSplit[3]}) by [**${descSplit[5]}**](${rootUrl}profile/${descSplit[5].replaceAll(" ","_")})`
                    const mapByAuthor = `${descSplit[3]}: *${descSplit[1]}* by ${descSplit[5]}`
                    const iconUrl = 'https://cdn.discordapp.com/icons/368194770553667584/9bbd5590bfdaebdeb34af78e9261f0fe.webp?size=96'
                    if (decision === "Refresh"){
                        await reaction.users.remove(user.id);
                        return;
                    }
                    if (decision === "Pending Feedback"){
                        await reaction.users.remove(user.id)
                        const embed = new EmbedBuilder().setColor('#FFB800').setAuthor({name:"Pending verbal feedback from MTC",iconURL:iconUrl})
                        .setDescription(`${mapByAuthorLinks}\n\nThe feedback thread has not met the required minimum of ${config.mtcSettings.feedbackThreshold} comment${config.mtcSettings.feedbackThreshold>1?"s.":"."}\nPlease ensure that enough feedback is given to continue.`)
                        .setThumbnail(`${rootUrl}preview/${descSplit[3]}.jpeg`)
                        reaction.message.reply({content:`**PENDING FEEDBACK** \n${mapByAuthor}`,embeds:[embed]})
                        return;
                    }
                    if (decision === 'Pending Manual Test'){
                        await reaction.users.remove(user.id)
                        const embed = new EmbedBuilder().setColor('#FFB800').setAuthor({name:"Pending manual test confirmation",iconURL:iconUrl})
                        .setDescription(`${mapByAuthorLinks}\n\nPlease click the message this is replying to and perform a manual test of the map to ensure everything is wired properly 
                            and nothing is broken.\n\nIf everything looks good, click the 🔬 reaction then re-cast your ✅ reaction so this map may advance.`)
                        .setThumbnail(`${rootUrl}preview/${descSplit[3]}.jpeg`)
                        reaction.message.reply({content:`**NO QUALITY CONTROL INDICATED** \n${mapByAuthor}`,embeds:[embed]})
                        return;
                    }
                    if (decision === 'Approved' || decision === 'Denied'){
                        const header = `${decision} for trial rotation`
                        reaction.message.unpin();
                        
                        await feedbackThreads.find(x=>x.id == threads[0]).setArchived(true);

                        if (config.mtcSettings.useDiscussionChannel){
                            const discChannel = client.channels.cache.get(config.channels.mtcDiscussion);
                            const discussionThread = discChannel.threads.cache.find(x=>x.name === `${descSplit[3]} Discussion`)  
                            await discussionThread.setArchived(true);
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
                        const embed = new EmbedBuilder().setColor(decision === 'Approved' ? '#7bcf5c' : '#da3e52')
                            .setAuthor({name:header,iconURL:iconUrl})
                            .setDescription(`${mapByAuthorLinks}\n\nID: **${descSplit[3]}**\n\n${approvalString}\n${denialString}${decision == "Denied" ? '' : '\n' + wireString}`)
                            .setThumbnail(`${rootUrl}preview/${descSplit[3]}.jpeg`)
                        const row = new ActionRowBuilder();
                        if (decision === "Approved"){
                            row.addComponents(
                                new ButtonBuilder().setCustomId('MarkAsAdded').setStyle(ButtonStyle.Primary).setLabel('Mark as Added'),
                            )
                        }
                        reaction.message.reactions.removeAll();
            
                        reaction.message.channel.send({embeds:[embed],content:`**${decision.toLocaleUpperCase()} FOR ROTATION** \n${mapByAuthor}`,allowedMentions: {"users":[]},components:decision==="Approved"?[row]:[]})
                            .then(sent=>{
                                if (decision === "Approved"){
                                    sent.pin();
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
                                    feedbackString += feedbackArray[i] + "\n"
                                }
                                feedbackString += `\nUse command **/getfeedback ${descSplit[3]}** any time to review this.`
                                embed.data.description = `${embed.data.description.split("Yes votes:")[0]} ${feedbackString}`;
                                client.users.cache.get(`${submitterId}`).send({
                                    content: contentString,
                                    embeds:[embed]
                                })
                            })
                        
                    }
                }
            }
        }
    })
}