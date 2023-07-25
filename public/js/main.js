(function($) {

	"use strict";

	var fullHeight = function() {

		$('.js-fullheight').css('height', $(window).height());
		$(window).resize(function(){
			$('.js-fullheight').css('height', $(window).height());
		});

	};
	fullHeight();

	$('#sidebarCollapse').on('click', function () {
      $('#sidebar').toggleClass('active');
  });

})(jQuery);


// -----------------------------   START MULTI-DYNAMIC CHAT APP --------------------

function getCookie(name) {
	let matches = document.cookie.match(new RegExp(
		"(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
	));
	return matches ? decodeURIComponent(matches[1]) : undefined;
}

var userData = JSON.parse(getCookie('user'));

const sender_id = userData._id;
var receiver_id;
var global_group_id;
var socket = io('/user-namespace',{
auth: {
	token : sender_id
}
});

$('document').ready(function(){
	$('.user-list').click(function(){
		$('.start-head').hide();
		$('.chat-section').show();
		var userId = $(this).attr('data-id');
		receiver_id = userId;
		
		socket.emit('existsChat',{sender_id:sender_id,receiver_id: receiver_id})
	})
});

// update user online status
socket.on('getOnlineUser',function(data){
$('#'+data.user_id+'-status').text('Online');
$('#'+data.user_id+'-status').removeClass('offline-status');
$('#'+data.user_id+'-status').addClass('online-status');
})

// update user offline status
socket.on('getOfflineUser',function(data){
$('#'+data.user_id+'-status').text('Offline');
$('#'+data.user_id+'-status').removeClass('online-status');
$('#'+data.user_id+'-status').addClass('offline-status');
})

// save chat of user
$('#chat-form').submit(function(event){
event.preventDefault();
const message = $('#message').val();
console.log(message);

$.ajax({
	url: '/save-chat',
	type: 'POST',
	data : {
	sender_id: sender_id,
	receiver_id: receiver_id,
	message: message
	},
	success: function(response){
	if(response.success){
		$('#message').val('');
		let chat = response.data.message;
		let html = `
		<div class="current-user-chat" id="`+response.data._id+`">
			<h5>`+chat+`
			<i class="fa fa-trash-o" id="fa-trash" aria-hidden="true" data-id='`+response.data._id+`' data-toggle="modal" data-target="#deleteChatModal"></i>
			</h5>
		</div>
		`
		$('#chat-container').append(html);
		scrollChat();
		socket.emit('newChat',response.data);
	}else{
		alert(data.msg);
	}
	}
})
});

socket.on('loadNewChat',function(data){
if(sender_id == data.receiver_id && receiver_id == data.sender_id){
	let html = `
		<div class="distance-user-chat" id="`+data._id+`">
			<h5>`+data.message+`</h5>
		</div>
`
$('#chat-container').append(html);
scrollChat();
}

});

// load old chats
socket.on('loadChats',function(data){
$('#chat-container').html('');

var chats = data.chats;

let html = '';

for(let x=0;x<chats.length;x++){
	let addClass = '';
	if(chats[x]['sender_id']==sender_id){
	addClass = 'current-user-chat';
	}else{
	addClass = 'distance-user-chat';
	}

	html += `
	<div class='`+addClass+`' id='`+chats[x]['_id']+`'>
		<h5>`+chats[x]['message']+``;
		if(chats[x]['sender_id']==sender_id){
			html += `
			<i class="fa fa-trash-o" id="fa-trash" aria-hidden="true" data-id='`+chats[x]['_id']+`' data-toggle="modal" data-target="#deleteChatModal"></i>`;
		}
	html += `
		</h5>
	</div>
	`
}

$('#chat-container').append(html);
scrollChat();
})

function scrollChat(){
$('#chat-container').animate({
	scrollTop: $('#chat-container').offset().top + $('#chat-container')[0].scrollHeight
},0)
}

// delete chat work
$(document).on('click','#fa-trash',function(){
let msg = $(this).parent().text();
console.log(msg);
$('#delete-message').text(msg);
$('#delete-message-id').val($(this).attr('data-id'));
});

$('#delete-chat-form').submit(function(event){
event.preventDefault();
var id = $('#delete-message-id').val();

$.ajax({
	url: '/delete-chat',
	type: 'POST',
	data: { id:id },
	success: function(res){
	if(res.success == true){
		$('#'+id).remove();
		$('#deleteChatModal').modal('hide'); 
		socket.emit('chatDeleted',id);
	}else{
		alert(res.msg);
	}
	}
});
});

socket.on('chatMessageDeleted',function(id){
	$('#'+id).remove();
});

// add memmber js
$('.addMember').click(function(){
	var id = $(this).attr('data-id');
	$('#group_id').val(id);

	$.ajax({
		url:'/get-members',
		type:'post',
		data: {group_id : id},
		success: function(res){
			console.log(res);
			if(res.success == true){
				let users = res.data;
				let html = '';
				for(let i=0;i<users.length;i++){

				// 	let isMemberOfGroup = users[i]['member'].length > 0 ? true:false;

					html += `
						<tr>
							<td>
								<input type="checkbox" name="members[]" value="`+users[i]['_id']+`" />
							</td>
							<td>
							`+users[i]['name']+`
							</td>
						</tr>
					`
				}

				$('.addMembersInTable').html(html);

			}else{
				console.log("error in get members route ");
				alert(res.msg);
			}
		}
	})
});


