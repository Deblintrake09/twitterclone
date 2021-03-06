$(document).ready(() => {

    socket.emit("join room", chatId);
    socket.on("typing", ()=>{
        console.log("user is typing");
    })
    $.get(`/api/chats/${chatId}`, (data) => {
        $("#chatName").text(getChatName(data));
    });

    $.get(`/api/chats/${chatId}/messages`, data => {
        if (data != null) {
            let lastSenderId = "";
            let messages = [];

            data.forEach((message, index) => {
                let html = createMessageHTML(message, data[index + 1], lastSenderId);
                messages.push(html);
                lastSenderId = message.sender._id;
            });
            let messagesHTML = messages.join("");
            addMessageHTMLToPage(messagesHTML);
            scrollToBottom(false);
            $(".loadingSpinnerContainer").remove();
            $(".chatContainer").css("visibility","visible");
        }
    });
})

$("#chatNameButton").click(() => {
    let name = $("#chatNameTextbox").val().trim();
    $.ajax({
        url: "/api/chats/" + chatId,
        type: "PUT",
        data: { chatName: name },
        success: (data, status, xhr) => {
            if (xhr.status != 204) {
                alert("could not update");
            } else {
                location.reload();
            }
        }
    });
});


$(".sendMessageButton").click(() => {
    messageSubmitted();
})
$(".inputTextbox").keydown((event) => {
    updateTyping();
    if (event.which === 13) { // TODO Multiline && !event.shiftKey
        messageSubmitted();
        return false;
    }
})

function updateTyping(){
    socket.emit("typing", chatId);
}

function messageSubmitted() {
    let content = $(".inputTextbox").val().trim();
    if (content) {
        $(".inputTextbox").val("");
        sendMessage(content);

    }
}

function sendMessage(content) {
    $.post("/api/messages", { content: content, chatId: chatId }, (data, status, xhr) => {
        if (xhr.status != 201) {
            alert("could not send message");
            $(".inputTextbox").val(content);
            return;
        }
        addChatMessageHTML(data);
    })
}

function addChatMessageHTML(message) {
    if (!message || !message._id) {
        alert("message is not valid");
        return;
    }
    let messageDiv = createMessageHTML(message, null, "");
    addMessageHTMLToPage(messageDiv);
    scrollToBottom(true);
}

function addMessageHTMLToPage(html) {
    $(".chatMessages").append(html);
}

function createMessageHTML(message, nextMessage, lastSenderId) {
    let sender = message.sender;
    let senderName = sender.firstName + " " + sender.lastName;

    let currentSenderId = sender._id;
    let nextSenderId = nextMessage != null ? nextMessage.sender._id : "";

    let isFirst = lastSenderId != currentSenderId;
    let isLast = nextSenderId != currentSenderId;

    let isMine = message.sender._id == userLoggedIn._id;
    let liClassName = isMine ? "mine" : "theirs";
    
    let nameElement="";
    if (isFirst) {
        liClassName += " first";
        if(!isMine){
            nameElement = `<span class='senderName'>${senderName}</span>`;
        }
    }
    let profileImage="";
    if (isLast) {
        liClassName += " last";
        profileImage=`<img src="${sender.profilePic}">`;
    }
    let imageContainer="";
    if(!isMine){
        imageContainer=`<div class="imageContainer">
                            ${profileImage}
                        </div>`
    }
    return `<li class="message ${liClassName}">
        ${imageContainer}
        <div class="messageContainer">
            ${nameElement}
            <span class="messageBody">
                ${message.content}
            </span>
        </div>
    </li>`;
}

function scrollToBottom(animated){
    let container= $(".chatMessages");
    let scrollHeight=container[0].scrollHeight;
    if(animated){
        container.animate({scrollTop:scrollHeight}, "slow");
    }
    else{
        container.scrollTop(scrollHeight);
    }
}
