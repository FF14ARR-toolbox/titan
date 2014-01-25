;(function($, undefined) {
	"use strict";
 
	$.titan = function(options) {
		// 敵のアクションリスト
		var actions;

		// 行動パターン
		var patterns;

		// フェーズ設定
		var settings;

		// 現在のフェーズ 0は停止
		var phase = 0;

		// 現在のパターン位置
		var pos = 0;

		// ループ回数
		var loop = 1;

		// Action Timer
		var actionTimer;

		// カルーセルエフェクトTimer
		var effectTimer;

		// プログレスバーTimer
		var progressBarTimer;

		// プログレスバーの進行度
		var delay;
		var delayTo;

		// プログレスバーアニメーションの細かさ
		var progressInterval = 100;

		// オプションの初期化
		options = $.extend({
			jsons: ''
		}, options);
 
		/*
		* データの読み込み
		*/
		function loadJsons() {
			// 同期モードでJSON読み込み
			$.ajaxSetup({async: false});
			$.getJSON(options.jsons + "/actions.json", function(json) {
				actions = json;
			});
			$.getJSON(options.jsons + "/patterns.json", function(json){
				patterns = json;
			});
			$.getJSON(options.jsons + "/settings.json", function(json){
				settings = json;
			});
			$.ajaxSetup({async: true});
		}

		/*
		* 現在のフェーズでカルーセルの書き換え
		* ただし0（停止状態）の時は1を描画する
		*/
		function refreshCarousel() {
			var refreshPhase = phase;
			if (refreshPhase == 0) {
				refreshPhase = 1;
			};

			var html = '';
			html += "<div class='owl-carousel'>";
			var pattern = patterns[refreshPhase - 1];
			for (var i = 0; i < pattern.length; i++) {
				var actionLabel = pattern[i]['action'];
				var action = actions[actionLabel];

				var display = "<p class='lead display-eng'>" + action['displayEng'] + "</p>";
				display += "<p class='display-jpn'>" + action['displayJpn'] + "</p>";
				var id = 'patternAction' + parseInt(i);
				var classname = "item " + action['class'];
				html += "<div class='" + classname + "' id='" + id + "'>" + display + "</div>";
			}
			html += '</div>';
			$("#owlCarousels").html(html);
			$(".owl-carousel").owlCarousel();
		}

		/*
		* フェーズ/ループ表示の更新
		*/
		function updatePhaseCountHolder() {
			var PhaseCount = phase;
			$(".phase-count-holder").text(PhaseCount);
			$(".loop-count-holder").text(loop);
		}

		/*
		* Nextボタンの表示を更新
		*/
		function updatePhaseNextButton() {
			if (settings[phase]['nextPhase'] == 0) {
				$(".next-phase-infomation").hide();
			} else {
				$(".next-phase-infomation").show();
			}
			$(".next-phase-count-holder").text(settings[phase]['nextPhase']);
			$(".next-phase-trigger-text").text(settings[phase]['text']);
		}

		/*
		* 指定したフェーズに移行する
		*/
		function goToPhase(toPhase) {
			pos = 0;
			loop = 1;
			phase = toPhase;
			if (phase > patterns.length || phase < 0) {
				phase = 0;
			}

			if (phase == 0) {
				clearTimeout(actionTimer);
				clearTimeout(effectTimer);
				clearTimeout(progressBarTimer);
				$('.progress-bar').css('width', 100 + '%')
			}

			updatePhaseCountHolder();
			updatePhaseNextButton();
			refreshCarousel();
			setAction();
		}

		/*
		* 現在の行動をセット
		*/
		function setAction() {
			if (phase == 0) {
				return;
			}

			var pattern = patterns[phase - 1];
			var actionLabel = pattern[pos]['action'];
			var action = actions[actionLabel];

			// カルーセル位置を進める
			var owl = $(".owl-carousel").data('owlCarousel');
			owl.goTo(pos);

			// SE鳴らす
			$(action['sound']).get(0).play();

			// 次のアクションタイマーのセット
			clearTimeout(actionTimer);
			actionTimer = setTimeout(function(){
				nextAction();
			}, pattern[pos]['delay'] * 1000);

			// カレントカルーセル明滅エフェクトのセット
			clearTimeout(effectTimer);
			effectTimer = setInterval(function(){
				$('#patternAction' + pos).fadeOut(500, function(){ $(this).fadeIn(500) });
			}, 1000);

			// プログレスバーアニメーションのセット
			delay = delayTo = pattern[pos]['delay'] * 1000;
			clearTimeout(progressBarTimer);
			progressBarTimer = setInterval(function() {
				var progress = Math.floor(delayTo / delay * 100);
				$('.progress-bar').css('width', progress + '%')
				delayTo -= progressInterval + 2;
				//var log = delayTo + " / " + delay +" * 100 = " + progress ;
				//console.log(log);
			}, progressInterval);
		}

		/*
		* 次の行動へ
		*/
		function nextAction() {
			if (phase == 0) {
				return;
			}

			var pattern = patterns[phase - 1];

			pos ++;
			if (pos >= pattern.length) {
				pos = 0;
				loop ++;
				$(".loop-count-holder").text(loop);
			}
			setAction();
		}

		$(document).on('click', "button.phase-next", function() {
			var toPhase = settings[phase]['nextPhase'];
			goToPhase(toPhase);
		});
		$(document).on('click', "button.phase-change", function() {
			var toPhase = $(this).attr('data-phase');
			goToPhase(toPhase);
		});
		$(document).on('click', "button.phase-reset", function() {
			goToPhase(0);
		});
 
		loadJsons();
		refreshCarousel();
		updatePhaseNextButton();

		return this;
	};
})(jQuery);