const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json")
const cron = require("cron")

module.exports = async (client) => {
    // Comment next two lines and uncomment third line to test this method
    let job = new cron.CronJob(config.mtcSettings.pingDateTime, ping)
    job.start();
    //setTimeout(()=>{ping()},1000)

    async function ping() {
        const guild =  await client.guilds.fetch(config.guildId);

        const mtcMemberIds = guild.roles.cache.get(config.roles.mtc).members.map(m=>m.user.id);

        const channel = await guild.channels.fetch(config.channels.mtc);
        const pins = await channel.messages.fetchPins()

        //Leaving this commented for now but I don't think we actually need it and I think it actually broke the app in testing
        //await guild.members.fetch();

        const idleMemberIds = new Set();
        if (pins.items.length > 0) {            
            for (const pin of pins.items) {
                const reaction = await pin.message.react('🔄')
                await reaction.remove();

                const reactedIds = [];
                for (const cachedReact of pin.message.reactions.cache.values()){
                    // .fetch the full hydrated reaction, must do if we want user data (we want user data)
                    const reaction = await cachedReact.fetch();

                    if (['❌', '✅'].includes(reaction.emoji.name)) {
                        // fetch the users who clicked each reaction
                        const users = await reaction.users.fetch()
                        for (const user of users.values()) {
                            reactedIds.push(user.id);
                        }
                    }
                };

                for (const id of mtcMemberIds) {
                    // Mark a member idle if they did not react and did not submit this map
                    if (!reactedIds.includes(id) && !pin.message.content.includes(id)) {
                        idleMemberIds.add(id);
                    }
                }
            }
        }

        if (idleMemberIds.size > 0) {
            let tagUsersString = "";
            for (const memberId of idleMemberIds) {
                tagUsersString += `<@${memberId}>, `
            }
            tagUsersString += "there are unhandled actions which require your attention. Please review the pinned messages."

            channel.send({content:tagUsersString});
        } else {
            channel.send({content: "All MTC members are up-to-date on their voting, nice work!"});
        }
    }
}