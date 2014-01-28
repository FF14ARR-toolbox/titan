this.Titan = function(settings) {
	this.settings = settings;
	for (var key in this.defaults) {
		if (typeof(this.settings[key]) == 'undefined') {
			this.settings[key] = this.defaults[key];
		}
	}
}

Titan.prototype = {

	defaults: {
		jsons: './jsons'
	},

	// 敵のアクションリスト
	actions: null,

	// 行動パターン
	patterns: null,

	// フェーズ設定
	pheses: null,

	// zynga jukeboxの設定
	zyngaSettings: null,

	// zynga jukebox player
	player: null,

	// removeEventListener用
	prevSoundEventListener: null,

	// 現在のフェーズ 0は停止
	phase: 0,

	// 現在のパターン位置
	pos: 0,

	// ループ回数
	loop: 1,

	// Action Timer
	actionTimer: null,

	// プログレスバーTimer
	progressBarTimer: null,

	// プログレスバーの進行度
	delay: 0,
	delayTo: 0,

	// プログレスバーアニメーションの細かさ
	progressInterval: 100,

	/*
	* データの読み込み
	*/
	__loadData: function() {
		var titan = this;

		// 同期モードでJSON読み込み
		$.ajaxSetup({async: false});
		$.getJSON(this.settings.jsons + "/actions.json", function(json) {
			titan.actions = json;
		});
		$.getJSON(this.settings.jsons + "/patterns.json", function(json){
			titan.patterns = json;
		});
		$.getJSON(this.settings.jsons + "/phases.json", function(json){
			titan.phases = json;
		});
		$.getJSON(this.settings.jsons + "/zynga.settings.json", function(json){
			titan.zyngaSettings = json;
		});
		$.ajaxSetup({async: true});
	},

	/*
	* SEの読み込み
	*/
	__loadSounds: function() {
		this.player = new jukebox.Player(this.zyngaSettings);
		this.player.context.addEventListener('canplay', function() {
			$('.sound-worning').hide();
			$('.sound-success').show();
		}, false);
	},

	/*
	* 現在のフェーズでカルーセルの書き換え
	* ただし0（停止状態）の時は1を描画する
	*/
	__refreshCarousel: function() {
		var refreshPhase = this.phase;
		if(refreshPhase == 0) {
			refreshPhase = 1;
		};

		var html = '';
		html += "<div class='owl-carousel'>";
		var pattern = this.patterns[refreshPhase - 1];
		for (var i = 0; i < pattern.length; i++) {
			var actionLabel = pattern[i]['action'];
			var action = this.actions[actionLabel];

			var display = "<p class='lead display-eng'>" + action['displayEng'] + "</p>";
			display += "<p class='display-jpn'>" + action['displayJpn'] + "</p>";
			var id = 'patternAction' + parseInt(i);
			var classname = "item " + action['class'];
			html += "<div class='" + classname + "' id='" + id + "'>" + display + "</div>";
		}
		html += '</div>';
		$("#owlCarousels").html(html);
		$(".owl-carousel").owlCarousel();
	},

	/*
	* フェーズ/ループ表示の更新
	*/
	__updatePhaseCountHolder: function() {
		var PhaseCount = this.phase;
		$(".phase-count-holder").text(PhaseCount);
		$(".loop-count-holder").text(this.loop);
	},

	/*
	* Nextボタンの表示を更新
	*/
	__updatePhaseNextButton: function() {
		$(".next-phase-count-holder").text(this.phases[this.phase]['nextPhase']);
		$(".next-phase-trigger-text").text(this.phases[this.phase]['text']);
	},

	/*
	* カレントカルーセルの強調
	*/
	__emphasizeCurrentCarousel: function() {
		var pattern = this.patterns[this.phase - 1];
		var previewPos = this.pos - 1;
		if(previewPos < 0) {
			previewPos = pattern.length - 1;
		}
		$('#patternAction' + this.pos).addClass('item-active');
		$('#patternAction' + previewPos).removeClass('item-active');
	},

	/*
	* プログレスバーアニメーションのセット
	*/
	__setProgressBar: function() {
		var titan = this;
		var pattern = this.patterns[this.phase - 1];

		this.delay = this.delayTo = pattern[this.pos]['delay'] * 1000;
		clearTimeout(this.progressBarTimer);
		this.progressBarTimer = setInterval(function() {
			var progress = Math.floor(titan.delayTo / titan.delay * 100);
			$('.progress-bar').css('width', progress + '%');
			titan.delayTo -= titan.progressInterval + 2;
			//var log = delayTo + " / " + delay +" * 100 = " + progress ;
			//console.log(log);
		}, titan.progressInterval);
	},

	/*
	* SEの再生
	*/
	__playSound: function() {
		var titan = this;

		var pattern = this.patterns[this.phase - 1];
		var actionLabel = pattern[this.pos]['action'];
		var action = this.actions[actionLabel];

		// iOS/mobile向けの対策
		// setCurrentTime()が遅延するので、前回のpause eventのタイミングで前もって仕込んでおく
		var nextPos = this.pos + 1;
		if (nextPos >= pattern.length) {
			nextPos = 0;
		}
		var next = this.actions[pattern[nextPos]['action']];
		var nextSoundStartPos = this.zyngaSettings['spritemap'][next['sound']]['start'];
		this.player.context.removeEventListener('pause', this.prevSoundEventListener, false);
		this.prevSoundEventListener = (function() {
			var p = nextPos;
			var n = nextSoundStartPos;
			return function() {
				if (titan.player.getCurrentTime() > n) {
					titan.player.setCurrentTime(n);
				}
			}
		})();
		this.player.context.addEventListener('pause', this.prevSoundEventListener, false);

		// 頭出しされていなければ頭出し
		var soundStartPos = this.zyngaSettings['spritemap'][action['sound']]['start'];
		if (this.player.getCurrentTime() > soundStartPos) {
			this.player.setCurrentTime(soundStartPos);
		}

		this.player.play(action['sound'], true);
	},

	/*
	* 現在の行動をセット
	*/
	__setAction: function() {
		if (this.phase == 0) {
			return;
		}

		// カルーセル位置を進める
		var owl = $(".owl-carousel").data('owlCarousel');
		owl.goTo(this.pos);

		this.__emphasizeCurrentCarousel();
		this.__setProgressBar();
		this.__playSound();

		// 次のアクションタイマーのセット
		var titan = this;
		var pattern = this.patterns[this.phase - 1];
		clearTimeout(this.actionTimer);
		this.actionTimer = setTimeout(function() {
			titan.nextAction();
		}, pattern[this.pos]['delay'] * 1000);
	},

	/*
	* 次の行動へ
	*/
	nextAction: function () {
		if (this.phase == 0) {
			return;
		}

		var pattern = this.patterns[this.phase - 1];

		this.pos ++;
		if (this.pos >= pattern.length) {
			this.pos = 0;
			this.loop ++;
			$(".loop-count-holder").text(this.loop);
		}
		this.__setAction();
	},

	/*
	* 指定したフェーズに移行する
	*/
	goToPhase: function(toPhase) {
		this.pos = 0;
		this.loop = 1;
		this.phase = toPhase;
		if (this.phase > this.patterns.length || this.phase < 0) {
			this.phase = 0;
		}

		if (this.phase == 0) {
			clearTimeout(this.actionTimer);
			clearTimeout(this.progressBarTimer);
			$('.progress').hide();
			$('.progress-bar').css('width', 100 + '%');
		} else {
			$('.progress').show();
		}

		this.__updatePhaseCountHolder();
		this.__updatePhaseNextButton();
		this.__refreshCarousel();
		this.__setAction();

		$('.sound-success').hide();
	},

	/*
	* 初期化
	*/
	init: function() {
		var titan = this;
		$(document).on('click', "button.phase-next", function() {
			var toPhase = titan.phases[titan.phase]['nextPhase'];
			titan.goToPhase(toPhase);
		});
		$(document).on('click', "button.phase-change", function() {
			var toPhase = $(this).attr('data-phase');
			titan.goToPhase(toPhase);
		});
		$(document).on('click', "button.phase-reset", function() {
			titan.goToPhase(0);
		});
		$(document).on('click', ".load-sound", function() {
			$(".load-sound").text('読み込み中...');
			titan.player.play('mute');
			titan.player.stop();
			return false;
		});

		// sound test buttons
		$(document).on('click', "button.play-sound", function() {
			var sound = $(this).attr('data-sound');
			var s = zyngaSettings['spritemap'][actions[sound]['sound']]['start'];
			se.setCurrentTime(s);
			se.play(sound,true);
		});

		this.__loadData();
		this.__loadSounds();
		this.__refreshCarousel();
		this.__updatePhaseNextButton();
	} 
}