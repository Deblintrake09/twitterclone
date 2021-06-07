//GLOBALS
let cropper;
let timer;
let selectedUsers=[];



$("#postTextarea, #replyTextarea").keyup(event=>{
    var textbox=$(event.target);
    var value = textbox.val().trim();

    var isModal = textbox.parents(".modal").length == 1;

    var submitBtn = isModal ? $("#submitReplyButton") : $("#submitPostButton");
    if(submitBtn.length==0) return alert("no submit button found");

        if(value==""){
            submitBtn.prop("disabled", true);
            return
        }
        submitBtn.prop("disabled", false);
    
});

$("#submitPostButton, #submitReplyButton").click(()=>{
    var button = $(event.target);
    
    var isModal = button.parents(".modal").length == 1;
    var textbox = isModal ? $("#replyTextarea") : $("#postTextarea");

    var data ={
        content: textbox.val()
    }
    if(isModal){
        var id=button.data().id;
        if(id==null) return alert("button id is null");
        data.replyTo=id;
    }
    $.post("/api/posts", data, postData=>{
        if(postData.replyTo){
            location.reload();
        }
        else{
            var html =createPostHtml(postData);
            $(".postsContainer").prepend(html);
            textbox.val("");
            button.prop("disabled", true);
        }
    })
});



//Handles Like Button on posts
$(document).on("click",".likeButton",(event)=>{
    var button = $(event.target);
    var postId= getPostIdFromElement(button);
    
    if(postId===undefined) return;
    $.ajax({
        url:`/api/posts/${postId}/like`,
        type: "PUT",
        success: (postData)=>{
            button.find("span").text(postData.likes.length||"");
            if(postData.likes.includes(userLoggedIn._id)){
                button.addClass("active");
            }
            else
                button.removeClass("active");
        }
    })
});

//Handles Retweet Button on posts
$(document).on("click",".retweetButton",(event)=>{
    var button = $(event.target);
    var postId= getPostIdFromElement(button);
    
    if(postId===undefined) return;
    $.ajax({
        url:`/api/posts/${postId}/retweet`,
        type: "POST",
        success: (postData)=>{
          button.find("span").text(postData.retweetUsers.length||"");
            if(postData.retweetUsers.includes(userLoggedIn._id)){
                button.addClass("active");
            }
            else
                button.removeClass("active");
        
        }
    })
});

$(document).on("click",".post",(event)=>{
    var element=$(event.target);
    var postId= getPostIdFromElement(element);
    if(postId !== undefined&& !element.is("button"))
    {
        window.location.href='/post/'+postId;
    }
});

$(document).on("click", ".followButton",(event)=>{
    var button = $(event.target);
    var userId =button.data().user;
    console.log(userId);
    
    if(userId===undefined) return;
    
    $.ajax({
        url:`/api/users/${userId}/follow`,
        type: "PUT",
        success: (data, status, xhr)=>{
            if(xhr.status == 404){
                alert("user not fount");
                return;
            }
            var difference = 1;
            if(data.following && data.following.includes(userId)){
                button.addClass("following");
            }else{
                button.removeClass("following");
                difference = -1;
            }
            var followersLabel = $("#followersValue");
            if(followersLabel.length!=0)
            {
                var followersText = parseInt(followersLabel.text());
                followersLabel.text(followersText + difference);
            }
        }
    })
});

$("#replyModal").on("show.bs.modal",(event)=>{
    var button = $(event.relatedTarget);
    var postId= getPostIdFromElement(button);
    
    $("#submitReplyButton").attr("data-id", postId);

    $.get(`api/posts/${postId}`, results=> {
        outputPosts(results.postData, $("#originalPostContainer"));
    })
});

$("#replyModal").on("hidden.bs.modal",()=>$("#originalPostContainer").html(""))

//Adds the postId to the deleteButton when the modal opens.
$("#deletePostModal").on("show.bs.modal",(event)=>{
    var button = $(event.relatedTarget);
    var postId= getPostIdFromElement(button);
    $("#deletePostButton").attr("data-id", postId);
})
//Handles the delete button on the modal being clicked
$("#deletePostButton").click((event)=>{
    var postId = $(event.target).data("id");
    $.ajax({
        url:`/api/posts/${postId}`,
        type: "DELETE",
        success: (data, status, xhr)=>{
            if(xhr.status !=202){
                alert("Could not delete post! -- FIX THIS");
            }
            location.reload();
        }
    })
})

