;(function($, undefined) {
	"use strict";
 
	$.titan = function(options) {
		// 敵のアクションリスト
		var actions;

		// 行動パターン
		var patterns;

		// フェーズ設定
		var settings;

		// zynga jukeboxの設定
		var zyngaSettings;

		// zynga jukebox player
		var se;
		var soundTimer;

		// 現在のフェーズ 0は停止
		var phase = 0;

		// 現在のパターン位置
		var pos = 0;

		// ループ回数
		var loop = 1;

		// Action Timer
		var actionTimer;

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
		function loadData() {
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
			$.getJSON(options.jsons + "/zynga.json", function(json){
				zyngaSettings = json;
			});
			$.ajaxSetup({async: true});

			loadSounds();
		}

		/*
		* SEの読み込み
		*/
		function loadSounds() {
			se = new jukebox.Player(zyngaSettings);
			se.context.addEventListener('canplay', function() {
				$('.sound-worning').hide();
				$('.sound-success').show();
			}, false);
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
				clearTimeout(progressBarTimer);
				$('.progress').hide();
				$('.progress-bar').css('width', 100 + '%');
			} else {
				$('.progress').show();
			}

			updatePhaseCountHolder();
			updatePhaseNextButton();
			refreshCarousel();
			setAction();

			$('.sound-success').hide();
		}
var f;
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

			// iOSでplay()時に頭出しがおかしいので再生終了時に次の再生位置を手動でセットしておく
			//$('.infomation').text('');
			

			var nextPos = pos + 1;
			if (nextPos >= pattern.length) {
				nextPos = 0;
			}
			var next = actions[pattern[nextPos]['action']];
			var nextSoundStartPos = zyngaSettings['spritemap'][next['sound']]['start'];
			console.log('===========');
			se.context.removeEventListener('pause', f, false);
			f = (function() {
	            var p = nextPos;
	            var n = nextSoundStartPos;
	            return function() {
	            	console.log('next: ' + p + ' / ' + n);
					if (se.getCurrentTime() > n) {
						//$('.infomation').append('next: ' + p + '/' + n);
						se.setCurrentTime(n);
					}
	            }
	        })();

	        var ss = (function() {
	            var p = nextPos;
	            var n = nextSoundStartPos;
	            return function() {
	            	//console.log(n);
					var log = se.getCurrentTime() + ' => ' + n;
					$('.infomation').text(log);
	            }
	        })();
	        setInterval(ss, 100);

			se.context.addEventListener('pause', f, false);

			// 頭出しされていなければ頭出し
			var soundStartPos = zyngaSettings['spritemap'][action['sound']]['start'];
			if (se.getCurrentTime() > soundStartPos) {
				se.setCurrentTime(soundStartPos);
				$('.infomation').text('current: ' + pos + '/' + soundStartPos);
			}

			// SE鳴らす
			se.play(action['sound'], true);

			// 次のアクションタイマーのセット
			clearTimeout(actionTimer);
			actionTimer = setTimeout(function() {
				nextAction();
			}, pattern[pos]['delay'] * 1000);

			// カレントパネルの強調
			var previewPos = pos - 1;
			if(previewPos < 0) {
				previewPos = pattern.length - 1;
			}
			$('#patternAction' + pos).addClass('item-active');
			$('#patternAction' + previewPos).removeClass('item-active');

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

		$(document).on('click', ".load-sound", function() {
			$(".load-sound").text('読み込み中...');
			se.play('mute');
			se.stop();
			return false;
		});

		$(document).on('click', "button.play-sound", function() {
			var sound = $(this).attr('data-sound');
			console.log(se.context);
			var s=zyngaSettings['spritemap'][actions[sound]['sound']]['start'];
			console.log(s);
			se.setCurrentTime(s);
			se.play(sound,true);
		});

		loadData();
		refreshCarousel();
		updatePhaseNextButton();

		return this;
	};
})(jQuery);