// const fs = require('node:fs');
// const path = require('node:path');
// const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
// const { token } = require('./config.json');

// const client = new Client({ intents: [GatewayIntentBits.Guilds] });


// client.commands = new Collection();
// const commandsPath = path.join(__dirname, 'commands');
// const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// for (const file of commandFiles) {
// 	const filePath = path.join(commandsPath, file);
// 	const command = require(filePath);
// 	// Set a new item in the Collection with the key as the command name and the value as the exported module
// 	if ('data' in command && 'execute' in command) {
// 		client.commands.set(command.data.name, command);
// 	} else {
// 		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
// 	}
// }

// client.on(Events.InteractionCreate, async interaction => {
// 	if (!interaction.isChatInputCommand()) return;
	
// 	const command = interaction.client.commands.get(interaction.commandName);

// 	if (!command) {
// 		console.error(`No command matching ${interaction.commandName} was found.`);
// 		return;
// 	}

// 	try {
// 		await command.execute(interaction);
// 	} catch (error) {
// 		console.error(error);
// 		if (interaction.replied || interaction.deferred) {
// 			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
// 		} else {
// 			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
// 		}
// 	}
// });

const { Client, Events, GatewayIntentBits, SlashCommandBuilder } = require('discord.js');
const fetch = require("node-fetch");
const Canvas = require('@napi-rs/canvas');
const jsonData= require('./waifus.json'); 


const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

const { token } = require('./config.json');
// API_URL = 'https://api-inference.huggingface.co/models/Hobospider132/DialoGPT-Mahiru-Proto';


let image_data;

client.once(Events.ClientReady, async c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

    image_data = await image_load();
    console.log(image_data);
	const ping = new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Reply with "Pong!"');
   
});

// client.once(Events.InteractionCreate, interaction => {
// 	if (interaction.isChatInputCommand()) return;
	
// 	if (interaction.commandName === "ping"){
// 		interaction.channel.send("pong");
// 	}
// })

async function image_load(){
    const response = await fetch("https://safebooru.org/index.php?page=dapi&s=post&q=index&limit=5000&pid=0&tags=brown_hair&json=1");
    const data = await response.json();
    return data
}

client.on(Events.MessageCreate, async message => {
	if(message.author.id === client.user.id) return;
    
	// const payload = {
    //     inputs: {
    //         text: message.content
    //     }
    // };
	// const headers = {
    //     'Authorization': 'Bearer ' + process.env.HUGGINGFACE_TOKEN
    // };

    // const response = await fetch(API_URL, {
    //     method: 'post',
    //     body: JSON.stringify(payload),
    //     headers: headers
    // });

    // const data = await response.json();
    // let botResponse = '';
    // if (data.hasOwnProperty('generated_text')) {
    //     botResponse = data.generated_text;
    // } else if (data.hasOwnProperty('error')) { 
    //     botResponse = data.error;
    // }

    // message.reply(botResponse);

    if (message.content.toLowerCase() === "s!hello"){
        message.reply(`Hello ${message.author}-san`)
    }
    if (message.content.toLowerCase().startsWith("s!r")){
        let str = message.content.slice(3);
        if (!isNaN(str.toString())){
            let rand = Math.floor(Math.random() * (0 + str)) + 1;
            message.reply(rand.toString());
        } else {
            message.reply("Invalid!");
        };
    }
    if (message.content.toLowerCase() === "s!image"){
        //files: [{ attachment: "./images/lycoReco.jpg" }];
        rand = Math.floor(Math.random() * 500);
        message.channel.send({ files: [{ attachment: ("https://safebooru.org/images/" + image_data[rand].directory + "/" + image_data[rand].image)}] });
    }
    if (message.content.toLowerCase() === "s!cheek poke"){
        message.reply(`${message.author}-kun no BAKA!!!`);
        message.channel.send({ files: [{ attachment: './images/cheek.jpg' }] });
    }
    console.log(message.content);
})
client.login(token);