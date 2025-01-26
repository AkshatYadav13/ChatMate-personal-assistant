const typingform = document.querySelector('.typing-form')
const chatlist = document.querySelector('#chat-list')
const sendbtn =  document.querySelector('#send-btn')
const toggleThemeBtn = document.querySelector('#toggle-theme-btn')
const deleteChatsBtn = document.querySelector('#deleteChats-btn')
const suggestion = document.querySelectorAll('#suggestion .suggestionBox')

// Api configuration
const api_key = 'AIzaSyAuQmmwSIIWweEY52rFZk8ldnAz4S-Zj3E'
const api_url = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${api_key}`

let userMsg = null
let isResponseGenerating = false


function loadLocalStorageDate(){
    const isLightMode = (localStorage.getItem('themeColor') === 'light_mode')  //returns true when lightMode is selected
    
    document.body.classList.toggle('light_mode',isLightMode);
    toggleThemeBtn.innerHTML = isLightMode?'dark_mode':'light_mode';

    const savedChats = localStorage.getItem('savedChats')
    chatlist.innerHTML = savedChats || ''

    document.body.scrollTo(0,document.body.scrollHeight) //auto scroll to bottom

    document.body.classList.toggle('hide-header',savedChats)  //if no savedChats then header will we show else chats shown
}
loadLocalStorageDate()


//Show typing effect by displaying words one by one 
function showTypingEffect(text,textElement,loadingMsgDiv){
    const word = text.split(" ");
    currentWordIndex = 0;
    const typingInterval = setInterval(()=>{
        //Append each word to the text element with a space
        textElement.innerHTML += (currentWordIndex===0?'':' ')+word[currentWordIndex++]

        loadingMsgDiv.querySelector('.icon').classList.add('hide')

        // If all words are displayed
        if(currentWordIndex === word.length){
            clearInterval(typingInterval)
            isResponseGenerating = false
            sendbtn.style.filter = 'opacity(100%)'
            loadingMsgDiv.querySelector('.icon').classList.remove('hide')
            localStorage.setItem('savedChats',chatlist.innerHTML);  //save chats to localStorage
        }
        document.body.scrollTo(0,document.body.scrollHeight) //auto scroll to bottom
    },75)
}


// Fetch response from the api based on user msg
async function generateAPIResponse(loadingMsgDiv){
    const textElement = loadingMsgDiv.querySelector('.text');

    //sending a post request to api with the user's msg
    try{
        const response = await fetch(api_url,{
            method:'POST',
            header:{
                'Content-Type':'application/json'
            },
            body:JSON.stringify({
                contents:[{
                    role:'user',
                    parts:[{text :userMsg}]
                }]
            })
        });

        const data = await response.json();
        const api_response = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g,'$1')    //answer fetched from api
        console.log(api_response)

        if(!response.ok) throw new Error ('');

        showTypingEffect(api_response,textElement,loadingMsgDiv)
    }
    catch(error){
        isResponseGenerating = false
        textElement.innerHTML ='Sorry of intruption,someting went wrong.Try again';
        textElement.classList.add('error');
    }
    finally{
        loadingMsgDiv.classList.remove('loading')
    }
}


function createMsgElement(content,...className){
    const div = document.createElement('div');
    div.classList.add('message',...className)
    div.innerHTML = content
    return div
}


function showLoadingAnimation(){
    const html = `<div class="msgContent">
                    <img src="gemini.svg">
                    <p class="text"></p>
                    <div class="loading-indicator">
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                        <div class="loading-bar"></div>
                    </div>
                  </div>
                <span onclick='copyMsg(this)' class="material-symbols-rounded icon copy">content_copy</span>
`
    var loadingMsgDiv = createMsgElement(html,'loading','incoming')
    chatlist.appendChild(loadingMsgDiv);

    document.body.scrollTo(0,document.body.scrollHeight) //auto scroll to bottom
    generateAPIResponse(loadingMsgDiv)
}


// Copy text to clipBoard
function copyMsg(copyIcon){
    const msgText = copyIcon.parentElement.querySelector('.text').innerHTML;

    navigator.clipboard.writeText(msgText)
    copyIcon.innerHTML = 'done'; //show tick icon

    setTimeout(()=>{
        copyIcon.innerHTML = 'content_copy';  //Revert icon after 1sec
    },1000)
}


// handle sending outgoing chat msg
function handleOutgoingChat(){
    userMsg = typingform.querySelector('.typing-input').value.trim() || userMsg
    if(!userMsg|| isResponseGenerating)  return;  //exit if their is no msg

    isResponseGenerating = true
    sendbtn.style.filter = 'opacity(50%)'

    const html = `<div class="msgContent">
                    <img id='userlogo' src="https://cdn-icons-png.flaticon.com/512/758/758771.png">
                    <p class='text'></p>
                </div>
                <span class="material-symbols-rounded icon copy">content_copy</span>
`

    var outgoingMsgDiv = createMsgElement(html,'outgoing')
    outgoingMsgDiv.querySelector('.text').innerHTML = userMsg
    chatlist.appendChild(outgoingMsgDiv);

    typingform.reset()
    document.body.scrollTo(0,document.body.scrollHeight) //auto scroll to bottom
    document.body.classList.add('hide-header'); //hides header when chat started 
    setTimeout(showLoadingAnimation(),500);
}


toggleThemeBtn.addEventListener('click',()=>{
    const isLightMode = document.body.classList.toggle('light_mode')
    localStorage.setItem('themeColor',isLightMode?'light_mode':'dark_mode');
    toggleThemeBtn.innerHTML = isLightMode?'dark_mode':'light_mode';
})


deleteChatsBtn.addEventListener('click',()=>{
    if(confirm('Are you sure you want to delete All messages?')){
        localStorage.removeItem('savedChats')

        loadLocalStorageDate();
    }
})

suggestion.forEach((e)=>{
    e.addEventListener('click',()=>{
        userMsg = e.querySelector('h4').innerHTML
        handleOutgoingChat()
    })
})


typingform.addEventListener('submit',(e)=>{
    e.preventDefault()
    handleOutgoingChat()
})