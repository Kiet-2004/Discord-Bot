const fetch = require ('node-fetch');

async function joemama (){
    const response = await fetch("https://safebooru.org/index.php?page=dapi&s=post&q=index&limit=5000&pid=0&tags=brown_hair&json=1");
    const data = await response.json();
    rand = Math.floor(Math.random() * 5000);
    console.log(rand);
    console.log(data[500]);
}

joemama()
