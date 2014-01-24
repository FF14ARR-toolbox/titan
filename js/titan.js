// 現在のフェーズ 0は停止
var phase = 0;

// 現在のパターン位置 0〜length
var pos = 0;

// json
var actions = null;
var patterns = null;
var triggers = null;

var timer = null;
var progressTimer = null;

var delay = 0;
var delayTo = 0;
var progressInterval = 100;

function nextAction(__phase) {
	var pattern = patterns[__phase - 1];
	var action = actions[pattern[pos]['action']];

	// カルーセル位置を進める
	var owl = $(".owl-carousel").data('owlCarousel');
	owl.goTo(pos);

	// SE鳴らす
	$(action['sound']).get(0).play();

	// 次のアクションタイマーのセット
	if (phase > 0) {
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout("nextAction(" + __phase + ")", pattern[pos]['delay'] * 1000);
	}

	// カレントカルーセル明滅エフェクトのセット
	setInterval(function(){
		$('#patternAction' + pos).fadeOut(500, function(){ $(this).fadeIn(500) });
	}, 1000);

	// プログレスバーアニメーションのセット
	if (progressTimer) {
		clearTimeout(progressTimer);
	}
	delay = delayTo = pattern[pos]['delay'] * 1000;
	progressTimer = setInterval(function() {
		var progress = Math.floor(delayTo / delay * 100);
		$('.progress-bar').css('width', progress + '%')
		delayTo -= progressInterval + 2;
		var log = delayTo + " / " + delay +" * 100 = " + progress ;
		//console.log(log);
	}, progressInterval);

	console.log(pos);
	console.log(pattern[pos]);
	
	pos ++;
	if (pos >= pattern.length) {
		pos = 0;
	}
}

function refreshCarousel(__phase) {
	var html = '';
	html += "<div class='owl-carousel'>";
	var pattern = patterns[__phase - 1];
	for (var i = 0; i < pattern.length; i++) {
		var actionLabel = pattern[i]['action'];
		var action = actions[actionLabel];

		var display = "<p class='lead display-eng'>" + action['displayEng'] + "</p>";
		display += "<p class='display-jpn'>" + action['displayJpn'] + "</p>";
		var id = 'patternAction' + parseInt(i + 1);
		var classname = "item " + action['class'];
		html += "<div class='" + classname + "' id='" + id + "'>" + display + "</div>";
	}
	html += '</div>';
	$("#owlCarousels").html(html);
	$(".owl-carousel").owlCarousel();
}

$(document).ready(function() {
	// 同期モードでJSON読み込み
	$.ajaxSetup({async: false});
	$.getJSON("/json/titan_extream/actions.json", function(json) {
		actions = json;
	});
	$.getJSON("/json/titan_extream/patterns.json", function(json){
		patterns = json;
	});
	$.getJSON("/json/titan_extream/triggers.json", function(json){
		triggers = json;
	});
	$.ajaxSetup({async: true});

	refreshCarousel(1);
	$(document).on('click', "button.phase-change", function() {
		var nextPhase = $(this).attr('data-phase');
		if (phase == 0 || phase != nextPhase) {
			refreshCarousel(nextPhase);
			phase = parseInt(nextPhase);
			pos = 0;
			$(".phase-info").html("Phase: " + phase);
			nextAction(nextPhase);
		}
	});
	$(document).on('click', "button.phase-reset", function() {
		if (phase > 0) {
			if (timer) {
				clearTimeout(timer);
			}
			timer = null;
			phase = 0;
			refreshCarousel(1);
			$(".phase-info").html("Phase: Stop");
		}
	});
	$("#volumeControll").noUiSlider({
		range: [0, 100],
		start: 100,
		handles: 1,
		connect: "lower",
		//orientation: "vertical",
		serialization: {
			resolution: 1
		},
		slide: function() {
			var slideVal = $(this).val();
			$('audio').each(function() {
				var volume = slideVal / 100;
				$(this).get(0).volume = volume;
			});
		}
	});
});