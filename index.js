const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`Flux bot sikeresen elindult mint ${client.user.tag}!`);
    
    // Zöld online státusz és aktivitás kikényszerítése
    client.user.setPresence({
        activities: [{ name: 'FluxBot online!', type: ActivityType.Playing }],
        status: 'online',
    });
});

client.on('guildMemberAdd', (member) => {
    const welcomeChannel = member.guild.channels.cache.get('1558150885551644682');
    if (welcomeChannel) {
        welcomeChannel.send(`Üdvözlünk a szerveren, <@${member.id}>! 🎉 Érezd jól magad!`);
    }
});

client.login(process.env.DISCORD_TOKEN);