//Adds the postId to the pinButton when the modal opens.
$("#pinPostModal").on("show.bs.modal",(event)=>{
    var button = $(event.relatedTarget);
    var postId= getPostIdFromElement(button);
    $("#pinPostButton").attr("data-id", postId);
})

$("#pinPostButton").click((event)=>{
    var postId = $(event.target).data("id");
    $.ajax({
        url:`/api/posts/${postId}`,
        type: "PUT",
        data: { pinned:true},
        success: (data, status, xhr)=>{
            if(xhr.status !=204){
                alert("Could not pin post! -- FIX THIS");
            }
            location.reload();
        }
    })
})

$("#unpinPostModal").on("show.bs.modal",(event)=>{
    var button = $(event.relatedTarget);
    var postId= getPostIdFromElement(button);
    $("#unpinPostButton").attr("data-id", postId);
})

$("#unpinPostButton").click((event)=>{
    var postId = $(event.target).data("id");
    $.ajax({
        url:`/api/posts/${postId}`,
        type: "PUT",
        data: { pinned:false},
        success: (data, status, xhr)=>{
            if(xhr.status !=204){
                alert("Could not unpin post! -- FIX THIS");
            }
            location.reload();
        }
    })
})

//handles when the profile photo is selected in the uploader
$("#filePhoto").change(function(){ 
    if(this.files&& this.files[0]){ 
        var reader = new FileReader();
        reader.onload = (e)=>{
            var image = document.getElementById('imagePreview');
            image.src = e.target.result;
            
           if(cropper !== undefined){
                cropper.destroy();
            }
            
            cropper = new Cropper(image,{
                aspectRatio: 1 / 1,
                background: false
            });
            
        }
        reader.readAsDataURL(this.files[0]);
    }
})

//handles when the cover photo is selected in the uploader
$("#coverPhoto").change(function(){ 
    if(this.files&& this.files[0]){ 
        var reader = new FileReader();
        reader.onload = (e)=>{
            var image = document.getElementById('coverImagePreview');
            image.src = e.target.result;
            
           if(cropper !== undefined){
                cropper.destroy();
            }
            
            cropper = new Cropper(image,{
                aspectRatio: 16 / 9,
                background: false
            });
            
        }
        reader.readAsDataURL(this.files[0]);
    }
})

//handles when save button is pressed on profile image modal, and sends it to database
$("#imageUploadButton").click(()=>{
    var canvas = cropper.getCroppedCanvas();
    if(canvas==null){
        alert("Could not upload image. Make sure it's an image file");
        return;
    }
    canvas.toBlob((blob)=>{
        var formData = new FormData();
        formData.append("croppedImage", blob);
        
        $.ajax({
            url: "/api/users/profilePicture",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: ()=>{ location.reload(); }
        })
    })
})

$("#coverPhotoUploadButton").click(()=>{
    var canvas = cropper.getCroppedCanvas();
    if(canvas==null){
        alert("Could not upload image. Make sure it's an image file");
        return;
    }
    canvas.toBlob((blob)=>{
        var formData = new FormData();
        formData.append("croppedImage", blob);
        
        $.ajax({
            url: "/api/users/coverPhoto",
            type: "POST",
            data: formData,
            processData: false,
            contentType: false,
            success: ()=>{ location.reload(); }
        })
    })
})

//Searches for users in messaging section
$("#userSearchTextBox").keydown((event)=>{
    clearTimeout(timer);
    let textbox=$(event.target);
    let value = textbox.val();
    if(value=="" && (event.which == 8 || event.keyCode == 8)){
        //remove user from selection
        selectedUsers.pop();
        updateSelectedUsersHtml();
        $(".resultsContainer").html("");

        if(selectedUsers.length==0){
            $("#createChatButton").prop("disabled", true);
        }
        return;
    }
    timer = setTimeout(() => {
        value= textbox.val().trim();
        if(value==""){
            $(".resultsContainer").html("");
        }else{
            searchUsers(value);
        }
    },1000);  
});

$("#createChatButton").click(()=>{
    let data = JSON.stringify(selectedUsers);
    $.post("/api/chats", {users:data}, chat=>{
        if(!chat || !chat._id) 
            return alert("Invalid Response from server - No chat created!");
        
        window.location.href=`/mesagges/${chat._id}`;
    });
})



