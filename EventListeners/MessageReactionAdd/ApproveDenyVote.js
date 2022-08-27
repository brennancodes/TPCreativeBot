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
            
            function getDecision(){
                if (reaction._emoji.name === '🔄'){
                    decision = "Refresh"
                    return;
                }
                if (reaction.count >= config.mtcSettings.approveDenyThreshold){ 
                    if (reaction._emoji.name === '✅'){
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
    
            isWired.then(()=>{
                getDecision();
                Respond();
            })
    
            async function Respond(){
                const description = reaction.message.embeds[0].data.description;
                const descSplit = description.split('**');
                const rootUrl = 'https://fortunatemaps.herokuapp.com/'
                const mapByAuthorLinks = `[**${descSplit[1]}**](${rootUrl}map/${descSplit[3]}) by [**${descSplit[5]}**](${rootUrl}profile/${descSplit[5].replaceAll(" ","_")})`
                const mapByAuthor = `${descSplit[3]}: *${descSplit[1]}* by ${descSplit[5]}`
                const iconUrl = 'https://cdn.discordapp.com/icons/368194770553667584/9bbd5590bfdaebdeb34af78e9261f0fe.webp?size=96'
                //console.log(getDecision(), reaction.count);
                if (decision === "Refresh"){
                    await reaction.users.remove(user.id);
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
                        })
                    
                }
            }
        }
    })
}