console.log("lets write javascript!!")
let currentSong = new Audio();
let songs;
let currFolder;
let volinput = 0.3;
function formatTime(seconds) {
    if (isNaN(seconds) || seconds<0){
        return "00:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`http://127.0.0.1:5501/songs/${folder}/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }
    //Show all the songs in the playlist
    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    let songlistHTML = ""
    for (const song of songs) {
        songlistHTML += `
        <li>
            <div class="musicdata">
                <img src="music.svg" alt="Song">
                <div class="info">
                    <div class="trackname">${decodeURI(song)}</div>
                    <div class="artist">Rishu Sahu</div>
                </div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="play.svg" alt="Play" style="width: 22px;">
            </div>
        </li>`
    songUL.innerHTML = songlistHTML;
    }
    //Attach an event listner to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e=>{
        e.querySelector(".playnow").addEventListener("click", ()=>{
            playMusic(e.querySelector(".info").firstElementChild.innerHTML)
        })
    })
}

const playMusic=(track, pause=false)=>{
    // let audio = new Audio(`http://127.0.0.1:5501/songs/${currFolder}/` + track)
    currentSong.src = `http://127.0.0.1:5501/songs/${currFolder}/` + track
    if (!pause){
        currentSong.play()
        play.src = "pause.svg"
    }
    document.querySelector(".songname").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00"
}
async function displayAlbums() {
    let a = await fetch(`http://127.0.0.1:5501/songs/`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchor = div.getElementsByTagName("a")
    let array = Array.from(anchor)
    let cards = document.querySelector(".cards")
    let cardsHTML = ""
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs/")){
            let folder = (e.href.split("/songs/").slice(-1)[0])
            // Get meta data of the folder
            let a = await fetch(`http://127.0.0.1:5501/songs/${folder}/info.json`)
            let response = await a.json();
            cardsHTML += `
            <div data-folder="${folder}" class="card rounded">
                <img class="album" src="songs/${folder}/cover.jpg" alt="Album">
                <h4 style="font-weight: bold;">${response.title}</h4>
                <p style="font-size: 13px;">${response.description}</p>
                <img class="play" src="player.svg" alt="Play">
            </div>`
        } // The Event Listener needs to wait for async function to load cards
        cards.innerHTML = cardsHTML;
    }    
}
function volimg(val){
    let image = document.querySelector(".vol img");
    if (val == 0)
        image.src = `http://127.0.0.1:5501/mute.svg`
    else if (val < 0.5)
        image.src = `http://127.0.0.1:5501/vollow.svg`
    else
        image.src = `http://127.0.0.1:5501/volhigh.svg`
}
function toggleplay(){
    if (currentSong.paused){
        currentSong.play()
        play.src = "pause.svg"
    }
    else{
        currentSong.pause()
        play.src = "play.svg"
    }
}
async function main(){
    //Get the list of all the songs
    await getSongs("kabira")
    playMusic(songs[0],true) // Browser blocks autoplay else this is neccessary

    //Display all the albums on the page
    await displayAlbums()

    //Attach an event listener to play, next and previous
    play.addEventListener("click", toggleplay);
    document.addEventListener("keydown", e => {
        if (e.code === "Space") {
            e.preventDefault();
            toggleplay();
        }
    })
    next.addEventListener("click", ()=>{
        currentSong.pause()
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index+1) < songs.length){
            playMusic(songs[index+1])
        }
    })
    prev.addEventListener("click", ()=>{
        currentSong.pause()
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0])
        if ((index-1) >= songs.length){
            playMusic(songs[index-1])
        }
    })

    // Listen for timeupdata event
    currentSong.addEventListener("timeupdate", ()=>{
        document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`
        document.querySelector(".circle").style.left = (currentSong.currentTime/currentSong.duration * 100) + "%";
    })
    // Add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        //document.querySelector(".circle").style. left = (e.offsetX/e.document.querySelector(".seekbar").getBoundingClientRect().width) * 100 + "%"; // relative x wrt left edge / width of object
        const seekbar = e.currentTarget;
        const rect = seekbar.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = (clickX / rect.width) * 100;
        document.querySelector(".circle").style.left = `${percentage}%`;// Align the circle center else left most point was considered
        currentSong.currentTime = (currentSong.duration) * percentage/100
    });
    // Add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = "0"
    })
    document.querySelector(".close").addEventListener("click", ()=>{
        document.querySelector(".left").style.left = '-100%';
    })
    // Add an event to volume
    document.querySelector(".vol").getElementsByTagName("input")[0].addEventListener("change", e=>{
        volinput = parseInt(e.target.value)/100
        currentSong.volume = volinput
        volimg(volinput)
    })
    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e=>{
        e.addEventListener("click", async item=>{
            await getSongs(`${item.currentTarget.dataset.folder}`)
            playMusic(songs[0])
        })
    })
    
    // Add event listener to mute music
    document.querySelector(".vol>img").addEventListener("click", e=>{
        if (e.target.src.includes("volhigh.svg")){
            e.target.src = e.target.src.replace("volhigh.svg", "mute.svg")
            currentSong.volume = 0;
            document.querySelector(".vol").getElementsByTagName("input")[0].value = 0;
        }
        else if (e.target.src.includes("vollow.svg")){
            e.target.src = e.target.src.replace("vollow.svg", "mute.svg")
            currentSong.volume = 0;
            document.querySelector(".vol").getElementsByTagName("input")[0].value = 0;
        }
        else{
            currentSong.volume = volinput;
            console.log(volinput)
            volimg(volinput)
            document.querySelector(".vol").getElementsByTagName("input")[0].value = volinput * 100;
        }
    })
}
main()
