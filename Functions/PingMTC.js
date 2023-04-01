const config = process.env.ENVIRONMENT == "Production" ? require("../config.json") : require("../localConfig.json")
const cron = require("cron")

module.exports = async (client) => {
    let job = new cron.CronJob(config.mtcSettings.pingDateTime, ping)
    job.start();
    //setInterval(()=>{ping()},5000)
    async function ping(){
        const guild =  await client.guilds.fetch(config.guildId);
        const channel = await guild.channels.fetch(config.channels.mtc);
        const pins = await channel.messages.fetchPinned(true);
        await guild.members.fetch();
        const mtcUsers = guild.roles.cache.get(config.roles.mtc).members.map(m=>m.user.id)
        if (pins.size > 0){
            const userArray = [];
            const getLazyPeople = new Promise((resolve, reject)=>{
                // for each pinned message...
                pins.forEach(async x=>{
                    // fetch the full message
                    const m = await channel.messages.fetch(x)
                    // for each cached partial reaction
                    await m.react('🔄')
                    m.reactions.cache.forEach(async y=>{
                        // fetch the full reaction
                        y.fetch().then(async r=> {
                            if (r._emoji.name === '❌' || r._emoji.name === '✅'){
                                // fetch the users who clicked each reaction
                                const usrs = await r.users.fetch()
                                // map the user ids to a new array
                                usrs.map(z=>{
                                    if (!z.bot){
                                        userArray.push(z.id);
                                        // TODO: put this in the original if statement so people don't get pinged about their own map submission
                                        if (m.content.includes(z.id)){
                                            //console.log("Submitter")
                                        }
                                    }
                                });
                            }
                            resolve();
                        })
                    });
                })
            })
    
            getLazyPeople.then(()=>{
                const naughtyPeople = [];
                mtcUsers.forEach(u=>{
                    // If any member did not react and is not a bot, make them naughty
                    if (u != config.users.bot && !userArray.includes(u)){
                        naughtyPeople.push(u);
                    }
                })
                if (naughtyPeople.length > 0){
                    var tagUsersString = "";
                    naughtyPeople.forEach(n=>{
                        tagUsersString += `<@${n}>, `
                    })
                    tagUsersString += "there are unhandled actions that require your attention. Please review the pinned messages."
                    channel.send({content:tagUsersString})
                }
            })
        }
        else{
            console.info("No pins")
        }
    }
}