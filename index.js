////// Import modulo
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, SlashCommandBuilder , Collection } = require('discord.js');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const fetch = require("node-fetch");

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

////////////////////////////////////////////////////////////////////////////////////////////////

// Setting commands

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

/////////////////////////////////////////////////////////////////////////////////////////////////////
// Token

const { token } = require('./config.json');
// API_URL = 'https://api-inference.huggingface.co/models/Hobospider132/DialoGPT-Mahiru-Proto';


/////////////////////////////////////////////////////////////////////////////////////////////////////
// Commands handle

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});





//////////////////////////////////////////////////////////////////////////////////////////////////////
// Message handle

let image_data;

async function image_load(name){
    //const response = await fetch("https://safebooru.org/index.php?page=dapi&s=post&q=index&limit=5000&pid=0&json=1");
    const list = ["waifu", "neko", "shinobu", "hug", "awoo", "smug", "bonk", "yeet", "blush", "smile", "wave", "highfive", "handhold", "nom", "happy", "wink", "poke"];
	const response = await fetch("https://api.waifu.pics/sfw/" + name);
	const data = await response.json();
    return data
}

// async function image_load_nsfw(){
//     //const response = await fetch("https://safebooru.org/index.php?page=dapi&s=post&q=index&limit=5000&pid=0&json=1");
// 	const list = ["waifu", "neko", "trap", "blowjob"];
//     rand = Math.floor(Math.random() * 4);
//     const response = await fetch("https://api.waifu.pics/nsfw/" + list[rand]);
// 	const data = await response.json();
//     return data
// }

async function anime_load(){
    const data = await require("./anime.json");
    rand = Math.floor(Math.random() * data.data.length);
    return data.data[rand];
}

function read_file(){
    const raw_data = require("./anime.json");
    const _list = raw_data.data;
    const list = []
    for (let i = 0; i < _list.length; i++){
        const temp = _list[i].synonyms;
        list.push(temp);
    }
    return list;
}

function search(list, name){
    for (let i = 0; i < list.length; i++){
        if (list[i].toLocaleLowerCase().includes(name.toLocaleLowerCase())){
            return true;
        }
    }   
    return false;
}

function anime_search(name){
    const raw_data = require("./anime.json");
    const data = raw_data.data;
    const list = [];
    for (let i = 0; i < data.length; i++){
        if (anime_list[i] != undefined && anime_list[i][0] != undefined){
            if (search(anime_list[i], name) || data[i].title.toLocaleLowerCase().includes(name.toLocaleLowerCase())){
                list.push(data[i]);
            }
        }
    }
    return list;
}

const anime_list = read_file();

client.once(Events.ClientReady, async c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});


client.on(Events.MessageCreate, async message => {
	if(message.author.id === client.user.id) return;

    if (message.content.toLowerCase() === 's!help'){
        const Embed = new EmbedBuilder()
	        .setTitle("Commands help")
	        .setDescription('hello\nr\ncheek poke\nanime\nsend')

        message.channel.send({ embeds: [Embed] });
    }

    else if (message.content.toLowerCase() === "s!hello"){
        message.reply(`Hello ${message.author}-san`)
    }
    else if (message.content.toLowerCase().startsWith("s!r")){
        let str = message.content.slice(3);
        if (!isNaN(str.toString())){
            let rand = Math.floor(Math.random() * (0 + str)) + 1;
            const exampleEmbed = new EmbedBuilder()
	            .setDescription('==>  ' + rand.toString());
            message.channel.send({ embeds: [exampleEmbed] });
        } else {
            message.reply("Invalid!");
        };
    }



    // THIS FEATURE IS IN DEVELOPMENT AND CANNOT WORK PROPERLY CURRENTLY

    else if (message.content.toLocaleLowerCase().startsWith("s!search ")){
        let name = message.content.slice(9);
        const list = anime_search(name);
        if (list.length != 0){
            for (let i = 0; i < list.length; i++){
                const exampleEmbed = new EmbedBuilder()
	                .setTitle(list[i].title)
	                .setDescription(list[i].sources[0])
                message.channel.send({ embeds: [exampleEmbed] });
            }
        }
        else {
            message.reply("Cannot find the anime!");
        }
    }

    else if (message.content.toLowerCase() === "s!cheek poke"){
        const file = new AttachmentBuilder('./images/cheek.jpg');
        const exampleEmbed = new EmbedBuilder()
	        .setTitle(`${message.author.username}-kun no BAKA!!!`)
            .setImage('attachment://cheek.jpg')

        message.channel.send({ embeds: [exampleEmbed] , files: [file]});
    }
	// else if (message.content.toLowerCase() === "sss!nsfw"){
	//  	if (message.channel.nsfw){
    //         image_data = await image_load_nsfw();
	//  	    message.channel.send({ files: [{ attachment: image_data.url , name: "SPOILER_FILE.png"}]});
    //     }
    //     else {
    //         const file = new AttachmentBuilder('./images/no_horny.png');
    //         const exampleEmbed = new EmbedBuilder()
	//             .setTitle(`${message.author.username} NO HORNY!!!`)
    //             .setImage('attachment://no_horny.png')

    //         message.channel.send({ embeds: [exampleEmbed] , files: [file]});
    //     }
	// }

    else if (message.content.toLowerCase() === "s!anime"){
        data = await anime_load();
        const exampleEmbed = new EmbedBuilder()
	        .setTitle(data.title)
	        .setDescription(data.sources[0])
            .setImage(data.picture)

        message.channel.send({ embeds: [exampleEmbed] });
    }

    else if (message.content.toLowerCase().startsWith("s!send ")){
		let name = message.content.slice(7);
        const list = ["waifu", "neko", "shinobu", "hug", "awoo", "smug", "bonk", "yeet", "blush", "smile", "wave", "highfive", "handhold", "nom", "happy", "wink", "poke"];
        if (name === "help"){
            const Embed = new EmbedBuilder()
	            .setTitle("Send commands")
	            .setDescription("waifu\nneko\nshinobu\nhug\nawoo\nsmug\nbonk\nyeet\nblush\nsmile\nwave\nhighfive\nhandhold\nnom\nhappy\nwink\npoke")

            message.channel.send({ embeds: [Embed] });
        }

        else if (list.includes(name)){
            image_data = await image_load(name);
		    message.channel.send({ files: [{ attachment: image_data.url }]});
        }
        
        else {
            message.reply("Invalid commands!");
        }
	}
})
client.login(token);