// add member form submit
$('#add-member-form').submit(function(event){
	event.preventDefault();

	var formData = $(this).serialize();

	$.ajax({
		url: "/add-members",
		type: "POST",
		data: formData,
		success: function(res){
			if(res.success == true){
				$('#memberModal').modal('hide');
				$('#add-member-form')[0].reset();
				alert(res.msg);
			}else{
				$('#add-member-error').text(res.msg);
				setTimeout(()=>{
					$('#add-member-error').text('');
				},3000)
			}
		}
	});
});


// --------------------------- Group chatting Script ------------------------------------

function scrollGroupChat(){
	$('#group-chat-container').animate({
		scrollTop: $('#group-chat-container').offset().top + $('#group-chat-container')[0].scrollHeight
	},0)
};

$('.group-list').click(function(){
	$('.group-start-head').hide();
	$('.group-chat-section').show();

	global_group_id = $(this).attr('data-id');

	loadGroupChats();

});

// save chat of user
$('#group-chat-form').submit(function(event){
	event.preventDefault();
	const message = $('#group-message').val();
	console.log(message);
	
	$.ajax({
		url: '/group-chat-save',
		type: 'POST',
		data : {
		sender_id: sender_id,
		group_id: global_group_id,
		message: message
		},
		success: function(response){
		if(response.success){
			$('#group-message').val('');
			let message = response.chat.message;
			
			let html = `
			<div class="current-user-chat" id="`+response.chat._id+`">
				<h5>`+message+`
				<i class="fa fa-trash-o" id="fa-trash" aria-hidden="true" data-id='`+response.chat._id+`' data-toggle="modal" data-target="#deleteGroupChatModal"></i>
				</h5>`;
			
				var date = new Date(response.chat.createdAt);
				let cDate = date.getDate(date);
				let cMonth = (date.getMonth(date)+1) > 9 ? (date.getMonth(date)+1): '0'+(date.getMonth(date)+1);
				let cYear = date.getFullYear(date);
				let getFullDate = cDate + '-' + cMonth + '-' + cYear;

			html += `
			<div class="user-data"><b> Me </b> `+getFullDate+`  </div>
			</div>
			`
			$('#group-chat-container').append(html);
			socket.emit('newGroupChat',response.chat);

			scrollGroupChat();
			
		}else{
			alert(data.msg);
		}
		}
	})
	});

socket.on('loadNewGroupChat',function(data){
	if(global_group_id == data.group_id){
		let html = `
			<div class="distance-user-chat" id="`+data._id+`">
				<h5>`+data.message+`
				</h5>`;

				var date = new Date(data.createdAt);
				let cDate = date.getDate(date);
				let cMonth = (date.getMonth(date)+1) > 9 ? (date.getMonth(date)+1): '0'+(date.getMonth(date)+1);
				let cYear = date.getFullYear(date);
				let getFullDate = cDate + '-' + cMonth + '-' + cYear;

			html += `	
				<div class="user-data">
					<img src="`+data.sender_id.image+`" class="user-chat-image" />
					<b> `+data.sender_id.name+` </b> `+getFullDate+`  
				</div>		
				</div>
			`
		$('#group-chat-container').append(html);
		scrollGroupChat();
	}
	

});


function loadGroupChats(){
	$.ajax({
		url: "/load-group-chats",
		type: "post",
		data: {
			group_id : global_group_id
		},
		success: function(res){
			if(res.success == true){
				var chats = res.chats;
				var html = "";

				for(let i=0; i<chats.length; i++){
					let className = 'distance-user-chat';

					if(chats[i]['sender_id']._id == sender_id){
						className = 'current-user-chat';
					}
					
					html += `
					<div class="`+className+`" id="`+chats[i]['_id']+`">
						<h5> `+chats[i]['message']+`   `
					if(chats[i]['sender_id']._id == sender_id){
						html += `<i class="fa fa-trash-o" id="fa-trash" aria-hidden="true" data-id='`+chats[i]['_id']+`' data-toggle="modal" data-target="#deleteGroupChatModal"></i>`
					}
						
					html +=	`</h5>`;
					var date = new Date(chats[i]['createdAt']);
					let cDate = date.getDate(date);
					let cMonth = (date.getMonth(date)+1) > 9 ? (date.getMonth(date)+1): '0'+(date.getMonth(date)+1);
					let cYear = date.getFullYear(date);
					let getFullDate = cDate + '-' + cMonth + '-' + cYear;

					if(chats[i]['sender_id']._id == sender_id){
						html += `
							<div class="user-data"><b> Me </b> `+getFullDate+`  </div>
						`
					}else{
						html += `
							
							<div class="user-data">
								<img src="`+chats[i]['sender_id'].image+`" class="user-chat-image" />
								<b> `+chats[i]['sender_id'].name+` </b> `+getFullDate+`  
							</div>
						`
					}

					html += `
					</div>
						`

					$('#group-chat-container').html(html);
					scrollGroupChat();
				}

			}else{
				alert(res.msg);
			}
		}
	});
};

$(document).on('click','.deleteGroupChat',function(){
	var msg = $(this).parent().text();
	console.log(msg);

	$('#delete-group-message').text(msg);
	$('#delete-group-message-id').val($(this).attr('data-id'));

});

$('#delete-group-chat-form').submit(function(e){
	e.preventDefault();

	var id = $('#delete-group-message-id').val();

	$.ajax({
		url: '/delete-group-chat',
		type: 'post',
		data: {id : id},
		success: function(res){
			if(res.success){
				$('#'+id).remove();
				$('#deleteGroupChatModal').modal('hide');
				socket.emit('groupChatDeleted',id);

			}else{
				alert(res.msg);
			}
		}
	})
});

socket.on('groupChatMessageDeleted',function(id){
	$('#'+id).remove();

})