function createPostHtml(postData, largeFont = false){
    
    if(postData==null) return alert("post object is null");
    
    var isRetweet = postData.retweetData !== undefined;
    
    var retweetedBy = isRetweet ? postData.postedBy.username : null;
    postData= isRetweet ? postData.retweetData:postData;

    var postedBy=postData.postedBy;
    if(postedBy._id===undefined){
        return console.log("User object not populated");
    }
    var displayName = postedBy.firstName+" "+ postedBy.lastName; //TODO add displaynames

    var timestamp = timeDifference(new Date(), new Date(postData.createdAt));
    var likeButtonActiveClass = postData.likes.includes(userLoggedIn._id) ? "active" :"";
    var retweetButtonActiveClass = postData.retweetUsers.includes(userLoggedIn._id) ? "active" :"";
    var largeFontClass = largeFont? "largeFont":"";
    var retweetText="";
    if(isRetweet){
        retweetText=`<span> <i class="fas fa-retweet"></i> Retweeted by <a href="/profile/${retweetedBy}">@${retweetedBy}</a></span>`
    }

    var replyFlag="";
    if(postData.replyTo && postData.replyTo._id){
        if(!postData.replyTo._id){
            return alert("replyTo is not populated");
        }
        else if(!postData.replyTo.postedBy._id){
            return alert("postedBy  is not populated");
        }
        var replyToUsername = postData.replyTo.postedBy.username;
        replyFlag=`<div class='replyFlag'>
                        Replying to <a href='/profile/${replyToUsername}'>@${replyToUsername}</a>
                    </div>`;
    }
    //Crea el boton para eliminar el post si el post en cuestión pertenece al usuario loggeado
    var buttons="";
    var pinnedPostText="";
    if(postData.postedBy._id == userLoggedIn._id){
        let pinnedClass="";
        let dataTarget="#pinPostModal"
        if(postData.pinned === true){
            pinnedClass="pinned";
            dataTarget="#unpinPostModal";
            pinnedPostText=`<i class='fas fa-thumbtack'></i> <span> Pinned Post</span>`;
        }
        buttons=`<button data-id="${postData._id}" data-toggle="modal" data-target="${dataTarget}" class="pinButton ${pinnedClass}"><i class="fas fa-thumbtack"></i></button>
        <button data-id="${postData._id}" data-toggle="modal" data-target="#deletePostModal"><i class="fas fa-times"></i></button>`;
    }

    return `<div class='post ${largeFontClass}' data-id='${postData._id}'>
                    <div class='postActionContainer'>
                        ${retweetText}
                    </div>
                    <div class='mainContentContainer'>
                    <div class='userImageContainer'>
                        <img src='${postedBy.profilePic}'>
                    </div>
                    <div class='postContentContainer'>
                        <div class="pinnedPostText">${pinnedPostText}</div>
                        <div class='postHeader'>
                            <a class='displayName' href='/profile/${postedBy.username}'>${displayName}</a>
                            <span class='username'>  ${postedBy.username}</span>
                            <span class='date'>${timestamp}</span>
                            ${buttons}
                        </div>
                        ${replyFlag}
                        <div class='postBody'>
                            <span>${postData.content}</span>
                        </div>
                        <div class='postFooter'>
                            <div class="postButtonContainer">
                                <button data-toggle="modal" data-target="#replyModal"><i class="far fa-comment-alt"></i></button>
                            </div>
                            <div class="postButtonContainer">
                                <button class="retweetButton green ${retweetButtonActiveClass}">
                                <i class="fas fa-retweet"></i>                                
                                <span>${postData.retweetUsers.length||""}</span>
                                </button>
                            </div>
                            <div class="postButtonContainer">
                                <button class="likeButton red ${likeButtonActiveClass}">
                                <i class="far fa-heart"></i>
                                <span>${postData.likes.length||""}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
}


function timeDifference(current, previous) {

    var msPerMinute = 60 * 1000;
    var msPerHour = msPerMinute * 60;
    var msPerDay = msPerHour * 24;
    var msPerMonth = msPerDay * 30;
    var msPerYear = msPerDay * 365;

    var elapsed = current - previous;

    if (elapsed < msPerMinute) {
        if(elapsed/100<30) 
            return "Just now";
        return Math.round(elapsed/1000) + ' seconds ago';   
    }

    else if (elapsed < msPerHour) {
         return Math.round(elapsed/msPerMinute) + ' minutes ago';   
    }

    else if (elapsed < msPerDay ) {
         return Math.round(elapsed/msPerHour ) + ' hours ago';   
    }

    else if (elapsed < msPerMonth) {
        return Math.round(elapsed/msPerDay) + ' days ago';   
    }

    else if (elapsed < msPerYear) {
        return Math.round(elapsed/msPerMonth) + ' months ago';   
    }

    else {
        return Math.round(elapsed/msPerYear ) + ' years ago';   
    }
}


function getPostIdFromElement(element){
    var isRoot=element.hasClass("post");
    var rootElement= isRoot ? element: element.closest(".post"); // Si el elemento es la raiz, devolver el elemento, si no buscar el más cercano con la clase Post
    var postId=rootElement.data().id;
    if (postId=== undefined) return alert("post id undefined");
    return postId;
}

function outputPosts(results, container){
    container.html("");
    if(!Array.isArray(results)){
        results=[results];
    }
    results.forEach(result=>{
        var html = createPostHtml(result);
        container.append(html);
    });
    if(results.lenth==0){
        container.append("<span class='No Results'>Nothing to Show</span>");
    }
}

function outputPostsWithReplies(results, container){
    container.html("");
    if(results.replyTo !== undefined && results.replyTo._id !== undefined){
        var html = createPostHtml(results.replyTo);
        container.append(html);
    }
    var mainPosthtml = createPostHtml(results.postData, true);
    container.append(mainPosthtml);

    results.replies.forEach(result=>{
        var html = createPostHtml(result);
        container.append(html);
    });
}


function outputUsers(results, container){
    container.html("");

    results.forEach(result=>{
        var html = createUserHtml(result, true);
        container.append(html);
    });

    if(results.length == 0){
        container.append("<span class='noResults'>No results found.</span>")
    }
}

function createUserHtml(userData,showFollowButton){

    var name = userData.firstName + " " + userData.lastName;
    var isFollowing = userLoggedIn.following &&userLoggedIn.following.includes(userData._id);
    var text = isFollowing ? "Following" : "Follow";
    var buttonClass = isFollowing ? "followButton following": "followButton";
    var followButton="";
    if(showFollowButton && userLoggedIn._is != userData._id)
    {
        followButton = `<div class="followButtonContainer">
                            <button class="${buttonClass}" data-user='${userData._id}'>${text}</button>
                        </div>`
    }

    return `<div class="user">
            <div class="userImageContainer">
                <img src="${userData.profilePic}">
            </div>
            <div class="userDetailsContainer">
                <div class="header">
                    <a href="/profile/${userData.username}">${name}</a>
                    <span class="username">@${userData.username}</span>
                </div>
            </div>
            ${followButton}
        </div>`;
}



//Functions related to message page search area
function searchUsers(searchTerm){
    $.get("/api/users", {search: searchTerm}, results=>{
        outputSelectableUsers(results, $(".resultsContainer"));
    })
}

function outputSelectableUsers(results, container){
    container.html("");
    results.forEach(result=>{
        if(result._id == userLoggedIn._id || selectedUsers.some((user) => user._id==result._id)){
            
            return;
        }
        let html = createUserHtml(result, false);
        let element=$(html)
        element.click(()=> userSelected(result));
        container.append(element);
    });

    if(results.length == 0){
        container.append("<span class='noResults'>No results found.</span>")
    }
}

function userSelected(user){
    selectedUsers.push(user);
    updateSelectedUsersHtml();
    $("#userSearchTextBox").val("").focus();
    $(".resultsContainer").html("");
    $("#createChatButton").prop("disabled",false);
}

function updateSelectedUsersHtml(){
    let elements=[];
    selectedUsers.forEach(user=>{
        let name= `${user.firstName} ${user.lastName}`;
        let userElement =$(`<span class="selectedUser"> ${name}</span>`)
        elements.push(userElement);
    })

    $(".selectedUser").remove();
    $("#selectedUsers").prepend(elements);
}

function getChatName(chatData){
    let chatName = chatData.chatName;
    if(!chatName){
        let otherUsers = getChatOtherUsers(chatData.users);
        let namesArray = otherUsers.map(user=> user.firstName + " " + user.lastName);
        chatName = namesArray.join(", ");
    }
    return chatName;
}

function getChatOtherUsers(users){
    if(users.length==1) return users;
    return users.filter(user => user._id != userLoggedIn._id)
}
