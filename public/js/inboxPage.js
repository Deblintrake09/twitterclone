$(document).ready(()=>{
    $.get("/api/chats", (data, status, xhr)=>{
        if(xhr.status==400){
            alert("could not get chat list.");
        }
        else{
            outputChatList(data, $(".resultsContainer"));
        }
    })
})

function outputChatList(chatlist, container){
    chatlist.forEach(chat => {
        let html = createChatHTML(chat);
        container.append(html);
    });
    
    if(chatlist.length == 0){
        container.append("<span class='noResults'>Nothing to show.</span>"); 
        return;
    }
}

function createChatHTML(chatData){
    let chatName = getChatName(chatData);
    let image = getChatImageElements(chatData.users);
    let latestMessage=getLatestMessage(chatData.latestMessage);
    return `<a href='/messages/${chatData._id}' class='resultListItem'>
        ${image}
        <div class="resultsDetailsContainer ellipsis">
            <span class="heading ellipsis">${chatName}</span>
            <span class="subtext ellipsis">${latestMessage}</span>
        </div>
    </a>`
}

function getLatestMessage(latestMessage){
    if(latestMessage!= null){
        let sender =  latestMessage.sender;
        return `${sender.firstName} ${sender.lastName}: ${latestMessage.content}`;
    }
    return "New Chat";
}
function getChatImageElements(chatData){
    let otherChatUsers = getChatOtherUsers(chatData);
    let groupChatClass="";
    let chatImage = getUserChatImage(otherChatUsers[0]);
    if(otherChatUsers.length >1){
        groupChatClass = "groupChatImage";
        chatImage += getUserChatImage(otherChatUsers[1]);
    }
    return `<div class='resultsImageContainer ${groupChatClass}'>${chatImage}</div>`

}

function getUserChatImage(user){
    if(!user||!user.profilePic){
        return alert("user passed into functin is invalid");
    }
    return `<img src='${user.profilePic}' alt='${user.firstName} ${user.lastName}'s profile Pic'>`;
}