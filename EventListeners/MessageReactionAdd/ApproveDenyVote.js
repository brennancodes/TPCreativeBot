const { EmbedBuilder } = require("discord.js")
const config = process.env.ENVIRONMENT == "Production" ? require("../../config.json") : require("../../localConfig.json")
const axios = require('axios');
const { GetFMRoot } = require("../../Functions");
//const fetch = require('node-fetch')

module.exports.execute = async (reaction, user) => {
    if(reaction.message.channelId === config.channels.mtc){
        // Use this IF block to determine if it is a reaction on a map submission
        if (reaction.message.content.includes("map submission [")){
            const currentDate = new Date();
            const guild =  await reaction.client.guilds.fetch(config.guildId);
            const mtcRole = guild.roles.cache.get(config.roles.mtc);
            const mtcMajority = Math.ceil(mtcRole.members.size/2) + 1

            //Make sure we're counting all reactions even if the bot restarts
            await reaction.message.fetch();
            
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
            const feedbackAuthors = new Set();
            let feedbackOverride = false;
            const threads = Array.from(feedbackThreads.keys());
            if (feedbackThreads.find(x=>x.id == threads[0]) != null){
                const msgs = await feedbackThreads.find(x=>x.id == threads[0]).messages.fetch();
                msgs.forEach(z=>{
                    if (z.content.length > 1 || z.attachments.size > 0){
                        feedbackArray.push(z)
                        feedbackAuthors.add(z.author.id);
                    }
                    if (z.content == "Feedback Override" || reaction.message.content.includes("UPDATED map submission")){
                        feedbackOverride = true;
                    }
                })
            }
            // extract userTag from message content
            const msgCont = await reaction.message.content;
            const submitterTag = await msgCont.substring(msgCont.lastIndexOf('<'), msgCont.lastIndexOf('>')+1);
            // parse out the ID from the userTag
            const submitterId = await submitterTag.slice(2,submitterTag.length-1)
            console.log(submitterId)

            if (config.mtcSettings.blockSelfVoting){
                if (reaction.message.content.includes(user.id) && reaction._emoji.name !== '❌'){
                    await reaction.users.remove(user.id)
                    reaction.message.channel.send({content:`You know better than to vote on your own submission, <@${user.id}>.`,allowedMentions:{"users":[]}})
                }
            }

            await reaction.message.fetch();
            
            let decision;
            let wired = false;

            const wire = reaction.message.reactions.cache.get('🔬');

            if (wire != null) {
                const users = await wire.users.fetch();
                const wireVotes = Math.max(users.size - 1, 0);

                wired = wireVotes >= config.mtcSettings.qualityControlThreshold;
            }

            await getDecision();
            Respond();

            async function getDecision() {
                if (reaction._emoji.name === '🔄') {
                    decision = "Refresh";
                    return;
                }

                const yVotes = reaction.message.reactions.cache.get('✅');
                const nVotes = reaction.message.reactions.cache.get('❌');

                // Remove the bot's initial pre-vote from each reaction.
                const approveVotes = Math.max((yVotes?.count ?? 0) - 1, 0);
                const denyVotes = Math.max((nVotes?.count ?? 0) - 1, 0);

                const hoursElapsed =
                    (new Date() - reaction.message.createdTimestamp) / 3600000;

                const majorityReached =
                    approveVotes >= mtcMajority ||
                    denyVotes >= mtcMajority;

                const timeoutThresholdReached =
                    approveVotes >= config.mtcSettings.approveDenyThreshold ||
                    denyVotes >= config.mtcSettings.approveDenyThreshold;

                // Before 24 hours, require a mathematical majority.
                // After 24 hours, require the configured vote threshold.
                if (
                    (hoursElapsed < config.mtcSettings.minimumVoteTime && !majorityReached) ||
                    (hoursElapsed >= config.mtcSettings.minimumVoteTime && !timeoutThresholdReached)
                ) {
                    decision = "No Decision";
                    return;
                }

                // At this point, one side has reached the required threshold.
                if (feedbackAuthors.size < config.mtcSettings.feedbackThreshold && !feedbackOverride) {
                    decision = "Pending Feedback";
                }
                else if (approveVotes > denyVotes) {
                    if (!wired) {
                        decision = "Pending Manual Test";
                    }
                    else {
                        decision = "Approved";
                    }
                }
                else if (denyVotes > approveVotes) {
                    decision = "Denied";
                }
                else {
                    decision = "No Decision";
                }
            }

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
                    .setFooter({text:`Alert triggered by ${user.displayName}`})
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
                    .setFooter({text:`Alert triggered by ${user.displayName}`})
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
                                            console.info("Successful request. Response: ", resp.data)
                                            mtcAdminChannel.send({embeds:[embed],content:`**${decision.toLocaleUpperCase()} FOR ROTATION** \n${mapByAuthor}`,allowedMentions: {"users":[]}});
                                            embed.setDescription(`${mapByAuthorLinks}\nID: **${descSplit[3]}**`);
                                            embed.setThumbnail(null);
                                            embed.setImage(imageUrl)
                                            mtcAnnouncementChannel.send({embeds:[embed],content:`<@&${config.roles.mapUpdates}> ${header}\n${mapByAuthor}`})
                                        }
                                        else {
                                            console.error("Request failed.")
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
                        }).then(async ()=>{
                            let submitter = null;
                            try {
                                submitter = await reaction.client.users.cache.get(`${submitterId}`)
                                console.log(submitter);
                            } catch (error){
                                console.error('Member not found in this server', error);
                            }
                            let submitterAddress = submitter?.displayName != null ? ", " + submitter.displayName : "";
                            let decisionText = "";
                            if (decision == "Approved"){
                                if (reaction.message.content.includes("UPDATED map submission")){
                                    decisionText = `Nice${submitterAddress}! Your updated submission has been approved.`
                                }
                                else {
                                    decisionText = `Congratulations${submitterAddress}!! Your map has been selected to enter the map rotation on a trial basis.`;
                                }
                            }
                            else {
                                decisionText = `Sorry${submitterAddress}, your map was not selected this time.`;
                            }

                            let feedback = "**Feedback:**\n";
                            let files = [];

                            for (let i = feedbackArray.length - 1; i >= 0; i--) {
                                const message = feedbackArray[i];
                                if (message.content) {
                                    feedback += "➢ " + message.content + "\n";
                                }
                                message.attachments.forEach(attachment => {
                                    files.push(attachment.url);
                                });
                            }

                            const approveCount = Math.max((appr?.count ?? 0) - 1, 0);
                            const denyCount = Math.max((deny?.count ?? 0) - 1, 0);
                            const votingResults = `\n\n**Voting Results**\n:white_check_mark: ${approveCount} - ${denyCount} :x:`
                            const cmdReminder = `\nUse command **/getfeedback ${descSplit[3]}** any time in the official TagPro discord to review the comments.`
                            const fileNotice = files.length > 0
                                ? "\n\n📎 Images/files from the feedback are attached below."
                                : "";
                            // Discord allows max 10 attachments per message.
                            // Send the textual feedback + first batch of attachments together.
                            await reaction.client.users.cache.get(`${submitterId}`).send({
                                content: `${decisionText}${votingResults}\n\n${feedback}${cmdReminder}${fileNotice}`,
                                files: files.slice(0, 10)
                            });

                            // Send any remaining attachments in additional DMs
                            for (let i = 10; i < files.length; i += 10) {
                                await reaction.client.users.cache.get(`${submitterId}`).send({
                                    files: files.slice(i, i + 10)
                                });
                            }                            
                            // let feedbackString = "**Feedback:**\n\n";
                            // let contentString = "";
                            // if (decision == "Approved"){
                            //     contentString = "Congratulations!! Your map has been selected to enter the map rotation on a trial basis."
                            // }
                            // else {
                            //     contentString = "Sorry, your map was not selected this time."
                            // }
                            // for (var i = feedbackArray.length - 1; i >= 0; i--){
                            //     feedbackString += "➢ " +  feedbackArray[i] + "\n\n"
                            // }
                            // feedbackString += `\nUse command **/getfeedback ${descSplit[3]}** any time in the official TagPro discord to review this.`
                            // embed.data.description = `${embed.data.description.split("Yes votes:")[0]} ${feedbackString}`;
                            // reaction.client.users.cache.get(`${submitterId}`).send({
                            //     content: contentString,
                            //     embeds:[embed]
                            // })
                        })

                }
            }
        }
    }
}